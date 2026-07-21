import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { StoreSnapshot } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

function snapshot(): StoreSnapshot {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    animation: { ...STORE_DEFAULTS.animation },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    radon: { ...STORE_DEFAULTS.radon },
    iridescence: { ...STORE_DEFAULTS.iridescence },
    manualDistort: {
      ...STORE_DEFAULTS.manualDistort,
      displacement: [...STORE_DEFAULTS.manualDistort.displacement],
      smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask],
    },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline, effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })) },
    matcap: { ...STORE_DEFAULTS.matcap },
    keyframeTracks: {},
  };
}

describe('presetThumbnail', () => {
  it('creates an isolated normalized render state without changing the snapshot', () => {
    const source = snapshot();
    const displacement = source.manualDistort?.displacement;
    const preview = createPresetThumbnailState(source);

    expect(preview.width).toBe(320);
    expect(preview.height).toBe(200);
    expect(preview.sourceImageCanvas).toBeNull();
    expect(preview.imageMaskEnabled).toBe(false);
    expect(preview.manualDistort.displacement).not.toBe(displacement);
    expect(source.manualDistort?.displacement).toBe(displacement);
  });
});
