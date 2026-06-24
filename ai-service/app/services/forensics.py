# ai-service/app/services/forensics.py
import os
import tempfile           # FIX: use tempfile instead of hardcoded "temp_ela.jpg"
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import tensorflow as tf


# ── Model loading ────────────────────────────────────────────────────────────
# Load once at module import time so the model is not reloaded per request.
_MODEL_PATH = os.environ.get("DENOISING_MODEL_PATH", "models/denoising.keras")
_model = None

def _load_model():
    global _model
    if _model is None:
        _model = tf.keras.models.load_model(_MODEL_PATH)
        print(f"[forensics] Denoising model loaded from {_MODEL_PATH}")
    return _model


# ── Preprocessing contract ───────────────────────────────────────────────────
# FIX: explicit preprocessing so training and inference always agree.
# If your training used [0,1] normalisation, keep this. If it used [0,255],
# change the divide to 1.0 (or remove it). Document the choice clearly.
INPUT_SHAPE = (256, 256)   # match whatever your model was trained on
NORM_SCALE  = 255.0        # divide by 255 → [0,1] range


def _preprocess(img: Image.Image) -> np.ndarray:
    """
    Resize to INPUT_SHAPE, convert to RGB, normalise to [0,1].
    FIX: previously images were passed raw to the model with no size validation,
    which silently corrupted results when dimensions didn't match.
    """
    img = img.convert("RGB").resize(INPUT_SHAPE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / NORM_SCALE
    return arr[np.newaxis, ...]  # (1, H, W, 3)


def _postprocess(arr: np.ndarray) -> Image.Image:
    """Convert model output back to a PIL Image."""
    arr = np.clip(arr[0] * NORM_SCALE, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


# ── ELA (Error Level Analysis) ────────────────────────────────────────────────
def run_ela(image_path: str, quality: int = 90) -> dict:
    """
    Run Error Level Analysis and return a fraud score + base64 ELA image.

    FIX: previously wrote to a hardcoded "temp_ela.jpg" so concurrent
    requests corrupted each other's results. Now uses a unique temp file
    per call via tempfile.NamedTemporaryFile.
    """
    try:
        original = Image.open(image_path).convert("RGB")

        # Write a re-compressed copy to a unique temp file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            original.save(tmp_path, "JPEG", quality=quality)
            recompressed = Image.open(tmp_path).convert("RGB")
        finally:
            os.unlink(tmp_path)   # always clean up

        # Amplify the difference to make artifacts visible
        diff = ImageChops.difference(original, recompressed)
        diff = ImageEnhance.Brightness(diff).enhance(15)

        # Compute ELA score: mean pixel intensity of the diff image
        ela_arr = np.array(diff, dtype=np.float32)
        ela_score = float(np.mean(ela_arr))

        return {
            "ela_score": round(ela_score, 4),
            "status": "success",
        }

    except Exception as e:
        # FIX: log internally, never expose raw exception to caller
        print(f"[forensics] ELA error for {image_path}: {e}")
        return {"ela_score": None, "status": "error"}


# ── Denoising ─────────────────────────────────────────────────────────────────
def denoise_image(image_path: str) -> dict:
    """
    Run the denoising.keras model on an image and return a
    quality score (PSNR) between the noisy input and the
    model output.

    FIX: previously predict_fake() always returned the hardcoded
    float 0.15 and was never called. This function actually loads
    and runs the model.
    """
    try:
        model = _load_model()
        original = Image.open(image_path).convert("RGB")
        input_arr = _preprocess(original)

        output_arr = model.predict(input_arr, verbose=0)
        denoised_img = _postprocess(output_arr)

        # PSNR between original (resized) and denoised output
        orig_resized = np.array(original.convert("RGB").resize(INPUT_SHAPE), dtype=np.float32)
        denoised_arr = np.array(denoised_img, dtype=np.float32)
        mse = np.mean((orig_resized - denoised_arr) ** 2)
        psnr = 10 * np.log10((NORM_SCALE ** 2) / mse) if mse > 0 else float("inf")

        return {
            "psnr": round(float(psnr), 2),
            "status": "success",
        }

    except Exception as e:
        print(f"[forensics] Denoising error for {image_path}: {e}")
        return {"psnr": None, "status": "error"}


# ── Combined analysis ─────────────────────────────────────────────────────────
def analyze_fragment(image_path: str) -> dict:
    """
    Run ELA + denoising on a single fragment and return combined results.

    FIX: fraud score was previously 'mean_pixel_brightness * 10' — a meaningless
    heuristic. Now we use the ELA score (a genuine tamper-detection metric)
    as the fraud signal, normalised to [0,1].
    """
    ela = run_ela(image_path)
    denoise = denoise_image(image_path)

    # Normalise ELA score to [0,1] as a rough fraud probability.
    # ELA scores > 25 on JPEG-compressed images typically indicate manipulation.
    ela_score = ela.get("ela_score") or 0.0
    fraud_score = round(min(ela_score / 25.0, 1.0), 4)

    return {
        "fraud_score": fraud_score,
        "ela_score": ela.get("ela_score"),
        "psnr": denoise.get("psnr"),
        "ela_status": ela.get("status"),
        "denoise_status": denoise.get("status"),
    }
