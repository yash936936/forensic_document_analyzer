"""
forensics.py — ELA fraud scoring

"""

import os
import tempfile
import logging
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

logger = logging.getLogger(__name__)


def run_ela(image_path: str, quality: int = 90) -> dict:
    """
    Error Level Analysis — detects JPEG compression inconsistencies.

    A high ELA score indicates regions of the image were re-saved at a
    different quality level, which is a common indicator of tampering.

    Returns:
        ela_score (float): mean pixel intensity of the ELA difference image.
        status (str): "success" | "error"
    """
    try:
        original = Image.open(image_path).convert("RGB")

        # Write re-compressed copy to a UNIQUE temp file (fixes race condition)
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            original.save(tmp_path, "JPEG", quality=quality)
            recompressed = Image.open(tmp_path).convert("RGB")
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        # Amplify difference so artifacts are visible
        diff = ImageChops.difference(original, recompressed)
        diff = ImageEnhance.Brightness(diff).enhance(15)

        ela_arr = np.array(diff, dtype=np.float32)
        ela_score = float(np.mean(ela_arr))

        return {"ela_score": round(ela_score, 4), "status": "success"}

    except Exception as e:
        logger.warning("ELA failed for %s: %s", image_path, e)
        return {"ela_score": None, "status": "error"}


def analyze_fragment(image_path: str) -> dict:
    """
    Run ELA on a document fragment and return all metrics.

    fraud_score is normalised to [0, 1]:
      ELA > 25 on JPEG documents reliably indicates manipulation.
      We clamp at 1.0 to keep the scale intuitive.

    Returns dict with keys:
      fraud_score, ela_score, is_fraudulent, ela_status
    """
    ela = run_ela(image_path)
    ela_score = ela.get("ela_score") or 0.0

    # Normalise: ELA 0→25+ maps to fraud 0→1
    fraud_score = round(min(ela_score / 25.0, 1.0), 4)

    return {
        "fraud_score":   fraud_score,
        "ela_score":     ela.get("ela_score"),
        "is_fraudulent": fraud_score > 0.5,
        "ela_status":    ela.get("status"),
    }