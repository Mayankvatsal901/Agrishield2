"""
image_preprocessor.py
─────────────────────
Prepares a raw document image for OCR and forensic analysis.

Pipeline
  1. Load & validate
  2. Resize to a standard width (keeps aspect ratio)
  3. Denoise  (fastNlMeansDenoisingColored)
  4. Brightness / gamma normalisation
  5. CLAHE contrast enhancement (per channel in LAB space)
  6. Deskew   (Hough-line based rotation correction)
  7. Edge map (Canny) — returned separately for forensics
"""

import cv2
import numpy as np
from pathlib import Path


# ── Constants ─────────────────────────────────────────────────────────────────
TARGET_WIDTH = 1200          # pixels — wide enough for fine OCR
MAX_DESKEW_ANGLE = 15.0      # degrees — ignore wild rotations (not a document)


# ── Public API ────────────────────────────────────────────────────────────────

def preprocess(image_path: str) -> dict:
    """
    Load and preprocess a document image.

    Returns
    -------
    {
        "original"   : np.ndarray  (BGR, original size),
        "processed"  : np.ndarray  (BGR, preprocessed),
        "gray"       : np.ndarray  (grayscale of processed),
        "edges"      : np.ndarray  (Canny edge map),
        "deskew_angle": float,
    }
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    original = cv2.imread(str(path))
    if original is None:
        raise ValueError(f"cv2 could not decode image: {image_path}")

    img = _resize(original)
    img = _denoise(img)
    img = _normalise_brightness(img)
    img = _enhance_contrast(img)
    img, angle = _deskew(img)
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = _edge_map(gray)

    return {
        "original":    original,
        "processed":   img,
        "gray":        gray,
        "edges":       edges,
        "deskew_angle": angle,
    }


# ── Private helpers ───────────────────────────────────────────────────────────

def _resize(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    if w == TARGET_WIDTH:
        return img
    scale = TARGET_WIDTH / w
    new_h = int(h * scale)
    return cv2.resize(img, (TARGET_WIDTH, new_h), interpolation=cv2.INTER_LANCZOS4)


def _denoise(img: np.ndarray) -> np.ndarray:
    # h=10 for luminance, hColor=10 for colour channels
    return cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10,
                                           templateWindowSize=7,
                                           searchWindowSize=21)


def _normalise_brightness(img: np.ndarray) -> np.ndarray:
    """
    Gamma correction: if the mean brightness deviates from 128,
    apply a gamma transform to pull it back toward neutral.
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel = lab[:, :, 0].astype(np.float32)
    mean_l = l_channel.mean()

    if mean_l == 0:
        return img

    # target mean = 128 (mid-grey in LAB L channel 0-255 range)
    gamma = np.log(128.0) / np.log(mean_l + 1e-6)
    gamma = float(np.clip(gamma, 0.5, 2.5))

    lut = np.array([((i / 255.0) ** (1.0 / gamma)) * 255
                    for i in range(256)], dtype=np.uint8)
    lab[:, :, 0] = cv2.LUT(lab[:, :, 0], lut)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


def _enhance_contrast(img: np.ndarray) -> np.ndarray:
    """CLAHE on the L channel of LAB — preserves colour while boosting local contrast."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _deskew(img: np.ndarray) -> tuple[np.ndarray, float]:
    """
    Detect dominant text-line angle via Hough lines on a Canny edge map,
    then rotate the image to correct skew.
    """
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180,
                             threshold=100,
                             minLineLength=100,
                             maxLineGap=10)

    angle = 0.0
    if lines is not None:
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 - x1 == 0:
                continue
            a = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if abs(a) < MAX_DESKEW_ANGLE:
                angles.append(a)
        if angles:
            angle = float(np.median(angles))

    if abs(angle) < 0.5:          # negligible skew — skip rotation
        return img, angle

    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h),
                              flags=cv2.INTER_LANCZOS4,
                              borderMode=cv2.BORDER_REPLICATE)
    return rotated, angle


def _edge_map(gray: np.ndarray) -> np.ndarray:
    """Canny edge map used by the forgery detector for edge-inconsistency analysis."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    return cv2.Canny(blurred, 50, 150)
