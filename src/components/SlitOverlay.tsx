import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useGradientStore } from '../store/gradientStore';

interface Props {
  width: number;
  height: number;
  canvasW: number;
  canvasH: number;
}

// ─── multi-delta helpers ──────────────────────────────────────────────────────

function getSortedDeltas(slitDeltas: Record<number, number>): Array<[number, number]> {
  return Object.entries(slitDeltas)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0] - b[0]);
}

function getBoundaryWarpedCoord(boundIdx: number, sw: number, sortedDeltas: Array<[number, number]>): number {
  let cumDelta = 0;
  for (const [sIdx, delta] of sortedDeltas) {
    if (sIdx >= boundIdx) break;
    cumDelta += delta;
  }
  return boundIdx * sw + cumDelta;
}

function getSlitIdxFromWarped(warpedCoord: number, sw: number, sortedDeltas: Array<[number, number]>): number {
  let cumDelta = 0;
  for (const [sIdx, delta] of sortedDeltas) {
    const leftBound = sIdx * sw + cumDelta;
    const rightBound = leftBound + sw + delta;
    if (warpedCoord < leftBound) return Math.floor((warpedCoord - cumDelta) / sw);
    if (warpedCoord < rightBound) return sIdx;
    cumDelta += delta;
  }
  return Math.floor((warpedCoord - cumDelta) / sw);
}

function getWarpedCoord(rawCoord: number, sw: number, seed: number, variance: number): number {
  return rawCoord + Math.sin(rawCoord / (sw * 4.0) * 6.2832 + seed * 37.4) * variance * sw;
}

function regularPolygonCoord(dx: number, dy: number, sides: number, angleRad: number): number {
  const safeSides = Math.max(3, Math.min(32, Math.round(sides)));
  const sector = (Math.PI * 2) / safeSides;
  const localAngle = Math.abs(((Math.atan2(dy, dx) + angleRad + sector * 0.5) % sector + sector) % sector - sector * 0.5);
  return Math.sqrt(dx * dx + dy * dy) * Math.cos(localAngle) / Math.max(Math.cos(Math.PI / safeSides), 0.001);
}

