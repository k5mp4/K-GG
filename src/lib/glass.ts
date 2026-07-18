import type { EffectPipelineConfig, PostprocessConfig } from '../types/distortion';
import { isPostprocessLayerEnabled } from './postprocessStack';
import { isEffectStackLayerEnabled } from './effectPipeline';

export const GLASS_LIMITS = {
  refraction: 120,
  chromaticAberration: 40,
  roughness: 12,
} as const;

export const GLASS_DEFAULTS = {
  scale: 3.2,
  stretch: 4,
  rotation: 12,
  complexity: 4,
  warp: 0.55,
  seed: 0,
  noiseInfluence: 0,
  refraction: 32,
  chromaticAberration: 4,
  roughness: 1.5,
  highlight: 0.45,
  mix: 1,
  evolution: 0,
  motion: 0.35,
} as const;

export type GlassRenderParameters = {
  scale: number;
  stretch: number;
  rotationRadians: number;
  complexity: number;
  warp: number;
  seed: number;
  noiseInfluence: number;
  refraction: number;
  chromaticAberration: number;
  roughness: number;
  highlight: number;
  mix: number;
  evolution: number;
  motion: number;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function finiteClamped(value: number | undefined, fallback: number, min: number, max: number): number {
  return clamp(Number.isFinite(value) ? value as number : fallback, min, max);
}

export function normalizeGlassRenderParameters(
  config: Partial<Pick<
    PostprocessConfig,
    | 'glassScale'
    | 'glassStretch'
    | 'glassRotation'
    | 'glassComplexity'
    | 'glassWarp'
    | 'glassSeed'
    | 'glassNoiseInfluence'
    | 'glassRefraction'
    | 'glassChromaticAberration'
    | 'glassRoughness'
    | 'glassHighlight'
    | 'glassMix'
    | 'glassEvolution'
    | 'glassMotion'
  >> = {},
): GlassRenderParameters {
  return {
    scale: finiteClamped(config.glassScale, GLASS_DEFAULTS.scale, 0.5, 12),
    stretch: finiteClamped(config.glassStretch, GLASS_DEFAULTS.stretch, 0.25, 8),
    rotationRadians: finiteClamped(config.glassRotation, GLASS_DEFAULTS.rotation, 0, 360) * Math.PI / 180,
    complexity: Math.round(finiteClamped(config.glassComplexity, GLASS_DEFAULTS.complexity, 1, 5)),
    warp: finiteClamped(config.glassWarp, GLASS_DEFAULTS.warp, 0, 1),
    seed: Math.round(finiteClamped(config.glassSeed, GLASS_DEFAULTS.seed, 0, 99)),
    noiseInfluence: smoothGlassNoiseBlend(finiteClamped(config.glassNoiseInfluence, GLASS_DEFAULTS.noiseInfluence, 0, 1)),
    refraction: finiteClamped(config.glassRefraction, GLASS_DEFAULTS.refraction, 0, GLASS_LIMITS.refraction),
    chromaticAberration: finiteClamped(config.glassChromaticAberration, GLASS_DEFAULTS.chromaticAberration, 0, GLASS_LIMITS.chromaticAberration),
    roughness: finiteClamped(config.glassRoughness, GLASS_DEFAULTS.roughness, 0, GLASS_LIMITS.roughness),
    highlight: finiteClamped(config.glassHighlight, GLASS_DEFAULTS.highlight, 0, 2),
    mix: finiteClamped(config.glassMix, GLASS_DEFAULTS.mix, 0, 1),
    evolution: finiteClamped(config.glassEvolution, GLASS_DEFAULTS.evolution, 0, 1),
    motion: finiteClamped(config.glassMotion, GLASS_DEFAULTS.motion, 0, 1),
  };
}

/**
 * Glass固有形状とNoise Distortionの補間率。
 * 端点で一次・二次導関数が0になるため、99%→100%のような操作でも
 * 残ったGlass勾配が急に消えて屈折方向が跳ねることを防ぐ。
 */
export function smoothGlassNoiseBlend(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const GLASS_ZERO_EPSILON = 0.0001;

export function isGlassOpticallyIdentity(
  postprocess: PostprocessConfig | null | undefined,
): boolean {
  const params = normalizeGlassRenderParameters(postprocess ?? {});
  return params.mix <= GLASS_ZERO_EPSILON || (
    params.refraction <= GLASS_ZERO_EPSILON &&
    params.chromaticAberration <= GLASS_ZERO_EPSILON &&
    params.roughness <= GLASS_ZERO_EPSILON &&
    params.highlight <= GLASS_ZERO_EPSILON
  );
}

export function getPostprocessStackSamplePadding(
  postprocess: PostprocessConfig | null | undefined,
  effectPipeline?: EffectPipelineConfig | null,
): number {
  const activeGlassLayerCount = effectPipeline?.version === 'stack-v2'
    ? Number(isEffectStackLayerEnabled(effectPipeline, 'glass'))
      + Number(isEffectStackLayerEnabled(effectPipeline, 'glassV2'))
    : postprocess?.enabled && postprocess
      ? Number(isPostprocessLayerEnabled(postprocess, 'glass'))
        + Number(isPostprocessLayerEnabled(postprocess, 'glassV2'))
      : 0;
  if (activeGlassLayerCount === 0 || !postprocess || isGlassOpticallyIdentity(postprocess)) {
    return 0;
  }

  const params = normalizeGlassRenderParameters(postprocess);
  const perLayerPadding = Math.ceil(
    params.refraction + params.chromaticAberration + params.roughness,
  ) + 2;
  // Consecutive sampling layers expand the source dependency radius. Reserve
  // the sum so Glass -> Glass V2 (or the reverse) cannot clamp the first
  // layer's result at an export tile boundary.
  return perLayerPadding * activeGlassLayerCount;
}

export const getGlassSamplePadding = getPostprocessStackSamplePadding;
