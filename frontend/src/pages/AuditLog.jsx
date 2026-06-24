import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Filter, Search, Loader2, User, Clock, Shield, FileText, Upload, Puzzle, Eye, Download } from "lucide-react";
import { getAuditLog } from "../services/mockApi";

const iconMap = {
  login: User,
  upload: Upload,
  match_confirm: Puzzle,
  match_reject: Puzzle,
  report_generate: FileText,
  ocr_review: Eye,
  settings_change: Shield,
  export: Download,
  case_create: FileText,
  fragment_upload: Upload,
  auto_match: Puzzle,
  report_download: Download,
};

const colorMap = {
  login: "text-blue-400 bg-blue-600/10",
  upload: "text-violet-400 bg-violet-600/10",
  match_confirm: "text-emerald-400 bg-emerald-600/10",
  match_reject: "text-rose-400 bg-rose-600/10",
  report_generate: "text-amber-400 bg-amber-600/10",
  ocr_review: "text-cyan-400 bg-cyan-600/10",
  settings_change: "text-orange-400 bg-orange-600/10",
  export: "text-teal-400 bg-teal-600/10",
  case_create: "text-blue-400 bg-blue-600/10",
  fragment_upload: "text-violet-400 bg-violet-600/10",
  auto_match: "text-emerald-400 bg-emerald-600/10",
  report_download: "text-amber-400 bg-amber-600/10",
};

const AuditLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getAuditLog().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const actionTypes = ["all", ...new Set(entries.map((e) => e.action))];

  const filtered = entries.filter((e) => {
    if (filter !== "all" && e.action !== filter) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Audit Log</h1>
        <p className="text-primary-400">Complete chronological record of all system activities. All actions are immutably logged.</p>
      </motion.header>

      {/* Filters */}
      <div className="bg-primary-900/40 border border-primary-800 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-50">
          <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions, users..."
              className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 transition-all placeholder:text-primary-600" />
          </div>
        </div>
        <div className="min-w-45">
          <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Filter by Action</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-blue-600 transition-all cursor-pointer">
            {actionTypes.map((a) => <option key={a} value={a}>{a === "all" ? "All Actions" : a.replace(/_/g, " ").toUpperCase()}</option>)}
          </select>
        </div>
        <div className="text-xs text-primary-500 font-mono py-2.5">{filtered.length} entries</div>
      </div>

      {/* Log Entries */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-primary-500 font-mono tracking-widest">LOADING AUDIT TRAIL...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => {
            const Icon = iconMap[entry.action] || Shield;
            const colorClass = colorMap[entry.action] || "text-primary-400 bg-primary-800";
            return (
              <motion.div key={entry.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                whileHover={{ x: 4 }}
                className="bg-primary-900/30 border border-primary-800 rounded-xl p-4 flex items-start gap-4 hover:bg-primary-900/50 hover:border-primary-700 transition-all group cursor-default">
                <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-medium text-white leading-tight">{entry.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-primary-500 flex items-center gap-1"><User className="w-3 h-3" /> {entry.user}</span>
                        <span className="text-[10px] text-primary-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.timestamp}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-primary-800 text-primary-400 uppercase tracking-widest font-mono shrink-0">
                      {entry.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  {entry.details && (
                    <p className="text-xs text-primary-500 mt-2 font-mono bg-primary-950/50 rounded-lg p-2">{entry.details}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-primary-500">No entries match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
