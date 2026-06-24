import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3, Activity, Clock, CheckCircle2, Layers, ArrowUpRight, ChevronRight, Binary, Loader2, ShieldAlert, TrendingUp, Zap,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCases, getDashboardStats, getAlerts } from "../services/mockApi";

/* ─── Animated Counter Hook ─── */
const useCountUp = (end, duration = 1200, active = true) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || end == null || isNaN(end)) return;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, active]);
  return count;
};

/* ─── StatCard ─── */
const StatCard = ({ label, value, trend, icon: Icon, color, delay: d = 0, suffix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericVal = typeof value === "number" ? value : parseInt(value);
  const isNumeric = !isNaN(numericVal);
  const animated = useCountUp(isNumeric ? numericVal : 0, 1400, isInView);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: d * 0.12, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="bg-primary-900/40 border border-primary-800 p-5 rounded-2xl hover:bg-primary-900/60 transition-all group overflow-hidden relative cursor-default card-hover"
    >
      <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 transition-opacity duration-500 group-hover:opacity-50" style={{ backgroundColor: color }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}08 0%, transparent 70%)` }} />
      <div className="flex justify-between items-start mb-4 relative">
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}
          className="p-2.5 rounded-xl" style={{ backgroundColor: color + "20", color }}>
          <Icon className="w-6 h-6" />
        </motion.div>
        {trend && (
          <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: d * 0.12 + 0.4 }}
            className="text-xs font-medium flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {trend} <ArrowUpRight className="w-3 h-3" />
          </motion.span>
        )}
      </div>
      <h3 className="text-3xl font-bold mb-1 tracking-tight tabular-nums relative">
        {isNumeric ? animated : value}{suffix}
      </h3>
      <p className="text-sm text-primary-500 font-medium uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

/* ─── Animated Progress Bar ─── */
const AnimatedProgress = ({ value, color = "bg-blue-500", height = "h-1.5", striped = false }) => (
  <div className={`w-full bg-primary-800 ${height} rounded-full overflow-hidden`}>
    <motion.div
      className={`${color} ${height} rounded-full ${striped ? "progress-striped" : ""}`}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  </div>
);

