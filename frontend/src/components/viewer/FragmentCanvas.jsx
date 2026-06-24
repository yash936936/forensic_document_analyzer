import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Move, Lock, Unlock, Grid3X3, Maximize2, Download,
  ChevronDown, Layers, Eye, EyeOff, Trash2, Undo2, Redo2, MousePointer2, Hand,
} from "lucide-react";

const GRID_SIZE = 20;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

const FragmentCanvas = ({ fragments = [], caseLabel = "Unknown Case", onFragmentUpdate }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState("select"); // select | pan
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lockedIds, setLockedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fragment positions local state
  const [positions, setPositions] = useState(() =>
    fragments.reduce((acc, f, i) => {
      acc[f._id] = {
        x: f.position?.x ?? (i % 4) * 220,
        y: f.position?.y ?? Math.floor(i / 4) * 220,
        rotation: f.position?.rotation ?? 0,
        scale: 1,
      };
      return acc;
    }, {})
  );

  useEffect(() => {
    const newPositions = {};
    fragments.forEach((f, i) => {
      newPositions[f._id] = positions[f._id] || {
        x: (i % 4) * 220,
        y: Math.floor(i / 4) * 220,
        rotation: 0,
        scale: 1,
      };
    });
    setPositions(newPositions);
  }, [fragments.length]);

  const pushHistory = useCallback((newPositions) => {
    setHistory((h) => [...h.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(newPositions))]);
    setHistoryIndex((i) => i + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPositions(history[historyIndex - 1]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPositions(history[historyIndex + 1]);
    }
  };

  const snap = (v) => (snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v);

  const handleMouseDown = (e) => {
    if (tool === "pan" || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    // Deselect if clicking on empty canvas
    if (e.target === canvasRef.current || e.target.classList.contains("canvas-bg")) {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap((e.clientX - rect.left - pan.x) / zoom - dragOffset.x);
      const y = snap((e.clientY - rect.top - pan.y) / zoom - dragOffset.y);
      setPositions((p) => ({ ...p, [dragging]: { ...p[dragging], x, y } }));
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      pushHistory(positions);
      if (onFragmentUpdate) onFragmentUpdate(dragging, positions[dragging]);
    }
    setIsPanning(false);
    setDragging(null);
  };

  const handleFragmentMouseDown = (e, fId) => {
    e.stopPropagation();
    if (lockedIds.has(fId)) return;
    if (tool === "pan") return;
    setSelectedId(fId);
    setDragging(fId);
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = positions[fId];
    setDragOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - pos.x,
      y: (e.clientY - rect.top - pan.y) / zoom - pos.y,
    });
  };

  const rotateSelected = (deg) => {
    if (!selectedId || lockedIds.has(selectedId)) return;
    setPositions((p) => ({
      ...p,
      [selectedId]: { ...p[selectedId], rotation: (p[selectedId].rotation + deg) % 360 },
    }));
    pushHistory({ ...positions, [selectedId]: { ...positions[selectedId], rotation: (positions[selectedId].rotation + deg) % 360 } });
  };

  const toggleLock = (id) => {
    setLockedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleVisibility = (id) => {
    setHiddenIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  };

  const selectedFrag = fragments.find((f) => f._id === selectedId);
  const selectedPos = selectedId ? positions[selectedId] : null;

  return (
    <div className="flex flex-col h-full bg-primary-950 rounded-2xl border border-primary-800 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-primary-800 bg-primary-900/60 flex-wrap">
        <div className="flex items-center gap-1 bg-primary-950 rounded-lg p-1 border border-primary-800">
          <ToolBtn icon={MousePointer2} active={tool === "select"} onClick={() => setTool("select")} tip="Select" />
          <ToolBtn icon={Hand} active={tool === "pan"} onClick={() => setTool("pan")} tip="Pan" />
        </div>
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={ZoomIn} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15))} tip="Zoom In" />
        <ToolBtn icon={ZoomOut} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15))} tip="Zoom Out" />
        <span className="text-[10px] font-mono text-primary-400 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={RotateCcw} onClick={() => rotateSelected(-15)} tip="Rotate Left" disabled={!selectedId} />
        <ToolBtn icon={RotateCw} onClick={() => rotateSelected(15)} tip="Rotate Right" disabled={!selectedId} />
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={Grid3X3} active={showGrid} onClick={() => setShowGrid(!showGrid)} tip="Grid" />
        <ToolBtn icon={showGrid && snapToGrid ? Lock : Unlock} active={snapToGrid} onClick={() => setSnapToGrid(!snapToGrid)} tip="Snap to Grid" />
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={Undo2} onClick={undo} tip="Undo" disabled={historyIndex <= 0} />
        <ToolBtn icon={Redo2} onClick={redo} tip="Redo" disabled={historyIndex >= history.length - 1} />
        <ToolBtn icon={Maximize2} onClick={resetView} tip="Reset View" />
        <div className="ml-auto text-[10px] text-primary-500 font-mono">{caseLabel} — {fragments.length} fragments</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden ${tool === "pan" ? "cursor-grab" : "cursor-default"} ${isPanning ? "cursor-grabbing" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid */}
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none canvas-bg" style={{ opacity: 0.08 }}>
              <defs>
                <pattern id="grid" width={GRID_SIZE * zoom} height={GRID_SIZE * zoom} patternUnits="userSpaceOnUse"
                  x={pan.x % (GRID_SIZE * zoom)} y={pan.y % (GRID_SIZE * zoom)}>
                  <path d={`M ${GRID_SIZE * zoom} 0 L 0 0 0 ${GRID_SIZE * zoom}`} fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Fragments layer */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            className="absolute top-0 left-0">
            {fragments.map((frag) => {
              if (hiddenIds.has(frag._id)) return null;
              const pos = positions[frag._id];
              if (!pos) return null;
              const isSelected = selectedId === frag._id;
              const isLocked = lockedIds.has(frag._id);
              const isFraud = (frag.metadata?.fraudScore ?? frag.fraudScore ?? 0) > 50;

              return (
                <motion.div
                  key={frag._id}
                  className={`absolute select-none group ${isLocked ? "opacity-80" : "cursor-move"}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: `rotate(${pos.rotation}deg) scale(${pos.scale})`,
                    zIndex: isSelected ? 50 : 1,
                  }}
                  onMouseDown={(e) => handleFragmentMouseDown(e, frag._id)}
                  animate={{ scale: isSelected ? 1.02 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className={`w-48 rounded-xl overflow-hidden border-2 transition-all shadow-lg ${
                    isSelected
                      ? "border-blue-500 shadow-blue-500/30 ring-2 ring-blue-500/20"
                      : isFraud
                        ? "border-rose-500/40 shadow-rose-500/10"
                        : "border-primary-700 shadow-black/20"
                  }`}>
                    {/* Fragment visual */}
                    <div className="h-32 bg-linear-to-br from-primary-800 to-primary-900 flex items-center justify-center relative overflow-hidden">
                      <div className="text-[10px] font-mono text-primary-400 text-center px-2 leading-relaxed max-h-full overflow-hidden">
                        {(frag.metadata?.ocrText || frag.ocrText || "No OCR text").slice(0, 120)}...
                      </div>
                      {isFraud && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-500/80 text-white text-[8px] font-bold rounded uppercase">
                          Fraud
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute top-1 left-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <div className="px-2 py-1.5 bg-primary-950/80 border-t border-primary-800">
                      <p className="text-[9px] font-mono text-primary-400 truncate">
                        {frag.fragmentId || frag._id.slice(-8)}
                      </p>
                      <p className="text-[8px] text-primary-600 truncate">
                        {frag.originalName || "fragment"}
                      </p>
                    </div>
                  </div>

                  {/* Edge geometry indicator dots */}
                  {isSelected && (
                    <>
                      {[
                        { pos: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", label: "T" },
                        { pos: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", label: "B" },
                        { pos: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", label: "L" },
                        { pos: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", label: "R" },
                      ].map(({ pos: p, label }) => (
                        <div key={label}
                          className={`absolute ${p} w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-md`} />
                      ))}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 bg-primary-900/80 border border-primary-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-primary-400 backdrop-blur-sm">
            {(zoom * 100).toFixed(0)}% | Pan: {pan.x.toFixed(0)},{pan.y.toFixed(0)}
          </div>
        </div>

        {/* Right Panel — Fragment List & Properties */}
        <div className="w-64 border-l border-primary-800 bg-primary-900/40 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-primary-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Fragments ({fragments.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-primary-800/50">
            {fragments.map((frag) => {
              const isSel = selectedId === frag._id;
              const isHidden = hiddenIds.has(frag._id);
              const isLocked = lockedIds.has(frag._id);
              const fraud = (frag.metadata?.fraudScore ?? frag.fraudScore ?? 0);
              return (
                <div
                  key={frag._id}
                  className={`p-2.5 cursor-pointer transition-all text-left ${isSel ? "bg-blue-600/10 border-l-2 border-l-blue-500" : "hover:bg-primary-900/50 border-l-2 border-l-transparent"}`}
                  onClick={() => setSelectedId(frag._id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${fraud > 50 ? "bg-rose-500" : fraud > 30 ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="text-[10px] font-mono text-primary-300 truncate flex-1">{frag.fragmentId?.slice(-12) || frag._id.slice(-8)}</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleVisibility(frag._id); }} className="p-0.5 hover:bg-primary-800 rounded transition-colors">
                      {isHidden ? <EyeOff className="w-3 h-3 text-primary-600" /> : <Eye className="w-3 h-3 text-primary-500" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleLock(frag._id); }} className="p-0.5 hover:bg-primary-800 rounded transition-colors">
                      {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-primary-600" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-primary-600 truncate mt-0.5 ml-4">{frag.originalName || "unknown"}</p>
                </div>
              );
            })}
          </div>

          {/* Properties Panel */}
          {selectedFrag && selectedPos && (
            <div className="border-t border-primary-800 p-3 space-y-2.5 bg-primary-950/50">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary-400">Properties</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <PropRow label="X" value={selectedPos.x.toFixed(0)} />
                <PropRow label="Y" value={selectedPos.y.toFixed(0)} />
                <PropRow label="Rotation" value={`${selectedPos.rotation}°`} />
                <PropRow label="Fraud" value={`${selectedFrag.metadata?.fraudScore ?? selectedFrag.fraudScore ?? 0}%`} color={((selectedFrag.metadata?.fraudScore ?? selectedFrag.fraudScore ?? 0) > 50) ? "text-rose-400" : "text-emerald-400"} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, active, onClick, tip, disabled }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    title={tip}
    className={`p-1.5 rounded-lg transition-all ${
      active ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" :
      disabled ? "text-primary-700 cursor-not-allowed" :
      "text-primary-400 hover:bg-primary-800 hover:text-white border border-transparent"
    }`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const PropRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center bg-primary-900/40 rounded px-2 py-1">
    <span className="text-primary-500">{label}</span>
    <span className={`font-mono font-bold ${color || "text-white"}`}>{value}</span>
  </div>
);

export default FragmentCanvas;
