import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import type { ColorStop } from '../types/gradient';
import { applyRampOffsetT, buildRampTextureData, RAMP_TEX_WIDTH } from './gradientRampUtils';
import { evaluateSceneAtTime, hasActiveAnimation } from './sceneEvaluation';

const MONO: ColorStop[] = [
  { position: 0, color: '#000000' },
  { position: 1, color: '#ffffff' },
];

function ramp(offset?: number, mirror = false, repeat = 1) {
  return buildRampTextureData(MONO, 'linear', mirror, undefined, 'rgb', 0, repeat, offset);
}

function state(overrides: Partial<LatestState> = {}): LatestState {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse, enabled: false },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    coneView: { ...STORE_DEFAULTS.coneView },
    manualDistort: { ...STORE_DEFAULTS.manualDistort },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
    animation: { ...STORE_DEFAULTS.animation, enabled: true, speed: 1 },
    keyframeTracks: {},
    width: 320,
    height: 180,
    animDirection: 0,
    ...overrides,
  };
}

describe('ramp color offset', () => {
  it('wraps the ramp position and leaves zero untouched', () => {
    expect(applyRampOffsetT(0.3, 0)).toBe(0.3);
    expect(applyRampOffsetT(0.3, undefined)).toBe(0.3);
    expect(applyRampOffsetT(0.75, 0.5)).toBeCloseTo(0.25);
    expect(applyRampOffsetT(0.25, -0.5)).toBeCloseTo(0.75);
    expect(applyRampOffsetT(1, 1)).toBe(1);
    expect(applyRampOffsetT(0, 1)).toBe(0);
    expect(applyRampOffsetT(0.4, Number.NaN)).toBe(0.4);
  });

  it('keeps the legacy ramp when the offset is 0 or a whole cycle', () => {
    const base = ramp();
    expect(ramp(0)).toEqual(base);
    expect(ramp(1)).toEqual(base);
    expect(ramp(-1)).toEqual(base);
  });

  it('shifts colors along the ramp and wraps at the seam', () => {
    const base = ramp();
    const shifted = ramp(0.25);
    const at = (data: Uint8Array, texel: number) => data[texel * 4];
    // A quarter-cycle offset makes texel 0 read the ramp at t = 0.25.
    expect(Math.abs(at(shifted, 64) - at(base, 128))).toBeLessThanOrEqual(2);
    // Texel 192 wraps around to t = 0.
    expect(at(shifted, 192)).toBeLessThanOrEqual(at(base, 2));
    expect(ramp(0.25)).toEqual(ramp(-0.75));
  });

  it('is seamless with mirror on', () => {
    const shifted = ramp(0.3, true);
    let maxStep = 0;
    for (let i = 1; i < RAMP_TEX_WIDTH; i += 1) {
      maxStep = Math.max(maxStep, Math.abs(shifted[i * 4] - shifted[(i - 1) * 4]));
    }
    expect(maxStep).toBeLessThan(12);
  });

  it('applies the offset after repeat', () => {
    const repeated = ramp(0.5, false, 2);
    const base = ramp(0, false, 2);
    expect(repeated).not.toEqual(base);
    expect(ramp(1, false, 2)).toEqual(base);
  });
});

describe('ramp offset speed', () => {
  const animated = (patch: Partial<LatestState['animation']>) => state({
    animation: { ...STORE_DEFAULTS.animation, enabled: true, speed: 1, ...patch },
  });

  it('advances `rampOffsetSpeed` whole ramp cycles per loop', () => {
    const s = animated({ rampOffsetSpeed: 2 });
    expect(evaluateSceneAtTime(s, 0).gradient.rampOffset).toBeCloseTo(0);
    expect(evaluateSceneAtTime(s, 0.25).gradient.rampOffset).toBeCloseTo(0.5);
    expect(hasActiveAnimation(s)).toBe(true);
  });

  it('reverses with a negative speed and ignores the global Speed', () => {
    expect(evaluateSceneAtTime(animated({ rampOffsetSpeed: -1 }), 0.25).gradient.rampOffset).toBeCloseTo(-0.25);
    expect(evaluateSceneAtTime(animated({ rampOffsetSpeed: 1, speed: 2.5 }), 0.25).gradient.rampOffset).toBeCloseTo(0.25);
  });

  it('always loops seamlessly: the end of the loop lands on a whole cycle', () => {
    for (const speed of [1, 3, -2]) {
      const end = evaluateSceneAtTime(animated({ rampOffsetSpeed: speed, speed: 1.7 }), 1).gradient.rampOffset ?? 0;
      expect(applyRampOffsetT(0.4, end)).toBeCloseTo(0.4);
    }
    const rounded = evaluateSceneAtTime(animated({ rampOffsetSpeed: 1.6 }), 1).gradient.rampOffset;
    expect(rounded).toBe(2);
  });

  it('does not move when Animation is off or the speed is 0', () => {
    const off = animated({ enabled: false, rampOffsetSpeed: 1 });
    expect(evaluateSceneAtTime(off, 0.5).gradient.rampOffset ?? 0).toBe(0);
    expect(hasActiveAnimation(off)).toBe(false);
    const still = animated({ rampOffsetSpeed: 0 });
    expect(evaluateSceneAtTime(still, 0.5).gradient.rampOffset ?? 0).toBe(0);
    expect(hasActiveAnimation(still)).toBe(false);
    expect(hasActiveAnimation(animated({ rampOffsetSpeed: undefined }))).toBe(false);
  });
});
