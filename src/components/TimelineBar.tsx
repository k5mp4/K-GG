import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { InputAngle } from 'tweeq';
import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { AnimationLoop } from '../lib/animation';
import { GraphEditor, GRAPH_COLORS } from './GraphEditor';
import { solveBezierU, splitBezier } from '../lib/easingBezier';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import { getTimelineTime, setTimelineTime } from '../lib/timelineClock';
import { getTrackMode, type Keyframe } from '../types/keyframe';
import { Icon } from './Icon';
import { getAnimationGroup } from '../lib/animationRegistry';
import { AnimationPropertyControls } from './AnimationPropertyControls';
import { fromTweeqAngle, toTweeqAngle } from '../lib/tweeqAngle';
import { clampParameter, getParameterLimit } from '../lib/parameterLimits';
import type { ExportStage } from '../adapters';
import { exportStageLabel } from '../lib/exportProgress';

type Props = {
  animLoopRef: React.MutableRefObject<AnimationLoop | null>;
  onSeek?: () => void;
  exportProgress?: number | null;
  exportStage?: ExportStage;
  height?: number;
  showTimeRemap?: boolean;
  onToggleTimeRemap?: () => void;
  selectedEffectPrefix?: string;
};

// トラック行レイアウト定数（トラックビュー）
const TRACK_ROW_H  = 28;
const TRACK_GAP    = 6;
const ROW_TOTAL    = TRACK_ROW_H + TRACK_GAP;
const BODY_PAD_TOP = 8;
const PAD_X        = 20; // GraphEditor と合わせる

function kfKey(trackId: string, kfId: string) { return `${trackId}::${kfId}`; }

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

