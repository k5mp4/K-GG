import type { EffectPipelineConfig, GlassSurfaceType, PostprocessConfig } from '../types/distortion';
import { isPostprocessLayerEnabled } from './postprocessStack';
import { isEffectStackLayerEnabled } from './effectPipeline';
import { getGlassTileSamplePadding } from './glassTile';
import {
  clampParameter,
  getEnumParameterDefault,
  getParameterDefault,
  getParameterLimit,
  normalizeEnumParameter,
} from './parameterLimits';

export const GLASS_LIMITS = {
  refraction: getParameterLimit('postprocess.glassRefraction').max,
  ior: getParameterLimit('postprocess.glassIor').max,
  chromaticAberration: getParameterLimit('postprocess.glassChromaticAberration').max,
  roughness: getParameterLimit('postprocess.glassRoughness').max,
} as const;

export const GLASS_DEFAULTS = {
  scale: getParameterDefault('postprocess.glassScale'),
  stretch: getParameterDefault('postprocess.glassStretch'),
  rotation: getParameterDefault('postprocess.glassRotation'),
  complexity: getParameterDefault('postprocess.glassComplexity'),
  warp: getParameterDefault('postprocess.glassWarp'),
  seed: getParameterDefault('postprocess.glassSeed'),
  noiseInfluence: getParameterDefault('postprocess.glassNoiseInfluence'),
  surfaceType: getEnumParameterDefault('postprocess.glassSurfaceType'),
  rippleFrequency: getParameterDefault('postprocess.glassRippleFrequency'),
  rippleDepth: getParameterDefault('postprocess.glassRippleDepth'),
  rippleSpeed: getParameterDefault('postprocess.glassRippleSpeed'),
  refraction: getParameterDefault('postprocess.glassRefraction'),
  ior: getParameterDefault('postprocess.glassIor'),
  chromaticAberration: getParameterDefault('postprocess.glassChromaticAberration'),
  chromaticSteps: getParameterDefault('postprocess.glassChromaticSteps'),
  roughness: getParameterDefault('postprocess.glassRoughness'),
  highlight: getParameterDefault('postprocess.glassHighlight'),
  mix: getParameterDefault('postprocess.glassMix'),
  evolution: getParameterDefault('postprocess.glassEvolution'),
  motion: getParameterDefault('postprocess.glassMotion'),
} as const;

export const GLASS_V2_COLOR_DEFAULTS = {
  chromaticHue: getParameterDefault('postprocess.glassV2ChromaticHue'),
  chromaticSaturation: getParameterDefault('postprocess.glassV2ChromaticSaturation'),
  transmissionTint: '#FFFFFF',
  highlightTint: '#FFFFFF',
} as const;

export type GlassRenderParameters = {
  scale: number;
  stretch: number;
  rotationRadians: number;
  complexity: number;
  warp: number;
  seed: number;
  noiseInfluence: number;
  surfaceType: GlassSurfaceType;
  rippleFrequency: number;
  rippleDepth: number;
  rippleSpeed: number;
  refraction: number;
  ior: number;
  chromaticAberration: number;
  chromaticSteps: number;
  roughness: number;
  highlight: number;
  mix: number;
  evolution: number;
  motion: number;
};

