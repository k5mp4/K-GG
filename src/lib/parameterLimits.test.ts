import { describe, expect, it } from 'vitest';
import {
  clampParameter,
  getParameterLimit,
  normalizeTrackValue,
  wrapAngleDegrees,
  wrapAngleRadians,
} from './parameterLimits';

describe('central parameter limits', () => {
  it('uses the same finite fallback and numeric clamp at the boundary', () => {
    const limit = getParameterLimit('diffuse.scatter');
    expect(clampParameter(9999, 12, limit)).toBe(300);
    expect(clampParameter(Number.NaN, 12, limit)).toBe(12);
    expect(clampParameter('bad', 12, limit)).toBe(12);
  });

  it('wraps degree and radian angles while preserving their storage units', () => {
    expect(wrapAngleDegrees(-90)).toBe(270);
    expect(wrapAngleDegrees(450)).toBe(90);
    expect(wrapAngleRadians(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(wrapAngleRadians(Math.PI * 5)).toBeCloseTo(Math.PI);
    expect(normalizeTrackValue('noiseDistortion.dwRotAngle1', Math.PI * 5)).toBeCloseTo(Math.PI);
    expect(normalizeTrackValue('postprocess.voronoiAngle', 725)).toBe(5);
  });

  it('clamps Caustics controls for UI, store, and keyframe boundaries', () => {
    expect(clampParameter(0, 0.65, getParameterLimit('noise.causticsDepth'))).toBe(0.05);
    expect(clampParameter(99, 1.0, getParameterLimit('noise.causticsRefraction'))).toBe(1);
    expect(clampParameter(99, 2.5, getParameterLimit('noise.causticsSharpness'))).toBe(8);
    expect(clampParameter(3.4, 4, getParameterLimit('noise.causticsComplexity'))).toBe(3);
    expect(normalizeTrackValue('noiseDistortion.causticsWaveSpread', 2)).toBe(1);
    expect(clampParameter(0, 0.75, getParameterLimit('noise.causticsBoundaryWidth'))).toBe(0.05);
    expect(normalizeTrackValue('noiseDistortion.causticsBoundaryWidth', 2)).toBe(1);
  });

  it('clamps Phasor Lines controls and wraps its direction', () => {
    expect(clampParameter(0, 5, getParameterLimit('noise.phasorFrequency'))).toBe(0.5);
    expect(clampParameter(99, 0.8, getParameterLimit('noise.phasorBandwidth'))).toBe(2);
    expect(clampParameter(-45, 28, getParameterLimit('noise.phasorDirection'))).toBe(315);
    expect(normalizeTrackValue('noiseDistortion.phasorSharpness', 99)).toBe(10);
    expect(normalizeTrackValue('noiseDistortion.phasorKernelDensity', 0)).toBe(0.25);
  });
});