export function TimelineBar({ animLoopRef, onSeek, exportProgress = null, exportStage = 'preparing', height = 300, showTimeRemap = false, onToggleTimeRemap, selectedEffectPrefix = '' }: Props) {
  const isExporting = exportProgress !== null;
  const {
    animation, keyframeTracks, currentTime,
    addKeyframe, removeKeyframe, setKeyframe, setCurrentTime, setAnimation,
  } = useGradientStore();

  // ── ビューモード ──
  const [viewMode,      setViewMode]      = useState<'track' | 'graph'>('track');
  const [trackFilter, setTrackFilter] = useState<'moving' | 'selected' | 'all'>('moving');
  // グラフモードで表示するトラック ID
  const [graphTrackId,  setGraphTrackId]  = useState<string | null>(null);
  // グラフモードで選択中のキーフレームキー (複数選択対応)
  const [graphSelected, setGraphSelected] = useState<Set<string>>(new Set());

  // ── トラックビュー: 選択状態 ──
  const [selectedKf,    setSelectedKf]    = useState<{ trackId: string; kf: Keyframe } | null>(null);
  const [selectedKfIds, setSelectedKfIds] = useState<Set<string>>(new Set());
  const [marquee,       setMarquee]       = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);

  // ── その他の state ──
  const [isPaused,      setIsPaused]      = useState(false);

  // ── refs ──
  const clipboardRef          = useRef<Omit<Keyframe<number>, 'id'> | null>(null);
  const selectedKfRef         = useRef<{ trackId: string; kf: Keyframe } | null>(null);
  const selectedKfIdsRef      = useRef<Set<string>>(new Set());
  const activeTracksRef       = useRef<ReturnType<typeof Object.values<(typeof keyframeTracks)[string]>>>([]);
  const marqueeRef            = useRef<typeof marquee>(null);
  const tracksBodyRef         = useRef<HTMLDivElement>(null);
  const firstTrackVisualRef   = useRef<HTMLDivElement | null>(null);
  const draggingKfsRef        = useRef<{ startX: number; trackVisualWidth: number; initTimes: Map<string, number> } | null>(null);
  const trackFillRef          = useRef<HTMLDivElement>(null);
  const thumbRef              = useRef<HTMLDivElement>(null);
  const timeTextRef           = useRef<HTMLSpanElement>(null);
  const seekingRef            = useRef(false);
  const trackRef              = useRef<HTMLDivElement>(null);
  const rafRef                = useRef<number | null>(null);
  const lastPausedRef         = useRef(false);
  const displayedTimeRef      = useRef(currentTime);

  const allTracks = Object.values(keyframeTracks);
  const activeTracks = allTracks.filter(track => {
    if (trackFilter === 'all') return true;
    if (trackFilter === 'selected') {
      return selectedEffectPrefix ? track.propertyId.startsWith(selectedEffectPrefix) : true;
    }
    return getTrackMode(track) !== 'static';
  });
  const graphTracks = activeTracks.filter(track => getTrackMode(track) === 'keys');
  const beatSync = animation.easing.beatSync;
  const beatSyncEnabled = beatSync?.enabled ?? false;
  const beatMarkerCount = beatSync?.subdivision === 3 ? 3 : 4;
  const beatFractions = beatSyncEnabled
    ? Array.from({ length: beatMarkerCount + 1 }, (_, i) => i / beatMarkerCount)
    : [];

  // ── refs を最新状態に同期 ──
  useEffect(() => { activeTracksRef.current = activeTracks; });
  useEffect(() => { selectedKfRef.current = selectedKf; }, [selectedKf]);
  useEffect(() => { selectedKfIdsRef.current = selectedKfIds; }, [selectedKfIds]);

  // 指定パスの現在値を store から取得
  const getPropertyValue = useCallback((path: string): number => {
    const store = useGradientStore.getState();
    if (path.startsWith('gradientStop.')) {
      const parts = path.split('.');
      const stopId = parts[1];
      const field = parts[2];
      const stop = store.gradient.stops.find(s => s.stopId === stopId);
      if (!stop) return 0;
      if (field === 'position') return stop.position;
      const hex = stop.color;
      if (field === 'r') return parseInt(hex.slice(1, 3), 16);
      if (field === 'g') return parseInt(hex.slice(3, 5), 16);
      if (field === 'b') return parseInt(hex.slice(5, 7), 16);
      return 0;
    }
    if (path.startsWith('opacityStop.')) {
      const parts = path.split('.');
      const stopId = parts[1];
      const field = parts[2];
      const stop = store.gradient.opacityStops?.find(s => s.stopId === stopId);
      if (!stop) return field === 'opacity' ? 1 : 0;
      if (field === 'position') return stop.position;
      if (field === 'opacity') return stop.opacity;
      return 0;
    }
    if (path.startsWith('gradientAnchor.')) {
      const parts = path.split('.');
      const idx = parseInt(parts[1], 10);
      const field = parts[2];
      const anchors = store.gradient.anchors;
      if (!anchors || isNaN(idx) || !anchors[idx]) return 0;
      return field === 'x' ? anchors[idx][0] : anchors[idx][1];
    }
    const [category, field] = path.split('.') as [keyof typeof STORE_DEFAULTS, string];
    const obj = store[category] as any;
    return obj?.[field] ?? 0;
  }, []);

  // ────────── RAF: タイムライン UI を更新 ──────────
  useEffect(() => {
    const update = () => {
      const loop = animLoopRef.current;
      // エクスポート中は React の再レンダリングに任せるため RAF による更新をスキップ
      if (loop && !seekingRef.current && !isExporting) {
        const nt  = loop.currentNormalizedTime;
        displayedTimeRef.current = nt;
        setTimelineTime(nt);
        
        // 直接 DOM 操作 (React の style 属性と競合しないようにする)
        if (trackFillRef.current) trackFillRef.current.style.width = `calc(${nt} * (100% - ${PAD_X * 2}px))`;
        if (thumbRef.current)     thumbRef.current.style.left      = `calc(${PAD_X}px + ${nt} * (100% - ${PAD_X * 2}px))`;
        if (timeTextRef.current) {
          timeTextRef.current.textContent = `${formatSeconds(nt * animation.duration)} / ${formatSeconds(animation.duration)}`;
        }
        if (loop.isPaused !== lastPausedRef.current) {
          lastPausedRef.current = loop.isPaused;
          setIsPaused(loop.isPaused);
          setCurrentTime(nt);
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [animLoopRef, animation.duration, setCurrentTime, isExporting]);

  // エクスポート中の UI 更新 (React のレンダリングに同期)
  useLayoutEffect(() => {
    if (isExporting) {
      const nt = exportProgress ?? 0;
      displayedTimeRef.current = nt;
      setTimelineTime(nt);
      if (trackFillRef.current) trackFillRef.current.style.width = `calc(${nt} * (100% - ${PAD_X * 2}px))`;
      if (thumbRef.current)     thumbRef.current.style.left      = `calc(${PAD_X}px + ${nt} * (100% - ${PAD_X * 2}px))`;
      if (timeTextRef.current) {
        timeTextRef.current.textContent = `${Math.round(nt * 100)}%`;
      }
    }
  }, [isExporting, exportProgress]);

  // ────────── キーボードショートカット ──────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const loop = animLoopRef.current;
      if (!loop) return;

      if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault();
        const frameTime = 1 / (animation.fps || 24);
        const delta = (e.key === 'PageUp' ? -frameTime : frameTime) * (e.shiftKey ? 10 : 1);
        const nextTime = Math.max(0, Math.min(1, loop.currentNormalizedTime + delta / animation.duration));
        loop.seekTo(nextTime);
        updateThumb(nextTime);
        setCurrentTime(nextTime);
        onSeek?.();
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          // グラフモード: graphSelected から
          if (viewMode === 'graph' && graphSelected.size > 0) {
            const firstKey = [...graphSelected][0];
            const [tId, kfId] = firstKey.split('::');
            const kf = useGradientStore.getState().keyframeTracks[tId]?.keyframes.find(k => k.id === kfId);
            if (kf) { const { id: _, ...rest } = kf; clipboardRef.current = rest; }
          } else if (selectedKfRef.current) {
            const { id: _, ...rest } = selectedKfRef.current.kf;
            clipboardRef.current = rest;
          }
        }
        if (e.key === 'v' && clipboardRef.current) {
          const nt = loop.currentNormalizedTime;
          const targetTrackId = viewMode === 'graph'
            ? graphTrackId
            : (selectedKfRef.current?.trackId ?? (activeTracks.length === 1 ? activeTracks[0].propertyId : null));
          if (targetTrackId) {
            addKeyframe(targetTrackId, { ...clipboardRef.current, time: nt });
          }
        }
        if (e.key === 'a' && viewMode === 'track') {
          e.preventDefault();
          const all = new Set<string>();
          activeTracksRef.current.forEach(t => t.keyframes.forEach(kf => all.add(kfKey(t.propertyId, kf.id))));
          setSelectedKfIds(all);
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (viewMode === 'graph' && graphSelected.size > 0) {
          graphSelected.forEach(key => {
            const [tId, kfId] = key.split('::');
            removeKeyframe(tId, kfId);
          });
          setGraphSelected(new Set());
        } else {
          const ids = selectedKfIdsRef.current;
          if (ids.size > 0) {
            ids.forEach(key => {
              const [tId, kfId] = key.split('::');
              removeKeyframe(tId, kfId);
            });
            setSelectedKfIds(new Set());
            setSelectedKf(null);
          }
        }
      }

      // F or F9: Easy Ease
      if (e.key.toLowerCase() === 'f' || e.key === 'F9') {
        const ids = viewMode === 'graph' ? graphSelected : selectedKfIdsRef.current;
        if (ids.size > 0) {
          e.preventDefault();
          ids.forEach(key => {
            const [tId, kfId] = key.split('::');
            const track = keyframeTracks[tId];
            const kf = track?.keyframes.find(k => k.id === kfId);
            if (!kf) return;

            // 2D ハンドルでの Easy Ease
            const sorted = [...track.keyframes].sort((a,b) => a.time - b.time);
            const idx = sorted.findIndex(k => k.id === kfId);
            const prev = idx > 0 ? sorted[idx-1] : null;
            const next = idx < sorted.length - 1 ? sorted[idx+1] : null;
            
            const dt_out = next ? (next.time - kf.time) / 3 : 0.1;
            const dt_in  = prev ? (prev.time - kf.time) / 3 : -0.1;

            setKeyframe(tId, {
              id: kfId,
              interpolation: 'bezier',
              outHandle: [dt_out, 0],
              inHandle:  [dt_in, 0],
              cp1: [0.33, 0], // フォールバック用
              cp2: [0.66, 1],
            } as any);
          });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [animLoopRef, animation.duration, animation.fps, viewMode, graphSelected, graphTrackId, activeTracks, keyframeTracks, addKeyframe, removeKeyframe, setCurrentTime, onSeek]);

  // ────────── シーク (transport バー) ──────────
  const getFraction = (e: MouseEvent | PointerEvent | React.PointerEvent): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const usableW = rect.width - PAD_X * 2;
    return Math.max(0, Math.min(1, (x - PAD_X) / Math.max(1, usableW)));
  };

  const startSeek = (e: React.PointerEvent) => {
    e.preventDefault();
    seekingRef.current = true;
    const f = getFraction(e);
    animLoopRef.current?.seekTo(f);
    if (f >= 0.999999) animLoopRef.current?.pause();
    updateThumb(f);
    setCurrentTime(f);
    if (animLoopRef.current?.isPaused) onSeek?.();

    const onMove = (ev: PointerEvent) => {
      const f2 = getFraction(ev);
      animLoopRef.current?.seekTo(f2);
      if (f2 >= 0.999999) animLoopRef.current?.pause();
      updateThumb(f2);
      setCurrentTime(f2);
      if (animLoopRef.current?.isPaused) onSeek?.();
    };
    const onUp = () => {
      seekingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      try {
        if (e.currentTarget && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (err) {
        // Ignore pointer capture errors during unmount
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const updateThumb = (fraction: number) => {
    const nt = fraction;
    displayedTimeRef.current = nt;
    setTimelineTime(nt);
    if (trackFillRef.current) trackFillRef.current.style.width = `calc(${nt} * (100% - ${PAD_X * 2}px))`;
    if (thumbRef.current)     thumbRef.current.style.left      = `calc(${PAD_X}px + ${nt} * (100% - ${PAD_X * 2}px))`;
    if (timeTextRef.current) {
      timeTextRef.current.textContent = `${formatSeconds(fraction * animation.duration)} / ${formatSeconds(animation.duration)}`;
    }
  };

  const togglePause = () => {
    const loop = animLoopRef.current;
    if (!loop) return;
    if (loop.isPaused && loop.currentNormalizedTime >= 0.999999) {
      loop.seekTo(0);
      updateThumb(0);
      setCurrentTime(0);
    }
    loop.togglePause();
    lastPausedRef.current = loop.isPaused;
    setIsPaused(loop.isPaused);
    setCurrentTime(loop.currentNormalizedTime);
  };

  const seekToNormalized = (nt: number) => {
    const nextTime = Math.max(0, Math.min(1, nt));
    animLoopRef.current?.seekTo(nextTime);
    if (nextTime >= 0.999999) animLoopRef.current?.pause();
    updateThumb(nextTime);
    setCurrentTime(nextTime);
    if (animLoopRef.current?.isPaused) onSeek?.();
  };

  const nudgeFrame = (direction: -1 | 1) => {
    const frameTime = 1 / (animation.fps || 24);
    const current = animLoopRef.current?.currentNormalizedTime ?? currentTime;
    seekToNormalized(current + (direction * frameTime) / animation.duration);
  };

  const seekToEnd = () => {
    seekToNormalized(1);
  };

  const getDisplayedTimelineTime = () => {
    const trackEl = trackRef.current;
    const thumbEl = thumbRef.current;
    if (trackEl && thumbEl) {
      const trackRect = trackEl.getBoundingClientRect();
      const thumbRect = thumbEl.getBoundingClientRect();
      const usableW = trackRect.width - PAD_X * 2;
      if (usableW > 0) {
        const x = thumbRect.left - trackRect.left;
        return Math.max(0, Math.min(1, (x - PAD_X) / usableW));
      }
    }

    const storeTime = useGradientStore.getState().currentTime;
    const loopTime = animLoopRef.current?.currentNormalizedTime;
    const candidates = [displayedTimeRef.current, storeTime, loopTime]
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return getTimelineTime(candidates.find(v => v > 0) ?? candidates[0] ?? 0);
  };

  const insertKeyframeAtCurrentTime = (trackId: string) => {
    const nt = getDisplayedTimelineTime();
    displayedTimeRef.current = nt;
    setTimelineTime(nt);
    setCurrentTime(nt);
    const track = keyframeTracks[trackId];
    if (!track) return;

    // 現在時刻における補間値を取得。キーフレームが0個の場合は現在の実効値を使う
    const val = track.keyframes.length > 0 
      ? interpolateKeyframes(nt, track.keyframes)
      : getPropertyValue(trackId);

    const existing = track.keyframes.find(k => Math.abs(k.time - nt) < 1e-4);
    if (existing) {
      setKeyframe(trackId, { id: existing.id, value: val });
      return;
    }

    if (track.keyframes.length > 0) {
      const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
      
      // 両端より外側の場合は分割せず単純追加
      if (nt > sorted[0].time && nt < sorted[sorted.length - 1].time) {
        const rightIdx = sorted.findIndex(k => k.time > nt);
        const leftIdx = rightIdx - 1;

        if (leftIdx >= 0 && rightIdx !== -1) {
          const kf0 = sorted[leftIdx];
          const kf1 = sorted[rightIdx];

          if (kf0.interpolation === 'bezier' && kf0.outHandle && kf1.inHandle) {
            // 三次ベジェ曲線を分割
            const p0: [number, number] = [kf0.time, kf0.value];
            const p1: [number, number] = [kf0.time + kf0.outHandle[0], kf0.value + kf0.outHandle[1]];
            const p2: [number, number] = [kf1.time + kf1.inHandle[0], kf1.value + kf1.inHandle[1]];
            const p3: [number, number] = [kf1.time, kf1.value];

            const u = solveBezierU(nt, p0[0], p1[0], p2[0], p3[0]);
            const [seg1, seg2] = splitBezier(p0, p1, p2, p3, u);

            // kf0 の outHandle を更新
            setKeyframe(trackId, {
              id: kf0.id,
              outHandle: [seg1[1][0] - seg1[0][0], seg1[1][1] - seg1[0][1]]
            });

            // kf1 の inHandle を更新
            setKeyframe(trackId, {
              id: kf1.id,
              inHandle: [seg2[2][0] - seg2[3][0], seg2[2][1] - seg2[3][1]]
            });

            // 新規キーフレームを追加
            addKeyframe(trackId, {
              time: nt,
              value: val,
              interpolation: 'bezier',
              inHandle: [seg1[2][0] - seg1[3][0], seg1[2][1] - seg1[3][1]],
              outHandle: [seg2[1][0] - seg2[0][0], seg2[1][1] - seg2[0][1]],
            }, { preserveHandles: true });
            return;
          }
        }
      }
    }

    // デフォルト（リニア補間、または端点より外側、またはキーフレームが1個以下）
    const hasBezier = track.keyframes.some(k => k.interpolation === 'bezier');
    addKeyframe(trackId, {
      time: nt,
      value: val,
      interpolation: hasBezier ? 'bezier' : 'linear',
    });
  };

  // ────────── グラフモード切り替え ──────────
  const toggleGraph = () => {
    if (viewMode === 'graph') {
      setViewMode('track');
    } else {
      // 選択中キーフレームからトラックを決定
      let trackId: string | null = null;
      if (selectedKfIds.size > 0) {
        trackId = [...selectedKfIds][0].split('::')[0];
      } else if (selectedKf) {
        trackId = selectedKf.trackId;
      } else if (graphTracks.length > 0) {
        trackId = graphTracks[0].propertyId;
      }
      if (!trackId) return; // アクティブトラックがなければ何もしない
      setGraphTrackId(trackId);
      setGraphSelected(new Set());
      setViewMode('graph');
    }
  };

  // ────────── マルキー選択 ──────────
  const finalizeMarqueeSelection = useCallback((addToExisting: boolean) => {
    const m         = marqueeRef.current;
    const container = tracksBodyRef.current;
    const firstVis  = firstTrackVisualRef.current;
    if (!m || !container || !firstVis) return;
    if (Math.abs(m.ex - m.sx) < 4 && Math.abs(m.ey - m.sy) < 4) return;

    const containerRect = container.getBoundingClientRect();
    const vRect         = firstVis.getBoundingClientRect();
    const visualStartX  = vRect.left - containerRect.left;
    const visualWidth   = vRect.width;
    if (visualWidth <= 0) return;

    const mx1 = Math.min(m.sx, m.ex), mx2 = Math.max(m.sx, m.ex);
    const my1 = Math.min(m.sy, m.ey), my2 = Math.max(m.sy, m.ey);
    const tMin = (mx1 - visualStartX) / visualWidth;
    const tMax = (mx2 - visualStartX) / visualWidth;

    const newSelected = new Set<string>(addToExisting ? [...selectedKfIdsRef.current] : []);
    activeTracksRef.current.forEach((track, idx) => {
      const rowTop    = BODY_PAD_TOP + idx * ROW_TOTAL;
      const rowBottom = rowTop + TRACK_ROW_H;
      if (rowBottom < my1 || rowTop > my2) return;
      track.keyframes.forEach(kf => {
        if (kf.time >= tMin && kf.time <= tMax) newSelected.add(kfKey(track.propertyId, kf.id));
      });
    });
    setSelectedKfIds(newSelected);
  }, []);

  const startMarquee = (e: React.PointerEvent) => {
    e.preventDefault();
    const container = tracksBodyRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top + container.scrollTop;
    if (!e.shiftKey) setSelectedKfIds(new Set());
    const newM = { sx, sy, ex: sx, ey: sy };
    marqueeRef.current = newM;
    setMarquee({ ...newM });

    const onMove = (ev: PointerEvent) => {
      const c = tracksBodyRef.current;
      if (!c || !marqueeRef.current) return;
      const r = c.getBoundingClientRect();
      const updated = { ...marqueeRef.current, ex: ev.clientX - r.left, ey: ev.clientY - r.top + c.scrollTop };
      marqueeRef.current = updated;
      setMarquee({ ...updated });
    };
    const onUp = () => {
      finalizeMarqueeSelection(e.shiftKey);
      marqueeRef.current = null;
      setMarquee(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ────────── キーフレームドラッグ (トラックビュー: 時間のみ) ──────────
  const startKfDrag = (e: React.PointerEvent, trackId: string, kf: Keyframe<number>) => {
    e.preventDefault();
    e.stopPropagation();

    const key = kfKey(trackId, kf.id);
    let cur = new Set(selectedKfIdsRef.current);
    if (!cur.has(key)) {
      cur = new Set([key]);
      setSelectedKfIds(cur);
    }

    // Ctrl + クリック: 選択されたすべてのキーフレームの補間タイプを変更
    if (e.ctrlKey) {
      let hasBezier = false;
      cur.forEach(k => {
        const [tId, kfId] = k.split('::');
        const item = keyframeTracks[tId]?.keyframes.find(x => x.id === kfId);
        if (item?.interpolation === 'bezier') hasBezier = true;
      });

      const nextType = hasBezier ? 'linear' : 'bezier';
      cur.forEach(k => {
        const [tId, kfId] = k.split('::');
        setKeyframe(tId, {
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

    setSelectedKf({ trackId, kf });

    const initTimes = new Map<string, number>();
    const tracks = useGradientStore.getState().keyframeTracks;
    cur.forEach(k => {
      const [tId, kfId] = k.split('::');
      const item = tracks[tId]?.keyframes.find(x => x.id === kfId);
      if (item) initTimes.set(k, item.time);
    });

    const firstVis         = firstTrackVisualRef.current;
    const trackVisualWidth = firstVis ? firstVis.getBoundingClientRect().width : 600;
    draggingKfsRef.current = { startX: e.clientX, trackVisualWidth, initTimes };

    const onMove = (ev: PointerEvent) => {
      const drag = draggingKfsRef.current;
      if (!drag) return;
      const dt = (ev.clientX - drag.startX) / drag.trackVisualWidth;
      drag.initTimes.forEach((initTime, k) => {
        const [tId, kfId] = k.split('::');
        setKeyframe(tId, { id: kfId, time: Math.max(0, Math.min(1, initTime + dt)) });
      });
    };
    const onUp = () => {
      draggingKfsRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ────────── 描画 ──────────
  const graphTrackCandidate = graphTrackId ? keyframeTracks[graphTrackId] : null;
  const graphTrack = graphTrackCandidate && getTrackMode(graphTrackCandidate) === 'keys'
    ? graphTrackCandidate
    : null;
  const graphTrackIdx = graphTrackId ? graphTracks.findIndex(t => t.propertyId === graphTrackId) : 0;
  const graphColor = GRAPH_COLORS[Math.max(0, graphTrackIdx) % GRAPH_COLORS.length];

  // グラフモードが有効か (アクティブトラックが存在する場合のみ)
  const canGraph = graphTracks.length > 0;
  const timeRemapActive = animation.easing.enabled || (animation.easing.beatSync?.enabled ?? false);

  return (
    <div
      className="relative shrink-0 overflow-hidden bg-k-bg/95 backdrop-blur-md border-t border-panel-border flex flex-col"
      style={{ height }}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-panel-border/60 bg-k-surface/80 px-3">
        <button
          type="button"
          onClick={() => setAnimation({ enabled: !animation.enabled })}
          className={`flex h-6 items-center gap-1.5 border px-2 text-[9px] font-display font-semibold uppercase tracking-wider transition-colors ${
            animation.enabled
              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300'
              : 'border-k-muted/60 bg-k-bg text-tab-inactive'
          }`}
          title="Animation ON/OFF"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${animation.enabled ? 'bg-emerald-400' : 'bg-k-muted'}`} />
          Animation
        </button>

        <div className="flex items-center border border-k-muted/50 bg-k-bg">
          {(['moving', 'selected', 'all'] as const).map(filter => (
            <button
              key={filter}
              type="button"
              onClick={() => setTrackFilter(filter)}
              className={`h-5 px-2 text-[8px] font-display uppercase tracking-wider transition-colors ${
                trackFilter === filter ? 'bg-fire text-k-text' : 'text-tab-inactive hover:text-k-text'
              }`}
            >
              {filter === 'moving' ? 'Moving' : filter === 'selected' ? 'Selected' : 'All'}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-tab-inactive">
            Duration
            <input
              type="number"
              min={0.1}
              max={300}
              step={0.1}
              value={Number(animation.duration.toFixed(2))}
              disabled={beatSyncEnabled}
              onChange={event => setAnimation({ duration: Math.max(0.1, Math.min(300, Number(event.target.value) || 0.1)) })}
              className="h-5 w-14 border border-k-muted/60 bg-k-bg px-1 text-right text-[9px] tabular-nums text-k-text outline-none focus:border-fire disabled:opacity-50"
            />
            <span className="normal-case">s</span>
          </label>
          <label className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-tab-inactive">
            FPS
            <select
              value={animation.fps}
              onChange={event => setAnimation({ fps: Number(event.target.value) as 24 | 30 | 60 })}
              className="h-5 border border-k-muted/60 bg-k-bg px-1 text-[9px] text-k-text outline-none focus:border-fire"
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </label>
          <label className="hidden items-center gap-1 text-[8px] uppercase tracking-wider text-tab-inactive lg:flex">
            Speed
            <input
              type="number"
              min={getParameterLimit('animation.speed').min}
              max={getParameterLimit('animation.speed').max}
              step={getParameterLimit('animation.speed').step}
              value={Number(clampParameter(animation.speed, STORE_DEFAULTS.animation.speed, getParameterLimit('animation.speed')).toFixed(2))}
              onChange={event => setAnimation({ speed: clampParameter(Number(event.target.value), STORE_DEFAULTS.animation.speed, getParameterLimit('animation.speed')) })}
              className="h-5 w-12 border border-k-muted/60 bg-k-bg px-1 text-right text-[9px] tabular-nums text-k-text outline-none focus:border-fire"
            />
          </label>
          <label className="hidden items-center gap-1 text-[8px] uppercase tracking-wider text-tab-inactive xl:flex">
            Direction
            <span className="tq-input-angle h-5 w-14" title="Animation Direction">
              <InputAngle
                value={toTweeqAngle(clampParameter(animation.direction, 0, getParameterLimit('animation.direction')))}
                snap={15}
                angleOffset={-90}
                onChange={value => setAnimation({ direction: clampParameter(fromTweeqAngle(value), 0, getParameterLimit('animation.direction')) })}
              />
            </span>
          </label>
          <button
            type="button"
            onClick={() => setAnimation({ previewLoop: !(animation.previewLoop ?? true) })}
            className={`h-5 border px-2 text-[8px] font-display uppercase tracking-wider ${
              (animation.previewLoop ?? true)
                ? 'border-fire/60 bg-fire/10 text-fire'
                : 'border-k-muted/60 bg-k-bg text-tab-inactive'
            }`}
            title="Preview Loop ON/OFF"
          >
            Loop {(animation.previewLoop ?? true) ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            onClick={onToggleTimeRemap}
            className={`h-5 border px-2 text-[8px] font-display uppercase tracking-wider ${
              showTimeRemap || timeRemapActive
                ? 'border-fire/60 bg-fire/10 text-fire'
                : 'border-k-muted/60 bg-k-bg text-tab-inactive'
            }`}
            title="Autoモーション専用のLoop Timing"
          >
            Loop Timing
          </button>
        </div>
      </div>
      {/* ── Transport row ── */}
      <div className="shrink-0 border-b border-panel-border/20">
        {/* 中央: Preview controls */}
        <div className="flex h-[56px] flex-col items-center justify-start gap-1 pt-2">
          <div className="flex items-center gap-1.5 text-[9px] font-display font-semibold uppercase tracking-widest text-k-text/80">
            <span>Preview</span>
          </div>
          <div className="flex items-center gap-0.5 rounded-sm bg-k-bg px-1.5 py-0.5">
            <button
              onClick={() => seekToNormalized(0)}
              disabled={isExporting}
              className="w-6 h-6 flex items-center justify-center p-0 bg-transparent text-tab-inactive hover:text-k-text disabled:opacity-30 transition-colors"
              title="先頭へ"
            >
              <Icon name="firstPage" className="text-[17px]" />
            </button>
            <button
              onClick={() => nudgeFrame(-1)}
              disabled={isExporting}
              className="w-6 h-6 flex items-center justify-center p-0 bg-transparent text-tab-inactive hover:text-k-text disabled:opacity-30 transition-colors"
              title="1フレーム戻る"
            >
              <Icon name="skipPrevious" className="text-[17px]" />
            </button>
            <button
              onClick={togglePause}
              disabled={isExporting}
              className="w-9 h-9 flex items-center justify-center shrink-0 rounded-full border border-fire bg-k-surface p-0 text-fire hover:bg-fire hover:text-k-text disabled:opacity-30 transition-colors shadow-[0_0_0_1px_rgba(209,20,2,0.22)]"
              title={isPaused ? '再生' : '一時停止'}
            >
              <Icon name={isPaused ? 'play' : 'pause'} className="text-[22px]" />
            </button>
            <button
              onClick={() => nudgeFrame(1)}
              disabled={isExporting}
              className="w-6 h-6 flex items-center justify-center p-0 bg-transparent text-tab-inactive hover:text-k-text disabled:opacity-30 transition-colors"
              title="1フレーム進む"
            >
              <Icon name="skipNext" className="text-[17px]" />
            </button>
            <button
              onClick={seekToEnd}
              disabled={isExporting}
              className="w-6 h-6 flex items-center justify-center p-0 bg-transparent text-tab-inactive hover:text-k-text disabled:opacity-30 transition-colors"
              title="末尾へ"
            >
              <Icon name="lastPage" className="text-[17px]" />
            </button>
          </div>
        </div>

        <div className="flex h-9 items-center gap-3 px-4">
          {/* 左: 時刻 / 進捗 */}
          <div className="w-36 shrink-0 flex items-center overflow-hidden">
            <span
              className="text-[9px] text-amber-400 tabular-nums truncate min-w-0"
              style={{ display: isExporting ? 'inline' : 'none' }}
            >
              {exportStageLabel(exportStage)}
            </span>
            <span
              ref={timeTextRef}
              className="text-[9px] text-deep tabular-nums truncate min-w-0 text-right"
              style={{ display: isExporting ? 'none' : 'inline' }}
            >
              0.00s / {formatSeconds(animation.duration)}
            </span>
          </div>

          {/* スクラバー (flex-1) */}
          <div
            ref={trackRef}
            className={`flex-1 h-6 flex items-center relative min-w-[180px] ${isExporting ? 'cursor-default' : 'cursor-pointer'} touch-none`}
            onPointerDown={isExporting ? undefined : startSeek}
          >
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-1.5 bg-k-muted/50 rounded-full relative overflow-hidden">
              <div
                ref={trackFillRef}
                className={`absolute top-0 h-full rounded-full transition-none ${isExporting ? 'bg-amber-500' : 'bg-fire'}`}
                style={{ left: PAD_X }}
              />
            </div>
          </div>
          {beatFractions.map((fraction, index) => (
            <div
              key={`scrub-beat-${index}`}
              className="absolute top-0 bottom-0 z-20 w-px pointer-events-none"
              style={{
                left: `calc(${PAD_X}px + ${fraction} * (100% - ${PAD_X * 2}px))`,
                background: index === 0 || index === beatMarkerCount
                  ? 'rgba(236,219,190,0.55)'
                  : 'rgba(209,20,2,0.72)',
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border"
                style={{
                  borderColor: index === 0 || index === beatMarkerCount
                    ? 'rgba(236,219,190,0.55)'
                    : 'rgba(209,20,2,0.75)',
                  backgroundColor: 'rgba(12,12,12,0.85)',
                }}
              />
            </div>
          ))}
          {!isExporting && (
            <div
              ref={thumbRef}
              className="absolute top-0 bottom-[-9999px] w-[1px] bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.6)] z-50 pointer-events-none"
              style={{ display: viewMode === 'graph' ? 'none' : 'block' }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-400 rotate-45" />
            </div>
          )}
        </div>

          {/* 右: タイムライン編集ボタン */}
          <div className="w-[92px] shrink-0 flex items-center justify-end gap-1">
            {/* グラフエディタ切り替えボタン */}
            <button
              onClick={toggleGraph}
              disabled={!canGraph}
              style={{ display: isExporting ? 'none' : 'block' }}
              className={`shrink-0 text-[9px] px-1 py-0.5 rounded-none transition-colors disabled:opacity-30 ${
                viewMode === 'graph'
                  ? 'bg-fire text-k-text'
                  : 'bg-k-surface text-tab-inactive hover:bg-k-muted'
              }`}
              title={viewMode === 'graph' ? 'トラックビューに戻る' : 'グラフエディタを開く (キーフレームを選択してから)'}
            >
              {/* 折れ線グラフアイコン */}
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="0.5,7.5 3,2.5 5.5,5 8,1 10.5,4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="flex-1 relative min-h-0">
        {beatFractions.length > 0 && (
          <div
            className="absolute inset-y-0 z-30 pointer-events-none"
            style={{
              left: `calc(1rem + 9rem + 0.75rem + ${PAD_X}px)`,
              right: `calc(1rem + 92px + 0.75rem + ${PAD_X}px)`,
            }}
          >
            {beatFractions.map((fraction, index) => (
              <div
                key={`body-beat-${index}`}
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${fraction * 100}%`,
                  background: index === 0 || index === beatMarkerCount
                    ? 'rgba(236,219,190,0.24)'
                    : 'rgba(209,20,2,0.34)',
                  boxShadow: index === 0 || index === beatMarkerCount
                    ? 'none'
                    : '0 0 8px rgba(209,20,2,0.18)',
                }}
              >
                <div
                  className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-display tabular-nums"
                  style={{
                    color: index === 0 || index === beatMarkerCount
                      ? 'rgba(236,219,190,0.48)'
                      : 'rgba(209,20,2,0.78)',
                  }}
                >
                  {index === beatMarkerCount ? 'END' : index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════ トラックビュー (常にDOMに保持) ═══════════ */}
        <div
          ref={tracksBodyRef}
          style={{ display: viewMode === 'track' ? 'block' : 'none' }}
          className="absolute inset-0 overflow-y-auto px-4 py-2 select-none touch-none scrollbar-thin"
          onPointerDown={isExporting ? undefined : startMarquee}
        >
            {/* 空の状態のプレースホルダー */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-[11px] text-tab-inactive opacity-50 pointer-events-none"
              style={{ display: activeTracks.length === 0 ? 'flex' : 'none' }}
            >
              プロパティを Auto または Keys にするとここへ表示されます
            </div>

            {/* トラックリスト (常にDOMに保持し、visibility で制御) */}
            <div style={{ visibility: activeTracks.length > 0 ? 'visible' : 'hidden' }}>
              {activeTracks.map((track, trackIdx) => {
                const color = GRAPH_COLORS[trackIdx % GRAPH_COLORS.length];
                const mode = getTrackMode(track);
                const group = track.group ?? getAnimationGroup(track.propertyId);
                return (
                  <div key={track.propertyId} className="flex items-center gap-3 h-7 mb-1.5 relative">
                    {/* トラックラベル */}
                    <div
                      className="w-36 flex items-center justify-between shrink-0 bg-k-bg/80 px-2 py-0.5 z-20 rounded-sm border border-k-muted/50 group/ttrack"
                      onPointerDown={e => e.stopPropagation()}
                    >
                      {/* カラーインジケータ */}
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mr-1" style={{ backgroundColor: color }} />
                      <span
                        className="flex-1 text-[10px] font-display font-semibold text-k-text/90 truncate uppercase tracking-wider"
                        title={`${group} / ${track.label}`}
                      >
                        <span className="text-tab-inactive">{group}</span>
                        <span className="px-1 text-k-muted">/</span>
                        {track.label}
                      </span>
                      <button
                        onClick={() => insertKeyframeAtCurrentTime(track.propertyId)}
                        onPointerDown={e => e.stopPropagation()}
                        className="opacity-0 group-hover/ttrack:opacity-100 p-1 text-deep hover:text-fire transition-all hover:scale-110"
                        title="現在のカーブを維持してキーフレームを挿入"
                      >
                        <div className="w-2 h-2 rotate-45 border border-fire/50 bg-fire/20 hover:bg-fire/40" />
                      </button>
                    </div>

                    {/* トラックビジュアル */}
                    <div
                      className="flex-1 h-full relative flex items-center"
                      ref={trackIdx === 0 ? el => { firstTrackVisualRef.current = el; } : undefined}
                    >
                      <div className="absolute left-0 right-0 h-[1px] bg-k-muted/20" />
                      {mode === 'auto' && (
                        <div
                          className="absolute h-3 rounded-sm border border-emerald-400/40 bg-emerald-400/10"
                          style={{ left: PAD_X, right: PAD_X }}
                          title="Auto modifier: composition durationをループ"
                        >
                          <div className="h-full w-full bg-[repeating-linear-gradient(135deg,transparent_0,transparent_5px,rgba(52,211,153,0.12)_5px,rgba(52,211,153,0.12)_7px)]" />
                        </div>
                      )}

                      {mode === 'keys' && track.keyframes.map(kf => {
                        const key        = kfKey(track.propertyId, kf.id);
                        const isSelected = selectedKfIds.has(key);
                        return (
                          <div
                            key={kf.id}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 p-1.5"
                            style={{ left: `calc(${PAD_X}px + ${kf.time} * (100% - ${PAD_X * 2}px))` }}
                            onPointerDown={e => startKfDrag(e, track.propertyId, kf)}
                            onContextMenu={e => {
                              e.preventDefault();
                              removeKeyframe(track.propertyId, kf.id);
                            }}
                            title={`${(kf.time * animation.duration).toFixed(2)}s: ${kf.value.toFixed(2)}`}
                          >
                            {kf.interpolation === 'bezier' ? (
                              <div className={`relative w-3 h-3 transition-transform ${isSelected ? 'scale-125' : 'scale-100'}`}>
                                {/* Hourglass Icon */}
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundColor: isSelected ? 'white' : color,
                                    clipPath: 'polygon(15% 0%, 85% 0%, 50% 50%, 85% 100%, 15% 100%, 50% 50%)',
                                    opacity: isSelected ? 0.9 : 0.8
                                  }}
                                />
                              </div>
                            ) : (
                              <div className={`w-2.5 h-2.5 rotate-45 border transition-transform ${
                                isSelected
                                  ? 'border-white bg-white/80 scale-125'
                                  : 'border-fire bg-fire scale-100'
                              } shadow-md shadow-black/50`}
                              />
                            )}
                          </div>
                        );
                      })}

                    </div>
                    <div className="w-[92px] shrink-0">
                      <AnimationPropertyControls
                        trackId={track.propertyId}
                        label={track.label}
                        value={getPropertyValue(track.propertyId)}
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* マルキー選択矩形 (常にDOMに保持) */}
            <div
              className="absolute pointer-events-none border border-blue-400/80 bg-blue-400/10 z-50"
              style={{ 
                left: marquee ? Math.min(marquee.sx, marquee.ex) : 0, 
                top: marquee ? Math.min(marquee.sy, marquee.ey) : 0, 
                width: marquee ? Math.abs(marquee.ex - marquee.sx) : 0, 
                height: marquee ? Math.abs(marquee.ey - marquee.sy) : 0,
                display: marquee ? 'block' : 'none'
              }}
            />
        </div>

        {/* ═══════════ グラフエディタビュー (常にDOMに保持) ═══════════ */}
        <div 
          className="absolute inset-0 flex items-stretch px-4 gap-3"
          style={{ display: viewMode === 'graph' ? 'flex' : 'none' }}
        >
            {/* 左: トラック名 + グラフ切り替えドロップダウン */}
            <div className="w-36 shrink-0 border-r border-panel-border/20 py-2 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
              <div className="text-[9px] text-tab-inactive uppercase tracking-wider mb-1 px-1">Graph Track</div>
              {graphTracks.map((track, idx) => {
                const c = GRAPH_COLORS[idx % GRAPH_COLORS.length];
                const isActive = track.propertyId === graphTrackId;
                return (
                  <div
                    key={track.propertyId}
                    onClick={() => {
                      setGraphTrackId(track.propertyId);
                      setGraphSelected(new Set());
                    }}
                    className={`flex items-center gap-1.5 px-1.5 py-1 rounded-sm text-left transition-colors cursor-pointer group/gtrack ${
                      isActive
                        ? 'bg-k-surface border border-k-muted/60'
                        : 'hover:bg-k-surface/50 border border-transparent'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                    <span className="text-[10px] font-display font-semibold text-k-text/90 truncate uppercase tracking-wider flex-1">
                      {track.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        insertKeyframeAtCurrentTime(track.propertyId);
                      }}
                      className="opacity-0 group-hover/gtrack:opacity-100 p-0.5 hover:text-fire transition-all"
                      title="現在のカーブを維持してキーフレームを挿入"
                    >
                      <div className="w-2 h-2 rotate-45 border border-fire/50 bg-fire/20 hover:bg-fire/40" />
                    </button>
                  </div>
                );              })}
            </div>

            {/* 右: グラフエディタ (常にDOMに保持) */}
            <div className="flex-1 relative">
              <div 
                className="absolute inset-0 flex items-center justify-center text-[11px] text-tab-inactive opacity-40 pointer-events-none"
                style={{ display: graphTrack ? 'none' : 'flex' }}
              >
                左のリストからトラックを選択
              </div>
              <div 
                className="absolute inset-0"
                style={{ display: graphTrack ? 'block' : 'none' }}
              >
                {graphTrack && (
                  <GraphEditor
                    track={graphTrack}
                    color={graphColor}
                    duration={animation.duration}
                    animLoopRef={animLoopRef}
                    selectedKeys={graphSelected}
                    onSelectKeyframes={setGraphSelected}
                    onSeek={onSeek}
                  />
                )}
              </div>
            </div>
            <div className="w-[92px] shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
