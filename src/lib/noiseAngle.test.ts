import { describe, expect, it } from 'vitest';
import { noiseAngleDegreesForShader, noiseAngleRadiansForShader } from './noiseAngle';

describe('Noise angle shader adapter', () => {
  it('mirrors the shader sign while preserving the persisted value contract', () => {
    expect(noiseAngleRadiansForShader(Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    expect(noiseAngleDegreesForShader(90)).toBeCloseTo(-Math.PI / 2);
  });

  it('converts non-finite input to a safe finite angle', () => {
    expect(noiseAngleRadiansForShader(Number.NaN)).toBe(0);
    expect(noiseAngleDegreesForShader(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
