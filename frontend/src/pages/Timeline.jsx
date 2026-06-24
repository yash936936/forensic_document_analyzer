import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Upload, ScanEye, Puzzle, AlertTriangle, CheckCircle, FileText, Shield, User, Settings,
  ChevronDown, Filter, Calendar, ArrowRight, Activity, Zap, Eye, Database,
} from "lucide-react";
import { getCases } from "../services/mockApi";
import {
  MOCK_AUDIT_LOG, MOCK_CASES, ALL_FRAGMENTS, MOCK_MATCHES, MOCK_ALERTS,
} from "../data/mockData";

// Build a comprehensive timeline from all data sources
const buildTimeline = () => {
  const events = [];

  // From audit log
  MOCK_AUDIT_LOG.forEach((log) => {
    const iconMap = {
      LOGIN: User, VIEW_CASE: Eye, RUN_ANALYSIS: ScanEye, OCR_BATCH: FileText,
      UPLOAD: Upload, BACKUP: Database, MATCH_CONFIRM: Puzzle, VIEW_REPORT: FileText,
    };
    const colorMap = {
      LOGIN: "blue", VIEW_CASE: "violet", RUN_ANALYSIS: "amber", OCR_BATCH: "cyan",
      UPLOAD: "emerald", BACKUP: "slate", MATCH_CONFIRM: "green", VIEW_REPORT: "indigo",
    };
    events.push({
      id: `audit_${log.timestamp}_${log.action}`,
      timestamp: log.timestamp,
      type: "audit",
      category: log.action,
      title: log.action.replace(/_/g, " "),
      description: log.details,
      user: log.user,
      ip: log.ip,
      icon: iconMap[log.action] || Activity,
      color: colorMap[log.action] || "blue",
    });
  });

  // From cases
  MOCK_CASES.forEach((c) => {
    events.push({
      id: `case_created_${c._id}`,
      timestamp: c.createdAt,
      type: "case",
      category: "CASE_CREATED",
      title: `Case Created — ${c.caseId}`,
      description: `"${c.name}" opened with priority ${c.priority}. Assigned to ${c.assignedAgentName}.`,
      user: c.assignedAgentName,
      caseId: c._id,
      icon: FileText,
      color: "blue",
    });
    events.push({
      id: `case_updated_${c._id}`,
      timestamp: c.updatedAt,
      type: "case",
      category: "CASE_UPDATED",
      title: `Case Updated — ${c.caseId}`,
      description: `Status: ${c.status}. Reconstruction progress at ${c.reconstructionProgress}%. ${c.fragmentCount} fragments processed.`,
      user: "System",
      caseId: c._id,
      icon: Settings,
      color: "violet",
    });
  });

  // From fragments
  ALL_FRAGMENTS.forEach((f) => {
    events.push({
      id: `frag_uploaded_${f._id}`,
      timestamp: f.createdAt,
      type: "fragment",
      category: "FRAGMENT_UPLOADED",
      title: `Fragment Uploaded`,
      description: `${f.originalName} added to case. Fraud score: ${f.metadata?.fraudScore ?? 0}/100.`,
      user: "Agent",
      fragmentId: f._id,
      caseId: f.caseId,
      icon: Upload,
      color: (f.metadata?.fraudScore ?? 0) > 50 ? "rose" : "emerald",
    });
    if (f.metadata?.isFraudulent) {
      events.push({
        id: `fraud_flag_${f._id}`,
        timestamp: f.updatedAt || f.createdAt,
        type: "alert",
        category: "FRAUD_DETECTED",
        title: "Fraud Alert",
        description: `Fragment ${f.fragmentId} flagged with fraud score ${f.metadata.fraudScore}/100. ${f.metadata.analysisNotes?.slice(0, 120)}...`,
        user: "AI System",
        fragmentId: f._id,
        caseId: f.caseId,
        icon: AlertTriangle,
        color: "rose",
      });
    }
  });

  // From matches
  Object.entries(MOCK_MATCHES).forEach(([caseId, data]) => {
    (data.matchedPairs || []).forEach((pair, i) => {
      events.push({
        id: `match_${caseId}_${i}`,
        timestamp: MOCK_CASES.find((c) => c._id === caseId)?.updatedAt || new Date().toISOString(),
        type: "match",
        category: "MATCH_FOUND",
        title: `Match ${pair.status === "confirmed" ? "Confirmed" : "Pending"}`,
        description: `${pair.description} Confidence: ${pair.confidence}%.`,
        user: "AI Engine",
        caseId,
        icon: pair.status === "confirmed" ? CheckCircle : Puzzle,
        color: pair.confidence > 85 ? "emerald" : pair.confidence > 60 ? "amber" : "rose",
      });
    });
  });

  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return events;
};

