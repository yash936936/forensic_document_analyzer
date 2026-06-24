import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, Layers, Puzzle, FileText, Shield, Calendar, Clock, CheckCircle, AlertTriangle,
  ScanEye, BarChart3, Binary, ChevronRight, Eye,
} from "lucide-react";
import { getCaseById, getFragmentsByCase, getMatchesByCase } from "../services/mockApi";
import FragmentLightbox from "../components/viewer/FragmentLightbox";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

const CaseDetail = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [assemblyGroups, setAssemblyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [lightboxFragment, setLightboxFragment] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCaseById(caseId), getFragmentsByCase(caseId), getMatchesByCase(caseId)])
      .then(([c, frags, matchData]) => {
        setCaseData(c);
        setFragments(frags);
        setMatches(matchData.pairs || []);
        setAssemblyGroups(matchData.assemblyGroups || []);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-32">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-primary-500 font-mono tracking-widest">DECRYPTING CASE FILE...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-32">
        <p className="text-primary-400 text-lg">Case not found.</p>
        <button onClick={() => navigate("/")} className="mt-4 text-blue-500 hover:text-blue-400 text-sm">Back to Dashboard</button>
      </div>
    );
  }

  const confirmedMatches = matches.filter((m) => m.status === "confirmed");
  const fraudFragments = fragments.filter((f) => f.fraudScore > 50);
  const avgOCR = fragments.length ? (fragments.reduce((a, f) => a + f.ocrConfidence, 0) / fragments.length * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Back */}
      <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")} className="flex items-center gap-2 text-primary-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Cases
      </motion.button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs text-primary-500">{caseData.caseId}</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                caseData.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : caseData.status === "Processing" ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
              }`}>{caseData.status}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                caseData.priority === "Critical" ? "bg-rose-500/20 text-rose-400"
                : caseData.priority === "High" ? "bg-amber-500/20 text-amber-400"
                : "bg-primary-800 text-primary-400"
              }`}>{caseData.priority}</span>
            </div>
            <h1 className="text-2xl font-bold">{caseData.name}</h1>
            <p className="text-sm text-primary-400 mt-2 leading-relaxed max-w-2xl">{caseData.description}</p>
          </div>
          <div className="flex gap-2 text-xs text-primary-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(caseData.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {new Date(caseData.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-primary-400 font-medium">Document Reconstruction</span>
            <span className="text-blue-400 font-bold">{caseData.reconstructionProgress}%</span>
          </div>
          <div className="w-full bg-primary-800 h-3 rounded-full overflow-hidden">
            <motion.div className="bg-blue-600 h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${caseData.reconstructionProgress}%` }} transition={{ duration: 1 }} />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Fragments", value: fragments.length, icon: Layers, color: "text-blue-400" },
          { label: "Matches", value: matches.length, icon: Puzzle, color: "text-violet-400" },
          { label: "Confirmed", value: confirmedMatches.length, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Avg OCR", value: `${avgOCR}%`, icon: ScanEye, color: "text-amber-400" },
          { label: "Fraud Flags", value: fraudFragments.length, icon: AlertTriangle, color: "text-rose-400" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
            whileHover={{ y: -2 }} className="bg-primary-900/30 border border-primary-800 rounded-xl p-4 text-center card-hover">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-primary-500 uppercase tracking-widest mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary-900/30 rounded-xl p-1 border border-primary-800 w-fit">
        {[
          { key: "overview", label: "Overview" },
          { key: "fragments", label: "Fragments" },
          { key: "matches", label: "Matches" },
          { key: "assembly", label: "Assembly" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-primary-400 hover:text-white border border-transparent"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            {[
              { label: "Upload More Fragments", icon: Layers, to: "/upload", color: "bg-blue-600/10 text-blue-400 border-blue-600/20" },
              { label: "Run Fragment Matching", icon: Puzzle, to: "/matching", color: "bg-violet-600/10 text-violet-400 border-violet-600/20" },
              { label: "Review OCR Text", icon: ScanEye, to: "/ocr", color: "bg-emerald-600/10 text-emerald-400 border-emerald-600/20" },
              { label: "Generate Report", icon: FileText, to: "/reports", color: "bg-amber-600/10 text-amber-400 border-amber-600/20" },
            ].map(({ label, icon: Icon, to, color }) => (
              <motion.button key={to} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(to)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all ${color}`}>
                <Icon className="w-4 h-4 shrink-0" /> {label} <ChevronRight className="w-3 h-3 ml-auto" />
              </motion.button>
            ))}
          </div>

          {/* Integrity */}
          <div className="space-y-4">
            {fraudFragments.length > 0 ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3"><AlertTriangle className="w-5 h-5 text-rose-500" /><h3 className="font-bold text-rose-400">Integrity Alerts</h3></div>
                <div className="space-y-2">
                  {fraudFragments.map((f) => (
                    <div key={f._id} className="flex justify-between text-sm bg-rose-500/5 rounded-lg p-3">
                      <span className="font-mono text-rose-300">{f.fragmentId}</span>
                      <span className="text-rose-400 font-mono">Score: {f.fraudScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /><h3 className="font-bold text-emerald-400">All Clear</h3></div>
                <p className="text-sm text-emerald-500/80 mt-2">No tampering indicators detected in any fragments.</p>
              </div>
            )}

            <div className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6">
              <h3 className="font-bold mb-3">Case Metadata</h3>
              <div className="space-y-2 text-sm">
                {[
                  { k: "Case ID", v: caseData.caseId },
                  { k: "Created", v: new Date(caseData.createdAt).toLocaleString() },
                  { k: "Last Update", v: new Date(caseData.updatedAt).toLocaleString() },
                  { k: "Evidence Type", v: caseData.evidenceType || "Shredded Documents" },
                  { k: "Classification", v: "RESTRICTED" },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-primary-800/50">
                    <span className="text-primary-500">{k}</span>
                    <span className="text-primary-300 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "fragments" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fragments.map((f, i) => (
            <motion.div key={f._id} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04 }} whileHover={{ scale: 1.03, y: -2 }}
              className="bg-primary-900/30 border border-primary-800 rounded-xl overflow-hidden hover:border-primary-700 transition-all card-hover">
              <div className="h-28 flex items-center justify-center relative overflow-hidden cursor-pointer" style={{ backgroundColor: COLORS[i % COLORS.length] + "15" }}
                onClick={() => f.thumbnail && setLightboxFragment(f)}>
                {f.thumbnail ? (
                  <img src={f.thumbnail} alt={f.originalName || f.fragmentId} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black opacity-30" style={{ color: COLORS[i % COLORS.length] }}>{f.label || "F"}</span>
                )}
                {f.thumbnail && <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"><Eye className="w-5 h-5 text-white" /></div>}
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs">{f.fragmentId}</span>
                  {f.fraudScore > 50 && <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><AlertTriangle className="w-3 h-3 text-rose-500" /></motion.div>}
                </div>
                <div className="w-full bg-primary-800 h-0.5 rounded-full overflow-hidden my-1.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${f.ocrConfidence * 100}%` }} transition={{ duration: 0.6, delay: i * 0.04 }}
                    className={`h-full rounded-full ${f.ocrConfidence > 0.85 ? 'bg-emerald-500' : f.ocrConfidence > 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                </div>
                <div className="flex gap-2 text-[10px] mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 font-mono">OCR {(f.ocrConfidence * 100).toFixed(0)}%</span>
                  <span className={`px-1.5 py-0.5 rounded font-mono ${f.fraudScore > 50 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    Fraud {f.fraudScore}
                  </span>
                </div>
                <p className="text-[10px] text-primary-500 line-clamp-2 font-mono">{f.ocrText?.slice(0, 60) || "—"}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "matches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed border-primary-800 rounded-2xl">
              <p className="text-primary-400">No matches found. Run auto-match from the Fragment Matching page.</p>
            </div>
          ) : matches.map((m) => {
            const fA = fragments.find((f) => f._id === m.fragmentA);
            const fB = fragments.find((f) => f._id === m.fragmentB);
            return (
              <div key={m._id} className={`bg-primary-900/30 border rounded-xl p-4 ${
                m.status === "confirmed" ? "border-emerald-500/30" : m.status === "rejected" ? "border-rose-500/30 opacity-60" : "border-primary-800"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-blue-400">{fA?.fragmentId || "?"}</span>
                  <span className="text-primary-500">↔</span>
                  <span className="font-mono text-xs text-violet-400">{fB?.fragmentId || "?"}</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.confidence > 85 ? "bg-emerald-500/10 text-emerald-500" : m.confidence > 60 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                  }`}>{m.confidence}%</span>
                </div>
                <div className="flex gap-2 flex-wrap text-[9px]">
                  {m.matchType?.map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-primary-800 text-primary-400 uppercase font-mono">{t}</span>)}
                  <span className={`ml-auto px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                    m.status === "confirmed" ? "text-emerald-500" : m.status === "rejected" ? "text-rose-400" : "text-primary-500"
                  }`}>{m.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "assembly" && (
        <div className="space-y-4">
          {assemblyGroups.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-primary-800 rounded-2xl">
              <p className="text-primary-400">No assembly groups yet.</p>
            </div>
          ) : assemblyGroups.map((group, i) => (
            <div key={group.groupId} className="bg-primary-900/30 border border-primary-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {group.name}
                </h3>
                <span className="text-sm font-bold text-blue-400">{group.progress}%</span>
              </div>
              <div className="w-full bg-primary-800 h-2 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${group.progress}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {group.fragmentIds.map((fid) => {
                  const frag = fragments.find((f) => f._id === fid);
                  return <span key={fid} className="px-2 py-1 rounded bg-primary-800 text-xs font-mono text-primary-400">{frag?.fragmentId || fid.slice(-6)}</span>;
                })}
              </div>
            </div>
          ))}
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

export default CaseDetail;
