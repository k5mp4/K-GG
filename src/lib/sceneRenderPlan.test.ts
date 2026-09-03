import { describe, expect, it } from 'vitest';
import { getSceneRenderPlan } from './sceneRenderPlan';
import { getV2RenderPlan } from './effectPipeline';
import { STORE_DEFAULTS } from '../store/gradientStore';

const planInput = {
  effectPipeline: STORE_DEFAULTS.effectPipeline,
  normalMapEnabled: false,
  normalMapBlur: 2,
  prismGlowRadius: 18,
  gradientType: STORE_DEFAULTS.gradient.gradientType,
  sourceImageEnabled: false,
  imageGradientEnabled: false,
  noiseType: STORE_DEFAULTS.noiseDistortion.type,
  noiseLoopMode: STORE_DEFAULTS.noiseDistortion.noiseLoopMode,
  diffuseMode: STORE_DEFAULTS.diffuse.mode,
  clothGradientEnabled: false,
  forceTextureDiffusePass: false,
  seamlessEnabled: false,
  flowGradientEnabled: false,
} as const;

describe('scene render plan boundary', () => {
  it('delegates to the existing V2 plan without changing its contract', () => {
    expect(getSceneRenderPlan(planInput)).toEqual(getV2RenderPlan(
      planInput.effectPipeline,
      planInput,
    ));
  });

  it('does not create a V2 plan for the legacy pipeline', () => {
    expect(getSceneRenderPlan({
      ...planInput,
      effectPipeline: { ...planInput.effectPipeline, version: 'legacy-v1' },
    })).toBeNull();
  });
});
