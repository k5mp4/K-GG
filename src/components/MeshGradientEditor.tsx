import { useEffect, useRef } from 'react';
import { getKeyframeEditTime, interpolateKeyframesWithLoop } from '../lib/loopKeyframes';
import { getTrackMode } from '../types/keyframe';
import { normalizeMeshGradientConfig, type MeshEdge, type Vec2Tuple } from '../types/gradient';
import { useGradientStore } from '../store/gradientStore';
import { getColorAtPosition } from '../lib/gradientRampUtils';
import { Icon } from './Icon';

type Props = {
  width: number;
  height: number;
  visible?: boolean;
};

const EDGE_DEFINITIONS: Array<{ edge: MeshEdge; start: 0 | 1 | 2 | 3; end: 0 | 1 | 2 | 3 }> = [
  { edge: 'bottom', start: 0, end: 1 },
  { edge: 'right', start: 1, end: 3 },
  { edge: 'top', start: 3, end: 2 },
  { edge: 'left', start: 2, end: 0 },
];

const CORNER_LABELS = ['BL', 'BR', 'TL', 'TR'];
const EDGE_LABELS: Record<MeshEdge, string> = { bottom: 'Bottom', right: 'Right', top: 'Top', left: 'Left' };

function uvToCss(uv: Vec2Tuple, width: number, height: number): { x: number; y: number } {
  return { x: uv[0] * width, y: (1 - uv[1]) * height };
}

function colorForPosition(
  position: number,
  stops: import('../types/gradient').ColorStop[],
  interpolation: import('../types/gradient').RampInterpolation,
  colorMode: import('../types/gradient').RampColorMode | undefined,
  rampMirror?: boolean,
): string {
  const mirroredPosition = rampMirror && position > 0.5 ? 1 - position : position;
  return getColorAtPosition(stops, mirroredPosition, interpolation, colorMode);
}

