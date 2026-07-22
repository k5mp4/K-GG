import type { DiffuseCurvePoint } from '../types/distortion';

export const DIFFUSE_CURVE_VIEW_SIZE = 100;
export const DIFFUSE_CURVE_PLOT = {
  left: 8,
  top: 8,
  right: 92,
  bottom: 92,
} as const;

export type CurveEditorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PlotPoint = {
  x: number;
  y: number;
};

export function clampCurveEditorValue(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function curvePointToPlot(point: DiffuseCurvePoint): PlotPoint {
  const plotWidth = DIFFUSE_CURVE_PLOT.right - DIFFUSE_CURVE_PLOT.left;
  const plotHeight = DIFFUSE_CURVE_PLOT.bottom - DIFFUSE_CURVE_PLOT.top;
  return {
    x: DIFFUSE_CURVE_PLOT.left + point.x * plotWidth,
    y: DIFFUSE_CURVE_PLOT.bottom - point.y * plotHeight,
  };
}

export function clientToCurvePoint(
  rect: CurveEditorRect,
  clientX: number,
  clientY: number,
): DiffuseCurvePoint {
  const plotWidth = DIFFUSE_CURVE_PLOT.right - DIFFUSE_CURVE_PLOT.left;
  const plotHeight = DIFFUSE_CURVE_PLOT.bottom - DIFFUSE_CURVE_PLOT.top;
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  return {
    x: clampCurveEditorValue(
      ((clientX - rect.left) / width * DIFFUSE_CURVE_VIEW_SIZE - DIFFUSE_CURVE_PLOT.left) / plotWidth,
    ),
    y: clampCurveEditorValue(
      (DIFFUSE_CURVE_PLOT.bottom - (clientY - rect.top) / height * DIFFUSE_CURVE_VIEW_SIZE) / plotHeight,
    ),
  };
}

export function constrainCurvePointX(
  points: readonly DiffuseCurvePoint[],
  index: number,
  x: number,
): number {
  const previous = points[index - 1]?.x ?? 0;
  const next = points[index + 1]?.x ?? 1;
  return Math.max(previous + 0.001, Math.min(next - 0.001, clampCurveEditorValue(x)));
}
