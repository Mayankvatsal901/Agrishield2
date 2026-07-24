"""
ocr_engine.py
─────────────
Wraps PaddleOCR (2.7.x) to:
  1. Run OCR on a preprocessed BGR image (numpy array).
  2. Return every detected text line with its confidence score.
  3. Attempt to extract structured fields using regex heuristics.

PaddleOCR is initialised once at module level (expensive) and reused.
"""

import re
import numpy as np
from paddleocr import PaddleOCR
from app.config import OCR_LANG, OCR_USE_GPU


# ── Singleton OCR instance ────────────────────────────────────────────────────
_ocr: PaddleOCR | None = None


def _get_ocr() -> PaddleOCR:
    global _ocr
    if _ocr is None:
        _ocr = PaddleOCR(
            use_angle_cls=True,
            lang=OCR_LANG,
            use_gpu=OCR_USE_GPU,
            show_log=False,
            # Disable unnecessary models to save memory on first run
            det=True,
            rec=True,
            cls=True,
        )
    return _ocr


# ── Public API ────────────────────────────────────────────────────────────────

def run_ocr(image: np.ndarray) -> dict:
    """
    Parameters
    ----------
    image : np.ndarray  BGR image (already preprocessed)

    Returns
    -------
    {
        "raw_lines"       : [{"text": str, "confidence": float, "bbox": list}],
        "full_text"       : str,
        "extracted_fields": { name, dob, gender, document_number, address, ... }
    }
    """
    ocr = _get_ocr()

    # paddleocr 2.7.x: ocr() returns a list of pages;
    # each page is a list of [bbox, (text, confidence)] or None
    result = ocr.ocr(image, cls=True)

    raw_lines  = []
    text_lines = []

    if result:
        for page in result:
            if not page:
                continue
            for line in page:
                # line format: [bbox, (text, confidence)]
                if not line or len(line) < 2:
                    continue
                bbox        = line[0]
                text_conf   = line[1]

                # text_conf can be (text, conf) tuple or just a string in some builds
                if isinstance(text_conf, (list, tuple)) and len(text_conf) == 2:
                    text = str(text_conf[0]).strip()
                    conf = float(text_conf[1])
                else:
                    text = str(text_conf).strip()
                    conf = 1.0

                if not text:
                    continue

                raw_lines.append({
                    "text":       text,
                    "confidence": round(conf, 4),
                    "bbox":       bbox,
                })
                text_lines.append(text)

    full_text = "\n".join(text_lines)
    extracted = _extract_fields(text_lines, full_text)

    return {
        "raw_lines":        raw_lines,
        "full_text":        full_text,
        "extracted_fields": extracted,
    }


# ── Field extraction helpers ──────────────────────────────────────────────────

_RE_AADHAAR   = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
_RE_PAN       = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")
_RE_GST       = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")
_RE_DOB       = re.compile(
    r"(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})"
)
_RE_DOB_LABEL = re.compile(r"(?:dob|d0b|date\s+of\s+birth|जन्म)", re.IGNORECASE)
# Match complete English gender labels first. Single-letter matches are only
# accepted when they occur next to a gender label, otherwise the letter "f" in
# OCR text such as "f/DOB" can be mistaken for FEMALE.
_RE_GENDER    = re.compile(r"\b(female|male|transgender)\b", re.IGNORECASE)
_RE_GENDER_LABEL = re.compile(
    r"(?:gender|sex|लिंग)\s*[:\-]?\s*(female|male|transgender|f|m)",
    re.IGNORECASE,
)
_RE_PINCODE   = re.compile(r"\b[1-9][0-9]{5}\b")

_NAME_TRIGGERS = ("name", "नाम", "holder", "to")
_STOP_NAME_MARKERS = ("c/o", "address", "dob", "date of birth", "gender", "sex")


