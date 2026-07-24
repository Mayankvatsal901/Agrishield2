#!/bin/bash
# start.sh — use this instead of `python main.py` on macOS (Homebrew arm64)
# Sets DYLD_LIBRARY_PATH so pyzbar can find libzbar before Python starts.

export DYLD_LIBRARY_PATH="/opt/homebrew/lib:${DYLD_LIBRARY_PATH}"
export ZBAR_LIBRARY="/opt/homebrew/lib/libzbar.0.dylib"

cd services/ai-service
source .venv/bin/activate
exec python main.py "$@"
EOF
