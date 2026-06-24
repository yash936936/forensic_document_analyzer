import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle, Loader2, AlertTriangle,
  FileText, Shield, ScanEye, RotateCcw, Copy,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { denoiseToBase64, analyzeDocument } from "./services/denoisingService";
import { useToast } from "./context/ToastContext";

// ─── xAI Design Token Map (inline, no Tailwind custom colours needed) ─────────
// canvas:        #0a0a0a
// canvas-soft:   #1a1c20
// canvas-card:   #191919
// canvas-mid:    #363a3f
// hairline:      #212327
// ink:           #ffffff
// body:          #dadbdf
// mute:          #7d8187
// accent-sunset: #ff7a17
// accent-dusk:   #7c3aed
// ──────────────────────────────────────────────────────────────────────────────

// ── Claude Vision fallback OCR ────────────────────────────────────────────────
async function claudeOcrFallback(file) {
  const toBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  const b64 = await toBase64(file);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: file.type, data: b64 } },
          { type: "text", text: "Extract all text visible in this document image. Output only the extracted text, preserving layout as much as possible. If the document is shredded, torn, or damaged, extract whatever text is legible." },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error("Claude OCR fallback failed");
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

const STAGES = [
  { key: "denoising", label: "DENOISING" },
  { key: "analyzing", label: "OCR + ELA" },
  { key: "fallback",  label: "CLAUDE OCR" },
  { key: "done",      label: "COMPLETE" },
];

