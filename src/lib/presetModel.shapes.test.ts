import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { DEFAULT_SHAPES, normalizeShapesConfig } from '../types/shapes';
import type { StoreSnapshot } from './presetModel';
import { isPreset, makePreset } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

/** makePreset reads the Diffuse curve, so every saved snapshot carries the store default. */
const BASE_STATE = { diffuse: STORE_DEFAULTS.diffuse } as unknown as StoreSnapshot;

const CUSTOM_SHAPES = normalizeShapesConfig({
  enabled: true,
  source: 'custom',
  fillSource: 'ripple',
  reveal: 'flicker',
  transparentBackground: true,
  scale: 0.5,
  offsetX: -0.2,
  offsetY: 0.3,
  rotation: 30,
  fillCycles: -3,
  glowRadius: 0.2,
  revealCycles: 4,
  revealHidden: 0.1,
});

describe('Shapes preset persistence', () => {
  it('saves the Shapes settings (not the loaded SVG) and reloads them from JSON', () => {
    const saved = makePreset('Shapes', { ...BASE_STATE, shapes: CUSTOM_SHAPES } as StoreSnapshot);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    expect(normalizeShapesConfig(reloaded.state.shapes)).toEqual(CUSTOM_SHAPES);
    expect(JSON.stringify(reloaded)).not.toContain('customMask');
  });

  it('gives presets saved before Shapes the disabled defaults', () => {
    const saved = makePreset('Legacy', BASE_STATE);
    const legacy = JSON.parse(JSON.stringify(saved)) as { state: Record<string, unknown> };
    delete legacy.state.shapes;

    expect(saved.state.shapes).toEqual(DEFAULT_SHAPES);
    expect(normalizeShapesConfig(legacy.state.shapes)).toEqual(DEFAULT_SHAPES);
  });

  it('renders thumbnails with the saved look but without a session SVG', () => {
    const thumbnail = createPresetThumbnailState({
      gradient: { ...STORE_DEFAULTS.gradient },
      noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
      diffuse: { ...STORE_DEFAULTS.diffuse },
      slitScan: { ...STORE_DEFAULTS.slitScan },
      animation: { ...STORE_DEFAULTS.animation },
      normalMap: { ...STORE_DEFAULTS.normalMap },
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
      shapes: CUSTOM_SHAPES,
      keyframeTracks: {},
    } as unknown as StoreSnapshot);

    expect(thumbnail.shapes).toEqual(CUSTOM_SHAPES);
    expect(thumbnail.shapesCustomMask).toBeNull();
  });
});

describe('Shapes store', () => {
  it('normalizes partial updates', () => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    useGradientStore.getState().setShapes({ enabled: true, scale: 42, reveal: 'wipe' });

    expect(useGradientStore.getState().shapes).toMatchObject({ enabled: true, scale: 1.5, reveal: 'wipe', source: 'star' });
  });
});
