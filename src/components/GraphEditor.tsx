import { useRef, useCallback, useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { useGradientStore } from '../store/gradientStore';
import { computeAutoHandles } from '../lib/autoBezier';
import { getTimelineTime, setTimelineTime } from '../lib/timelineClock';
import type { Keyframe, PropertyTrack } from '../types/keyframe';
import type { AnimationLoop } from '../lib/animation';

export const GRAPH_COLORS = [
  '#D11402', '#6075A4', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899',
  '#F97316', '#06B6D4', '#84CC16', '#EF4444',
];

const KF_HALF  = 5;
const HANDLE_R = 4;
const Y_GRID_N = 5;
const PAD_X    = 20;

function kfKey(trackId: string, kfId: string) { return `${trackId}::${kfId}`; }

function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  if (range < 1e-10) return [min];
  const step  = range / count;
  const mag   = Math.pow(10, Math.floor(Math.log10(Math.max(step, 1e-10))));
  const norm  = step / mag;
  const nice  = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  const ns    = nice * mag;
  const start = Math.ceil((min + 1e-10) / ns) * ns;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-10; v += ns) {
    ticks.push(parseFloat((Math.round(v / ns) * ns).toPrecision(8)));
  }
  return ticks;
}

function computeSymmetricH(v0: number, v1: number, localT: number, targetV: number): number {
  const denom = 3 * localT * (1 - localT);
  if (Math.abs(denom) < 1e-10) return (v0 + v1) / 2;
  return (targetV - v0 * Math.pow(1 - localT, 3) - v1 * Math.pow(localT, 3)) / denom;
}

interface Props {
  track: PropertyTrack;
  color: string;
  duration: number;
  animLoopRef: React.MutableRefObject<AnimationLoop | null>;
  selectedKeys: Set<string>;
  onSelectKeyframes: (keys: Set<string>) => void;
  onSeek?: () => void;
}

