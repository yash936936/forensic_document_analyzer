import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight, Eye, Layers, AlertTriangle, CheckCircle, ScanEye, FileText, Fingerprint, Shield, BarChart3,
} from "lucide-react";

const FragmentDiff = ({ fragmentA, fragmentB, matchConfidence = 0 }) => {
  const [mode, setMode] = useState("side"); // side | overlay | text
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  const fraudA = fragmentA?.metadata?.fraudScore ?? fragmentA?.fraudScore ?? 0;
  const fraudB = fragmentB?.metadata?.fraudScore ?? fragmentB?.fraudScore ?? 0;
  const ocrA = fragmentA?.metadata?.ocrText ?? fragmentA?.ocrText ?? "No OCR text extracted.";
  const ocrB = fragmentB?.metadata?.ocrText ?? fragmentB?.ocrText ?? "No OCR text extracted.";
  const elaA = fragmentA?.metadata?.elaScore ?? fragmentA?.elaScore ?? 0;
  const elaB = fragmentB?.metadata?.elaScore ?? fragmentB?.elaScore ?? 0;
  const notesA = fragmentA?.metadata?.analysisNotes ?? fragmentA?.analysisNotes ?? "";
  const notesB = fragmentB?.metadata?.analysisNotes ?? fragmentB?.analysisNotes ?? "";

  if (!fragmentA || !fragmentB) {
    return (
      <div className="h-96 flex items-center justify-center bg-primary-950 rounded-2xl border border-primary-800">
        <div className="text-center">
          <ArrowLeftRight className="w-10 h-10 text-primary-700 mx-auto mb-3" />
          <p className="text-sm text-primary-500">Select two fragments to compare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary-950 rounded-2xl border border-primary-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-primary-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold">Fragment Comparison</h3>
            <p className="text-[10px] text-primary-500">
              Match Confidence: <span className={`font-bold ${matchConfidence > 80 ? "text-emerald-400" : matchConfidence > 50 ? "text-amber-400" : "text-rose-400"}`}>
                {matchConfidence}%
              </span>
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-primary-900 rounded-xl p-1 border border-primary-800">
          {[
            { id: "side", label: "Side by Side", icon: Layers },
            { id: "overlay", label: "Overlay", icon: Eye },
            { id: "text", label: "Text Diff", icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                mode === id ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-primary-500 hover:text-white border border-transparent"
              }`}>
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {mode === "side" && (
          <div className="grid grid-cols-2 gap-4">
            <FragmentPanel frag={fragmentA} label="Fragment A" fraud={fraudA} ela={elaA} ocr={ocrA} notes={notesA} />
            <FragmentPanel frag={fragmentB} label="Fragment B" fraud={fraudB} ela={elaB} ocr={ocrB} notes={notesB} />
          </div>
        )}

        {mode === "overlay" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-primary-500 uppercase tracking-wider">Opacity</span>
              <input type="range" min="0" max="100" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="flex-1 h-1 accent-blue-500 cursor-pointer" />
              <span className="text-[10px] font-mono text-primary-400 w-10 text-right">{overlayOpacity}%</span>
            </div>
            <div className="relative h-80 bg-primary-900 rounded-xl overflow-hidden border border-primary-800">
              {/* Fragment A (background) */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-primary-800 rounded-lg p-4 max-h-full overflow-hidden w-full">
                  <p className="text-[10px] font-mono text-emerald-400 mb-1 uppercase tracking-wider">Fragment A</p>
                  <pre className="text-[10px] text-primary-300 font-mono whitespace-pre-wrap leading-relaxed">{ocrA.slice(0, 400)}</pre>
                </div>
              </div>
              {/* Fragment B (overlay) */}
              <div className="absolute inset-0 flex items-center justify-center p-6"
                style={{ opacity: overlayOpacity / 100 }}>
                <div className="bg-blue-900/80 rounded-lg p-4 max-h-full overflow-hidden w-full border border-blue-500/30">
                  <p className="text-[10px] font-mono text-blue-400 mb-1 uppercase tracking-wider">Fragment B</p>
                  <pre className="text-[10px] text-blue-200 font-mono whitespace-pre-wrap leading-relaxed">{ocrB.slice(0, 400)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-900 rounded-xl border border-primary-800 overflow-hidden">
                <div className="px-3 py-2 border-b border-primary-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Fragment A — OCR Text</span>
                </div>
                <pre className="p-4 text-[11px] text-primary-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{ocrA}</pre>
              </div>
              <div className="bg-primary-900 rounded-xl border border-primary-800 overflow-hidden">
                <div className="px-3 py-2 border-b border-primary-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Fragment B — OCR Text</span>
                </div>
                <pre className="p-4 text-[11px] text-primary-200 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{ocrB}</pre>
              </div>
            </div>

            {/* Analysis comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 border ${fraudA > 50 ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {fraudA > 50 ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className={`text-[10px] font-bold uppercase ${fraudA > 50 ? "text-rose-400" : "text-emerald-400"}`}>
                    {fraudA > 50 ? "Fraud Detected" : "Appears Authentic"}
                  </span>
                </div>
                <pre className="text-[10px] text-primary-400 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{notesA.slice(0, 500)}</pre>
              </div>
              <div className={`rounded-xl p-4 border ${fraudB > 50 ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {fraudB > 50 ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className={`text-[10px] font-bold uppercase ${fraudB > 50 ? "text-rose-400" : "text-emerald-400"}`}>
                    {fraudB > 50 ? "Fraud Detected" : "Appears Authentic"}
                  </span>
                </div>
                <pre className="text-[10px] text-primary-400 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{notesB.slice(0, 500)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score comparison bar */}
      <div className="p-4 border-t border-primary-800">
        <div className="grid grid-cols-3 gap-4">
          <CompareBar label="Fraud Score" valA={fraudA} valB={fraudB} max={100} dangerHigh />
          <CompareBar label="ELA Score" valA={elaA} valB={elaB} max={100} dangerHigh />
          <CompareBar label="Match Confidence" valA={matchConfidence} valB={matchConfidence} max={100} />
        </div>
      </div>
    </div>
  );
};

const FragmentPanel = ({ frag, label, fraud, ela, ocr, notes }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="bg-primary-900 rounded-xl border border-primary-800 overflow-hidden">
    <div className="px-3 py-2 border-b border-primary-800 flex items-center justify-between">
      <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">{label}</span>
      <span className="text-[9px] font-mono text-primary-600">{frag?.fragmentId?.slice(-12)}</span>
    </div>
    {/* Visual preview */}
    <div className="h-32 bg-primary-950 flex items-center justify-center p-3 border-b border-primary-800">
      <pre className="text-[8px] text-primary-400 font-mono whitespace-pre-wrap leading-tight max-h-full overflow-hidden">
        {ocr.slice(0, 200)}
      </pre>
    </div>
    {/* Metrics */}
    <div className="p-3 grid grid-cols-3 gap-2">
      <MetricChip icon={Shield} label="Fraud" value={fraud} color={fraud > 50 ? "text-rose-400" : "text-emerald-400"} />
      <MetricChip icon={Fingerprint} label="ELA" value={ela} color="text-amber-400" />
      <MetricChip icon={ScanEye} label="OCR" value={ocr.length > 10 ? "Yes" : "N/A"} color="text-blue-400" />
    </div>
    {/* Notes excerpt */}
    <div className="px-3 pb-3">
      <p className="text-[9px] text-primary-500 leading-relaxed line-clamp-3">{notes}</p>
    </div>
  </motion.div>
);

const MetricChip = ({ icon: Icon, label, value, color }) => (
  <div className="bg-primary-950/50 rounded-lg p-2 text-center">
    <Icon className={`w-3 h-3 ${color} mx-auto mb-0.5`} />
    <p className={`text-xs font-bold ${color}`}>{value}</p>
    <p className="text-[7px] text-primary-600 uppercase">{label}</p>
  </div>
);

const CompareBar = ({ label, valA, valB, max, dangerHigh }) => {
  const pctA = Math.min((valA / max) * 100, 100);
  const pctB = Math.min((valB / max) * 100, 100);
  const colorA = dangerHigh ? (valA > 50 ? "#ef4444" : "#10b981") : "#3b82f6";
  const colorB = dangerHigh ? (valB > 50 ? "#ef4444" : "#10b981") : "#3b82f6";
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] text-primary-500 uppercase tracking-wider font-semibold">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono w-5 text-right" style={{ color: colorA }}>{valA}</span>
        <div className="flex-1 flex gap-0.5">
          <div className="flex-1 bg-primary-800 h-1.5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pctA}%` }} transition={{ duration: 0.8 }}
              className="h-full rounded-full" style={{ backgroundColor: colorA }} />
          </div>
          <div className="flex-1 bg-primary-800 h-1.5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pctB}%` }} transition={{ duration: 0.8, delay: 0.1 }}
              className="h-full rounded-full" style={{ backgroundColor: colorB }} />
          </div>
        </div>
        <span className="text-[9px] font-mono w-5" style={{ color: colorB }}>{valB}</span>
      </div>
      <div className="flex justify-between text-[8px] text-primary-600">
        <span>A</span>
        <span>B</span>
      </div>
    </div>
  );
};

export default FragmentDiff;
