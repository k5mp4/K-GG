import type {
  EffectPipelineConfig,
  GlassTileEdgeMode,
  GlassTilePattern,
  PostprocessConfig,
} from '../types/distortion';
import { isEffectStackLayerEnabled } from './effectPipeline';
import { isPostprocessLayerEnabled } from './postprocessStack';
import {
  clampParameter,
  getEnumParameterDefault,
  getParameterDefault,
  getParameterLimit,
  normalizeEnumParameter,
} from './parameterLimits';

export const GLASS_TILE_LIMITS = {
  tileSize: getParameterLimit('postprocess.glassTileSize').max,
  bevel: getParameterLimit('postprocess.glassTileBevel').max,
  surfaceHeight: getParameterLimit('postprocess.glassTileSurfaceHeight').max,
  curvature: getParameterLimit('postprocess.glassTileCurvature').max,
  refraction: getParameterLimit('postprocess.glassTileRefraction').max,
  dispersion: getParameterLimit('postprocess.glassTileDispersion').max,
  roughness: getParameterLimit('postprocess.glassTileRoughness').max,
  detailScale: getParameterLimit('postprocess.glassTileDetailScale').max,
  rotation: Math.max(
    Math.abs(getParameterLimit('postprocess.glassTileRotation').min),
    Math.abs(getParameterLimit('postprocess.glassTileRotation').max),
  ),
  mix: getParameterLimit('postprocess.glassTileMix').max,
  seed: getParameterLimit('postprocess.glassTileSeed').max,
} as const;

export const GLASS_TILE_DEFAULTS = {
  pattern: 'square' as GlassTilePattern,
  tileSize: getParameterDefault('postprocess.glassTileSize'),
  bevel: getParameterDefault('postprocess.glassTileBevel'),
  surfaceHeight: getParameterDefault('postprocess.glassTileSurfaceHeight'),
  curvature: getParameterDefault('postprocess.glassTileCurvature'),
  refraction: getParameterDefault('postprocess.glassTileRefraction'),
  dispersion: getParameterDefault('postprocess.glassTileDispersion'),
  roughness: getParameterDefault('postprocess.glassTileRoughness'),
  detailScale: getParameterDefault('postprocess.glassTileDetailScale'),
  rotation: getParameterDefault('postprocess.glassTileRotation'),
  mix: getParameterDefault('postprocess.glassTileMix'),
  edgeMode: getEnumParameterDefault('postprocess.glassTileEdgeMode') as GlassTileEdgeMode,
  seed: getParameterDefault('postprocess.glassTileSeed'),
} as const;

export type GlassTileRenderParameters = {
  pattern: GlassTilePattern;
  patternIndex: number;
  tileSize: number;
  bevel: number;
  surfaceHeight: number;
  curvature: number;
  refraction: number;
  dispersion: number;
  roughness: number;
  detailScale: number;
  rotationRadians: number;
  mix: number;
  edgeMode: GlassTileEdgeMode;
  edgeModeIndex: number;
  seed: number;
};

const PATTERN_INDEX: Record<GlassTilePattern, number> = {
  square: 0,
  diamond: 1,
  hexagon: 2,
  triangle: 3,
  brick: 4,
};

const EDGE_MODE_INDEX: Record<GlassTileEdgeMode, number> = {
  clamp: 0,
  tile: 1,
  mirror: 2,
  transparent: 3,
};

const PATTERNS = new Set<GlassTilePattern>(Object.keys(PATTERN_INDEX) as GlassTilePattern[]);

function normalizePattern(value: unknown): GlassTilePattern {
  return typeof value === 'string' && PATTERNS.has(value as GlassTilePattern)
    ? value as GlassTilePattern
    : GLASS_TILE_DEFAULTS.pattern;
}

