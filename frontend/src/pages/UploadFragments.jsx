import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Cloud, FileImage, X, CheckCircle, Loader2, AlertTriangle, ChevronDown, Layers, Binary, Sparkles, FileType2,
  Download, Shield, ScanEye, Fingerprint, ChevronRight, Clock, Cpu, FileText, Hash, Scissors, BarChart3, Wand2, RotateCcw,
} from "lucide-react";
import { getCases, uploadFragments } from "../services/mockApi";
import { SAMPLE_FRAGMENTS, buildSampleFile } from "../data/sampleFragments";
import { useToast } from "../context/ToastContext";
import { denoiseToBase64 } from '../services/denoisingService';

const UPLOAD_STEPS = [
  { label: "Ingesting", range: [0, 15] },
  { label: "Pre-processing", range: [15, 35] },
  { label: "OCR Extraction", range: [35, 60] },
  { label: "Fraud Analysis", range: [60, 80] },
  { label: "Feature Extraction", range: [80, 95] },
  { label: "Finalizing", range: [95, 100] },
];

const UploadFragments = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedFragment, setExpandedFragment] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState("overview");
  const [previewMap, setPreviewMap] = useState({});     // fragId → preview URL
  const [unshredTarget, setUnshredTarget] = useState(null); // frag for unshred modal
  const [unshredPhase, setUnshredPhase] = useState("shredded"); // shredded | animating | done
  const toast = useToast();

  useEffect(() => { getCases().then(setCases); }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const processFiles = async (rawFiles) => {
    const valid = Array.from(rawFiles).filter((f) =>
      f.type.startsWith("image/") || f.type === "application/pdf" || f.type === "image/svg+xml"
    );
    
    if (valid.length !== rawFiles.length) toast.warning("Some unsupported files were skipped.");
    
    // Map over files and await the denoised base64 string for images
    const mappedPromises = valid.map(async (f) => {
      let previewUrl = null;
      
      if (f.type.startsWith("image/")) {
        try {
          // Generate the denoised base64 preview
          previewUrl = await denoiseToBase64(f);
        } catch (error) {
          console.error("Denoising failed, falling back to original", error);
          previewUrl = URL.createObjectURL(f);
        }
      }

      return {
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
        size: f.size,
        preview: previewUrl,
        type: f.type,
      };
    });

    // Wait for all denoising to finish before updating state
    const mapped = await Promise.all(mappedPromises);
    setFiles((prev) => [...prev, ...mapped]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  // Download a sample fragment file
  const handleDownloadSample = (sampleId) => {
    const file = buildSampleFile(sampleId);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  };

  // Add a sample directly to the upload queue
  const handleAddSampleToQueue = async (sampleId) => {
    const file = buildSampleFile(sampleId);
    if (!file) return;

    let previewUrl = null;
    if (file.type.startsWith("image/")) {
      try {
        previewUrl = await denoiseToBase64(file);
      } catch (err) {
        previewUrl = URL.createObjectURL(file);
      }
    } else {
      previewUrl = URL.createObjectURL(file);
    }

    const entry = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      preview: previewUrl,
      type: file.type,
    };
    
    setFiles((prev) => [...prev, entry]);
    toast.info(`Added ${file.name} to upload queue`);
  };

  // Add all 5 samples at once
  const handleAddAllSamples = () => {
    SAMPLE_FRAGMENTS.forEach((s) => handleAddSampleToQueue(s.id));
  };

  const handleUpload = async () => {
    if (!selectedCase) { toast.error("Please select a case."); return; }
    if (files.length === 0) { toast.error("No files to upload."); return; }
    setUploading(true);
    setUploadProgress(0);
    setUploadResults(null);
    setExpandedFragment(null);
    try {
      const currentFiles = [...files]; // snapshot before clearing
      const result = await uploadFragments(selectedCase, files, (progress) => setUploadProgress(progress));
      // Map preview URLs to result fragment IDs (1:1 correspondence by index)
      const pMap = {};
      result.fragments.forEach((frag, idx) => {
        if (currentFiles[idx]?.preview) {
          pMap[frag._id] = currentFiles[idx].preview;
        }
      });
      setPreviewMap(pMap);
      setUploadResults(result);
      toast.success(`${result.fragments.length} fragments analyzed — detailed results ready.`);
      setFiles([]);
    } catch (err) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (b) => {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  };

  const currentStep = UPLOAD_STEPS.findIndex((s) => uploadProgress >= s.range[0] && uploadProgress < s.range[1]);

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight mb-2">Upload Fragments</motion.h1>
        <p className="text-primary-400">Upload scanned shredded document fragments for AI forensic analysis, OCR extraction, and fraud detection.</p>
      </header>

      {/* ══════════════════ SAMPLE FRAGMENTS SECTION ══════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-primary-900/40 border border-primary-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-primary-800 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-lg"><Fingerprint className="w-5 h-5 text-blue-500" /></div>
            <div>
              <h3 className="font-bold text-sm">Sample Evidence Fragments</h3>
              <p className="text-[11px] text-primary-500">Download or add these pre-built forensic fragments to test the scanning pipeline</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleAddAllSamples}
            className="bg-blue-600/10 border border-blue-600/20 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-all flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Add All 5 to Queue
          </motion.button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SAMPLE_FRAGMENTS.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-primary-950/60 border border-primary-800 rounded-xl p-3.5 group hover:border-primary-700 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: s.color + '15', color: s.color }}>
                  {i + 1}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-800 text-primary-400 font-mono uppercase">{s.category}</span>
              </div>
              <p className="text-xs font-semibold mb-1 leading-tight">{s.label}</p>
              <p className="text-[10px] text-primary-500 leading-relaxed mb-3 line-clamp-2">{s.description}</p>
              <div className="flex gap-1.5">
                <button onClick={() => handleDownloadSample(s.id)}
                  className="flex-1 text-[10px] py-1.5 rounded-lg bg-primary-800 hover:bg-primary-700 text-primary-300 transition-colors flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> Save
                </button>
                <button onClick={() => handleAddSampleToQueue(s.id)}
                  className="flex-1 text-[10px] py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors flex items-center justify-center gap-1 border border-blue-600/20">
                  <Upload className="w-3 h-3" /> Queue
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════ CASE SELECTION ══════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-primary-900/40 border border-primary-800 rounded-2xl p-6">
        <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-3">Select Case for Upload</label>
        <div className="relative">
          <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all cursor-pointer">
            <option value="">— Choose a case —</option>
            {cases.map((c) => (
              <option key={c._id} value={c._id}>{c.caseId} — {c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 pointer-events-none" />
        </div>
      </motion.div>

      {/* ══════════════════ DROP ZONE ══════════════════ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer relative overflow-hidden group ${
          dragActive ? "border-blue-500 bg-blue-600/5 scale-[1.01]" : "border-primary-800 hover:border-primary-600 bg-primary-900/20"
        }`}
        onClick={() => document.getElementById("file-input").click()}>
        <input id="file-input" type="file" multiple accept="image/*,.pdf,.svg" className="hidden" onChange={handleFileInput} />
        {/* Animated rings on hover */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div animate={dragActive ? { scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-32 h-32 rounded-full border border-blue-500/20" />
        </div>
        <motion.div animate={dragActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
          <Cloud className={`w-12 h-12 mx-auto mb-4 transition-colors duration-200 ${dragActive ? "text-blue-500" : "text-primary-600 group-hover:text-primary-400"}`} />
        </motion.div>
        <p className="text-lg font-semibold mb-1">{dragActive ? "Drop files here..." : "Drag & drop fragment images"}</p>
        <p className="text-sm text-primary-500">or click to browse • Max 50MB per file</p>
        <div className="flex justify-center gap-3 mt-4">
          {["JPEG", "PNG", "SVG", "TIFF", "PDF"].map((fmt) => (
            <span key={fmt} className="text-[10px] px-2 py-0.5 rounded bg-primary-800 text-primary-400 font-mono">{fmt}</span>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════ FILE LIST ══════════════════ */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-primary-800 flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> {files.length} Fragment{files.length > 1 ? "s" : ""} Queued</h3>
              <button onClick={() => setFiles([])} className="text-xs text-rose-400 hover:text-rose-300 transition-colors hover:underline">Clear All</button>
            </div>
            <div className="divide-y divide-primary-800 max-h-72 overflow-y-auto">
              {files.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 hover:bg-primary-900/30 transition-colors group">
                  {f.preview ? (
                    <img src={f.preview} alt={f.name} className="w-12 h-12 rounded-lg object-cover border border-primary-700 group-hover:border-blue-600/50 transition-colors" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary-800 flex items-center justify-center">
                      <FileType2 className="w-5 h-5 text-primary-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-blue-300 transition-colors">{f.name}</p>
                    <p className="text-xs text-primary-500">{formatSize(f.size)} • {f.type || 'unknown'}</p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-primary-500 hover:text-rose-400 transition-all">
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ UPLOAD BUTTON + PROGRESS ══════════════════ */}
      {files.length > 0 && !uploadResults && (
        <div className="space-y-4">
          {uploading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-primary-900/30 border border-blue-600/20 rounded-xl p-5">
              <div className="flex justify-between text-xs mb-3">
                <span className="text-primary-400 font-mono">FORENSIC SCAN IN PROGRESS...</span>
                <span className="text-blue-400 font-bold tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-primary-800 h-2.5 rounded-full overflow-hidden">
                <motion.div className="bg-blue-600 h-full rounded-full progress-striped" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
              </div>
              {/* Step indicators */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {UPLOAD_STEPS.map((step, i) => (
                  <div key={step.label} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${
                    i === currentStep ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" :
                    i < currentStep ? "text-emerald-400" : "text-primary-600"
                  }`}>
                    {i < currentStep ? <CheckCircle className="w-3 h-3" /> : i === currentStep ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="w-3 h-3 rounded-full border border-primary-700 inline-block" />}
                    {step.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleUpload} disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
            {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Forensic Scan...</> : <><Upload className="w-5 h-5" /> Upload & Analyze {files.length} Fragment{files.length > 1 ? "s" : ""}</>}
          </motion.button>
        </div>
      )}

      {/* ══════════════════ RESULTS ══════════════════ */}
      {uploadResults && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="space-y-6">

          {/* Summary Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }}>
                <div className="p-2 bg-emerald-500/20 rounded-xl"><Sparkles className="w-8 h-8 text-emerald-500" /></div>
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-1">Forensic Analysis Complete</h3>
                <p className="text-sm text-primary-400">{uploadResults.fragments.length} fragment{uploadResults.fragments.length > 1 ? 's' : ''} scanned through 6-stage AI forensic pipeline. Click any fragment below for detailed results.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Scanned", value: uploadResults.fragments.length, color: "text-white", icon: ScanEye },
                { label: "OCR Ready", value: uploadResults.fragments.filter((f) => f.ocrConfidence > 0.7).length, color: "text-emerald-400", icon: FileText },
                { label: "Fraud Flagged", value: uploadResults.fragments.filter((f) => f.fraudScore > 50).length, color: "text-rose-400", icon: AlertTriangle },
                { label: "Avg OCR", value: `${((uploadResults.fragments.reduce((a, f) => a + f.ocrConfidence, 0) / uploadResults.fragments.length) * 100).toFixed(0)}%`, color: "text-blue-400", icon: BarChart3 },
                { label: "Avg ELA", value: `${(uploadResults.fragments.reduce((a, f) => a + (f.elaScore || 0), 0) / uploadResults.fragments.length).toFixed(0)}`, color: "text-amber-400", icon: Shield },
              ].map(({ label, value, color, icon: Icon }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="bg-primary-900/50 rounded-xl p-3 text-center card-hover">
                  <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">{label}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setUploadResults(null); setExpandedFragment(null); }}
                className="flex-1 bg-primary-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all">
                Upload More
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = "/matching"}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Binary className="w-4 h-4" /> Start Matching
              </motion.button>
            </div>
          </div>

          {/* ──── Per-Fragment Results ──── */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary-300 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" /> Individual Fragment Analysis
            </h3>
            {uploadResults.fragments.map((frag, i) => {
              const isExpanded = expandedFragment === frag._id;
              const sd = frag.scanDetails;
              const fragPreview = previewMap[frag._id];
              return (
                <motion.div key={frag._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className={`bg-primary-900/30 border rounded-2xl overflow-hidden transition-all ${
                    frag.fraudScore > 50 ? "border-rose-500/30" : "border-primary-800"
                  }`}>
                  {/* Collapsed header */}
                  <button onClick={() => setExpandedFragment(isExpanded ? null : frag._id)}
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-primary-900/40 transition-colors">
                    {/* Preview thumbnail or status icon */}
                    {fragPreview ? (
                      <img src={fragPreview} alt={frag.originalName} className="w-14 h-14 rounded-xl object-cover border-2 border-primary-700 shrink-0" />
                    ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      frag.fraudScore > 50 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {frag.fraudScore > 50 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold truncate">{frag.originalName || frag.fragmentId}</span>
                        {sd?.documentType && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-800 text-primary-400 font-mono">{sd.documentType}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-primary-500">
                        <span>OCR <span className={`font-bold ${frag.ocrConfidence > 0.85 ? 'text-emerald-400' : frag.ocrConfidence > 0.6 ? 'text-amber-400' : 'text-rose-400'}`}>{(frag.ocrConfidence * 100).toFixed(1)}%</span></span>
                        <span>Fraud <span className={`font-bold ${frag.fraudScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{frag.fraudScore}/100</span></span>
                        <span>ELA <span className="font-bold text-amber-400">{typeof frag.elaScore === 'number' ? frag.elaScore.toFixed(0) : '—'}</span></span>
                        {sd?.language && <span>Lang: {sd.language}</span>}
                      </div>
                    </div>
                    {/* Mini confidence bars */}
                    <div className="hidden sm:flex gap-4 items-center shrink-0">
                      <MiniBar label="OCR" value={frag.ocrConfidence * 100} color={frag.ocrConfidence > 0.85 ? '#10b981' : frag.ocrConfidence > 0.6 ? '#f59e0b' : '#ef4444'} />
                      <MiniBar label="Fraud" value={frag.fraudScore} color={frag.fraudScore > 50 ? '#ef4444' : '#10b981'} />
                    </div>
                    {/* Unshred button */}
                    {fragPreview && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); setUnshredTarget(frag); setUnshredPhase("shredded"); }}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-600/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-600/20 transition-all cursor-pointer shrink-0">
                        <Wand2 className="w-3.5 h-3.5" /> Unshred
                      </motion.div>
                    )}
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="w-4 h-4 text-primary-500 shrink-0" />
                    </motion.div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="p-5 pt-0 space-y-5 border-t border-primary-800">

                          {/* Result Tabs */}
                          <div className="flex gap-1 bg-primary-950/50 rounded-xl p-1 w-fit mt-4">
                            {["overview", "ocr", "analysis", "pipeline"].map((t) => (
                              <button key={t} onClick={() => setActiveResultTab(t)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
                                  activeResultTab === t ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-primary-500 hover:text-white border border-transparent"
                                }`}>{t}</button>
                            ))}
                          </div>

                          {/* Uploaded Image Preview + Unshred CTA */}
                          {fragPreview && (
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              <div className="relative group/img">
                                <img src={fragPreview} alt={frag.originalName}
                                  className="w-full sm:w-64 h-auto max-h-56 rounded-xl object-contain border border-primary-700 bg-primary-950" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                  <span className="text-[10px] text-white/80 font-mono">Uploaded Fragment</span>
                                </div>
                              </div>
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => { setUnshredTarget(frag); setUnshredPhase("shredded"); }}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600/10 border border-violet-600/20 text-violet-400 text-xs font-bold uppercase tracking-wider hover:bg-violet-600/20 transition-all sm:hidden">
                                <Wand2 className="w-4 h-4" /> Unshred This Fragment
                              </motion.button>
                            </div>
                          )}

                          {/* TAB: Overview */}
                          {activeResultTab === "overview" && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: "OCR Confidence", value: `${(frag.ocrConfidence * 100).toFixed(1)}%`, icon: ScanEye, color: frag.ocrConfidence > 0.85 ? "text-emerald-400" : "text-amber-400" },
                                { label: "Fraud Score", value: `${frag.fraudScore}/100`, icon: Shield, color: frag.fraudScore > 50 ? "text-rose-400" : "text-emerald-400" },
                                { label: "ELA Score", value: typeof frag.elaScore === 'number' ? frag.elaScore.toFixed(0) : '—', icon: Fingerprint, color: "text-amber-400" },
                                { label: "Document Type", value: sd?.documentType || "Unknown", icon: FileText, color: "text-blue-400", isText: true },
                              ].map(({ label, value, icon: Icon, color, isText }) => (
                                <div key={label} className="bg-primary-950/50 rounded-xl p-3">
                                  <Icon className={`w-4 h-4 ${color} mb-1.5`} />
                                  <p className={`${isText ? 'text-xs' : 'text-lg font-bold'} ${color}`}>{value}</p>
                                  <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">{label}</p>
                                </div>
                              ))}
                              {sd?.edgeAnalysis && (
                                <>
                                  <div className="bg-primary-950/50 rounded-xl p-3">
                                    <Scissors className="w-4 h-4 text-violet-400 mb-1.5" />
                                    <p className="text-xs text-violet-400">{sd.edgeAnalysis.shredType}</p>
                                    <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">Shred Pattern</p>
                                  </div>
                                  <div className="bg-primary-950/50 rounded-xl p-3">
                                    <Layers className="w-4 h-4 text-cyan-400 mb-1.5" />
                                    <p className="text-xs text-cyan-400">{sd.edgeAnalysis.matchPotential}</p>
                                    <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">Match Potential</p>
                                  </div>
                                  <div className="bg-primary-950/50 rounded-xl p-3">
                                    <FileImage className="w-4 h-4 text-primary-300 mb-1.5" />
                                    <p className="text-xs text-primary-300">{sd.edgeAnalysis.paperGSM}</p>
                                    <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">Paper Weight</p>
                                  </div>
                                  <div className="bg-primary-950/50 rounded-xl p-3">
                                    <Hash className="w-4 h-4 text-primary-300 mb-1.5" />
                                    <p className="text-xs text-primary-300 truncate">{sd.edgeAnalysis.tearPattern}</p>
                                    <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">Tear Pattern</p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* TAB: OCR */}
                          {activeResultTab === "ocr" && (
                            <div className="bg-primary-950 rounded-xl overflow-hidden border border-primary-800">
                              <div className="p-3 border-b border-primary-800 flex justify-between items-center">
                                <span className="text-[10px] text-primary-500 uppercase tracking-widest font-bold">Extracted Text</span>
                                <span className="text-[10px] text-primary-500 font-mono">Confidence: {(frag.ocrConfidence * 100).toFixed(1)}%</span>
                              </div>
                              <pre className="p-4 text-xs text-primary-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                                {frag.ocrText || "No text extracted from this fragment."}
                              </pre>
                            </div>
                          )}

                          {/* TAB: Analysis */}
                          {activeResultTab === "analysis" && (
                            <div className="space-y-4">
                              <div className={`rounded-xl p-4 border ${
                                frag.fraudScore > 50 ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                              }`}>
                                <div className="flex items-center gap-2 mb-3">
                                  {frag.fraudScore > 50
                                    ? <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                  <span className={`text-xs font-bold uppercase tracking-wider ${frag.fraudScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {frag.fraudScore > 50 ? 'Fraud Indicators Detected' : 'Document Appears Authentic'}
                                  </span>
                                </div>
                                <pre className="text-xs text-primary-300 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                                  {frag.analysisNotes || "No analysis notes available."}
                                </pre>
                              </div>
                              {/* Confidence meter visual */}
                              <div className="grid grid-cols-3 gap-3">
                                <ConfidenceMeter label="OCR Confidence" value={frag.ocrConfidence * 100} max={100} color={frag.ocrConfidence > 0.85 ? '#10b981' : '#f59e0b'} />
                                <ConfidenceMeter label="Fraud Score" value={frag.fraudScore} max={100} color={frag.fraudScore > 50 ? '#ef4444' : '#10b981'} />
                                <ConfidenceMeter label="ELA Score" value={typeof frag.elaScore === 'number' ? frag.elaScore : 0} max={100} color="#f59e0b" />
                              </div>
                            </div>
                          )}

                          {/* TAB: Pipeline */}
                          {activeResultTab === "pipeline" && sd?.processingSteps && (
                            <div className="space-y-2">
                              {sd.processingSteps.map((step, si) => (
                                <motion.div key={si} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.06 }}
                                  className="bg-primary-950/50 border border-primary-800 rounded-xl p-3 flex items-start gap-3">
                                  <div className="mt-0.5">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                      <span className="text-xs font-bold">{step.step}</span>
                                      <span className="text-[10px] text-primary-500 font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {step.duration}</span>
                                    </div>
                                    <p className="text-[11px] text-primary-400 leading-relaxed">{step.detail}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════ UNSHRED MODAL ══════════════════ */}
      <AnimatePresence>
        {unshredTarget && (
          <UnshredModal
            fragment={unshredTarget}
            previewUrl={previewMap[unshredTarget._id]}
            phase={unshredPhase}
            onStart={() => setUnshredPhase("animating")}
            onDone={() => setUnshredPhase("done")}
            onReset={() => setUnshredPhase("shredded")}
            onClose={() => { setUnshredTarget(null); setUnshredPhase("shredded"); }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

/* ─── Unshred Modal ─── */

const STRIP_COUNT = 10;

// Deterministic scatter positions for strips
const getScatterPositions = (count) =>
  Array.from({ length: count }, (_, i) => ({
    x: (i % 2 === 0 ? -1 : 1) * (60 + Math.sin(i * 1.8) * 80),
    y: (Math.cos(i * 2.3) * 50) + (i - count / 2) * 12,
    rotate: (i - count / 2) * 6 + Math.sin(i) * 8,
  }));

const UnshredModal = ({ fragment, previewUrl, phase, onStart, onDone, onReset, onClose }) => {
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 400, h: 300 });
  const scatterPositions = useRef(getScatterPositions(STRIP_COUNT)).current;

  // Get natural image dimensions
  const handleImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    // Scale to fit within modal (max 500px wide, 400px tall)
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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-primary-950 border border-primary-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-primary-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600/10 rounded-lg">
              <Wand2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Document Reconstruction</h3>
              <p className="text-[10px] text-primary-500">{fragment.originalName || fragment.fragmentId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Area */}
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
                (phase === "done" && key === "shredded") || (phase === "animating" && key === "shredded") ? "text-emerald-400" :
                "text-primary-600"
              }`}>
                {(phase === "done" && key !== "done") || (phase === "animating" && key === "shredded")
                  ? <CheckCircle className="w-3 h-3" />
                  : phase === key && key === "animating"
                    ? <Icon className="w-3 h-3 animate-spin" />
                    : <Icon className="w-3 h-3" />
                }
                {label}
              </div>
            ))}
          </div>

          {/* Image strips area */}
          <div className="relative bg-primary-900/30 rounded-xl border border-primary-800 overflow-hidden"
            style={{ width: imgSize.w + 40, height: imgSize.h + 80 }}>

            {/* Hidden image to measure size */}
            {previewUrl && (
              <img ref={imgRef} src={previewUrl} alt="" onLoad={handleImgLoad}
                className="absolute opacity-0 pointer-events-none" />
            )}

            {/* Strips container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: imgSize.w, height: imgSize.h }}>
                {previewUrl && Array.from({ length: STRIP_COUNT }).map((_, i) => {
                  const isShredded = phase === "shredded";
                  const isAnimating = phase === "animating";
                  const isDone = phase === "done";
                  const scatter = scatterPositions[i];

                  return (
                    <motion.div
                      key={i}
                      className="absolute top-0 overflow-hidden"
                      style={{
                        width: stripWidth + 0.5,
                        height: imgSize.h,
                        left: i * stripWidth,
                      }}
                      initial={false}
                      animate={{
                        x: isShredded ? scatter.x : 0,
                        y: isShredded ? scatter.y : 0,
                        rotate: isShredded ? scatter.rotate : 0,
                        opacity: 1,
                      }}
                      transition={
                        isAnimating
                          ? { type: "spring", stiffness: 120, damping: 18, delay: i * 0.1 }
                          : { duration: 0.3 }
                      }
                    >
                      {/* Shadow when scattered */}
                      {isShredded && (
                        <div className="absolute inset-0 rounded shadow-lg shadow-black/50" />
                      )}
                      <div
                        className={`w-full h-full ${isShredded ? "border border-primary-600/40 rounded" : ""}`}
                        style={{
                          backgroundImage: `url(${previewUrl})`,
                          backgroundSize: `${imgSize.w}px ${imgSize.h}px`,
                          backgroundPosition: `-${i * stripWidth}px 0`,
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </motion.div>
                  );
                })}

                {/* Success overlay */}
                <AnimatePresence>
                  {phase === "done" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                        className="bg-emerald-500/90 rounded-full p-3 shadow-lg shadow-emerald-500/30"
                      >
                        <CheckCircle className="w-8 h-8 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Info bar */}
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

          {/* Action buttons */}
          <div className="flex gap-3 w-full">
            {phase === "shredded" && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onStart}
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
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={onReset}
                  className="flex-1 bg-primary-800 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={onClose}
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

/* ─── Mini helper components ─── */

const MiniBar = ({ label, value, color }) => (
  <div className="w-16">
    <div className="flex justify-between text-[9px] text-primary-500 mb-0.5">
      <span>{label}</span>
      <span style={{ color }}>{Math.round(value)}</span>
    </div>
    <div className="w-full bg-primary-800 h-1 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }} transition={{ duration: 0.8 }}
        className="h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  </div>
);

const ConfidenceMeter = ({ label, value, max, color }) => {
  const pct = Math.min((value / max) * 100, 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-primary-950/50 rounded-xl p-4 flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e293b" strokeWidth="6" />
        <motion.circle cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3 }}
          transform="rotate(-90 44 44)" />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="central" fill="white"
          fontSize="16" fontWeight="bold" fontFamily="monospace">{Math.round(value)}</text>
      </svg>
      <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
};

export default UploadFragments;
