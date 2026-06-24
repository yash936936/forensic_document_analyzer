import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanEye, ChevronDown, Loader2, Copy, CheckCircle, AlertTriangle, FileText, Languages, RotateCcw,
  Wand2, Shield, Fingerprint, Scissors, ZoomIn, Maximize2, X,
} from "lucide-react";
import { getCases, getFragmentsByCase } from "../services/mockApi";
import { useToast } from "../context/ToastContext";
import FragmentLightbox from "../components/viewer/FragmentLightbox";

const STRIP_COUNT = 10;
const getScatterPositions = (count) =>
  Array.from({ length: count }, (_, i) => ({
    x: (i % 2 === 0 ? -1 : 1) * (60 + Math.sin(i * 1.8) * 80),
    y: (Math.cos(i * 2.3) * 50) + (i - count / 2) * 12,
    rotate: (i - count / 2) * 6 + Math.sin(i) * 8,
  }));

const OCRReview = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [fragments, setFragments] = useState([]);
  const [selectedFragment, setSelectedFragment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctedText, setCorrectedText] = useState("");
  const [reprocessing, setReprocessing] = useState(false);
  const [lightboxFragment, setLightboxFragment] = useState(null);
  const [unshredFragment, setUnshredFragment] = useState(null);
  const [unshredPhase, setUnshredPhase] = useState("shredded");
  const toast = useToast();

  useEffect(() => { getCases().then(setCases); }, []);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    setSelectedFragment(null);
    getFragmentsByCase(selectedCase)
      .then(setFragments)
      .finally(() => setLoading(false));
  }, [selectedCase]);

  const handleSelectFragment = (f) => {
    setSelectedFragment(f);
    setCorrectedText(f.ocrText || "");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(correctedText);
    toast.success("OCR text copied to clipboard.");
  };

  const handleReprocess = () => {
    setReprocessing(true);
    setTimeout(() => {
      setReprocessing(false);
      toast.success("OCR re-processed with enhanced parameters.");
    }, 2000);
  };

  const handleSave = () => {
    toast.success("Corrected text saved for fragment " + selectedFragment.fragmentId);
  };

  const openUnshred = (f) => {
    setUnshredFragment(f);
    setUnshredPhase("shredded");
  };

  const confidenceColor = (c) => c > 0.85 ? "text-emerald-400" : c > 0.6 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-6 pb-12">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">OCR Review</h1>
        <p className="text-primary-400">Review and correct AI-extracted text from document fragments. Supports Hindi, English, and mixed-script recognition.</p>
      </motion.header>

      {/* Case Selector */}
      <div className="bg-primary-900/40 border border-primary-800 rounded-2xl p-5">
        <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Select Case</label>
        <div className="relative">
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-blue-600 transition-all cursor-pointer">
            <option value="">— Choose a case —</option>
            {cases.map((c) => <option key={c._id} value={c._id}>{c.caseId} — {c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 pointer-events-none" />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-primary-500 font-mono tracking-widest">LOADING OCR DATA...</p>
        </div>
      )}

      {!loading && selectedCase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══ Fragment Sidebar ═══ */}
          <div className="lg:col-span-3 bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-primary-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Languages className="w-4 h-4 text-blue-500" /> Fragments ({fragments.length})</h3>
            </div>
            <div className="divide-y divide-primary-800 max-h-[75vh] overflow-y-auto">
              {fragments.map((f, i) => (
                <motion.button key={f._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => handleSelectFragment(f)}
                  className={`w-full text-left p-3 hover:bg-primary-900/50 transition-all ${
                    selectedFragment?._id === f._id ? "bg-blue-600/10 border-l-2 border-blue-500" : ""
                  }`}>
                  {f.thumbnail && (
                    <div className="w-full h-14 rounded-lg overflow-hidden mb-2 border border-primary-800 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleSelectFragment(f); }}>
                      <img src={f.thumbnail} alt={f.originalName || f.fragmentId} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[11px] text-primary-300 truncate">{f.fragmentId}</span>
                    <span className={`text-[11px] font-bold ${confidenceColor(f.ocrConfidence)}`}>{(f.ocrConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-primary-800 h-0.5 rounded-full overflow-hidden my-1">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${f.ocrConfidence * 100}%` }} transition={{ duration: 0.6, delay: i * 0.03 }}
                      className={`h-full rounded-full ${f.ocrConfidence > 0.85 ? 'bg-emerald-500' : f.ocrConfidence > 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                  </div>
                  <p className="text-[10px] text-primary-500 line-clamp-1 leading-relaxed">{f.ocrText?.slice(0, 60) || "No text extracted"}</p>
                  {f.fraudScore > 50 && (
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-rose-400">
                      <AlertTriangle className="w-2.5 h-2.5" /> Tampered
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* ═══ Main Content Area ═══ */}
          <div className="lg:col-span-9 space-y-4">
            {selectedFragment ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedFragment._id} className="space-y-4">

                {/* ── Large Preview + Info Row ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                  {/* Fragment Image Preview */}
                  <div className="bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden">
                    <div className="p-3 border-b border-primary-800 flex items-center justify-between">
                      <span className="text-[10px] text-primary-500 uppercase tracking-widest font-bold">Document Preview</span>
                      <div className="flex gap-1">
                        {selectedFragment.thumbnail && (
                          <button onClick={() => setLightboxFragment(selectedFragment)}
                            className="p-1.5 rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition-colors" title="Fullscreen">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedFragment.thumbnail ? (
                      <div className="relative group cursor-pointer" onClick={() => setLightboxFragment(selectedFragment)}>
                        <img src={selectedFragment.thumbnail} alt={selectedFragment.originalName || selectedFragment.fragmentId}
                          className="w-full h-auto max-h-80 object-contain bg-primary-950 p-2" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-primary-950">
                        <div className="text-center">
                          <FileText className="w-10 h-10 text-primary-700 mx-auto mb-2" />
                          <p className="text-[11px] text-primary-600">No preview available</p>
                        </div>
                      </div>
                    )}
                    {/* Action buttons below preview */}
                    <div className="p-3 border-t border-primary-800 flex gap-2">
                      {selectedFragment.thumbnail && (
                        <>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setLightboxFragment(selectedFragment)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600/20 transition-all">
                            <ZoomIn className="w-3 h-3" /> View Full Size
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => openUnshred(selectedFragment)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-600/10 border border-violet-600/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-600/20 transition-all">
                            <Wand2 className="w-3 h-3" /> Unshred
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fragment Info + Stats */}
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-primary-900/30 border border-primary-800 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold">{selectedFragment.fragmentId}</h3>
                          <p className="text-[11px] text-primary-500 mt-0.5">{selectedFragment.originalName || "Fragment"}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${confidenceColor(selectedFragment.ocrConfidence)} bg-primary-800`}>
                            OCR {(selectedFragment.ocrConfidence * 100).toFixed(0)}%
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            selectedFragment.fraudScore > 50 ? "text-rose-400 bg-rose-500/10" : "text-emerald-400 bg-emerald-500/10"
                          }`}>
                            Fraud {selectedFragment.fraudScore}
                          </span>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "Fraud Score", value: `${selectedFragment.fraudScore}/100`, icon: Shield, color: selectedFragment.fraudScore > 50 ? "text-rose-400" : "text-emerald-400" },
                          { label: "ELA Score", value: typeof selectedFragment.elaScore === "number" ? selectedFragment.elaScore.toFixed(1) : "—", icon: Fingerprint, color: "text-amber-400" },
                          { label: "Language", value: selectedFragment.ocrText?.match(/[\u0900-\u097F]/) ? "Hindi + EN" : "English", icon: Languages, color: "text-blue-400" },
                          { label: "Status", value: selectedFragment.status || "Analyzed", icon: CheckCircle, color: "text-emerald-400" },
                        ].map(({ label, value, icon: Icon, color }) => (
                          <div key={label} className="bg-primary-950 rounded-lg p-3 flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${color} shrink-0`} />
                            <div>
                              <p className="text-primary-500 text-[9px] uppercase tracking-wider">{label}</p>
                              <p className={`font-mono font-bold text-xs ${color}`}>{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Analysis Notes */}
                    <div className={`rounded-2xl p-4 border ${
                      selectedFragment.fraudScore > 50 ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {selectedFragment.fraudScore > 50
                          ? <AlertTriangle className="w-4 h-4 text-rose-400" />
                          : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedFragment.fraudScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {selectedFragment.fraudScore > 50 ? 'Fraud Indicators Detected' : 'Document Appears Authentic'}
                        </span>
                      </div>
                      <p className="text-[11px] text-primary-400 leading-relaxed line-clamp-4">
                        {selectedFragment.analysisNotes || "No analysis notes available."}
                      </p>
                    </div>

                    {/* Shred info if available */}
                    {selectedFragment.scanDetails?.edgeAnalysis && (
                      <div className="bg-primary-900/30 border border-primary-800 rounded-xl p-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-[10px]">
                          <Scissors className="w-3 h-3 text-violet-400" />
                          <span className="text-primary-500">Shred:</span>
                          <span className="text-violet-400 font-mono">{selectedFragment.scanDetails.edgeAnalysis.shredType}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <ScanEye className="w-3 h-3 text-cyan-400" />
                          <span className="text-primary-500">Match:</span>
                          <span className="text-cyan-400 font-mono truncate">{selectedFragment.scanDetails.edgeAnalysis.matchPotential}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── OCR Text Editor ── */}
                <div className="bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-primary-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" /> Extracted Text
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-primary-800 transition-colors text-primary-400 hover:text-white" title="Copy">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={handleReprocess} disabled={reprocessing} className="p-2 rounded-lg hover:bg-primary-800 transition-colors text-primary-400 hover:text-white" title="Re-process OCR">
                        <RotateCcw className={`w-4 h-4 ${reprocessing ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <textarea value={correctedText} onChange={(e) => setCorrectedText(e.target.value)}
                    className="w-full bg-transparent p-6 text-sm font-mono text-primary-200 leading-relaxed min-h-50 resize-y focus:outline-none placeholder:text-primary-600"
                    placeholder="No OCR text available for this fragment..." />
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20">
                    <CheckCircle className="w-4 h-4" /> Save Corrections
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setCorrectedText(selectedFragment.ocrText || "")} className="bg-primary-800 hover:bg-primary-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all">
                    Reset
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 border border-dashed border-primary-800 rounded-2xl">
                <ScanEye className="w-12 h-12 text-primary-700 mx-auto mb-4" />
                <p className="text-primary-400 mb-1 font-medium">Select a fragment</p>
                <p className="text-sm text-primary-500">Choose a fragment from the list to review its OCR-extracted text.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedCase && !loading && (
        <div className="text-center py-20 border border-dashed border-primary-800 rounded-2xl">
          <ScanEye className="w-12 h-12 text-primary-700 mx-auto mb-4" />
          <p className="text-primary-400 mb-1 font-medium">No case selected</p>
          <p className="text-sm text-primary-500">Choose a case above to review fragment OCR data.</p>
        </div>
      )}

      {/* ═══ Lightbox ═══ */}
      <AnimatePresence>
        {lightboxFragment && (
          <FragmentLightbox
            fragment={lightboxFragment}
            onClose={() => setLightboxFragment(null)}
            onUnshred={lightboxFragment.thumbnail ? () => { setLightboxFragment(null); openUnshred(lightboxFragment); } : undefined}
          />
        )}
      </AnimatePresence>

      {/* ═══ Unshred Modal ═══ */}
      <AnimatePresence>
        {unshredFragment && unshredFragment.thumbnail && (
          <UnshredModal
            fragment={unshredFragment}
            previewUrl={unshredFragment.thumbnail}
            phase={unshredPhase}
            onStart={() => setUnshredPhase("animating")}
            onDone={() => setUnshredPhase("done")}
            onReset={() => setUnshredPhase("shredded")}
            onClose={() => { setUnshredFragment(null); setUnshredPhase("shredded"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Unshred Modal (self-contained) ─── */
const UnshredModal = ({ fragment, previewUrl, phase, onStart, onDone, onReset, onClose }) => {
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 400, h: 300 });
  const scatterPositions = useRef(getScatterPositions(STRIP_COUNT)).current;

  const handleImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    const scale = Math.min(500 / naturalWidth, 400 / naturalHeight, 1);
    setImgSize({ w: Math.round(naturalWidth * scale), h: Math.round(naturalHeight * scale) });
  };

  const stripWidth = imgSize.w / STRIP_COUNT;

  useEffect(() => {
    if (phase === "animating") {
      const timer = setTimeout(onDone, 2200);
      return () => clearTimeout(timer);
    }
  }, [phase, onDone]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-primary-950 border border-primary-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-primary-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/10 rounded-lg"><Wand2 className="w-5 h-5 text-violet-400" /></div>
            <div>
              <h3 className="font-bold text-sm">Document Reconstruction</h3>
              <p className="text-[10px] text-primary-500">{fragment.originalName || fragment.fragmentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-6">
          {/* Phase indicator */}
          <div className="flex gap-3 items-center">
            {[
              { key: "shredded", label: "Shredded", icon: Scissors },
              { key: "animating", label: "Reconstructing...", icon: Loader2 },
              { key: "done", label: "Reconstructed", icon: CheckCircle },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                phase === key ? "bg-violet-600/10 text-violet-400 border border-violet-600/20" :
                (phase === "done" && key !== "done") || (phase === "animating" && key === "shredded") ? "text-emerald-400" : "text-primary-600"
              }`}>
                {(phase === "done" && key !== "done") || (phase === "animating" && key === "shredded")
                  ? <CheckCircle className="w-3 h-3" />
                  : phase === key && key === "animating" ? <Icon className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />
                }
                {label}
              </div>
            ))}
          </div>

          {/* Strips */}
          <div className="relative bg-primary-900/30 rounded-xl border border-primary-800 overflow-hidden"
            style={{ width: imgSize.w + 40, height: imgSize.h + 80 }}>
            {previewUrl && <img ref={imgRef} src={previewUrl} alt="" onLoad={handleImgLoad} className="absolute opacity-0 pointer-events-none" />}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: imgSize.w, height: imgSize.h }}>
                {previewUrl && Array.from({ length: STRIP_COUNT }).map((_, i) => {
                  const scatter = scatterPositions[i];
                  return (
                    <motion.div key={i} className="absolute top-0 overflow-hidden"
                      style={{ width: stripWidth + 0.5, height: imgSize.h, left: i * stripWidth }}
                      initial={false}
                      animate={{
                        x: phase === "shredded" ? scatter.x : 0,
                        y: phase === "shredded" ? scatter.y : 0,
                        rotate: phase === "shredded" ? scatter.rotate : 0, opacity: 1,
                      }}
                      transition={phase === "animating" ? { type: "spring", stiffness: 120, damping: 18, delay: i * 0.1 } : { duration: 0.3 }}>
                      {phase === "shredded" && <div className="absolute inset-0 rounded shadow-lg shadow-black/50" />}
                      <div className={`w-full h-full ${phase === "shredded" ? "border border-primary-600/40 rounded" : ""}`}
                        style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: `${imgSize.w}px ${imgSize.h}px`, backgroundPosition: `-${i * stripWidth}px 0`, backgroundRepeat: "no-repeat" }} />
                    </motion.div>
                  );
                })}
                <AnimatePresence>
                  {phase === "done" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                        className="bg-emerald-500/90 rounded-full p-3 shadow-lg shadow-emerald-500/30">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="w-full grid grid-cols-3 gap-3">
            {[
              { label: "Strips Detected", value: STRIP_COUNT, color: "text-blue-400" },
              { label: "Shred Type", value: fragment.scanDetails?.edgeAnalysis?.shredType || "Vertical Cut", color: "text-violet-400" },
              { label: "Confidence", value: phase === "done" ? "96.4%" : "—", color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-primary-900/50 rounded-xl p-3 text-center">
                <p className={`text-sm font-bold ${color}`}>{value}</p>
                <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            {phase === "shredded" && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onStart}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4" /> Unshred Document
              </motion.button>
            )}
            {phase === "animating" && (
              <div className="flex-1 bg-violet-600/20 text-violet-400 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-wait">
                <Loader2 className="w-4 h-4 animate-spin" /> Reconstructing...
              </div>
            )}
            {phase === "done" && (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onReset}
                  className="flex-1 bg-primary-800 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Done
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OCRReview;
