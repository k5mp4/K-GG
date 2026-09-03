import type { EffectPipelineConfig } from '../types/distortion';
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
