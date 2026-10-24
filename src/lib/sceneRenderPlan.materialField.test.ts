import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { LatestState } from '../types/latestState';
import type { EffectStackLayer } from '../types/distortion';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { normalizeMeshGradientConfig } from '../types/gradient';
import {
  getRequiredSceneProgramKeys,
  getSceneNoiseProgramVariants,
  getSceneRenderPlan,
  getSceneRenderPlanInput,
} from './sceneRenderPlan';
import {
  GENERATOR_MATERIAL_FIELD_VARIANT,
  GENERATOR_WITHOUT_NOISE_VARIANT,
  getInitialProgramSource,
  getProgramSource,
  NOISE_TYPE_MAP,
} from './webglShaderSources';

function sceneState(patch: Partial<LatestState> = {}): LatestState {
  return {
    ...STORE_DEFAULTS,
    keyframeTracks: {},
    width: 320,
    height: 180,
    animDirection: 0,
    ...patch,
  } as LatestState;
}

const defaultPipeline = createDefaultEffectPipeline();
const noiseFirstStack: EffectStackLayer[] = updateEffectStackLayer(defaultPipeline.effectStack, 'noise', { enabled: true });

/** A scene whose leading Noise + Diffuse fold into the analytic Generator. */
function analyticNoiseState(): LatestState {
  return sceneState({
    gradient: { ...STORE_DEFAULTS.gradient, gradientType: 'linear' },
    effectPipeline: { ...defaultPipeline, effectStack: noiseFirstStack },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion, enabled: true, type: 'simplex', noiseLoopMode: 'legacy' },
    diffuse: { ...STORE_DEFAULTS.diffuse, enabled: true, mode: 'block' },
  });
}

function withFieldInput(state: LatestState, source: 'thickness' | 'cracks' | 'none', influence = 1): LatestState {
  return { ...state, gradient: { ...state.gradient, fieldInput: { source, influence } } };
}

describe('Material Field render plan', () => {
  it('keeps the existing analytic prefix and bootstrap Generator without a field input', () => {
    const state = analyticNoiseState();
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(state));
    expect(plan?.analyticPrefix.enabled).toBe(true);
    expect(getSceneNoiseProgramVariants(state).generator).toBe(NOISE_TYPE_MAP.simplex);

    const zeroInfluence = withFieldInput(state, 'cracks', 0);
    expect(getSceneRenderPlan(getSceneRenderPlanInput(zeroInfluence))).toEqual(plan);
  });

  it('stops analytic fusion and requires the field Generator while the ramp reads the field', () => {
    const state = withFieldInput(analyticNoiseState(), 'thickness');
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(state));
    expect(plan?.analyticPrefix).toMatchObject({ enabled: false, reason: 'material-field' });
    expect(plan?.programs.generator).toBe(true);
    // Noise now runs as its stack pass, composed with Diffuse.
    expect(plan?.programs.noiseDiffuseStack || plan?.programs.noiseStack).toBe(true);
    expect(getRequiredSceneProgramKeys(state)).toContain('generator');
    expect(getSceneNoiseProgramVariants(state).generator).toBe(GENERATOR_MATERIAL_FIELD_VARIANT);
  });

  it('keeps the field program out of an Ice-free gradient without stack layers', () => {
    const state = withFieldInput(sceneState({
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline, effectStack: [] },
    }), 'cracks');
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(state));
    expect(plan?.framebufferAllocationMode).toBe('direct');
    expect(plan?.programs.generator).toBe(true);
    expect(getSceneNoiseProgramVariants(state).generator).toBe(GENERATOR_MATERIAL_FIELD_VARIANT);
  });

  it('does not use the field while Image Gradient protection or Mesh direct color is active', () => {
    const protectedState = withFieldInput(sceneState({
      imageGradient: { ...STORE_DEFAULTS.imageGradient, enabled: true },
      imageGradientSource: {} as HTMLCanvasElement,
    }), 'thickness');
    expect(getSceneRenderPlanInput(protectedState).materialFieldInputActive).toBe(false);
    expect(getSceneNoiseProgramVariants(protectedState).generator).not.toBe(GENERATOR_MATERIAL_FIELD_VARIANT);

    const mesh = normalizeMeshGradientConfig(undefined);
    const direct = withFieldInput(sceneState(), 'cracks');
    direct.gradient = { ...direct.gradient, gradientType: 'mesh', mesh: { ...mesh, colorMode: 'direct' } };
    expect(getSceneNoiseProgramVariants(direct).generator).toBe(GENERATOR_WITHOUT_NOISE_VARIANT);
    direct.gradient = { ...direct.gradient, mesh: { ...mesh, colorMode: 'ramp' } };
    expect(getSceneNoiseProgramVariants(direct).generator).toBe(GENERATOR_MATERIAL_FIELD_VARIANT);
  });

  it('leaves Legacy pipelines on their existing Generator', () => {
    const state = withFieldInput(sceneState({
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline, version: 'legacy-v1' },
    }), 'thickness');
    expect(getSceneNoiseProgramVariants(state).generator).toBe(GENERATOR_WITHOUT_NOISE_VARIANT);
  });
});

describe('Material Field Generator source', () => {
  it('adds the field only to its own variant and leaves the bootstrap source unchanged', () => {
    const bootstrap = getInitialProgramSource().fragment;
    const field = getProgramSource('generator', { noiseVariant: GENERATOR_MATERIAL_FIELD_VARIANT }).fragment;
    expect(bootstrap).not.toContain('#define KGG_MATERIAL_FIELD');
    expect(bootstrap).not.toContain('uniform float u_mfScale');
    expect(field).toContain('#define KGG_BOOTSTRAP');
    expect(field).toContain('#define KGG_MATERIAL_FIELD');
    expect(field).toContain('uniform float u_mfScale');
    expect(getProgramSource('generator', { noiseVariant: NOISE_TYPE_MAP.fbm }).fragment).not.toContain('uniform float u_mfScale');
  });
});
