import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { FLOW_GRADIENT_DEFAULTS } from '../types/flowGradient';
import { createPresetThumbnailState } from './presetThumbnail';
import { makePreset, type StoreSnapshot } from './presetModel';

function createSnapshot(): StoreSnapshot {
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
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
    matcap: { ...STORE_DEFAULTS.matcap },
    flowGradient: { ...FLOW_GRADIENT_DEFAULTS },
  };
}

describe('Flow Gradient preset compatibility', () => {
  it('round-trips normalized Flow Gradient settings', () => {
    const preset = makePreset('Flow', {
      ...createSnapshot(),
      flowGradient: {
        ...FLOW_GRADIENT_DEFAULTS,
        seed: 123,
        particleCount: 20000,
        trail: 0.4,
        flowOpacity: 0.65,
        particleOpacity: 0.42,
        particleSize: 1.35,
      },
    });

    expect(preset.state.flowGradient).toMatchObject({
      seed: 123,
      particleCount: 20000,
      trail: 0.4,
      flowOpacity: 0.65,
      particleOpacity: 0.42,
      particleSize: 1.35,
    });
  });

  it('provides safe defaults to thumbnails made from old snapshots', () => {
    const state = makePreset('Legacy', createSnapshot()).state;
    delete state.flowGradient;
    const thumbnailState = createPresetThumbnailState(state);

    expect(thumbnailState.flowGradient).toEqual(FLOW_GRADIENT_DEFAULTS);
  });
});
