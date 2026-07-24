"""
qr_extractor.py
───────────────
Detects and decodes QR codes / barcodes in a document image using pyzbar.

Aadhaar QR codes contain an XML payload with name, DOB, gender, address.
This module:
  1. Scans the image for any QR / barcode symbols.
  2. Decodes each symbol.
  3. Attempts to parse Aadhaar XML if present.
  4. Cross-validates decoded data against OCR-extracted fields.
"""

import os
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field, asdict

import cv2
import numpy as np

# ── Tell pyzbar where libzbar lives BEFORE it is imported ──────────────────────
# pyzbar reads the DYLD_LIBRARY_PATH / LD_LIBRARY_PATH env vars through
# its zbar_library loader. Setting ZBAR_LIBRARY makes it use that path
# directly (supported since pyzbar 0.1.9 via the locations list).
_zbar_lib = os.getenv("ZBAR_LIBRARY", "")
if _zbar_lib:
    # Inject into the search path that pyzbar's zbar_library.load() checks
    _lib_dir = os.path.dirname(_zbar_lib)
    os.environ["DYLD_LIBRARY_PATH"] = (
        _lib_dir + ":" + os.environ.get("DYLD_LIBRARY_PATH", "")
    )
    os.environ["LD_LIBRARY_PATH"] = (
        _lib_dir + ":" + os.environ.get("LD_LIBRARY_PATH", "")
    )

try:
    from pyzbar import pyzbar
except ImportError:
    # zbar is optional locally; OpenCV QRCodeDetector remains available.
    pyzbar = None


# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class QRSymbol:
    symbol_type: str          # "QRCODE", "CODE128", etc.
    raw_data:    str
    parsed:      dict = field(default_factory=dict)


@dataclass
class QRResult:
    found:            bool
    symbols:          list[dict]
    cross_validation: dict        # field → {"ocr": ..., "qr": ..., "match": bool}


# ── Public API ────────────────────────────────────────────────────────────────

def extract_qr(
    image: np.ndarray,
    ocr_fields: dict,
    original_image: np.ndarray | None = None,
) -> dict:
    """
    Parameters
    ----------
    image      : np.ndarray  BGR preprocessed image
    ocr_fields : dict        extracted_fields from ocr_engine

    Returns
    -------
    Serialisable dict of QRResult
    """
    symbols = _decode_symbols(image, original_image=original_image)
    cross   = _cross_validate(symbols, ocr_fields)

    result = QRResult(
        found=len(symbols) > 0,
        symbols=[asdict(s) for s in symbols],
        cross_validation=cross,
    )
    return asdict(result)


# ── Decoding ──────────────────────────────────────────────────────────────────

def _decode_symbols(
    image: np.ndarray,
    original_image: np.ndarray | None = None,
) -> list[QRSymbol]:
    """
    Try decoding on the original image, then on a sharpened version,
    then on a binarised version — to maximise detection rate.
    """
    symbols: list[QRSymbol] = []
    seen_data: set[str] = set()

    variants = _image_variants(image)
    # Try the original-resolution image too. The main OCR pipeline resizes to
    # 1200px wide, which can make dense Aadhaar QR modules too small to decode.
    source_image = original_image if original_image is not None else image
    variants.extend(_original_resolution_variants(source_image))
    # A full scan can miss one QR when the image contains multiple card panels.
    # Decode overlapping tiles and likely lower-card regions as well.
    variants.extend(_qr_region_variants(source_image))

    for variant in variants:
        if pyzbar is None:
            break
        for obj in pyzbar.decode(variant):
            try:
                raw = obj.data.decode("utf-8", errors="replace").strip()
            except Exception:
                raw = str(obj.data)

            if raw in seen_data:
                continue
            seen_data.add(raw)

            sym = QRSymbol(
                symbol_type=obj.type,
                raw_data=raw,
                parsed=_parse_payload(raw),
            )
            symbols.append(sym)

    # OpenCV's QR detector is a useful fallback for dense or compressed QR
    # images that libzbar cannot decode. It does not replace pyzbar because
    # pyzbar also supports non-QR barcodes.
    detector = cv2.QRCodeDetector()
    for variant in variants:
        try:
            data, points, _ = detector.detectAndDecode(variant)
        except cv2.error:
            data, points = "", None
        if data and data not in seen_data:
            seen_data.add(data)
            symbols.append(QRSymbol(
                symbol_type="QRCODE",
                raw_data=data.strip(),
                parsed=_parse_payload(data.strip()),
            ))

    return symbols


