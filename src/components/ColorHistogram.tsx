import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { buildRampTextureData } from '../lib/gradientRampUtils';

interface Props {
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ColorHistogram({ sourceCanvasRef }: Props) {
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { histogram, setHistogram, gradient } = useGradientStore();
  
  const [colorStats, setColorStats] = useState<{ color: string, percent: number }[]>([]);

  // ドラッグリサイズ用の状態
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number, w: number }>({ x: 0, w: 0 });

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      w: 200 * histogram.scale
    };
  }, [histogram.scale]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartRef.current.x;
      const newW = resizeStartRef.current.w + delta;
      const newScale = Math.max(0.5, Math.min(3.0, newW / 200));
      setHistogram({ scale: newScale });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setHistogram]);

  // グラデーションの重複を統合したユニークカラーリスト
  const uniqueStops = useMemo(() => {
    const colorMap = new Map<string, number>();
    gradient.stops.forEach(s => {
      const c = s.color.toLowerCase();
      colorMap.set(c, (colorMap.get(c) || 0) + 1);
    });
    return Array.from(colorMap.keys());
  }, [gradient.stops]);

  useEffect(() => {
    if (!histogram.enabled) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = 64;
    offscreen.height = 64;

    let rafId: number;
    let lastStatsAt = 0;
    const update = () => {
      const source = sourceCanvasRef.current;
      const target = histogramCanvasRef.current;
      if (!source || !target) {
        rafId = requestAnimationFrame(update);
        return;
      }

      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      try {
        if (source.width > 0 && source.height > 0) {
          offCtx.drawImage(source, 0, 0, source.width, source.height, 0, 0, 64, 64);
        } else {
          rafId = requestAnimationFrame(update);
          return;
        }
      } catch (e) {
        rafId = requestAnimationFrame(update);
        return;
      }
      
      const imageData = offCtx.getImageData(0, 0, 64, 64);
      const data = imageData.data;
      const totalPixels = 64 * 64;

      const rH = new Uint32Array(256);
      const gH = new Uint32Array(256);
      const bH = new Uint32Array(256);
      const lH = new Uint32Array(256);
      
      const colorCounts = new Map<string, number>();
      uniqueStops.forEach(c => colorCounts.set(c, 0));

      const stopRgbList = uniqueStops.map(hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { hex, r, g, b };
      });

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        rH[r]++;
        gH[g]++;
        bH[b]++;
        lH[l]++;

        let minDist = Infinity;
        let closestHex = '';
        for (const stop of stopRgbList) {
          const dr = r - stop.r;
          const dg = g - stop.g;
          const db = b - stop.b;
          const dist = dr*dr + dg*dg + db*db;
          if (dist < minDist) {
            minDist = dist;
            closestHex = stop.hex;
          }
        }
        if (closestHex) {
          colorCounts.set(closestHex, (colorCounts.get(closestHex) || 0) + 1);
        }
      }

      const now = performance.now();
      if (now - lastStatsAt > 250) {
        lastStatsAt = now;
        const stats = stopRgbList.map(s => ({
          color: s.hex,
          percent: (colorCounts.get(s.hex) || 0) / totalPixels * 100
        })).sort((a, b) => b.percent - a.percent);
        setColorStats(stats);
      }

      const ctx = target.getContext('2d');
      if (ctx) {
        const w = target.width;
        const h = target.height;
        ctx.clearRect(0, 0, w, h);

        let max = 1;
        for (let i = 0; i < 256; i++) {
          max = Math.max(max, rH[i], gH[i], bH[i], lH[i]);
        }

        const drawPath = (histo: Uint32Array, color: string, fill: boolean = false, strokeWidth = 1) => {
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let i = 0; i < 256; i++) {
            const x = (i / 255) * w;
            const y = h - (histo[i] / max) * h;
            ctx.lineTo(x, y);
          }
          if (fill) {
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
          }
        };

        if (histogram.showRampDistribution) {
          const rampData = buildRampTextureData(gradient.stops, gradient.rampInterpolation, gradient.rampMirror ?? false, gradient.opacityStops, gradient.rampColorMode, gradient.rampVariable, gradient.rampRepeat);
          for (let i = 0; i < 256; i++) {
            ctx.fillStyle = `rgb(${rampData[i*4]}, ${rampData[i*4+1]}, ${rampData[i*4+2]})`;
            ctx.fillRect((i/255)*w, h-2, (1/255)*w + 1, 2);
          }
        }

        ctx.globalCompositeOperation = 'screen';
        drawPath(rH, 'rgba(255, 60, 60, 0.7)');
        drawPath(gH, 'rgba(60, 255, 60, 0.7)');
        drawPath(bH, 'rgba(60, 60, 255, 0.7)');
        ctx.globalCompositeOperation = 'source-over';
        drawPath(lH, 'rgba(255, 255, 255, 0.3)', false, 1.2);
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [sourceCanvasRef, histogram.enabled, histogram.showRampDistribution, gradient.stops, gradient.opacityStops, gradient.rampColorMode, gradient.rampInterpolation, gradient.rampVariable, gradient.rampRepeat, gradient.rampMirror, uniqueStops]);

  if (!histogram.enabled) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-k-bg/60 backdrop-blur-sm rounded-none border border-cream/10 pointer-events-auto">
        <button
          onClick={() => setHistogram({ enabled: true })}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-none transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-fire">
            <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
          </svg>
          <span className="text-[10px] font-bold text-deep uppercase tracking-widest">Show Histogram</span>
        </button>
      </div>
    );
  }

  const baseW = 200;
  const baseH = 100;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const scaledW = baseW * histogram.scale;
  const canvasDisplayH = baseH * 0.6 * histogram.scale;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col gap-1.5 p-3 bg-k-bg/60 backdrop-blur-md rounded-none border border-cream/20 shadow-2xl overflow-hidden pointer-events-auto select-none group relative transition-all hover:bg-k-bg/80 ${isResizing ? 'ring-2 ring-fire/50' : ''}`}
      style={{ width: scaledW }}
    >
      {/* リサイズハンドル */}
      <div 
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-fire/20 active:bg-fire/40 transition-colors z-30"
      />

      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-bold text-deep uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-fire animate-pulse" />
          Realtime Stats
        </span>
        <button
          onClick={() => setHistogram({ enabled: false })}
          className="text-tab-inactive hover:text-k-text text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
      
      <div className="relative overflow-hidden rounded-none bg-black/20" style={{ height: canvasDisplayH }}>
        <canvas
          ref={histogramCanvasRef}
          width={baseW * histogram.scale * dpr}
          height={baseH * 0.6 * histogram.scale * dpr}
          style={{ width: '100%', height: '100%' }}
          className="block"
        />
      </div>

      {/* カラー分布％ */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-white/5">
        {colorStats.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0 shadow-sm border border-white/10" style={{ backgroundColor: s.color }} />
              <span className="text-[9px] font-display text-tab-inactive truncate">{s.color.toUpperCase()}</span>
            </div>
            <span className="text-[9px] font-bold text-k-text shrink-0">{s.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-1">
        <div className="flex gap-1.5">
           <div className="w-1 h-1 rounded-full bg-red-500/50" />
           <div className="w-1 h-1 rounded-full bg-green-500/50" />
           <div className="w-1 h-1 rounded-full bg-blue-500/50" />
        </div>
        <span className="text-[8px] text-tab-inactive font-bold uppercase tracking-tighter">
          Drag right edge to resize
        </span>
      </div>
    </div>
  );
}
