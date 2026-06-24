import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Shield, Database, Cpu, Bell, Save, RotateCcw, CheckCircle, Moon, Sun, Globe, Lock,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const Section = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-primary-900/30 border border-primary-800 rounded-2xl overflow-hidden">
    <div className="p-5 border-b border-primary-800 flex items-center gap-3">
      <Icon className="w-5 h-5 text-blue-500" />
      <h3 className="font-bold">{title}</h3>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </motion.div>
);

const Toggle = ({ label, description, value, onChange }) => (
  <div className="flex justify-between items-start gap-4">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-primary-500 mt-0.5">{description}</p>}
    </div>
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${value ? "bg-blue-600" : "bg-primary-700"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${value ? "ml-6" : "ml-1"}`} />
    </button>
  </div>
);

const Settings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    emailAlerts: false,
    autoMatch: true,
    matchThreshold: 70,
    ocrLanguage: "eng+hin",
    ocrEnhanced: true,
    fraudDetection: true,
    fraudThreshold: 50,
    elaEnabled: true,
    hashVerification: true,
    encryptionLevel: "AES-256",
    auditLogging: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
  });

  const update = (key) => (val) => setSettings((p) => ({ ...p, [key]: typeof val === "boolean" ? val : val }));

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  const handleReset = () => {
    setSettings({
      darkMode: true, notifications: true, emailAlerts: false, autoMatch: true, matchThreshold: 70,
      ocrLanguage: "eng+hin", ocrEnhanced: true, fraudDetection: true, fraudThreshold: 50,
      elaEnabled: true, hashVerification: true, encryptionLevel: "AES-256", auditLogging: true,
      sessionTimeout: 30, twoFactorAuth: false,
    });
    toast.info("Settings reset to defaults.");
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Settings</h1>
        <p className="text-primary-400">Configure AI parameters, security policies, and platform preferences.</p>
      </motion.header>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} whileHover={{ y: -1 }}
        className="bg-primary-900/30 border border-primary-800 rounded-2xl p-6 flex items-center gap-5 card-hover">
        <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 text-2xl font-bold border border-blue-600/30">
          {(user?.name || "A").charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-bold">{user?.name || "Agent"}</h3>
          <p className="text-sm text-primary-500">{user?.email || "—"}</p>
          <p className="text-xs text-primary-600 mt-1">{user?.role === "admin" ? "Administrator" : "Forensic Analyst"} • Active session</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Matching */}
        <Section title="AI Matching Engine" icon={Cpu} delay={0.1}>
          <Toggle label="Auto-Match on Upload" description="Automatically run CNN matcher when fragments are uploaded" value={settings.autoMatch} onChange={update("autoMatch")} />
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Match Confidence Threshold</span>
              <span className="text-blue-400 font-bold">{settings.matchThreshold}%</span>
            </div>
            <input type="range" min={30} max={95} value={settings.matchThreshold}
              onChange={(e) => setSettings((p) => ({ ...p, matchThreshold: Number(e.target.value) }))}
              className="w-full accent-blue-600 h-1.5 rounded-full appearance-none bg-primary-800 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-primary-500 mt-1"><span>30% (Loose)</span><span>95% (Strict)</span></div>
          </div>
          <Toggle label="Enhanced OCR Mode" description="Use Tesseract v5 with LSTM for improved accuracy" value={settings.ocrEnhanced} onChange={update("ocrEnhanced")} />
          <div>
            <label className="block text-sm font-medium mb-2">OCR Language Model</label>
            <select value={settings.ocrLanguage} onChange={(e) => setSettings((p) => ({ ...p, ocrLanguage: e.target.value }))}
              className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 transition-all">
              <option value="eng">English Only</option>
              <option value="hin">Hindi Only</option>
              <option value="eng+hin">English + Hindi</option>
              <option value="eng+hin+mar">English + Hindi + Marathi</option>
            </select>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security & Integrity" icon={Shield} delay={0.15}>
          <Toggle label="Fraud Detection" description="Enable AI-based tampering analysis on all fragments" value={settings.fraudDetection} onChange={update("fraudDetection")} />
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Fraud Alert Threshold</span>
              <span className="text-rose-400 font-bold">{settings.fraudThreshold}/100</span>
            </div>
            <input type="range" min={20} max={90} value={settings.fraudThreshold}
              onChange={(e) => setSettings((p) => ({ ...p, fraudThreshold: Number(e.target.value) }))}
              className="w-full accent-rose-500 h-1.5 rounded-full appearance-none bg-primary-800 cursor-pointer" />
          </div>
          <Toggle label="Error Level Analysis (ELA)" description="Detect pixel-level modifications in fragment images" value={settings.elaEnabled} onChange={update("elaEnabled")} />
          <Toggle label="SHA-256 Hash Verification" description="Verify fragment integrity on every access" value={settings.hashVerification} onChange={update("hashVerification")} />
          <div>
            <label className="block text-sm font-medium mb-2">Encryption Standard</label>
            <select value={settings.encryptionLevel} onChange={(e) => setSettings((p) => ({ ...p, encryptionLevel: e.target.value }))}
              className="w-full bg-primary-950 border border-primary-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 transition-all">
              <option value="AES-128">AES-128</option>
              <option value="AES-256">AES-256 (Recommended)</option>
              <option value="ChaCha20">ChaCha20-Poly1305</option>
            </select>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell} delay={0.2}>
          <Toggle label="In-App Notifications" description="Show real-time alerts within the platform" value={settings.notifications} onChange={update("notifications")} />
          <Toggle label="Email Alerts" description="Send critical alerts to registered email address" value={settings.emailAlerts} onChange={update("emailAlerts")} />
          <Toggle label="Audit Logging" description="Log all user actions for forensic accountability" value={settings.auditLogging} onChange={update("auditLogging")} />
        </Section>

        {/* Platform */}
        <Section title="Platform" icon={Database} delay={0.25}>
          <Toggle label="Two-Factor Authentication" description="Require 2FA for all login attempts" value={settings.twoFactorAuth} onChange={update("twoFactorAuth")} />
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Session Timeout</span>
              <span className="text-primary-300 font-mono">{settings.sessionTimeout} min</span>
            </div>
            <input type="range" min={5} max={120} step={5} value={settings.sessionTimeout}
              onChange={(e) => setSettings((p) => ({ ...p, sessionTimeout: Number(e.target.value) }))}
              className="w-full accent-blue-600 h-1.5 rounded-full appearance-none bg-primary-800 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-primary-500 mt-1"><span>5 min</span><span>120 min</span></div>
          </div>
          <div className="bg-primary-950 rounded-xl p-4 text-xs">
            <p className="text-primary-500 uppercase tracking-widest font-bold mb-2">System Info</p>
            <div className="space-y-1.5 text-primary-400 font-mono">
              <p>CrimeX ASDAS v2.0.0 • Build 2026.01.15</p>
              <p>AI Engine: CNN Matcher v4.3</p>
              <p>OCR: Tesseract v5.3.4 LSTM</p>
              <p>Environment: Production</p>
            </div>
          </div>
        </Section>
      </div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-4">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Save Settings
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleReset} className="bg-primary-800 hover:bg-primary-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-2">
          <RotateCcw className="w-5 h-5" /> Reset
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Settings;
