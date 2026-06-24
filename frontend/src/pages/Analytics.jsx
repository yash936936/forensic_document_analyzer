import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Shield, ScanEye, Puzzle, AlertTriangle,
  FileText, Activity, Eye, ChevronDown, Layers,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line,
  AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { MOCK_CASES, ALL_FRAGMENTS, MOCK_MATCHES } from "../data/mockData";

import FragmentLightbox from "../components/viewer/FragmentLightbox";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6"];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [lightboxFragment, setLightboxFragment] = useState(null);

  // Compute chart data
  const fraudDistribution = useMemo(() => {
    const bins = [
      { range: "0-20", count: 0, fill: "#10b981" },
      { range: "21-40", count: 0, fill: "#22c55e" },
      { range: "41-60", count: 0, fill: "#f59e0b" },
      { range: "61-80", count: 0, fill: "#f97316" },
      { range: "81-100", count: 0, fill: "#ef4444" },
    ];
    ALL_FRAGMENTS.forEach((f) => {
      const score = f.metadata?.fraudScore ?? 0;
      if (score <= 20) bins[0].count++;
      else if (score <= 40) bins[1].count++;
      else if (score <= 60) bins[2].count++;
      else if (score <= 80) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, []);

  const caseProgress = useMemo(() =>
    MOCK_CASES.map((c) => ({
      name: c.caseId,
      short: c.name.length > 18 ? c.name.slice(0, 18) + "..." : c.name,
      progress: c.reconstructionProgress,
      fragments: c.fragmentCount,
      fill: c.reconstructionProgress > 70 ? "#10b981" : c.reconstructionProgress > 40 ? "#f59e0b" : "#ef4444",
    })), []);

  const docTypes = useMemo(() => {
    const types = {};
    ALL_FRAGMENTS.forEach((f) => {
      const name = f.originalName || "unknown";
      let type = "Other";
      if (/bank|stmt/i.test(name)) type = "Bank Statement";
      else if (/cheque|check/i.test(name)) type = "Cheque";
      else if (/will|testament/i.test(name)) type = "Legal/Will";
      else if (/memo|email/i.test(name)) type = "Corporate";
      else if (/shipping|manifest|customs/i.test(name)) type = "Maritime";
      else if (/fir|police|witness|postmortem/i.test(name)) type = "Criminal/Police";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  }, []);

  const fraudVsEla = useMemo(() =>
    ALL_FRAGMENTS.map((f) => ({
      name: f.fragmentId?.slice(-8) || f._id.slice(-6),
      fraud: f.metadata?.fraudScore ?? 0,
      ela: f.metadata?.elaScore ?? 0,
      ocr: f.metadata?.ocrText?.length > 50 ? 85 : 40,
    })), []);

  const caseRadar = useMemo(() =>
    MOCK_CASES.map((c) => {
      const frags = ALL_FRAGMENTS.filter((f) => f.caseId === c._id);
      const matches = MOCK_MATCHES[c._id];
      const avgFraud = frags.length ? frags.reduce((s, f) => s + (f.metadata?.fraudScore ?? 0), 0) / frags.length : 0;
      const matchCount = (matches?.matchedPairs || []).length;
      return {
        case: c.caseId.replace("FRN-", ""),
        "Fraud Risk": Math.min(avgFraud, 100),
        "Reconstruction": c.reconstructionProgress,
        "Evidence Volume": Math.min(frags.length * 25, 100),
        "Match Density": Math.min(matchCount * 30, 100),
        "Priority": c.priority === "Critical" ? 100 : c.priority === "High" ? 75 : c.priority === "Medium" ? 50 : 25,
      };
    }), []);

  const matchNetwork = useMemo(() => {
    const nodes = [];
    Object.entries(MOCK_MATCHES).forEach(([caseId, data]) => {
      (data.matchedPairs || []).forEach((p) => {
        nodes.push({
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          z: p.confidence,
          name: `${p.fragmentA.slice(-3)}↔${p.fragmentB.slice(-3)}`,
          confidence: p.confidence,
        });
      });
    });
    return nodes;
  }, []);

  const timelineData = useMemo(() => {
    const months = ["Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026"];
    return months.map((m) => ({
      month: m,
      uploads: Math.floor(Math.random() * 8 + 2),
      matches: Math.floor(Math.random() * 5 + 1),
      fraudAlerts: Math.floor(Math.random() * 3),
    }));
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "fraud", label: "Fraud Analysis", icon: Shield },
    { id: "cases", label: "Case Metrics", icon: FileText },
    { id: "network", label: "Match Network", icon: Puzzle },
  ];

  const tooltipStyle = {
    contentStyle: { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", fontSize: "12px" },
    labelStyle: { color: "#94a3b8" },
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" /> Analytics Dashboard
        </motion.h1>
        <p className="text-primary-400">Comprehensive data visualization of forensic analysis across all cases.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary-900/50 rounded-xl p-1 w-fit border border-primary-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === id ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "text-primary-500 hover:text-white border border-transparent"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Fragments", value: ALL_FRAGMENTS.length, icon: Layers, color: "text-blue-400" },
              { label: "Active Cases", value: MOCK_CASES.length, icon: FileText, color: "text-violet-400" },
              { label: "Fraud Flagged", value: ALL_FRAGMENTS.filter((f) => f.metadata?.isFraudulent).length, icon: AlertTriangle, color: "text-rose-400" },
              { label: "Avg Reconstruction", value: `${(MOCK_CASES.reduce((s, c) => s + c.reconstructionProgress, 0) / MOCK_CASES.length).toFixed(0)}%`, icon: Puzzle, color: "text-emerald-400" },
              { label: "Total Matches", value: Object.values(MOCK_MATCHES).reduce((s, m) => s + (m.matchedPairs?.length || 0), 0), icon: Activity, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-primary-900/40 border border-primary-800 rounded-xl p-4 text-center card-hover">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[9px] text-primary-500 uppercase tracking-widest mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraud Distribution */}
            <ChartCard title="Fraud Score Distribution" subtitle="Across all fragments">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={fraudDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {fraudDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Document Type Pie */}
            <ChartCard title="Document Type Distribution" subtitle="Categories of analyzed evidence">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={docTypes} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#475569", strokeWidth: 1 }}>
                    {docTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Activity Timeline */}
            <ChartCard title="Activity Over Time" subtitle="Monthly forensic activity trends">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="uploads" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="matches" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="fraudAlerts" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Case Progress */}
            <ChartCard title="Case Reconstruction Progress" subtitle="Completion percentage per case">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={caseProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={85} tick={{ fill: "#64748b", fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
                    {caseProgress.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Fraud Analysis Tab */}
      {activeTab === "fraud" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraud vs ELA Scatter */}
            <ChartCard title="Fraud Score vs ELA Score" subtitle="Correlation between fraud indicators and error level analysis">
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" dataKey="fraud" name="Fraud Score" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                  <YAxis type="number" dataKey="ela" name="ELA Score" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                  <ZAxis type="number" dataKey="ocr" range={[60, 400]} name="OCR" />
                  <Tooltip {...tooltipStyle} />
                  <Scatter name="Fragments" data={fraudVsEla} fill="#3b82f6">
                    {fraudVsEla.map((entry, i) => (
                      <Cell key={i} fill={entry.fraud > 50 ? "#ef4444" : "#10b981"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Fragment-level fraud bar */}
            <ChartCard title="Per-Fragment Fraud Scores" subtitle="Individual fraud scores for all analyzed fragments">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={fraudVsEla}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="fraud" name="Fraud" radius={[4, 4, 0, 0]}>
                    {fraudVsEla.map((entry, i) => (
                      <Cell key={i} fill={entry.fraud > 50 ? "#ef4444" : entry.fraud > 30 ? "#f59e0b" : "#10b981"} />
                    ))}
                  </Bar>
                  <Bar dataKey="ela" name="ELA" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Fraud Table */}
          <ChartCard title="Flagged Fragments" subtitle="Fragments with fraud score above 50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-800 text-[10px] text-primary-500 uppercase tracking-wider">
                    <th className="py-2 px-3 text-left">Preview</th>
                    <th className="py-2 px-3 text-left">Fragment</th>
                    <th className="py-2 px-3 text-left">Case</th>
                    <th className="py-2 px-3 text-center">Fraud</th>
                    <th className="py-2 px-3 text-center">ELA</th>
                    <th className="py-2 px-3 text-left">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-800/50">
                  {ALL_FRAGMENTS.filter((f) => (f.metadata?.fraudScore ?? 0) > 50).map((f) => (
                    <tr key={f._id} className="hover:bg-primary-900/30 transition-colors">
                      <td className="py-2 px-3">{f.thumbnail ? <img src={f.thumbnail} alt={f.originalName} className="w-16 h-10 rounded object-cover border border-primary-800 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all" onClick={() => setLightboxFragment(f)} /> : <span className="text-primary-600 text-xs">—</span>}</td>
                      <td className="py-2 px-3 font-mono text-xs text-primary-300">{f.fragmentId?.slice(-12)}</td>
                      <td className="py-2 px-3 text-xs text-primary-400">{MOCK_CASES.find((c) => c._id === f.caseId)?.caseId || f.caseId}</td>
                      <td className="py-2 px-3 text-center"><span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs font-bold">{f.metadata?.fraudScore ?? 0}</span></td>
                      <td className="py-2 px-3 text-center text-xs text-amber-400 font-bold">{f.metadata?.elaScore ?? 0}</td>
                      <td className="py-2 px-3 text-xs text-rose-400 truncate max-w-64">{(f.metadata?.analysisNotes || "").slice(0, 80)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Case Metrics Tab */}
      {activeTab === "cases" && (
        <div className="space-y-6">
          {/* Radar Chart */}
          <ChartCard title="Case Risk Radar" subtitle="Multi-dimensional comparison of all active cases">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={caseRadar}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="case" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar name="Fraud Risk" dataKey="Fraud Risk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                <Radar name="Reconstruction" dataKey="Reconstruction" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Radar name="Evidence Volume" dataKey="Evidence Volume" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Radar name="Match Density" dataKey="Match Density" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Tooltip {...tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Case cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_CASES.map((c, i) => {
              const frags = ALL_FRAGMENTS.filter((f) => f.caseId === c._id);
              const fraudCount = frags.filter((f) => f.metadata?.isFraudulent).length;
              const avgFraud = frags.length ? (frags.reduce((s, f) => s + (f.metadata?.fraudScore ?? 0), 0) / frags.length).toFixed(0) : 0;
              return (
                <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-primary-900/40 border border-primary-800 rounded-xl p-4 card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-primary-500">{c.caseId}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      c.priority === "Critical" ? "bg-rose-500/10 text-rose-400" :
                      c.priority === "High" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                    }`}>{c.priority}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-2 line-clamp-1">{c.name}</h3>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-primary-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-blue-400">{c.fragmentCount}</p>
                      <p className="text-[8px] text-primary-600 uppercase">Fragments</p>
                    </div>
                    <div className="bg-primary-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-rose-400">{fraudCount}</p>
                      <p className="text-[8px] text-primary-600 uppercase">Fraud</p>
                    </div>
                    <div className="bg-primary-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-400">{avgFraud}</p>
                      <p className="text-[8px] text-primary-600 uppercase">Avg Score</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-primary-500">Reconstruction</span>
                      <span className="text-emerald-400 font-bold">{c.reconstructionProgress}%</span>
                    </div>
                    <div className="w-full bg-primary-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.reconstructionProgress}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Network Tab */}
      {activeTab === "network" && (
        <div className="space-y-6">
          <ChartCard title="Fragment Match Scatter" subtitle="Visualization of match pairs — bubble size represents confidence">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" dataKey="x" name="Position X" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="number" dataKey="y" name="Position Y" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                <ZAxis type="number" dataKey="z" range={[100, 600]} name="Confidence" />
                <Tooltip {...tooltipStyle} />
                <Scatter name="Match Pairs" data={matchNetwork}>
                  {matchNetwork.map((entry, i) => (
                    <Cell key={i} fill={entry.confidence > 85 ? "#10b981" : entry.confidence > 60 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Match table */}
          <ChartCard title="All Match Pairs" subtitle="Complete listing of fragment matches across all cases">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-800 text-[10px] text-primary-500 uppercase tracking-wider">
                    <th className="py-2 px-3 text-left">Case</th>
                    <th className="py-2 px-3 text-left">Fragment A</th>
                    <th className="py-2 px-3 text-left">Fragment B</th>
                    <th className="py-2 px-3 text-center">Confidence</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-left">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-800/50">
                  {Object.entries(MOCK_MATCHES).flatMap(([caseId, data]) =>
                    (data.matchedPairs || []).map((pair, i) => (
                      <tr key={`${caseId}_${i}`} className="hover:bg-primary-900/30 transition-colors">
                        <td className="py-2 px-3 text-xs font-mono text-primary-400">{MOCK_CASES.find((c) => c._id === caseId)?.caseId}</td>
                        <td className="py-2 px-3 text-xs font-mono text-blue-400">{pair.fragmentA.slice(-6)}</td>
                        <td className="py-2 px-3 text-xs font-mono text-violet-400">{pair.fragmentB.slice(-6)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            pair.confidence > 85 ? "bg-emerald-500/10 text-emerald-400" :
                            pair.confidence > 60 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                          }`}>{pair.confidence}%</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            pair.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                          }`}>{pair.status}</span>
                        </td>
                        <td className="py-2 px-3 text-xs text-primary-500">{pair.matchType}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
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

const ChartCard = ({ title, subtitle, children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="bg-primary-900/40 border border-primary-800 rounded-2xl overflow-hidden">
    <div className="p-4 border-b border-primary-800">
      <h3 className="text-sm font-bold">{title}</h3>
      {subtitle && <p className="text-[10px] text-primary-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4">{children}</div>
  </motion.div>
);

export default Analytics;
