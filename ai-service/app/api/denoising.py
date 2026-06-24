"""
Denoising API Router
--------------------
POST /denoise
  Accepts a noisy document image, runs the autoencoder, returns the
  denoised image as a PNG download.

POST /denoise/base64
  Same pipeline but returns the denoised image as a base64-encoded string
  (useful for the React frontend to display inline without a second fetch).
"""

import os
import base64
import shutil
import time
import logging

import cv2
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from app.utils.denoiser import denoise_image, denoise_image_to_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/denoise", tags=["denoising"])

UPLOAD_DIR = "temp_uploads"
OUTPUT_DIR = "temp_outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def _save_upload(file: UploadFile) -> str:
    """Saves the uploaded file to UPLOAD_DIR with a unique name."""
    safe_name = f"{int(time.time() * 1000)}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, safe_name)
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return path


def _get_model(request: Request):
    """Retrieves the denoiser from app state; raises 503 if not loaded."""
    model = getattr(request.app.state, "denoiser", None)
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Denoiser model is not loaded. "
                "Place 'models/denoiser.keras' in the ai-service root and restart."
            ),
        )
    return model


# ---------------------------------------------------------------------------
# POST /denoise  →  PNG file download
# ---------------------------------------------------------------------------

@router.post(
    "",
    summary="Denoise a document image",
    response_description="Denoised image as a PNG file",
)
async def denoise_document(request: Request, file: UploadFile = File(...)):
    """
    Upload a degraded/noisy document image.
    Returns the autoencoder-denoised image as a downloadable PNG.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    model = _get_model(request)
    input_path = _save_upload(file)

    try:
        output_path = denoise_image_to_file(input_path, model, OUTPUT_DIR)
        return FileResponse(
            output_path,
            media_type="image/png",
            filename=f"denoised_{file.filename}",
        )
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during denoising")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)


# ---------------------------------------------------------------------------
# POST /denoise/base64  →  JSON with base64 image
# ---------------------------------------------------------------------------

@router.post(
    "/base64",
    summary="Denoise and return base64",
    response_description="JSON with base64-encoded denoised PNG",
)
async def denoise_document_base64(request: Request, file: UploadFile = File(...)):
    """
    Same as POST /denoise but returns:
    ```json
    {
      "filename": "original_name.jpg",
      "denoised_image": "<base64-encoded PNG>",
      "content_type": "image/png",
      "timestamp": 1234567890.0
    }
    ```
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted.")

    model = _get_model(request)
    input_path = _save_upload(file)

    try:
        denoised_arr = denoise_image(input_path, model)

        # Encode to PNG bytes in memory (avoids writing a temp file)
        success, buf = cv2.imencode(".png", denoised_arr)
        if not success:
            raise ValueError("cv2 failed to encode denoised image to PNG.")

        b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        return JSONResponse(
            content={
                "filename": file.filename,
                "denoised_image": b64,
                "content_type": "image/png",
                "timestamp": time.time(),
            }
        )
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during denoising (base64)")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
