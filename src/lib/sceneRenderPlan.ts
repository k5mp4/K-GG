import type { EffectPipelineConfig } from '../types/distortion';
import { isGlassOpticallyIdentity } from './glass';
import { isGlassTileOpticallyIdentity } from './glassTile';
import { getActivePostprocessStackLayers } from './postprocessStack';
import {
  GENERATOR_WITHOUT_NOISE_VARIANT,
  getThreeDProgramKey,
  NOISE_TYPE_MAP,
  type LazyProgramKey,
  type NoiseVariantProgramKey,
} from './webglShaderSources';
import type { LatestState } from '../types/latestState';
import { getV2RenderPlan, type V2RenderPlan, type V2RenderPlanOptions } from './effectPipeline';

/**
 * Inputs used to decide which render resources and passes a scene needs.
 * This is intentionally free of WebGL objects and React/store imports.
 */
export type SceneRenderPlanInput = V2RenderPlanOptions & {
  effectPipeline: EffectPipelineConfig;
};

export type SceneRenderPlanOverrides = Partial<Pick<SceneRenderPlanInput,
  'imageGradientEnabled' | 'forceTextureDiffusePass' | 'flowGradientEnabled' | 'analyticNoisePending'
>>;

export type SceneRenderPlanState = Pick<LatestState,
  | 'gradient'
  | 'noiseDistortion'
  | 'diffuse'
  | 'imageGradient'
  | 'normalMap'
  | 'postprocess'
  | 'effectPipeline'
  | 'clothGradient'
  | 'seamless'
  | 'flowGradient'
  | 'sourceImageCanvas'
  | 'imageGradientSource'
  | 'datamosh'
>;

/**
 * Converts the fully evaluated renderer state into the pure plan input.
 * Keeping this mapping here prevents export readiness and frame rendering
 * from independently reinterpreting the same scene state.
 */
export function getSceneRenderPlanInput(
  state: SceneRenderPlanState,
  overrides: SceneRenderPlanOverrides = {},
): SceneRenderPlanInput {
  return {
    effectPipeline: state.effectPipeline,
    normalMapEnabled: state.normalMap.enabled,
    normalMapBlur: state.normalMap.blur,
    prismGlowRadius: state.postprocess.prismGlowRadius ?? 0,
    clothGradientEnabled: state.clothGradient?.enabled ?? false,
    forceTextureDiffusePass: overrides.forceTextureDiffusePass ?? state.diffuse.mode === 'legacy',
    seamlessEnabled: state.seamless?.enabled ?? false,
    flowGradientEnabled: overrides.flowGradientEnabled ?? state.effectPipeline.flowGradientEnabled === true,
    gradientType: state.gradient?.gradientType,
    sourceImageEnabled: Boolean(state.sourceImageCanvas),
    imageGradientEnabled: overrides.imageGradientEnabled
      ?? (state.imageGradient.enabled && Boolean(state.imageGradientSource)),
    noiseType: state.noiseDistortion?.type,
    noiseLoopMode: state.noiseDistortion?.noiseLoopMode,
    diffuseMode: state.diffuse?.mode,
    diffuseApplyMode: state.diffuse?.applyMode,
    analyticNoisePending: overrides.analyticNoisePending,
  };
}

/**
 * Canonical scene-to-render-plan adapter used by both readiness and drawing.
 * Legacy pipelines deliberately return null and keep their existing path.
 */
export function getSceneRenderPlan(input: SceneRenderPlanInput): V2RenderPlan | null {
  if (input.effectPipeline.version !== 'stack-v2') return null;
  return getV2RenderPlan(input.effectPipeline, input);
}

