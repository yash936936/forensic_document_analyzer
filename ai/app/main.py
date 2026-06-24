"""
ai-service/app/main.py

"""

import os
import shutil
import time
import logging
import httpx

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# ── Fixed imports: use the correct module paths ──────────────────────────────
from app.services.forensics import analyze_fragment   # FIX: was calling undefined functions
from app.utils.ocr import extract_text, get_ocr_confidence  # FIX: was never imported
from app.utils.denoiser import load_denoiser
from app.api.denoising import router as denoising_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Forensic Document Analyzer — AI Service",
    version="3.0.0",
    description="ELA fraud scoring, Tesseract OCR, denoising, and AI summarization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Lock to your Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ──────────────────────────────────────────────────────────────────

MODEL_PATH = os.getenv("DENOISER_MODEL_PATH", "app/models/denoiser.keras")
UPLOAD_DIR = "temp_uploads"  # FIX: create BEFORE routers are registered
os.makedirs(UPLOAD_DIR, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


@app.on_event("startup")
async def startup_event():
    app.state.denoiser = load_denoiser(MODEL_PATH)
    if app.state.denoiser is None:
        logger.warning("Denoiser not loaded — place model at '%s' and restart.", MODEL_PATH)
    else:
        logger.info("Denoiser model ready.")


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(denoising_router)

# ── Summarization helpers ─────────────────────────────────────────────────────

async def _summarize_with_gemini(text: str) -> str:
    """Primary summarization via Google Gemini API."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    prompt = (
        "You are a forensic document analyst. Summarize the following extracted document text "
        "in 3-5 sentences. Focus on: what type of document it appears to be, key information "
        "present, and any notable observations. If the text is fragmented or damaged, note that "
        "and summarize what can be determined.\n\n"
        f"Document text:\n{text[:4000]}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 300, "temperature": 0.3},
    }

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


async def _summarize_with_claude(text: str) -> str:
    """Fallback summarization via Anthropic Claude API."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 300,
                "messages": [{
                    "role": "user",
                    "content": (
                        "Summarize the following extracted document text in 3-5 sentences. "
                        "Focus on document type, key information, and any observations about "
                        "damage or fragmentation.\n\n"
                        f"Document text:\n{text[:4000]}"
                    ),
                }],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"].strip()


async def summarize_text(text: str) -> str:
    """
    Try Gemini first, fall back to Claude, return empty string if both fail.
    This is the PI key fallback pattern requested.
    """
    if not text or len(text.strip()) < 30:
        return ""

    # Primary: Gemini
    if GEMINI_API_KEY:
        try:
            return await _summarize_with_gemini(text)
        except Exception as e:
            logger.warning("Gemini summarization failed: %s — trying Claude fallback", e)

    # Fallback: Claude
    if ANTHROPIC_API_KEY:
        try:
            return await _summarize_with_claude(text)
        except Exception as e:
            logger.warning("Claude summarization fallback also failed: %s", e)

    return ""


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    denoiser_status = "loaded" if getattr(app.state, "denoiser", None) else "not_loaded"
    return {
        "status": "online",
        "service": "Forensic Document Analyzer AI",
        "version": "3.0.0",
        "denoiser": denoiser_status,
        "gemini_key_set": bool(GEMINI_API_KEY),
        "anthropic_key_set": bool(ANTHROPIC_API_KEY),
        "timestamp": time.time(),
    }


ACCEPTED_TYPES = {
    "image/jpeg", "image/png", "image/tiff", "image/webp",
    "image/bmp", "application/pdf",
}


@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Full forensic pipeline:
      1. Save upload to temp file
      2. ELA fraud scoring (images only)
      3. Tesseract OCR + confidence score (images + PDFs)
      4. AI summarization via Gemini → Claude fallback
      5. Return all results as JSON

    Response shape:
      filename, extractedText, ocrConfidence, fraudScore, elaScore,
      isFraudulent, summary, ocrSource, timestamp
    """
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Accepted: JPEG, PNG, TIFF, WEBP, BMP, PDF",
        )

    # Save to unique temp path — avoids concurrent-request collisions
    ext = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    file_path = os.path.join(UPLOAD_DIR, f"{int(time.time() * 1000)}_{file.filename}{ext}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. OCR text extraction
        try:
            extracted_text = extract_text(file_path)
        except Exception as e:
            logger.warning("OCR extract_text failed: %s", e)
            extracted_text = ""

        # 2. OCR confidence score
        try:
            ocr_confidence = get_ocr_confidence(file_path) if extracted_text else 0.0
        except Exception as e:
            logger.warning("OCR confidence failed: %s", e)
            ocr_confidence = 0.0

        # 3. ELA fraud scoring (images only — PDFs skip ELA)
        fraud_score = None
        ela_score = None
        is_fraudulent = False

        if not content_type.endswith("/pdf"):
            try:
                forensics = analyze_fragment(file_path)
                fraud_score   = forensics.get("fraud_score")
                ela_score     = forensics.get("ela_score")
                is_fraudulent = forensics.get("is_fraudulent", False)
            except Exception as e:
                logger.warning("ELA forensics failed: %s", e)

        # 4. AI summarization (Gemini primary → Claude fallback)
        summary = await summarize_text(extracted_text)

        # 5. Determine OCR source label
        ocr_source = "tesseract" if extracted_text else "none"

        return {
            "filename":      file.filename,
            "extractedText": extracted_text,
            "ocrConfidence": ocr_confidence,
            "fraudScore":    fraud_score,
            "elaScore":      ela_score,
            "isFraudulent":  is_fraudulent,
            "summary":       summary,
            "ocrSource":     ocr_source,
            "timestamp":     time.time(),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /analyze for %s", file.filename)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)