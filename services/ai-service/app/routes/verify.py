"""
verify.py  —  FastAPI router
────────────────────────────
Exposes:
  POST /verify
    - Accepts: multipart/form-data  { file: UploadFile, document_type: str }
    - Returns: full verification result JSON
  GET  /health
    - Returns: service health status
"""

import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from app.config import UPLOAD_DIR
from app.services.verification_service import verify_document

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
MAX_FILE_SIZE_MB   = 10


@router.get("/health")
async def health():
    return {"success": True, "message": "AI Verification Service is running"}


@router.post("/verify")
async def verify(
    file: UploadFile = File(...),
    document_type: str = Form(...),
):
    """
    Accepts a document image and document type, runs the full AI
    verification pipeline, and returns the structured result.
    """
    # ── Validate file extension ───────────────────────────────────────────────
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # ── Validate document type ────────────────────────────────────────────────
    valid_types = {"AADHAAR", "PAN", "GST_CERTIFICATE", "LAND_CERTIFICATE", "OTHER"}
    doc_type    = document_type.upper().strip()
    if doc_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document_type '{document_type}'. Valid: {valid_types}",
        )

    # ── Save uploaded file ────────────────────────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    save_path   = os.path.join(UPLOAD_DIR, unique_name)

    try:
        with open(save_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        await file.close()

    # ── Check file size ───────────────────────────────────────────────────────
    size_mb = os.path.getsize(save_path) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        os.remove(save_path)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB",
        )

    # ── Run verification pipeline ─────────────────────────────────────────────
    try:
        result = verify_document(save_path, doc_type)
        result["file_path"] = save_path   # Node.js stores this in MongoDB
        return JSONResponse(content=result)
    except Exception as e:
        # Clean up on failure
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
