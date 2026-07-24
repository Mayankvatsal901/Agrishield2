"""
main.py  —  FastAPI entry point for the AI Verification Service
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import HOST, PORT
from app.routes.verify import router as verify_router

app = FastAPI(
    title="AgriShield AI Verification Service",
    description="Document OCR, QR extraction, field validation and forgery detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten in production to Node service origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(verify_router, prefix="/api/ai", tags=["verification"])


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
