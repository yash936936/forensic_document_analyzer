import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Upload, Puzzle, FileText, ScanEye, Settings, ClipboardList, Binary, ChevronLeft, ChevronRight, LogOut,
  Clock, BarChart3, Search, Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload Fragments" },
  { to: "/matching", icon: Puzzle, label: "Fragment Matching" },
  { to: "/ocr", icon: ScanEye, label: "OCR Review" },
  { to: "/reports", icon: FileText, label: "Forensic Reports" },
  { to: "/audit", icon: ClipboardList, label: "Audit Log" },
  { to: "/timeline", icon: Clock, label: "Timeline" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/export", icon: Download, label: "Export Center" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Tooltip = ({ label, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.12 }}
        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-800 border border-primary-700 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-xl shadow-black/40 z-50 pointer-events-none">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-primary-800" />
      </motion.div>
    )}
  </AnimatePresence>
);

const Sidebar = ({ open, setOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (to) => to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <aside className={`fixed top-0 left-0 h-screen z-40 bg-primary-950/95 backdrop-blur-sm border-r border-primary-800 flex flex-col transition-all duration-300 ease-in-out ${open ? "w-64" : "w-20"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-primary-800 shrink-0">
        <motion.div whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}
          className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-600/30 shrink-0 cursor-pointer"
          onClick={() => navigate("/")}>
          <Binary className="w-5 h-5 text-blue-500" />
        </motion.div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight leading-tight whitespace-nowrap">CrimeX ASDAS</h1>
              <p className="text-[9px] text-primary-500 uppercase tracking-[0.2em] whitespace-nowrap">Forensic Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <div key={to} className="relative" onMouseEnter={() => setHoveredLink(to)} onMouseLeave={() => setHoveredLink(null)}>
              <NavLink to={to} end={to === "/"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  active
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm shadow-blue-600/10"
                    : "text-primary-400 hover:text-white hover:bg-primary-900/50 border border-transparent"
                }`}>
                {/* Active indicator bar */}
                {active && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-blue-500 rounded-full shadow-md shadow-blue-500/50"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
                <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${active ? "drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]" : ""}`} />
                </motion.div>
                <AnimatePresence>
                  {open && (
                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }} className="truncate whitespace-nowrap">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
              {!open && <Tooltip label={label} show={hoveredLink === to} />}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-primary-800 p-3 space-y-2 shrink-0">
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400 text-xs font-bold border border-violet-600/30 shrink-0">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name || "Agent"}</p>
                  <p className="text-[10px] text-primary-500 truncate">{user?.email || ""}</p>
                </div>
                <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" title="Online" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-2">
          <AnimatePresence>
            {open && (
              <motion.button initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all hover:shadow-md hover:shadow-rose-500/10">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(!open)} className="p-2 rounded-xl hover:bg-primary-900 transition-colors text-primary-400 hover:text-white border border-primary-800">
            <motion.div animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
