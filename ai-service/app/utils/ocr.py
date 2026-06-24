import pytesseract
from PIL import Image
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Tesseract path from .env
tesseract_path = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

def extract_text(image_path):
    """
    Extracts text from an image using Tesseract OCR.
    """
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        return f"OCR Error: {str(e)}"

def get_ocr_details(image_path):
    """
    Returns detailed OCR data including bounding boxes.
    """
    try:
        image = Image.open(image_path)
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        return data
    except Exception as e:
        return {"error": str(e)}
