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
});