function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  angleRad: number,
) {
  const safeSides = Math.max(3, Math.min(32, Math.round(sides)));
  ctx.beginPath();
  for (let i = 0; i < safeSides; i++) {
    const a = -angleRad + (i / safeSides) * Math.PI * 2;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function invertWarpedCoord(targetWarped: number, sw: number, seed: number, variance: number): number {
  let x = targetWarped;
  for (let i = 0; i < 12; i++) {
    const fx = getWarpedCoord(x, sw, seed, variance) - targetWarped;
    const dfx = 1 + Math.cos(x / (sw * 4.0) * 6.2832 + seed * 37.4) * variance * 6.2832 / (sw * 4.0);
    if (Math.abs(dfx) < 1e-8) break;
    x -= fx / dfx;
  }
  return x;
}

function drawSlitHandle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cosA: number, sinA: number,
  isActive: boolean,
  canvasW: number, canvasH: number,
) {
  if (x < -24 || x > canvasW + 24 || y < -24 || y > canvasH + 24) return;
  const len = 11, headLen = 5;
  const color = isActive ? 'rgba(99,179,237,0.95)' : 'rgba(255,255,255,0.72)';
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 5;
  for (const sign of [-1, 1]) {
    const tipX = x + sign * cosA * len, tipY = y + sign * sinA * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - sign * cosA * headLen - sinA * (headLen * 0.5), tipY - sign * sinA * headLen + cosA * (headLen * 0.5));
    ctx.lineTo(tipX - sign * cosA * headLen + sinA * (headLen * 0.5), tipY - sign * sinA * headLen - cosA * (headLen * 0.5));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

const EDGE_HIT_PX = 8;
type HitResult = { type: 'boundary'; idx: number } | { type: 'slit'; idx: number } | null;
type DragState = { type: 'move' | 'slit'; hitIdx: number; startClientX: number; startClientY: number; startPhase: number; startWidth: number; startDelta: number; startDeltaNext: number; startSlitDeltas: Record<number, number>; };

export function SlitOverlay({ width, height, canvasW, canvasH }: Props) {
  const { slitScan, setSlitScan, setIsSlitAdjusting, slitOverlayEnabled } = useGradientStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const hoverHitRef = useRef<HitResult>(null);
  const drawCanvasRef = useRef<(() => void) | undefined>(undefined);
  const [hoverType, setHoverType] = useState<'boundary' | 'slit' | null>(null);
  const [altPressed, setAltPressed] = useState(false);
  const [focusedBoundary, setFocusedBoundary] = useState<number | null>(null);
  const [showSlitLabels, setShowSlitLabels] = useState(false);
  const [dragType, setDragType] = useState<DragState['type'] | null>(null);
  const syncAltPressed = useCallback((next: boolean) => {
    setAltPressed((prev) => {
      if (prev === next) return prev;
      requestAnimationFrame(() => drawCanvasRef.current?.());
      return next;
    });
  }, []);

  // ラベル情報の計算（Alt押下時：キャンバス外上部表示 / showSlitLabels時：キャンバス内表示）
  const slitInfos = useMemo(() => {
    if ((!altPressed && !showSlitLabels) || !slitScan.enabled || !slitOverlayEnabled || slitScan.mode !== 'linear') return [];
    const { angle, seed, variance, pixelPerfect, slitWidth, slitPhase } = slitScan;
    const sortedDeltas = getSortedDeltas(slitScan.slitDeltas ?? {});
    const sw = Math.max(pixelPerfect ? Math.round(slitWidth) : slitWidth, 1);
    const sc = canvasW / width;
    const angleRad = (angle * Math.PI) / 180;
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const centerProjS = (canvasW / 2) * cosA + (canvasH / 2) * sinA;
    const halfProjRange = (Math.abs(cosA) * canvasW + Math.abs(sinA) * canvasH) / 2;
    const firstBound = Math.floor(getWarpedCoord(-halfProjRange + slitPhase, sw, seed, variance) / sw) - 1;
    const lastBound = Math.ceil(getWarpedCoord(halfProjRange + slitPhase, sw, seed, variance) / sw) + 2;
    const tH = -(width / 2) * sinA + (height / 2) * cosA;

    const infos = [];
    for (let i = firstBound; i < lastBound; i++) {
      const lR = invertWarpedCoord(getBoundaryWarpedCoord(i, sw, sortedDeltas), sw, seed, variance) - slitPhase + centerProjS;
      const rR = invertWarpedCoord(getBoundaryWarpedCoord(i + 1, sw, sortedDeltas), sw, seed, variance) - slitPhase + centerProjS;
      const nP = ((lR + rR) / 2) / sc;
      const hx = nP * cosA - tH * sinA;
      const hy = height - (nP * sinA + tH * cosA);
      if (hx > -40 && hx < width + 40) {
        infos.push({
          idx: i,
          width: (rR - lR) / sc,  // 実際の表示幅（ワープ・デルタ反映済み、display px）
          x: hx,
          y: hy,
        });
      }
    }
    return infos;
  }, [altPressed, showSlitLabels, slitScan, width, height, canvasW, canvasH, slitOverlayEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || e.getModifierState('Alt')) {
        if (slitScan.enabled && slitOverlayEnabled) e.preventDefault();
        syncAltPressed(true);
      }
      if (focusedBoundary !== null && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowLeft' ? -1 : 1);
        const state = useGradientStore.getState().slitScan;
        const shaderDelta = step;
        const slitIdx = focusedBoundary - 1;
        const sw = Math.max(state.slitWidth, 1);
        const deltas = { ...(state.slitDeltas ?? {}) };
        
        const currentD1 = deltas[slitIdx] ?? 0;
        const currentD2 = deltas[slitIdx + 1] ?? 0;
        const minChange = -(sw - 1) - currentD1;
        const maxChange = (sw - 1) + currentD2;
        const clampedChange = Math.max(minChange, Math.min(maxChange, shaderDelta));
        
        const d1 = currentD1 + clampedChange;
        const d2 = currentD2 - clampedChange;
        if (Math.abs(d1) < 0.001) delete deltas[slitIdx]; else deltas[slitIdx] = d1;
        if (Math.abs(d2) < 0.001) delete deltas[slitIdx + 1]; else deltas[slitIdx + 1] = d2;
        setSlitScan({ slitDeltas: deltas });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' || !e.getModifierState('Alt')) {
        if (slitScan.enabled && slitOverlayEnabled) e.preventDefault();
        syncAltPressed(false);
      }
    };
    const clearAlt = () => syncAltPressed(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearAlt);
    document.addEventListener('visibilitychange', clearAlt);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearAlt);
      document.removeEventListener('visibilitychange', clearAlt);
    };
  }, [focusedBoundary, slitScan.enabled, slitScan.slitWidth, canvasW, width, setSlitScan, slitOverlayEnabled, syncAltPressed]);

  const getCanvasPx = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect(); return { x: (cx - rect.left) * (width / rect.width), y: (cy - rect.top) * (height / rect.height) };
  }, [width, height]);

  drawCanvasRef.current = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!slitScan.enabled || !slitOverlayEnabled) return;
    const { mode, angle, seed, variance, pixelPerfect } = slitScan;
    const slitWidth = pixelPerfect ? Math.round(slitScan.slitWidth) : slitScan.slitWidth;
    const slitPhase = pixelPerfect ? Math.round(slitScan.slitPhase) : slitScan.slitPhase;
    
    const selIdx = slitScan.selectedSlitIdx ?? -1;
    const sortedDeltas = getSortedDeltas(slitScan.slitDeltas ?? {});
    const sw = Math.max(slitWidth, 1);
    const angleRad = (angle * Math.PI) / 180;
    const cosA = Math.cos(angleRad), sinA = Math.sin(angleRad);
    const sc = canvasW / width;
    const centerProjS = (canvasW / 2) * cosA + (canvasH / 2) * sinA;
    const diagLen = Math.sqrt(width * width + height * height);
    const lx = sinA * diagLen, ly = cosA * diagLen;
    const projToC = (proj: number) => (proj - canvasH * sinA) / sc;
    const hoverHit = hoverHitRef.current;

    ctx.save();
    if (mode === 'linear') {
      const halfProjRange = (Math.abs(cosA) * canvasW + Math.abs(sinA) * canvasH) / 2;
      const firstBound = Math.floor(getWarpedCoord(-halfProjRange + slitPhase, sw, seed, variance) / sw) - 1;
      const lastBound = Math.ceil(getWarpedCoord(halfProjRange + slitPhase, sw, seed, variance) / sw) + 2;

      for (let i = firstBound; i <= lastBound; i++) {
        const boundWarp = getBoundaryWarpedCoord(i, sw, sortedDeltas);
        const rawS = invertWarpedCoord(boundWarp, sw, seed, variance);
        const proj = rawS - slitPhase + centerProjS;
        const C = projToC(proj), bx = C * cosA, by = -C * sinA;
        const isHoverB = hoverHit?.type === 'boundary' && hoverHit.idx === i;
        const isFocusB = focusedBoundary === i;
        const isAltH = altPressed && hoverHit?.type === 'slit' && (i === hoverHit.idx || i === hoverHit.idx + 1);

        ctx.beginPath(); ctx.moveTo(bx - lx, by - ly); ctx.lineTo(bx + lx, by + ly);
        ctx.strokeStyle = (isHoverB || isFocusB || isAltH) ? '#63b3ed' : (i-1 >= 0 && (slitScan.slitDeltas?.[i-1] ?? 0) !== 0) ? '#fbbf24' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = (isHoverB || isFocusB || isAltH) ? 1 : 0.8;
        ctx.shadowBlur = 0;
        ctx.stroke();

        for (const t of [0.25, 0.75]) {
          const hx = bx + (lx * 2 * t - lx), hy = by + (ly * 2 * t - ly);
          if (hx < -10 || hx > width + 10 || hy < -10 || hy > height + 10) continue;
          ctx.beginPath(); ctx.arc(hx, hy, (isHoverB || isFocusB) ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = (isHoverB || isFocusB) ? '#63b3ed' : 'rgba(255,255,255,0.5)'; ctx.fill();
        }
      }
      const tH = -(width / 2) * sinA + (height / 2) * cosA;
      const drawIdx = (idx: number, active: boolean) => {
        const lR = invertWarpedCoord(getBoundaryWarpedCoord(idx, sw, sortedDeltas), sw, seed, variance) - slitPhase + centerProjS;
        const rR = invertWarpedCoord(getBoundaryWarpedCoord(idx+1, sw, sortedDeltas), sw, seed, variance) - slitPhase + centerProjS;
        const nP = ((lR + rR) / 2) / sc, hx = nP * cosA - tH * sinA, hy = height - (nP * sinA + tH * cosA);
        drawSlitHandle(ctx, hx, hy, cosA, -sinA, active, width, height);
      };
      if (selIdx >= 0) drawIdx(selIdx, true);
      if (hoverHit?.type === 'slit' && hoverHit.idx !== selIdx) drawIdx(hoverHit.idx, false);
    } else {
      const cx = width / 2, cy = height / 2, maxRS = Math.sqrt((canvasW/2)**2 + (canvasH/2)**2) + sw;
      let i = 0;
      while (true) {
        const rS = i * sw - slitPhase; if (rS > maxRS) break;
        if (rS > 0) {
          const isHB = hoverHit?.type === 'boundary' && hoverHit.idx === i;
          if (mode === 'polygon') drawRegularPolygon(ctx, cx, cy, rS / sc, slitScan.polygonSides ?? 6, angleRad);
          else { ctx.beginPath(); ctx.arc(cx, cy, rS / sc, 0, Math.PI * 2); }
          ctx.strokeStyle = isHB ? '#63b3ed' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = isHB ? 1 : 0.8; ctx.shadowBlur = 0; ctx.stroke();
        }
        i++;
      }
    }
    ctx.restore();
  };

  useEffect(() => { drawCanvasRef.current?.(); }, [slitScan, width, height, slitOverlayEnabled, altPressed, focusedBoundary]);
  useEffect(() => { const c = canvasRef.current; if (!c) return; const h = () => drawCanvasRef.current?.(); c.addEventListener('_repaint', h); return () => c.removeEventListener('_repaint', h); }, []);

  const hitTest = useCallback((clientX: number, clientY: number): HitResult => {
    const p = getCanvasPx(clientX, clientY), { mode, angle, seed, variance, pixelPerfect } = slitScan, sortedDeltas = getSortedDeltas(slitScan.slitDeltas ?? {}), sc = canvasW / width, hitT = EDGE_HIT_PX * sc;
    const slitWidth = pixelPerfect ? Math.round(slitScan.slitWidth) : slitScan.slitWidth;
    const slitPhase = pixelPerfect ? Math.round(slitScan.slitPhase) : slitScan.slitPhase;
    const sw = Math.max(slitWidth, 1);

    if (mode === 'linear') {
      const aR = (angle * Math.PI) / 180, cA = Math.cos(aR), sA = Math.sin(aR), cPS = (canvasW/2)*cA + (canvasH/2)*sA, rP = p.x*sc*cA + (height-p.y)*sc*sA, sC = rP - cPS + slitPhase, wP = getWarpedCoord(sC, sw, seed, variance);
      const nN = Math.round(wP / sw);
      for (const bi of [nN-2, nN-1, nN, nN+1, nN+2]) {
        const rB = invertWarpedCoord(getBoundaryWarpedCoord(bi, sw, sortedDeltas), sw, seed, variance) - slitPhase + cPS;
        if (Math.abs(rP - rB) < hitT) return { type: 'boundary', idx: bi };
      }
      return { type: 'slit', idx: getSlitIdxFromWarped(wP, sw, sortedDeltas) };
    } else {
      const dx = p.x*sc - canvasW/2;
      const dy = (height-p.y)*sc - canvasH/2;
      const aR = (angle * Math.PI) / 180;
      const rS = mode === 'polygon'
        ? regularPolygonCoord(dx, dy, slitScan.polygonSides ?? 6, aR)
        : Math.sqrt(dx**2 + dy**2);
      const nI = Math.round((rS + slitPhase) / sw), bR = nI * sw - slitPhase;
      if (Math.abs(rS - bR) < hitT) return { type: 'boundary', idx: nI };
      return { type: 'slit', idx: Math.floor((rS + slitPhase) / sw) };
    }
  }, [slitScan, getCanvasPx, width, height, canvasW, canvasH]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    syncAltPressed(e.altKey);
    const drag = dragRef.current;
    if (!drag) {
      const hit = hitTest(e.clientX, e.clientY), prev = hoverHitRef.current;
      if (hit?.type !== prev?.type || hit?.idx !== prev?.idx) { hoverHitRef.current = hit; setHoverType(hit?.type ?? null); const c = canvasRef.current; if (c) c.dispatchEvent(new Event('_repaint')); }
      return;
    }
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), dx = (e.clientX - drag.startClientX)*(width/r.width), dy = (e.clientY - drag.startClientY)*(height/r.height), sc = canvasW/width;
    const pixelPerfect = slitScan.pixelPerfect;

    if (drag.type === 'move') {
      const aR = (slitScan.angle*Math.PI)/180;
      const cosA = Math.cos(aR), sinA = Math.sin(aR);
      const d = slitScan.mode === 'linear' ? (dx*cosA - dy*sinA)*sc : Math.sqrt(dx*dx+dy*dy)*(dy>0?-1:1)*sc;
      let nextPhase = drag.startPhase + d;
      if (pixelPerfect) nextPhase = Math.round(nextPhase);
      if (slitScan.mode === 'linear') {
        const { seed, variance } = slitScan;
        const sw = Math.max(pixelPerfect ? Math.round(slitScan.slitWidth) : slitScan.slitWidth, 1);
        const sortedDeltas = getSortedDeltas(slitScan.slitDeltas ?? {});
        const halfProjRange = (Math.abs(cosA) * canvasW + Math.abs(sinA) * canvasH) / 2;
        // 左端に常時スナップ：スリット境界が必ずキャンバス左端に揃う
        const targetRaw = nextPhase - halfProjRange;
        const nearestIdx = Math.round(getWarpedCoord(targetRaw, sw, seed, variance) / sw);
        const rawI = invertWarpedCoord(getBoundaryWarpedCoord(nearestIdx, sw, sortedDeltas), sw, seed, variance);
        nextPhase = rawI + halfProjRange;
        if (pixelPerfect) nextPhase = Math.round(nextPhase);
      }
      setSlitScan({ slitPhase: nextPhase });
    } else {
      const aR = (slitScan.angle*Math.PI)/180;
      const cosA = Math.cos(aR), sinA = Math.sin(aR);
      const pD = slitScan.mode === 'linear' ? (dx*cosA - dy*sinA)*sc : Math.sqrt(dx*dx+dy*dy)*(dy>0?1:-1)*sc;
      const sw = Math.max(pixelPerfect ? Math.round(slitScan.slitWidth) : slitScan.slitWidth, 1);
      let minD = -(sw-1) - drag.startDelta, maxD = drag.startDeltaNext + (sw-1);
      if (slitScan.mode === 'linear') {
        // キャンバス端を越えないよう境界位置をクランプ
        const halfProjRange = (Math.abs(cosA) * canvasW + Math.abs(sinA) * canvasH) / 2;
        const { seed, variance } = slitScan;
        const startSortedDeltas = getSortedDeltas(drag.startSlitDeltas);
        const startBoundWarp = getBoundaryWarpedCoord(drag.hitIdx + 1, sw, startSortedDeltas);
        const startBoundRaw = invertWarpedCoord(startBoundWarp, sw, seed, variance);
        const startProjRel = startBoundRaw - slitScan.slitPhase;
        minD = Math.max(minD, -halfProjRange - startProjRel);
        maxD = Math.min(maxD, halfProjRange - startProjRel);
      }
      const cRD = Math.max(minD, Math.min(maxD, pD));
      const deltas = { ...(slitScan.slitDeltas ?? {}) };
      let d1 = drag.startDelta + cRD, d2 = drag.startDeltaNext - cRD;
      if (pixelPerfect) { d1 = Math.round(d1); d2 = Math.round(d2); }
      if (Math.abs(d1) < 0.001) delete deltas[drag.hitIdx]; else deltas[drag.hitIdx] = d1;
      if (Math.abs(d2) < 0.001) delete deltas[drag.hitIdx+1]; else deltas[drag.hitIdx+1] = d2;
      setSlitScan({ selectedSlitIdx: drag.hitIdx, slitDeltas: deltas });
    }
  }, [slitScan, setSlitScan, hitTest, width, height, canvasW, canvasH, syncAltPressed]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!slitScan.enabled || !slitOverlayEnabled || e.button !== 0) return;
    const hit = hitTest(e.clientX, e.clientY);
    let dT: DragState['type'] = 'move', hI = 0, sD = 0, sDN = 0;
    if (hit?.type === 'boundary') { dT = 'slit'; hI = hit.idx - 1; sD = slitScan.slitDeltas?.[hI] ?? 0; sDN = slitScan.slitDeltas?.[hit.idx] ?? 0; setFocusedBoundary(hit.idx); }
    else if (hit?.type === 'slit') { dT = 'move'; setFocusedBoundary(null); }
    else setFocusedBoundary(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLCanvasElement).focus();
    setIsSlitAdjusting(true);

    // pixelPerfect 時はドラッグ開始基準値も整数に揃え、1px 単位のスナップを保証する
    const pp = slitScan.pixelPerfect;
    const ppR = (v: number) => pp ? Math.round(v) : v;
    dragRef.current = { type: dT, hitIdx: hI, startClientX: e.clientX, startClientY: e.clientY, startPhase: ppR(slitScan.slitPhase), startWidth: slitScan.slitWidth, startDelta: ppR(sD), startDeltaNext: ppR(sDN), startSlitDeltas: slitScan.slitDeltas ?? {} };
    setDragType(dT);
  }, [slitScan, hitTest, setIsSlitAdjusting, slitOverlayEnabled]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => { dragRef.current = null; setDragType(null); setIsSlitAdjusting(false); e.currentTarget?.releasePointerCapture?.(e.pointerId); }, [setIsSlitAdjusting]);
  const handlePointerLeave = useCallback((e: React.PointerEvent) => { if (!dragRef.current) { hoverHitRef.current = null; setHoverType(null); const c = canvasRef.current; if (c) c.dispatchEvent(new Event('_repaint')); } else { dragRef.current = null; setDragType(null); setIsSlitAdjusting(false); e.currentTarget?.releasePointerCapture?.(e.pointerId); } }, [setIsSlitAdjusting]);

  const isActive = slitScan.enabled && slitOverlayEnabled;
  let cur = isActive ? 'grab' : 'default';
  if (dragType) cur = dragType === 'move' ? 'grabbing' : 'ew-resize';
  else if (hoverType !== null) cur = 'ew-resize';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Alt押下時ラベル: キャンバス上部に表示 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: (altPressed && slitInfos.length > 0) ? 'block' : 'none' }}>
        {slitInfos.map((info) => (
          <div
            key={info.idx}
            style={{
              position: 'absolute',
              left: info.x,
              top: 0,
              transform: 'translate(-50%, -100%)',
              marginTop: '-6px',
              padding: '2px 4px',
              backgroundColor: info.idx === slitScan.selectedSlitIdx ? 'rgba(99,179,237,0.95)' : 'rgba(0,0,0,0.7)',
              borderRadius: '2px',
              color: '#fff',
              fontSize: '9px',
              fontFamily: 'monospace',
              fontWeight: info.idx === slitScan.selectedSlitIdx ? 'bold' : 'normal',
              border: info.idx === slitScan.selectedSlitIdx ? '1px solid #63b3ed' : '1px solid rgba(255,255,255,0.2)',
              zIndex: info.idx === slitScan.selectedSlitIdx ? 10 : 5,
              whiteSpace: 'nowrap',
            }}
          >
            {info.width.toFixed(slitScan.pixelPerfect ? 0 : 1)}
          </div>
        ))}
      </div>
      {/* 常時表示ラベル: キャンバス内スリット中央に表示 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6, display: (showSlitLabels && slitInfos.length > 0) ? 'block' : 'none' }}>
        {slitInfos.map((info) => {
          if (info.y < -20 || info.y > height + 20) return null;
          return (
            <div
              key={`w-${info.idx}`}
              style={{
                position: 'absolute',
                left: info.x,
                top: info.y,
                transform: 'translate(-50%, -50%)',
                padding: '1px 4px',
                backgroundColor: info.idx === slitScan.selectedSlitIdx ? 'rgba(99,179,237,0.9)' : 'rgba(0,0,0,0.58)',
                borderRadius: '2px',
                color: '#fff',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: info.idx === slitScan.selectedSlitIdx ? 'bold' : 'normal',
                border: info.idx === slitScan.selectedSlitIdx ? '1px solid #63b3ed' : '1px solid rgba(255,255,255,0.18)',
                whiteSpace: 'nowrap',
                lineHeight: '1.4',
              }}
            >
              {info.width.toFixed(slitScan.pixelPerfect ? 0 : 1)}
            </div>
          );
        })}
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        tabIndex={0}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: isActive ? 'auto' : 'none',
          outline: 'none',
          cursor: cur,
          zIndex: 5
        }}
      />
      {/* 常時幅表示トグルボタン */}
      {isActive && (
        <button
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            pointerEvents: 'auto',
            padding: '2px 6px',
            backgroundColor: showSlitLabels ? 'rgba(99,179,237,0.85)' : 'rgba(0,0,0,0.55)',
            border: `1px solid ${showSlitLabels ? '#63b3ed' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '3px',
            color: showSlitLabels ? '#fff' : 'rgba(255,255,255,0.65)',
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            zIndex: 15,
            letterSpacing: '0.05em',
            outline: 'none',
            userSelect: 'none',
          }}
          onClick={() => setShowSlitLabels(v => !v)}
          onPointerDown={e => e.stopPropagation()}
        >
          WIDTHS
        </button>
      )}
    </div>
  );
}
