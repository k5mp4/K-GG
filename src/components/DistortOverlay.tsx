import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useGradientStore } from '../store/gradientStore';
import type { ManualDistortConfig } from '../types/distortion';

type Props = {
  active: boolean;
  width: number;
  height: number;
  canvasW: number;
  canvasH: number;
  manualDistort: ManualDistortConfig;
  setManualDistort: (v: Partial<ManualDistortConfig>) => void;
};

type Point = {
  x: number;
  y: number;
};

type SwirlDrag = {
  pointerId: number;
  center: Point;
  startAngle: number;
  lastAngle: number;
  totalAngle: number;
  radius: number;
  snapshot: number[];
  current: Point;
  initialized: boolean;
};

const MAX_SWIRL_ANGLE = Math.PI * 4;

function clampSigned(v: number): number {
  return Math.max(-0.999, Math.min(0.999, v));
}

function addSoftLimited(current: number, delta: number): number {
  if (Math.abs(delta) < 1e-8) return clampSigned(current);
  const headroom = delta > 0 ? 1 - current : 1 + current;
  return clampSigned(current + delta * Math.max(0.02, headroom));
}

function sampleDisplacement(map: number[], resolution: number, x: number, y: number): [number, number] {
  const sx = Math.max(0, Math.min(resolution - 1, x));
  const sy = Math.max(0, Math.min(resolution - 1, y));
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(resolution - 1, x0 + 1);
  const y1 = Math.min(resolution - 1, y0 + 1);
  const tx = sx - x0;
  const ty = sy - y0;
  const read = (ix: number, iy: number): [number, number] => {
    const idx = (iy * resolution + ix) * 2;
    return [map[idx] ?? 0, map[idx + 1] ?? 0];
  };
  const [aX, aY] = read(x0, y0);
  const [bX, bY] = read(x1, y0);
  const [cX, cY] = read(x0, y1);
  const [dX, dY] = read(x1, y1);
  const topX = aX + (bX - aX) * tx;
  const topY = aY + (bY - aY) * tx;
  const bottomX = cX + (dX - cX) * tx;
  const bottomY = cY + (dY - cY) * tx;
  return [topX + (bottomX - topX) * ty, topY + (bottomY - topY) * ty];
}

function clampSwirlAngle(v: number): number {
  return Math.max(-MAX_SWIRL_ANGLE, Math.min(MAX_SWIRL_ANGLE, v));
}

