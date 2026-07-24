"""
verification_service.py
───────────────────────
Orchestrates the full document verification pipeline:

  preprocess → OCR → QR extraction → field validation → forgery detection

Returns a single structured result dict that the FastAPI route serialises
and sends back to the Node.js auth service.
"""

import time
from pathlib import Path

from app.utils.image_preprocessor import preprocess
from app.utils.ocr_engine          import run_ocr
from app.utils.qr_extractor        import extract_qr
from app.utils.field_validator     import validate_fields
from app.utils.forgery_detector    import detect_forgery


def verify_document(image_path: str, document_type: str) -> dict:
    """
    Parameters
    ----------
    image_path    : absolute path to the uploaded document image
    document_type : "AADHAAR" | "PAN" | "GST_CERTIFICATE" |
                    "LAND_CERTIFICATE" | "OTHER"

    Returns
    -------
    {
        "success"          : bool,
        "document_type"    : str,
        "processing_time_ms": int,
        "ocr"              : { raw_lines, full_text, extracted_fields },
        "qr"               : { found, symbols, cross_validation },
        "validation"       : { is_valid, checks, missing_fields, warnings, validation_score },
        "forgery"          : { authenticity_score, possible_forgery, techniques, reasons },
        "summary"          : { authenticity_score, verification_status, flags }
    }
    """
    start = time.time()

    # ── 1. Preprocess ─────────────────────────────────────────────────────────
    preprocessed = preprocess(image_path)

    # ── 2. OCR ────────────────────────────────────────────────────────────────
    ocr_result = run_ocr(preprocessed["processed"])

    # ── 3. QR Extraction ──────────────────────────────────────────────────────
    qr_result = extract_qr(
        preprocessed["processed"],
        ocr_result["extracted_fields"],
        original_image=preprocessed["original"],
    )

    # ── 4. Field Validation ───────────────────────────────────────────────────
    validation_result = validate_fields(
        document_type,
        ocr_result["extracted_fields"],
    )

    # ── 5. Forgery Detection ──────────────────────────────────────────────────
    forgery_result = detect_forgery(preprocessed)

    # ── 6. Assemble summary ───────────────────────────────────────────────────
    auth_score = forgery_result["authenticity_score"]
    val_score  = validation_result["validation_score"] * 100

    # Blend: 70% forgery score + 30% validation score
    blended_score = round(auth_score * 0.7 + val_score * 0.3, 2)

    flags = []
    if forgery_result["possible_forgery"]:
        flags.append("POSSIBLE_FORGERY")
    if not validation_result["is_valid"]:
        flags.append("VALIDATION_FAILED")
    if validation_result["missing_fields"]:
        flags.append(f"MISSING_FIELDS:{','.join(validation_result['missing_fields'])}")
    if qr_result["found"]:
        # Check if any QR cross-validation field mismatched
        mismatches = [
            f for f, v in qr_result["cross_validation"].items()
            if not v.get("match", True)
        ]
        if mismatches:
            flags.append(f"QR_MISMATCH:{','.join(mismatches)}")

    if blended_score >= 75 and not flags:
        status = "VERIFIED"
    elif blended_score >= 50:
        status = "NEEDS_REVIEW"
    else:
        status = "REJECTED"

    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "success":             True,
        "document_type":       document_type,
        "processing_time_ms":  elapsed_ms,
        "ocr":                 ocr_result,
        "qr":                  qr_result,
        "validation":          validation_result,
        "forgery":             forgery_result,
        "summary": {
            "authenticity_score":  blended_score,
            "forgery_score":       auth_score,
            "validation_score":    round(val_score, 2),
            "verification_status": status,
            "flags":               flags,
        },
    }
