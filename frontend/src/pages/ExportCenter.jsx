import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, FileText, FileSpreadsheet, Printer, Eye, CheckCircle, ArrowRight,
  Shield, BarChart3, Layers, AlertTriangle, Clock, FileDown,
} from "lucide-react";
import { MOCK_CASES, ALL_FRAGMENTS, MOCK_MATCHES, MOCK_AUDIT_LOG } from "../data/mockData";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* helper: format date */
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
const fmtFull = (d) => new Date(d).toLocaleString("en-IN");

/* ========== PDF GENERATORS ========== */
const addHeader = (doc, title) => {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CrimeX ASDAS — Forensic Report", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title, 14, 24);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 30);
  doc.setTextColor(0);
};

const genCasePDF = (c) => {
  const doc = new jsPDF();
  const frags = ALL_FRAGMENTS.filter((f) => f.caseId === c._id);
  const matches = MOCK_MATCHES.filter((m) => m.caseId === c._id);

  addHeader(doc, `Case Report — ${c.caseId}`);
  let y = 44;

  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Case Details", 14, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  [
    ["Case ID", c.caseId], ["Name", c.name], ["Status", c.status], ["Priority", c.priority],
    ["Fragments", c.fragmentCount], ["Progress", `${c.reconstructionProgress}%`],
    ["Created", fmt(c.createdAt)], ["Summary", c.description],
  ].forEach(([k, v]) => { doc.text(`${k}:  ${v}`, 14, y); y += 6; });
  y += 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Fragment Analysis", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["#", "Fragment", "Fraud", "ELA", "OCR %", "Fraudulent?"]],
    body: frags.map((f, i) => [
      i + 1, f.fragmentId?.slice(-8) || f._id.slice(-8),
      f.metadata?.fraudScore ?? "—", f.metadata?.elaScore ?? "—",
      `${f.metadata?.ocrConfidence ?? "—"}%`, f.metadata?.isFraudulent ? "YES" : "No",
    ]),
    theme: "grid", styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (matches.length > 0) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Match Results", 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Fragment A", "Fragment B", "Confidence", "Status"]],
      body: matches.map((m) => [
        m.fragmentA.slice(-8), m.fragmentB.slice(-8), `${(m.confidence * 100).toFixed(1)}%`, m.status,
      ]),
      theme: "grid", styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] },
    });
  }

  doc.save(`CrimeX_ASDAS_Case_${c.caseId}_Report.pdf`);
};

const genFullPDF = () => {
  const doc = new jsPDF();
  addHeader(doc, "Full Repository Export — All Cases");
  let y = 44;

  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Case Summary", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Case ID", "Name", "Frags", "Progress", "Priority", "Status"]],
    body: MOCK_CASES.map((c) => [c.caseId, c.name, c.fragmentCount, `${c.reconstructionProgress}%`, c.priority, c.status]),
    theme: "grid", styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] },
  });
  y = doc.lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("All Fragments", 14, y); y += 4;
  autoTable(doc, {
    startY: y,
    head: [["#", "ID", "Case", "Fraud", "ELA", "OCR %", "Flagged"]],
    body: ALL_FRAGMENTS.map((f, i) => [
      i + 1, f.fragmentId?.slice(-8) || f._id.slice(-8),
      MOCK_CASES.find((c) => c._id === f.caseId)?.caseId || "?",
      f.metadata?.fraudScore ?? "—", f.metadata?.elaScore ?? "—",
      `${f.metadata?.ocrConfidence ?? "—"}%`, f.metadata?.isFraudulent ? "YES" : "No",
    ]),
    theme: "grid", styles: { fontSize: 7 }, headStyles: { fillColor: [30, 64, 175] },
  });

  doc.save("CrimeX_ASDAS_Full_Report.pdf");
};

/* ========== CSV GENERATORS ========== */
const toCSV = (headers, rows) => {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
};

const exportFragmentsCSV = () => {
  const csv = toCSV(
    ["Fragment ID", "Case", "Original Name", "Fraud Score", "ELA Score", "OCR Confidence", "Is Fraudulent", "OCR Text", "Analysis Notes", "Created"],
    ALL_FRAGMENTS.map((f) => [
      f.fragmentId || f._id, MOCK_CASES.find((c) => c._id === f.caseId)?.caseId || f.caseId,
      f.originalName, f.metadata?.fraudScore, f.metadata?.elaScore, f.metadata?.ocrConfidence,
      f.metadata?.isFraudulent ? "Yes" : "No", f.metadata?.ocrText, f.metadata?.analysisNotes, fmtFull(f.createdAt),
    ]),
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, "CrimeX_ASDAS_Fragments_Export.csv");
};