export function GraphEditor({
  track,
  color,
  duration,
  animLoopRef,
  selectedKeys,
  onSelectKeyframes,
  onSeek,
}: Props) {
  const { currentTime, setKeyframe, setKeyframeTracks, setCurrentTime } = useGradientStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 200 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState({ x: 1, y: 1 });
  const [graphTime, setGraphTime] = useState(currentTime);
  const [marquee, setMarquee] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (r) setDims({ w: r.width, h: r.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const nt = getTimelineTime(animLoopRef.current?.currentNormalizedTime ?? useGradientStore.getState().currentTime);
      setGraphTime(prev => Math.abs(prev - nt) > 0.0001 ? nt : prev);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [animLoopRef]);

  const W = dims.w;
  const H = dims.h;

  const { vMin, vMax } = useMemo(() => {
    let mn = 0, mx = 1;
    track.keyframes.forEach(kf => {
      mn = Math.min(mn, kf.value);
      mx = Math.max(mx, kf.value);
      if (kf.outHandle) { mn = Math.min(mn, kf.value + kf.outHandle[1]); mx = Math.max(mx, kf.value + kf.outHandle[1]); }
      if (kf.inHandle)  { mn = Math.min(mn, kf.value + kf.inHandle[1]);  mx = Math.max(mx, kf.value + kf.inHandle[1]); }
    });
    const margin = Math.max(0.04, (mx - mn) * 0.04);
    return { vMin: mn - margin, vMax: mx + margin };
  }, [track.keyframes]);

  // ─── 座標変換用パラメータ ───
  const innerW = Math.max(1, (W - PAD_X * 2) * zoom.x);
  const vRange = Math.max(1e-6, vMax - vMin);
  const vMid   = (vMin + vMax) / 2;

  // ─── 状態を Ref で同期 (ネイティブイベント用) ───
  const stateRef = useRef({ zoom, viewOffset, W, H, vMin, vMax });
  useLayoutEffect(() => {
    stateRef.current = { zoom, viewOffset, W, H, vMin, vMax };
  });

  // ─── ズームロジック (ネイティブイベント) ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const { zoom: curZoom, viewOffset: curOffset, W: curW, H: curH } = stateRef.current;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY > 0 ? 0.9 : 1.11;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      const nextZoom = {
        x: (isShift || isAlt || !isCtrl) ? Math.max(0.01, Math.min(100, curZoom.x * factor)) : curZoom.x,
        y: (isCtrl || (!isShift && !isAlt)) ? Math.max(0.01, Math.min(100, curZoom.y * factor)) : curZoom.y,
      };

      const W_base = Math.max(1, curW - PAD_X * 2);
      const H_base = Math.max(1, curH);

      // マウス位置のグラフ空間正規化座標 (t, rv)
      const t  = (mx - PAD_X - curOffset.x) / (W_base * curZoom.x);
      const rv = (H_base / 2 + curOffset.y - my) / (H_base * curZoom.y);

      const nextOffsetX = mx - PAD_X - t * W_base * nextZoom.x;
      const nextOffsetY = my - H_base / 2 + rv * H_base * nextZoom.y;

      setZoom(nextZoom);
      setViewOffset({ x: nextOffsetX, y: nextOffsetY });
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, []);

  const toX = useCallback((t: number)  => PAD_X + t * innerW + viewOffset.x, [innerW, viewOffset.x]);
  const toY = useCallback((v: number)  => H/2 - ((v - vMid) / vRange) * H * zoom.y + viewOffset.y, [H, vMid, vRange, zoom.y, viewOffset.y]);
  const frX = useCallback((px: number) => Math.max(0, Math.min(1, (px - PAD_X - viewOffset.x) / innerW)), [innerW, viewOffset.x]);
  const frY = useCallback((py: number) => vMid + (1/2 - (py - viewOffset.y) / Math.max(1, H)) * vRange / zoom.y, [H, vMid, vRange, viewOffset.y, zoom.y]);

  const buildPath = useCallback((kf0: Keyframe<number>, kf1: Keyframe<number>): string => {
    const x0 = toX(kf0.time), y0 = toY(kf0.value);
    const x3 = toX(kf1.time), y3 = toY(kf1.value);
    if (kf0.interpolation === 'hold') return `M ${x0} ${y0} L ${x3} ${y0} L ${x3} ${y3}`;
    if (kf0.interpolation === 'bezier') {
      if (kf0.outHandle && kf1.inHandle) {
        const x1 = toX(kf0.time + kf0.outHandle[0]), y1 = toY(kf0.value + kf0.outHandle[1]);
        const x2 = toX(kf1.time + kf1.inHandle[0]),  y2 = toY(kf1.value + kf1.inHandle[1]);
        return `M ${x0} ${y0} C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`;
      } else if (kf0.cp1 && kf0.cp2) {
        const dt = kf1.time - kf0.time, dv = kf1.value - kf0.value;
        const x1 = toX(kf0.time + dt * kf0.cp1[0]), y1 = toY(kf0.value + dv * kf0.cp1[1]);
        const x2 = toX(kf0.time + dt * kf0.cp2[0]), y2 = toY(kf0.value + dv * kf0.cp2[1]);
        return `M ${x0} ${y0} C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`;
      }
    }
    return `M ${x0} ${y0} L ${x3} ${y3}`;
  }, [toX, toY]);

  const startKfDrag = useCallback((e: React.PointerEvent, kf: Keyframe<number>) => {
    e.preventDefault(); e.stopPropagation();
    const key = kfKey(track.propertyId, kf.id);
    let nextKeys = new Set(selectedKeys);
    if (e.shiftKey) {
      if (nextKeys.has(key)) nextKeys.delete(key);
      else nextKeys.add(key);
    } else if (!nextKeys.has(key)) {
      nextKeys = new Set([key]);
    }
    onSelectKeyframes(nextKeys);

    // Ctrl + クリック: 選択されたすべてのキーフレームの補間タイプを変更
    if (e.ctrlKey) {
      let hasBezier = false;
      nextKeys.forEach(k => {
        const [_, kfId] = k.split('::');
        const item = track.keyframes.find(x => x.id === kfId);
        if (item?.interpolation === 'bezier') hasBezier = true;
      });

      const nextType = hasBezier ? 'linear' : 'bezier';
      nextKeys.forEach(k => {
        const [_, kfId] = k.split('::');
        setKeyframe(track.propertyId, {
          id: kfId,
          interpolation: nextType,
          inHandle: undefined,
          outHandle: undefined,
          cp1: undefined,
          cp2: undefined,
        } as any);
      });
      return;
    }

    const startX = e.clientX, startY = e.clientY, isAlt = e.altKey;
    
    const initStates = new Map<string, { time: number; value: number }>();
    nextKeys.forEach(k => {
      const [_, kfId] = k.split('::');
      const item = track.keyframes.find(x => x.id === kfId);
      if (item) initStates.set(k, { time: item.time, value: item.value });
    });

    const onMove = (ev: PointerEvent) => {
      const dt = (ev.clientX - startX) / Math.max(1, innerW);
      const dv = -(ev.clientY - startY) / Math.max(1, H) * (vRange / zoom.y);
      
      initStates.forEach((st, k) => {
        const [_, kfId] = k.split('::');
        const updates: any = { 
          id: kfId, 
          time: Math.max(0, Math.min(1, st.time + dt)), 
          value: st.value + dv 
        };
        if (isAlt && initStates.size === 1) {
          const item = track.keyframes.find(x => x.id === kfId);
          if (item && item.interpolation !== 'bezier') {
            updates.interpolation = 'bezier';
            updates.outHandle = [0.1, 0];
            updates.inHandle = [-0.1, 0];
          }
        }
        setKeyframe(track.propertyId, updates);
      });
    };
    const onUp = () => { setIsDraggingHandle(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [innerW, H, vRange, zoom.y, track.propertyId, track.keyframes, selectedKeys, onSelectKeyframes, setKeyframe]);

  const startCpDrag = useCallback((e: React.PointerEvent, kf: Keyframe<number>, nextKf: Keyframe<number>, target: 'cp1' | 'cp2') => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingHandle(true);
    const startX = e.clientX, startY = e.clientY, initCp = target === 'cp1' ? (kf.cp1 ?? [0.25, 0.25]) : (kf.cp2 ?? [0.75, 0.75]), dt = nextKf.time - kf.time, dv = nextKf.value - kf.value;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / Math.max(1, innerW), dy = -(ev.clientY - startY) / Math.max(1, H) * (vRange / zoom.y);
      const nDx = dt > 1e-6 ? dx / dt : 0, nDy = Math.abs(dv) > 1e-6 ? dy / dv : 0;
      setKeyframe(track.propertyId, { id: kf.id, [target]: [Math.max(0, Math.min(1, initCp[0] + nDx)), Math.max(-1, Math.min(2, initCp[1] + nDy))] });
    };
    const onUp = () => { setIsDraggingHandle(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [innerW, H, vRange, zoom.y, track.propertyId, setKeyframe]);

  const startHandleDrag = useCallback((e: React.PointerEvent, kf: Keyframe<number>, side: 'in' | 'out') => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingHandle(true);
    const isSymmetric = e.altKey, initHandle = side === 'in' ? (kf.inHandle ?? [0, 0]) : (kf.outHandle ?? [0, 0]), startX = e.clientX, startY = e.clientY;
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time), idx = sorted.findIndex(k => k.id === kf.id), prevKf = idx > 0 ? sorted[idx - 1] : null, nextKf = idx < sorted.length - 1 ? sorted[idx + 1] : null;
    const minDt = side === 'in' ? (prevKf ? -(kf.time - prevKf.time) : -kf.time) : 0, maxDt = side === 'out' ? (nextKf ? nextKf.time - kf.time : 1 - kf.time) : 0;
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / Math.max(1, innerW), dy = -(ev.clientY - startY) / Math.max(1, H) * (vRange / zoom.y);
      const newDt = side === 'in' ? Math.min(0, Math.max(minDt, initHandle[0] + dx)) : Math.max(0, Math.min(maxDt, initHandle[0] + dx));
      const newHandle: [number, number] = [newDt, initHandle[1] + dy];
      setKeyframe(track.propertyId, { id: kf.id, [side === 'in' ? 'inHandle' : 'outHandle']: newHandle });
      if (isSymmetric) setKeyframe(track.propertyId, { id: kf.id, [side === 'in' ? 'outHandle' : 'inHandle']: [-newHandle[0], -newHandle[1]] });
    };
    const onUp = () => { setIsDraggingHandle(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [innerW, H, vRange, zoom.y, track.keyframes, track.propertyId, setKeyframe]);

  // ─── セグメントドラッグ (上下: 値, 左右: イージング強度) ───
  const startSegmentDrag = useCallback((
    e: React.PointerEvent,
    kf0: Keyframe<number>,
    kf1: Keyframe<number>,
  ) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingHandle(true); onSelectKeyframes(new Set());
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const startX_px = e.clientX;

    const segDt = Math.max(1e-6, kf1.time - kf0.time);
    const v0 = kf0.value, v1 = kf1.value;
    const dv = v1 - v0;

    // クリック時の正規化パラメータ t (0-1)
    const clickTime = frX(e.clientX - rect.left);
    const localT    = Math.max(0.01, Math.min(0.99, (clickTime - kf0.time) / segDt));

    // 現在の状態をキャプチャ
    const initInterpolation = kf0.interpolation;
    const initCp1 = kf0.cp1 ?? [0.25, 0.25];
    const initCp2 = kf0.cp2 ?? [0.75, 0.75];
    const initOutH = kf0.outHandle ?? [segDt/3, 0];
    const initInH  = kf1.inHandle  ?? [-segDt/3, 0];

    const onMove = (ev: PointerEvent) => {
      // マウス移動量 (グラフ空間)
      const dx = (ev.clientX - startX_px) / innerW;
      const isLegacy = initInterpolation !== 'bezier' || (kf0.cp1 && kf0.cp2 && !kf0.outHandle);

      // 垂直: 対称に V を動かす
      const nextV = frY(ev.clientY - rect.top);
      const h = computeSymmetricH(v0, v1, localT, nextV);

      if (isLegacy || (!kf0.outHandle && !kf1.inHandle)) {
        // cp1/cp2 調整: X方向は移動方向にシフト
        const nDx = dx / segDt;
        const nV  = Math.abs(dv) > 1e-6 ? (h - v0) / dv : 0.5;

        setKeyframe(track.propertyId, {
          id: kf0.id,
          interpolation: 'bezier',
          cp1: [Math.max(0, Math.min(1, initCp1[0] + nDx)), nV],
          cp2: [Math.max(0, Math.min(1, initCp2[0] + nDx)), nV],
          // 2Dハンドルが混在しないようクリア
          outHandle: undefined,
        } as any);
        setKeyframe(track.propertyId, {
          id: kf1.id,
          inHandle: undefined,
        } as any);

      } else {
        // outHandle / inHandle (2D) 調整: X方向は移動方向にシフト
        setKeyframe(track.propertyId, {
          id: kf0.id,
          interpolation: 'bezier',
          outHandle: [Math.max(0, Math.min(segDt, initOutH[0] + dx)), h - v0],
        });
        setKeyframe(track.propertyId, {
          id: kf1.id,
          inHandle: [Math.max(-segDt, Math.min(0, initInH[0] + dx)), h - v1],
        });
      }
    };

    const onUp = () => { setIsDraggingHandle(false); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  }, [track.propertyId, frX, frY, innerW, H, vRange, zoom.y, setKeyframe, onSelectKeyframes]);


  const handleBgPointerDown = (e: React.PointerEvent) => {
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const startX = e.clientX, startY = e.clientY;
    const sx = startX - rect.left, sy = startY - rect.top;

    if (e.button === 1) { // Middle click: Pan
      e.preventDefault(); 
      const initOffset = { ...viewOffset };
      const onMove = (ev: PointerEvent) => setViewOffset({ x: initOffset.x + (ev.clientX - startX), y: initOffset.y + (ev.clientY - startY) });
      const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); 
      return;
    }

    if (e.button === 2 || e.button === 0) { // Right or Left click
      e.preventDefault();
      let isMarquee = e.button === 2; // Right click starts marquee immediately
      const threshold = 5;

      const onMove = (ev: PointerEvent) => {
        if (!isMarquee && e.button === 0) {
          const dist = Math.sqrt((ev.clientX - startX) ** 2 + (ev.clientY - startY) ** 2);
          if (dist > threshold) {
            isMarquee = true;
            onSelectKeyframes(new Set());
          }
        }

        if (isMarquee) {
          setMarquee({ sx, sy, ex: ev.clientX - rect.left, ey: ev.clientY - rect.top });
        } else if (e.button === 0) {
          const nf = frX(ev.clientX - rect.left);
          animLoopRef.current?.seekTo(nf);
          setTimelineTime(nf);
          setGraphTime(nf);
          setCurrentTime(nf);
          onSeek?.();
        }
      };

      const onUp = (ev: PointerEvent) => {
        if (isMarquee) {
          const x1 = Math.min(sx, ev.clientX - rect.left), x2 = Math.max(sx, ev.clientX - rect.left);
          const y1 = Math.min(sy, ev.clientY - rect.top), y2 = Math.max(sy, ev.clientY - rect.top);
          const newSelection = new Set(e.shiftKey ? selectedKeys : []);
          sorted.forEach(kf => { 
            const kx = toX(kf.time), ky = toY(kf.value); 
            if (kx >= x1 && kx <= x2 && ky >= y1 && ky <= y2) {
              newSelection.add(kfKey(track.propertyId, kf.id));
            }
          });
          onSelectKeyframes(newSelection);
          setMarquee(null);
        } else if (e.button === 0) {
          const nf = frX(ev.clientX - rect.left);
          animLoopRef.current?.seekTo(nf);
          setTimelineTime(nf);
          setGraphTime(nf);
          setCurrentTime(nf);
          onSeek?.();
          onSelectKeyframes(new Set());
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
  };

  const recomputeAuto = () => {
    const current = useGradientStore.getState().keyframeTracks[track.propertyId]; if (!current) return;
    const updated = computeAutoHandles(current.keyframes); setKeyframeTracks(prev => ({ ...prev, [track.propertyId]: { ...current, keyframes: updated } }));
  };

  const timeTicks = useMemo(() => { const count = Math.min(10, Math.max(2, Math.floor(W / 80))); return Array.from({ length: count + 1 }, (_, i) => i / count); }, [W]);
  const valueTicks = useMemo(() => niceTicks(vMin, vMax, Y_GRID_N), [vMin, vMax]);
  const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
  const indicatorX = toX(graphTime);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-k-bg select-none">
      <div className="absolute left-0 top-0 bottom-0 w-9 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, #0C0C0C 55%, transparent)' }}>
        {valueTicks.map(v => {
          const y = toY(v); if (y < 0 || y > H) return null;
          return <div key={v} className="absolute right-1 text-[8px] text-neutral-500 tabular-nums leading-none" style={{ top: y, transform: 'translateY(-50%)' }}>{Math.abs(v) < 0.001 ? '0' : v.toFixed(Math.abs(v) < 1 ? 2 : 1)}</div>;
        })}
      </div>
      <svg ref={svgRef} width="100%" height="100%" className="touch-none overflow-visible" style={{ cursor: 'crosshair' }} onPointerDown={handleBgPointerDown} onContextMenu={e => e.preventDefault()}>
        <rect width="100%" height="100%" fill="transparent" />
        {timeTicks.map(t => {
          const x = toX(t); if (x < 0 || x > W) return null;
          return <g key={`tg-${t}`}><line x1={x} y1={0} x2={x} y2={H} stroke={t === 0 || t === 1 ? '#2A2A2A' : '#1C1C1C'} strokeWidth="1" /><text x={x + 2} y={H - 3} fontSize="8" fill="#454545">{(t * duration).toFixed(2)}s</text></g>;
        })}
        {valueTicks.map(v => {
          const y = toY(v); if (y < 0 || y > H) return null;
          return <line key={`vg-${v}`} x1={0} y1={y} x2={W} y2={y} stroke={Math.abs(v) < 0.001 ? '#2A2A2A' : '#1C1C1C'} strokeWidth={1} strokeDasharray={Math.abs(v) < 0.001 ? '' : '3,4'} />;
        })}
        {indicatorX >= 0 && indicatorX <= W && (
          <g pointerEvents="none">
            <line x1={indicatorX} y1={0} x2={indicatorX} y2={H} stroke="#60A5FA" strokeWidth="1" opacity="0.85" />
            <rect x={indicatorX - 4} y={-4} width={8} height={8} fill="#60A5FA" transform={`rotate(45 ${indicatorX} 0)`} />
          </g>
        )}
        {sorted.slice(0, -1).map((kf, si) => {
          const kfNext = sorted[si + 1], pathD = buildPath(kf, kfNext);
          return <g key={`seg-${si}`}><path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" style={{ pointerEvents: 'none' }} /><path d={pathD} fill="none" stroke="transparent" strokeWidth={16} style={{ cursor: kf.interpolation === 'bezier' ? 'row-resize' : 'ns-resize' }} onPointerDown={e => startSegmentDrag(e, kf, kfNext)} /></g>;
        })}
        {sorted.map((kf) => {
          const key = kfKey(track.propertyId, kf.id), isSelected = selectedKeys.has(key), cx = toX(kf.time), cy = toY(kf.value);
          return <g key={kf.id}><rect x={cx - KF_HALF} y={cy - KF_HALF} width={KF_HALF * 2} height={KF_HALF * 2} fill={isSelected ? '#FFF' : color} stroke={isSelected ? color : '#0D0D0D'} strokeWidth={isSelected ? 1.5 : 1} transform={`rotate(45 ${cx} ${cy})`} style={{ cursor: 'grab' }} onPointerDown={e => startKfDrag(e, kf)} onContextMenu={e => { e.preventDefault(); useGradientStore.getState().removeKeyframe(track.propertyId, kf.id); onSelectKeyframes(new Set()); }} />{isSelected && <text x={cx + KF_HALF + 4} y={Math.max(12, cy - KF_HALF - 2)} fontSize="9" fill="#ECDBBE" opacity="0.7" style={{ pointerEvents: 'none' }}>{`${(kf.time * duration).toFixed(2)}s  ${kf.value.toFixed(3)}`}</text>}</g>;
        })}
        {sorted.map((kf, i) => {
          const key = kfKey(track.propertyId, kf.id); if (!(selectedKeys.has(key) || isDraggingHandle) || kf.interpolation !== 'bezier') return null;
          const cx = toX(kf.time), cy = toY(kf.value), nextKf = sorted[i + 1];
          return (
            <g key={`h-${kf.id}`}>
              {kf.inHandle && <><line x1={cx} y1={cy} x2={toX(kf.time + kf.inHandle[0])} y2={toY(kf.value + kf.inHandle[1])} stroke={color} strokeWidth="1" strokeDasharray="3,2" opacity="0.55" /><circle cx={toX(kf.time + kf.inHandle[0])} cy={toY(kf.value + kf.inHandle[1])} r={HANDLE_R} fill={color} stroke="#0D0D0D" strokeWidth="1.5" style={{ cursor: 'grab' }} onPointerDown={e => startHandleDrag(e, kf, 'in')} /></>}
              {kf.outHandle && <><line x1={cx} y1={cy} x2={toX(kf.time + kf.outHandle[0])} y2={toY(kf.value + kf.outHandle[1])} stroke="#ECDBBE" strokeWidth="1" strokeDasharray="3,2" opacity="0.45" /><circle cx={toX(kf.time + kf.outHandle[0])} cy={toY(kf.value + kf.outHandle[1])} r={HANDLE_R} fill="#ECDBBE" stroke="#0D0D0D" strokeWidth="1.5" style={{ cursor: 'grab' }} onPointerDown={e => startHandleDrag(e, kf, 'out')} /></>}
              {!kf.outHandle && nextKf && kf.cp1 && kf.cp2 && (
                <><line x1={cx} y1={cy} x2={toX(kf.time + (nextKf.time - kf.time) * kf.cp1[0])} y2={toY(kf.value + (nextKf.value - kf.value) * kf.cp1[1])} stroke="#6075A4" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" /><circle cx={toX(kf.time + (nextKf.time - kf.time) * kf.cp1[0])} cy={toY(kf.value + (nextKf.value - kf.value) * kf.cp1[1])} r={HANDLE_R} fill="#6075A4" stroke="#ECDBBE" strokeWidth="1" style={{ cursor: 'grab' }} onPointerDown={e => startCpDrag(e, kf, nextKf, 'cp1')} /><line x1={toX(nextKf.time)} y1={toY(nextKf.value)} x2={toX(kf.time + (nextKf.time - kf.time) * kf.cp2[0])} y2={toY(kf.value + (nextKf.value - kf.value) * kf.cp2[1])} stroke="#D11402" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" /><circle cx={toX(kf.time + (nextKf.time - kf.time) * kf.cp2[0])} cy={toY(kf.value + (nextKf.value - kf.value) * kf.cp2[1])} r={HANDLE_R} fill="#D11402" stroke="#ECDBBE" strokeWidth="1" style={{ cursor: 'grab' }} onPointerDown={e => startCpDrag(e, kf, nextKf, 'cp2')} /></>
              )}
            </g>
          );
        })}
        {marquee && <rect x={Math.min(marquee.sx, marquee.ex)} y={Math.min(marquee.sy, marquee.ey)} width={Math.abs(marquee.ex - marquee.sx)} height={Math.abs(marquee.ey - marquee.sy)} fill="rgba(96, 165, 250, 0.15)" stroke="#60A5FA" strokeWidth="1" strokeDasharray="4,2" style={{ pointerEvents: 'none' }} />}
      </svg>
      <div className="absolute bottom-1.5 right-2 flex gap-1 z-10">
        <div className="text-[8px] text-neutral-600 self-center mr-1">Wheel: Zoom / Mid: Pan / Right: Select / Alt+Drag: Bezier</div>
        <button className="text-[9px] px-1.5 py-0.5 bg-k-surface hover:bg-k-muted text-tab-inactive rounded-none border border-k-muted/30" onClick={() => { setViewOffset({ x: 0, y: 0 }); setZoom({ x: 1, y: 1 }); }}>Reset View</button>
        <button className="text-[9px] px-1.5 py-0.5 bg-k-surface hover:bg-k-muted text-tab-inactive rounded-none border border-k-muted/30" onClick={recomputeAuto}>Auto</button>
      </div>
    </div>
  );
}
