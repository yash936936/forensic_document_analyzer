import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Binary, ArrowLeft, ShieldOff } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <ShieldOff className="w-10 h-10 text-rose-500" />
        </motion.div>
        <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-6xl font-black text-primary-700 mb-2">404</motion.h1>
        <h2 className="text-xl font-bold mb-3">Access Denied — Resource Not Found</h2>
        <p className="text-sm text-primary-500 mb-8 leading-relaxed">
          The requested resource does not exist or you do not have clearance to access it. This incident has been logged.
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(-1)} className="bg-primary-800 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <Binary className="w-4 h-4" /> Dashboard
          </motion.button>
        </div>
        <p className="text-[10px] text-primary-600 mt-8 font-mono tracking-widest">INCIDENT REF: {Date.now().toString(36).toUpperCase()}</p>
      </motion.div>
    </div>
  );
};

export default NotFound;
