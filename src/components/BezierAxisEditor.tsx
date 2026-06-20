import { useEffect, useRef, useState, useMemo } from 'react';
import { useGradientStore, GRADIENT_ANCHOR_DEFAULTS } from '../store/gradientStore';
import { ANCHOR_RADIUS, CP_RADIUS, HIT_RADIUS, PATH_HIT_PX, PATH_SAMPLES, EDGE_PAD } from '../lib/constants';
import { cubicBezierPt, splitBezier, calcCentroid, applyRotate, applyScale, applyGrab } from '../lib/bezierTransforms';
import { interpolateKeyframes } from '../lib/keyframeInterpolator';
import type { BezierAnchor, BezierPath } from '../types/distortion';
import type { GradientConfig } from '../types/gradient';

type Props = {
  width: number;
  height: number;
  showOverlay?: boolean;
};

type DragPart = 'anchor' | 'cp1' | 'cp2' | 'anchor-handle';
type DragTarget = { pathId: string; index: number; part: DragPart };
type RectSelect = { startX: number; startY: number; currentX: number; currentY: number };
type ScaleMode = {
  pathId: string;
  center: [number, number];
  refDist: number;
  snapshot: BezierAnchor[];
  indices: Set<number>;
  targetCp: 'cp1' | 'cp2' | null;
};
type RotateMode = {
  pathId: string;
  center: [number, number];
  refAngle: number;
  refDist: number;
  snapshot: BezierAnchor[];
  indices: Set<number>;
  targetCp: 'cp1' | 'cp2' | null;
  initialHandleAngle: number;
  totalDelta: number;
  lastMouseAngle: number;
};
type GrabMode = {
  pathId: string;
  startPos: [number, number];
  displayCenter: [number, number];
  snapshot: BezierAnchor[];
  indices: Set<number>;
  constraint: 'free' | 'x' | 'y';
  targetCp: 'cp1' | 'cp2' | null;
  snapX: number | null;
  snapY: number | null;
};
type GradientAnchors = NonNullable<GradientConfig['anchors']>;
type GradientGrabMode = {
  startPos: [number, number];
  displayCenter: [number, number];
  snapshot: GradientAnchors;
  indices: Set<number>;
  constraint: 'free' | 'x' | 'y';
};

