"""
ASDAS AI Forensic Service — main.py
------------------------------------
Mounts:
  GET  /                  health check
  POST /analyze           ELA fraud scoring + OCR  (existing)
  POST /denoise           autoencoder denoising    (NEW)
  POST /denoise/base64    same, returns base64 JSON (NEW)
"""

import os
import shutil
import time
import logging

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.services.forensics import analyze_fragment
from app.utils.ocr import  get_ocr_details
from app.utils.denoiser import load_denoiser
from app.api.denoising import router as denoising_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="ASDAS AI Forensic Service",
    version="2.0.0",
    description=(
        "Document forensics: ELA fraud scoring, OCR text extraction, "
        "and autoencoder-based document denoising."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production — see audit report #5
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: load the denoiser model once into app.state
# ---------------------------------------------------------------------------

MODEL_PATH = os.getenv("DENOISER_MODEL_PATH", "models/denoiser.keras")


@app.on_event("startup")
async def startup_event():
    app.state.denoiser = load_denoiser(MODEL_PATH)
    if app.state.denoiser is None:
        logger.warning(
            "Denoiser not loaded. Train the model and export it to '%s'.",
            MODEL_PATH,
        )
    else:
        logger.info("Denoiser model ready.")


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(denoising_router)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Existing endpoints (unchanged)
# ---------------------------------------------------------------------------


@app.get("/")
async def root():
    denoiser_status = "loaded" if getattr(app.state, "denoiser", None) else "not_loaded"
    return {
        "status": "online",
        "service": "ASDAS AI Engine",
        "version": "2.0.0",
        "denoiser": denoiser_status,
        "timestamp": time.time(),
    }


@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Existing forensic analysis endpoint.
    ELA fraud scoring + Tesseract OCR.

    Bug note (from audit): uses a hardcoded 'temp_ela.jpg' path which
    causes race conditions under concurrent load. Fix: use tempfile.mkstemp.
    That fix is tracked separately; this file preserves current behaviour.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    file_path = os.path.join(UPLOAD_DIR, f"{int(time.time())}_{file.filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extracted_text = extract_text(file_path)
        fraud_score = calculate_fraud_score(file_path)
        is_fraudulent = fraud_score > 50

        return {
            "filename": file.filename,
            "fraudScore": fraud_score,
            "isFraudulent": is_fraudulent,
            "extractedText": extracted_text,
            "analysisType": "Forensic ELA + OCR",
            "timestamp": time.time(),
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
