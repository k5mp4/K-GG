import { describe, expect, it } from 'vitest';
import {
  buildDiffuseBezierLut,
  buildDiffuseCurveLut,
  diffuseBezierValue,
  diffuseCurveBezierSegments,
  diffuseCurveValue,
  IDENTITY_DIFFUSE_BEZIER,
  migrateLegacyDiffuseCurve,
  normalizeDiffuseBezier,
  normalizeDiffuseCurve,
  resolveDiffuseBezier,
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

  it('migrates the legacy identity curve to the identity Bezier deterministically', () => {
    const legacy = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const first = migrateLegacyDiffuseCurve(legacy);
    const second = migrateLegacyDiffuseCurve(legacy);

    expect(first).toEqual(second);
    expect(first).toEqual(expect.arrayContaining([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ]));
    first.forEach((value, index) => expect(value).toBeCloseTo(IDENTITY_DIFFUSE_BEZIER[index], 10));
  });

  it('normalizes malformed legacy input to a finite in-range migration', () => {
    const legacy = [
      { x: Number.NEGATIVE_INFINITY, y: 0.4 },
      { x: -10, y: 4 },
      { x: 0.2, y: -2 },
      { x: 0.2, y: 0.9 },
      { x: 0.7, y: 2 },
      { x: Number.NaN, y: Number.POSITIVE_INFINITY },
    ];

    const migrated = migrateLegacyDiffuseCurve(legacy);
    expect(migrated).toHaveLength(4);
    expect(migrated.every(value => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
    expect(resolveDiffuseBezier(undefined, legacy)).toEqual(migrated);
  });

  it('normalizes invalid Bezier entries without propagating non-finite values', () => {
    expect(normalizeDiffuseBezier([Number.NaN, -1, Number.POSITIVE_INFINITY, 2])).toEqual([
      IDENTITY_DIFFUSE_BEZIER[0],
      0,
      IDENTITY_DIFFUSE_BEZIER[2],
      1,
    ]);
    expect(normalizeDiffuseBezier(undefined)).toEqual(IDENTITY_DIFFUSE_BEZIER);
  });

  it('builds every LUT sample from the shared Bezier evaluator', () => {
    const bezier = [0.16, 0.8, 0.82, 0.23] as const;
    const size = 65;
    const lut = buildDiffuseBezierLut(bezier, size);

    expect(lut).toHaveLength(size);
    for (let index = 0; index < size; index += 1) {
      const input = index / (size - 1);
      expect(lut[index]).toBe(Math.round(diffuseBezierValue(bezier, input) * 255));
    }
  });
});