def _extract_fields(lines: list[str], full_text: str) -> dict:
    fields: dict = {
        "name":            None,
        "dob":             None,
        "gender":          None,
        "document_number": None,
        "address":         None,
        "pincode":         None,
        "raw_numbers":     [],
    }

    # ── Document number ───────────────────────────────────────────────────────
    pan_match = _RE_PAN.search(full_text)
    if pan_match:
        fields["document_number"] = pan_match.group()

    aadhaar_match = _RE_AADHAAR.search(full_text)
    if aadhaar_match and not fields["document_number"]:
        fields["document_number"] = aadhaar_match.group().replace(" ", "")

    gst_match = _RE_GST.search(full_text)
    if gst_match and not fields["document_number"]:
        fields["document_number"] = gst_match.group()

    # ── DOB ───────────────────────────────────────────────────────────────────
    # Prefer a date on/near a DOB label. Aadhaar letters also contain an issue
    # date, so selecting the first date in the OCR text is incorrect. OCR often
    # reads "DOB" as "D0B" and may omit separators before the date, therefore
    # the label search intentionally uses tolerant matching.
    dob_candidates = []
    for i, line in enumerate(lines):
        if _RE_DOB_LABEL.search(line):
            for nearby in lines[i:i + 3]:
                match = _RE_DOB.search(nearby)
                if match:
                    dob_candidates.append(match.group(1))
    if dob_candidates:
        fields["dob"] = dob_candidates[0]
    else:
        # Fall back to a date near a gender line, which is common on Aadhaar
        # cards when the DOB label is partially missed by OCR.
        for i, line in enumerate(lines):
            if re.search(r"\b(?:male|female|transgender)\b", line, re.IGNORECASE):
                for nearby in lines[max(0, i - 2):i + 1]:
                    match = _RE_DOB.search(nearby)
                    if match:
                        fields["dob"] = match.group(1)
                        break
                if fields["dob"]:
                    break
    if not fields["dob"]:
        dob_match = _RE_DOB.search(full_text)
        if dob_match:
            fields["dob"] = dob_match.group(1)

    # ── Gender ────────────────────────────────────────────────────────────────
    gender_match = _RE_GENDER_LABEL.search(full_text) or _RE_GENDER.search(full_text)
    if gender_match:
        raw_g = gender_match.group(1 if gender_match.re is _RE_GENDER_LABEL else 0).upper()
        fields["gender"] = "MALE" if raw_g in ("MALE", "M") else \
                           "FEMALE" if raw_g in ("FEMALE", "F") else "OTHER"

    # ── Name (prefer a valid labelled candidate) ──────────────────────────────
    # OCR may return a low-confidence Hindi name before the clear English name.
    # Scan a few lines after "To"/"Name" and select the longest plausible
    # Latin name instead of accepting a one-character artefact.
    for i, line in enumerate(lines):
        lower = line.lower()
        trigger_match = re.search(r"(?:^|\s)(?:name|holder|to)\s*:?", lower)
        if not (trigger_match or "नाम" in line):
            continue

        candidates = []
        inline = line.split(":", 1)[1].strip() if ":" in line else ""
        if inline:
            candidates.append(inline)
        candidates.extend(candidate.strip() for candidate in lines[i + 1:i + 5])

        valid_candidates = []
        for candidate in candidates:
            candidate_lower = candidate.lower()
            if any(marker in candidate_lower for marker in _STOP_NAME_MARKERS):
                break
            if re.fullmatch(r"[A-Za-z][A-Za-z .\-]{1,79}", candidate):
                valid_candidates.append(candidate)
        if valid_candidates:
            fields["name"] = max(valid_candidates, key=len)
            break

    # ── Address (collect lines after "address" keyword) ───────────────────────
    address_lines = []
    collecting    = False
    for line in lines:
        if "address" in line.lower() or "पता" in line:
            collecting = True
            after_colon = line.split(":")
            if len(after_colon) > 1:
                address_lines.append(after_colon[1].strip())
            continue
        if collecting:
            if len(address_lines) >= 4:
                break
            address_lines.append(line.strip())

    if address_lines:
        fields["address"] = ", ".join(filter(None, address_lines))

    # ── Pincode ───────────────────────────────────────────────────────────────
    pin_match = _RE_PINCODE.search(full_text)
    if pin_match:
        fields["pincode"] = pin_match.group()

    return fields
