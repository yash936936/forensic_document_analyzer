import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Binary, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success("Account created. Redirecting to dashboard...");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-primary-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      <div className="absolute -top-50 -right-50 w-125 h-125 bg-violet-600/5 rounded-full blur-[120px]" />
      <motion.div className="absolute -bottom-37.5 -left-25 w-100 h-100 bg-blue-600/5 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-600/30">
              <Binary className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">CrimeX ASDAS</h2>
              <p className="text-[10px] text-primary-500 uppercase tracking-[0.25em]">Forensic Intelligence Platform</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">Join the <span className="text-violet-500">Investigation</span> Team</h1>
          <p className="text-primary-400 leading-relaxed mb-8">Request authorized access to the AI-Assisted Shredded Document Analysis System. All access is logged and monitored.</p>
          <div className="space-y-4">
            {["AES-256 encrypted evidence storage", "Role-based access with audit trails", "Multi-factor authentication support"].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-primary-300">{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="bg-primary-900/40 border border-primary-800 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex lg:hidden items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-600/30">
                <Binary className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-bold text-lg">CrimeX ASDAS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Request Access</h2>
            <p className="text-sm text-primary-500 mb-8">Create your forensic investigator account.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input type="text" value={form.name} onChange={update("name")} placeholder="Agent Name"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder:text-primary-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input type="email" value={form.email} onChange={update("email")} placeholder="agent@crimex-asdas.gov"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder:text-primary-600 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="Min. 8 characters"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder:text-primary-600 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-primary-500 uppercase tracking-wider font-semibold mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Re-enter password"
                    className="w-full bg-primary-950 border border-primary-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 placeholder:text-primary-600 transition-all" />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2 text-sm group">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</> : <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </motion.button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-primary-500">Already have access? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">Authenticate</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
