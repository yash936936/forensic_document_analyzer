// ASDAS/src/services/api.js
// FIX: no more hardcoded localhost:5000
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

function getToken() { try { return localStorage.getItem("asdas_token"); } catch { return null; } }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || "Request failed"), { status: res.status });
  return data;
}

export const api = {
  get:    (path)       => request(path, { method: "GET" }),
  post:   (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: "DELETE" }),
  upload: (path, formData) => fetch(BASE_URL + path, {
    method: "POST", headers: getToken() ? { Authorization: "Bearer " + getToken() } : {}, body: formData,
  }).then(async r => { const d = await r.json().catch(() => {}); if (!r.ok) throw new Error(d?.message || "Upload failed"); return d; }),
};
