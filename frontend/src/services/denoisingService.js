/**
 * denoisingService.js
 
 */

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";

export async function denoiseDocument(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${AI_BASE_URL}/denoise`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Denoising failed");
  }
  return URL.createObjectURL(await res.blob());
}

/**
 * Denoise a document image — returns a base64 data URI.
 * Ideal for <img src="…"> display without a second fetch.
 */
export async function denoiseToBase64(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${AI_BASE_URL}/denoise/base64`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Denoising (base64) failed");
  }
  const data = await res.json();
  return `data:${data.content_type};base64,${data.denoised_image}`;
}

/**
 * Full forensic analysis — OCR + ELA fraud scoring + summarization.
 *
 * Returns:
 *   extractedText   (string)   — Tesseract OCR output
 *   ocrConfidence   (number)   — 0–100 mean word confidence
 *   fraudScore      (number)   — 0–1 ELA-based tamper probability
 *   elaScore        (number)   — raw ELA mean pixel value
 *   isFraudulent    (boolean)  — fraudScore > 0.5
 *   summary         (string)   — AI-generated document summary
 *   ocrSource       (string)   — "tesseract" | "none"
 */
export async function analyzeDocument(file) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${AI_BASE_URL}/analyze`, { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Analysis failed");
  }

  const data = await res.json();

  // Normalise field names — handle both camelCase and snake_case from API
  return {
    extractedText:  data.extractedText  ?? data.extracted_text  ?? "",
    ocrConfidence:  data.ocrConfidence  ?? data.ocr_confidence  ?? 0,
    fraudScore:     data.fraudScore     ?? data.fraud_score     ?? null,
    elaScore:       data.elaScore       ?? data.ela_score       ?? null,
    isFraudulent:   data.isFraudulent   ?? data.is_fraudulent   ?? false,
    summary:        data.summary        ?? "",
    ocrSource:      data.ocrSource      ?? data.ocr_source      ?? "tesseract",
  };
}