// ── Shared inline style objects from xAI tokens ───────────────────────────────
const S = {
  canvas:     { backgroundColor: "#0a0a0a" },
  card:       { backgroundColor: "#191919", border: "1px solid #212327", borderRadius: 8 },
  cardSoft:   { backgroundColor: "#1a1c20", border: "1px solid #212327", borderRadius: 8 },
  hairline:   { borderColor: "#212327" },
  pillPrimary:{
    backgroundColor: "#ffffff", color: "#0a0a0a",
    border: "1px solid #ffffff", borderRadius: 9999,
    fontSize: 14, lineHeight: "20px", padding: "8px 16px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
  },
  pillOutline: {
    backgroundColor: "transparent", color: "#ffffff",
    border: "1px solid #212327", borderRadius: 9999,
    fontSize: 14, lineHeight: "20px", padding: "8px 16px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  },
  pillOutlineSm: {
    backgroundColor: "transparent", color: "#ffffff",
    border: "1px solid #212327", borderRadius: 9999,
    fontSize: 12, lineHeight: "16px", padding: "4px 12px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
  },
  eyebrow: {
    fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase",
    color: "#7d8187", lineHeight: "16px",
  },
  displayMd: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 48, fontWeight: 400, lineHeight: "48px", letterSpacing: "-1.2px",
    color: "#ffffff",
  },
  displaySm: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 32, fontWeight: 400, lineHeight: "36px", letterSpacing: "-0.6px",
    color: "#ffffff",
  },
  displayXs: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 20, fontWeight: 400, lineHeight: "28px",
    color: "#ffffff",
  },
  bodyMd:  { fontSize: 16, lineHeight: "24px", color: "#dadbdf" },
  bodySm:  { fontSize: 14, lineHeight: "20px", color: "#dadbdf" },
  bodyMute:{ fontSize: 14, lineHeight: "20px", color: "#7d8187" },
  monoSm:  {
    fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12, lineHeight: "16px", letterSpacing: "1.2px", color: "#7d8187",
  },
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function DocumentScanner() {
  const toast = useToast();

  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [stage,      setStage]      = useState(null);
  const [result,     setResult]     = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRaw,    setShowRaw]    = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const f = Array.from(files).find(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (!f) { toast.error("Upload an image (JPEG, PNG, TIFF, WEBP) or PDF."); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("File too large — max 50 MB."); return; }
    setResult(null); setStage(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }, [preview, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const runAnalysis = async () => {
    if (!file) return;
    setResult(null);
    let ocrText = "", fraudScore = null, elaScore = null, ocrSource = "tesseract", denoisedUri = null;

    if (file.type.startsWith("image/")) {
      setStage("denoising");
      try { denoisedUri = await denoiseToBase64(file); }
      catch (e) { console.warn("Denoising skipped:", e.message); }
    }

    setStage("analyzing");
    try {
      const d = await analyzeDocument(file);
      ocrText    = d.extractedText || d.extracted_text || "";
      fraudScore = d.fraudScore    ?? d.fraud_score    ?? null;
      elaScore   = d.elaScore      ?? d.ela_score      ?? null;
    } catch (e) { console.warn("ai-service failed, using fallback:", e.message); }

    if (!ocrText && file.type.startsWith("image/")) {
      setStage("fallback");
      try { ocrText = await claudeOcrFallback(file); ocrSource = "claude-vision"; }
      catch (e) { ocrSource = "none"; }
    }

    setStage("done");
    setResult({ fileName: file.name, fileSize: file.size, ocrText, ocrSource, fraudScore, elaScore, denoisedUri });
    toast.success("Analysis complete.");
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setStage(null);
  };

  const copyText = () =>
    result?.ocrText && navigator.clipboard.writeText(result.ocrText).then(() => toast.success("Copied."));

  const downloadText = () => {
    if (!result?.ocrText) return;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([result.ocrText], { type: "text/plain" })),
      download: result.fileName.replace(/\.[^.]+$/, "") + "_extracted.txt",
    });
    a.click();
  };

  const isRunning = stage && stage !== "done";

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        backgroundColor: "#0a0a0a", borderBottom: "1px solid #212327",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* wordmark-style logo */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="4" fill="#ffffff" fillOpacity="0.06" />
            <path d="M6 16V6l10 10V6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ ...S.bodyMd, color: "#ffffff", letterSpacing: "-0.01em" }}>DocScan</span>
        </div>
        <span style={S.eyebrow}>Document Recovery</span>
      </nav>

      {/* ── HERO BAND ── */}
      {!file && !result && (
        <div style={{ padding: "64px 24px 48px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...S.eyebrow, marginBottom: 20 }}>FORENSIC OCR PIPELINE</p>
          <h1 style={{ ...S.displayMd, marginBottom: 16,
            fontSize: "clamp(32px, 6vw, 48px)",
          }}>
            Extract text from<br />damaged documents
          </h1>
          <p style={{ ...S.bodyMd, color: "#7d8187", maxWidth: 480, margin: "0 auto 40px" }}>
            Upload a shredded, torn, or degraded document.
            The pipeline denoises it, runs OCR, and falls back to Claude Vision if needed.
          </p>

          {/* DROP ZONE */}
          <motion.div
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            animate={dragActive ? { borderColor: "#ff7a17" } : { borderColor: "#212327" }}
            style={{
              border: "1px dashed #212327", borderRadius: 8,
              padding: "56px 32px", cursor: "pointer",
              backgroundColor: dragActive ? "rgba(255,122,23,0.04)" : "#191919",
              transition: "background-color 0.2s",
            }}
          >
            <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
              onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />

            {/* Upload icon — xAI uses sparse SVG, no emoji */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 20px", display: "block" }}>
              <rect width="40" height="40" rx="8" fill="#212327"/>
              <path d="M20 26V14M20 14l-5 5M20 14l5 5" stroke={dragActive ? "#ff7a17" : "#7d8187"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 28h14" stroke={dragActive ? "#ff7a17" : "#363a3f"} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            <p style={{ ...S.displayXs, marginBottom: 8 }}>
              {dragActive ? "Release to upload" : "Drop a document here"}
            </p>
            <p style={{ ...S.bodyMute, marginBottom: 24 }}>or click to browse</p>

            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {["JPEG", "PNG", "WEBP", "TIFF", "PDF"].map((fmt) => (
                <span key={fmt} style={{
                  ...S.monoSm, padding: "3px 10px",
                  border: "1px solid #212327", borderRadius: 9999,
                  backgroundColor: "#1a1c20",
                }}>{fmt}</span>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── FILE SELECTED ── */}
      {file && !result && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...S.card, overflow: "hidden" }}>

            {/* File bar */}
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid #212327",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: "#1a1c20", border: "1px solid #212327",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <FileText size={16} color="#7d8187" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...S.bodyMd, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </p>
                <p style={S.monoSm}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7d8187", padding: 4, display: "flex",
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ padding: "20px 24px", backgroundColor: "#111", borderBottom: "1px solid #212327", display: "flex", justifyContent: "center" }}>
                <img src={preview} alt="Preview"
                  style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 6, objectFit: "contain", border: "1px solid #212327" }} />
              </div>
            )}

            {/* Pipeline stages (while running) */}
            {isRunning && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #212327" }}>
                <p style={{ ...S.eyebrow, marginBottom: 16 }}>PROCESSING</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STAGES.filter(s => s.key !== "done").map((s) => {
                    const idx  = STAGES.findIndex(x => x.key === stage);
                    const sIdx = STAGES.findIndex(x => x.key === s.key);
                    const active = s.key === stage;
                    const done   = sIdx < idx;
                    return (
                      <div key={s.key} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 12px", borderRadius: 9999,
                        border: `1px solid ${active ? "#ff7a17" : done ? "#212327" : "#212327"}`,
                        backgroundColor: active ? "rgba(255,122,23,0.08)" : "transparent",
                      }}>
                        {done   ? <CheckCircle size={11} color="#7d8187" />
                         : active ? <Loader2 size={11} color="#ff7a17" style={{ animation: "spin 1s linear infinite" }} />
                         : <span style={{ width: 9, height: 9, borderRadius: 9999, border: "1px solid #363a3f", display: "inline-block" }} />}
                        <span style={{
                          ...S.monoSm,
                          color: active ? "#ff7a17" : done ? "#7d8187" : "#363a3f",
                        }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            {!isRunning && (
              <div style={{ padding: "20px 24px" }}>
                <button onClick={runAnalysis} style={{ ...S.pillPrimary, width: "100%", justifyContent: "center", padding: "12px 24px", fontSize: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8h12M8 2l6 6-6 6" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Extract Text &amp; Analyze
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>

          {/* Result header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ ...S.eyebrow, marginBottom: 12 }}>ANALYSIS COMPLETE</p>
              <h2 style={{ ...S.displaySm, marginBottom: 8 }}>{result.fileName}</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 12px", border: "1px solid #212327", borderRadius: 9999,
                backgroundColor: "#1a1c20",
              }}>
                <span style={S.monoSm}>
                  OCR · {result.ocrSource === "claude-vision" ? "CLAUDE VISION FALLBACK"
                        : result.ocrSource === "none" ? "NO TEXT FOUND"
                        : "TESSERACT"}
                </span>
              </div>
            </div>
            <button onClick={reset} style={S.pillOutline}>
              <RotateCcw size={13} /> New scan
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #212327", marginBottom: 32 }} />

          {/* Score cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
            <MetricCard
              eyebrow="FRAUD SCORE"
              value={result.fraudScore !== null ? `${Math.round(result.fraudScore * 100)}` : "—"}
              unit={result.fraudScore !== null ? "/100" : ""}
              sub={result.fraudScore > 0.5 ? "Tamper detected" : "Appears authentic"}
              accent={result.fraudScore > 0.5 ? "#ff7a17" : null}
            />
            <MetricCard
              eyebrow="ELA SCORE"
              value={result.elaScore !== null ? result.elaScore.toFixed(2) : "—"}
              sub="Error Level Analysis"
            />
            <MetricCard
              eyebrow="CHARACTERS"
              value={result.ocrText.length > 0 ? result.ocrText.length.toLocaleString() : "0"}
              sub="Extracted from document"
            />
          </div>

          {/* Side-by-side images */}
          {(preview || result.denoisedUri) && (
            <div style={{ display: "grid", gridTemplateColumns: preview && result.denoisedUri ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 32 }}>
              {preview && (
                <div style={{ ...S.card, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #212327" }}>
                    <span style={S.monoSm}>ORIGINAL</span>
                  </div>
                  <div style={{ padding: 16, backgroundColor: "#111", display: "flex", justifyContent: "center" }}>
                    <img src={preview} alt="Original"
                      style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
                  </div>
                </div>
              )}
              {result.denoisedUri && (
                <div style={{ ...S.card, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #212327", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={S.monoSm}>DENOISED</span>
                    <span style={{ ...S.monoSm, color: "#ff7a17" }}>· MODEL OUTPUT</span>
                  </div>
                  <div style={{ padding: 16, backgroundColor: "#111", display: "flex", justifyContent: "center" }}>
                    <img src={result.denoisedUri} alt="Denoised"
                      style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid #212327", marginBottom: 32 }} />

          {/* Extracted text panel */}
          <div style={{ ...S.card, overflow: "hidden", marginBottom: 24 }}>
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid #212327",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={14} color="#7d8187" />
                <span style={S.eyebrow}>EXTRACTED TEXT</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyText} style={S.pillOutlineSm}>
                  <Copy size={11} /> Copy
                </button>
                <button onClick={downloadText} style={S.pillOutlineSm}>
                  <Download size={11} /> Save .txt
                </button>
                <button onClick={() => setShowRaw(v => !v)} style={S.pillOutlineSm}>
                  {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showRaw ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            <div style={{ maxHeight: showRaw ? "none" : 280, overflowY: showRaw ? "visible" : "auto" }}>
              {result.ocrText ? (
                <pre style={{
                  margin: 0, padding: "20px 24px",
                  fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13, lineHeight: "22px", color: "#dadbdf",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  backgroundColor: "#0f0f0f",
                }}>
                  {result.ocrText}
                </pre>
              ) : (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <AlertTriangle size={18} color="#363a3f" style={{ margin: "0 auto 12px", display: "block" }} />
                  <p style={S.bodyMute}>No text could be extracted from this document.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tamper warning */}
          {result.fraudScore !== null && result.fraudScore > 0.5 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{
                ...S.card, padding: 24,
                borderColor: "rgba(255,122,23,0.3)",
                backgroundColor: "rgba(255,122,23,0.05)",
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                border: "1px solid rgba(255,122,23,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,122,23,0.08)",
              }}>
                <AlertTriangle size={14} color="#ff7a17" />
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: "#ff7a17", marginBottom: 8 }}>TAMPER INDICATORS DETECTED</p>
                <p style={S.bodySm}>
                  ELA analysis found pixel-level inconsistencies (score: {result.elaScore?.toFixed(2)})
                  that may indicate digital manipulation or document forgery. Treat with caution.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #212327", padding: "48px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, maxWidth: 760, margin: "0 auto",
      }}>
        <span style={{ ...S.bodyMute, fontSize: 13 }}>DocScan · Document Recovery Pipeline</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={S.monoSm}>POWERED BY YOUR KERAS MODEL</span>
          <span style={{ ...S.monoSm, color: "#363a3f" }}>+</span>
          <span style={S.monoSm}>CLAUDE VISION</span>
        </div>
      </footer>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Metric card (xAI card-content chrome) ─────────────────────────────────────
function MetricCard({ eyebrow, value, unit = "", sub, accent = null }) {
  return (
    <div style={{
      backgroundColor: "#191919", border: "1px solid #212327",
      borderRadius: 8, padding: 24,
    }}>
      <p style={{ ...S.eyebrow, marginBottom: 16 }}>{eyebrow}</p>
      <p style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 32, fontWeight: 400, lineHeight: "36px", letterSpacing: "-0.6px",
        color: accent || "#ffffff", marginBottom: 8,
      }}>
        {value}<span style={{ fontSize: 16, color: "#7d8187", marginLeft: 2 }}>{unit}</span>
      </p>
      <p style={S.monoSm}>{sub}</p>
    </div>
  );
}import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CheckCircle, Loader2, AlertTriangle,
  FileText, Shield, ScanEye, RotateCcw, Copy,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { denoiseToBase64, analyzeDocument } from "./services/denoisingService";
import { useToast } from "./context/ToastContext";

// ─── xAI Design Token Map (inline, no Tailwind custom colours needed) ─────────
// canvas:        #0a0a0a
// canvas-soft:   #1a1c20
// canvas-card:   #191919
// canvas-mid:    #363a3f
// hairline:      #212327
// ink:           #ffffff
// body:          #dadbdf
// mute:          #7d8187
// accent-sunset: #ff7a17
// accent-dusk:   #7c3aed
// ──────────────────────────────────────────────────────────────────────────────

// ── Claude Vision fallback OCR ────────────────────────────────────────────────
async function claudeOcrFallback(file) {
  const toBase64 = (f) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  const b64 = await toBase64(file);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: file.type, data: b64 } },
          { type: "text", text: "Extract all text visible in this document image. Output only the extracted text, preserving layout as much as possible. If the document is shredded, torn, or damaged, extract whatever text is legible." },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error("Claude OCR fallback failed");
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

const STAGES = [
  { key: "denoising", label: "DENOISING" },
  { key: "analyzing", label: "OCR + ELA" },
  { key: "fallback",  label: "CLAUDE OCR" },
  { key: "done",      label: "COMPLETE" },
];

// ── Shared inline style objects from xAI tokens ───────────────────────────────
const S = {
  canvas:     { backgroundColor: "#0a0a0a" },
  card:       { backgroundColor: "#191919", border: "1px solid #212327", borderRadius: 8 },
  cardSoft:   { backgroundColor: "#1a1c20", border: "1px solid #212327", borderRadius: 8 },
  hairline:   { borderColor: "#212327" },
  pillPrimary:{
    backgroundColor: "#ffffff", color: "#0a0a0a",
    border: "1px solid #ffffff", borderRadius: 9999,
    fontSize: 14, lineHeight: "20px", padding: "8px 16px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
  },
  pillOutline: {
    backgroundColor: "transparent", color: "#ffffff",
    border: "1px solid #212327", borderRadius: 9999,
    fontSize: 14, lineHeight: "20px", padding: "8px 16px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  },
  pillOutlineSm: {
    backgroundColor: "transparent", color: "#ffffff",
    border: "1px solid #212327", borderRadius: 9999,
    fontSize: 12, lineHeight: "16px", padding: "4px 12px",
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
  },
  eyebrow: {
    fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase",
    color: "#7d8187", lineHeight: "16px",
  },
  displayMd: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 48, fontWeight: 400, lineHeight: "48px", letterSpacing: "-1.2px",
    color: "#ffffff",
  },
  displaySm: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 32, fontWeight: 400, lineHeight: "36px", letterSpacing: "-0.6px",
    color: "#ffffff",
  },
  displayXs: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 20, fontWeight: 400, lineHeight: "28px",
    color: "#ffffff",
  },
  bodyMd:  { fontSize: 16, lineHeight: "24px", color: "#dadbdf" },
  bodySm:  { fontSize: 14, lineHeight: "20px", color: "#dadbdf" },
  bodyMute:{ fontSize: 14, lineHeight: "20px", color: "#7d8187" },
  monoSm:  {
    fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12, lineHeight: "16px", letterSpacing: "1.2px", color: "#7d8187",
  },
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function DocumentScanner() {
  const toast = useToast();

  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [stage,      setStage]      = useState(null);
  const [result,     setResult]     = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showRaw,    setShowRaw]    = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const f = Array.from(files).find(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (!f) { toast.error("Upload an image (JPEG, PNG, TIFF, WEBP) or PDF."); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("File too large — max 50 MB."); return; }
    setResult(null); setStage(null);
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }, [preview, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const runAnalysis = async () => {
    if (!file) return;
    setResult(null);
    let ocrText = "", fraudScore = null, elaScore = null, ocrSource = "tesseract", denoisedUri = null;

    if (file.type.startsWith("image/")) {
      setStage("denoising");
      try { denoisedUri = await denoiseToBase64(file); }
      catch (e) { console.warn("Denoising skipped:", e.message); }
    }

    setStage("analyzing");
    try {
      const d = await analyzeDocument(file);
      ocrText    = d.extractedText || d.extracted_text || "";
      fraudScore = d.fraudScore    ?? d.fraud_score    ?? null;
      elaScore   = d.elaScore      ?? d.ela_score      ?? null;
    } catch (e) { console.warn("ai-service failed, using fallback:", e.message); }

    if (!ocrText && file.type.startsWith("image/")) {
      setStage("fallback");
      try { ocrText = await claudeOcrFallback(file); ocrSource = "claude-vision"; }
      catch (e) { ocrSource = "none"; }
    }

    setStage("done");
    setResult({ fileName: file.name, fileSize: file.size, ocrText, ocrSource, fraudScore, elaScore, denoisedUri });
    toast.success("Analysis complete.");
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResult(null); setStage(null);
  };

  const copyText = () =>
    result?.ocrText && navigator.clipboard.writeText(result.ocrText).then(() => toast.success("Copied."));

  const downloadText = () => {
    if (!result?.ocrText) return;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([result.ocrText], { type: "text/plain" })),
      download: result.fileName.replace(/\.[^.]+$/, "") + "_extracted.txt",
    });
    a.click();
  };

  const isRunning = stage && stage !== "done";

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        backgroundColor: "#0a0a0a", borderBottom: "1px solid #212327",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* wordmark-style logo */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="4" fill="#ffffff" fillOpacity="0.06" />
            <path d="M6 16V6l10 10V6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ ...S.bodyMd, color: "#ffffff", letterSpacing: "-0.01em" }}>DocScan</span>
        </div>
        <span style={S.eyebrow}>Document Recovery</span>
      </nav>

      {/* ── HERO BAND ── */}
      {!file && !result && (
        <div style={{ padding: "64px 24px 48px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...S.eyebrow, marginBottom: 20 }}>FORENSIC OCR PIPELINE</p>
          <h1 style={{ ...S.displayMd, marginBottom: 16,
            fontSize: "clamp(32px, 6vw, 48px)",
          }}>
            Extract text from<br />damaged documents
          </h1>
          <p style={{ ...S.bodyMd, color: "#7d8187", maxWidth: 480, margin: "0 auto 40px" }}>
            Upload a shredded, torn, or degraded document.
            The pipeline denoises it, runs OCR, and falls back to Claude Vision if needed.
          </p>

          {/* DROP ZONE */}
          <motion.div
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            animate={dragActive ? { borderColor: "#ff7a17" } : { borderColor: "#212327" }}
            style={{
              border: "1px dashed #212327", borderRadius: 8,
              padding: "56px 32px", cursor: "pointer",
              backgroundColor: dragActive ? "rgba(255,122,23,0.04)" : "#191919",
              transition: "background-color 0.2s",
            }}
          >
            <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
              onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />

            {/* Upload icon — xAI uses sparse SVG, no emoji */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 20px", display: "block" }}>
              <rect width="40" height="40" rx="8" fill="#212327"/>
              <path d="M20 26V14M20 14l-5 5M20 14l5 5" stroke={dragActive ? "#ff7a17" : "#7d8187"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 28h14" stroke={dragActive ? "#ff7a17" : "#363a3f"} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            <p style={{ ...S.displayXs, marginBottom: 8 }}>
              {dragActive ? "Release to upload" : "Drop a document here"}
            </p>
            <p style={{ ...S.bodyMute, marginBottom: 24 }}>or click to browse</p>

            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {["JPEG", "PNG", "WEBP", "TIFF", "PDF"].map((fmt) => (
                <span key={fmt} style={{
                  ...S.monoSm, padding: "3px 10px",
                  border: "1px solid #212327", borderRadius: 9999,
                  backgroundColor: "#1a1c20",
                }}>{fmt}</span>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── FILE SELECTED ── */}
      {file && !result && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...S.card, overflow: "hidden" }}>

            {/* File bar */}
            <div style={{
              padding: "16px 24px", borderBottom: "1px solid #212327",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: "#1a1c20", border: "1px solid #212327",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <FileText size={16} color="#7d8187" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...S.bodyMd, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </p>
                <p style={S.monoSm}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={reset} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7d8187", padding: 4, display: "flex",
              }}>
                <X size={16} />
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ padding: "20px 24px", backgroundColor: "#111", borderBottom: "1px solid #212327", display: "flex", justifyContent: "center" }}>
                <img src={preview} alt="Preview"
                  style={{ maxHeight: 280, maxWidth: "100%", borderRadius: 6, objectFit: "contain", border: "1px solid #212327" }} />
              </div>
            )}

            {/* Pipeline stages (while running) */}
            {isRunning && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #212327" }}>
                <p style={{ ...S.eyebrow, marginBottom: 16 }}>PROCESSING</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STAGES.filter(s => s.key !== "done").map((s) => {
                    const idx  = STAGES.findIndex(x => x.key === stage);
                    const sIdx = STAGES.findIndex(x => x.key === s.key);
                    const active = s.key === stage;
                    const done   = sIdx < idx;
                    return (
                      <div key={s.key} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 12px", borderRadius: 9999,
                        border: `1px solid ${active ? "#ff7a17" : done ? "#212327" : "#212327"}`,
                        backgroundColor: active ? "rgba(255,122,23,0.08)" : "transparent",
                      }}>
                        {done   ? <CheckCircle size={11} color="#7d8187" />
                         : active ? <Loader2 size={11} color="#ff7a17" style={{ animation: "spin 1s linear infinite" }} />
                         : <span style={{ width: 9, height: 9, borderRadius: 9999, border: "1px solid #363a3f", display: "inline-block" }} />}
                        <span style={{
                          ...S.monoSm,
                          color: active ? "#ff7a17" : done ? "#7d8187" : "#363a3f",
                        }}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            {!isRunning && (
              <div style={{ padding: "20px 24px" }}>
                <button onClick={runAnalysis} style={{ ...S.pillPrimary, width: "100%", justifyContent: "center", padding: "12px 24px", fontSize: 14 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8h12M8 2l6 6-6 6" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Extract Text &amp; Analyze
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>

          {/* Result header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ ...S.eyebrow, marginBottom: 12 }}>ANALYSIS COMPLETE</p>
              <h2 style={{ ...S.displaySm, marginBottom: 8 }}>{result.fileName}</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 12px", border: "1px solid #212327", borderRadius: 9999,
                backgroundColor: "#1a1c20",
              }}>
                <span style={S.monoSm}>
                  OCR · {result.ocrSource === "claude-vision" ? "CLAUDE VISION FALLBACK"
                        : result.ocrSource === "none" ? "NO TEXT FOUND"
                        : "TESSERACT"}
                </span>
              </div>
            </div>
            <button onClick={reset} style={S.pillOutline}>
              <RotateCcw size={13} /> New scan
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #212327", marginBottom: 32 }} />

          {/* Score cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
            <MetricCard
              eyebrow="FRAUD SCORE"
              value={result.fraudScore !== null ? `${Math.round(result.fraudScore * 100)}` : "—"}
              unit={result.fraudScore !== null ? "/100" : ""}
              sub={result.fraudScore > 0.5 ? "Tamper detected" : "Appears authentic"}
              accent={result.fraudScore > 0.5 ? "#ff7a17" : null}
            />
            <MetricCard
              eyebrow="ELA SCORE"
              value={result.elaScore !== null ? result.elaScore.toFixed(2) : "—"}
              sub="Error Level Analysis"
            />
            <MetricCard
              eyebrow="CHARACTERS"
              value={result.ocrText.length > 0 ? result.ocrText.length.toLocaleString() : "0"}
              sub="Extracted from document"
            />
          </div>

          {/* Side-by-side images */}
          {(preview || result.denoisedUri) && (
            <div style={{ display: "grid", gridTemplateColumns: preview && result.denoisedUri ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 32 }}>
              {preview && (
                <div style={{ ...S.card, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #212327" }}>
                    <span style={S.monoSm}>ORIGINAL</span>
                  </div>
                  <div style={{ padding: 16, backgroundColor: "#111", display: "flex", justifyContent: "center" }}>
                    <img src={preview} alt="Original"
                      style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
                  </div>
                </div>
              )}
              {result.denoisedUri && (
                <div style={{ ...S.card, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #212327", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={S.monoSm}>DENOISED</span>
                    <span style={{ ...S.monoSm, color: "#ff7a17" }}>· MODEL OUTPUT</span>
                  </div>
                  <div style={{ padding: 16, backgroundColor: "#111", display: "flex", justifyContent: "center" }}>
                    <img src={result.denoisedUri} alt="Denoised"
                      style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid #212327", marginBottom: 32 }} />

          {/* Extracted text panel */}
          <div style={{ ...S.card, overflow: "hidden", marginBottom: 24 }}>
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid #212327",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={14} color="#7d8187" />
                <span style={S.eyebrow}>EXTRACTED TEXT</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyText} style={S.pillOutlineSm}>
                  <Copy size={11} /> Copy
                </button>
                <button onClick={downloadText} style={S.pillOutlineSm}>
                  <Download size={11} /> Save .txt
                </button>
                <button onClick={() => setShowRaw(v => !v)} style={S.pillOutlineSm}>
                  {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showRaw ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            <div style={{ maxHeight: showRaw ? "none" : 280, overflowY: showRaw ? "visible" : "auto" }}>
              {result.ocrText ? (
                <pre style={{
                  margin: 0, padding: "20px 24px",
                  fontFamily: "GeistMono, ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13, lineHeight: "22px", color: "#dadbdf",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  backgroundColor: "#0f0f0f",
                }}>
                  {result.ocrText}
                </pre>
              ) : (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <AlertTriangle size={18} color="#363a3f" style={{ margin: "0 auto 12px", display: "block" }} />
                  <p style={S.bodyMute}>No text could be extracted from this document.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tamper warning */}
          {result.fraudScore !== null && result.fraudScore > 0.5 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{
                ...S.card, padding: 24,
                borderColor: "rgba(255,122,23,0.3)",
                backgroundColor: "rgba(255,122,23,0.05)",
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9999, flexShrink: 0,
                border: "1px solid rgba(255,122,23,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(255,122,23,0.08)",
              }}>
                <AlertTriangle size={14} color="#ff7a17" />
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: "#ff7a17", marginBottom: 8 }}>TAMPER INDICATORS DETECTED</p>
                <p style={S.bodySm}>
                  ELA analysis found pixel-level inconsistencies (score: {result.elaScore?.toFixed(2)})
                  that may indicate digital manipulation or document forgery. Treat with caution.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid #212327", padding: "48px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, maxWidth: 760, margin: "0 auto",
      }}>
        <span style={{ ...S.bodyMute, fontSize: 13 }}>DocScan · Document Recovery Pipeline</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={S.monoSm}>POWERED BY YOUR KERAS MODEL</span>
          <span style={{ ...S.monoSm, color: "#363a3f" }}>+</span>
          <span style={S.monoSm}>CLAUDE VISION</span>
        </div>
      </footer>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Metric card (xAI card-content chrome) ─────────────────────────────────────
function MetricCard({ eyebrow, value, unit = "", sub, accent = null }) {
  return (
    <div style={{
      backgroundColor: "#191919", border: "1px solid #212327",
      borderRadius: 8, padding: 24,
    }}>
      <p style={{ ...S.eyebrow, marginBottom: 16 }}>{eyebrow}</p>
      <p style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 32, fontWeight: 400, lineHeight: "36px", letterSpacing: "-0.6px",
        color: accent || "#ffffff", marginBottom: 8,
      }}>
        {value}<span style={{ fontSize: 16, color: "#7d8187", marginLeft: 2 }}>{unit}</span>
      </p>
      <p style={S.monoSm}>{sub}</p>
    </div>
  );
}