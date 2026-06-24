/**
 * denoisingService.js
 * -------------------
 * Thin API wrapper for the ai-service /denoise endpoints.
 * Drop this file into ASDAS/src/services/ and import where needed.
 *
 * Usage:
 *   import { denoiseDocument, denoiseToBase64 } from './denoisingService';
 *
 *   // returns a blob URL you can set as <img src={url} />
 *   const url = await denoiseDocument(file);
 *
 *   // returns a base64 data URI
 *   const dataUri = await denoiseToBase64(file);
 */

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Sends a File/Blob to POST /denoise and returns an object URL
 * pointing at the returned PNG.  Revoke the URL when done to free memory.
 *
 * @param {File} file  - The image file to denoise.
 * @returns {Promise<string>}  Object URL (e.g. "blob:http://...")
 */
export async function denoiseDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${AI_BASE_URL}/denoise`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Denoising failed');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Sends a File/Blob to POST /denoise/base64 and returns a data URI
 * ready to use as <img src="data:image/png;base64,..."> without a second fetch.
 *
 * @param {File} file  - The image file to denoise.
 * @returns {Promise<string>}  data URI string
 */
export async function denoiseToBase64(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${AI_BASE_URL}/denoise/base64`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Denoising failed');
  }

  const data = await response.json();
  return `data:${data.content_type};base64,${data.denoised_image}`;
}
