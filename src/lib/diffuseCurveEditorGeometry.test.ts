import { describe, expect, it } from 'vitest';
import {
  clientToCurvePoint,
  constrainCurvePointX,
  curvePointToPlot,
  DIFFUSE_CURVE_PLOT,
} from './diffuseCurveEditorGeometry';

describe('Diffuse curve editor geometry', () => {
  it('keeps the square graph mapping stable when the sidebar grows', () => {
    const rect = { left: 10, top: 20, width: 320, height: 320 };
    const center = clientToCurvePoint(rect, 170, 180);

    expect(center.x).toBeCloseTo(0.5, 6);
    expect(center.y).toBeCloseTo(0.5, 6);
    expect(curvePointToPlot({ x: 0, y: 0 })).toEqual({
      x: DIFFUSE_CURVE_PLOT.left,
      y: DIFFUSE_CURVE_PLOT.bottom,
    });
  });

  it('keeps editable points between the fixed endpoints', () => {
    const points = [{ x: 0, y: 0 }, { x: 0.4, y: 0.5 }, { x: 1, y: 1 }];
    expect(constrainCurvePointX(points, 1, -1)).toBeCloseTo(0.001, 6);
    expect(constrainCurvePointX(points, 1, 2)).toBeCloseTo(0.999, 6);
  });
});
