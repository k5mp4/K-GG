import type { EffectPipelineConfig } from '../types/distortion';
import { isGlassOpticallyIdentity } from './glass';
import { getActivePostprocessStackLayers } from './postprocessStack';
import type { LazyProgramKey } from './webglShaderSources';
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
  'imageGradientEnabled' | 'forceTextureDiffusePass' | 'flowGradientEnabled'
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
export function getRequiredSceneProgramKeys(state: LatestState): LazyProgramKey[] {
  const required: LazyProgramKey[] = [];
  const add = (key: LazyProgramKey, needed: boolean) => {
    if (needed && !required.includes(key)) required.push(key);
  };
  const imageGradientProtected = state.imageGradient.enabled && Boolean(state.imageGradientSource);

  if (state.effectPipeline.version === 'stack-v2') {
    const plan = getSceneRenderPlan(getSceneRenderPlanInput(state, {
      imageGradientEnabled: imageGradientProtected,
    }));
    if (!plan) return required;
    const protectedStipple = imageGradientProtected
      && state.diffuse.mode === 'legacy'
      && plan.diffuseEnabled;
    add('generator', plan.programs.generator);
    add('stackCore', (!imageGradientProtected || protectedStipple) && plan.programs.stackCore);
    add('noiseStack', !imageGradientProtected && plan.programs.noiseStack);
    add('noiseDiffuseStack', !imageGradientProtected && plan.programs.noiseDiffuseStack);
    add('glassV2', !imageGradientProtected && plan.programs.glassV2 && !isGlassOpticallyIdentity(state.postprocess));
    add('normalMap', plan.programs.normalMap);
    add('blur', plan.programs.blur);
    add('stretch', !imageGradientProtected && plan.programs.stretch);
    add('prism', plan.programs.prism);
    add('prismComposite', plan.programs.prismComposite);
    add('particles', plan.programs.particles);
  } else {
    const layers = getActivePostprocessStackLayers(state.postprocess).filter(layer => (
      (layer.kind !== 'glass' && layer.kind !== 'glassV2') || !isGlassOpticallyIdentity(state.postprocess)
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
  const flowGradientEnabled = state.effectPipeline.flowGradientEnabled === true;
  add('flowSplat', flowGradientEnabled);
  add('flowTrail', flowGradientEnabled);
  add('flowComposite', flowGradientEnabled);

  return required;
}