const CATEGORY_FILTERS = [
  "All", "LOGIN", "UPLOAD", "RUN_ANALYSIS", "MATCH_FOUND", "FRAUD_DETECTED",
  "CASE_CREATED", "CASE_UPDATED", "OCR_BATCH", "MATCH_CONFIRM",
];

const Timeline = () => {
  const allEvents = useMemo(() => buildTimeline(), []);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      if (filter !== "All" && e.category !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.user.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allEvents, filter, search]);

  const stats = useMemo(() => ({
    total: allEvents.length,
    fraud: allEvents.filter((e) => e.category === "FRAUD_DETECTED").length,
    matches: allEvents.filter((e) => e.category === "MATCH_FOUND").length,
    uploads: allEvents.filter((e) => e.category === "FRAGMENT_UPLOADED").length,
  }), [allEvents]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const colorClasses = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
    rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", dot: "bg-rose-500" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-500" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-500" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", dot: "bg-indigo-500" },
    slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", dot: "bg-slate-500" },
    green: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" },
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-500" /> Case Timeline
        </motion.h1>
        <p className="text-primary-400">Chronological view of all activities, uploads, analyses, matches, and alerts across all cases.</p>
      </header>

      {/* Stats banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, icon: Activity, color: "text-blue-400" },
          { label: "Fraud Alerts", value: stats.fraud, icon: AlertTriangle, color: "text-rose-400" },
          { label: "Matches Found", value: stats.matches, icon: Puzzle, color: "text-emerald-400" },
          { label: "Fragments Uploaded", value: stats.uploads, icon: Upload, color: "text-violet-400" },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-primary-900/40 border border-primary-800 rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-primary-900/40 border border-primary-800 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-primary-500" />
        <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-primary-950 border border-primary-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 transition-all" />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                filter === cat ? "bg-blue-600/10 text-blue-400 border-blue-600/20" : "bg-primary-900 text-primary-500 border-primary-800 hover:text-white"
              }`}>
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-primary-800" />

        <div className="space-y-1">
          {filtered.map((event, i) => {
            const Icon = event.icon;
            const colors = colorClasses[event.color] || colorClasses.blue;
            const isExpanded = expandedId === event.id;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
                className="relative pl-14"
              >
                {/* Timeline dot */}
                <div className={`absolute left-4.5 top-4 w-3 h-3 rounded-full ${colors.dot} ring-4 ring-primary-950 z-10`} />

                {/* Event card */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isExpanded ? `${colors.bg} ${colors.border}` : "bg-primary-900/20 border-primary-800/50 hover:bg-primary-900/40 hover:border-primary-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${colors.bg}`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{event.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {event.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-primary-400 mt-0.5 line-clamp-1">{event.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-primary-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(event.timestamp)}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {event.user}</span>
                        {event.caseId && (
                          <span className="font-mono">{MOCK_CASES.find((c) => c._id === event.caseId)?.caseId || event.caseId}</span>
                        )}
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="shrink-0 mt-1">
                      <ChevronDown className="w-4 h-4 text-primary-600" />
                    </motion.div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="mt-3 pt-3 border-t border-primary-800/50 space-y-2">
                          <p className="text-xs text-primary-300 leading-relaxed">{event.description}</p>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="px-2 py-0.5 bg-primary-900 rounded text-primary-400">Time: {new Date(event.timestamp).toLocaleString("en-IN")}</span>
                            <span className="px-2 py-0.5 bg-primary-900 rounded text-primary-400">User: {event.user}</span>
                            {event.ip && <span className="px-2 py-0.5 bg-primary-900 rounded text-primary-400 font-mono">IP: {event.ip}</span>}
                            {event.fragmentId && <span className="px-2 py-0.5 bg-primary-900 rounded text-primary-400 font-mono">Fragment: {event.fragmentId}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 pl-14">
            <Clock className="w-10 h-10 text-primary-700 mx-auto mb-3" />
            <p className="text-primary-500">No events match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
