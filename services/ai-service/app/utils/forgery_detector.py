"""
forgery_detector.py
───────────────────
Implements multiple image-forensics techniques to detect document tampering.

Techniques
──────────
1. ELA  (Error Level Analysis)
   Re-compress the image at a known quality and measure pixel-level
   differences. Tampered regions show higher error than authentic ones.

2. Copy-Move Detection
   Use SIFT keypoints + FLANN matching to find duplicated regions
   within the same image — a classic Photoshop copy-paste artefact.

3. Noise Inconsistency
   Estimate per-block noise standard deviation. Authentic scans have
   uniform noise; spliced regions have a different noise profile.

4. Blur Inconsistency
   Compute Laplacian variance per block. Inconsistent blur across
   regions suggests compositing from different sources.

5. Edge Inconsistency
   Analyse the gradient magnitude histogram per region. Spliced text
   or logos often have unnaturally sharp or soft edges.

6. Color / Illumination Inconsistency
   Divide the image into blocks and compare mean LAB colour.
   Pasted regions often have a different white-balance or tone.

7. Compression Artifact Analysis
   Detect double-JPEG compression by looking for 8×8 DCT block
   boundary artefacts in the luminance channel.

Each technique returns a sub-score (0.0 = clean, 1.0 = highly suspicious)
and a human-readable reason string.

The final authenticity_score is 1.0 − weighted_sum_of_sub_scores,
clamped to [0, 1].
"""

import io
import cv2
import numpy as np
from PIL import Image
from skimage.util import view_as_blocks
from app.config import (
    ELA_THRESHOLD,
    NOISE_STD_THRESHOLD,
    COPY_MOVE_MIN_MATCHES,
    BLUR_THRESHOLD,
    WEIGHT_ELA,
    WEIGHT_NOISE,
    WEIGHT_COPY_MOVE,
    WEIGHT_BLUR,
    WEIGHT_EDGE,
    WEIGHT_COLOR,
)


# ── Public API ────────────────────────────────────────────────────────────────

def detect_forgery(preprocessed: dict) -> dict:
    """
    Parameters
    ----------
    preprocessed : dict returned by image_preprocessor.preprocess()
        Keys: original, processed, gray, edges, deskew_angle

    Returns
    -------
    {
        "authenticity_score" : float  (0–100, higher = more authentic),
        "possible_forgery"   : bool,
        "techniques"         : { technique_name: { score, reason, details } },
        "reasons"            : [str]   (human-readable summary of flags)
    }
    """
    img   = preprocessed["processed"]
    gray  = preprocessed["gray"]
    edges = preprocessed["edges"]

    results = {}

    results["ela"]              = _ela_analysis(img)
    results["copy_move"]        = _copy_move_detection(gray)
    results["noise"]            = _noise_inconsistency(gray)
    results["blur"]             = _blur_inconsistency(gray)
    results["edge"]             = _edge_inconsistency(edges)
    results["color"]            = _color_inconsistency(img)
    results["compression"]      = _compression_artifacts(gray)

    # ── Weighted authenticity score ───────────────────────────────────────────
    weights = {
        "ela":         WEIGHT_ELA,
        "noise":       WEIGHT_NOISE,
        "copy_move":   WEIGHT_COPY_MOVE,
        "blur":        WEIGHT_BLUR,
        "edge":        WEIGHT_EDGE,
        "color":       WEIGHT_COLOR,
        "compression": 0.0,   # informational only — not in weighted sum
    }

    # Repeated logos, panels, portraits, and QR regions are normal in identity
    # documents. Keep those findings visible, but reduce their scoring impact
    # unless ELA independently suggests editing.
    structured_layout = _looks_like_structured_document(gray)
    if structured_layout and results["ela"]["score"] < 0.25:
        weights["copy_move"] *= 0.25
        weights["noise"] *= 0.50
        weights["blur"] *= 0.60
        weights["edge"] *= 0.60

    weighted_suspicion = sum(
        results[k]["score"] * w
        for k, w in weights.items()
        if k in results
    )
    authenticity_score = round(max(0.0, min(100.0, (1.0 - weighted_suspicion) * 100)), 2)

    reasons = [r["reason"] for r in results.values() if r["score"] > 0.4]
    possible_forgery = authenticity_score < 60.0

    return {
        "authenticity_score": authenticity_score,
        "structured_document_layout": structured_layout,
        "possible_forgery":   possible_forgery,
        "techniques":         {k: {
                                    "score":   round(v["score"], 4),
                                    "reason":  v["reason"],
                                    "details": v.get("details", {}),
                               } for k, v in results.items()},
        "reasons": reasons,
    }