export type GlassV2ColorParameters = {
  chromaticHueDegrees: number;
  chromaticHueRadians: number;
  chromaticSaturation: number;
  transmissionTint: string;
  highlightTint: string;
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizedHexColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
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
    | 'glassSurfaceType'
    | 'glassRippleFrequency'
    | 'glassRippleDepth'
    | 'glassRippleSpeed'
    | 'glassRefraction'
    | 'glassIor'
    | 'glassChromaticAberration'
    | 'glassChromaticSteps'
    | 'glassRoughness'
    | 'glassHighlight'
    | 'glassMix'
    | 'glassEvolution'
    | 'glassMotion'
  >> = {},
): GlassRenderParameters {
  return {
    scale: clampParameter(config.glassScale, GLASS_DEFAULTS.scale, getParameterLimit('postprocess.glassScale')),
    stretch: clampParameter(config.glassStretch, GLASS_DEFAULTS.stretch, getParameterLimit('postprocess.glassStretch')),
    rotationRadians: clampParameter(config.glassRotation, GLASS_DEFAULTS.rotation, getParameterLimit('postprocess.glassRotation')) * Math.PI / 180,
    complexity: clampParameter(config.glassComplexity, GLASS_DEFAULTS.complexity, getParameterLimit('postprocess.glassComplexity')),
    warp: clampParameter(config.glassWarp, GLASS_DEFAULTS.warp, getParameterLimit('postprocess.glassWarp')),
    seed: clampParameter(config.glassSeed, GLASS_DEFAULTS.seed, getParameterLimit('postprocess.glassSeed')),
    noiseInfluence: smoothGlassNoiseBlend(clampParameter(config.glassNoiseInfluence, GLASS_DEFAULTS.noiseInfluence, getParameterLimit('postprocess.glassNoiseInfluence'))),
    surfaceType: normalizeEnumParameter('postprocess.glassSurfaceType', config.glassSurfaceType),
    rippleFrequency: clampParameter(config.glassRippleFrequency, GLASS_DEFAULTS.rippleFrequency, getParameterLimit('postprocess.glassRippleFrequency')),
    rippleDepth: clampParameter(config.glassRippleDepth, GLASS_DEFAULTS.rippleDepth, getParameterLimit('postprocess.glassRippleDepth')),
    rippleSpeed: clampParameter(config.glassRippleSpeed, GLASS_DEFAULTS.rippleSpeed, getParameterLimit('postprocess.glassRippleSpeed')),
    refraction: clampParameter(config.glassRefraction, GLASS_DEFAULTS.refraction, getParameterLimit('postprocess.glassRefraction')),
    ior: clampParameter(config.glassIor, GLASS_DEFAULTS.ior, getParameterLimit('postprocess.glassIor')),
    chromaticAberration: clampParameter(config.glassChromaticAberration, GLASS_DEFAULTS.chromaticAberration, getParameterLimit('postprocess.glassChromaticAberration')),
    chromaticSteps: clampParameter(
      config.glassChromaticSteps,
      GLASS_DEFAULTS.chromaticSteps,
      getParameterLimit('postprocess.glassChromaticSteps'),
    ),
    roughness: clampParameter(config.glassRoughness, GLASS_DEFAULTS.roughness, getParameterLimit('postprocess.glassRoughness')),
    highlight: clampParameter(config.glassHighlight, GLASS_DEFAULTS.highlight, getParameterLimit('postprocess.glassHighlight')),
    mix: clampParameter(config.glassMix, GLASS_DEFAULTS.mix, getParameterLimit('postprocess.glassMix')),
    evolution: clampParameter(config.glassEvolution, GLASS_DEFAULTS.evolution, getParameterLimit('postprocess.glassEvolution')),
    motion: clampParameter(config.glassMotion, GLASS_DEFAULTS.motion, getParameterLimit('postprocess.glassMotion')),
  };
}

export function normalizeGlassV2ColorParameters(
  config: Partial<Pick<
    PostprocessConfig,
    | 'glassV2ChromaticHue'
    | 'glassV2ChromaticSaturation'
    | 'glassV2TransmissionTint'
    | 'glassV2HighlightTint'
  >> = {},
): GlassV2ColorParameters {
  const chromaticHueDegrees = clampParameter(
    config.glassV2ChromaticHue,
    GLASS_V2_COLOR_DEFAULTS.chromaticHue,
    getParameterLimit('postprocess.glassV2ChromaticHue'),
  );
  return {
    chromaticHueDegrees,
    chromaticHueRadians: chromaticHueDegrees * Math.PI / 180,
    chromaticSaturation: clampParameter(
      config.glassV2ChromaticSaturation,
      GLASS_V2_COLOR_DEFAULTS.chromaticSaturation,
      getParameterLimit('postprocess.glassV2ChromaticSaturation'),
    ),
    transmissionTint: normalizedHexColor(
      config.glassV2TransmissionTint,
      GLASS_V2_COLOR_DEFAULTS.transmissionTint,
    ),
    highlightTint: normalizedHexColor(
      config.glassV2HighlightTint,
      GLASS_V2_COLOR_DEFAULTS.highlightTint,
    ),
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
    : postprocess?.enabled && postprocess
      ? Number(isPostprocessLayerEnabled(postprocess, 'glassV2'))
      : 0;
  const glassPadding = activeGlassLayerCount === 0 || !postprocess || isGlassOpticallyIdentity(postprocess)
    ? 0
    : (() => {
        const params = normalizeGlassRenderParameters(postprocess);
        // Match the fallback's IOR gain when sizing the source margin for tiled
        // reads; the factor reaches its 3x bound at the maximum IOR.
        const iorScale = Math.max(0, Math.min(3, (params.ior - 1) / 0.5));
        const perLayerPadding = Math.ceil(
          (params.refraction + params.chromaticAberration) * iorScale + params.roughness,
        ) + 2;
        // The normalized Effect Stack contains one V2-backed Glass layer, so
        // its dependency radius is reserved exactly once.
        return perLayerPadding * activeGlassLayerCount;
      })();
  return glassPadding + getGlassTileSamplePadding(postprocess, effectPipeline);
}

export const getGlassSamplePadding = getPostprocessStackSamplePadding;
