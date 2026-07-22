import { useEffect, useMemo, useRef, useState } from 'react';
import { diffuseCurveBezierSegments, normalizeDiffuseCurve } from '../lib/diffuseCurve';
import {
  clientToCurvePoint,
  constrainCurvePointX,
  curvePointToPlot,
  DIFFUSE_CURVE_PLOT,
} from '../lib/diffuseCurveEditorGeometry';
import type { DiffuseCurvePoint } from '../types/distortion';

type Props = {
  value: DiffuseCurvePoint[] | undefined;
  onChange: (value: DiffuseCurvePoint[]) => void;
};


export function DiffuseCurveEditor({ value, onChange }: Props) {
  const [histogram, setHistogram] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const curve = useMemo(() => normalizeDiffuseCurve(value), [value]);

  useEffect(() => {
    const handleHistogram = (event: Event) => {
      const next = (event as CustomEvent<{ histogram?: number[] }>).detail?.histogram;
      if (Array.isArray(next) && next.length > 0) setHistogram(next);
    };
    window.addEventListener('kgg:diffuse-histogram', handleHistogram);
    return () => window.removeEventListener('kgg:diffuse-histogram', handleHistogram);
  }, []);

  useEffect(() => {
    if (dragIndex === null) return;
    const move = (event: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const nextPoint = clientToCurvePoint(svg.getBoundingClientRect(), event.clientX, event.clientY);
      const points = curve.map((point, index) => index === dragIndex
        ? { ...point, x: constrainCurvePointX(curve, index, nextPoint.x), y: nextPoint.y }
        : point);
      onChange(points);
    };
    const stop = () => setDragIndex(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
    window.addEventListener('pointercancel', stop, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [curve, dragIndex, onChange]);

  const plotWidth = DIFFUSE_CURVE_PLOT.right - DIFFUSE_CURVE_PLOT.left;
  const histogramMax = Math.max(...histogram, 1);
  const histogramBars = histogram.map((count, index) => {
    const x = DIFFUSE_CURVE_PLOT.left + (index / histogram.length) * plotWidth;
    const width = Math.max(plotWidth / histogram.length, 0.25);
    const height = (count / histogramMax) * 78;
    return <rect key={index} x={x} y={DIFFUSE_CURVE_PLOT.bottom - height} width={width} height={height} fill="currentColor" opacity={0.16} />;
  });
  const bezierSegments = diffuseCurveBezierSegments(curve);
  const first = curvePointToPlot(curve[0]);
  const curvePath = [
    `M ${first.x} ${first.y}`,
    ...bezierSegments.map(segment => {
      const leftControl = curvePointToPlot(segment.leftControl);
      const rightControl = curvePointToPlot(segment.rightControl);
      const right = curvePointToPlot(segment.right);
      return `C ${leftControl.x} ${leftControl.y}, ${rightControl.x} ${rightControl.y}, ${right.x} ${right.y}`;
    }),
  ].join(' ');

  const addPoint = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = clientToCurvePoint(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
    if (curve.length >= 16 || point.x <= 0 || point.x >= 1) return;
    onChange([...curve, point]);
  };

  const removePoint = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (index <= 0 || index >= curve.length - 1) return;
    onChange(curve.filter((_, pointIndex) => pointIndex !== index));
  };

  return (
    <div className="space-y-2 rounded-[var(--tq-radius-pane)] border border-k-muted/60 bg-k-bg/70 p-2 text-k-text">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider">Luminance Curve</p>
          <p className="text-[9px] text-tab-inactive">入力輝度 → 拡散係数 / Bezier補間・double-clickで点追加</p>
        </div>
        <span className="text-[9px] tabular-nums text-tab-inactive">{curve.length}/16</span>
      </div>
      <div className="mx-auto aspect-square w-full max-w-[360px]">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full touch-none rounded-[var(--tq-radius-input)] border border-k-muted/40 bg-k-surface text-fire"
          onDoubleClick={addPoint}
        >
        <path d={`M${DIFFUSE_CURVE_PLOT.left} ${DIFFUSE_CURVE_PLOT.top}H${DIFFUSE_CURVE_PLOT.right} M${DIFFUSE_CURVE_PLOT.left} 50H${DIFFUSE_CURVE_PLOT.right} M${DIFFUSE_CURVE_PLOT.left} ${DIFFUSE_CURVE_PLOT.bottom}H${DIFFUSE_CURVE_PLOT.right} M25 ${DIFFUSE_CURVE_PLOT.top}V${DIFFUSE_CURVE_PLOT.bottom} M50 ${DIFFUSE_CURVE_PLOT.top}V${DIFFUSE_CURVE_PLOT.bottom} M75 ${DIFFUSE_CURVE_PLOT.top}V${DIFFUSE_CURVE_PLOT.bottom}`} stroke="currentColor" opacity="0.12" strokeWidth="0.5" />
        {histogramBars}
        <path d={curvePath} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {bezierSegments.slice(0, -1).map((segment, index) => {
          const point = curvePointToPlot(segment.right);
          const nextSegment = bezierSegments[index + 1];
          const handleA = curvePointToPlot(segment.rightControl);
          if (!nextSegment) return null;
          const handleB = curvePointToPlot(nextSegment.leftControl);
          return (
            <g key={`handles-${index}`} opacity="0.3" pointerEvents="none">
              <path d={`M${handleA.x} ${handleA.y}L${point.x} ${point.y}L${handleB.x} ${handleB.y}`} stroke="currentColor" strokeWidth="0.6" strokeDasharray="1.5 1.5" fill="none" />
              <circle cx={handleA.x} cy={handleA.y} r="1" fill="currentColor" />
              <circle cx={handleB.x} cy={handleB.y} r="1" fill="currentColor" />
            </g>
          );
        })}
        {curve.map((point, index) => (
          <g key={`${point.x}-${point.y}-${index}`}>
            <circle
              cx={curvePointToPlot(point).x}
              cy={curvePointToPlot(point).y}
              r={index === 0 || index === curve.length - 1 ? 3.8 : 5}
              fill="transparent"
              stroke="transparent"
              strokeWidth="3"
              className={index === 0 || index === curve.length - 1 ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
              onPointerDown={event => {
                event.stopPropagation();
                if (index > 0 && index < curve.length - 1) {
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  setDragIndex(index);
                }
              }}
              onDoubleClick={event => event.stopPropagation()}
              onContextMenu={event => removePoint(index, event)}
            />
            <circle
              cx={curvePointToPlot(point).x}
              cy={curvePointToPlot(point).y}
              r={index === 0 || index === curve.length - 1 ? 2.2 : 3}
              fill={index === 0 || index === curve.length - 1 ? 'currentColor' : '#F0EAD9'}
              stroke="currentColor"
              strokeWidth="1"
              pointerEvents="none"
            />
          </g>
        ))}
        </svg>
      </div>
    </div>
  );
}
