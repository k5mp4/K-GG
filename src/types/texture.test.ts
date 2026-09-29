import { describe, expect, it } from 'vitest';
import { getParameterDefault } from '../lib/parameterLimits';
import {
  DEFAULT_TEXTURE,
  TEXTURE_LIMIT_KEYS,
  TEXTURE_PRESETS,
  TEXTURE_PRESET_LOOKS,
  getTexturePresetPatch,
  isRadialTexturePreset,
  normalizeTextureConfig,
  resolveTextureLightAngle,
} from './texture';

describe('Texture config', () => {
  it('starts disabled with the brushed-metal look from the parameter registry', () => {
    expect(DEFAULT_TEXTURE.enabled).toBe(false);
    expect(DEFAULT_TEXTURE.source).toBe('procedural');
    expect(DEFAULT_TEXTURE.preset).toBe('brushedMetal');
    for (const [key, limitKey] of Object.entries(TEXTURE_LIMIT_KEYS)) {
      expect(DEFAULT_TEXTURE[key as keyof typeof TEXTURE_LIMIT_KEYS]).toBe(getParameterDefault(limitKey as never));
    }
    for (const [key, value] of Object.entries(TEXTURE_PRESET_LOOKS.brushedMetal)) {
      expect(DEFAULT_TEXTURE[key as keyof typeof DEFAULT_TEXTURE]).toBe(value);
    }
  });

  it('returns the defaults for missing or malformed persisted data', () => {
    expect(normalizeTextureConfig(undefined)).toEqual(DEFAULT_TEXTURE);
    expect(normalizeTextureConfig(null)).toEqual(DEFAULT_TEXTURE);
    expect(normalizeTextureConfig('brushed')).toEqual(DEFAULT_TEXTURE);
    expect(normalizeTextureConfig({ strength: 'high', roughness: Number.NaN, enabled: 'yes' })).toEqual(DEFAULT_TEXTURE);
  });

  it('clamps numbers, wraps angles, and falls back for unknown enum values', () => {
    const normalized = normalizeTextureConfig({
      enabled: true,
      source: 'video',
      preset: 'chrome',
      imageFit: 'stretch',
      strength: 4,
      scale: 0,
      roughness: -1,
      bump: -9,
      lightAngle: -30,
      rotation: 725,
      lightSweep: 2.6,
    });

    expect(normalized.enabled).toBe(true);
    expect(normalized.source).toBe('procedural');
    expect(normalized.preset).toBe('brushedMetal');
    expect(normalized.imageFit).toBe('cover');
    expect(normalized.strength).toBe(1);
    expect(normalized.scale).toBe(0.25);
    expect(normalized.roughness).toBe(0.05);
    expect(normalized.bump).toBe(-2);
    expect(normalized.lightAngle).toBe(330);
    expect(normalized.rotation).toBe(5);
    expect(normalized.lightSweep).toBe(3);
  });

  it('keeps valid values and is idempotent', () => {
    const value = { ...DEFAULT_TEXTURE, enabled: true, source: 'image' as const, preset: 'cdGroove' as const, imageFit: 'tile' as const, diffraction: 0.6 };

    expect(normalizeTextureConfig(value)).toEqual(value);
    expect(normalizeTextureConfig(normalizeTextureConfig(value))).toEqual(value);
  });
});

describe('Texture presets', () => {
  it('defines a look for every preset and marks only the disc presets as radial', () => {
    expect(Object.keys(TEXTURE_PRESET_LOOKS).sort()).toEqual([...TEXTURE_PRESETS].sort());
    expect(TEXTURE_PRESETS.filter(isRadialTexturePreset)).toEqual(['spunMetal', 'cdGroove']);
  });

  it('gives the CD preset its diffraction rainbow and keeps paper isotropic and non-metallic', () => {
    expect(TEXTURE_PRESET_LOOKS.cdGroove.diffraction).toBeGreaterThan(0.5);
    expect(TEXTURE_PRESET_LOOKS.paper.anisotropy).toBe(0);
    expect(TEXTURE_PRESET_LOOKS.paper.metallic).toBe(0);
    expect(TEXTURE_PRESET_LOOKS.brushedMetal.diffraction).toBe(0);
  });

  it('applies a preset without touching enabled, source, image fit, or the grain layout', () => {
    const current = normalizeTextureConfig({ enabled: true, source: 'image', imageFit: 'tile', rotation: 33, centerX: 0.2 });
    const next = normalizeTextureConfig({ ...current, ...getTexturePresetPatch('cdGroove') });

    expect(next).toMatchObject({ enabled: true, source: 'image', imageFit: 'tile', rotation: 33, centerX: 0.2, preset: 'cdGroove' });
    expect(next.diffraction).toBe(TEXTURE_PRESET_LOOKS.cdGroove.diffraction);
  });

  it('keeps every preset look inside the parameter limits', () => {
    for (const preset of TEXTURE_PRESETS) {
      const patch = getTexturePresetPatch(preset);
      expect(normalizeTextureConfig({ ...DEFAULT_TEXTURE, ...patch })).toEqual({ ...DEFAULT_TEXTURE, ...patch });
    }
  });
});

describe('Texture light sweep', () => {
  it('holds the light still without a sweep', () => {
    const config = normalizeTextureConfig({ lightAngle: 40, lightSweep: 0 });

    expect(resolveTextureLightAngle(config, 0)).toBe(40);
    expect(resolveTextureLightAngle(config, 0.73)).toBe(40);
  });

  it('turns the light by whole turns per loop so the loop closes', () => {
    const config = normalizeTextureConfig({ lightAngle: 40, lightSweep: 2 });

    expect(resolveTextureLightAngle(config, 0.25)).toBeCloseTo(220, 6);
    expect(resolveTextureLightAngle(config, 1)).toBeCloseTo(resolveTextureLightAngle(config, 0), 6);
  });

  it('sweeps the other way for negative turns and ignores a non-finite time', () => {
    const config = normalizeTextureConfig({ lightAngle: 90, lightSweep: -1 });

    expect(resolveTextureLightAngle(config, 0.25)).toBeCloseTo(0, 6);
    expect(resolveTextureLightAngle(config, Number.NaN)).toBe(90);
  });
});