function buildSwirlArcPath(center: Point, radius: number, startAngle: number, totalAngle: number): string {
  const arcRadius = Math.max(radius, 1);
  const clampedAngle = clampSwirlAngle(totalAngle);
  const direction = clampedAngle >= 0 ? 1 : -1;
  const segmentCount = Math.max(1, Math.ceil(Math.abs(clampedAngle) / (Math.PI * 0.75)));
  const segmentAngle = clampedAngle / segmentCount;
  let angle = startAngle;
  let x = center.x + Math.cos(angle) * arcRadius;
  let y = center.y + Math.sin(angle) * arcRadius;
  let path = `M ${x} ${y}`;

  for (let i = 0; i < segmentCount; i++) {
    angle += segmentAngle;
    x = center.x + Math.cos(angle) * arcRadius;
    y = center.y + Math.sin(angle) * arcRadius;
    const largeArc = Math.abs(segmentAngle) > Math.PI ? 1 : 0;
    const sweep = direction >= 0 ? 1 : 0;
    path += ` A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${x} ${y}`;
  }

  return path;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

export function DistortOverlay({ active, width, height, canvasW, canvasH, manualDistort, setManualDistort }: Props) {
  const { isGradientAnchorDragging } = useGradientStore();
  const dragRef = useRef<{ pointerId: number; previous: Point; strokeDistance: number } | null>(null);
  const swirlRef = useRef<SwirlDrag | null>(null);
  const resizeRef = useRef<{ active: boolean; startX: number; startSize: number; center: Point | null }>({
    active: false,
    startX: 0,
    startSize: 0,
    center: null,
  });
  const [cursor, setCursor] = useState<Point | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [swirlPreview, setSwirlPreview] = useState<SwirlDrag | null>(null);

  useEffect(() => {
    if (!active || isGradientAnchorDragging || !manualDistort.enabled || !manualDistort.showOverlay || !cursor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.repeat || isEditableTarget(e.target)) return;
      e.preventDefault();
      resizeRef.current = {
        active: true,
        startX: cursor.x,
        startSize: manualDistort.brushSize,
        center: cursor,
      };
      dragRef.current = null;
      setIsResizing(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f') return;
      resizeRef.current.active = false;
      resizeRef.current.center = null;
      setIsResizing(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [active, cursor, isGradientAnchorDragging, manualDistort.brushSize, manualDistort.enabled, manualDistort.showOverlay]);

  useEffect(() => {
    if (!active || isGradientAnchorDragging) {
      dragRef.current = null;
      resizeRef.current.active = false;
      resizeRef.current.center = null;
      swirlRef.current = null;
      setCursor(null);
      setIsResizing(false);
      setSwirlPreview(null);
    }
  }, [active, isGradientAnchorDragging]);

  if (!active || isGradientAnchorDragging || !manualDistort.enabled) return null;

  const localPoint = (e: React.PointerEvent<HTMLDivElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
    const ny = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0;
    return {
      x: nx * width,
      y: ny * height,
    };
  };

  const spikyBrushState = (strokeDistance: number): { radius: number; intensity: number } => {
    const base = Math.max(manualDistort.brushSize, 1);
    const taper = Math.min(1, strokeDistance / Math.max(base * 2.2, 1));
    return {
      radius: Math.max(8, base * (1 - taper * 0.88)),
      intensity: 1 - taper,
    };
  };

  const applyBrush = (point: Point, delta: Point, brushRadius = manualDistort.brushSize, falloffScale = 1, intensity = 1) => {
    const resolution = manualDistort.mapResolution;
    const source = manualDistort.displacement;
    const next = [...source];
    const canvasX = (point.x / Math.max(width, 1)) * canvasW;
    const canvasY = (point.y / Math.max(height, 1)) * canvasH;
    const radius = Math.max(brushRadius, 1);
    const radius2 = radius * radius;
    const cellW = canvasW / resolution;
    const cellH = canvasH / resolution;
    const minX = Math.max(0, Math.floor((canvasX - radius) / cellW));
    const maxX = Math.min(resolution - 1, Math.ceil((canvasX + radius) / cellW));
    const minY = Math.max(0, Math.floor((canvasY - radius) / cellH));
    const maxY = Math.min(resolution - 1, Math.ceil((canvasY + radius) / cellH));
    const dxCanvas = (delta.x / Math.max(width, 1)) * canvasW * manualDistort.strength;
    const dyCanvas = (delta.y / Math.max(height, 1)) * canvasH * manualDistort.strength;
    const dxUv = -dxCanvas / Math.max(canvasW, 1);
    const dyUv = dyCanvas / Math.max(canvasH, 1);
    const maxDisplacement = Math.max(manualDistort.maxDisplacement, 0.0001);
    const addX = dxUv / maxDisplacement;
    const addY = dyUv / maxDisplacement;

    for (let y = minY; y <= maxY; y++) {
      const cy = (y + 0.5) * cellH;
      for (let x = minX; x <= maxX; x++) {
        const cx = (x + 0.5) * cellW;
        const dist2 = (cx - canvasX) * (cx - canvasX) + (cy - canvasY) * (cy - canvasY);
        if (dist2 > radius2) continue;
        const dist = Math.sqrt(dist2) / radius;
        const smooth = 1 - dist * dist * (3 - 2 * dist);
        const weight = Math.pow(Math.max(0, smooth), manualDistort.falloff * falloffScale) * intensity;
        const cellIdx = y * resolution + x;
        const idx = cellIdx * 2;
        const [prevX, prevY] = sampleDisplacement(
          source,
          resolution,
          x - (dxCanvas * weight) / Math.max(cellW, 0.0001),
          y - (dyCanvas * weight) / Math.max(cellH, 0.0001),
        );
        next[idx] = addSoftLimited(prevX, addX * weight);
        next[idx + 1] = addSoftLimited(prevY, addY * weight);
      }
    }

    setManualDistort({ displacement: next });
  };

  const applySwirl = (swirl: SwirlDrag) => {
    const resolution = manualDistort.mapResolution;
    const next = [...swirl.snapshot];
    const centerX = (swirl.center.x / Math.max(width, 1)) * canvasW;
    const centerY = (swirl.center.y / Math.max(height, 1)) * canvasH;
    const radiusScale = Math.max(canvasW / Math.max(width, 1), canvasH / Math.max(height, 1));
    const radius = Math.max(swirl.radius * radiusScale, 1);
    const radius2 = radius * radius;
    const cellW = canvasW / resolution;
    const cellH = canvasH / resolution;
    const minX = Math.max(0, Math.floor((centerX - radius) / cellW));
    const maxX = Math.min(resolution - 1, Math.ceil((centerX + radius) / cellW));
    const minY = Math.max(0, Math.floor((centerY - radius) / cellH));
    const maxY = Math.min(resolution - 1, Math.ceil((centerY + radius) / cellH));
    const maxDisplacement = Math.max(manualDistort.maxDisplacement, 0.0001);

    for (let y = minY; y <= maxY; y++) {
      const cy = (y + 0.5) * cellH;
      for (let x = minX; x <= maxX; x++) {
        const cx = (x + 0.5) * cellW;
        const dx = cx - centerX;
        const dy = cy - centerY;
        const dist2 = dx * dx + dy * dy;
        if (dist2 > radius2) continue;
        const dist = Math.sqrt(dist2) / radius;
        const smooth = 1 - dist * dist * (3 - 2 * dist);
        const weight = Math.pow(Math.max(0, smooth), manualDistort.falloff);
        const angle = swirl.totalAngle * manualDistort.strength * weight;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const rx = centerX + dx * cosA - dy * sinA;
        const ry = centerY + dx * sinA + dy * cosA;
        const idx = (y * resolution + x) * 2;
        next[idx] = clampSigned((swirl.snapshot[idx] ?? 0) - ((rx - cx) / Math.max(canvasW, 1)) / maxDisplacement);
        next[idx + 1] = clampSigned((swirl.snapshot[idx + 1] ?? 0) + ((ry - cy) / Math.max(canvasH, 1)) / maxDisplacement);
      }
    }

    setManualDistort({ displacement: next });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const point = localPoint(e);
    if (resizeRef.current.active) {
      setCursor(point);
      return;
    }
    if (manualDistort.mode === 'swirl') {
      const startAngle = 0;
      const swirl: SwirlDrag = {
        pointerId: e.pointerId,
        center: point,
        startAngle,
        lastAngle: startAngle,
        totalAngle: 0,
        radius: 0,
        snapshot: [...manualDistort.displacement],
        current: point,
        initialized: false,
      };
      swirlRef.current = swirl;
      setSwirlPreview(swirl);
      setCursor(point);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    dragRef.current = { pointerId: e.pointerId, previous: point, strokeDistance: 0 };
    setCursor(point);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const point = localPoint(e);
    setCursor(point);
    if (resizeRef.current.active) {
      e.preventDefault();
      e.stopPropagation();
      const nextSize = Math.max(8, Math.min(640, resizeRef.current.startSize + (point.x - resizeRef.current.startX) * 2));
      setManualDistort({ brushSize: Math.round(nextSize) });
      return;
    }
    const swirl = swirlRef.current;
    if (swirl && swirl.pointerId === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      const dx = point.x - swirl.center.x;
      const dy = point.y - swirl.center.y;
      const radius = Math.hypot(dx, dy);
      const angle = radius > 2 ? Math.atan2(dy, dx) : swirl.lastAngle;
      if (!swirl.initialized) {
        const nextSwirl = {
          ...swirl,
          current: point,
          radius,
          startAngle: angle,
          lastAngle: angle,
          initialized: true,
        };
        swirlRef.current = nextSwirl;
        setSwirlPreview(nextSwirl);
        return;
      }
      let deltaAngle = angle - swirl.lastAngle;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
      const totalAngle = clampSwirlAngle(swirl.totalAngle + deltaAngle);
      const nextSwirl = {
        ...swirl,
        current: point,
        radius,
        lastAngle: angle,
        totalAngle,
      };
      swirlRef.current = nextSwirl;
      setSwirlPreview(nextSwirl);
      applySwirl(nextSwirl);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = { x: point.x - drag.previous.x, y: point.y - drag.previous.y };
    if (Math.abs(delta.x) > 0.01 || Math.abs(delta.y) > 0.01) {
      drag.strokeDistance += Math.hypot(
        (delta.x / Math.max(width, 1)) * canvasW,
        (delta.y / Math.max(height, 1)) * canvasH,
      );
      const spikyState = manualDistort.mode === 'spiky'
        ? spikyBrushState(drag.strokeDistance)
        : null;
      applyBrush(
        point,
        delta,
        spikyState?.radius ?? manualDistort.brushSize,
        manualDistort.mode === 'spiky' ? 1.75 : 1,
        spikyState?.intensity ?? 1,
      );
      drag.previous = point;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swirlRef.current?.pointerId === e.pointerId) {
      swirlRef.current = null;
      setSwirlPreview(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const displayBrushSize = manualDistort.mode === 'spiky' && dragRef.current
    ? spikyBrushState(dragRef.current.strokeDistance).radius
    : manualDistort.brushSize;
  const brushW = (displayBrushSize / Math.max(canvasW, 1)) * width * 2;
  const brushH = (displayBrushSize / Math.max(canvasH, 1)) * height * 2;
  const displayCursor = isResizing && resizeRef.current.center ? resizeRef.current.center : cursor;
  const halfInfluence = (() => {
    const displayFalloff = manualDistort.mode === 'spiky'
      ? manualDistort.falloff * 1.75
      : manualDistort.falloff;
    const targetSmooth = Math.pow(0.5, 1 / Math.max(displayFalloff, 0.001));
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) * 0.5;
      const smooth = 1 - mid * mid * (3 - 2 * mid);
      if (smooth > targetSmooth) lo = mid;
      else hi = mid;
    }
    return (lo + hi) * 0.5;
  })();
  const coreW = brushW * halfInfluence;
  const coreH = brushH * halfInfluence;

  return (
    <div
      className="absolute inset-0 z-20 touch-none"
      style={{ cursor: isResizing ? 'ew-resize' : manualDistort.mode === 'swirl' ? 'cell' : 'crosshair' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        if (!resizeRef.current.active && !dragRef.current && !swirlRef.current) setCursor(null);
      }}
    >
      {manualDistort.showOverlay && displayCursor && !swirlPreview && (
        <>
          <div
            className={`pointer-events-none absolute rounded-full border shadow-[0_0_18px_rgba(209,20,2,0.22)] ${
              isResizing
                ? 'border-cream bg-cream/10'
                : manualDistort.mode === 'swirl'
                  ? 'border-fuchsia-300/90 bg-fuchsia-300/10'
                  : manualDistort.mode === 'spiky'
                    ? 'border-amber-200/90 bg-fire/10'
                    : 'border-fire/90 bg-fire/10'
            }`}
            style={{
              width: brushW,
              height: brushH,
              left: displayCursor.x,
              top: displayCursor.y,
              transform: 'translate(-50%, -50%)',
              backgroundImage: manualDistort.mode === 'swirl'
                ? 'radial-gradient(circle, rgba(240,234,217,0.18) 0%, rgba(217,70,239,0.16) 28%, rgba(217,70,239,0.06) 58%, rgba(217,70,239,0) 72%)'
                : manualDistort.mode === 'spiky'
                  ? 'radial-gradient(circle, rgba(240,234,217,0.28) 0%, rgba(251,191,36,0.15) 18%, rgba(209,20,2,0.06) 48%, rgba(209,20,2,0) 68%)'
                  : 'radial-gradient(circle, rgba(240,234,217,0.20) 0%, rgba(209,20,2,0.13) 28%, rgba(209,20,2,0.05) 58%, rgba(209,20,2,0) 72%)',
            }}
          />
          <div
            className="pointer-events-none absolute rounded-full border border-cream/70 border-dashed"
            style={{
              width: coreW,
              height: coreH,
              left: displayCursor.x,
              top: displayCursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-cream shadow-[0_0_8px_rgba(240,234,217,0.65)]"
            style={{
              left: displayCursor.x,
              top: displayCursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </>
      )}
      {manualDistort.showOverlay && swirlPreview && (
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={height}>
          <defs>
            <marker id="swirl-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(240,234,217,0.95)" />
            </marker>
          </defs>
          <circle
            cx={swirlPreview.center.x}
            cy={swirlPreview.center.y}
            r={Math.max(swirlPreview.radius, 1)}
            fill="rgba(217,70,239,0.05)"
            stroke="rgba(217,70,239,0.85)"
            strokeWidth="1.5"
            strokeDasharray="7 4"
          />
          <line
            x1={swirlPreview.center.x}
            y1={swirlPreview.center.y}
            x2={swirlPreview.current.x}
            y2={swirlPreview.current.y}
            stroke="rgba(240,234,217,0.8)"
            strokeWidth="1.25"
          />
          <path
            d={(() => {
              const r = Math.max(Math.min(swirlPreview.radius * 0.58, 72), 18);
              return buildSwirlArcPath(swirlPreview.center, r, swirlPreview.startAngle, swirlPreview.totalAngle);
            })()}
            fill="none"
            stroke="rgba(240,234,217,0.95)"
            strokeWidth="2"
            markerEnd="url(#swirl-arrow)"
          />
          <circle cx={swirlPreview.center.x} cy={swirlPreview.center.y} r="4" fill="rgba(240,234,217,0.95)" />
          <text
            x={swirlPreview.center.x + 10}
            y={swirlPreview.center.y - 10}
            fill="rgba(240,234,217,0.95)"
            fontSize="11"
            fontWeight="700"
          >
            {`${Math.round((swirlPreview.totalAngle * 180) / Math.PI)}deg / r${Math.round(swirlPreview.radius)}px`}
          </text>
        </svg>
      )}
    </div>
  );
}
