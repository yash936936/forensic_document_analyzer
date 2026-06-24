import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, Settings, User, Menu, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNotifications, markNotificationRead } from "../../services/mockApi";

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.1 } },
};

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    getNotifications().then((data) => {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    });
  }, []);

  // Ctrl+K to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
        setShowNotifs(false);
        setShowUser(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-primary-950/80 backdrop-blur-md border-b border-primary-800">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-primary-400 hover:text-white transition-colors lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${searchFocused ? "text-blue-400" : "text-primary-500"}`} />
            <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              placeholder="Search cases, fragments..."
              className={`bg-primary-900/50 border rounded-xl pl-10 pr-16 py-2 text-sm w-72 placeholder:text-primary-600 focus:outline-none transition-all duration-200 ${
                searchFocused ? "border-blue-600 ring-1 ring-blue-600/30 bg-primary-900/70 w-80" : "border-primary-800"
              }`} />
            {!searchFocused && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-primary-600">
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-primary-700 bg-primary-800 font-mono">Ctrl</kbd>
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-primary-700 bg-primary-800 font-mono">K</kbd>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            System Live
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
              className="relative p-2 rounded-xl hover:bg-primary-900 transition-colors text-primary-400 hover:text-white">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}
                  className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30">
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                  className="absolute right-0 top-12 w-80 bg-primary-900 border border-primary-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                  <div className="p-4 border-b border-primary-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold">Notifications</h3>
                    <span className="text-[10px] text-primary-500 font-mono">{unreadCount} UNREAD</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-primary-800">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-primary-500 text-center">No notifications</p>
                    ) : notifications.map((n, i) => (
                      <motion.div key={n.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => handleMarkRead(n.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-primary-800/50 transition-colors ${!n.read ? "bg-blue-600/5 border-l-2 border-blue-500" : ""}`}>
                        <p className={`text-sm leading-tight ${!n.read ? "text-white" : "text-primary-400"}`}>{n.message}</p>
                        <p className="text-[10px] text-primary-500 mt-1">{n.time}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary-900 transition-colors">
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500 text-xs font-bold border border-blue-600/30">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold leading-tight">{user?.name || "Agent"}</p>
                <p className="text-[10px] text-primary-500">{user?.role || "Forensic Analyst"}</p>
              </div>
              <motion.div animate={{ rotate: showUser ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3 h-3 text-primary-500 hidden md:block" />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {showUser && (
                <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                  className="absolute right-0 top-12 w-52 bg-primary-900 border border-primary-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                  <button onClick={() => { setShowUser(false); navigate("/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-800/60 transition-colors text-sm text-primary-300 hover:text-white">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => { setShowUser(false); navigate("/audit"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-800/60 transition-colors text-sm text-primary-300 hover:text-white">
                    <User className="w-4 h-4" /> Audit Log
                  </button>
                  <div className="border-t border-primary-800" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/10 transition-colors text-sm text-rose-400">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
