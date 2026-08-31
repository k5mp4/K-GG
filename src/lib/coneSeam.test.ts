import { describe, expect, it } from 'vitest';
import {
  CONE_GRADIENT_REAPPLY_SHADER,
  getRaisedCosineSeamWeight,
  reapplyConeCornerColor,
  reapplyConeSeamColor,
} from './coneSeam';

describe('Cone Gradient Reapply seam', () => {
  it('uses a raised-cosine weight that fades to zero at the blend boundary', () => {
    expect(getRaisedCosineSeamWeight(0, 0.25)).toBeCloseTo(1, 10);
    expect(getRaisedCosineSeamWeight(0.125, 0.25)).toBeCloseTo(0.5, 10);
    expect(getRaisedCosineSeamWeight(0.25, 0.25)).toBeCloseTo(0, 10);
    expect(getRaisedCosineSeamWeight(0.4, 0.25)).toBe(0);
  });

  it('keeps the zero-width seam boundary aligned with the shader tolerance', () => {
    expect(getRaisedCosineSeamWeight(0.000001, 0)).toBe(1);
    expect(getRaisedCosineSeamWeight(0.00002, 0)).toBe(0);
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('distanceToSeam <= 0.00001');
  });

  it('reapplies the RGB edge-color delta while preserving center alpha', () => {
    expect(reapplyConeSeamColor(
      [0.1, 0.6, 0.9, 0.35],
      [0.1, 0.2, 0.8, 0.05],
      [0.7, 0.4, 0.6, 0.95],
      [0.5, 0.8, 0.2, 0.1],
      0.5,
    )).toEqual([0.35, 0.8, 0.7, 0.35]);
  });

  it('clamps only the corrected RGB channels and never uses edge alpha', () => {
    const withTransparentEdges = reapplyConeSeamColor(
      [0.9, 0.1, 0.1, 0.72],
      [0, 0.8, 0.8, 0],
      [1, 0, 0, 0],
      [1, 0, 0, 0],
      1,
    );
    expect(withTransparentEdges).toEqual([1, 0, 0, 0.72]);
  });

  it('converges a two-axis seam to the average of all four corner colors', () => {
    expect(reapplyConeCornerColor(
      [0.2, 0.4, 0.6, 0.35],
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      1,
    )).toEqual([0.25, 0.25, 0.25, 0.35]);
  });

  it('contains a matching GPU path that returns the center alpha', () => {
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('vec4 coneGradientReapplySample');
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('vec3 coneReapplyRgb');
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('coneApplyRgbDelta(color, color, cornerTarget');
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('return vec4(color, center.a);');
    expect(CONE_GRADIENT_REAPPLY_SHADER).toContain('cos(3.141592653589793 * normalizedDistance)');
  });
});
