import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { getSceneRenderPlan, getSceneRenderPlanInput } from './sceneRenderPlan';
import { REPRESENTATIVE_RENDER_GOLDEN } from './renderGolden';

const representativeState = {
  gradient: STORE_DEFAULTS.gradient,
  noiseDistortion: STORE_DEFAULTS.noiseDistortion,
  diffuse: STORE_DEFAULTS.diffuse,
  imageGradient: STORE_DEFAULTS.imageGradient,
  normalMap: STORE_DEFAULTS.normalMap,
  postprocess: STORE_DEFAULTS.postprocess,
  effectPipeline: STORE_DEFAULTS.effectPipeline,
  clothGradient: STORE_DEFAULTS.clothGradient,
  seamless: STORE_DEFAULTS.seamless,
  flowGradient: STORE_DEFAULTS.flowGradient,
  sourceImageCanvas: null,
  imageGradientSource: null,
};

describe('representative render golden contract', () => {
  it('fixes the representative inputs and all supported output paths', () => {
    expect(REPRESENTATIVE_RENDER_GOLDEN).toMatchObject({
      preset: 'Kagaribi_15',
      resolution: { width: 800, height: 800 },
      times: [0, 0.5, 1],
      seeds: { noise: 0, diffuse: 0, stretch: 12, flow: 42 },
    });
    expect(REPRESENTATIVE_RENDER_GOLDEN.paths).toEqual([
      'preview',
      'thumbnail',
      'static',
      'sequence',
      'video',
      'tile',
    ]);
  });

  it('keeps the canonical plan used by the representative default frame', () => {
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(representativeState));

    expect(plan).toMatchObject({
      enabledLayers: [{ kind: 'diffuse', enabled: true }],
      analyticPrefix: {
        enabled: true,
        consumedLayers: ['diffuse'],
        firstTextureLayerIndex: null,
        reason: 'enabled',
      },
      framebufferAllocationMode: 'direct',
      programs: {
        stackCore: false,
        noiseStack: false,
        glassV2: false,
        normalMap: false,
        blur: false,
        stretch: false,
        prism: false,
        prismComposite: false,
        particles: false,
      },
    });
  });
});