def _looks_like_structured_document(gray: np.ndarray) -> bool:
    """Detect form/card layouts where repeated visual elements are expected."""
    height, width = gray.shape[:2]
    if width < 600 or height < 400:
        return False

    edges = cv2.Canny(gray, 50, 150)
    horizontal = cv2.morphologyEx(
        edges,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (max(20, width // 12), 1)),
    )
    vertical = cv2.morphologyEx(
        edges,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(20, height // 12))),
    )
    line_ratio = (
        float(np.count_nonzero(horizontal)) +
        float(np.count_nonzero(vertical))
    ) / (width * height)
    return line_ratio > 0.0015


# ── Technique 1: ELA ─────────────────────────────────────────────────────────

def _ela_analysis(img: np.ndarray, quality: int = 90) -> dict:
    """
    Save the image at a fixed JPEG quality, reload it, and compute
    the absolute pixel difference (Error Level Analysis).
    High-error regions indicate possible tampering.
    """
    pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf).convert("RGB")

    orig_arr = np.array(pil_img).astype(np.float32)
    recomp_arr = np.array(recompressed).astype(np.float32)

    ela_map  = np.abs(orig_arr - recomp_arr)
    mean_err = float(ela_map.mean())
    max_err  = float(ela_map.max())

    # Normalise: ELA_THRESHOLD is the "suspicious" mean error level
    score  = min(1.0, mean_err / (ELA_THRESHOLD * 2))
    reason = (f"ELA mean error {mean_err:.2f} (threshold {ELA_THRESHOLD}) — "
              + ("suspicious high error level" if score > 0.4 else "within normal range"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"mean_error": round(mean_err, 4), "max_error": round(max_err, 4)},
    }


# ── Technique 2: Copy-Move ────────────────────────────────────────────────────

def _copy_move_detection(gray: np.ndarray) -> dict:
    """
    SIFT keypoint detection + FLANN-based matching within the same image.
    A high number of self-matches with geometric consistency indicates
    a copy-move forgery.
    """
    sift = cv2.SIFT_create(nfeatures=500)
    kp, des = sift.detectAndCompute(gray, None)

    if des is None or len(kp) < 10:
        return {"score": 0.0, "reason": "Too few keypoints for copy-move analysis",
                "details": {"keypoints": len(kp) if kp else 0}}

    # FLANN parameters for SIFT (float descriptors)
    index_params  = {"algorithm": 1, "trees": 5}   # FLANN_INDEX_KDTREE
    search_params = {"checks": 50}
    flann = cv2.FlannBasedMatcher(index_params, search_params)

    matches = flann.knnMatch(des, des, k=3)

    # Filter: keep matches where the 2nd-best match is NOT the point itself
    good_matches = []
    for m_list in matches:
        # m_list[0] is always self-match (distance ≈ 0) — skip it
        if len(m_list) < 3:
            continue
        m, n = m_list[1], m_list[2]
        if m.distance < 0.7 * n.distance:
            # Ensure the matched keypoints are spatially separated
            pt1 = np.array(kp[m.queryIdx].pt)
            pt2 = np.array(kp[m.trainIdx].pt)
            if np.linalg.norm(pt1 - pt2) > 20:
                good_matches.append(m)

    count = len(good_matches)
    score = min(1.0, count / (COPY_MOVE_MIN_MATCHES * 3))
    reason = (f"Copy-move: {count} suspicious self-matches found "
              + ("— possible duplicated region" if count >= COPY_MOVE_MIN_MATCHES
                 else "— within normal range"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"suspicious_matches": count, "threshold": COPY_MOVE_MIN_MATCHES},
    }


# ── Technique 3: Noise Inconsistency ─────────────────────────────────────────

def _noise_inconsistency(gray: np.ndarray, block_size: int = 64) -> dict:
    """
    Divide the image into blocks and compute the noise std-dev per block
    using a high-pass filter residual. Authentic documents have uniform
    noise; spliced regions stand out.
    """
    # High-pass residual (image minus Gaussian blur ≈ noise)
    blurred  = cv2.GaussianBlur(gray.astype(np.float32), (5, 5), 0)
    residual = gray.astype(np.float32) - blurred

    h, w = residual.shape
    bh   = h // block_size
    bw   = w // block_size

    if bh < 2 or bw < 2:
        return {"score": 0.0, "reason": "Image too small for noise analysis",
                "details": {}}

    crop     = residual[:bh * block_size, :bw * block_size]
    blocks   = view_as_blocks(crop, (block_size, block_size))
    stds     = np.array([[blocks[i, j].std() for j in range(bw)] for i in range(bh)])

    global_std = float(stds.std())
    mean_std   = float(stds.mean())

    score  = min(1.0, global_std / NOISE_STD_THRESHOLD)
    reason = (f"Noise std-dev across blocks: {global_std:.2f} "
              f"(mean block noise: {mean_std:.2f}) — "
              + ("inconsistent noise profile detected" if score > 0.4
                 else "noise is consistent"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"global_std": round(global_std, 4), "mean_block_noise": round(mean_std, 4)},
    }


# ── Technique 4: Blur Inconsistency ──────────────────────────────────────────

def _blur_inconsistency(gray: np.ndarray, block_size: int = 128) -> dict:
    """
    Laplacian variance per block. Authentic documents have consistent
    focus; composited images often have blocks with very different sharpness.
    """
    h, w = gray.shape
    bh   = h // block_size
    bw   = w // block_size

    if bh < 2 or bw < 2:
        return {"score": 0.0, "reason": "Image too small for blur analysis",
                "details": {}}

    variances = []
    for i in range(bh):
        for j in range(bw):
            block = gray[i*block_size:(i+1)*block_size,
                         j*block_size:(j+1)*block_size]
            lap_var = float(cv2.Laplacian(block, cv2.CV_64F).var())
            variances.append(lap_var)

    variances  = np.array(variances)
    mean_var   = float(variances.mean())
    std_var    = float(variances.std())
    cv_blur    = std_var / (mean_var + 1e-6)   # coefficient of variation

    # High CV means some blocks are sharp and others are blurry — suspicious
    score  = min(1.0, cv_blur / 2.0)
    reason = (f"Blur CV: {cv_blur:.3f}, mean Laplacian var: {mean_var:.1f} — "
              + ("inconsistent blur across regions" if score > 0.4
                 else "blur is consistent"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"mean_laplacian_var": round(mean_var, 2),
                    "blur_cv": round(cv_blur, 4)},
    }


# ── Technique 5: Edge Inconsistency ──────────────────────────────────────────

def _edge_inconsistency(edges: np.ndarray, block_size: int = 128) -> dict:
    """
    Compare edge density per block. Pasted text/logos often have
    unnaturally high or low edge density compared to surrounding regions.
    """
    h, w = edges.shape
    bh   = h // block_size
    bw   = w // block_size

    if bh < 2 or bw < 2:
        return {"score": 0.0, "reason": "Image too small for edge analysis",
                "details": {}}

    densities = []
    for i in range(bh):
        for j in range(bw):
            block   = edges[i*block_size:(i+1)*block_size,
                            j*block_size:(j+1)*block_size]
            density = float(block.mean()) / 255.0
            densities.append(density)

    densities = np.array(densities)
    cv_edge   = float(densities.std() / (densities.mean() + 1e-6))

    score  = min(1.0, cv_edge / 1.5)
    reason = (f"Edge density CV: {cv_edge:.3f} — "
              + ("inconsistent edge distribution detected" if score > 0.4
                 else "edge distribution is consistent"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"edge_density_cv": round(cv_edge, 4)},
    }


# ── Technique 6: Color Inconsistency ─────────────────────────────────────────

def _color_inconsistency(img: np.ndarray, block_size: int = 128) -> dict:
    """
    Analyse mean LAB colour per block. Spliced regions often have a
    different white-balance or colour temperature.
    """
    lab  = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    h, w = lab.shape[:2]
    bh   = h // block_size
    bw   = w // block_size

    if bh < 2 or bw < 2:
        return {"score": 0.0, "reason": "Image too small for colour analysis",
                "details": {}}

    a_means = []
    b_means = []
    for i in range(bh):
        for j in range(bw):
            block = lab[i*block_size:(i+1)*block_size,
                        j*block_size:(j+1)*block_size]
            a_means.append(float(block[:, :, 1].mean()))
            b_means.append(float(block[:, :, 2].mean()))

    a_std = float(np.std(a_means))
    b_std = float(np.std(b_means))
    color_inconsistency = (a_std + b_std) / 2.0

    # Threshold: std > 15 in LAB a/b channels is suspicious
    score  = min(1.0, color_inconsistency / 30.0)
    reason = (f"Colour inconsistency (LAB a/b std): {color_inconsistency:.2f} — "
              + ("colour/illumination inconsistency detected" if score > 0.4
                 else "colour is consistent"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"lab_a_std": round(a_std, 4), "lab_b_std": round(b_std, 4)},
    }


# ── Technique 7: Compression Artifacts ───────────────────────────────────────

def _compression_artifacts(gray: np.ndarray) -> dict:
    """
    Detect double-JPEG compression by measuring the strength of 8×8 DCT
    block boundary artefacts in the luminance channel.
    Strong periodic artefacts at 8-pixel intervals suggest the image was
    compressed, edited, and re-compressed.
    """
    h, w = gray.shape
    gray_float = gray.astype(np.float32)

    # Compare adjacent pixels on either side of each 8-pixel boundary.  The
    # slices must have the same width: for an image width of w, boundaries are
    # represented by columns 7, 15, ... and their right neighbours 8, 16, ...
    boundary_cols = np.arange(7, w - 1, 8)
    if boundary_cols.size:
        h_diff = np.abs(
            gray_float[:, boundary_cols] - gray_float[:, boundary_cols + 1]
        ).mean()
    else:
        h_diff = 0.0

    boundary_rows = np.arange(7, h - 1, 8)
    if boundary_rows.size:
        v_diff = np.abs(
            gray_float[boundary_rows, :] - gray_float[boundary_rows + 1, :]
        ).mean()
    else:
        v_diff = 0.0

    # Compare with non-boundary differences
    h_inner = np.abs(np.diff(gray_float, axis=1)).mean() if w > 1 else 0.0
    v_inner = np.abs(np.diff(gray_float, axis=0)).mean() if h > 1 else 0.0

    h_ratio = float(h_diff / (h_inner + 1e-6))
    v_ratio = float(v_diff / (v_inner + 1e-6))
    ratio   = (h_ratio + v_ratio) / 2.0

    # Ratio > 1.3 suggests block boundary artefacts stronger than average
    score  = min(1.0, max(0.0, (ratio - 1.0) / 1.0))
    reason = (f"DCT block boundary ratio: {ratio:.3f} — "
              + ("double-compression artefacts detected" if score > 0.3
                 else "no significant compression artefacts"))

    return {
        "score":   score,
        "reason":  reason,
        "details": {"boundary_ratio": round(ratio, 4)},
    }