export function normalizeGlassTileRenderParameters(
  config: Partial<Pick<
    PostprocessConfig,
    | 'glassTilePattern'
    | 'glassTileSize'
    | 'glassTileBevel'
    | 'glassTileSurfaceHeight'
    | 'glassTileCurvature'
    | 'glassTileRefraction'
    | 'glassTileDispersion'
    | 'glassTileRoughness'
    | 'glassTileDetailScale'
    | 'glassTileRotation'
    | 'glassTileMix'
    | 'glassTileEdgeMode'
    | 'glassTileSeed'
  >> = {},
): GlassTileRenderParameters {
  const pattern = normalizePattern(config.glassTilePattern);
  const edgeMode = normalizeEnumParameter('postprocess.glassTileEdgeMode', config.glassTileEdgeMode);
  const rotation = clampParameter(config.glassTileRotation, GLASS_TILE_DEFAULTS.rotation, getParameterLimit('postprocess.glassTileRotation'));
  return {
    pattern,
    patternIndex: PATTERN_INDEX[pattern],
    tileSize: clampParameter(config.glassTileSize, GLASS_TILE_DEFAULTS.tileSize, getParameterLimit('postprocess.glassTileSize')),
    bevel: clampParameter(config.glassTileBevel, GLASS_TILE_DEFAULTS.bevel, getParameterLimit('postprocess.glassTileBevel')),
    surfaceHeight: clampParameter(config.glassTileSurfaceHeight, GLASS_TILE_DEFAULTS.surfaceHeight, getParameterLimit('postprocess.glassTileSurfaceHeight')),
    curvature: clampParameter(config.glassTileCurvature, GLASS_TILE_DEFAULTS.curvature, getParameterLimit('postprocess.glassTileCurvature')),
    refraction: clampParameter(config.glassTileRefraction, GLASS_TILE_DEFAULTS.refraction, getParameterLimit('postprocess.glassTileRefraction')),
    dispersion: clampParameter(config.glassTileDispersion, GLASS_TILE_DEFAULTS.dispersion, getParameterLimit('postprocess.glassTileDispersion')),
    roughness: clampParameter(config.glassTileRoughness, GLASS_TILE_DEFAULTS.roughness, getParameterLimit('postprocess.glassTileRoughness')),
    detailScale: clampParameter(config.glassTileDetailScale, GLASS_TILE_DEFAULTS.detailScale, getParameterLimit('postprocess.glassTileDetailScale')),
    rotationRadians: rotation * Math.PI / 180,
    mix: clampParameter(config.glassTileMix, GLASS_TILE_DEFAULTS.mix, getParameterLimit('postprocess.glassTileMix')),
    edgeMode,
    edgeModeIndex: EDGE_MODE_INDEX[edgeMode],
    seed: clampParameter(config.glassTileSeed, GLASS_TILE_DEFAULTS.seed, getParameterLimit('postprocess.glassTileSeed')),
  };
}

const GLASS_TILE_ZERO_EPSILON = 0.0001;

export function isGlassTileOpticallyIdentity(
  postprocess: PostprocessConfig | Partial<PostprocessConfig> | null | undefined,
): boolean {
  const params = normalizeGlassTileRenderParameters(postprocess ?? {});
  return params.mix <= GLASS_TILE_ZERO_EPSILON
    || params.surfaceHeight <= GLASS_TILE_ZERO_EPSILON
    || params.refraction <= GLASS_TILE_ZERO_EPSILON;
}

export function getGlassTileSamplePadding(
  postprocess: PostprocessConfig | null | undefined,
  effectPipeline?: EffectPipelineConfig | null,
): number {
  const active = effectPipeline?.version === 'stack-v2'
    ? isEffectStackLayerEnabled(effectPipeline, 'glassTile')
    : Boolean(postprocess?.enabled && postprocess && isPostprocessLayerEnabled(postprocess, 'glassTile'));
  if (!active || !postprocess || isGlassTileOpticallyIdentity(postprocess)) return 0;

  const params = normalizeGlassTileRenderParameters(postprocess);
  return Math.ceil(params.refraction * (1 + params.dispersion)) + 2;
}
