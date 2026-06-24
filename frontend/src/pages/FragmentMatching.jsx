import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Puzzle, ChevronDown, Loader2, CheckCircle, XCircle, Zap, Eye, Layers, ArrowRight,
  Binary, ShieldAlert, ScanEye, FileText, Fingerprint, Shield, Hash, Scissors,
  ChevronRight, AlertTriangle, Clock, X, GitCompareArrows, LayoutGrid,
  ArrowLeftRight, Sparkles, Target, BarChart3, Link2, Unlink,
} from "lucide-react";
import { getCases, getFragmentsByCase, getMatchesByCase, runAutoMatch, confirmMatch, rejectMatch } from "../services/mockApi";
import { useToast } from "../context/ToastContext";
import FragmentLightbox from "../components/viewer/FragmentLightbox";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

const MATCH_STAGES = [
  { label: "Loading Fragments", icon: Layers },
  { label: "Edge Analysis", icon: Scissors },
  { label: "Feature Extraction", icon: Fingerprint },
  { label: "CNN Comparison", icon: Binary },
  { label: "Content Matching", icon: FileText },
  { label: "Scoring & Ranking", icon: BarChart3 },
];

/* ─────────────────────────────────────────────── */
/*  Fragment Card (grid item)                       */
/* ─────────────────────────────────────────────── */
const FragmentCard = ({ fragment, selected, onClick, onImageClick, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.04, duration: 0.3 }}
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 group card-hover ${
      selected
        ? "border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10"
        : "border-primary-800 hover:border-primary-700"
    }`}
  >
    <div
      className="w-full h-32 flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: color + "20" }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 70%)`,
        }}
      />
      {fragment.thumbnail ? (
        <img src={fragment.thumbnail} alt={fragment.originalName || fragment.fragmentId} className="w-full h-full object-cover relative" />
      ) : (
        <div className="text-center relative">
          <p
            className="text-4xl font-black opacity-40 group-hover:opacity-60 transition-opacity"
            style={{ color }}
          >
            {fragment.label || "F"}
          </p>
          <p className="text-[9px] font-mono mt-1 text-primary-500">
            {fragment.fragmentId}
          </p>
        </div>
      )}
      {fragment.thumbnail && onImageClick && (
        <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); onImageClick(fragment); }}>
          <div className="w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer">
            <Eye className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}
    </div>
    <div className="p-3 bg-primary-900/50">
      <div className="flex justify-between items-center text-xs mb-2">
        <span className="text-primary-400 font-mono group-hover:text-white transition-colors truncate">
          {fragment.originalName || fragment.fragmentId}
        </span>
        {fragment.fraudScore > 50 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </motion.div>
        )}
      </div>
      {/* Confidence bar */}
      <div className="w-full bg-primary-800 h-1 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fragment.ocrConfidence * 100}%` }}
          transition={{ duration: 0.8, delay: index * 0.04 }}
          className={`h-full rounded-full ${
            fragment.ocrConfidence > 0.85
              ? "bg-emerald-500"
              : fragment.ocrConfidence > 0.6
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
        />
      </div>
      <div className="flex gap-2 text-[10px]">
        <span className="px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 font-mono">
          OCR {(fragment.ocrConfidence * 100).toFixed(0)}%
        </span>
        <span
          className={`px-1.5 py-0.5 rounded font-mono ${
            fragment.fraudScore > 50
              ? "bg-rose-500/10 text-rose-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          Fraud {fragment.fraudScore}
        </span>
      </div>
      {fragment.ocrText && (
        <p className="text-[10px] text-primary-500 mt-2 line-clamp-2 font-mono leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
          "{fragment.ocrText.slice(0, 80)}…"
        </p>
      )}
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────── */
/*  Match Pair Card                                 */
/* ─────────────────────────────────────────────── */
const MatchPairCard = ({ match, onConfirm, onReject, fragments, onViewDetail }) => {
  const fA = fragments.find((f) => f._id === match.fragmentA);
  const fB = fragments.find((f) => f._id === match.fragmentB);
  const isConfirmed = match.status === "confirmed";
  const isRejected = match.status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`bg-primary-900/30 border rounded-xl overflow-hidden transition-all card-hover ${
        isConfirmed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isRejected
          ? "border-rose-500/30 bg-rose-500/5 opacity-60"
          : "border-primary-800"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="px-2 py-1 rounded bg-blue-600/10 text-blue-400 text-xs font-mono truncate max-w-30">
              {fA?.fragmentId || match.fragmentA?.slice(-6)}
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <div className="px-2 py-1 rounded bg-violet-600/10 text-violet-400 text-xs font-mono truncate max-w-30">
              {fB?.fragmentId || match.fragmentB?.slice(-6)}
            </div>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              match.confidence > 85
                ? "bg-emerald-500/10 text-emerald-500"
                : match.confidence > 60
                ? "bg-amber-500/10 text-amber-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {match.confidence}%
          </div>
        </div>

        {/* Match Type badges */}
        {match.matchType && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {match.matchType.map((t) => (
              <span
                key={t}
                className="text-[9px] px-2 py-0.5 rounded bg-primary-800 text-primary-400 uppercase tracking-wider font-mono"
              >
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {match.description && (
          <p className="text-[11px] text-primary-400 leading-relaxed mb-3 line-clamp-2">
            {match.description}
          </p>
        )}

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="w-full bg-primary-800 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${match.confidence}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                match.confidence > 85
                  ? "bg-emerald-500"
                  : match.confidence > 60
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isConfirmed && !isRejected ? (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onConfirm(match._id)}
                className="flex-1 bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onReject(match._id)}
                className="flex-1 bg-rose-600/10 border border-rose-600/30 text-rose-400 py-2 rounded-lg text-xs font-bold hover:bg-rose-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </motion.button>
            </>
          ) : (
            <div
              className={`flex-1 text-xs font-bold uppercase tracking-widest text-center py-2 rounded-lg ${
                isConfirmed
                  ? "text-emerald-500 bg-emerald-500/5"
                  : "text-rose-400 bg-rose-500/5"
              }`}
            >
              {isConfirmed ? "✓ CONFIRMED" : "✗ REJECTED"}
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewDetail(match)}
            className="px-3 py-2 bg-primary-800 border border-primary-700 rounded-lg text-xs text-primary-300 hover:text-white hover:bg-primary-700 transition-all"
            title="Compare side-by-side"
          >
            <Eye className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Confidence Ring (small)                         */
/* ─────────────────────────────────────────────── */
const ConfRing = ({ value, max = 100, color, size = 56, label }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 0.8, delay: 0.2 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={size < 60 ? "11" : "14"}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {Math.round(value)}
        </text>
      </svg>
      {label && (
        <p className="text-[8px] text-primary-500 uppercase tracking-widest mt-1">
          {label}
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Side-by-side Match Comparison Modal             */
/* ─────────────────────────────────────────────── */
const MatchDetailModal = ({ match, fragments, onClose }) => {
  const fA = fragments.find((f) => f._id === match.fragmentA);
  const fB = fragments.find((f) => f._id === match.fragmentB);
  const [compareTab, setCompareTab] = useState("overview");

  if (!fA || !fB) return null;

  const fragPanel = (frag, side) => (
    <div className="flex-1 min-w-0 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            side === "A" ? "bg-blue-500" : "bg-violet-500"
          }`}
        />
        <span className="text-xs font-bold font-mono">
          {frag.fragmentId}
        </span>
        {frag.fraudScore > 50 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
            FLAGGED
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex gap-3 justify-center">
        <ConfRing
          value={frag.ocrConfidence * 100}
          color={frag.ocrConfidence > 0.85 ? "#10b981" : "#f59e0b"}
          label="OCR"
        />
        <ConfRing
          value={frag.fraudScore}
          color={frag.fraudScore > 50 ? "#ef4444" : "#10b981"}
          label="Fraud"
        />
        <ConfRing
          value={
            typeof frag.elaScore === "number"
              ? frag.elaScore < 1
                ? frag.elaScore * 100
                : frag.elaScore
              : 0
          }
          color="#f59e0b"
          label="ELA"
        />
      </div>

      {/* OCR text */}
      {compareTab === "overview" && (
        <div className="bg-primary-950 rounded-lg border border-primary-800 p-3">
          <p className="text-[9px] text-primary-500 uppercase tracking-widest mb-2 font-bold">
            Original: {frag.originalName}
          </p>
          <pre className="text-[10px] text-primary-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {frag.ocrText || "No text extracted"}
          </pre>
        </div>
      )}

      {/* Analysis */}
      {compareTab === "analysis" && (
        <div
          className={`rounded-lg p-3 border text-[11px] font-mono leading-relaxed ${
            frag.fraudScore > 50
              ? "bg-rose-500/5 border-rose-500/20 text-rose-300"
              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
          }`}
        >
          <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto">
            {frag.analysisNotes || "No analysis notes available."}
          </pre>
        </div>
      )}

      {/* Edge features */}
      {compareTab === "features" && (
        <div className="space-y-2">
          {frag.features?.edgeGeometry && (
            <div className="bg-primary-950 rounded-lg border border-primary-800 p-3">
              <p className="text-[9px] text-primary-500 uppercase tracking-widest mb-2 font-bold">
                Edge Geometry Vector
              </p>
              <div className="flex gap-2">
                {frag.features.edgeGeometry.map((v, i) => (
                  <div key={i} className="flex-1">
                    <div className="w-full bg-primary-800 h-8 rounded relative overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${v}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="absolute bottom-0 w-full rounded"
                        style={{
                          backgroundColor:
                            side === "A" ? "#3b82f6" : "#8b5cf6",
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-center text-primary-500 mt-1 font-mono">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {frag.features?.textFragments?.length > 0 && (
            <div className="bg-primary-950 rounded-lg border border-primary-800 p-3">
              <p className="text-[9px] text-primary-500 uppercase tracking-widest mb-2 font-bold">
                Text Features
              </p>
              <div className="flex flex-wrap gap-1.5">
                {frag.features.textFragments.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-primary-800 text-primary-300 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {frag.features?.averageColor && (
            <div className="flex items-center gap-2 text-[10px] text-primary-500">
              <div
                className="w-4 h-4 rounded border border-primary-700"
                style={{ backgroundColor: frag.features.averageColor }}
              />
              <span className="font-mono">
                Avg Color: {frag.features.averageColor}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-primary-900 border border-primary-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-primary-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <GitCompareArrows className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Match Comparison</h3>
              <div className="flex items-center gap-2 text-[10px] text-primary-500 mt-0.5">
                <span className="text-blue-400 font-mono">
                  {fA.fragmentId}
                </span>
                <ArrowLeftRight className="w-3 h-3" />
                <span className="text-violet-400 font-mono">
                  {fB.fragmentId}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-primary-800">
                  {match.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match description banner */}
        {match.description && (
          <div className="mx-5 mt-4 p-3 bg-blue-600/5 border border-blue-600/20 rounded-xl text-xs text-blue-300 leading-relaxed">
            <strong className="text-blue-400">AI Assessment: </strong>
            {match.description}
          </div>
        )}

        {/* Compare tabs */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 bg-primary-950/50 rounded-xl p-1 w-fit">
            {[
              { key: "overview", label: "OCR Text", icon: FileText },
              { key: "analysis", label: "Analysis", icon: Shield },
              { key: "features", label: "Features", icon: Fingerprint },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCompareTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  compareTab === key
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                    : "text-primary-500 hover:text-white border border-transparent"
                }`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-side panels */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <div className="flex gap-5">
            {fragPanel(fA, "A")}
            {/* Center connector */}
            <div className="flex flex-col items-center justify-center shrink-0 gap-2">
              <div className="w-px h-8 bg-primary-700" />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                  match.confidence > 85
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : match.confidence > 60
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-rose-500/40 bg-rose-500/10"
                }`}
              >
                <Link2
                  className={`w-5 h-5 ${
                    match.confidence > 85
                      ? "text-emerald-500"
                      : match.confidence > 60
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                />
              </motion.div>
              <span className="text-[10px] font-bold text-primary-400 font-mono">
                {match.confidence}%
              </span>
              <div className="w-px h-8 bg-primary-700" />
            </div>
            {fragPanel(fB, "B")}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────── */
/*  Fragment Detail Panel                           */
/* ─────────────────────────────────────────────── */
const FragmentDetailPanel = ({ fragment, onClose }) => {
  if (!fragment) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="bg-primary-900/50 border border-primary-800 rounded-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-primary-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold">{fragment.fragmentId}</h3>
          <p className="text-[10px] text-primary-500 font-mono">
            {fragment.originalName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Metrics */}
        <div className="flex gap-3 justify-center">
          <ConfRing
            value={fragment.ocrConfidence * 100}
            color={fragment.ocrConfidence > 0.85 ? "#10b981" : "#f59e0b"}
            label="OCR"
          />
          <ConfRing
            value={fragment.fraudScore}
            color={fragment.fraudScore > 50 ? "#ef4444" : "#10b981"}
            label="Fraud"
          />
          <ConfRing
            value={
              typeof fragment.elaScore === "number"
                ? fragment.elaScore < 1
                  ? fragment.elaScore * 100
                  : fragment.elaScore
                : 0
            }
            color="#f59e0b"
            label="ELA"
          />
        </div>

        {/* Status */}
        <div
          className={`text-center text-xs font-bold uppercase tracking-widest py-2 rounded-lg ${
            fragment.fraudScore > 50
              ? "bg-rose-500/10 text-rose-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {fragment.fraudScore > 50
            ? "⚠ Fraud Indicators Detected"
            : "✓ Document Appears Authentic"}
        </div>

        {/* OCR text */}
        <div className="bg-primary-950 rounded-xl border border-primary-800 overflow-hidden">
          <div className="p-2.5 border-b border-primary-800 flex justify-between">
            <span className="text-[9px] text-primary-500 uppercase tracking-widest font-bold">
              Extracted Text
            </span>
            <span className="text-[9px] text-primary-500 font-mono">
              {(fragment.ocrConfidence * 100).toFixed(1)}% conf
            </span>
          </div>
          <pre className="p-3 text-[10px] text-primary-200 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
            {fragment.ocrText || "No text extracted"}
          </pre>
        </div>

        {/* Analysis notes */}
        <div
          className={`rounded-xl p-3 border ${
            fragment.fraudScore > 50
              ? "bg-rose-500/5 border-rose-500/20"
              : "bg-emerald-500/5 border-emerald-500/20"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            {fragment.fraudScore > 50 ? (
              <AlertTriangle className="w-3 h-3 text-rose-400" />
            ) : (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary-400">
              Analysis Notes
            </span>
          </div>
          <pre className="text-[10px] text-primary-300 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {fragment.analysisNotes || "No notes available."}
          </pre>
        </div>

        {/* Edge features */}
        {fragment.features?.edgeGeometry && (
          <div className="bg-primary-950 rounded-xl border border-primary-800 p-3">
            <p className="text-[9px] text-primary-500 uppercase tracking-widest mb-2 font-bold">
              Edge Geometry
            </p>
            <div className="flex gap-2">
              {fragment.features.edgeGeometry.map((v, i) => (
                <div key={i} className="flex-1">
                  <div className="w-full bg-primary-800 h-10 rounded relative overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${v}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="absolute bottom-0 w-full bg-blue-500 rounded"
                    />
                  </div>
                  <p className="text-[9px] text-center text-primary-500 mt-1 font-mono">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match connections */}
        {fragment.matchedWith?.length > 0 && (
          <div className="bg-primary-950 rounded-xl border border-primary-800 p-3">
            <p className="text-[9px] text-primary-500 uppercase tracking-widest mb-2 font-bold">
              Connected Fragments
            </p>
            <div className="flex flex-wrap gap-2">
              {fragment.matchedWith.map((mId) => (
                <div
                  key={mId}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary-800 text-[10px] font-mono text-primary-300"
                >
                  <Link2 className="w-3 h-3 text-blue-400" />
                  {mId}
                  {fragment.matchScores?.[mId] && (
                    <span className="text-blue-400 font-bold">
                      {fragment.matchScores[mId]}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════ */
/*  MAIN PAGE COMPONENT                            */
/* ═══════════════════════════════════════════════ */
const FragmentMatching = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [fragments, setFragments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [assemblyGroups, setAssemblyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchStage, setMatchStage] = useState(-1);
  const [tab, setTab] = useState("fragments");
  const [selectedFragments, setSelectedFragments] = useState([]);
  const [detailFragment, setDetailFragment] = useState(null);
  const [detailMatch, setDetailMatch] = useState(null);
  const [lightboxFragment, setLightboxFragment] = useState(null);
  const toast = useToast();

  useEffect(() => {
    getCases().then(setCases);
  }, []);

  useEffect(() => {
    if (!selectedCase) return;
    setLoading(true);
    setSelectedFragments([]);
    setDetailFragment(null);
    Promise.all([
      getFragmentsByCase(selectedCase),
      getMatchesByCase(selectedCase),
    ])
      .then(([frags, matchData]) => {
        setFragments(frags);
        setMatches(matchData.pairs || []);
        setAssemblyGroups(matchData.assemblyGroups || []);
      })
      .finally(() => setLoading(false));
  }, [selectedCase]);

  /* ── Auto-match with progress stages ── */
  const handleAutoMatch = async () => {
    if (!selectedCase) {
      toast.error("Select a case first.");
      return;
    }
    setMatching(true);
    setMatchStage(0);

    // Simulate progressive stages
    for (let i = 0; i < MATCH_STAGES.length; i++) {
      setMatchStage(i);
      await new Promise((r) =>
        setTimeout(r, 600 + Math.random() * 800)
      );
    }

    try {
      const result = await runAutoMatch(selectedCase);
      setMatches(result.pairs || []);
      setAssemblyGroups(result.assemblyGroups || []);
      toast.success(
        `AI matching complete — ${result.pairs?.length || 0} potential matches found.`
      );
      setTab("matches");
    } catch (err) {
      toast.error("Auto-match failed.");
    } finally {
      setMatching(false);
      setMatchStage(-1);
    }
  };

  /* ── Manual match two selected fragments ── */
  const handleManualMatch = () => {
    if (selectedFragments.length !== 2) {
      toast.warning("Select exactly 2 fragments to create a manual match.");
      return;
    }
    const [a, b] = selectedFragments;
    const fA = fragments.find((f) => f._id === a);
    const fB = fragments.find((f) => f._id === b);

    // Check if already matched
    const exists = matches.find(
      (m) =>
        (m.fragmentA === a && m.fragmentB === b) ||
        (m.fragmentA === b && m.fragmentB === a)
    );
    if (exists) {
      toast.info("These fragments are already matched.");
      return;
    }

    // Generate a plausible confidence based on edge geometry similarity
    let confidence = 50;
    if (fA?.features?.edgeGeometry && fB?.features?.edgeGeometry) {
      const gA = fA.features.edgeGeometry;
      const gB = fB.features.edgeGeometry;
      const diff = gA.reduce(
        (sum, v, i) => sum + Math.abs(v - (gB[i] || 0)),
        0
      );
      confidence = Math.max(
        35,
        Math.min(98, Math.round(100 - diff / 4))
      );
    }

    const newMatch = {
      _id: `match_manual_${Date.now()}`,
      fragmentA: a,
      fragmentB: b,
      confidence,
      status: "pending",
      matchType: ["manual_review"],
      description: `Manual match created by examiner between ${fA?.fragmentId || a.slice(-6)} and ${fB?.fragmentId || b.slice(-6)}. Confidence ${confidence}% based on edge geometry comparison.`,
    };

    setMatches((prev) => [newMatch, ...prev]);
    setSelectedFragments([]);
    toast.success(
      `Manual match created — ${confidence}% confidence. Switch to Match Results to review.`
    );
  };

  const toggleFragmentSelection = (fId) => {
    setSelectedFragments((prev) => {
      if (prev.includes(fId)) return prev.filter((x) => x !== fId);
      if (prev.length >= 2)
        return [prev[1], fId]; // Replace oldest selection
      return [...prev, fId];
    });
  };

  const handleConfirm = async (matchId) => {
    try {
      await confirmMatch(matchId);
      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId ? { ...m, status: "confirmed" } : m
        )
      );
      toast.success("Match confirmed and logged to audit trail.");
    } catch {
      toast.error("Failed to confirm match.");
    }
  };

  const handleReject = async (matchId) => {
    try {
      await rejectMatch(matchId);
      setMatches((prev) =>
        prev.map((m) =>
          m._id === matchId ? { ...m, status: "rejected" } : m
        )
      );
      toast.info("Match rejected.");
    } catch {
      toast.error("Failed to reject match.");
    }
  };

  /* ── Computed stats ── */
  const selectedCaseObj = cases.find((c) => c._id === selectedCase);
  const confirmedCount = matches.filter(
    (m) => m.status === "confirmed"
  ).length;
  const pendingCount = matches.filter(
    (m) => m.status === "pending"
  ).length;
  const rejectedCount = matches.filter(
    (m) => m.status === "rejected"
  ).length;
  const avgConfidence = matches.length
    ? (
        matches.reduce((a, m) => a + m.confidence, 0) / matches.length
      ).toFixed(0)
    : 0;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end flex-wrap gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Fragment Matching
          </h1>
          <p className="text-primary-400">
            AI-powered fragment comparison — CNN feature extraction,
            edge-pattern analysis, and content-link detection.
          </p>
        </motion.div>
        <div className="flex gap-2">
          {/* Manual Match button (appears when 2 selected) */}
          <AnimatePresence>
            {selectedFragments.length === 2 && (
              <motion.button
                initial={{ scale: 0, width: 0 }}
                animate={{ scale: 1, width: "auto" }}
                exit={{ scale: 0, width: 0 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleManualMatch}
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 overflow-hidden"
              >
                <Link2 className="w-4 h-4" /> Create Manual Match
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAutoMatch}
            disabled={matching || !selectedCase}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            {matching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Running AI
                Matcher...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Run Auto-Match
              </>
            )}
          </motion.button>
        </div>
      </header>

      {/* ── Auto-Match Progress Overlay ── */}
      <AnimatePresence>
        {matching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-600/5 border border-blue-600/20 rounded-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Binary className="w-6 h-6 text-blue-500" />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-blue-400">
                  AI Matching Engine Active
                </h3>
                <p className="text-[10px] text-primary-500">
                  Analyzing {fragments.length} fragments across{" "}
                  {Math.max(1, (fragments.length * (fragments.length - 1)) / 2)}{" "}
                  possible pairwise comparisons
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {MATCH_STAGES.map(({ label, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                    i === matchStage
                      ? "bg-blue-600/10 border-blue-600/30 text-blue-400"
                      : i < matchStage
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                      : "bg-primary-900/30 border-primary-800 text-primary-600"
                  }`}
                >
                  {i < matchStage ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : i === matchStage ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Case Selector + Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-primary-900/40 border border-primary-800 rounded-2xl p-5"
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-50">
            <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">
              Active Case
            </label>
            <div className="relative">
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="">— Select Case —</option>
                {cases.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.caseId} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 pointer-events-none" />
            </div>
          </div>

          {selectedCaseObj && (
            <div className="flex gap-3 flex-wrap">
              {[
                {
                  label: "Fragments",
                  value: fragments.length,
                  color: "text-white",
                  icon: Layers,
                },
                {
                  label: "Matches",
                  value: matches.length,
                  color: "text-blue-400",
                  icon: Link2,
                },
                {
                  label: "Confirmed",
                  value: confirmedCount,
                  color: "text-emerald-400",
                  icon: CheckCircle,
                },
                {
                  label: "Pending",
                  value: pendingCount,
                  color: "text-amber-400",
                  icon: Clock,
                },
                {
                  label: "Avg Conf",
                  value: `${avgConfidence}%`,
                  color: "text-cyan-400",
                  icon: Target,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-primary-950 rounded-xl px-3 py-2 border border-primary-800 flex items-center gap-2"
                >
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <div>
                    <span className="text-[9px] text-primary-500 uppercase tracking-widest block">
                      {label}
                    </span>
                    <span className={`font-bold text-sm ${color}`}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      {selectedCase && (
        <div className="flex gap-1 bg-primary-900/30 rounded-xl p-1 border border-primary-800 w-fit">
          {[
            {
              key: "fragments",
              label: "Fragment Pool",
              icon: LayoutGrid,
              count: fragments.length,
            },
            {
              key: "matches",
              label: "Match Results",
              icon: Puzzle,
              count: matches.length,
            },
            {
              key: "assembly",
              label: "Assembly Groups",
              icon: Binary,
              count: assemblyGroups.length,
            },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-blue-600/10 text-blue-400 border border-blue-600/20"
                  : "text-primary-400 hover:text-white border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === key
                    ? "bg-blue-600/20 text-blue-300"
                    : "bg-primary-800 text-primary-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-primary-500 font-mono tracking-widest">
            LOADING CASE DATA...
          </p>
        </div>
      ) : !selectedCase ? (
        <div className="text-center py-20 border border-dashed border-primary-800 rounded-2xl">
          <Puzzle className="w-12 h-12 text-primary-700 mx-auto mb-4" />
          <p className="text-primary-400 mb-1 font-medium">
            No case selected
          </p>
          <p className="text-sm text-primary-500">
            Choose a case above to load fragments for matching.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ════════ TAB: Fragment Pool ════════ */}
          {tab === "fragments" && (
            <motion.div
              key="fragments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Selection hint */}
              {fragments.length > 0 && (
                <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-primary-500 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    {selectedFragments.length === 0 &&
                      "Click fragments to select a pair for manual matching"}
                    {selectedFragments.length === 1 &&
                      "Select one more fragment to create a manual match"}
                    {selectedFragments.length === 2 && (
                      <span className="text-blue-400 font-semibold">
                        2 fragments selected — click "Create Manual
                        Match" above
                      </span>
                    )}
                  </p>
                  {selectedFragments.length > 0 && (
                    <button
                      onClick={() => setSelectedFragments([])}
                      className="text-[10px] text-primary-500 hover:text-white underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-6">
                {/* Fragment grid */}
                <div className="flex-1">
                  {fragments.length === 0 ? (
                    <p className="text-center text-primary-500 py-12">
                      No fragments found for this case. Upload some on
                      the Upload page first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {fragments.map((f, i) => (
                        <FragmentCard
                          key={f._id}
                          fragment={f}
                          color={COLORS[i % COLORS.length]}
                          index={i}
                          selected={selectedFragments.includes(f._id)}
                          onImageClick={(frag) => setLightboxFragment(frag)}
                          onClick={() => {
                            toggleFragmentSelection(f._id);
                            setDetailFragment(f);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Detail Panel (right side) */}
                <AnimatePresence>
                  {detailFragment && (
                    <div className="hidden lg:block w-80 shrink-0">
                      <FragmentDetailPanel
                        fragment={detailFragment}
                        onClose={() => setDetailFragment(null)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ════════ TAB: Match Results ════════ */}
          {tab === "matches" && (
            <motion.div
              key="matches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {matches.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-primary-800 rounded-2xl">
                  <Puzzle className="w-10 h-10 text-primary-700 mx-auto mb-3" />
                  <p className="text-primary-400 mb-1 font-medium">
                    No matches yet
                  </p>
                  <p className="text-sm text-primary-500">
                    Click "Run Auto-Match" to begin AI analysis, or
                    manually select 2 fragments in the Fragment Pool
                    tab.
                  </p>
                </div>
              ) : (
                <>
                  {/* Stats bar */}
                  <div className="flex gap-3 text-xs font-mono items-center flex-wrap">
                    <span className="text-primary-400">
                      {matches.length} total
                    </span>
                    <span className="text-primary-700">|</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />{" "}
                      {confirmedCount} confirmed
                    </span>
                    <span className="text-primary-700">|</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pendingCount}{" "}
                      pending
                    </span>
                    <span className="text-primary-700">|</span>
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {rejectedCount}{" "}
                      rejected
                    </span>
                    <span className="text-primary-700">|</span>
                    <span className="text-cyan-400">
                      Avg: {avgConfidence}%
                    </span>
                  </div>

                  {/* Match cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((m) => (
                      <MatchPairCard
                        key={m._id}
                        match={m}
                        onConfirm={handleConfirm}
                        onReject={handleReject}
                        fragments={fragments}
                        onViewDetail={setDetailMatch}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ════════ TAB: Assembly Groups ════════ */}
          {tab === "assembly" && (
            <motion.div
              key="assembly"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {assemblyGroups.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-primary-800 rounded-2xl">
                  <Binary className="w-10 h-10 text-primary-700 mx-auto mb-3" />
                  <p className="text-primary-400 mb-1 font-medium">
                    No assembly groups yet
                  </p>
                  <p className="text-sm text-primary-500">
                    Assembly groups are formed when matches are
                    confirmed. Run Auto-Match first.
                  </p>
                </div>
              ) : (
                assemblyGroups.map((group, gi) => {
                  const groupFrags = group.fragmentIds
                    .map((fid) => fragments.find((f) => f._id === fid))
                    .filter(Boolean);
                  const groupColor = COLORS[gi % COLORS.length];

                  return (
                    <motion.div
                      key={group.groupId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gi * 0.08 }}
                      className="bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden"
                    >
                      {/* Group header */}
                      <div className="p-5 flex justify-between items-start flex-wrap gap-3">
                        <div>
                          <h3 className="font-bold text-white flex items-center gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full"
                              style={{
                                backgroundColor: groupColor,
                              }}
                            />
                            {group.name}
                          </h3>
                          <p className="text-[10px] text-primary-500 mt-1 font-mono">
                            {group.groupId} •{" "}
                            {group.fragmentIds.length} fragment
                            {group.fragmentIds.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ConfRing
                            value={group.progress}
                            color={groupColor}
                            size={48}
                            label="Progress"
                          />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="px-5 pb-2">
                        <div className="w-full bg-primary-800 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${group.progress}%`,
                            }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: groupColor,
                            }}
                          />
                        </div>
                      </div>

                      {/* Fragment chips with OCR preview */}
                      <div className="p-5 pt-3 space-y-3">
                        {groupFrags.map((frag, fi) => (
                          <div
                            key={frag._id}
                            className="bg-primary-950/50 border border-primary-800 rounded-xl p-3 flex items-start gap-3"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                              style={{
                                backgroundColor:
                                  groupColor + "15",
                                color: groupColor,
                              }}
                            >
                              {fi + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold font-mono">
                                  {frag.fragmentId}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-800 text-primary-400">
                                  {frag.originalName}
                                </span>
                                {frag.fraudScore > 50 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
                                    FLAGGED
                                  </span>
                                )}
                              </div>
                              {frag.ocrText && (
                                <p className="text-[10px] text-primary-400 font-mono line-clamp-2 leading-relaxed">
                                  {frag.ocrText.slice(0, 150)}…
                                </p>
                              )}
                              <div className="flex gap-3 mt-1.5 text-[9px]">
                                <span className="text-blue-400">
                                  OCR{" "}
                                  {(
                                    frag.ocrConfidence * 100
                                  ).toFixed(0)}
                                  %
                                </span>
                                <span
                                  className={
                                    frag.fraudScore > 50
                                      ? "text-rose-400"
                                      : "text-emerald-400"
                                  }
                                >
                                  Fraud {frag.fraudScore}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Reconstruction summary */}
                        <div className="flex items-center gap-2 text-[10px] text-primary-500 pt-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>
                            Document reconstruction{" "}
                            {group.progress >= 90
                              ? "nearly complete"
                              : group.progress >= 60
                              ? "in progress"
                              : "in early stages"}{" "}
                            — {group.progress}% of physical structure
                            mapped
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Match Detail Modal ── */}
      <AnimatePresence>
        {detailMatch && (
          <MatchDetailModal
            match={detailMatch}
            fragments={fragments}
            onClose={() => setDetailMatch(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Fragment Lightbox ── */}
      <AnimatePresence>
        {lightboxFragment && (
          <FragmentLightbox fragment={lightboxFragment} onClose={() => setLightboxFragment(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FragmentMatching;