/** Required program variants for preview readiness and every export adapter. */
export function getRequiredSceneProgramKeys(
  state: LatestState,
  options: Pick<SceneRenderPlanOverrides, 'analyticNoisePending'> = {},
): LazyProgramKey[] {
  const required: LazyProgramKey[] = [];
  const add = (key: LazyProgramKey, needed: boolean) => {
    if (needed && !required.includes(key)) required.push(key);
  };
  const imageGradientProtected = state.imageGradient.enabled && Boolean(state.imageGradientSource);

  if (state.effectPipeline.version === 'stack-v2') {
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(state, {
      imageGradientEnabled: imageGradientProtected,
      analyticNoisePending: options.analyticNoisePending,
    }));
    if (!plan) return required;
    const protectedStipple = imageGradientProtected
      && state.diffuse.mode === 'legacy'
      && plan.diffuseEnabled;
    add('generator', plan.programs.generator);
    add('stackCore', (!imageGradientProtected || protectedStipple || plan.programs.texture) && plan.programs.stackCore);
    add('noiseStack', !imageGradientProtected && plan.programs.noiseStack);
    add('noiseDiffuseStack', !imageGradientProtected && plan.programs.noiseDiffuseStack);
    add('glassV2', !imageGradientProtected && plan.programs.glassV2 && !isGlassOpticallyIdentity(state.postprocess));
    add('glassTile', !imageGradientProtected && plan.programs.glassTile && !isGlassTileOpticallyIdentity(state.postprocess));
    add('normalMap', plan.programs.normalMap);
    add('blur', plan.programs.blur);
    add('stretch', !imageGradientProtected && plan.programs.stretch);
    add('prism', plan.programs.prism);
    add('prismComposite', plan.programs.prismComposite);
    add('particles', plan.programs.particles);
    add('datamosh', plan.programs.datamosh);
    if (plan.programs.threeD) add(getThreeDProgramKey(state.coneView.shape), true);
    add('texture', plan.programs.texture);
  } else {
    const layers = getActivePostprocessStackLayers(state.postprocess).filter(layer => (
      (layer.kind !== 'glass' && layer.kind !== 'glassV2' && layer.kind !== 'glassTile')
        || (layer.kind === 'glassTile' ? !isGlassTileOpticallyIdentity(state.postprocess) : !isGlassOpticallyIdentity(state.postprocess))
    ));
    const postprocessRequested = state.postprocess.enabled && layers.length > 0;
    const prismRequested = postprocessRequested && layers.some(layer => layer.kind === 'prism');
    const normalRequested = state.normalMap.enabled && !state.diffuse.enabled;
    add('generator', true);
    add('normalMap', normalRequested);
    add('blur', (normalRequested && state.normalMap.blur >= 0.5)
      || (prismRequested && (state.postprocess.prismGlowRadius ?? 0) > 0.01));
    add('stretch', state.stretch.enabled);
    add('postprocess', postprocessRequested);
    add('prismComposite', prismRequested);
    add('particles', state.postprocess.enabled && state.postprocess.effectMode === 'particles');
  }

  add('seamless', state.seamless?.enabled ?? false);
  add('shapes', state.shapes?.enabled ?? false);
  const flowGradientEnabled = state.effectPipeline.flowGradientEnabled === true;
  add('flowSplat', flowGradientEnabled);
  add('flowTrail', flowGradientEnabled);
  add('flowComposite', flowGradientEnabled);
  if (state.effectPipeline.version !== 'stack-v2') {
    add('datamosh', state.datamosh?.enabled === true);
  }

  return required;
}

/** The compiled variant each Noise-dependent program needs for one frame. */
export type NoiseProgramVariants = Record<NoiseVariantProgramKey, number>;

export type GeneratorVariantInput = {
  isV2Pipeline: boolean;
  imageGradientProtected: boolean;
  renderPlan: V2RenderPlan | null;
  noiseEnabled: boolean;
  manualDistortEnabled: boolean;
};

/**
 * Whether the Generator needs a full variant instead of the bootstrap
 * program, which omits Noise and Manual Distort. V2 evaluates Noise in the
 * Generator only when the analytic prefix consumes the Noise layer, and never
 * runs Manual Distort there; Legacy and protected Image Gradient keep both.
 */
export function generatorNeedsNoiseVariant(input: GeneratorVariantInput): boolean {
  if (input.isV2Pipeline && !input.imageGradientProtected) {
    return input.renderPlan?.analyticPrefix.consumedLayers.includes('noise') === true;
  }
  if (input.noiseEnabled || input.manualDistortEnabled) return true;
  return input.renderPlan?.normalizedStack.some(layer => layer.kind === 'noise' && layer.enabled) === true;
}

/**
 * Selects the per-Noise-type program variants. A Generator that needs no
 * full variant is the bootstrap program, which is ready as soon as WebGL initializes; the
 * stack Noise passes always follow the current Noise type.
 */
export function getNoiseProgramVariants(
  noiseType: keyof typeof NOISE_TYPE_MAP | undefined,
  generatorNeedsVariant: boolean,
): NoiseProgramVariants {
  const noiseVariant = NOISE_TYPE_MAP[noiseType ?? 'simplex'] ?? NOISE_TYPE_MAP.simplex;
  return {
    generator: generatorNeedsVariant ? noiseVariant : GENERATOR_WITHOUT_NOISE_VARIANT,
    noiseStack: noiseVariant,
    noiseDiffuseStack: noiseVariant,
  };
}

/** Program variants for a fully evaluated scene, shared by preview warmup and export. */
export function getSceneNoiseProgramVariants(
  state: LatestState,
  options: Pick<SceneRenderPlanOverrides, 'analyticNoisePending'> = {},
): NoiseProgramVariants {
  const imageGradientProtected = state.imageGradient.enabled && Boolean(state.imageGradientSource);
  const renderPlan = getSceneRenderPlan(getSceneRenderPlanInput(state, {
    imageGradientEnabled: imageGradientProtected,
    analyticNoisePending: options.analyticNoisePending,
  }));
  return getNoiseProgramVariants(state.noiseDistortion?.type, generatorNeedsNoiseVariant({
    isV2Pipeline: state.effectPipeline.version === 'stack-v2',
    imageGradientProtected,
    renderPlan,
    noiseEnabled: state.noiseDistortion?.enabled === true,
    manualDistortEnabled: state.manualDistort?.enabled === true,
  }));
}
