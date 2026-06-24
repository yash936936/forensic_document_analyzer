import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Binary, ShieldCheck, ArrowRight, Loader2, Fingerprint } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ─── Animated Particles ─── */
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 18 }).map((_, i) => (
      <motion.div key={i}
        className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{
          y: [0, -30 - Math.random() * 40, 0],
          x: [0, (Math.random() - 0.5) * 30, 0],
          opacity: [0, 0.6, 0],
          scale: [0.5, 1 + Math.random(), 0.5],
        }}
        transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
      />
    ))}
  </div>
);

/* ─── Typing Effect ─── */
const TypewriterText = ({ phrases, speed = 60, pause = 2000 }) => {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const timer = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
          return;
        }
        setCharIdx(charIdx + 1);
      } else {
        setText(current.slice(0, charIdx));
        if (charIdx === 0) {
          setDeleting(false);
          setPhraseIdx((phraseIdx + 1) % phrases.length);
        } else {
          setCharIdx(charIdx - 1);
        }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return <span>{text}<span className="animate-pulse text-blue-400 ml-0.5">▎</span></span>;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Authentication successful. Session active.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-primary-950 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 8, repeat: Infinity }}
        className="absolute -top-50 -left-50 w-125 h-125 bg-blue-600 rounded-full blur-[120px]" />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.07, 0.03] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute -bottom-50 -right-50 w-125 h-125 bg-violet-600 rounded-full blur-[120px]" />
      <FloatingParticles />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}
              className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-600/30">
              <Binary className="w-7 h-7 text-blue-500" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">CrimeX ASDAS</h2>
              <p className="text-[10px] text-primary-500 uppercase tracking-[0.25em]">Forensic Intelligence Platform</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
            <TypewriterText phrases={["AI-Powered Document Reconstruction", "Deep Learning Fragment Analysis", "Forensic Evidence Processing"]} speed={50} pause={2500} />
          </h1>
          <p className="text-primary-400 leading-relaxed mb-8">Advanced shredded document analysis system featuring CNN-based fragment matching, automated OCR extraction, and forensic integrity verification.</p>
          <div className="space-y-4">
            {["Deep-learning fragment matching engine", "Multi-language OCR with confidence scoring", "Tamper detection & Error Level Analysis"].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 text-sm group">
                <div className="p-1 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <span className="text-primary-300 group-hover:text-white transition-colors">{f}</span>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="mt-12 border border-primary-800 rounded-xl p-4 bg-primary-900/30 hover:border-amber-500/30 transition-colors group">
            <p className="text-[10px] text-primary-500 uppercase tracking-widest mb-2 font-bold">Classification Level</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm text-amber-400 font-mono group-hover:tracking-wider transition-all">RESTRICTED — Authorized Personnel Only</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className={`bg-primary-900/40 border rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 ${
            focusedField ? "border-blue-600/30 shadow-lg shadow-blue-600/5" : "border-primary-800"
          }`}>
            <div className="flex lg:hidden items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-600/30">
                <Binary className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-bold text-lg">CrimeX ASDAS</span>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">Authenticate</h2>
              <Fingerprint className="w-5 h-5 text-blue-500/50" />
            </div>
            <p className="text-sm text-primary-500 mb-8">Enter your credentials to access the forensic platform.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Email Address</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === "email" ? "ring-2 ring-blue-600/20" : ""}`}>
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "email" ? "text-blue-400" : "text-primary-500"}`} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                    placeholder="agent@crimex-asdas.gov"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-600 placeholder:text-primary-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Password</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === "password" ? "ring-2 ring-blue-600/20" : ""}`}>
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "password" ? "text-blue-400" : "text-primary-500"}`} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-blue-600 placeholder:text-primary-600 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 via-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : <>Access Platform <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                </span>
              </motion.button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-primary-500">No account? <Link to="/register" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors hover:underline">Request Access</Link></p>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="mt-6 p-3 rounded-lg bg-blue-600/5 border border-blue-600/10 hover:border-blue-600/25 transition-colors">
              <p className="text-[10px] text-primary-500 uppercase tracking-widest font-bold mb-1">Demo Credentials</p>
              <p className="text-xs text-primary-400 font-mono">ayushi@crimex-asdas.gov / CrimeX-Forensic-2026</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