const exportAuditCSV = () => {
  const csv = toCSV(
    ["Action", "User", "Details", "IP", "Timestamp"],
    MOCK_AUDIT_LOG.map((l) => [l.action, l.user, l.details, l.ip, fmtFull(l.timestamp)]),
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, "CrimeX_ASDAS_Audit_Log_Export.csv");
};

const exportMatchesCSV = () => {
  const csv = toCSV(
    ["Case", "Fragment A", "Fragment B", "Confidence", "Method", "Status"],
    MOCK_MATCHES.map((m) => [
      MOCK_CASES.find((c) => c._id === m.caseId)?.caseId || m.caseId,
      m.fragmentA.slice(-8), m.fragmentB.slice(-8), `${(m.confidence * 100).toFixed(1)}%`, m.method, m.status,
    ]),
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, "CrimeX_ASDAS_Matches_Export.csv");
};

const exportCasesCSV = () => {
  const csv = toCSV(
    ["Case ID", "Name", "Description", "Status", "Priority", "Fragments", "Progress %", "Created"],
    MOCK_CASES.map((c) => [c.caseId, c.name, c.description, c.status, c.priority, c.fragmentCount, c.reconstructionProgress, fmtFull(c.createdAt)]),
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, "CrimeX_ASDAS_Cases_Export.csv");
};

