import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { DEFAULT_DISTORT_CHROMA, normalizeDistortChromaConfig } from '../types/distortChroma';
import type { StoreSnapshot } from './presetModel';
import { isPreset, makePreset } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

/** makePreset reads the Diffuse curve, so every saved snapshot carries the store default. */
const BASE_STATE = { diffuse: STORE_DEFAULTS.diffuse } as unknown as StoreSnapshot;

const CUSTOM = normalizeDistortChromaConfig({
  enabled: true,
  lensSource: 'image',
  wrap: 'mirror',
  amountX: -40,
  amountY: 18.5,
  warpRed: -0.5,
  warpBlue: 1.5,
  steps: 20,
  bump: 55,
  rotate: 135,
  lensBlur: 6,
  color1: '#FF8800',
  color2: '#00FFAA',
  color3: '#8800FF',
  whiteBalance: false,
});

describe('Distort Chroma preset persistence', () => {
  it('saves the settings and reloads them from JSON', () => {
    const saved = makePreset('Chroma', { ...BASE_STATE, distortChroma: CUSTOM } as StoreSnapshot);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    expect(normalizeDistortChromaConfig(reloaded.state.distortChroma)).toEqual(CUSTOM);
  });

  it('gives presets saved before Distort Chroma the disabled defaults', () => {
    const saved = makePreset('Legacy', BASE_STATE);
    const legacy = JSON.parse(JSON.stringify(saved)) as { state: Record<string, unknown> };
    delete legacy.state.distortChroma;

    expect(saved.state.distortChroma).toEqual(DEFAULT_DISTORT_CHROMA);
    expect(normalizeDistortChromaConfig(legacy.state.distortChroma)).toEqual(DEFAULT_DISTORT_CHROMA);
  });

  it('never writes the Lens image into the Preset', () => {
    const saved = makePreset('Image', { ...BASE_STATE, distortChroma: CUSTOM } as StoreSnapshot);

    expect(JSON.stringify(saved)).not.toMatch(/data:image|distortChromaImage/);
  });

  it('renders the thumbnail from the layer input because the Lens image is session-only', () => {
    const state = createPresetThumbnailState({
      gradient: { ...STORE_DEFAULTS.gradient },
      noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
      diffuse: { ...STORE_DEFAULTS.diffuse },
      slitScan: { ...STORE_DEFAULTS.slitScan },
      animation: { ...STORE_DEFAULTS.animation },
      normalMap: { ...STORE_DEFAULTS.normalMap },
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
      distortChroma: CUSTOM,
      keyframeTracks: {},
    } as unknown as StoreSnapshot);

    expect(state.distortChroma).toEqual(CUSTOM);
    expect(state.distortChromaImageSource).toBeNull();
  });
});
