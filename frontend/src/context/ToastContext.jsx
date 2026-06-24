import { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

// xAI design system — toast uses ex-toast: canvas-card surface, hairline border, 8px radius
const ACCENT = {
  success: "#dadbdf",
  error:   "#ff7a17",
  warning: "#ff7a17",
  info:    "#7d8187",
};

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle  size={14} />,
  error:   <AlertTriangle size={14} />,
  warning: <AlertTriangle size={14} />,
  info:    <Info          size={14} />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toast = {
    success: m => addToast(m, "success"),
    error:   m => addToast(m, "error"),
    warning: m => addToast(m, "warning"),
    info:    m => addToast(m, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24,
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
        pointerEvents: "none",
      }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 6,  scale: 0.97 }}
              style={{
                pointerEvents: "auto",
                display: "flex", alignItems: "center", gap: 12,
                backgroundColor: "#191919",
                border: "1px solid #212327",
                borderRadius: 8,
                padding: "12px 16px",
                minWidth: 240, maxWidth: 340,
                color: ACCENT[t.type],
              }}
            >
              <span style={{ flexShrink: 0, color: ACCENT[t.type], display: "flex" }}>{ICONS[t.type]}</span>
              <span style={{
                flex: 1, fontSize: 13, lineHeight: "20px",
                fontFamily: "Inter, system-ui, sans-serif", color: "#dadbdf",
              }}>
                {t.message}
              </span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#7d8187", display: "flex", padding: 0, flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}