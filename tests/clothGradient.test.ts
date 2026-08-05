import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLOTH_GRADIENT,
  normalizeClothGradientConfig,
} from '../src/types/clothGradient';
import {
  EFFECT_STACK_KINDS,
  POSTPROCESS_EFFECT_STACK_KINDS,
  canRenderV2Direct,
  createDefaultEffectPipeline,
  getV2RenderPlan,
  isEffectStackKind,
} from '../src/lib/effectPipeline';
import { makePreset, type StoreSnapshot } from '../src/lib/presetModel';

describe('Cloth Gradient Config Normalization', () => {
  it('returns default config when given null or undefined', () => {
    expect(normalizeClothGradientConfig(null)).toEqual(DEFAULT_CLOTH_GRADIENT);
    expect(normalizeClothGradientConfig(undefined)).toEqual(DEFAULT_CLOTH_GRADIENT);
  });

  it('defaults loopEnabled to false', () => {
    expect(DEFAULT_CLOTH_GRADIENT.loopEnabled).toBe(false);
  });

  it('normalizes loopEnabled from raw input', () => {
    expect(normalizeClothGradientConfig({ loopEnabled: true }).loopEnabled).toBe(true);
    expect(normalizeClothGradientConfig({ loopEnabled: false }).loopEnabled).toBe(false);
    expect(normalizeClothGradientConfig({}).loopEnabled).toBe(false);
  });

  it('sanitizes NaN and out-of-bound numbers', () => {
    const raw = {
      enabled: true,
      amplitude1: Number.NaN,
      amplitude2: Number.POSITIVE_INFINITY,
      frequency1: -10,
      lightAzimuth: 999,
      skyLightColor: 'invalid-hex',
      direction1: [0, 0], // zero length
    };
    const normalized = normalizeClothGradientConfig(raw);

    expect(normalized.enabled).toBe(true);
    expect(normalized.amplitude1).toBe(DEFAULT_CLOTH_GRADIENT.amplitude1);
    expect(normalized.amplitude2).toBe(DEFAULT_CLOTH_GRADIENT.amplitude2);
    expect(normalized.frequency1).toBe(0.01); // clamped min
    expect(normalized.lightAzimuth).toBe(360); // clamped max
    expect(normalized.skyLightColor).toBe(DEFAULT_CLOTH_GRADIENT.skyLightColor);
    expect(normalized.direction1).toEqual(DEFAULT_CLOTH_GRADIENT.direction1);
  });

  it('keeps rampOffset and ignores removed ramp-mapping keys', () => {
    const raw = {
      lightWeight: 0.9,
      heightWeight: 0.1,
      fresnelWeight: 0.5,
      flowWeight: 0.2,
      rampLow: -0.5,
      rampHigh: 1.5,
      shadingMix: 0.3,
      rampOffset: 0.25,
    };
    const normalized = normalizeClothGradientConfig(raw);

    // Removed keys are not carried into the normalized config.
    expect('lightWeight' in normalized).toBe(false);
    expect('heightWeight' in normalized).toBe(false);
    expect('fresnelWeight' in normalized).toBe(false);
    expect('flowWeight' in normalized).toBe(false);
    expect('rampLow' in normalized).toBe(false);
    expect('rampHigh' in normalized).toBe(false);
    expect('shadingMix' in normalized).toBe(false);
    // rampOffset is still honored.
    expect(normalized.rampOffset).toBe(0.25);
  });

  it('does not define removed ramp-mapping keys in the default config', () => {
    expect('lightWeight' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('heightWeight' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('fresnelWeight' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('flowWeight' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('rampLow' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('rampHigh' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect('shadingMix' in DEFAULT_CLOTH_GRADIENT).toBe(false);
    expect(DEFAULT_CLOTH_GRADIENT.rampOffset).toBe(0);
  });
});

describe('Effect Stack Isolation', () => {
  it('does not include cloth in EffectStackKind', () => {
    expect(isEffectStackKind('cloth')).toBe(false);
    expect((EFFECT_STACK_KINDS as readonly string[]).includes('cloth')).toBe(false);
    expect((POSTPROCESS_EFFECT_STACK_KINDS as readonly string[]).includes('cloth')).toBe(false);
  });
});

describe('V2 Render Plan & Direct Path Isolation', () => {
  it('bypasses direct path when cloth gradient is enabled', () => {
    const pipeline = createDefaultEffectPipeline();
    // Default pipeline has normalMap=false, prism=false, particles=false
    expect(canRenderV2Direct(pipeline, false, false)).toBe(true);
    // When cloth is enabled, direct path must be false to force FBO allocation
    expect(canRenderV2Direct(pipeline, false, true)).toBe(false);

    const planWithCloth = getV2RenderPlan(pipeline, {
      normalMapEnabled: false,
      normalMapBlur: 0,
      prismGlowRadius: 0,
      clothGradientEnabled: true,
    });
    expect(planWithCloth.framebufferAllocationMode).not.toBe('direct');
  });
});

describe('Preset Roundtrip', () => {
  it('normalizes and preserves clothGradient in preset state', () => {
    const snapshot: Partial<StoreSnapshot> = {
      gradient: { gradientType: 'linear', angle: 0, stops: [], opacityStops: [] } as unknown as StoreSnapshot['gradient'],
      noiseDistortion: {} as unknown as StoreSnapshot['noiseDistortion'],
      diffuse: {} as unknown as StoreSnapshot['diffuse'],
      slitScan: {} as unknown as StoreSnapshot['slitScan'],
      animation: {} as unknown as StoreSnapshot['animation'],
      normalMap: {} as unknown as StoreSnapshot['normalMap'],
      radon: {} as unknown as StoreSnapshot['radon'],
      clothGradient: {
        enabled: true,
        amplitude1: 0.8,
        skyLightColor: '#ff0000',
      } as unknown as StoreSnapshot['clothGradient'],
    };

    const preset = makePreset('Test Cloth Preset', snapshot as StoreSnapshot);
    expect(preset.state.clothGradient).toBeDefined();
    expect(preset.state.clothGradient?.enabled).toBe(true);
    expect(preset.state.clothGradient?.amplitude1).toBe(0.8);
    expect(preset.state.clothGradient?.skyLightColor).toBe('#ff0000');
  });
});
