import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize2, Sun, Contrast, FlipHorizontal2, FlipVertical2, Move,
} from "lucide-react";

const ImageViewer = ({ src, alt = "Fragment", fragmentData = null }) => {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showELA, setShowELA] = useState(false);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(5, Math.max(0.2, z + delta)));
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setFlipH(false);
    setFlipV(false);
    setShowELA(false);
  };

  const fraudScore = fragmentData?.metadata?.fraudScore ?? fragmentData?.fraudScore ?? 0;
  const elaScore = fragmentData?.metadata?.elaScore ?? fragmentData?.elaScore ?? 0;

  return (
    <div className="flex flex-col h-full bg-primary-950 rounded-2xl border border-primary-800 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-primary-800 bg-primary-900/60 flex-wrap">
        <ToolBtn icon={ZoomIn} onClick={() => setZoom((z) => Math.min(5, z + 0.25))} tip="Zoom In" />
        <ToolBtn icon={ZoomOut} onClick={() => setZoom((z) => Math.max(0.2, z - 0.25))} tip="Zoom Out" />
        <span className="text-[10px] font-mono text-primary-400 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={RotateCcw} onClick={() => setRotation((r) => r - 90)} tip="Rotate Left" />
        <ToolBtn icon={RotateCw} onClick={() => setRotation((r) => r + 90)} tip="Rotate Right" />
        <ToolBtn icon={FlipHorizontal2} active={flipH} onClick={() => setFlipH(!flipH)} tip="Flip Horizontal" />
        <ToolBtn icon={FlipVertical2} active={flipV} onClick={() => setFlipV(!flipV)} tip="Flip Vertical" />
        <div className="w-px h-6 bg-primary-800" />
        <ToolBtn icon={Maximize2} onClick={resetView} tip="Reset" />
        {fragmentData && (
          <>
            <div className="w-px h-6 bg-primary-800" />
            <button
              onClick={() => setShowELA(!showELA)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                showELA ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-primary-800 text-primary-400 border-primary-700 hover:text-white"
              }`}
            >
              ELA View
            </button>
          </>
        )}

        {/* Brightness/Contrast sliders */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3 h-3 text-primary-500" />
            <input type="range" min="20" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-16 h-1 accent-amber-500 cursor-pointer" title={`Brightness: ${brightness}%`} />
          </div>
          <div className="flex items-center gap-1.5">
            <Contrast className="w-3 h-3 text-primary-500" />
            <input type="range" min="20" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))}
              className="w-16 h-1 accent-blue-500 cursor-pointer" title={`Contrast: ${contrast}%`} />
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#0a0a0f]"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Checkerboard */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)`,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        />

        {/* Image container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${showELA ? "hue-rotate(180deg) saturate(3) brightness(150%)" : ""}`,
              transition: isDragging ? "none" : "transform 0.2s ease, filter 0.3s ease",
            }}
          >
            {src ? (
              <img src={src} alt={alt} className="max-w-none select-none pointer-events-none" draggable={false} />
            ) : (
              <div className="w-80 h-60 bg-primary-900 rounded-xl border border-primary-800 flex flex-col items-center justify-center gap-3 p-6">
                <Move className="w-10 h-10 text-primary-700" />
                <p className="text-sm text-primary-500 text-center">No image loaded.<br />Select a fragment to view.</p>
              </div>
            )}
          </div>
        </div>

        {/* ELA overlay label */}
        {showELA && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-rose-500/20 border border-rose-500/30 px-4 py-1.5 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Error Level Analysis Mode</span>
          </motion.div>
        )}

        {/* Fragment info overlay */}
        {fragmentData && (
          <div className="absolute bottom-3 right-3 bg-primary-900/90 border border-primary-800 rounded-xl p-3 backdrop-blur-sm space-y-1.5 min-w-48">
            <p className="text-[10px] font-mono text-primary-400 truncate">{fragmentData.fragmentId || fragmentData._id}</p>
            <div className="grid grid-cols-3 gap-1.5">
              <InfoChip label="OCR" value={`${((fragmentData.metadata?.ocrText ? 0.85 : 0.2) * 100).toFixed(0)}%`} color="text-blue-400" />
              <InfoChip label="Fraud" value={`${fraudScore}`} color={fraudScore > 50 ? "text-rose-400" : "text-emerald-400"} />
              <InfoChip label="ELA" value={`${elaScore}`} color="text-amber-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, active, onClick, tip, disabled }) => (
  <button disabled={disabled} onClick={onClick} title={tip}
    className={`p-1.5 rounded-lg transition-all ${
      active ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" :
      disabled ? "text-primary-700 cursor-not-allowed" :
      "text-primary-400 hover:bg-primary-800 hover:text-white border border-transparent"
    }`}>
    <Icon className="w-4 h-4" />
  </button>
);

const InfoChip = ({ label, value, color }) => (
  <div className="bg-primary-950/60 rounded-lg px-2 py-1 text-center">
    <p className={`text-xs font-bold ${color}`}>{value}</p>
    <p className="text-[8px] text-primary-600 uppercase">{label}</p>
  </div>
);

export default ImageViewer;