export function MeshGradientEditor({ width, height, visible = true }: Props) {
  const {
    gradient,
    keyframeTracks,
    animation,
    currentTime,
    selectedGradientAnchors,
    setKeyframeTracks,
    setMeshCorner,
    setMeshHandle,
    setMeshColorPosition,
    resetMeshGradient,
    straightenMeshHandles,
  } = useGradientStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ kind: 'corner' | 'handle'; index: number; edge?: MeshEdge; start: Vec2Tuple; pointerOffset: Vec2Tuple } | null>(null);
  const selectedRef = useRef(useGradientStore.getState().selectedGradientAnchors);

  useEffect(() => {
    selectedRef.current = useGradientStore.getState().selectedGradientAnchors;
  });

  if (!visible) return null;

  const mesh = normalizeMeshGradientConfig(gradient.mesh);
  const effectiveCorners = mesh.corners.map((corner, index) => {
    const xTrack = keyframeTracks[`mesh.corner.${index}.x`];
    const yTrack = keyframeTracks[`mesh.corner.${index}.y`];
    const x = xTrack && getTrackMode(xTrack) === 'keys' && xTrack.keyframes.length > 0
      ? interpolateKeyframesWithLoop(currentTime, xTrack.keyframes, animation.previewLoop ?? true)
      : corner[0];
    const y = yTrack && getTrackMode(yTrack) === 'keys' && yTrack.keyframes.length > 0
      ? interpolateKeyframesWithLoop(currentTime, yTrack.keyframes, animation.previewLoop ?? true)
      : corner[1];
    return [x, y] as Vec2Tuple;
  }) as typeof mesh.corners;

  const getPointerUV = (event: PointerEvent, offset: Vec2Tuple = [0, 0]): Vec2Tuple => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return [0, 0];
    return [
      (event.clientX - rect.left - offset[0]) / rect.width,
      1 - (event.clientY - rect.top - offset[1]) / rect.height,
    ];
  };

  const updateCornerKeyframe = (index: number, axis: 'x' | 'y', value: number): void => {
    const state = useGradientStore.getState();
    const trackId = `mesh.corner.${index}.${axis}`;
    const track = state.keyframeTracks[trackId];
    const time = getKeyframeEditTime(state.currentTime, state.animation.previewLoop ?? true);
    if (!track || getTrackMode(track) !== 'keys' || track.keyframes.length === 0) return;
    const existing = track.keyframes.find(keyframe => Math.abs(keyframe.time - time) < 1e-4);
    if (existing) state.setKeyframe(trackId, { id: existing.id, value });
    else state.addKeyframe(trackId, { time, value, interpolation: 'linear' });
  };

  const handleCornerPointerDown = (index: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const point = effectiveCorners[index];
    const rect = containerRef.current?.getBoundingClientRect();
    const offset: Vec2Tuple = rect
      ? [event.clientX - rect.left - point[0] * rect.width, event.clientY - rect.top - (1 - point[1]) * rect.height]
      : [0, 0];
    const startCorners = effectiveCorners.map(corner => [corner[0], corner[1]] as Vec2Tuple) as typeof effectiveCorners;
    const selected = selectedRef.current.includes(index) ? selectedRef.current : [index];
    const nextSelected = event.shiftKey ? [...new Set([...selectedRef.current, index])] : selected;
    selectedRef.current = nextSelected;
    useGradientStore.getState().setSelectedGradientAnchors(nextSelected);
    draggingRef.current = { kind: 'corner', index, start: point, pointerOffset: offset };

    const onMove = (moveEvent: PointerEvent) => {
      const dragging = draggingRef.current;
      if (!dragging || dragging.kind !== 'corner') return;
      const next = getPointerUV(moveEvent, dragging.pointerOffset);
      const dx = next[0] - dragging.start[0];
      const dy = next[1] - dragging.start[1];
      const state = useGradientStore.getState();
      const selectedIndexes = selectedRef.current.includes(index) ? selectedRef.current : [index];
      for (const cornerIndex of selectedIndexes) {
        const base = startCorners[cornerIndex];
        const xTrack = state.keyframeTracks[`mesh.corner.${cornerIndex}.x`];
        const yTrack = state.keyframeTracks[`mesh.corner.${cornerIndex}.y`];
        const xActive = Boolean(xTrack && getTrackMode(xTrack) === 'keys' && xTrack.keyframes.length > 0);
        const yActive = Boolean(yTrack && getTrackMode(yTrack) === 'keys' && yTrack.keyframes.length > 0);
        if (xActive) updateCornerKeyframe(cornerIndex, 'x', base[0] + dx);
        if (yActive) updateCornerKeyframe(cornerIndex, 'y', base[1] + dy);
        if (!xActive || !yActive) {
          const currentMesh = normalizeMeshGradientConfig(useGradientStore.getState().gradient.mesh);
          const current = currentMesh.corners[cornerIndex];
          setMeshCorner(cornerIndex, [xActive ? current[0] : base[0] + dx, yActive ? current[1] : base[1] + dy]);
        }
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

  const handleHandlePointerDown = (edge: MeshEdge, index: 0 | 1) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const point = mesh.handles[edge][index];
    const rect = containerRef.current?.getBoundingClientRect();
    const offset: Vec2Tuple = rect
      ? [event.clientX - rect.left - point[0] * rect.width, event.clientY - rect.top - (1 - point[1]) * rect.height]
      : [0, 0];
    draggingRef.current = { kind: 'handle', index, edge, start: point, pointerOffset: offset };
    const onMove = (moveEvent: PointerEvent) => {
      const dragging = draggingRef.current;
      if (!dragging || dragging.kind !== 'handle' || !dragging.edge) return;
      setMeshHandle(dragging.edge, index, getPointerUV(moveEvent, dragging.pointerOffset));
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

  const recordCornerKeyframe = (index: number) => {
    const state = useGradientStore.getState();
    const time = getKeyframeEditTime(state.currentTime, state.animation.previewLoop ?? true);
    const corner = effectiveCorners[index];
    for (const axis of ['x', 'y'] as const) {
      const trackId = `mesh.corner.${index}.${axis}`;
      const existing = state.keyframeTracks[trackId];
      const value = corner[axis === 'x' ? 0 : 1];
      if (existing) {
        const keyframe = existing.keyframes.find(item => Math.abs(item.time - time) < 1e-4);
        if (keyframe) state.setKeyframe(trackId, { id: keyframe.id, value });
        else state.addKeyframe(trackId, { time, value, interpolation: 'linear' });
      } else {
        setKeyframeTracks(previous => ({
          ...previous,
          [trackId]: {
            propertyId: trackId,
            label: `Mesh ${CORNER_LABELS[index]}.${axis.toUpperCase()}`,
            enabled: true,
            keyframes: [{ id: crypto.randomUUID(), time, value, interpolation: 'linear' }],
          },
        }));
      }
    }
  };

  const cornerPositions = effectiveCorners.map(corner => uvToCss(corner, width, height));
  const handlePositions = (edge: MeshEdge) => mesh.handles[edge].map(handle => uvToCss(handle, width, height));
  const colors = mesh.colorPositions.map(position => colorForPosition(position, gradient.stops, gradient.rampInterpolation, gradient.rampColorMode, gradient.rampMirror));

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none', overflow: 'visible' }}>
      <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} width={width} height={height} aria-hidden="true">
        {EDGE_DEFINITIONS.map(({ edge, start, end }) => {
          const handles = handlePositions(edge);
          const from = cornerPositions[start];
          const to = cornerPositions[end];
          return (
            <g key={edge}>
              <line x1={from.x} y1={from.y} x2={handles[0].x} y2={handles[0].y} stroke="rgba(255,255,255,.22)" strokeDasharray="3 3" />
              <line x1={to.x} y1={to.y} x2={handles[1].x} y2={handles[1].y} stroke="rgba(255,255,255,.22)" strokeDasharray="3 3" />
              <path d={`M ${from.x} ${from.y} C ${handles[0].x} ${handles[0].y}, ${handles[1].x} ${handles[1].y}, ${to.x} ${to.y}`} fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      {EDGE_DEFINITIONS.flatMap(({ edge }) => handlePositions(edge).map((position, index) => (
        <div key={`${edge}-handle-${index}`} style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', zIndex: 19 }}>
          <div
            title={`${EDGE_LABELS[edge]} Bezier control ${index + 1}`}
            onPointerDown={handleHandlePointerDown(edge, index as 0 | 1)}
            style={{ width: 13, height: 13, background: 'var(--color-k-bg)', border: '2px solid #e7b27b', transform: 'rotate(45deg)', cursor: 'grab', boxShadow: '0 1px 5px rgba(0,0,0,.55)' }}
          />
        </div>
      )))}

      {cornerPositions.map((position, index) => {
        const selected = selectedGradientAnchors.includes(index);
        return (
          <div key={`mesh-corner-${index}`} style={{ position: 'absolute', left: position.x, top: position.y, transform: 'translate(-50%, -50%)', zIndex: 20 }}>
            <div
              title={CORNER_LABELS[index]}
              onPointerDown={handleCornerPointerDown(index)}
              style={{ width: 20, height: 20, borderRadius: '50%', background: colors[index], border: `2px solid ${selected ? '#D11402' : '#f0ead9'}`, boxShadow: selected ? '0 0 0 3px rgba(209,20,2,.35)' : '0 1px 5px rgba(0,0,0,.55)', cursor: 'move', pointerEvents: 'auto', userSelect: 'none' }}
            />
            {animation.enabled && (
              <button type="button" title={`Record ${CORNER_LABELS[index]} keyframe`} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); recordCornerKeyframe(index); }} style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 16, height: 16, padding: 0, border: 0, background: 'rgba(20,20,35,.9)', color: '#D11402', pointerEvents: 'auto' }}>
                <Icon name="timer" style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
        );
      })}

      <div style={{ position: 'absolute', left: 8, bottom: 8, width: Math.min(250, Math.max(170, width - 16)), padding: 8, background: 'rgba(20,20,35,.88)', border: '1px solid rgba(240,234,217,.2)', pointerEvents: 'auto', zIndex: 30 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <button type="button" onClick={resetMeshGradient} style={{ flex: 1, padding: '4px 6px', color: '#f0ead9', background: 'rgba(255,255,255,.08)', fontSize: 10 }}>Reset Mesh</button>
          <button type="button" onClick={straightenMeshHandles} style={{ flex: 1, padding: '4px 6px', color: '#f0ead9', background: 'rgba(255,255,255,.08)', fontSize: 10 }}>Straighten Handles</button>
        </div>
        {mesh.colorPositions.map((value, index) => (
          <label key={`mesh-color-${index}`} style={{ display: 'grid', gridTemplateColumns: '38px 1fr 34px', gap: 6, alignItems: 'center', color: '#d9d0c0', fontSize: 9 }}>
            <span>{CORNER_LABELS[index]}</span>
            <input type="range" min="0" max="1" step="0.001" value={value} onChange={event => setMeshColorPosition(index, Number(event.target.value))} />
            <span>{value.toFixed(2)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