export function BezierAxisEditor({ width, height, showOverlay = true }: Props) {
  const { bezierAxis, setBezierAxis, isSlitAdjusting, gradient, animation, keyframeTracks, currentTime, selectedGradientAnchors, setSelectedGradientAnchors } = useGradientStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef<DragTarget | null>(null);
  const didDragRef = useRef(false);
  const justCreatedRef = useRef(false);

  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectedCp, setSelectedCp] = useState<{ index: number; part: 'cp1' | 'cp2' } | null>(null);
  const [pathHover, setPathHover] = useState<{ pathId: string; pos: [number, number] } | null>(null);
  const [rectSelect, setRectSelect] = useState<RectSelect | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode | null>(null);
  const scaleModeRef = useRef<ScaleMode | null>(null);
  const [rotateMode, setRotateMode] = useState<RotateMode | null>(null);
  const rotateModeRef = useRef<RotateMode | null>(null);
  const [grabMode, setGrabMode] = useState<GrabMode | null>(null);
  const grabModeRef = useRef<GrabMode | null>(null);
  const [gradientGrabMode, setGradientGrabMode] = useState<GradientGrabMode | null>(null);
  const gradientGrabModeRef = useRef<GradientGrabMode | null>(null);
  const isShiftPressedRef = useRef(false);
  const [lastPointerType, setLastPointerType] = useState<string>('mouse');

  const currentPosRef = useRef<[number, number]>([0.5, 0.5]);
  const multiDragStartRef = useRef<BezierAnchor[] | null>(null);
  const multiDragOriginRef = useRef<[number, number] | null>(null);
  const isDraggingMultiRef = useRef(false);
  const rectSelectIsAdditiveRef = useRef(false);

  const bezierAxisRef = useRef(bezierAxis);
  bezierAxisRef.current = bezierAxis;
  const setBezierAxisRef = useRef(setBezierAxis);
  setBezierAxisRef.current = setBezierAxis;
  const activePathIdRef = useRef(activePathId);
  activePathIdRef.current = activePathId;
  const selectedIndicesRef = useRef(selectedIndices);
  selectedIndicesRef.current = selectedIndices;
  const selectedIdxRef = useRef(selectedIdx);
  selectedIdxRef.current = selectedIdx;
  const selectedCpRef = useRef(selectedCp);
  selectedCpRef.current = selectedCp;
  const selectedGradientAnchorsRef = useRef(selectedGradientAnchors);
  selectedGradientAnchorsRef.current = selectedGradientAnchors;

  useEffect(() => {
    const rememberPointerType = (e: PointerEvent) => {
      const nextType = e.pointerType || 'mouse';
      setLastPointerType(prev => prev === nextType ? prev : nextType);
    };
    window.addEventListener('pointerdown', rememberPointerType, true);
    window.addEventListener('pointermove', rememberPointerType, true);
    return () => {
      window.removeEventListener('pointerdown', rememberPointerType, true);
      window.removeEventListener('pointermove', rememberPointerType, true);
    };
  }, []);

  const activePath = useMemo(() => 
    bezierAxis.paths.find(p => p.id === activePathId) || null
  , [bezierAxis.paths, activePathId]);
  const closeTogglePath = activePath ?? bezierAxis.paths[0] ?? null;

  const updatePath = (pathId: string, anchors: BezierAnchor[], closed?: boolean) => {
    const nextPaths = bezierAxisRef.current.paths.map(p => 
      p.id === pathId ? { ...p, anchors, closed: closed ?? p.closed } : p
    );
    setBezierAxisRef.current({ paths: nextPaths });
  };

  const updateGradientAnchors = (anchors: GradientAnchors) => {
    useGradientStore.getState().setGradient({ anchors });
  };

  const applyGradientGrab = (mode: GradientGrabMode, pos: [number, number]) => {
    let dx = pos[0] - mode.startPos[0];
    let dy = pos[1] - mode.startPos[1];
    if (mode.constraint === 'x') dy = 0;
    if (mode.constraint === 'y') dx = 0;
    const next = mode.snapshot.map((anchor, index) => {
      if (!mode.indices.has(index)) return [anchor[0], anchor[1]] as [number, number];
      return [
        anchor[0] + dx,
        anchor[1] - dy,
      ] as [number, number];
    }) as GradientAnchors;
    updateGradientAnchors(next);
  };

  const startGradientGrab = () => {
    const state = useGradientStore.getState();
    const numAnchors = state.gradient.gradientType === 'fourcolor' ? 4 : 2;
    const indices = new Set(selectedGradientAnchorsRef.current.filter((index) => index >= 0 && index < numAnchors));
    if (indices.size === 0) return false;

    const sourceAnchors = state.gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[state.gradient.gradientType ?? 'linear'];
    const snapshot = sourceAnchors.map((anchor) => [anchor[0], anchor[1]] as [number, number]) as GradientAnchors;
    const selected = [...indices].map((index) => snapshot[index]);
    const displayCenter: [number, number] = [
      selected.reduce((sum, anchor) => sum + anchor[0], 0) / selected.length,
      selected.reduce((sum, anchor) => sum + (1 - anchor[1]), 0) / selected.length,
    ];
    const mode: GradientGrabMode = {
      startPos: currentPosRef.current,
      displayCenter,
      snapshot,
      indices,
      constraint: 'free',
    };
    gradientGrabModeRef.current = mode;
    setGradientGrabMode(mode);
    return true;
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (canvasRef.current && e.target !== canvasRef.current) {
        if (scaleModeRef.current) {
          updatePath(scaleModeRef.current.pathId, scaleModeRef.current.snapshot);
          scaleModeRef.current = null;
          setScaleMode(null);
        }
        if (rotateModeRef.current) {
          updatePath(rotateModeRef.current.pathId, rotateModeRef.current.snapshot);
          rotateModeRef.current = null;
          setRotateMode(null);
        }
        if (grabModeRef.current) {
          updatePath(grabModeRef.current.pathId, grabModeRef.current.snapshot);
          grabModeRef.current = null;
          setGrabMode(null);
        }
        if (gradientGrabModeRef.current) {
          if (e.button === 2) updateGradientAnchors(gradientGrabModeRef.current.snapshot);
          gradientGrabModeRef.current = null;
          setGradientGrabMode(null);
        }
        setSelectedIdx(null);
        setSelectedIndices(new Set());
        setSelectedCp(null);
        setSelectedGradientAnchors([]);
        setActivePathId(null);
      }
    };
    window.addEventListener('mousedown', onDocMouseDown);
    return () => window.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!rectSelect) return;
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, [rectSelect]);

  useEffect(() => {
    if (activePath && selectedIdx !== null && selectedIdx >= activePath.anchors.length) {
      setSelectedIdx(null);
    }
    setSelectedIndices((prev) => {
      const next = new Set<number>();
      if (!activePath) return next;
      for (const i of prev) if (i < activePath.anchors.length) next.add(i);
      return next;
    });
  }, [activePath?.anchors.length, selectedIdx]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressedRef.current = true;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const path = activePathIdRef.current ? bezierAxisRef.current.paths.find(p => p.id === activePathIdRef.current) : null;
      const hasBezierSelection = !!path && (selectedCpRef.current !== null || selectedIndicesRef.current.size > 0 || selectedIdxRef.current !== null);
      if ((e.key === 'g' || e.key === 'G') && !hasBezierSelection && selectedGradientAnchorsRef.current.length > 0) {
        if (scaleModeRef.current || rotateModeRef.current || grabModeRef.current || gradientGrabModeRef.current) return;
        if (startGradientGrab()) return;
      }

      if (gradientGrabModeRef.current && (e.key === 'Escape')) {
        updateGradientAnchors(gradientGrabModeRef.current.snapshot);
        gradientGrabModeRef.current = null;
        setGradientGrabMode(null);
        return;
      }

      if (gradientGrabModeRef.current && e.key === 'Enter') {
        gradientGrabModeRef.current = null;
        setGradientGrabMode(null);
        return;
      }

      if (gradientGrabModeRef.current && (e.key === 'x' || e.key === 'X' || e.key === 'y' || e.key === 'Y')) {
        const axis = (e.key === 'x' || e.key === 'X') ? 'x' : 'y';
        const newConstraint = gradientGrabModeRef.current.constraint === axis ? 'free' : axis;
        gradientGrabModeRef.current = { ...gradientGrabModeRef.current, constraint: newConstraint };
        setGradientGrabMode(gradientGrabModeRef.current);
        applyGradientGrab(gradientGrabModeRef.current, currentPosRef.current);
        return;
      }

      if (!path) {
        // 全選択 A キーなどはパス未選択でも動くようにするか検討
        if ((e.key === 'a' || e.key === 'A') && bezierAxisRef.current.paths.length > 0) {
           setActivePathId(bezierAxisRef.current.paths[0].id);
           const all = new Set(bezierAxisRef.current.paths[0].anchors.map((_, i) => i));
           setSelectedIndices(all);
        }
        return;
      }

      if (e.key === 's' || e.key === 'S') {
        if (rotateModeRef.current) return;
        const cp = selectedCpRef.current;
        const indices = selectedIndicesRef.current;
        const anchors = path.anchors;
        let effectiveIndices: Set<number>;
        let center: [number, number];
        let targetCp: 'cp1' | 'cp2' | null = null;
        if (cp !== null && cp.index < anchors.length) {
          effectiveIndices = new Set([cp.index]);
          center = [anchors[cp.index].x, anchors[cp.index].y];
          targetCp = cp.part;
        } else if (indices.size >= 2) {
          effectiveIndices = indices;
          center = calcCentroid(anchors, indices);
        } else if (indices.size === 1) {
          const idx = [...indices][0];
          effectiveIndices = new Set([idx]);
          center = [anchors[idx].x, anchors[idx].y];
        } else if (selectedIdxRef.current !== null && selectedIdxRef.current < anchors.length) {
          const idx = selectedIdxRef.current;
          effectiveIndices = new Set([idx]);
          center = [anchors[idx].x, anchors[idx].y];
        } else return;

        const [mx, my] = currentPosRef.current;
        const dx = (mx - center[0]) * width;
        const dy = (my - center[1]) * height;
        const refDist = Math.max(Math.hypot(dx, dy), 10);
        const snapshot = anchors.map((a) => ({ ...a, cp1: [...a.cp1], cp2: [...a.cp2] } as BezierAnchor));
        const mode: ScaleMode = { pathId: path.id, center, refDist, snapshot, indices: effectiveIndices, targetCp };
        scaleModeRef.current = mode;
        setScaleMode(mode);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        if (scaleModeRef.current) return;
        const cp = selectedCpRef.current;
        const indices = selectedIndicesRef.current;
        const anchors = path.anchors;
        let effectiveIndices: Set<number>;
        let center: [number, number];
        let targetCp: 'cp1' | 'cp2' | null = null;
        let initialHandleAngle = 0;

        if (cp !== null && cp.index < anchors.length) {
          effectiveIndices = new Set([cp.index]);
          const a = anchors[cp.index];
          center = [a.x, a.y];
          targetCp = cp.part;
          const pos = targetCp === 'cp1' ? a.cp1 : a.cp2;
          initialHandleAngle = Math.atan2((pos[1] - a.y) * height, (pos[0] - a.x) * width);
        } else if (indices.size >= 2) {
          effectiveIndices = indices;
          center = calcCentroid(anchors, indices);
          const a = anchors[[...indices][0]];
          initialHandleAngle = Math.atan2((a.cp2[1] - a.y) * height, (a.cp2[0] - a.x) * width);
        } else if (indices.size === 1) {
          const idx = [...indices][0];
          effectiveIndices = new Set([idx]);
          const a = anchors[idx];
          center = [a.x, a.y];
          initialHandleAngle = Math.atan2((a.cp2[1] - a.y) * height, (a.cp2[0] - a.x) * width);
        } else if (selectedIdxRef.current !== null && selectedIdxRef.current < anchors.length) {
          const idx = selectedIdxRef.current;
          effectiveIndices = new Set([idx]);
          const a = anchors[idx];
          center = [a.x, a.y];
          initialHandleAngle = Math.atan2((a.cp2[1] - a.y) * height, (a.cp2[0] - a.x) * width);
        } else return;

        const [mx, my] = currentPosRef.current;
        const dx = (mx - center[0]) * width;
        const dy = (my - center[1]) * height;
        const refDist = Math.max(Math.hypot(dx, dy), 10);
        const refAngle = Math.atan2(dy, dx);
        const snapshot = anchors.map((a) => ({ ...a, cp1: [...a.cp1], cp2: [...a.cp2] } as BezierAnchor));
        const mode: RotateMode = { pathId: path.id, center, refAngle, refDist, snapshot, indices: effectiveIndices, targetCp, initialHandleAngle, totalDelta: 0, lastMouseAngle: refAngle };
        rotateModeRef.current = mode;
        setRotateMode(mode);
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        if (scaleModeRef.current || rotateModeRef.current || gradientGrabModeRef.current) return;
        const cp = selectedCpRef.current;
        const indices = selectedIndicesRef.current;
        const anchors = path.anchors;
        let effectiveIndices: Set<number>;
        let displayCenter: [number, number];
        let targetCp: 'cp1' | 'cp2' | null = null;

        if (cp !== null && cp.index < anchors.length) {
          effectiveIndices = new Set([cp.index]);
          displayCenter = [anchors[cp.index].x, anchors[cp.index].y];
          targetCp = cp.part;
        } else if (indices.size >= 2) {
          effectiveIndices = indices;
          displayCenter = calcCentroid(anchors, indices);
        } else if (indices.size === 1) {
          const idx = [...indices][0];
          effectiveIndices = new Set([idx]);
          displayCenter = [anchors[idx].x, anchors[idx].y];
        } else if (selectedIdxRef.current !== null && selectedIdxRef.current < anchors.length) {
          const idx = selectedIdxRef.current;
          effectiveIndices = new Set([idx]);
          displayCenter = [anchors[idx].x, anchors[idx].y];
        } else return;

        const startPos = currentPosRef.current;
        const snapshot = anchors.map((a) => ({ ...a, cp1: [...a.cp1], cp2: [...a.cp2] } as BezierAnchor));
        const mode: GrabMode = { pathId: path.id, startPos, displayCenter, snapshot, indices: effectiveIndices, constraint: 'free', targetCp, snapX: null, snapY: null };
        grabModeRef.current = mode;
        setGrabMode(mode);
        return;
      }

      if (e.key === 'Escape') {
        if (scaleModeRef.current) { updatePath(scaleModeRef.current.pathId, scaleModeRef.current.snapshot); scaleModeRef.current = null; setScaleMode(null); return; }
        if (rotateModeRef.current) { updatePath(rotateModeRef.current.pathId, rotateModeRef.current.snapshot); rotateModeRef.current = null; setRotateMode(null); return; }
        if (grabModeRef.current) { updatePath(grabModeRef.current.pathId, grabModeRef.current.snapshot); grabModeRef.current = null; setGrabMode(null); }
        if (gradientGrabModeRef.current) { updateGradientAnchors(gradientGrabModeRef.current.snapshot); gradientGrabModeRef.current = null; setGradientGrabMode(null); }
        return;
      }

      if (e.key === 'Enter') {
        scaleModeRef.current = null; setScaleMode(null);
        rotateModeRef.current = null; setRotateMode(null);
        grabModeRef.current = null; setGrabMode(null);
        return;
      }

      if (grabModeRef.current && (e.key === 'x' || e.key === 'X' || e.key === 'y' || e.key === 'Y')) {
        const axis = (e.key === 'x' || e.key === 'X') ? 'x' : 'y';
        const newConstraint = grabModeRef.current.constraint === axis ? 'free' : axis;
        grabModeRef.current = { ...grabModeRef.current, constraint: newConstraint };
        setGrabMode(grabModeRef.current);
        const [nx, ny] = currentPosRef.current;
        const mode = grabModeRef.current;
        let dx = nx - mode.startPos[0];
        let dy = ny - mode.startPos[1];
        if (newConstraint === 'x') dy = 0;
        if (newConstraint === 'y') dx = 0;
        updatePath(mode.pathId, applyGrab(mode.snapshot, mode.indices, dx, dy, mode.targetCp));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'x' || e.key === 'X') {
        if (scaleModeRef.current || rotateModeRef.current || grabModeRef.current || gradientGrabModeRef.current) return;
        const indices = selectedIndicesRef.current;
        if (indices.size > 0) {
          const newAnchors = path.anchors.filter((_, i) => !indices.has(i));
          if (newAnchors.length === 0) {
            setBezierAxis({ paths: bezierAxisRef.current.paths.filter(p => p.id !== path.id) });
            setActivePathId(null);
          } else {
            updatePath(path.id, newAnchors);
          }
          setSelectedIndices(new Set());
          setSelectedIdx(null);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') isShiftPressedRef.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width + 2 * EDGE_PAD, height + 2 * EDGE_PAD);
    if (!showOverlay || !bezierAxis.enabled) return;

    ctx.save();
    ctx.translate(EDGE_PAD, EDGE_PAD);

    bezierAxis.paths.forEach(path => {
      const anchors = path.anchors;
      const isActive = path.id === activePathId;

      if (anchors.length > 0) {
        ctx.save();
        ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        if (!isActive) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let i = 0; i < anchors.length; i++) {
          const a = anchors[i];
          if (i === 0) ctx.moveTo(a.x * width, a.y * height);
          else {
            const prev = anchors[i - 1];
            ctx.bezierCurveTo(prev.cp2[0] * width, prev.cp2[1] * height, a.cp1[0] * width, a.cp1[1] * height, a.x * width, a.y * height);
          }
        }
        if (path.closed && anchors.length >= 2) {
          const a = anchors[0];
          const prev = anchors[anchors.length - 1];
          ctx.bezierCurveTo(prev.cp2[0] * width, prev.cp2[1] * height, a.cp1[0] * width, a.cp1[1] * height, a.x * width, a.y * height);
        }
        ctx.stroke();
        ctx.restore();

        if (isActive) {
          for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i];
            const ax = a.x * width, ay = a.y * height;
            const isSelected = i === selectedIdx || selectedIndices.has(i);
            const isMultiSelected = selectedIndices.has(i) && selectedIndices.size > 1;

            for (const [cpx, cpy, cpPart] of [[a.cp1[0], a.cp1[1], 'cp1'], [a.cp2[0], a.cp2[1], 'cp2']] as const) {
              if (Math.hypot((cpx - a.x) * width, (cpy - a.y) * height) < 0.5) continue;
              ctx.save();
              ctx.strokeStyle = 'rgba(255,220,50,0.7)';
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cpx * width, cpy * height); ctx.stroke();
              ctx.fillStyle = '#ffd632';
              ctx.beginPath(); ctx.arc(cpx * width, cpy * height, CP_RADIUS, 0, Math.PI * 2); ctx.fill();
              if (selectedCp?.index === i && selectedCp.part === cpPart) {
                ctx.strokeStyle = scaleMode ? '#a855f7' : rotateMode ? '#f59e0b' : '#22c55e';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cpx * width, cpy * height, CP_RADIUS + 4, 0, Math.PI * 2); ctx.stroke();
              }
              ctx.restore();
            }

            ctx.save();
            if (isSelected) {
              const isInScaleMode = scaleMode !== null && scaleMode.indices.has(i);
              const isInRotateMode = rotateMode !== null && rotateMode.indices.has(i);
              const isInGrabMode = grabMode !== null && grabMode.indices.has(i);
              ctx.strokeStyle = isInScaleMode ? '#a855f7' : isInRotateMode ? '#f59e0b' : isInGrabMode ? '#06b6d4' : isMultiSelected ? '#f97316' : '#3b82f6';
              ctx.lineWidth = 3;
              ctx.beginPath(); ctx.arc(ax, ay, ANCHOR_RADIUS + 4, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(ax, ay, ANCHOR_RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
          }
        }
      }
    });

    if (pathHover) {
      const { pos: [px, py] } = pathHover;
      ctx.save();
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px * width, py * height, ANCHOR_RADIUS + 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(px * width, py * height, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (rectSelect) {
      const rx = Math.min(rectSelect.startX, rectSelect.currentX) * width;
      const ry = Math.min(rectSelect.startY, rectSelect.currentY) * height;
      const rw = Math.abs(rectSelect.currentX - rectSelect.startX) * width;
      const rh = Math.abs(rectSelect.currentY - rectSelect.startY) * height;
      ctx.save();
      ctx.strokeStyle = 'rgba(99,179,237,0.9)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = 'rgba(99,179,237,0.1)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.restore();
    }

    if (scaleMode) {
      const [cx, cy] = scaleMode.center;
      const sx = cx * width, sy = cy * height;
      const [mx, my] = currentPosRef.current;
      const currentDist = Math.hypot((mx - cx) * width, (my - cy) * height);
      const scale = currentDist / scaleMode.refDist;
      ctx.save();
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
      const cs = 8;
      ctx.beginPath(); ctx.moveTo(sx - cs, sy); ctx.lineTo(sx + cs, sy); ctx.moveTo(sx, sy - cs); ctx.lineTo(sx, sy + cs); ctx.stroke();
      ctx.strokeStyle = 'rgba(168,85,247,0.4)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(sx, sy, scaleMode.refDist, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(168,85,247,0.9)'; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(sx, sy, currentDist, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#a855f7'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`× ${scale.toFixed(3)}`, sx + 10, sy - 10);
      ctx.restore();
    }

    if (rotateMode) {
      const [cx, cy] = rotateMode.center;
      const sx = cx * width, sy = cy * height;
      const [mx, my] = currentPosRef.current;
      const dx = (mx - cx) * width, dy = (my - cy) * height;
      const currentMouseAngle = Math.atan2(dy, dx);
      let stepDelta = currentMouseAngle - rotateMode.lastMouseAngle;
      if (stepDelta > Math.PI) stepDelta -= 2 * Math.PI;
      if (stepDelta < -Math.PI) stepDelta += 2 * Math.PI;
      const tempTotalDelta = rotateMode.totalDelta + stepDelta;
      let finalDelta = tempTotalDelta;
      let targetHandleAngle = rotateMode.initialHandleAngle + finalDelta;
      const targetDeg = (targetHandleAngle * 180 / Math.PI);
      if (isShiftPressedRef.current) {
        const s10 = Math.round(targetDeg / 10) * 10, s45 = Math.round(targetDeg / 45) * 45;
        const d10 = Math.abs(targetDeg - s10), d45 = Math.abs(targetDeg - s45);
        finalDelta = ((d45 < d10 ? s45 : s10) * Math.PI / 180) - rotateMode.initialHandleAngle;
        targetHandleAngle = rotateMode.initialHandleAngle + finalDelta;
      } else {
        const s45 = Math.round(targetDeg / 45) * 45;
        if (Math.abs(targetDeg - s45) < 3.0) {
          finalDelta = (s45 * Math.PI / 180) - rotateMode.initialHandleAngle;
          targetHandleAngle = rotateMode.initialHandleAngle + finalDelta;
        }
      }
      const refR = rotateMode.refDist;
      ctx.save();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
      const cs = 8;
      ctx.beginPath(); ctx.moveTo(sx - cs, sy); ctx.lineTo(sx + cs, sy); ctx.moveTo(sx, sy - cs); ctx.lineTo(sx, sy + cs); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,158,11,0.4)'; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(rotateMode.initialHandleAngle) * refR, sy + Math.sin(rotateMode.initialHandleAngle) * refR); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, refR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,158,11,0.9)'; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(targetHandleAngle) * refR, sy + Math.sin(targetHandleAngle) * refR); ctx.stroke();
      ctx.strokeStyle = 'rgba(245,158,11,0.7)';
      ctx.beginPath(); ctx.arc(sx, sy, Math.min(refR * 0.5, 40), rotateMode.initialHandleAngle, targetHandleAngle, finalDelta < 0); ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px monospace';
      const dDeg = (finalDelta * 180 / Math.PI);
      ctx.fillText(`${dDeg > 0 ? '+' : ''}${dDeg.toFixed(1)}°`, sx + 10, sy - 10);
      ctx.restore();
    }

    if (grabMode) {
      const { displayCenter, startPos, constraint, snapshot, indices, targetCp, snapX, snapY } = grabMode;
      const [cx, cy] = displayCenter;
      const [startX, startY] = startPos;
      const [mx, my] = currentPosRef.current;
      let gx = cx, gy = cy;
      if (indices.size === 1 && targetCp) {
        const a = snapshot[[...indices][0]];
        const cpPos = targetCp === 'cp1' ? a.cp1 : a.cp2;
        gx = cpPos[0]; gy = cpPos[1];
      }
      const sx = gx * width, sy = gy * height;
      ctx.save();
      if (snapX !== null) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(snapX * width, 0); ctx.lineTo(snapX * width, height); ctx.stroke(); }
      if (snapY !== null) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, snapY * height); ctx.lineTo(width, snapY * height); ctx.stroke(); }
      if (constraint === 'x') { ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(width, sy); ctx.stroke(); }
      else if (constraint === 'y') { ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, height); ctx.stroke(); }
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      const cs = 8;
      ctx.beginPath(); ctx.moveTo(sx - cs, sy); ctx.lineTo(sx + cs, sy); ctx.moveTo(sx, sy - cs); ctx.lineTo(sx, sy + cs); ctx.stroke();
      const dxRel = constraint === 'y' ? 0 : (mx - startX), dyRel = constraint === 'x' ? 0 : (my - startY);
      ctx.strokeStyle = 'rgba(6,182,212,0.7)'; ctx.setLineDash([4, 3]);
      indices.forEach(idx => {
        const a = snapshot[idx];
        const [x, y] = targetCp === 'cp1' ? a.cp1 : targetCp === 'cp2' ? a.cp2 : [a.x, a.y];
        ctx.beginPath(); ctx.moveTo(x * width, y * height); ctx.lineTo((x + dxRel) * width, (y + dyRel) * height); ctx.stroke();
      });
      ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`Δ${(dxRel * width).toFixed(1)}, ${(dyRel * height).toFixed(1)}px${constraint !== 'free' ? ' [' + constraint.toUpperCase() + ']' : ''}`, sx + 10, sy - 10);
      ctx.restore();
    }
    if (gradientGrabMode) {
      const { displayCenter, startPos, constraint, snapshot, indices } = gradientGrabMode;
      const [cx, cy] = displayCenter;
      const [startX, startY] = startPos;
      const [mx, my] = currentPosRef.current;
      const dxRel = constraint === 'y' ? 0 : (mx - startX);
      const dyRel = constraint === 'x' ? 0 : (my - startY);
      const sx = cx * width, sy = cy * height;
      ctx.save();
      if (constraint === 'x') { ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(width, sy); ctx.stroke(); }
      else if (constraint === 'y') { ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.setLineDash([6, 3]); ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, height); ctx.stroke(); }
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      const cs = 8;
      ctx.beginPath(); ctx.moveTo(sx - cs, sy); ctx.lineTo(sx + cs, sy); ctx.moveTo(sx, sy - cs); ctx.lineTo(sx, sy + cs); ctx.stroke();
      ctx.strokeStyle = 'rgba(239,68,68,0.75)'; ctx.setLineDash([4, 3]);
      indices.forEach((idx) => {
        const anchor = snapshot[idx];
        const x = anchor[0];
        const y = 1 - anchor[1];
        ctx.beginPath(); ctx.moveTo(x * width, y * height); ctx.lineTo((x + dxRel) * width, (y + dyRel) * height); ctx.stroke();
      });
      ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`Δ${(dxRel * width).toFixed(1)}, ${(dyRel * height).toFixed(1)}px${constraint !== 'free' ? ' [' + constraint.toUpperCase() + ']' : ''}`, sx + 10, sy - 10);
      ctx.restore();
    }
    ctx.restore();
  }, [bezierAxis, gradient, width, height, activePathId, selectedIdx, selectedIndices, selectedCp, pathHover, showOverlay, rectSelect, scaleMode, rotateMode, grabMode, gradientGrabMode]);

  function getCanvasPosFromClient(clientX: number, clientY: number): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = rect.width / (width + 2 * EDGE_PAD), scaleY = rect.height / (height + 2 * EDGE_PAD);
    return [((clientX - rect.left) / scaleX - EDGE_PAD) / width, ((clientY - rect.top) / scaleY - EDGE_PAD) / height];
  }

  function getCanvasPos(e: React.PointerEvent | React.MouseEvent): [number, number] {
    return getCanvasPosFromClient(e.clientX, e.clientY);
  }

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!gradientGrabModeRef.current || !canvasRef.current) return;
      const pos = getCanvasPosFromClient(e.clientX, e.clientY);
      currentPosRef.current = pos;
      applyGradientGrab(gradientGrabModeRef.current, pos);
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [width, height]);

  function findHitTarget(nx: number, ny: number): DragTarget | null {
    const hitNX = HIT_RADIUS / width, hitNY = HIT_RADIUS / height;
    // アクティブなパスを優先
    if (activePath) {
      for (let i = 0; i < activePath.anchors.length; i++) {
        const a = activePath.anchors[i];
        if (Math.abs(nx - a.x) < hitNX && Math.abs(ny - a.y) < hitNY) return { pathId: activePath.id, index: i, part: 'anchor' };
        if (Math.abs(nx - a.cp1[0]) < hitNX && Math.abs(ny - a.cp1[1]) < hitNY) return { pathId: activePath.id, index: i, part: 'cp1' };
        if (Math.abs(nx - a.cp2[0]) < hitNX && Math.abs(ny - a.cp2[1]) < hitNY) return { pathId: activePath.id, index: i, part: 'cp2' };
      }
    }
    // 他のパス
    for (const path of bezierAxis.paths) {
      if (path.id === activePathId) continue;
      for (let i = 0; i < path.anchors.length; i++) {
        const a = path.anchors[i];
        if (Math.abs(nx - a.x) < hitNX && Math.abs(ny - a.y) < hitNY) return { pathId: path.id, index: i, part: 'anchor' };
      }
    }
    return null;
  }

  function findPathHit(nx: number, ny: number): { pathId: string; segIndex: number; t: number } | null {
    let best: { pathId: string; segIndex: number; t: number; dist: number } | null = null;
    for (const path of bezierAxis.paths) {
      const anchors = path.anchors;
      const numSegments = path.closed && anchors.length >= 2 ? anchors.length : anchors.length - 1;
      for (let s = 0; s < numSegments; s++) {
        const a = anchors[s], b = anchors[(s + 1) % anchors.length];
        for (let i = 0; i <= PATH_SAMPLES; i++) {
          const t = i / PATH_SAMPLES;
          const [bx, by] = cubicBezierPt([a.x, a.y], [a.cp2[0], a.cp2[1]], [b.cp1[0], b.cp1[1]], [b.x, b.y], t);
          const dist = Math.hypot((nx - bx) * width, (ny - by) * height);
          if (!best || dist < best.dist) best = { pathId: path.id, segIndex: s, t, dist };
        }
      }
    }
    return best && best.dist < PATH_HIT_PX ? best : null;
  }

  const handlePointerActivity = (e: React.PointerEvent) => {
    const nextType = e.pointerType || 'mouse';
    setLastPointerType(prev => prev === nextType ? prev : nextType);
  };

  const handleMouseDown = (e: React.PointerEvent) => {
    handlePointerActivity(e);
    if (!bezierAxis.enabled) return;
    const [nx, ny] = getCanvasPos(e);
    if ((scaleMode || rotateMode || grabMode || gradientGrabMode) && e.button === 0) { setScaleMode(null); setRotateMode(null); setGrabMode(null); setGradientGrabMode(null); scaleModeRef.current = rotateModeRef.current = grabModeRef.current = null; gradientGrabModeRef.current = null; return; }
    if ((scaleMode || rotateMode || grabMode || gradientGrabMode) && e.button === 2) {
      e.preventDefault();
      const mode = scaleMode || rotateMode || grabMode;
      if (mode) updatePath(mode.pathId, mode.snapshot);
      if (gradientGrabModeRef.current) updateGradientAnchors(gradientGrabModeRef.current.snapshot);
      setScaleMode(null); setRotateMode(null); setGrabMode(null); setGradientGrabMode(null); scaleModeRef.current = rotateModeRef.current = grabModeRef.current = null; gradientGrabModeRef.current = null; return;
    }
    if (e.button === 2) { e.preventDefault(); rectSelectIsAdditiveRef.current = e.shiftKey; setRectSelect({ startX: nx, startY: ny, currentX: nx, currentY: ny }); isDraggingMultiRef.current = false; return; }
    if (e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    didDragRef.current = justCreatedRef.current = false;
    const hit = findHitTarget(nx, ny);

    if (hit) {
      setActivePathId(hit.pathId);
      if (hit.part === 'anchor' && selectedIndices.has(hit.index) && selectedIndices.size > 1) {
        const path = bezierAxis.paths.find(p => p.id === hit.pathId)!;
        multiDragStartRef.current = path.anchors.map(a => ({ ...a, cp1: [...a.cp1], cp2: [...a.cp2] } as BezierAnchor));
        multiDragOriginRef.current = [nx, ny];
        isDraggingMultiRef.current = true;
        return;
      }
      if (hit.part === 'anchor' && !selectedIndices.has(hit.index)) { setSelectedIndices(new Set()); setSelectedCp(null); }
      if (e.altKey && hit.part === 'anchor') { draggingRef.current = { ...hit, part: 'anchor-handle' }; setSelectedIdx(hit.index); return; }
      if (e.altKey && (hit.part === 'cp1' || hit.part === 'cp2')) {
        setActivePathId(hit.pathId);
        const path = bezierAxis.paths.find(p => p.id === hit.pathId)!;
        const newAnchors = path.anchors.map((a, i) => {
          if (i !== hit.index) return a;
          if (hit.part === 'cp1') return { ...a, cp1: [a.x, a.y] as [number, number] };
          return { ...a, cp2: [a.x, a.y] as [number, number] };
        });
        updatePath(hit.pathId, newAnchors);
        return;
      }
      draggingRef.current = hit;
      if (hit.part === 'anchor') setSelectedIdx(hit.index);
      return;
    }

    const pathHit = findPathHit(nx, ny);
    if (pathHit) {
      setActivePathId(pathHit.pathId);
      const path = bezierAxis.paths.find(p => p.id === pathHit.pathId)!;
      if (e.altKey) {
        const nextIdx = (pathHit.segIndex + 1) % path.anchors.length;
        const newAnchors = [...path.anchors];
        newAnchors[pathHit.segIndex] = { ...newAnchors[pathHit.segIndex], cp2: [newAnchors[pathHit.segIndex].x, newAnchors[pathHit.segIndex].y] };
        newAnchors[nextIdx] = { ...newAnchors[nextIdx], cp1: [newAnchors[nextIdx].x, newAnchors[nextIdx].y] };
        updatePath(path.id, newAnchors);
        return;
      }
      setSelectedIndices(new Set());
      const nextIdx = (pathHit.segIndex + 1) % path.anchors.length;
      const a = path.anchors[pathHit.segIndex], b = path.anchors[nextIdx];
      const { leftCp2, mid, midCp1, midCp2, rightCp1 } = splitBezier([a.x, a.y], [a.cp2[0], a.cp2[1]], [b.cp1[0], b.cp1[1]], [b.x, b.y], pathHit.t);
      const newAnchor: BezierAnchor = { x: mid[0], y: mid[1], cp1: midCp1, cp2: midCp2 };
      const updated = [...path.anchors];
      updated[pathHit.segIndex] = { ...a, cp2: leftCp2 };
      updated[nextIdx] = { ...b, cp1: rightCp1 };
      updated.splice(pathHit.segIndex + 1, 0, newAnchor);
      updatePath(path.id, updated);
      draggingRef.current = { pathId: path.id, index: pathHit.segIndex + 1, part: 'anchor-handle' };
      setSelectedIdx(pathHit.segIndex + 1); justCreatedRef.current = true;
      return;
    }

    if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
      const activePth = activePathIdRef.current
        ? bezierAxisRef.current.paths.find(p => p.id === activePathIdRef.current)
        : null;
      if (activePth && !activePth.closed) {
        // アクティブパスへアンカーを追加（ペンツール動作）
        const newAnchor: BezierAnchor = { x: nx, y: ny, cp1: [nx, ny], cp2: [nx, ny] };
        const newAnchors = [...activePth.anchors, newAnchor];
        updatePath(activePth.id, newAnchors);
        const newIdx = newAnchors.length - 1;
        draggingRef.current = { pathId: activePth.id, index: newIdx, part: 'anchor-handle' };
        setSelectedIdx(newIdx); setSelectedIndices(new Set()); justCreatedRef.current = true;
      } else {
        // 新しいパスを作成
        const newPath: BezierPath = { id: crypto.randomUUID(), anchors: [{ x: nx, y: ny, cp1: [nx, ny], cp2: [nx, ny] }], closed: false };
        setBezierAxisRef.current({ paths: [...bezierAxisRef.current.paths, newPath] });
        setActivePathId(newPath.id);
        draggingRef.current = { pathId: newPath.id, index: 0, part: 'anchor-handle' };
        setSelectedIdx(0); setSelectedIndices(new Set()); justCreatedRef.current = true;
      }
    }
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    handlePointerActivity(e);
    const [nx, ny] = getCanvasPos(e);
    currentPosRef.current = [nx, ny];

    if (scaleModeRef.current) {
      const m = scaleModeRef.current;
      const scale = Math.hypot((nx - m.center[0]) * width, (ny - m.center[1]) * height) / m.refDist;
      updatePath(m.pathId, applyScale(m.snapshot, m.indices, m.center, scale, m.targetCp));
      return;
    }
    if (rotateModeRef.current) {
      const m = rotateModeRef.current;
      let sDelta = Math.atan2((ny - m.center[1]) * height, (nx - m.center[0]) * width) - m.lastMouseAngle;
      if (sDelta > Math.PI) sDelta -= 2 * Math.PI; if (sDelta < -Math.PI) sDelta += 2 * Math.PI;
      m.totalDelta += sDelta; m.lastMouseAngle += sDelta;
      let fDelta = m.totalDelta, tDeg = (m.initialHandleAngle + fDelta) * 180 / Math.PI;
      if (e.shiftKey) { const s10 = Math.round(tDeg / 10) * 10, s45 = Math.round(tDeg / 45) * 45; fDelta = ((Math.abs(tDeg - s45) < Math.abs(tDeg - s10) ? s45 : s10) * Math.PI / 180) - m.initialHandleAngle; }
      else if (Math.abs(tDeg - Math.round(tDeg / 45) * 45) < 3.0) fDelta = (Math.round(tDeg / 45) * 45 * Math.PI / 180) - m.initialHandleAngle;
      updatePath(m.pathId, applyRotate(m.snapshot, m.indices, m.center, fDelta, width, height, m.targetCp));
      return;
    }
    if (grabModeRef.current) {
      const m = grabModeRef.current;
      let dx = nx - m.startPos[0], dy = ny - m.startPos[1];
      if (m.constraint === 'x') dy = 0; if (m.constraint === 'y') dx = 0;
      let sX: number | null = null, sY: number | null = null;
      if (e.shiftKey) {
        const thr = 10 / Math.max(width, height), others = bezierAxisRef.current.paths.flatMap(p => p.anchors).filter(a => !m.snapshot.some(s => s.x === a.x && s.y === a.y));
        for (const idx of m.indices) {
          const base = m.targetCp === 'cp1' ? m.snapshot[idx].cp1 : m.targetCp === 'cp2' ? m.snapshot[idx].cp2 : [m.snapshot[idx].x, m.snapshot[idx].y];
          for (const t of others) {
            if (sX === null && Math.abs(base[0] + dx - t.x) < thr) { sX = t.x; dx = sX - base[0]; }
            if (sY === null && Math.abs(base[1] + dy - t.y) < thr) { sY = t.y; dy = sY - base[1]; }
          }
        }
      }
      m.snapX = sX; m.snapY = sY;
      updatePath(m.pathId, applyGrab(m.snapshot, m.indices, dx, dy, m.targetCp));
      return;
    }
    if (gradientGrabModeRef.current) {
      applyGradientGrab(gradientGrabModeRef.current, [nx, ny]);
      return;
    }

    if (rectSelect) { setRectSelect(prev => prev ? { ...prev, currentX: nx, currentY: ny } : null); return; }
    if (isDraggingMultiRef.current && multiDragStartRef.current && multiDragOriginRef.current) {
      didDragRef.current = true;
      const dx = nx - multiDragOriginRef.current[0], dy = ny - multiDragOriginRef.current[1];
      const newAnchors = multiDragStartRef.current.map((a, i) => selectedIndices.has(i) ? { x: a.x + dx, y: a.y + dy, cp1: [a.cp1[0] + dx, a.cp1[1] + dy] as [number, number], cp2: [a.cp2[0] + dx, a.cp2[1] + dy] as [number, number] } : a);
      updatePath(activePathId!, newAnchors);
      return;
    }

    if (!draggingRef.current) {
      const ph = findPathHit(nx, ny);
      if (ph) {
        const path = bezierAxis.paths.find(p => p.id === ph.pathId)!;
        const a = path.anchors[ph.segIndex], b = path.anchors[(ph.segIndex + 1) % path.anchors.length];
        const p = cubicBezierPt([a.x, a.y], [a.cp2[0], a.cp2[1]], [b.cp1[0], b.cp1[1]], [b.x, b.y], ph.t);
        setPathHover({ pathId: ph.pathId, pos: p });
      } else setPathHover(null);
      return;
    }

    didDragRef.current = true;
    const { pathId, index, part } = draggingRef.current;
    const path = bezierAxis.paths.find(p => p.id === pathId)!;
    const newAnchors = path.anchors.map((a, i) => {
      if (i !== index) return a;
      if (part === 'anchor') { const dx = nx - a.x, dy = ny - a.y; return { ...a, x: nx, y: ny, cp1: [a.cp1[0] + dx, a.cp1[1] + dy] as [number, number], cp2: [a.cp2[0] + dx, a.cp2[1] + dy] as [number, number] }; }
      if (part === 'cp1') return { ...a, cp1: [nx, ny] as [number, number] };
      if (part === 'cp2') return { ...a, cp2: [nx, ny] as [number, number] };
      return { ...a, cp2: [nx, ny] as [number, number], cp1: [2 * a.x - nx, 2 * a.y - ny] as [number, number] };
    });
    updatePath(pathId, newAnchors);
  };

  const handleMouseUp = (e: React.PointerEvent) => {
    handlePointerActivity(e);
    if (e.button === 2 && rectSelect) {
      const x0 = Math.min(rectSelect.startX, rectSelect.currentX), x1 = Math.max(rectSelect.startX, rectSelect.currentX);
      const y0 = Math.min(rectSelect.startY, rectSelect.currentY), y1 = Math.max(rectSelect.startY, rectSelect.currentY);
      const gradientAnchors = gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[gradient.gradientType ?? 'linear'];
      const effectiveGradientAnchors = animation.affectRamp
        ? gradientAnchors.map((anchor, idx) => {
            const xTrack = keyframeTracks[`gradientAnchor.${idx}.x`];
            const yTrack = keyframeTracks[`gradientAnchor.${idx}.y`];
            const x = xTrack?.enabled && xTrack.keyframes.length > 0
              ? interpolateKeyframes(currentTime, xTrack.keyframes)
              : anchor[0];
            const y = yTrack?.enabled && yTrack.keyframes.length > 0
              ? interpolateKeyframes(currentTime, yTrack.keyframes)
              : anchor[1];
            return [x, y] as [number, number];
          })
        : gradientAnchors;
      const numGradientAnchors = gradient.gradientType === 'fourcolor' ? 4 : 2;
      const gradientHits = new Set<number>();
      effectiveGradientAnchors.slice(0, numGradientAnchors).forEach((anchor, index) => {
        const x = anchor[0];
        const y = 1 - anchor[1];
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) gradientHits.add(index);
      });
      let found = false;
      let foundBezier = false;
      for (const path of bezierAxis.paths) {
        const hits = new Set<number>();
        path.anchors.forEach((a, i) => { if (a.x >= x0 && a.x <= x1 && a.y >= y0 && a.y <= y1) hits.add(i); });

        // アクティブパスのコントロールポイントも範囲選択対象にする
        let cpHit: { index: number; part: 'cp1' | 'cp2' } | null = null;
        if (path.id === activePathId) {
          for (let i = 0; i < path.anchors.length; i++) {
            const a = path.anchors[i];
            if (Math.hypot((a.cp1[0] - a.x) * width, (a.cp1[1] - a.y) * height) >= 0.5 &&
                a.cp1[0] >= x0 && a.cp1[0] <= x1 && a.cp1[1] >= y0 && a.cp1[1] <= y1) {
              cpHit = { index: i, part: 'cp1' }; break;
            }
            if (Math.hypot((a.cp2[0] - a.x) * width, (a.cp2[1] - a.y) * height) >= 0.5 &&
                a.cp2[0] >= x0 && a.cp2[0] <= x1 && a.cp2[1] >= y0 && a.cp2[1] <= y1) {
              cpHit = { index: i, part: 'cp2' }; break;
            }
          }
        }

        if (hits.size > 0 || cpHit) {
          setActivePathId(path.id);
          if (hits.size > 0) {
            // アンカーが選択された場合はアンカーを優先し、CP選択はクリア
            const isAdditive = rectSelectIsAdditiveRef.current && path.id === activePathIdRef.current;
            const merged = isAdditive ? new Set([...selectedIndicesRef.current, ...hits]) : hits;
            setSelectedIndices(merged);
            setSelectedIdx(merged.size === 1 ? [...merged][0] : null);
            setSelectedCp(null);
          } else if (cpHit) {
            // CPのみヒットした場合のみCP選択
            setSelectedCp(cpHit);
          }
          found = true; foundBezier = true; break;
        }
      }
      if (gradientHits.size > 0) {
        const merged = rectSelectIsAdditiveRef.current
          ? new Set([...selectedGradientAnchorsRef.current, ...gradientHits])
          : gradientHits;
        setSelectedGradientAnchors([...merged]);
        if (!foundBezier && !rectSelectIsAdditiveRef.current) {
          setActivePathId(null);
          setSelectedIndices(new Set());
          setSelectedIdx(null);
          setSelectedCp(null);
        }
        found = true;
      } else if (!rectSelectIsAdditiveRef.current) {
        setSelectedGradientAnchors([]);
      }
      if (!found) { setActivePathId(null); setSelectedIndices(new Set()); }
      setRectSelect(null); return;
    }
    isDraggingMultiRef.current = false; multiDragStartRef.current = multiDragOriginRef.current = draggingRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!bezierAxis.enabled || scaleMode || rotateMode || grabMode || gradientGrabMode || didDragRef.current) return;
    if (justCreatedRef.current) { justCreatedRef.current = false; return; }
    const [nx, ny] = getCanvasPos(e);
    const hit = findHitTarget(nx, ny);
    if (e.detail === 2 && hit?.part === 'anchor') {
      const path = bezierAxis.paths.find(p => p.id === hit.pathId)!;
      const filtered = path.anchors.filter((_, i) => i !== hit.index);
      if (filtered.length === 0) setBezierAxis({ paths: bezierAxis.paths.filter(p => p.id !== path.id) });
      else updatePath(path.id, filtered);
      setSelectedIdx(null); setSelectedIndices(new Set()); setSelectedCp(null); return;
    }
    if (hit) { setActivePathId(hit.pathId); if (hit.part.startsWith('cp')) setSelectedCp({ index: hit.index, part: hit.part as 'cp1' | 'cp2' }); else setSelectedCp(null); return; }
    setSelectedCp(null);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width + 2 * EDGE_PAD}
        height={height + 2 * EDGE_PAD}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onPointerCancel={handleMouseUp}
        onPointerEnter={handlePointerActivity}
        onPointerLeave={(e) => {
          handlePointerActivity(e);
          setPathHover(null);
        }}
        onLostPointerCapture={handleMouseUp}
        onClick={handleClick}
        onContextMenu={e => e.preventDefault()}
        style={{
          position: 'absolute',
          top: -EDGE_PAD,
          left: -EDGE_PAD,
          cursor: (scaleMode || rotateMode || grabMode || gradientGrabMode)
            ? (lastPointerType === 'pen' ? 'default' : 'none')
            : rectSelect
              ? 'crosshair'
              : 'default',
          pointerEvents: (bezierAxis.enabled && !isSlitAdjusting) ? 'auto' : 'none'
        }}
      />
      {showOverlay && bezierAxis.enabled && (
        <div style={{ position: 'absolute', top: 8, right: 8, pointerEvents: 'auto', zIndex: 10 }}>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (!closeTogglePath) return;
              setActivePathId(closeTogglePath.id);
              updatePath(closeTogglePath.id, closeTogglePath.anchors, !closeTogglePath.closed);
            }}
            disabled={!closeTogglePath}
            style={{
              background: closeTogglePath?.closed ? 'rgba(99,102,241,0.85)' : 'rgba(30,30,40,0.75)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 11,
              padding: '3px 10px',
              cursor: closeTogglePath ? 'pointer' : 'default',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.03em',
              opacity: closeTogglePath ? 1 : 0.45,
            }}
          >
            {closeTogglePath?.closed ? 'CLOSE' : 'OPEN'}
          </button>
        </div>
      )}
    </>
  );
}
