# AgriShield AI Verification Service

FastAPI service for verifying Indian identity and agricultural documents using:

- Image preprocessing and deskewing
- PaddleOCR text recognition
- Structured field extraction
- QR/barcode decoding with `pyzbar` and OpenCV fallback
- Format and field validation
- Heuristic image-forensics analysis

> This service provides a risk assessment. It is not legal proof that a document is authentic. Use human review for uncertain results.

## Service details

| Item | Value |
|---|---|
| Framework | FastAPI |
| Default port | `8000` |
| API prefix | `/api/ai` |
| Upload limit | `10 MB` |
| Supported image types | JPEG, PNG, BMP, TIFF, WEBP |
| Supported document types | `AADHAAR`, `PAN`, `GST_CERTIFICATE`, `LAND_CERTIFICATE`, `OTHER` |

## API endpoints

### Health check

```http
GET /api/ai/health
```

Example response:

```json
{
  "success": true,
  "message": "AI Verification Service is running"
}
```

### Verify a document

```http
POST /api/ai/verify
Content-Type: multipart/form-data
```

Form fields:

| Field | Type | Required | Description |
|---|---|---:|---|
| `file` | file | Yes | Document image |
| `document_type` | string | Yes | `AADHAAR`, `PAN`, `GST_CERTIFICATE`, `LAND_CERTIFICATE`, or `OTHER` |

Using `curl`:

```bash
curl -X POST http://localhost:8000/api/ai/verify \
  -F "file=@/path/to/redacted-document.jpg" \
  -F "document_type=AADHAAR"
```

## Response structure

A successful response contains:

```json
{
  "success": true,
  "document_type": "AADHAAR",
  "processing_time_ms": 25000,
  "file_path": "uploads/example.jpg",
  "ocr": {
    "raw_lines": [],
    "full_text": "...",
    "extracted_fields": {
      "name": "Example User",
      "dob": "19/03/2009",
      "gender": "MALE",
      "document_number": "123456789012",
      "address": "Example address",
      "pincode": "246001",
      "raw_numbers": []
    }
  },
  "qr": {
    "found": false,
    "symbols": [],
    "cross_validation": {}
  },
  "validation": {
    "is_valid": true,
    "checks": {},
    "missing_fields": [],
    "warnings": [],
    "validation_score": 1.0
  },
  "forgery": {
    "authenticity_score": 80.0,
    "possible_forgery": false,
    "techniques": {},
    "reasons": []
  },
  "summary": {
    "authenticity_score": 86.0,
    "forgery_score": 80.0,
    "validation_score": 100.0,
    "verification_status": "VERIFIED",
    "flags": []
  }
}
```

### Verification statuses

| Status | Meaning |
|---|---|
| `VERIFIED` | Fields passed validation and no high-risk flag was raised |
| `NEEDS_REVIEW` | Evidence is incomplete or conflicting; a human should review it |
| `REJECTED` | The heuristic combined score is very low; do not treat this as a final legal decision |

## Local setup on macOS

### 1. Create and activate the virtual environment

From the repository root:

```bash
cd services/ai-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Install native QR dependency

`pyzbar` requires the native `zbar` library for QR/barcode decoding.

Apple Silicon Homebrew:

```bash
brew install zbar
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:${DYLD_LIBRARY_PATH}"
export ZBAR_LIBRARY="/opt/homebrew/lib/libzbar.0.dylib"
```

Intel macOS Homebrew usually uses `/usr/local/lib` instead:

```bash
brew install zbar
export DYLD_LIBRARY_PATH="/usr/local/lib:${DYLD_LIBRARY_PATH}"
export ZBAR_LIBRARY="/usr/local/lib/libzbar.0.dylib"
```

Copy the example configuration if needed:

```bash
cp .env.example .env
```

Update `ZBAR_LIBRARY` in `.env` to match the Homebrew path on the machine.

### 3. Start the service

From the repository root:

```bash
./services/ai-service/.venv/bin/python services/ai-service/main.py
```

Or from the AI-service directory:

```bash
cd services/ai-service
python main.py
```

The service is available at:

```text
http://localhost:8000
```

Interactive API documentation is available at `/docs` when the service is running.

## Docker setup

The repository Docker Compose configuration installs the native `zbar` dependency automatically:

```bash
docker compose -f docker/docker-compose.yml up --build ai-service
```

The container exposes port `8000` and uses `/app/uploads` for stored files. Health check:

```bash
curl http://localhost:8000/api/ai/health
```

## Configuration

Configuration is loaded from environment variables in [`app/config.py`](app/config.py).

| Variable | Default | Purpose |
|---|---:|---|
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | HTTP port |
| `UPLOAD_DIR` | `uploads` | Saved upload directory |
| `OCR_LANG` | `en` | PaddleOCR language |
| `OCR_USE_GPU` | `false` | Enable GPU OCR when supported |
| `ELA_THRESHOLD` | `12.0` | ELA suspicion threshold |
| `NOISE_STD_THRESHOLD` | `18.0` | Noise inconsistency threshold |
| `COPY_MOVE_MIN_MATCHES` | `30` | Copy-move match threshold |
| `BLUR_THRESHOLD` | `80.0` | Blur threshold |
| `ZBAR_LIBRARY` | empty | Optional native zbar library path |

## Verification pipeline

The request is processed in this order:

1. Validate extension, document type, and file size.
2. Save the image to `UPLOAD_DIR`.
3. Preprocess, resize, denoise, normalize brightness, enhance contrast, and deskew.
4. Run PaddleOCR and extract document-specific fields.
5. Decode QR/barcode data using `pyzbar`, original-resolution variants, overlapping crops, and OpenCV fallback.
6. Cross-check QR values with OCR fields when a QR payload is decoded.
7. Validate Aadhaar, PAN, GST, date, name, address, and required fields.
8. Run ELA, copy-move, noise, blur, edge, color, and compression checks.
9. Return the complete result and final status.

## Testing and smoke checks

Compile all Python files:

```bash
./.venv/bin/python -m compileall -q .
```

Run a local verification request:

```bash
./.venv/bin/python - <<'PY'
from pathlib import Path
from app.services.verification_service import verify_document

result = verify_document(
    str(Path("uploads/test-document.jpg")),
    "AADHAAR",
)
print(result["summary"])
PY
```

Run the command from `services/ai-service` after activating the virtual environment.

## Important limitations

- OCR extraction is layout- and image-quality-dependent. Use clear, original images where possible.
- QR decoding may fail on WhatsApp-compressed, blurry, cropped, or low-resolution images. The native `zbar` dependency must be installed for the `pyzbar` path.
- A QR region being visible does not guarantee that its payload can be recovered.
- Forgery detection is heuristic. Repeated logos, QR regions, panels, and form elements can resemble copy-move edits; structured-document scoring is intentionally conservative.
- `VERIFIED` means the configured checks passed. It does not establish government-side validity or guarantee authenticity.
- Do not commit real Aadhaar, PAN, or other identity documents to Git. Use redacted or synthetic fixtures for development and tests.
- Restrict CORS, protect the service behind the API gateway, add authentication, and use secure storage before production deployment.

## Integration with the Node auth service

The Node auth service calls:

```text
POST ${AI_SERVICE_URL}/api/ai/verify
```

It sends the uploaded file as `file` and the selected type as `document_type`. In Docker Compose, the expected service URL is:

```text
AI_SERVICE_URL=http://ai-service:8000
```

The Node service stores the returned OCR, QR, validation, forgery, and summary fields with the document record.