def _qr_region_variants(image: np.ndarray) -> list[np.ndarray]:
    """Return enlarged overlapping crops for QR codes in multi-panel cards."""
    height, width = image.shape[:2]
    crops = []

    # Overlapping quadrants preserve enough quiet-zone margin around a QR.
    for y0, y1, x0, x1 in (
        (0, height * 0.75, 0, width * 0.75),
        (0, height * 0.75, width * 0.25, width),
        (height * 0.25, height, 0, width * 0.75),
        (height * 0.25, height, width * 0.25, width),
    ):
        crop = image[int(y0):int(y1), int(x0):int(x1)]
        if crop.size:
            scale = min(2.5, 1800.0 / max(crop.shape[:2]))
            enlarged = cv2.resize(crop, None, fx=scale, fy=scale,
                                  interpolation=cv2.INTER_CUBIC)
            gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
            crops.extend((enlarged, gray, cv2.threshold(
                gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )[1]))
    return crops


def _image_variants(image: np.ndarray) -> list[np.ndarray]:
    """Return multiple processed versions to improve pyzbar detection."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Sharpened
    kernel  = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharp   = cv2.filter2D(gray, -1, kernel)

    # Adaptive threshold (good for low-contrast QR)
    binary  = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    return [image, gray, sharp, binary]


def _original_resolution_variants(image: np.ndarray) -> list[np.ndarray]:
    """Build QR-friendly variants without relying on the resized OCR image."""
    height, width = image.shape[:2]
    if max(height, width) <= 1600:
        return []

    scale = min(2.0, 2400.0 / max(height, width))
    enlarged = cv2.resize(image, None, fx=scale, fy=scale,
                          interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
    gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    return [enlarged, gray, cv2.threshold(gray, 0, 255,
                                          cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]]


# ── Payload parsing ───────────────────────────────────────────────────────────

def _parse_payload(raw: str) -> dict:
    """
    Attempt to parse the raw QR payload.
    Handles:
      - Aadhaar XML  (<PrintLetterBarcodeData .../>)
      - Key=Value pairs  (key1:val1\nkey2:val2)
      - Plain URL
      - Plain text
    """
    # 1. Aadhaar XML
    if raw.strip().startswith("<"):
        return _parse_aadhaar_xml(raw)

    # 2. Key=Value / Key:Value
    kv = _parse_key_value(raw)
    if kv:
        return kv

    # 3. URL
    if raw.startswith("http://") or raw.startswith("https://"):
        return {"type": "url", "url": raw}

    # 4. Fallback — plain text
    return {"type": "plain_text", "value": raw}


def _parse_aadhaar_xml(raw: str) -> dict:
    try:
        root = ET.fromstring(raw)
        attribs = root.attrib
        return {
            "type":    "aadhaar_xml",
            "name":    attribs.get("name"),
            "dob":     attribs.get("dob"),
            "gender":  attribs.get("gender"),
            "co":      attribs.get("co"),       # care-of
            "house":   attribs.get("house"),
            "street":  attribs.get("street"),
            "lm":      attribs.get("lm"),       # landmark
            "loc":     attribs.get("loc"),
            "vtc":     attribs.get("vtc"),
            "dist":    attribs.get("dist"),
            "state":   attribs.get("state"),
            "pc":      attribs.get("pc"),       # pincode
            "uid":     attribs.get("uid"),      # last 4 digits of Aadhaar
        }
    except ET.ParseError:
        return {"type": "xml_parse_error", "raw": raw[:200]}


def _parse_key_value(raw: str) -> dict | None:
    """Parse newline / semicolon separated key:value or key=value pairs."""
    separators = re.split(r"[\n;|]", raw)
    result = {}
    for part in separators:
        for sep in ("=", ":"):
            if sep in part:
                k, _, v = part.partition(sep)
                k = k.strip().lower().replace(" ", "_")
                v = v.strip()
                if k and v:
                    result[k] = v
                break
    if len(result) >= 2:
        result["type"] = "key_value"
        return result
    return None


# ── Cross-validation ──────────────────────────────────────────────────────────

_FIELD_MAP = {
    "name":            ["name"],
    "dob":             ["dob"],
    "gender":          ["gender"],
    "document_number": ["uid", "pan", "gstin"],
    "pincode":         ["pc", "pincode"],
}


def _cross_validate(symbols: list[QRSymbol], ocr_fields: dict) -> dict:
    """
    For each key field, compare the OCR value with the QR-decoded value.
    Returns a dict of { field: { ocr, qr, match } }.
    """
    if not symbols:
        return {}

    # Flatten all parsed data from all symbols
    qr_data: dict = {}
    for sym in symbols:
        qr_data.update(sym.parsed)

    report = {}
    for field_name, qr_keys in _FIELD_MAP.items():
        ocr_val = ocr_fields.get(field_name)
        qr_val  = next((qr_data.get(k) for k in qr_keys if qr_data.get(k)), None)

        if ocr_val is None and qr_val is None:
            continue

        match = _fuzzy_match(str(ocr_val or ""), str(qr_val or ""))
        report[field_name] = {
            "ocr":   ocr_val,
            "qr":    qr_val,
            "match": match,
        }

    return report


def _fuzzy_match(a: str, b: str) -> bool:
    """Case-insensitive, whitespace-normalised equality check."""
    return re.sub(r"\s+", "", a).upper() == re.sub(r"\s+", "", b).upper()
