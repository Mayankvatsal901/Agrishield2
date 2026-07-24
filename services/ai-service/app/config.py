import os
from dotenv import load_dotenv

load_dotenv()

# ── Server ────────────────────────────────────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# ── Upload storage (shared volume with Node service) ─────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# ── OCR ───────────────────────────────────────────────────────────────────────
OCR_LANG = os.getenv("OCR_LANG", "en")          # PaddleOCR language
OCR_USE_GPU = os.getenv("OCR_USE_GPU", "false").lower() == "true"

# ── Forgery thresholds ────────────────────────────────────────────────────────
# ELA (Error Level Analysis) — mean pixel error above this is suspicious
ELA_THRESHOLD = float(os.getenv("ELA_THRESHOLD", "12.0"))

# Noise inconsistency — std-dev of local noise map above this is suspicious
NOISE_STD_THRESHOLD = float(os.getenv("NOISE_STD_THRESHOLD", "18.0"))

# Copy-move — minimum matched keypoints to flag copy-move
COPY_MOVE_MIN_MATCHES = int(os.getenv("COPY_MOVE_MIN_MATCHES", "30"))

# Blur — Laplacian variance below this is considered blurred
BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", "80.0"))

# Authenticity score weights (must sum to 1.0)
WEIGHT_ELA        = 0.25
WEIGHT_NOISE      = 0.20
WEIGHT_COPY_MOVE  = 0.20
WEIGHT_BLUR       = 0.10
WEIGHT_EDGE       = 0.10
WEIGHT_COLOR      = 0.15