/* ========== COMPONENT ========== */
const ExportCenter = () => {
  const [selectedCase, setSelectedCase] = useState(MOCK_CASES[0]._id);
  const [recentExports, setRecentExports] = useState([]);

  const logExport = (label) => {
    setRecentExports((prev) => [{ label, time: new Date().toISOString() }, ...prev.slice(0, 9)]);
  };

  const caseObj = MOCK_CASES.find((c) => c._id === selectedCase);

  const exportActions = [
    {
      group: "PDF Reports",
      items: [
        { icon: FileText, label: "Full Repository Report", desc: "All cases, fragments, matches in one PDF", color: "rose",
          onClick: () => { genFullPDF(); logExport("Full PDF Report"); } },
        { icon: Shield, label: "Case Forensic Report", desc: `Detailed PDF for ${caseObj?.caseId}`, color: "blue",
          onClick: () => { genCasePDF(caseObj); logExport(`PDF: ${caseObj.caseId}`); } },
      ],
    },
    {
      group: "CSV Exports",
      items: [
        { icon: Layers, label: "All Fragments", desc: "Fraud scores, OCR, ELA, analysis notes", color: "emerald",
          onClick: () => { exportFragmentsCSV(); logExport("CSV: Fragments"); } },
        { icon: FileSpreadsheet, label: "All Cases", desc: "Case metadata and progress", color: "violet",
          onClick: () => { exportCasesCSV(); logExport("CSV: Cases"); } },
        { icon: BarChart3, label: "Match Results", desc: "Fragment pairs, confidence, methods", color: "amber",
          onClick: () => { exportMatchesCSV(); logExport("CSV: Matches"); } },
        { icon: Eye, label: "Audit Log", desc: "User actions, timestamps, IP addresses", color: "cyan",
          onClick: () => { exportAuditCSV(); logExport("CSV: Audit Log"); } },
      ],
    },
  ];

  const colorMap = {
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const stats = useMemo(() => [
    { label: "Cases", value: MOCK_CASES.length, icon: FileText, color: "text-blue-400" },
    { label: "Fragments", value: ALL_FRAGMENTS.length, icon: Layers, color: "text-emerald-400" },
    { label: "Matches", value: MOCK_MATCHES.length, icon: BarChart3, color: "text-amber-400" },
    { label: "Audit Events", value: MOCK_AUDIT_LOG.length, icon: Eye, color: "text-cyan-400" },
  ], []);

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Download className="w-8 h-8 text-emerald-500" /> Export Center
        </motion.h1>
        <p className="text-primary-400">Generate PDF forensic reports, download CSV data exports, and print evidence summaries.</p>
      </header>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-primary-900/30 border border-primary-800/50 rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-[10px] text-primary-500 uppercase tracking-wider">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Case selector for per-case reports */}
      <div className="bg-primary-900/30 border border-primary-800/50 rounded-2xl p-5">
        <label className="block text-[10px] text-primary-500 uppercase tracking-wider font-semibold mb-2">Select Case for Per-Case Reports</label>
        <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
          className="w-full md:w-80 bg-primary-950 border border-primary-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 transition-all appearance-none">
          {MOCK_CASES.map((c) => <option key={c._id} value={c._id}>{c.caseId} — {c.name}</option>)}
        </select>
      </div>

      {/* Export Actions */}
      {exportActions.map(({ group, items }, gi) => (
        <motion.div key={group} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + gi * 0.05 }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-3 flex items-center gap-2">
            {gi === 0 ? <FileDown className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />} {group}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(({ icon: Icon, label, desc, color, onClick }) => (
              <button key={label} onClick={onClick}
                className={`text-left bg-primary-900/20 border rounded-xl p-5 hover:bg-primary-900/40 transition-all group ${colorMap[color].split(" ").pop()}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary-500" />
                    </div>
                    <p className="text-xs text-primary-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Print-Optimized Preview */}
      <div className="bg-primary-900/30 border border-primary-800/50 rounded-2xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-3 flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print Preview
        </h2>
        <p className="text-xs text-primary-500 mb-3">Print-optimized view of the selected case for physical evidence filing.</p>
        <button onClick={() => {
          const w = window.open("", "_blank");
          const frags = ALL_FRAGMENTS.filter((f) => f.caseId === selectedCase);
          w.document.write(`
            <html><head><title>Case ${caseObj.caseId} — Print</title>
            <style>body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}
            h1{font-size:22px;border-bottom:2px solid #1e40af;padding-bottom:8px}
            h2{font-size:14px;margin-top:24px;color:#1e40af}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th,td{border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;text-align:left}
            th{background:#eff6ff;font-weight:bold}
            .meta{display:flex;gap:20px;margin:8px 0;font-size:12px;color:#64748b}
            .warn{color:#ef4444;font-weight:bold}
            @media print{body{padding:20px}}
            </style></head><body>
            <h1>CrimeX ASDAS Forensic Report — ${caseObj.caseId}</h1>
            <div class="meta">
              <span>Case: ${caseObj.name}</span>
              <span>Status: ${caseObj.status}</span>
              <span>Priority: ${caseObj.priority}</span>
              <span>Printed: ${new Date().toLocaleString("en-IN")}</span>
            </div>
            <p style="font-size:12px">${caseObj.description}</p>
            <h2>Fragment Analysis (${frags.length} fragments)</h2>
            <table>
              <tr><th>#</th><th>Fragment</th><th>Document</th><th>Fraud</th><th>ELA</th><th>OCR %</th><th>Flagged</th></tr>
              ${frags.map((f, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${f.fragmentId?.slice(-12) || f._id.slice(-12)}</td>
                  <td>${f.originalName || "—"}</td>
                  <td${f.metadata?.fraudScore > 50 ? ' class="warn"' : ""}>${f.metadata?.fraudScore ?? "—"}</td>
                  <td>${f.metadata?.elaScore ?? "—"}</td>
                  <td>${f.metadata?.ocrConfidence ?? "—"}%</td>
                  <td${f.metadata?.isFraudulent ? ' class="warn"' : ""}>${f.metadata?.isFraudulent ? "YES" : "No"}</td>
                </tr>
              `).join("")}
            </table>
            <p style="margin-top:32px;font-size:10px;color:#94a3b8">This report was generated by CrimeX ASDAS (AI-Assisted Shredded Document Analysis System). For official use only.</p>
            </body></html>
          `);
          w.document.close();
          setTimeout(() => w.print(), 300);
          logExport(`Print: ${caseObj.caseId}`);
        }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg text-sm hover:bg-primary-700 transition-all">
          <Printer className="w-4 h-4" /> Open Print Preview for {caseObj?.caseId}
        </button>
      </div>

      {/* Recent Exports */}
      <AnimatePresence>
        {recentExports.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-primary-900/30 border border-primary-800/50 rounded-2xl p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Exports
            </h2>
            <div className="space-y-1.5">
              {recentExports.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg bg-primary-950/30">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-primary-300">{e.label}</span>
                  <span className="text-primary-600 ml-auto text-[10px]">{new Date(e.time).toLocaleTimeString("en-IN")}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportCenter;
