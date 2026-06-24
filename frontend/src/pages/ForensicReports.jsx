import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Loader2, ChevronDown, Shield, AlertTriangle, CheckCircle, BarChart3, Calendar, User, Binary, Eye,
} from "lucide-react";
import { getCases, getFragmentsByCase, getMatchesByCase, getDashboardStats } from "../services/mockApi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import FragmentLightbox from "../components/viewer/FragmentLightbox";

const ForensicReports = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const [lightboxFragment, setLightboxFragment] = useState(null);

  useEffect(() => { getCases().then(setCases); }, []);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    setReportGenerated(false);
    const c = cases.find((x) => x._id === selectedCase);
    setCaseData(c);
    Promise.all([getFragmentsByCase(selectedCase), getMatchesByCase(selectedCase)])
      .then(([frags, matchData]) => {
        setFragments(frags);
        setMatches(matchData.pairs || []);
      })
      .finally(() => setLoading(false));
  }, [selectedCase, cases]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setReportGenerated(true);
      toast.success("Forensic report generated successfully.");
    }, 2500);
  };

  const handleDownload = () => {
    const report = generateReportText();
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FORENSIC_REPORT_${caseData?.caseId || "UNKNOWN"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded.");
  };

  const generateReportText = () => {
    const c = caseData;
    const confirmedMatches = matches.filter((m) => m.status === "confirmed");
    const fraudFragments = fragments.filter((f) => f.fraudScore > 50);
    const avgOCR = fragments.length
      ? (fragments.reduce((a, f) => a + f.ocrConfidence, 0) / fragments.length * 100).toFixed(1)
      : 0;

    return `
═══════════════════════════════════════════════════
         FORENSIC DOCUMENT RECONSTRUCTION REPORT
        AI-Assisted Shredded Document Analysis System
═══════════════════════════════════════════════════

CASE REFERENCE: ${c?.caseId || "N/A"}
CASE NAME:      ${c?.name || "N/A"}
STATUS:         ${c?.status || "N/A"}
PRIORITY:       ${c?.priority || "N/A"}
CREATED:        ${c?.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}
ANALYST:        ${user?.name || "N/A"}
GENERATED:      ${new Date().toLocaleString()}

───────────────────────────────────────────────────
                    EXECUTIVE SUMMARY
───────────────────────────────────────────────────

${c?.description || "No description available."}

Total Fragments Analyzed:       ${fragments.length}
Fragment Matches Identified:    ${matches.length}
Confirmed Reconstructions:      ${confirmedMatches.length}
Fragments with Fraud Indicators: ${fraudFragments.length}
Average OCR Confidence:         ${avgOCR}%
Document Reconstruction:        ${c?.reconstructionProgress || 0}%

───────────────────────────────────────────────────
                  FRAGMENT ANALYSIS
───────────────────────────────────────────────────
${fragments.map((f) => `
[${f.fragmentId}]
  OCR Confidence: ${(f.ocrConfidence * 100).toFixed(1)}%
  Fraud Score:    ${f.fraudScore}/100 ${f.fraudScore > 50 ? "⚠ FLAGGED" : "✓ CLEAR"}
  ELA Score:      ${f.elaScore?.toFixed(2) || "N/A"}
  OCR Text:       "${f.ocrText?.slice(0, 120) || "No text extracted"}"
  Analysis:       ${f.analysisNotes || "Standard processing"}
`).join("")}

───────────────────────────────────────────────────
                  MATCH RESULTS
───────────────────────────────────────────────────
${matches.map((m) => {
  const fA = fragments.find((f) => f._id === m.fragmentA);
  const fB = fragments.find((f) => f._id === m.fragmentB);
  return `[${m._id.slice(-8)}] ${fA?.fragmentId || "?"} ↔ ${fB?.fragmentId || "?"} | Confidence: ${m.confidence}% | Status: ${m.status?.toUpperCase() || "PENDING"} | Types: ${m.matchType?.join(", ") || "N/A"}`;
}).join("\n")}

───────────────────────────────────────────────────
                  INTEGRITY NOTES
───────────────────────────────────────────────────
${fraudFragments.length > 0
  ? `WARNING: ${fraudFragments.length} fragment(s) exhibit potential tampering indicators:\n${fraudFragments.map((f) => `  - ${f.fragmentId}: Fraud Score ${f.fraudScore}/100, ELA ${f.elaScore?.toFixed(2) || "N/A"}`).join("\n")}`
  : "No tampering indicators detected across analyzed fragments."
}

───────────────────────────────────────────────────
This report was generated by CrimeX ASDAS v2.0.0
AI-Assisted Shredded Document Analysis System
Classification: RESTRICTED — For authorized use only
═══════════════════════════════════════════════════
    `.trim();
  };

  const confirmedMatches = matches.filter((m) => m.status === "confirmed");
  const fraudFragments = fragments.filter((f) => f.fraudScore > 50);
  const avgOCR = fragments.length ? (fragments.reduce((a, f) => a + f.ocrConfidence, 0) / fragments.length * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Forensic Reports</h1>
        <p className="text-primary-400">Generate comprehensive forensic analysis reports for case documentation and evidence submission.</p>
      </motion.header>

      {/* Case Selector */}
      <div className="bg-primary-900/40 border border-primary-800 rounded-2xl p-6">
        <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-3">Select Case for Report</label>
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
          <p className="text-sm text-primary-500 font-mono tracking-widest">COMPILING CASE DATA...</p>
        </div>
      )}

      {/* Case Overview */}
      {caseData && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Fragments", value: fragments.length, icon: BarChart3, color: "text-blue-400" },
              { label: "Matches", value: matches.length, icon: Binary, color: "text-violet-400" },
              { label: "Confirmed", value: confirmedMatches.length, icon: CheckCircle, color: "text-emerald-400" },
              { label: "OCR Confidence", value: `${avgOCR}%`, icon: FileText, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2 }} className="bg-primary-900/30 border border-primary-800 rounded-xl p-4 card-hover">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-primary-500 uppercase tracking-widest mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Case Info */}
          <div className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">{caseData.name}</h3>
            <p className="text-sm text-primary-400 mb-4 leading-relaxed">{caseData.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-primary-400"><Shield className="w-4 h-4" /> {caseData.caseId}</div>
              <div className="flex items-center gap-2 text-primary-400"><Calendar className="w-4 h-4" /> {new Date(caseData.createdAt).toLocaleDateString()}</div>
              <div className="flex items-center gap-2 text-primary-400"><User className="w-4 h-4" /> {user?.name || "Analyst"}</div>
              <div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  caseData.priority === "Critical" ? "bg-rose-500/10 text-rose-400" : caseData.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                }`}>{caseData.priority}</span>
              </div>
            </div>
          </div>

          {/* Fraud Alerts */}
          {fraudFragments.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
                <h3 className="font-bold text-rose-400">Integrity Warnings</h3>
              </div>
              <div className="space-y-2">
                {fraudFragments.map((f, i) => (
                  <motion.div key={f._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex justify-between items-center text-sm bg-rose-500/5 rounded-lg p-3 hover:bg-rose-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                      {f.thumbnail && <img src={f.thumbnail} alt={f.originalName} className="w-14 h-9 rounded object-cover border border-rose-500/20 cursor-pointer hover:ring-2 hover:ring-rose-500/50 transition-all" onClick={() => setLightboxFragment(f)} />}
                      <span className="font-mono text-rose-300">{f.fragmentId}</span>
                    </div>
                    <span className="text-rose-400">Fraud Score: <span className="font-bold">{f.fraudScore}/100</span></span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Reconstruction Progress */}
          <div className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Document Reconstruction Progress</h3>
              <span className="text-blue-400 font-mono text-sm font-bold">{caseData.reconstructionProgress}%</span>
            </div>
            <div className="w-full bg-primary-800 h-3 rounded-full overflow-hidden">
              <motion.div className="bg-blue-600 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${caseData.reconstructionProgress}%` }} transition={{ duration: 1 }} />
            </div>
          </div>

          {/* Generate */}
          <div className="flex gap-4">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleGenerate} disabled={generating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</> : <><FileText className="w-5 h-5" /> Generate Forensic Report</>}
            </motion.button>
            {reportGenerated && (
              <motion.button initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                <Download className="w-5 h-5" /> Download
              </motion.button>
            )}
          </div>

          {/* Report Preview */}
          {reportGenerated && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-primary-950 border border-primary-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-primary-800 flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Report Preview</h3>
                <span className="text-[10px] text-primary-500 font-mono">FORENSIC_REPORT_{caseData.caseId}.txt</span>
              </div>
              <pre className="p-6 text-xs text-primary-300 font-mono whitespace-pre-wrap max-h-125 overflow-y-auto leading-relaxed">
                {generateReportText()}
              </pre>
            </motion.div>
          )}
        </motion.div>
      )}

      {!selectedCase && !loading && (
        <div className="text-center py-20 border border-dashed border-primary-800 rounded-2xl">
          <FileText className="w-12 h-12 text-primary-700 mx-auto mb-4" />
          <p className="text-primary-400 mb-1 font-medium">No case selected</p>
          <p className="text-sm text-primary-500">Choose a case above to generate its forensic report.</p>
        </div>
      )}
      <AnimatePresence>
        {lightboxFragment && (
          <FragmentLightbox fragment={lightboxFragment} onClose={() => setLightboxFragment(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForensicReports;