/* ─── CaseRow ─── */
const CaseRow = ({ id, name, status, date, reconstruction, priority, onClick, index }) => (
  <motion.tr
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.06, duration: 0.3 }}
    onClick={onClick}
    className="border-b border-primary-800/50 hover:bg-primary-900/30 transition-all group cursor-pointer"
  >
    <td className="py-4 px-2"><span className="font-mono text-xs text-primary-500">{id}</span></td>
    <td className="py-4 px-2"><div className="font-medium text-white group-hover:text-blue-400 transition-colors duration-200">{name}</div></td>
    <td className="py-4 px-2">
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 ${
        status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        : status === "Processing" ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === "Completed" ? "bg-emerald-500" : status === "Processing" ? "bg-amber-500 animate-pulse" : "bg-blue-500"
        }`} />
        {status}
      </span>
    </td>
    <td className="py-4 px-2">
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
        priority === "Critical" ? "bg-rose-500/20 text-rose-400"
        : priority === "High" ? "bg-amber-500/20 text-amber-400"
        : "bg-primary-800 text-primary-400"
      }`}>{priority}</span>
    </td>
    <td className="py-4 px-2 text-sm text-primary-400">{date}</td>
    <td className="py-4 px-2">
      <div className="flex items-center gap-2">
        <AnimatedProgress value={reconstruction} />
        <span className="text-[10px] text-primary-500 font-mono w-8 tabular-nums">{reconstruction}%</span>
      </div>
    </td>
    <td className="py-4 px-2 text-right">
      <motion.div whileHover={{ x: 4 }} className="inline-block">
        <ChevronRight className="w-4 h-4 text-primary-600 group-hover:text-blue-400 transition-colors" />
      </motion.div>
    </td>
  </motion.tr>
);

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesData, statsData, alertsData] = await Promise.all([getCases(), getDashboardStats(), getAlerts()]);
        setCases(casesData);
        setStats(statsData);
        setAlerts(alertsData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Forensic Overview</h1>
          <p className="text-primary-400">{greetingTime()}, Agent {user?.name || "Ayushi Singh"}. System telemetry is <span className="text-emerald-400 font-medium">live</span>.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/audit")} className="bg-primary-900 border border-primary-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-800 transition-colors flex items-center gap-2">
            <Clock className="w-4 h-4" /> Audit Log
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/upload")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <Binary className="w-4 h-4" /> Start New Analysis
          </motion.button>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Cases" value={stats?.activeCases ?? 0} trend={`+${stats?.activeCases ?? 0}`} icon={Activity} color="#3b82f6" delay={0} />
        <StatCard label="Fragments Analyzed" value={stats?.fragmentsAnalyzed ?? 0} trend={`+${stats?.totalFragments ?? 0}`} icon={Layers} color="#8b5cf6" delay={1} />
        <StatCard label="Integrity Rate" value={stats?.successRate ?? 0} suffix="%" icon={CheckCircle2} color="#10b981" delay={2} />
        <StatCard label="System Load" value={stats?.systemLoad ?? 0} suffix="%" icon={BarChart3} color="#f59e0b" delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-primary-950/50 border border-primary-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-primary-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Active Reconstruction Cases</h2>
            <span className="text-primary-500 text-xs font-mono">{cases.length} CASES</span>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-primary-500 uppercase tracking-widest border-b border-primary-800">
                  <th className="pb-3 px-2">ID</th>
                  <th className="pb-3 px-2">Case Name</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Priority</th>
                  <th className="pb-3 px-2">Last Modified</th>
                  <th className="pb-3 px-2">Reconstruction</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-sm text-primary-500 font-mono tracking-widest">DECRYPTING INVESTIGATION DATA...</p>
                      <div className="w-48"><AnimatedProgress value={65} color="bg-blue-600" striped /></div>
                    </div>
                  </td></tr>
                ) : cases.map((c, idx) => (
                  <CaseRow key={c._id} index={idx} id={c.caseId} name={c.name} status={c.status} priority={c.priority}
                    date={new Date(c.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    reconstruction={c.reconstructionProgress} onClick={() => navigate(`/case/${c._id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-primary-900/30 border border-blue-600/30 rounded-2xl p-6 relative overflow-hidden group card-hover">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] group-hover:bg-blue-600/20 transition-all duration-500" />
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Binary className="w-5 h-5 text-blue-500" />
              </motion.div>
              AI MATCHING HUB
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
              </span>
            </h3>
            <p className="text-sm text-primary-400 mb-4 relative">CNN Matcher v4.3 ready. {stats?.fragmentsAnalyzed ?? 0} fragments processed across {stats?.totalCases ?? 0} cases.</p>
            <div className="flex items-center gap-2 mb-4 text-xs text-primary-500 relative">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Avg. reconstruction: <span className="text-emerald-400 font-bold">{stats?.avgReconstruction ?? 0}%</span></span>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/matching")} className="w-full bg-blue-600/10 border border-blue-600/50 text-blue-400 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2 relative">
              <Zap className="w-4 h-4" /> Continue Matching
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              System Alerts
              <span className="ml-auto text-[10px] font-mono text-primary-500">{alerts.length} TOTAL</span>
            </h3>
            <div className="space-y-3 max-h-75 overflow-y-auto pr-1">
              {alerts.map((alert, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex gap-3 items-start p-2.5 rounded-lg hover:bg-primary-900/40 transition-colors group/alert">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-2 ${
                    alert.type === "critical" ? "bg-rose-500 ring-rose-500/30" : alert.type === "warning" ? "bg-amber-500 ring-amber-500/30"
                    : alert.type === "success" ? "bg-emerald-500 ring-emerald-500/30" : "bg-blue-500 ring-blue-500/30"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-white leading-tight group-hover/alert:text-blue-300 transition-colors">{alert.msg}</p>
                    <p className="text-[10px] text-primary-500 mt-1 font-mono">{alert.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {stats?.fraudDetected > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 card-hover">
              <div className="flex gap-3 text-rose-500 mb-2">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                </motion.div>
                <h3 className="font-bold">Fraud Detections</h3>
              </div>
              <p className="text-xs text-rose-500/80 leading-relaxed">
                <span className="font-bold text-rose-400 text-lg">{stats.fraudDetected}</span> fragments flagged with fraud indicators across active investigations.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
