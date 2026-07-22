import { describe, expect, it } from 'vitest';
import {
  buildDiffuseCurveLut,
  diffuseCurveBezierSegments,
  diffuseCurveValue,
  normalizeDiffuseCurve,
} from './diffuseCurve';

describe('Diffuse luminance curve', () => {
  it('fills old configurations with the identity curve', () => {
    const curve = normalizeDiffuseCurve(undefined);
    expect(curve).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(diffuseCurveValue(curve, 0.37)).toBeCloseTo(0.37, 6);
  });

  it('fixes endpoints, clamps points, removes duplicate x values, and caps the point count', () => {
    const curve = normalizeDiffuseCurve([
      { x: -1, y: 2 },
      ...Array.from({ length: 30 }, (_, index) => ({ x: (index + 1) / 32, y: index / 30 })),
      { x: 0.5, y: 0.9 },
      { x: 1, y: 0 },
    ]);
    expect(curve[0]).toEqual({ x: 0, y: 0 });
    expect(curve.at(-1)).toEqual({ x: 1, y: 1 });
    expect(curve.length).toBe(16);
    expect(curve.every(point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1)).toBe(true);
    expect(curve.every((point, index) => index === 0 || point.x > curve[index - 1].x)).toBe(true);
  });

  it('interpolates without overshooting the neighboring control points', () => {
    const curve = normalizeDiffuseCurve([{ x: 0.25, y: 0.1 }, { x: 0.75, y: 0.9 }]);
    expect(diffuseCurveValue(curve, 0.5)).toBeGreaterThanOrEqual(0.1);
    expect(diffuseCurveValue(curve, 0.5)).toBeLessThanOrEqual(0.9);
    expect(buildDiffuseCurveLut(curve, 8)).toHaveLength(8);
  });

  it('uses cubic Bezier handles that preserve the identity curve', () => {
    const segments = diffuseCurveBezierSegments(normalizeDiffuseCurve(undefined));
    expect(segments).toHaveLength(1);
    expect(segments[0].leftControl).toEqual({ x: 1 / 3, y: 1 / 3 });
    expect(segments[0].rightControl).toEqual({ x: 2 / 3, y: 2 / 3 });
    expect(diffuseCurveValue([{ x: 0, y: 0 }, { x: 0.5, y: 0.8 }, { x: 1, y: 1 }], 0.5)).toBeCloseTo(0.8, 6);
  });
});
