"""
field_validator.py
──────────────────
Validates extracted OCR fields against known Indian document formats.

Validates:
  - PAN card number  (AAAAA9999A)
  - Aadhaar number   (12 digits)
  - GST number       (15-char alphanumeric with checksum structure)
  - Date of birth    (DD/MM/YYYY or YYYY-MM-DD)
  - Required fields per document type
  - Suspicious patterns (all zeros, repeated digits, etc.)
"""

import re
from datetime import datetime


# ── Compiled patterns ─────────────────────────────────────────────────────────
_RE_PAN     = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
_RE_AADHAAR = re.compile(r"^\d{12}$")
_RE_GST     = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
_RE_DATE_1  = re.compile(r"^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$")   # DD/MM/YYYY
_RE_DATE_2  = re.compile(r"^\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}$")   # YYYY-MM-DD

# Required fields per document type
_REQUIRED_FIELDS: dict[str, list[str]] = {
    "AADHAAR":          ["name", "dob", "gender", "document_number", "address"],
    "PAN":              ["name", "dob", "document_number"],
    "GST_CERTIFICATE":  ["document_number"],
    "LAND_CERTIFICATE": ["name", "address"],
    "OTHER":            [],
}


# ── Public API ────────────────────────────────────────────────────────────────

def validate_fields(document_type: str, extracted_fields: dict) -> dict:
    """
    Parameters
    ----------
    document_type    : "AADHAAR" | "PAN" | "GST_CERTIFICATE" | "LAND_CERTIFICATE" | "OTHER"
    extracted_fields : dict from ocr_engine.run_ocr()

    Returns
    -------
    {
        "is_valid"        : bool,
        "checks"          : { field: { value, valid, reason } },
        "missing_fields"  : [str],
        "warnings"        : [str],
        "validation_score": float   (0.0 – 1.0)
    }
    """
    doc_type = document_type.upper()
    checks: dict   = {}
    warnings: list = []

    # ── Document-number format check ──────────────────────────────────────────
    doc_num = extracted_fields.get("document_number")
    if doc_num:
        checks["document_number"] = _validate_doc_number(doc_type, doc_num)
    else:
        checks["document_number"] = {"value": None, "valid": False,
                                      "reason": "Document number not found in OCR"}

    # ── DOB check ─────────────────────────────────────────────────────────────
    dob = extracted_fields.get("dob")
    if dob:
        checks["dob"] = _validate_dob(dob)
    elif doc_type in ("AADHAAR", "PAN"):
        checks["dob"] = {"value": None, "valid": False,
                          "reason": "Date of birth not found"}

    # ── Name check ────────────────────────────────────────────────────────────
    name = extracted_fields.get("name")
    if name:
        checks["name"] = _validate_name(name)
    elif doc_type in ("AADHAAR", "PAN", "LAND_CERTIFICATE"):
        checks["name"] = {"value": None, "valid": False,
                           "reason": "Name not found in OCR"}

    # ── Gender check ──────────────────────────────────────────────────────────
    gender = extracted_fields.get("gender")
    if gender:
        checks["gender"] = {
            "value": gender,
            "valid": gender in ("MALE", "FEMALE", "OTHER"),
            "reason": "Valid gender" if gender in ("MALE", "FEMALE", "OTHER")
                      else "Unrecognised gender value",
        }

    # ── Address check ─────────────────────────────────────────────────────────
    address = extracted_fields.get("address")
    if address:
        checks["address"] = {
            "value": address[:80],
            "valid": len(address) >= 10,
            "reason": "Address present" if len(address) >= 10
                      else "Address too short — may be incomplete",
        }

    # ── Missing required fields ───────────────────────────────────────────────
    required = _REQUIRED_FIELDS.get(doc_type, [])
    missing  = [f for f in required if not extracted_fields.get(f)]

    # ── Suspicious pattern warnings ───────────────────────────────────────────
    if doc_num:
        if len(set(doc_num.replace(" ", ""))) == 1:
            warnings.append("Document number consists of a single repeated digit — suspicious")
        if doc_num.replace(" ", "").startswith("000000"):
            warnings.append("Document number starts with multiple zeros — suspicious")

    # ── Compute validation score ──────────────────────────────────────────────
    all_checks = list(checks.values())
    passed     = sum(1 for c in all_checks if c.get("valid"))
    total      = len(all_checks) + len(missing)
    score      = round(passed / total, 4) if total > 0 else 0.0

    is_valid = (len(missing) == 0 and
                all(c.get("valid") for c in all_checks) and
                len(warnings) == 0)

    return {
        "is_valid":         is_valid,
        "checks":           checks,
        "missing_fields":   missing,
        "warnings":         warnings,
        "validation_score": score,
    }


# ── Private validators ────────────────────────────────────────────────────────

def _validate_doc_number(doc_type: str, value: str) -> dict:
    clean = value.strip().upper().replace(" ", "")

    if doc_type == "PAN":
        valid  = bool(_RE_PAN.match(clean))
        reason = "Valid PAN format" if valid else f"Invalid PAN format: expected AAAAA9999A, got '{clean}'"

    elif doc_type == "AADHAAR":
        clean  = re.sub(r"\s", "", clean)
        valid  = bool(_RE_AADHAAR.match(clean))
        reason = "Valid Aadhaar (12 digits)" if valid else f"Aadhaar must be 12 digits, got {len(clean)}"

    elif doc_type == "GST_CERTIFICATE":
        valid  = bool(_RE_GST.match(clean))
        reason = "Valid GST format" if valid else f"Invalid GST format: '{clean}'"

    else:
        valid  = len(clean) >= 4
        reason = "Document number present" if valid else "Document number too short"

    return {"value": value, "valid": valid, "reason": reason}


def _validate_dob(value: str) -> dict:
    clean = value.strip()
    if not (_RE_DATE_1.match(clean) or _RE_DATE_2.match(clean)):
        return {"value": clean, "valid": False,
                "reason": f"Unrecognised date format: '{clean}'"}

    # Parse and sanity-check the date
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
                "%Y/%m/%d", "%Y-%m-%d", "%Y.%m.%d"):
        try:
            dt = datetime.strptime(clean, fmt)
            now = datetime.now()
            if dt.year < 1900 or dt > now:
                return {"value": clean, "valid": False,
                        "reason": f"Date out of plausible range: {clean}"}
            age = (now - dt).days // 365
            if age < 0 or age > 120:
                return {"value": clean, "valid": False,
                        "reason": f"Implausible age derived from DOB: {age} years"}
            return {"value": clean, "valid": True,
                    "reason": f"Valid date, age ≈ {age} years"}
        except ValueError:
            continue

    return {"value": clean, "valid": False, "reason": "Could not parse date"}


def _validate_name(value: str) -> dict:
    clean = value.strip()
    # Name should be at least 2 chars, only letters/spaces/dots/hyphens
    valid  = bool(re.match(r"^[A-Za-z\s\.\-]{2,80}$", clean))
    reason = "Valid name" if valid else f"Name contains unexpected characters or is too short: '{clean}'"
    return {"value": clean, "valid": valid, "reason": reason}
