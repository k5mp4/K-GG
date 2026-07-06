import { describe, expect, it } from 'vitest';
import type { PostprocessConfig } from '../types/distortion';
import {
  GLASS_LIMITS,
  getGlassSamplePadding,
  smoothGlassNoiseBlend,
} from './glass';

function glassConfig(overrides: Partial<PostprocessConfig> = {}): PostprocessConfig {
  return {
    enabled: true,
    effectMode: 'glass',
    glassMix: 1,
    glassRefraction: 32,
    glassChromaticAberration: 4,
    glassRoughness: 1.5,
    ...overrides,
  } as PostprocessConfig;
}

describe('getGlassSamplePadding', () => {
  it('adds the bounded optical sample radii and safety pixels', () => {
    expect(getGlassSamplePadding(glassConfig())).toBe(40);
  });

  it('returns no padding when Glass cannot affect the output', () => {
    expect(getGlassSamplePadding(glassConfig({ enabled: false }))).toBe(0);
    expect(getGlassSamplePadding(glassConfig({ effectMode: 'mirror' }))).toBe(0);
    expect(getGlassSamplePadding(glassConfig({ glassMix: 0 }))).toBe(0);
  });

  it('clamps imported or directly entered values to renderer limits', () => {
    expect(getGlassSamplePadding(glassConfig({
      glassRefraction: 999,
      glassChromaticAberration: 999,
      glassRoughness: 999,
    }))).toBe(
      GLASS_LIMITS.refraction +
      GLASS_LIMITS.chromaticAberration +
      GLASS_LIMITS.roughness +
      2,
    );
  });
});

describe('smoothGlassNoiseBlend', () => {
  it('preserves exact endpoints and the midpoint', () => {
    expect(smoothGlassNoiseBlend(0)).toBe(0);
    expect(smoothGlassNoiseBlend(0.5)).toBe(0.5);
    expect(smoothGlassNoiseBlend(1)).toBe(1);
  });

  it('eases the final percent into the 100% Noise Distortion endpoint', () => {
    const at99 = smoothGlassNoiseBlend(0.99);
    expect(at99).toBeGreaterThan(0.9999);
    expect(1 - at99).toBeLessThan(0.00002);
  });

  it('clamps invalid and out-of-range imported values', () => {
    expect(smoothGlassNoiseBlend(-1)).toBe(0);
    expect(smoothGlassNoiseBlend(2)).toBe(1);
    expect(smoothGlassNoiseBlend(Number.NaN)).toBe(0);
  });
});
