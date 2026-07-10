import { useState, useRef, useEffect } from 'react';
import { undo, redo } from '../lib/history';
import { useGradientStore } from '../store/gradientStore';

type Pan = { x: number; y: number };
type TouchPoint = { x: number; y: number };
type GestureFeedback = { id: number; x: number; y: number; action: 'undo' | 'redo' };

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;
const MULTI_TAP_MS = 280;
const MULTI_TAP_MOVE_PX = 14;

export function useViewportControl() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isViewportControlEnabled, setIsViewportControlEnabled] = useState(true);
  const [gestureFeedbacks, setGestureFeedbacks] = useState<GestureFeedback[]>([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const animationEnabled = useGradientStore(s => s.animation.enabled);
  const isSpacePressedRef = useRef(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const isViewportControlEnabledRef = useRef(isViewportControlEnabled);

  // タッチ/ピンチ用: pointerId → 座標
  const activeTouchPointersRef = useRef<Map<number, TouchPoint>>(new Map());
  const pinchStartRef = useRef<{
    dist: number;
    center: TouchPoint;
    mid: TouchPoint;
    zoom: number;
    pan: Pan;
  } | null>(null);
  const touchGestureRef = useRef<{
    startedAt: number;
    maxPointers: number;
    startPoints: Map<number, TouchPoint>;
    moved: boolean;
  } | null>(null);
  const viewportRafRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<{ zoom: number; pan: Pan } | null>(null);
  const feedbackIdRef = useRef(0);
  const feedbackTimeoutsRef = useRef<number[]>([]);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { isViewportControlEnabledRef.current = isViewportControlEnabled; }, [isViewportControlEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const updateEnabled = () => setIsViewportControlEnabled(query.matches);
    updateEnabled();
    query.addEventListener('change', updateEnabled);
    return () => query.removeEventListener('change', updateEnabled);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      )) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      isSpacePressedRef.current = false;
      setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // ホイールズーム + タッチパン/ピンチ
  // タッチイベントの代わりにPointer Eventsを使用し、ペン(pointerType==='pen')を除外することで
  // 板タブ使用時にポイント操作中にキャンバスが動いてしまう問題を防ぐ
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const getPinchMetrics = () => {
      const pts = Array.from(activeTouchPointersRef.current.values());
      if (pts.length !== 2) return null;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return {
        dist: Math.max(1, Math.hypot(dx, dy)),
        center: {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        },
      };
    };

    const beginPinch = () => {
      const metrics = getPinchMetrics();
      if (!metrics) {
        pinchStartRef.current = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      pinchStartRef.current = {
        dist: metrics.dist,
        center: metrics.center,
        mid: {
          x: metrics.center.x - rect.left - rect.width / 2,
          y: metrics.center.y - rect.top - rect.height / 2,
        },
        zoom: zoomRef.current,
        pan: panRef.current,
      };
    };

    const scheduleViewport = (nextZoom: number, nextPan: Pan) => {
      zoomRef.current = nextZoom;
      panRef.current = nextPan;
      pendingViewportRef.current = { zoom: nextZoom, pan: nextPan };
      if (viewportRafRef.current !== null) return;
      viewportRafRef.current = window.requestAnimationFrame(() => {
        viewportRafRef.current = null;
        const pending = pendingViewportRef.current;
        if (!pending) return;
        pendingViewportRef.current = null;
        setZoom(pending.zoom);
        setPan(pending.pan);
      });
    };

    const showGestureFeedback = (action: 'undo' | 'redo', points: Iterable<TouchPoint>) => {
      const pts = Array.from(points);
      if (pts.length === 0) return;
      const rect = el.getBoundingClientRect();
      const feedbacks = pts.map((pt): GestureFeedback => ({
        id: ++feedbackIdRef.current,
        action,
        x: pt.x - rect.left,
        y: pt.y - rect.top,
      }));
      const ids = new Set(feedbacks.map(item => item.id));
      setGestureFeedbacks(current => [...current, ...feedbacks]);
      const timeout = window.setTimeout(() => {
        setGestureFeedbacks(current => current.filter(item => !ids.has(item.id)));
      }, 720);
      feedbackTimeoutsRef.current.push(timeout);
    };

    const onWheel = (e: WheelEvent) => {
      if (!isViewportControlEnabledRef.current) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const prevZoom = zoomRef.current;
      const prevPan = panRef.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom * factor));
      const ratio = newZoom / prevZoom;
      scheduleViewport(newZoom, { x: cx - (cx - prevPan.x) * ratio, y: cy - (cy - prevPan.y) * ratio });
    };

    const handleTouchPointerDown = (e: PointerEvent) => {
      // ペンは除外（板タブ対応）
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      activeTouchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!touchGestureRef.current || activeTouchPointersRef.current.size === 1) {
        touchGestureRef.current = {
          startedAt: performance.now(),
          maxPointers: activeTouchPointersRef.current.size,
          startPoints: new Map([[e.pointerId, { x: e.clientX, y: e.clientY }]]),
          moved: false,
        };
      } else {
        touchGestureRef.current.maxPointers = Math.max(touchGestureRef.current.maxPointers, activeTouchPointersRef.current.size);
        touchGestureRef.current.startPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activeTouchPointersRef.current.size === 2) {
        beginPinch();
      } else {
        pinchStartRef.current = null;
      }
    };

    const handleTouchPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if (!activeTouchPointersRef.current.has(e.pointerId)) return;
      e.preventDefault();

      const gesture = touchGestureRef.current;
      const start = gesture?.startPoints.get(e.pointerId);
      if (gesture && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MULTI_TAP_MOVE_PX) {
        gesture.moved = true;
      }

      if (activeTouchPointersRef.current.size === 1) {
        activeTouchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      } else if (activeTouchPointersRef.current.size === 2) {
        activeTouchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (!pinchStartRef.current) beginPinch();
        const startPinch = pinchStartRef.current;
        const metrics = getPinchMetrics();
        if (!startPinch || !metrics) return;

        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, startPinch.zoom * (metrics.dist / startPinch.dist)));
        const ratio = newZoom / startPinch.zoom;
        const centerDx = metrics.center.x - startPinch.center.x;
        const centerDy = metrics.center.y - startPinch.center.y;
        const nextPan = {
          x: startPinch.mid.x - (startPinch.mid.x - startPinch.pan.x) * ratio + centerDx,
          y: startPinch.mid.y - (startPinch.mid.y - startPinch.pan.y) * ratio + centerDy,
        };
        scheduleViewport(newZoom, nextPan);
      }
    };

    const handleTouchPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      const gesture = touchGestureRef.current;
      const endedPointerCount = activeTouchPointersRef.current.size;
      activeTouchPointersRef.current.delete(e.pointerId);
      if (activeTouchPointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }
      if (activeTouchPointersRef.current.size === 0 && gesture) {
        const elapsed = performance.now() - gesture.startedAt;
        const isMultiTap =
          !gesture.moved &&
          elapsed <= MULTI_TAP_MS &&
          (gesture.maxPointers === 2 || gesture.maxPointers === 3) &&
          endedPointerCount <= gesture.maxPointers;

        if (isMultiTap) {
          if (gesture.maxPointers === 2) {
            undo();
            showGestureFeedback('undo', gesture.startPoints.values());
          }
          if (gesture.maxPointers === 3) {
            redo();
            showGestureFeedback('redo', gesture.startPoints.values());
          }
        }
        touchGestureRef.current = null;
      }
    };

    const handleTouchPointerCancel = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      activeTouchPointersRef.current.delete(e.pointerId);
      if (activeTouchPointersRef.current.size === 0) touchGestureRef.current = null;
      if (activeTouchPointersRef.current.size < 2) {
        pinchStartRef.current = null;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', handleTouchPointerDown);
    el.addEventListener('pointermove', handleTouchPointerMove, { passive: false });
    el.addEventListener('pointerup', handleTouchPointerUp);
    el.addEventListener('pointercancel', handleTouchPointerCancel);

    return () => {
      if (viewportRafRef.current !== null) {
        window.cancelAnimationFrame(viewportRafRef.current);
        viewportRafRef.current = null;
      }
      feedbackTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
      feedbackTimeoutsRef.current = [];
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', handleTouchPointerDown);
      el.removeEventListener('pointermove', handleTouchPointerMove);
      el.removeEventListener('pointerup', handleTouchPointerUp);
      el.removeEventListener('pointercancel', handleTouchPointerCancel);
    };
  }, []);

  function handleMiddleDown(e: React.MouseEvent) {
    const isSpaceDrag = isSpacePressedRef.current && !animationEnabled && e.button === 0;
    if (e.button !== 1 && !isSpaceDrag) return;
    e.preventDefault();
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    setIsDragging(true);
  }

  function handleMiddleMove(e: React.MouseEvent) {
    if (!panStartRef.current) return;
    setPan({
      x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
      y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
    });
  }

  function handleMiddleUp(e: React.MouseEvent) {
    if (e.button === 1 || e.button === 0) {
      panStartRef.current = null;
      setIsDragging(false);
    }
  }

  function handleMiddleLeave() {
    panStartRef.current = null;
    setIsDragging(false);
  }

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const cursor = isDragging 
    ? 'grabbing' 
    : (isSpacePressed && !animationEnabled ? 'grab' : 'default');

  return {
    viewportRef,
    zoom,
    pan,
    gestureFeedbacks,
    isViewportControlEnabled,
    handleMiddleDown,
    handleMiddleMove,
    handleMiddleUp,
    handleMiddleLeave,
    resetViewport,
    cursor,
  };
}
