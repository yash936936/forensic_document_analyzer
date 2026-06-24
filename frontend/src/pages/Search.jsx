import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon, Filter, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SlidersHorizontal,
  FileText, Layers, AlertTriangle, CheckCircle, ScanEye, Shield, Clock, ArrowUpDown, Eye,
} from "lucide-react";
import { MOCK_CASES, ALL_FRAGMENTS, MOCK_AUDIT_LOG, getFragmentThumbnail } from "../data/mockData";
import FragmentLightbox from "../components/viewer/FragmentLightbox";

const PAGE_SIZE = 10;

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | fragments | cases | audit
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [fraudRange, setFraudRange] = useState([0, 100]);
  const [caseFilter, setCaseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("relevance"); // relevance | fraud_desc | fraud_asc | date_desc | date_asc
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [lightboxFragment, setLightboxFragment] = useState(null);

  // Detect document type from filename
  const getDocType = useCallback((name) => {
    if (/bank|stmt/i.test(name)) return "Bank Statement";
    if (/cheque|check/i.test(name)) return "Cheque";
    if (/will|testament/i.test(name)) return "Legal";
    if (/memo|email/i.test(name)) return "Corporate";
    if (/shipping|manifest|customs/i.test(name)) return "Maritime";
    if (/fir|police|witness|postmortem/i.test(name)) return "Criminal";
    return "Other";
  }, []);

  const docTypes = useMemo(() => {
    const set = new Set(ALL_FRAGMENTS.map((f) => getDocType(f.originalName || "")));
    return ["all", ...Array.from(set)];
  }, [getDocType]);

  // Search across all data
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items = [];

    // Search fragments
    if (activeTab === "all" || activeTab === "fragments") {
      ALL_FRAGMENTS.forEach((f) => {
        const fraud = f.metadata?.fraudScore ?? 0;
        const ocrText = f.metadata?.ocrText || "";
        const notes = f.metadata?.analysisNotes || "";
        const name = f.originalName || "";
        const id = f.fragmentId || f._id;

        // Apply filters
        if (fraud < fraudRange[0] || fraud > fraudRange[1]) return;
        if (caseFilter !== "all" && f.caseId !== caseFilter) return;
        if (docTypeFilter !== "all" && getDocType(name) !== docTypeFilter) return;
        if (statusFilter === "fraudulent" && !f.metadata?.isFraudulent) return;
        if (statusFilter === "authentic" && f.metadata?.isFraudulent) return;

        // Search match
        if (q && !id.toLowerCase().includes(q) && !name.toLowerCase().includes(q) && !ocrText.toLowerCase().includes(q) && !notes.toLowerCase().includes(q)) return;

        // Relevance score
        let relevance = 0;
        if (q) {
          if (id.toLowerCase().includes(q)) relevance += 10;
          if (name.toLowerCase().includes(q)) relevance += 8;
          if (ocrText.toLowerCase().includes(q)) relevance += 5;
          if (notes.toLowerCase().includes(q)) relevance += 3;
        } else {
          relevance = 5;
        }

        // Highlight match context
        let matchContext = "";
        if (q && ocrText.toLowerCase().includes(q)) {
          const idx = ocrText.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(ocrText.length, idx + q.length + 40);
          matchContext = (start > 0 ? "..." : "") + ocrText.slice(start, end) + (end < ocrText.length ? "..." : "");
        }

        items.push({
          type: "fragment",
          id: f._id,
          title: id,
          subtitle: name,
          caseId: f.caseId,
          caseName: MOCK_CASES.find((c) => c._id === f.caseId)?.caseId || f.caseId,
          fraud,
          isFraud: f.metadata?.isFraudulent,
          ela: f.metadata?.elaScore ?? 0,
          ocrSnippet: matchContext || ocrText.slice(0, 100),
          notes: notes.slice(0, 150),
          docType: getDocType(name),
          date: f.createdAt,
          relevance,
          thumbnail: f.thumbnail || getFragmentThumbnail(name),
        });
      });
    }

    // Search cases
    if (activeTab === "all" || activeTab === "cases") {
      MOCK_CASES.forEach((c) => {
        if (caseFilter !== "all" && c._id !== caseFilter) return;
        if (q && !c.caseId.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return;

        let relevance = 0;
        if (q) {
          if (c.caseId.toLowerCase().includes(q)) relevance += 10;
          if (c.name.toLowerCase().includes(q)) relevance += 8;
          if (c.description.toLowerCase().includes(q)) relevance += 3;
        } else {
          relevance = 5;
        }

        items.push({
          type: "case",
          id: c._id,
          title: c.caseId,
          subtitle: c.name,
          description: c.description,
          status: c.status,
          priority: c.priority,
          fragments: c.fragmentCount,
          progress: c.reconstructionProgress,
          date: c.createdAt,
          relevance,
        });
      });
    }

    // Search audit log
    if (activeTab === "all" || activeTab === "audit") {
      MOCK_AUDIT_LOG.forEach((log, i) => {
        if (q && !log.action.toLowerCase().includes(q) && !log.details.toLowerCase().includes(q) && !log.user.toLowerCase().includes(q)) return;

        items.push({
          type: "audit",
          id: `audit_${i}`,
          title: log.action.replace(/_/g, " "),
          subtitle: log.details,
          user: log.user,
          ip: log.ip,
          date: log.timestamp,
          relevance: q ? 3 : 2,
        });
      });
    }

    // Sort
    if (sortBy === "relevance") items.sort((a, b) => b.relevance - a.relevance);
    else if (sortBy === "fraud_desc") items.sort((a, b) => (b.fraud ?? 0) - (a.fraud ?? 0));
    else if (sortBy === "fraud_asc") items.sort((a, b) => (a.fraud ?? 0) - (b.fraud ?? 0));
    else if (sortBy === "date_desc") items.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === "date_asc") items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return items;
  }, [query, activeTab, fraudRange, caseFilter, statusFilter, sortBy, docTypeFilter, getDocType]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setFraudRange([0, 100]);
    setCaseFilter("all");
    setStatusFilter("all");
    setDocTypeFilter("all");
    setSortBy("relevance");
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <SearchIcon className="w-8 h-8 text-blue-500" /> Global Search
        </motion.h1>
        <p className="text-primary-400">Search across fragments, OCR text, cases, and audit logs with advanced filtering.</p>
      </header>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search fragments, OCR text, case names, audit actions..."
          className="w-full bg-primary-900/60 border border-primary-800 rounded-2xl pl-12 pr-12 py-4 text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-primary-600"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-primary-500" />
          </button>
        )}
      </motion.div>

      {/* Tabs + Filter toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-primary-900/50 rounded-xl p-1 border border-primary-800">
          {[
            { id: "all", label: "All", count: results.length },
            { id: "fragments", label: "Fragments" },
            { id: "cases", label: "Cases" },
            { id: "audit", label: "Audit Log" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => { setActiveTab(id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === id ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-primary-500 hover:text-white border border-transparent"
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary-500">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              showFilters ? "bg-blue-600/10 text-blue-400 border-blue-600/20" : "bg-primary-900 text-primary-400 border-primary-800 hover:text-white"
            }`}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-primary-900/40 border border-primary-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Advanced Filters
                </h3>
                <button onClick={resetFilters} className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline">Reset All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Fraud Score Range */}
                <div>
                  <label className="block text-[10px] text-primary-500 uppercase tracking-wider font-semibold mb-2">
                    Fraud Score: {fraudRange[0]} — {fraudRange[1]}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input type="range" min="0" max="100" value={fraudRange[0]}
                      onChange={(e) => setFraudRange([Math.min(Number(e.target.value), fraudRange[1]), fraudRange[1]])}
                      className="flex-1 h-1 accent-blue-500" />
                    <input type="range" min="0" max="100" value={fraudRange[1]}
                      onChange={(e) => setFraudRange([fraudRange[0], Math.max(Number(e.target.value), fraudRange[0])])}
                      className="flex-1 h-1 accent-blue-500" />
                  </div>
                </div>

                {/* Case Filter */}
                <div>
                  <label className="block text-[10px] text-primary-500 uppercase tracking-wider font-semibold mb-2">Case</label>
                  <select value={caseFilter} onChange={(e) => { setCaseFilter(e.target.value); setPage(1); }}
                    className="w-full bg-primary-950 border border-primary-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 transition-all appearance-none">
                    <option value="all">All Cases</option>
                    {MOCK_CASES.map((c) => <option key={c._id} value={c._id}>{c.caseId} — {c.name}</option>)}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] text-primary-500 uppercase tracking-wider font-semibold mb-2">Status</label>
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full bg-primary-950 border border-primary-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 transition-all appearance-none">
                    <option value="all">All</option>
                    <option value="fraudulent">Fraud Flagged</option>
                    <option value="authentic">Appears Authentic</option>
                  </select>
                </div>

                {/* Doc Type */}
                <div>
                  <label className="block text-[10px] text-primary-500 uppercase tracking-wider font-semibold mb-2">Document Type</label>
                  <select value={docTypeFilter} onChange={(e) => { setDocTypeFilter(e.target.value); setPage(1); }}
                    className="w-full bg-primary-950 border border-primary-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 transition-all appearance-none">
                    {docTypes.map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-[10px] text-primary-500 uppercase tracking-wider font-semibold">Sort:</span>
                {["relevance", "fraud_desc", "fraud_asc", "date_desc", "date_asc"].map((s) => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                      sortBy === s ? "bg-blue-600/10 text-blue-400 border-blue-600/20" : "bg-primary-900 text-primary-500 border-primary-800 hover:text-white"
                    }`}>
                    {s.replace(/_/g, " ↕ ").replace("desc", "↓").replace("asc", "↑")}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="space-y-2">
        {pageResults.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="bg-primary-900/20 border border-primary-800/50 hover:border-primary-700 rounded-xl p-4 transition-all hover:bg-primary-900/40 group">

            {item.type === "fragment" && (
              <div className="flex items-start gap-4">
                {item.thumbnail ? (
                  <div className="w-20 h-14 rounded-lg overflow-hidden shrink-0 border border-primary-800 cursor-pointer relative group/thumb"
                    onClick={() => setLightboxFragment(item)}>
                    <img src={item.thumbnail} alt={item.subtitle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all"><Eye className="w-4 h-4 text-white" /></div>
                  </div>
                ) : (
                  <div className={`p-2 rounded-lg shrink-0 ${item.isFraud ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
                    {item.isFraud ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 font-mono uppercase border border-blue-600/20">Fragment</span>
                    <span className="text-sm font-semibold font-mono">{item.title?.slice(-12)}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-800 text-primary-400">{item.docType}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-800 text-primary-400 font-mono">{item.caseName}</span>
                  </div>
                  <p className="text-xs text-primary-400 mt-1 truncate">{item.subtitle}</p>
                  {item.ocrSnippet && (
                    <p className="text-[11px] text-primary-500 mt-1.5 bg-primary-950/50 rounded p-2 font-mono leading-relaxed line-clamp-2">
                      {item.ocrSnippet}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-primary-500">
                    <span>Fraud: <span className={`font-bold ${item.fraud > 50 ? "text-rose-400" : "text-emerald-400"}`}>{item.fraud}</span></span>
                    <span>ELA: <span className="font-bold text-amber-400">{item.ela}</span></span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.date).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}

            {item.type === "case" && (
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600/10 text-violet-400 font-mono uppercase border border-violet-600/20">Case</span>
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.priority === "Critical" ? "bg-rose-500/10 text-rose-400" : item.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                    }`}>{item.priority}</span>
                  </div>
                  <p className="text-xs font-semibold text-primary-300 mt-0.5">{item.subtitle}</p>
                  <p className="text-[11px] text-primary-500 mt-1 line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-primary-500">
                    <span>Fragments: <span className="font-bold text-blue-400">{item.fragments}</span></span>
                    <span>Progress: <span className="font-bold text-emerald-400">{item.progress}%</span></span>
                    <span>Status: <span className="font-bold">{item.status}</span></span>
                  </div>
                </div>
              </div>
            )}

            {item.type === "audit" && (
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
                  <Eye className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/10 text-cyan-400 font-mono uppercase border border-cyan-600/20">Audit</span>
                    <span className="text-sm font-semibold">{item.title}</span>
                  </div>
                  <p className="text-xs text-primary-400 mt-0.5">{item.subtitle}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-primary-500">
                    <span>User: {item.user}</span>
                    {item.ip && <span className="font-mono">IP: {item.ip}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.date).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {results.length === 0 && (
        <div className="text-center py-16">
          <SearchIcon className="w-12 h-12 text-primary-700 mx-auto mb-4" />
          <p className="text-primary-500 text-lg">No results found</p>
          <p className="text-sm text-primary-600 mt-1">Try a different search query or adjust your filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg bg-primary-900 border border-primary-800 text-primary-400 hover:text-white disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) pageNum = i + 1;
            else if (page <= 4) pageNum = i + 1;
            else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = page - 3 + i;

            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  page === pageNum ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-primary-900 text-primary-400 border border-primary-800 hover:text-white"
                }`}>
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg bg-primary-900 border border-primary-800 text-primary-400 hover:text-white disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
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

export default Search;
