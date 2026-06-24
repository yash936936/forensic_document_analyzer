# Forensic Document Analyzer

A single-page tool for extracting text from shredded, torn, or degraded documents. Upload an image or PDF — the pipeline denoises it, scores it for tampering, runs OCR, and summarizes the content using AI.

---

## What it does

1. **Denoises** the uploaded document using a trained Keras convolutional autoencoder
2. **Scores for tampering** using Error Level Analysis (ELA) — detects JPEG compression inconsistencies that indicate digital manipulation
3. **Extracts text** via Tesseract OCR with a confidence percentage
4. **Falls back to Claude Vision** if Tesseract returns empty results (damaged documents, poor scan quality)
5. **Summarizes** the document using Gemini API (primary) or Claude API (fallback)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Framer Motion |
| AI service | Python, FastAPI, Uvicorn |
| Denoising model | TensorFlow / Keras (convolutional autoencoder) |
| OCR | Tesseract via pytesseract |
| Fraud detection | ELA (Error Level Analysis) via Pillow + NumPy |
| Summarization | Google Gemini API → Anthropic Claude fallback |
| OCR fallback | Anthropic Claude Vision API |
| Styling | xAI design system (inline styles, Inter + GeistMono) |

---

## Project structure

```
forensic_document_analyzer/
│
├── frontend/                        ← React single-page app (Vite)
│   ├── src/
│   │   ├── App.jsx                  ← Root — mounts DocumentScanner
│   │   ├── DocumentScanner.jsx      ← Entire UI: upload, pipeline, results
│   │   ├── index.css                ← xAI global reset + font imports
│   │   ├── main.jsx                 ← Vite entry point
│   │   ├── context/
│   │   │   └── ToastContext.jsx     ← Toast notifications
│   │   └── services/
│   │       └── denoisingService.js  ← API calls (denoise, analyze)
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json                  ← Vercel deployment config
│   ├── package.json
│   └── .env.example
│
├── ai-service/                      ← Python FastAPI microservice
│   ├── app/
│   │   ├── main.py                  ← FastAPI app + /analyze endpoint
│   │   ├── api/
│   │   │   └── denoising.py         ← POST /denoise, POST /denoise/base64
│   │   ├── services/
│   │   │   └── forensics.py         ← ELA fraud scoring
│   │   ├── utils/
│   │   │   ├── ocr.py               ← Tesseract OCR + confidence score
│   │   │   └── denoiser.py          ← Keras model loader + chunk pipeline
│   │   └── models/
│   │       └── denoiser.keras       ← Trained autoencoder weights
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml
│   └── .env.example
│
└── export_model.py                  ← Export retrained model to .keras format
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- Tesseract OCR installed on your system
- A trained `denoiser.keras` model in `ai-service/app/models/`

**Install Tesseract:**

Windows: download from https://github.com/UB-Mannheim/tesseract/wiki

Ubuntu / Railway:
```bash
apt-get install -y tesseract-ocr
```

---

## Setup

### 1. AI service

```bash
cd ai-service
python -m venv venv
```

Activate the virtual environment:

Windows (Command Prompt):
```cmd
venv\Scripts\activate
```

Mac / Linux:
```bash
source venv/bin/activate
```

Install dependencies and start:
```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The service starts at `http://localhost:8000`.

### 2. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## Environment variables

### `ai-service/.env`

Copy `.env.example` to `.env`:

```env
# Path to your trained Keras autoencoder
DENOISER_MODEL_PATH=app/models/denoiser.keras

# Tesseract binary path
# Leave blank on Linux — auto-detected at /usr/bin/tesseract
# Windows: C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_PATH=

# Summarization — at least one key recommended
GEMINI_API_KEY=your_gemini_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### `frontend/.env.local`

Copy `.env.example` to `.env.local`:

```env
# URL of the ai-service
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check — returns service status and model state |
| POST | `/analyze` | Full pipeline: OCR + ELA fraud scoring + AI summary |
| POST | `/denoise` | Denoise image → returns PNG download |
| POST | `/denoise/base64` | Denoise image → returns base64 JSON |

### `POST /analyze` response

```json
{
  "filename": "document.jpg",
  "extractedText": "...",
  "ocrConfidence": 84.3,
  "fraudScore": 0.12,
  "elaScore": 3.04,
  "isFraudulent": false,
  "summary": "This appears to be a...",
  "ocrSource": "tesseract",
  "timestamp": 1234567890.0
}
```

---

## Analysis pipeline

```
Upload (image or PDF)
        │
        ▼
  Denoising (Keras autoencoder)
  — splits image into 32×32 patches
  — runs each patch through the model
  — reassembles into clean image
        │
        ▼
  ELA Fraud Scoring (images only)
  — re-compresses image at quality 90
  — amplifies pixel difference ×15
  — mean pixel intensity → fraud score 0–1
        │
        ▼
  Tesseract OCR
  — extracts text from image or PDF pages
  — returns confidence % per word
        │
        ├── text found → AI Summarization
        │               (Gemini → Claude fallback)
        │
        └── no text → Claude Vision fallback OCR
                      (sends image to Anthropic API)
        │
        ▼
  Results displayed:
  fraud score · OCR confidence · ELA score · character count
  denoised image comparison · extracted text · AI summary
```

---

## Deploying

### Frontend → Vercel

```bash
cd frontend
npm run build
```

Push to GitHub and connect the `frontend/` folder to Vercel. Set the environment variable:

```
VITE_AI_SERVICE_URL=https://your-ai-service.up.railway.app
```

### AI service → Railway

Connect the `ai-service/` folder to Railway. The `railway.toml` and `Dockerfile` handle the build. Set these environment variables in the Railway dashboard:

```
DENOISER_MODEL_PATH=app/models/denoiser.keras
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Retraining the model

After retraining in the notebook:

```bash
python export_model.py
```

This exports the updated weights to `ai-service/app/models/denoiser.keras`. Restart the ai-service to load the new model.

---

## Supported file formats

| Format | Denoising | OCR | ELA fraud scoring |
|---|---|---|---|
| JPEG | yes | yes | yes |
| PNG | yes | yes | yes |
| WEBP | yes | yes | yes |
| TIFF | yes | yes | yes |
| BMP | yes | yes | yes |
| PDF | no | yes (all pages) | no |

Maximum upload size: 50 MB.