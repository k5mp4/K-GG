import { useEffect, useRef, useState } from 'react';
import { getKeyframeEditTime, interpolateKeyframesWithLoop } from '../lib/loopKeyframes';
import { getTrackMode } from '../types/keyframe';
import { normalizeMeshGradientConfig, type ColorStop, type GradientConfig, type MeshGradientConfig, type Vec2Tuple } from '../types/gradient';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { applyMirrorT, applyRampRepeatT, getColorAtPosition } from '../lib/gradientRampUtils';
import { evaluateMeshCell } from '../lib/meshGradientField';
import { ColorPicker } from './ColorPicker';
import { Icon } from './Icon';

type Props = {
  width: number;
  height: number;
  visible?: boolean;
};

const CORNER_LABELS = ['BL', 'BR', 'TL', 'TR'];
const MESH_RAMP_GUIDE_SAMPLES = 28;
const MESH_RAMP_GUIDE_REPEAT_LIMIT = 4;

function uvToCss(uv: Vec2Tuple, width: number, height: number): { x: number; y: number } {
  return { x: uv[0] * width, y: (1 - uv[1]) * height };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizedRampRepeat(value: number | undefined): number {
  return Math.max(1, Math.min(20, Math.round(value ?? 1)));
}

/**
 * Return the positions on the mesh v-axis where one color stop is sampled.
 * Mesh ramp colors are baked from the logical v coordinate, so repeat/mirror
 * are represented here as multiple guide lines rather than as one misleading
 * marker.
 */
function rampGuidePositions(position: number, repeat: number, mirror: boolean): number[] {
  const safePosition = clamp01(position);
  const cyclesToShow = repeat <= MESH_RAMP_GUIDE_REPEAT_LIMIT ? repeat : 1;
  const positions: number[] = [];
  const addPosition = (candidate: number) => {
    const next = clamp01(candidate);
    if (!positions.some(existing => Math.abs(existing - next) < 1e-4)) positions.push(next);
  };

  for (let cycle = 0; cycle < cyclesToShow; cycle += 1) {
    addPosition((cycle + safePosition) / repeat);
    if (mirror) addPosition((cycle + (1 - safePosition)) / repeat);
  }

  return positions.sort((a, b) => a - b);
}

function evaluateDisplayMeshPoint(mesh: MeshGradientConfig, u: number, v: number): Vec2Tuple {
  const columns = Math.max(2, mesh.columns);
  const rows = Math.max(2, mesh.rows);
  const domainU = clamp01(u) * (columns - 1);
  const domainV = clamp01(v) * (rows - 1);
  const cellCol = Math.max(0, Math.min(columns - 2, Math.floor(domainU)));
  const cellRow = Math.max(0, Math.min(rows - 2, Math.floor(domainV)));
  return evaluateMeshCell(mesh, cellRow, cellCol, domainU - cellCol, domainV - cellRow);
}

function buildRampGuidePath(
  mesh: MeshGradientConfig,
  v: number,
  width: number,
  height: number,
): { d: string; endpoint: { x: number; y: number } } {
  const points: Array<{ x: number; y: number }> = [];
  for (let sample = 0; sample <= MESH_RAMP_GUIDE_SAMPLES; sample += 1) {
    const point = evaluateDisplayMeshPoint(mesh, sample / MESH_RAMP_GUIDE_SAMPLES, v);
    points.push(uvToCss(point, width, height));
  }
  return {
    d: points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' '),
    endpoint: points[points.length - 1] ?? { x: width, y: height / 2 },
  };
}

function buildRampMapBackground(gradient: GradientConfig): string {
  const repeat = normalizedRampRepeat(gradient.rampRepeat);
  const mirror = gradient.rampMirror ?? false;
  const samples = Array.from({ length: 18 }, (_, index) => {
    const rawT = index / 17;
    const repeatedT = applyRampRepeatT(rawT, repeat);
    const sampledT = mirror ? applyMirrorT(repeatedT) : repeatedT;
    const color = getColorAtPosition(gradient.stops, sampledT, gradient.rampInterpolation, gradient.rampColorMode, gradient.rampVariable);
    return `${color} ${(rawT * 100).toFixed(2)}%`;
  });
  return `linear-gradient(to top, ${samples.join(', ')})`;
}

function isValidHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function rampColorAtPosition(gradient: GradientConfig, position: number): string {
  const repeatedT = applyRampRepeatT(position, normalizedRampRepeat(gradient.rampRepeat));
  const sampledT = gradient.rampMirror ? applyMirrorT(repeatedT) : repeatedT;
  return getColorAtPosition(gradient.stops, sampledT, gradient.rampInterpolation, gradient.rampColorMode, gradient.rampVariable);
}

/**
 * Color of a mesh point.
 * - Direct mode: the point's own hex (`pointColors[index]`) is returned.
 * - Ramp mode: the shared gradient ramp is sampled at the point's grid
 *   vertical position `v`, so ramp edits update every point.
 */
function pointColorAt(
  gradient: import('../types/gradient').GradientConfig,
  mesh: import('../types/gradient').MeshGradientConfig,
  index: number,
): string {
  if (mesh.colorMode === 'direct') {
    const direct = mesh.pointColors?.[index];
    if (direct && isValidHex(direct)) return direct;
  }
  const row = Math.floor(index / mesh.columns);
  const v = mesh.rows <= 1 ? 0 : row / (mesh.rows - 1);
  return rampColorAtPosition(gradient, v);
}

function straightHandlesBetween(a: Vec2Tuple, b: Vec2Tuple): [Vec2Tuple, Vec2Tuple] {
  return [
    [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
    [a[0] + (b[0] - a[0]) * (2 / 3), a[1] + (b[1] - a[1]) * (2 / 3)],
  ];
}

type PointDrag = {
  kind: 'point';
  primary: number;
  startPoints: Map<number, Vec2Tuple>;
  offset: Vec2Tuple;
};
type HandleDrag = {
  kind: 'handle';
  orientation: 'h' | 'v';
  row: number;
  col: number;
  handleIndex: 0 | 1;
  offset: Vec2Tuple;
};

export function MeshGradientEditor({ width, height, visible = true }: Props) {
  const {
    gradient,
    keyframeTracks,
    animation,
    currentTime,
    selectedGradientAnchors,
    selectedStops,
  } = useGradientStore();
  const {
    setMeshGridPoint,
    setMeshEdgeHandle,
    setMeshPointColor,
    setKeyframe,
    addKeyframe,
    setKeyframeTracks,
    setSelectedGradientAnchors,
    setSelectedStops,
  } = applicationCommands;
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<PointDrag | HandleDrag | null>(null);
  const selectedRef = useRef<number[]>(selectedGradientAnchors);
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);

  useEffect(() => {
    selectedRef.current = useGradientStore.getState().selectedGradientAnchors;
  });

  const colorMode = normalizeMeshGradientConfig(gradient.mesh).colorMode;

  useEffect(() => {
    // Hide the color picker when leaving direct color mode or on unmount.
    if (colorMode !== 'direct') setColorPickerIndex(null);
  }, [colorMode]);

  if (!visible) return null;

  const mesh = normalizeMeshGradientConfig(gradient.mesh);
  const rows = mesh.rows;
  const columns = mesh.columns;
  const pointCount = rows * columns;

  const effectivePoint = (index: number): Vec2Tuple => {
    const point = mesh.points[index] ?? [0, 0];
    const xTrack = keyframeTracks[`mesh.point.${index}.x`];
    const yTrack = keyframeTracks[`mesh.point.${index}.y`];
    const x = xTrack && getTrackMode(xTrack) === 'keys' && xTrack.keyframes.length > 0
      ? interpolateKeyframesWithLoop(currentTime, xTrack.keyframes, animation.previewLoop ?? true)
      : point[0];
    const y = yTrack && getTrackMode(yTrack) === 'keys' && yTrack.keyframes.length > 0
      ? interpolateKeyframesWithLoop(currentTime, yTrack.keyframes, animation.previewLoop ?? true)
      : point[1];
    return [x, y];
  };

  const effectivePoints = Array.from({ length: pointCount }, (_, index) => effectivePoint(index));
  const pointCss = effectivePoints.map(point => uvToCss(point, width, height));
  const displayMesh: MeshGradientConfig = { ...mesh, points: effectivePoints };

  const edgeHandleUV = (orientation: 'h' | 'v', row: number, col: number, handleIndex: 0 | 1): Vec2Tuple => {
    const a = mesh.points[row * columns + col];
    const b = orientation === 'h' ? mesh.points[row * columns + col + 1] : mesh.points[(row + 1) * columns + col];
    const fallback = straightHandlesBetween(a, b);
    const table = orientation === 'h' ? mesh.edgeHandles.horizontal : mesh.edgeHandles.vertical;
    const edge = table[row]?.[col];
    return edge ? edge[handleIndex] ?? fallback[handleIndex] : fallback[handleIndex];
  };

  const getPointerUV = (event: PointerEvent, offset: Vec2Tuple = [0, 0]): Vec2Tuple => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return [0, 0];
    return [
      (event.clientX - rect.left - offset[0]) / rect.width,
      1 - (event.clientY - rect.top - offset[1]) / rect.height,
    ];
  };

  const updatePointKeyframe = (index: number, field: 'x' | 'y', value: number): void => {
    const state = useGradientStore.getState();
    const trackId = `mesh.point.${index}.${field}`;
    const track = state.keyframeTracks[trackId];
    const time = getKeyframeEditTime(state.currentTime, state.animation.previewLoop ?? true);
    if (!track || getTrackMode(track) !== 'keys' || track.keyframes.length === 0) return;
    const existing = track.keyframes.find(keyframe => Math.abs(keyframe.time - time) < 1e-4);
    if (existing) setKeyframe(trackId, { id: existing.id, value });
    else addKeyframe(trackId, { time, value, interpolation: 'linear' });
  };

  const isTrackActive = (trackId: string): boolean => {
    const track = keyframeTracks[trackId];
    return Boolean(track && getTrackMode(track) === 'keys' && track.keyframes.length > 0);
  };

  const commitPointPosition = (index: number, position: Vec2Tuple, xActive: boolean, yActive: boolean): void => {
    if (xActive) updatePointKeyframe(index, 'x', position[0]);
    if (yActive) updatePointKeyframe(index, 'y', position[1]);
    if (!xActive || !yActive) {
      const currentMesh = normalizeMeshGradientConfig(useGradientStore.getState().gradient.mesh);
      const current = currentMesh.points[index] ?? [0, 0];
      setMeshGridPoint(index, [
        xActive ? current[0] : position[0],
        yActive ? current[1] : position[1],
      ]);
    }
  };

  const handlePointPointerDown = (index: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    const point = effectivePoints[index];
    const offset: Vec2Tuple = rect
      ? [event.clientX - rect.left - point[0] * rect.width, event.clientY - rect.top - (1 - point[1]) * rect.height]
      : [0, 0];

    let nextSelected: number[];
    if (event.shiftKey) {
      nextSelected = selectedRef.current.includes(index)
        ? selectedRef.current
        : [...selectedRef.current, index];
    } else if (selectedRef.current.includes(index) && selectedRef.current.length > 1) {
      nextSelected = selectedRef.current;
    } else {
      nextSelected = [index];
    }
    selectedRef.current = nextSelected;
    setSelectedGradientAnchors(nextSelected);

    const startPoints = new Map<number, Vec2Tuple>();
    for (const selected of nextSelected) {
      startPoints.set(selected, effectivePoints[selected]);
    }
    draggingRef.current = { kind: 'point', primary: index, startPoints, offset };

    const onMove = (moveEvent: PointerEvent) => {
      const active = draggingRef.current;
      if (!active || active.kind !== 'point') return;
      const handleCenter = getPointerUV(moveEvent, active.offset);
      const primaryStart = active.startPoints.get(active.primary) ?? effectivePoints[active.primary];
      const dx = handleCenter[0] - primaryStart[0];
      const dy = handleCenter[1] - primaryStart[1];
      for (const [pointIndex, base] of active.startPoints) {
        commitPointPosition(
          pointIndex,
          [base[0] + dx, base[1] + dy],
          isTrackActive(`mesh.point.${pointIndex}.x`),
          isTrackActive(`mesh.point.${pointIndex}.y`),
        );
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
  };

  const handleEdgeHandlePointerDown = (orientation: 'h' | 'v', row: number, col: number, handleIndex: 0 | 1) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const uv = edgeHandleUV(orientation, row, col, handleIndex);
    const rect = containerRef.current?.getBoundingClientRect();
    const offset: Vec2Tuple = rect
      ? [event.clientX - rect.left - uv[0] * rect.width, event.clientY - rect.top - (1 - uv[1]) * rect.height]
      : [0, 0];
    draggingRef.current = { kind: 'handle', orientation, row, col, handleIndex, offset };

    const onMove = (moveEvent: PointerEvent) => {
      const active = draggingRef.current;
      if (!active || active.kind !== 'handle') return;
      setMeshEdgeHandle(active.orientation, active.row, active.col, active.handleIndex, getPointerUV(moveEvent, active.offset));
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
  };

  const handleRampGuidePointerDown = (stopIndex: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const current = useGradientStore.getState().selectedStops;
    if (event.shiftKey) {
      setSelectedStops(current.includes(stopIndex)
        ? current.filter(index => index !== stopIndex)
        : [...current, stopIndex]);
    } else {
      setSelectedStops([stopIndex]);
    }
  };

  const recordPointKeyframe = (index: number) => {
    const state = useGradientStore.getState();
    const time = getKeyframeEditTime(state.currentTime, state.animation.previewLoop ?? true);
    const point = effectivePoints[index];
    const ensureTrack = (field: 'x' | 'y', value: number) => {
      const trackId = `mesh.point.${index}.${field}`;
      const existing = state.keyframeTracks[trackId];
      if (existing) {
        const nearKf = existing.keyframes.find(kf => Math.abs(kf.time - time) < 1e-4);
        if (nearKf) setKeyframe(trackId, { id: nearKf.id, value });
        else addKeyframe(trackId, { time, value, interpolation: 'linear' });
      } else {
        setKeyframeTracks(prev => ({
          ...prev,
          [trackId]: {
            propertyId: trackId,
            label: `Mesh Point ${index + 1}.${field.toUpperCase()}`,
            group: 'Mesh Grid',
            enabled: true,
            mode: 'keys' as const,
            keyframes: [{ id: crypto.randomUUID(), time, value, interpolation: 'linear' as const }],
          },
        }));
      }
    };
    ensureTrack('x', point[0]);
    ensureTrack('y', point[1]);
  };

  const cornerLabelFor = (index: number): string | undefined => {
    if (index === 0) return CORNER_LABELS[0];
    if (index === columns - 1) return CORNER_LABELS[1];
    if (index === (rows - 1) * columns) return CORNER_LABELS[2];
    if (index === pointCount - 1) return CORNER_LABELS[3];
    return undefined;
  };

  const isBoundaryPoint = (index: number): boolean => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return row === 0 || row === rows - 1 || col === 0 || col === columns - 1;
  };

  const horizontalEdges: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns - 1; col += 1) horizontalEdges.push({ row, col });
  }
  const verticalEdges: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < columns; col += 1) verticalEdges.push({ row, col });
  }

  const rampRepeat = normalizedRampRepeat(gradient.rampRepeat);
  const rampGuideEntries = mesh.colorMode === 'ramp'
    ? gradient.stops.flatMap((stop: ColorStop, stopIndex: number) => rampGuidePositions(
      stop.position,
      rampRepeat,
      gradient.rampMirror ?? false,
    ).map((v, occurrence) => {
      const guide = buildRampGuidePath(displayMesh, v, width, height);
      return { stop, stopIndex, v, occurrence, ...guide };
    }))
    : [];
  const rampMapBackground = mesh.colorMode === 'ramp' ? buildRampMapBackground(gradient) : undefined;
  const rampGuideRepeatTruncated = rampRepeat > MESH_RAMP_GUIDE_REPEAT_LIMIT;

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none', overflow: 'visible' }}>
      <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width={width} height={height} aria-hidden="true">
        {rampGuideEntries.map(entry => {
          const selected = selectedStops.includes(entry.stopIndex);
          return (
            <g key={`ramp-guide-${entry.stopIndex}-${entry.v.toFixed(4)}`}>
              <path d={entry.d} fill="none" stroke="rgba(0,0,0,.78)" strokeWidth={selected ? 5 : 3.5} strokeLinecap="round" strokeDasharray={selected ? undefined : '2 6'} opacity={selected ? 0.82 : 0.38} />
              <path d={entry.d} fill="none" stroke={entry.stop.color} strokeWidth={selected ? 2.5 : 1.2} strokeLinecap="round" strokeDasharray={selected ? undefined : '2 6'} opacity={selected ? 1 : 0.78} />
              <circle cx={entry.endpoint.x} cy={entry.endpoint.y} r={selected ? 4.5 : 3} fill={entry.stop.color} stroke="rgba(0,0,0,.85)" strokeWidth="1.5" opacity={selected ? 1 : 0.82} />
            </g>
          );
        })}
        {horizontalEdges.map(({ row, col }) => {
          const a = uvToCss(effectivePoints[row * columns + col], width, height);
          const b = uvToCss(effectivePoints[row * columns + col + 1], width, height);
          const h1 = uvToCss(edgeHandleUV('h', row, col, 0), width, height);
          const h2 = uvToCss(edgeHandleUV('h', row, col, 1), width, height);
          return (
            <g key={`h-${row}-${col}`}>
              <line x1={a.x} y1={a.y} x2={h1.x} y2={h1.y} stroke="rgba(0,0,0,.5)" strokeWidth="3" strokeDasharray="2 3" />
              <line x1={b.x} y1={b.y} x2={h2.x} y2={h2.y} stroke="rgba(0,0,0,.5)" strokeWidth="3" strokeDasharray="2 3" />
              <line x1={a.x} y1={a.y} x2={h1.x} y2={h1.y} stroke="rgba(255,255,255,.75)" strokeWidth="1.2" strokeDasharray="2 3" />
              <line x1={b.x} y1={b.y} x2={h2.x} y2={h2.y} stroke="rgba(255,255,255,.75)" strokeWidth="1.2" strokeDasharray="2 3" />
              <path d={`M ${a.x} ${a.y} C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${b.x} ${b.y}`} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="4" />
              <path d={`M ${a.x} ${a.y} C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${b.x} ${b.y}`} fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.8" />
            </g>
          );
        })}
        {verticalEdges.map(({ row, col }) => {
          const a = uvToCss(effectivePoints[row * columns + col], width, height);
          const b = uvToCss(effectivePoints[(row + 1) * columns + col], width, height);
          const h1 = uvToCss(edgeHandleUV('v', row, col, 0), width, height);
          const h2 = uvToCss(edgeHandleUV('v', row, col, 1), width, height);
          return (
            <g key={`v-${row}-${col}`}>
              <line x1={a.x} y1={a.y} x2={h1.x} y2={h1.y} stroke="rgba(0,0,0,.5)" strokeWidth="3" strokeDasharray="2 3" />
              <line x1={b.x} y1={b.y} x2={h2.x} y2={h2.y} stroke="rgba(0,0,0,.5)" strokeWidth="3" strokeDasharray="2 3" />
              <line x1={a.x} y1={a.y} x2={h1.x} y2={h1.y} stroke="rgba(255,255,255,.75)" strokeWidth="1.2" strokeDasharray="2 3" />
              <line x1={b.x} y1={b.y} x2={h2.x} y2={h2.y} stroke="rgba(255,255,255,.75)" strokeWidth="1.2" strokeDasharray="2 3" />
              <path d={`M ${a.x} ${a.y} C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${b.x} ${b.y}`} fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="4" />
              <path d={`M ${a.x} ${a.y} C ${h1.x} ${h1.y}, ${h2.x} ${h2.y}, ${b.x} ${b.y}`} fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.8" />
            </g>
          );
        })}
      </svg>

      {rampGuideEntries.map(entry => {
        const selected = selectedStops.includes(entry.stopIndex);
        const labelWidth = Math.min(74, Math.max(52, width - 16));
        const left = Math.max(8, Math.min(width - labelWidth - 8, entry.endpoint.x - labelWidth - 8));
        const top = Math.max(14, Math.min(height - 14, entry.endpoint.y + (entry.occurrence % 2 === 0 ? -2 : 2)));
        return (
          <button
            key={`ramp-guide-label-${entry.stopIndex}-${entry.v.toFixed(4)}`}
            type="button"
            onPointerDown={handleRampGuidePointerDown(entry.stopIndex)}
            title={`Select color stop ${entry.stopIndex + 1} mapped to v ${(entry.v * 100).toFixed(0)}%`}
            aria-label={`Select color stop ${entry.stopIndex + 1}, mesh v ${(entry.v * 100).toFixed(0)} percent`}
            style={{
              position: 'absolute',
              left,
              top,
              transform: 'translateY(-50%)',
              width: labelWidth,
              minHeight: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 5px',
              border: `1px solid ${selected ? '#D11402' : 'rgba(240,234,217,.42)'}`,
              borderRadius: 3,
              background: selected ? 'rgba(20,20,28,.95)' : 'rgba(20,20,28,.82)',
              color: '#f0ead9',
              boxShadow: selected ? '0 0 0 2px rgba(209,20,2,.25), 0 3px 10px rgba(0,0,0,.45)' : '0 2px 8px rgba(0,0,0,.35)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              fontSize: 9,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.1,
              textAlign: 'left',
              userSelect: 'none',
            }}
          >
            <span style={{ width: 9, height: 9, flex: '0 0 auto', borderRadius: '50%', background: entry.stop.color, border: '1px solid rgba(255,255,255,.65)', boxShadow: '0 0 0 1px rgba(0,0,0,.55)' }} />
            <span style={{ whiteSpace: 'nowrap' }}>S{entry.stopIndex + 1} · v{Math.round(entry.v * 100)}%</span>
          </button>
        );
      })}

      {horizontalEdges.flatMap(({ row, col }) => ([0, 1] as const).map(handleIndex => {
        const position = uvToCss(edgeHandleUV('h', row, col, handleIndex), width, height);
        return (
          <div key={`eh-${row}-${col}-${handleIndex}`} style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 19 }}>
            <div
              title={`Horizontal edge control`}
              onPointerDown={handleEdgeHandlePointerDown('h', row, col, handleIndex)}
              style={{ width: 11, height: 11, background: 'var(--color-k-bg)', border: '2px solid #e7b27b', boxShadow: '0 0 0 1.5px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.25), 0 1px 5px rgba(0,0,0,.55)', transform: 'rotate(45deg)', cursor: 'grab' }}
            />
          </div>
        );
      }))}
      {verticalEdges.flatMap(({ row, col }) => ([0, 1] as const).map(handleIndex => {
        const position = uvToCss(edgeHandleUV('v', row, col, handleIndex), width, height);
        return (
          <div key={`ev-${row}-${col}-${handleIndex}`} style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 19 }}>
            <div
              title={`Vertical edge control`}
              onPointerDown={handleEdgeHandlePointerDown('v', row, col, handleIndex)}
              style={{ width: 11, height: 11, background: 'var(--color-k-bg)', border: '2px solid #e7b27b', boxShadow: '0 0 0 1.5px rgba(0,0,0,.6), 0 0 0 3px rgba(255,255,255,.25), 0 1px 5px rgba(0,0,0,.55)', transform: 'rotate(45deg)', cursor: 'grab' }}
            />
          </div>
        );
      }))}

      {pointCss.map((position, index) => {
        const selected = selectedGradientAnchors.includes(index);
        const boundary = isBoundaryPoint(index);
        const label = cornerLabelFor(index);
        const color = pointColorAt(gradient, mesh, index);
        const size = boundary ? 16 : 12;
        const singleSelected = selected && selectedGradientAnchors.length === 1;
        return (
          <div key={`p-${index}`} style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)', zIndex: selected ? 21 : 20 }}>
            <div
              title={label ?? (boundary ? `Edge point ${index + 1}` : `Point ${index + 1}`)}
              onPointerDown={handlePointPointerDown(index)}
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                border: `2px solid ${selected ? '#D11402' : '#f0ead9'}`,
                boxShadow: selected
                  ? '0 0 0 1px rgba(0,0,0,.7), 0 0 0 3px rgba(209,20,2,.35), 0 2px 6px rgba(0,0,0,.6)'
                  : '0 0 0 1px rgba(0,0,0,.7), 0 1px 5px rgba(0,0,0,.6)',
                cursor: 'move',
                pointerEvents: 'auto',
                userSelect: 'none',
              }}
            />
            {singleSelected && colorMode === 'direct' && (
              <button
                type="button"
                title="Edit point color"
                onPointerDown={event => event.stopPropagation()}
                onClick={event => { event.stopPropagation(); setColorPickerIndex(current => (current === index ? null : index)); }}
                style={{
                  position: 'absolute',
                  bottom: -13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 10,
                  padding: 0,
                  border: '1px solid rgba(255,255,255,.5)',
                  background: color,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.7), 0 1px 4px rgba(0,0,0,.5)',
                }}
                aria-label="Point color"
              />
            )}
            {selected && animation.enabled && (
              <button
                type="button"
                title="Record point keyframe"
                onPointerDown={event => event.stopPropagation()}
                onClick={event => { event.stopPropagation(); recordPointKeyframe(index); }}
                style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', width: 16, height: 11, padding: 0, border: 0, background: 'rgba(20,20,35,.9)', color: '#D11402', pointerEvents: 'auto', cursor: 'pointer' }}
              >
                <Icon name="timer" style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
        );
      })}

      {mesh.colorMode === 'ramp' && (
        <div
          role="note"
          aria-label="Ramp map. The shared gradient ramp is mapped along the mesh vertical v axis from bottom to top. Click a colored guide label to select its stop."
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            width: 154,
            padding: '8px 9px',
            border: '1px solid rgba(240,234,217,.24)',
            borderRadius: 4,
            background: 'rgba(20,20,28,.86)',
            boxShadow: '0 8px 20px rgba(0,0,0,.35)',
            color: '#f0ead9',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, fontSize: 9, fontWeight: 700, letterSpacing: '.08em' }}>
            <span>RAMP MAP</span>
            <span style={{ color: '#e7b27b', fontWeight: 600, letterSpacing: 0 }}>v-axis</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, minHeight: 58 }}>
            <div style={{ position: 'relative', width: 9, flex: '0 0 auto', border: '1px solid rgba(255,255,255,.42)', borderRadius: 2, background: rampMapBackground }}>
              {rampGuideEntries.map(entry => (
                <span
                  key={`ramp-map-marker-${entry.stopIndex}-${entry.v.toFixed(4)}`}
                  style={{ position: 'absolute', top: `${(1 - entry.v) * 100}%`, left: -4, width: 15, height: 2, transform: 'translateY(-1px)', background: entry.stop.color, boxShadow: '0 0 0 1px rgba(0,0,0,.7)' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, fontSize: 8, lineHeight: 1.2, color: 'rgba(240,234,217,.72)' }}>
              <span>TOP · v=1</span>
              <span style={{ color: 'rgba(240,234,217,.55)' }}>Each guide follows a ramp stop across the mesh.</span>
              <span>BOTTOM · v=0</span>
            </div>
          </div>
          <span style={{ color: 'rgba(240,234,217,.58)', fontSize: 8, lineHeight: 1.2 }}>
            {rampGuideRepeatTruncated ? `Showing the first cycle · ramp repeats ${rampRepeat}×.` : 'Click a guide label to select its stop.'}
          </span>
        </div>
      )}

      {colorPickerIndex !== null && colorMode === 'direct' && pointCss[colorPickerIndex] && (
        <div style={{ position: 'absolute', left: Math.max(4, Math.min(pointCss[colorPickerIndex].x, width - 264)), top: Math.max(4, pointCss[colorPickerIndex].y - 160), zIndex: 50, pointerEvents: 'auto' }}>
          <ColorPicker
            color={pointColorAt(gradient, mesh, colorPickerIndex)}
            onClose={() => setColorPickerIndex(null)}
            onChange={nextColor => { setMeshPointColor(colorPickerIndex, nextColor); }}
          />
        </div>
      )}
    </div>
  );
}
