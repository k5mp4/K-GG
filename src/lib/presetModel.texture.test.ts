import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { DEFAULT_TEXTURE, normalizeTextureConfig } from '../types/texture';
import type { StoreSnapshot } from './presetModel';
import { isPreset, makePreset } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

/** makePreset reads the Diffuse curve, so every saved snapshot carries the store default. */
const BASE_STATE = { diffuse: STORE_DEFAULTS.diffuse } as unknown as StoreSnapshot;

const CUSTOM_TEXTURE = normalizeTextureConfig({
  enabled: true,
  source: 'image',
  preset: 'cdGroove',
  imageFit: 'tile',
  strength: 0.6,
  scale: 2.5,
  rotation: 75,
  bump: -0.4,
  centerX: 0.3,
  centerY: 0.7,
  roughness: 0.2,
  anisotropy: 0.9,
  metallic: 0.5,
  specular: 1.4,
  lightAngle: 210,
  lightHeight: 0.9,
  lightSweep: -2,
  diffraction: 0.8,
  diffractionSpread: 2,
});

describe('Texture preset persistence', () => {
  it('saves the Texture settings and reloads them from JSON', () => {
    const saved = makePreset('Texture', { ...BASE_STATE, texture: CUSTOM_TEXTURE } as StoreSnapshot);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    expect(normalizeTextureConfig(reloaded.state.texture)).toEqual(CUSTOM_TEXTURE);
  });

  it('gives presets saved before Texture the disabled defaults', () => {
    const saved = makePreset('Legacy', BASE_STATE);
    const legacy = JSON.parse(JSON.stringify(saved)) as { state: Record<string, unknown> };
    delete legacy.state.texture;

    expect(saved.state.texture).toEqual(DEFAULT_TEXTURE);
    expect(normalizeTextureConfig(legacy.state.texture)).toEqual(DEFAULT_TEXTURE);
  });

  it('never writes an image into the Preset', () => {
    const saved = makePreset('Image', { ...BASE_STATE, texture: CUSTOM_TEXTURE } as StoreSnapshot);

    expect(JSON.stringify(saved)).not.toMatch(/data:image|textureImage/);
  });

  it('renders the thumbnail from the procedural preset because the image is session-only', () => {
    const state = createPresetThumbnailState({
      gradient: { ...STORE_DEFAULTS.gradient },
      noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
      diffuse: { ...STORE_DEFAULTS.diffuse },
      slitScan: { ...STORE_DEFAULTS.slitScan },
      animation: { ...STORE_DEFAULTS.animation },
      normalMap: { ...STORE_DEFAULTS.normalMap },
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
      texture: CUSTOM_TEXTURE,
      keyframeTracks: {},
    } as unknown as StoreSnapshot);

    expect(state.texture).toEqual(CUSTOM_TEXTURE);
    expect(state.textureImageSource).toBeNull();
  });
});
