# ai-service/main.py
import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
import shutil
import tempfile

from app.services.forensics import analyze_fragment
from app.services.ocr import run_ocr, get_ocr_details

# ── API-key auth ──────────────────────────────────────────────────────────────
# FIX: AI service previously had zero auth — CORS wildcard, no key checks.
# Now every request must present a matching X-API-Key header.
API_KEY = os.environ.get("AI_SERVICE_API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(key: str = Depends(api_key_header)):
    if not API_KEY:
        raise RuntimeError("AI_SERVICE_API_KEY environment variable is not set.")
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")
    return key


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="ASDAS AI Service", docs_url=None, redoc_url=None)  # hide docs in prod

# FIX: CORS locked to the backend's origin only. Previously allow_origins=["*"].
ALLOWED_ORIGINS = [
    os.environ.get("BACKEND_URL", "http://localhost:5000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/analyze", dependencies=[Depends(verify_api_key)])
async def analyze(file: UploadFile = File(...)):
    """
    Accepts an image or PDF upload, runs ELA + denoising, returns analysis.
    """
    # Validate content type
    ALLOWED = {"image/jpeg", "image/png", "image/tiff", "image/webp", "application/pdf"}
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Write to a unique temp file so concurrent requests never collide
    suffix = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = analyze_fragment(tmp_path)
    except Exception as e:
        # FIX: never send str(e) to clients — log internally, return generic message
        print(f"[main] analyze error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")
    finally:
        os.unlink(tmp_path)

    return result


@app.post("/ocr", dependencies=[Depends(verify_api_key)])
async def ocr(file: UploadFile = File(...)):
    """Extract text from a document fragment."""
    suffix = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # FIX: now calls get_ocr_details() which was defined but never used
        result = get_ocr_details(tmp_path)
    except Exception as e:
        print(f"[main] OCR error: {e}")
        raise HTTPException(status_code=500, detail="OCR failed. Please try again.")
    finally:
        os.unlink(tmp_path)

    return result


@app.get("/health")
def health():
    return {"status": "ok"}
