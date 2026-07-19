import { describe, expect, it } from 'vitest';
import type { PostprocessConfig } from '../types/distortion';
import {
  GLASS_DEFAULTS,
  GLASS_LIMITS,
  getPostprocessStackSamplePadding,
  isGlassOpticallyIdentity,
  normalizeGlassRenderParameters,
  smoothGlassNoiseBlend,
} from './glass';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';

function glassConfig(overrides: Partial<PostprocessConfig> = {}): PostprocessConfig {
  return {
    enabled: true,
    effectMode: 'glass',
    effectStack: [
      { kind: 'glass', enabled: true },
      { kind: 'distort', enabled: false },
      { kind: 'mirror', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
    ],
    glassMix: 1,
    glassRefraction: 32,
    glassChromaticAberration: 4,
    glassRoughness: 1.5,
    ...overrides,
  } as PostprocessConfig;
}

describe('getPostprocessStackSamplePadding', () => {
  it('adds the bounded optical sample radii and safety pixels', () => {
    expect(getPostprocessStackSamplePadding(glassConfig())).toBe(40);
  });

  it('returns no padding when Glass cannot affect the output', () => {
    expect(getPostprocessStackSamplePadding(glassConfig({ enabled: false }))).toBe(0);
    expect(getPostprocessStackSamplePadding(glassConfig({
      effectStack: [
        { kind: 'mirror', enabled: true },
        { kind: 'distort', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'prism', enabled: false },
        { kind: 'voronoi', enabled: false },
        { kind: 'glass', enabled: false },
      ],
    }))).toBe(0);
    expect(getPostprocessStackSamplePadding(glassConfig({ glassMix: 0 }))).toBe(0);
  });

  it('uses the V2 Glass layer as the authoritative padding source', () => {
    const pipeline = createDefaultEffectPipeline();
    const glassPipeline = {
      ...pipeline,
      effectStack: updateEffectStackLayer(pipeline.effectStack, 'glass', { enabled: true }),
    };
    expect(getPostprocessStackSamplePadding(
      glassConfig({ enabled: false }),
      glassPipeline,
    )).toBe(40);
  });

  it('adds the two independent Glass layer sample radii when both are enabled', () => {
    const pipeline = createDefaultEffectPipeline();
    const bothGlassLayers = {
      ...pipeline,
      effectStack: pipeline.effectStack.map(layer => (
        layer.kind === 'glass' || layer.kind === 'glassV2' ? { ...layer, enabled: true } : layer
      )),
    };
    expect(getPostprocessStackSamplePadding(glassConfig({ enabled: false }), bothGlassLayers)).toBe(80);
  });

  it('clamps imported or directly entered values to renderer limits', () => {
    expect(getPostprocessStackSamplePadding(glassConfig({
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

describe('normalizeGlassRenderParameters', () => {
  it('uses finite renderer-safe values for every Glass uniform', () => {
    const params = normalizeGlassRenderParameters({
      glassScale: Number.NaN,
      glassStretch: Number.POSITIVE_INFINITY,
      glassRotation: Number.NEGATIVE_INFINITY,
      glassComplexity: Number.NaN,
      glassNoiseInfluence: Number.NaN,
      glassRefraction: Number.POSITIVE_INFINITY,
      glassChromaticAberration: Number.NEGATIVE_INFINITY,
      glassRoughness: Number.NaN,
      glassHighlight: Number.POSITIVE_INFINITY,
      glassMix: Number.NaN,
    });

    expect(params).toEqual(expect.objectContaining({
      scale: GLASS_DEFAULTS.scale,
      stretch: GLASS_DEFAULTS.stretch,
      complexity: GLASS_DEFAULTS.complexity,
      noiseInfluence: GLASS_DEFAULTS.noiseInfluence,
      mix: GLASS_DEFAULTS.mix,
    }));
    expect(params.refraction).toBe(GLASS_DEFAULTS.refraction);
    expect(params.chromaticAberration).toBe(GLASS_DEFAULTS.chromaticAberration);
    expect(params.roughness).toBe(GLASS_DEFAULTS.roughness);
    expect(params.highlight).toBe(GLASS_DEFAULTS.highlight);
    for (const value of Object.values(params)) expect(Number.isFinite(value)).toBe(true);
  });

  it('keeps sample padding and optical uniforms on the same bounded contract', () => {
    const params = normalizeGlassRenderParameters({
      glassRefraction: 999,
      glassChromaticAberration: 999,
      glassRoughness: 999,
    });
    expect(Math.ceil(params.refraction + params.chromaticAberration + params.roughness) + 2)
      .toBe(GLASS_LIMITS.refraction + GLASS_LIMITS.chromaticAberration + GLASS_LIMITS.roughness + 2);
  });
});

describe('isGlassOpticallyIdentity', () => {
  it('recognizes Mix 0 and the all-zero optical endpoint', () => {
    expect(isGlassOpticallyIdentity(glassConfig({ glassMix: 0 }))).toBe(true);
    expect(isGlassOpticallyIdentity(glassConfig({
      glassRefraction: 0,
      glassChromaticAberration: 0,
      glassRoughness: 0,
      glassHighlight: 0,
    }))).toBe(true);
  });

  it('keeps a single active optical term on the Glass path', () => {
    expect(isGlassOpticallyIdentity(glassConfig({ glassRefraction: 1 }))).toBe(false);
    expect(isGlassOpticallyIdentity(glassConfig({ glassHighlight: 0.01 }))).toBe(false);
  });
});
