import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, ZoomOut, RotateCw, Maximize2, Shield, ScanEye, FileText, AlertTriangle, CheckCircle, Wand2,
} from "lucide-react";

/**
 * FragmentLightbox — fullscreen image viewer for a fragment.
 * Props:
 *   fragment   — fragment object (needs thumbnail or imageUrl, plus metadata fields)
 *   imageUrl   — explicit image URL (overrides fragment.thumbnail)
 *   onClose    — close callback
 *   onUnshred  — optional: if provided, shows an "Unshred" button that calls this
 */
const FragmentLightbox = ({ fragment, imageUrl, onClose, onUnshred }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const src = imageUrl || fragment?.thumbnail;
  if (!fragment || !src) return null;

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(5, Math.max(0.3, z + delta)));
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const fraudScore = fragment.fraudScore ?? fragment.metadata?.fraudScore ?? 0;
  const ocrConf = fragment.ocrConfidence ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex bg-black/90 backdrop-blur-sm"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-primary-400">{fragment.fragmentId || fragment.originalName || "Fragment"}</span>
          {fragment.label && fragment.label !== "F" && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-primary-800 text-primary-400 font-mono uppercase">{fragment.label}</span>
          )}
          {fraudScore > 50 && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" /> Fraud {fraudScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(5, z + 0.3))}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.3))}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setRotation((r) => r + 90)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Rotate">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={resetView}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Reset">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <motion.img
          src={src}
          alt={fragment.originalName || "Fragment"}
          className="max-w-none select-none pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: dragging ? "none" : "transform 0.2s ease-out",
            maxHeight: "85vh",
            maxWidth: "85vw",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {[
              { icon: ScanEye, label: "OCR", value: ocrConf > 0 ? `${(ocrConf * 100).toFixed(0)}%` : "—", color: ocrConf > 0.85 ? "text-emerald-400" : ocrConf > 0.6 ? "text-amber-400" : "text-rose-400" },
              { icon: Shield, label: "Fraud", value: `${fraudScore}/100`, color: fraudScore > 50 ? "text-rose-400" : "text-emerald-400" },
              { icon: FileText, label: "Type", value: fragment.scanDetails?.documentType || fragment.label || "Fragment", color: "text-blue-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-white/50">{label}:</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 font-mono">{Math.round(zoom * 100)}% • Scroll to zoom • Drag to pan</span>
            {onUnshred && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onUnshred}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30">
                <Wand2 className="w-3.5 h-3.5" /> Unshred
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FragmentLightbox;
