"""
ocr.py — Tesseract OCR wrapper

"""

import os
import logging
import pytesseract
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ── Tesseract path resolution (Linux first, then Windows, then env) ───────────
_ENV_PATH   = os.getenv("TESSERACT_PATH", "")
_LINUX_PATH = "/usr/bin/tesseract"
_WIN_PATH   = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if _ENV_PATH and os.path.exists(_ENV_PATH):
    pytesseract.pytesseract.tesseract_cmd = _ENV_PATH
    logger.info("Tesseract from TESSERACT_PATH env: %s", _ENV_PATH)
elif os.path.exists(_LINUX_PATH):
    pytesseract.pytesseract.tesseract_cmd = _LINUX_PATH
    logger.info("Tesseract auto-detected (Linux): %s", _LINUX_PATH)
elif os.path.exists(_WIN_PATH):
    pytesseract.pytesseract.tesseract_cmd = _WIN_PATH
    logger.info("Tesseract auto-detected (Windows): %s", _WIN_PATH)
else:
    logger.warning(
        "Tesseract not found. OCR will return empty strings. "
        "Set TESSERACT_PATH env var or install via: apt-get install -y tesseract-ocr"
    )


def _open_image(image_path: str) -> list[Image.Image]:
    """
    Open an image path and return a list of PIL Images.
    PDF files are converted page-by-page using pdf2image.
    Regular images return a single-item list.
    """
    if image_path.lower().endswith(".pdf"):
        try:
            from pdf2image import convert_from_path
            pages = convert_from_path(image_path, dpi=200)
            logger.info("PDF converted: %d page(s)", len(pages))
            return pages
        except ImportError:
            logger.warning("pdf2image not installed — cannot process PDF. pip install pdf2image poppler-utils")
            return []
        except Exception as e:
            logger.warning("PDF conversion failed: %s", e)
            return []
    else:
        try:
            return [Image.open(image_path)]
        except Exception as e:
            logger.warning("Cannot open image %s: %s", image_path, e)
            return []


def extract_text(image_path: str) -> str:
    """
    Extract all text from an image or PDF using Tesseract OCR.
    Returns empty string on failure (frontend Claude Vision fallback triggers).
    """
    pages = _open_image(image_path)
    if not pages:
        return ""

    texts = []
    for page in pages:
        try:
            text = pytesseract.image_to_string(page)
            if text.strip():
                texts.append(text.strip())
        except Exception as e:
            logger.warning("Tesseract extract_text failed on page: %s", e)

    return "\n\n".join(texts)


def get_ocr_confidence(image_path: str) -> float:
    """
    Returns mean OCR confidence (0.0 – 100.0) across all detected words.
    Words with confidence -1 (unknown) are excluded from the average.
    Returns 0.0 if OCR fails or finds no words.
    """
    pages = _open_image(image_path)
    if not pages:
        return 0.0

    all_confidences = []
    for page in pages:
        try:
            data = pytesseract.image_to_data(page, output_type=pytesseract.Output.DICT)
            confs = [c for c in data.get("conf", []) if isinstance(c, (int, float)) and c >= 0]
            all_confidences.extend(confs)
        except Exception as e:
            logger.warning("Tesseract confidence check failed: %s", e)

    if not all_confidences:
        return 0.0

    return round(sum(all_confidences) / len(all_confidences), 1)


def get_ocr_details(image_path: str) -> dict:
    """
    Returns full Tesseract word-level data (bounding boxes, confidence per word).
    Used for future overlay / highlighting features.
    """
    pages = _open_image(image_path)
    if not pages:
        return {"error": "Could not open file", "text": "", "confidence": 0.0}

    try:
        data = pytesseract.image_to_data(pages[0], output_type=pytesseract.Output.DICT)
        text = extract_text(image_path)
        confidence = get_ocr_confidence(image_path)
        return {
            "text": text,
            "confidence": confidence,
            "word_data": data,
        }
    except Exception as e:
        logger.warning("get_ocr_details failed: %s", e)
        return {"error": str(e), "text": "", "confidence": 0.0}