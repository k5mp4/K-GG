import type {
  EffectPipelineConfig,
  GlassTileEdgeMode,
  GlassTilePattern,
  PostprocessConfig,
} from '../types/distortion';
import { isEffectStackLayerEnabled } from './effectPipeline';
import { isPostprocessLayerEnabled } from './postprocessStack';

export const GLASS_TILE_LIMITS = {
  tileSize: 4096,
  bevel: 0.5,
  surfaceHeight: 1,
  curvature: 1,
  refraction: 256,
  dispersion: 1,
  roughness: 1,
  detailScale: 16,
  rotation: 180,
  mix: 1,
  seed: 1_000_000,
} as const;

export const GLASS_TILE_DEFAULTS = {
  pattern: 'square' as GlassTilePattern,
  tileSize: 96,
  bevel: 0.18,
  surfaceHeight: 0.45,
  curvature: 0.75,
  refraction: 28,
  dispersion: 0.06,
  roughness: 0.12,
  detailScale: 2,
  rotation: 0,
  mix: 1,
  edgeMode: 'tile' as GlassTileEdgeMode,
  seed: 17,
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
const EDGE_MODES = new Set<GlassTileEdgeMode>(Object.keys(EDGE_MODE_INDEX) as GlassTileEdgeMode[]);

function finiteClamped(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(minimum, Math.min(maximum, numeric));
}

function normalizePattern(value: unknown): GlassTilePattern {
  return typeof value === 'string' && PATTERNS.has(value as GlassTilePattern)
    ? value as GlassTilePattern
    : GLASS_TILE_DEFAULTS.pattern;
}

function normalizeEdgeMode(value: unknown): GlassTileEdgeMode {
  return typeof value === 'string' && EDGE_MODES.has(value as GlassTileEdgeMode)
    ? value as GlassTileEdgeMode
    : GLASS_TILE_DEFAULTS.edgeMode;
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
  const edgeMode = normalizeEdgeMode(config.glassTileEdgeMode);
  const rotation = finiteClamped(config.glassTileRotation, GLASS_TILE_DEFAULTS.rotation, -GLASS_TILE_LIMITS.rotation, GLASS_TILE_LIMITS.rotation);
  return {
    pattern,
    patternIndex: PATTERN_INDEX[pattern],
    tileSize: finiteClamped(config.glassTileSize, GLASS_TILE_DEFAULTS.tileSize, 4, GLASS_TILE_LIMITS.tileSize),
    bevel: finiteClamped(config.glassTileBevel, GLASS_TILE_DEFAULTS.bevel, 0.01, GLASS_TILE_LIMITS.bevel),
    surfaceHeight: finiteClamped(config.glassTileSurfaceHeight, GLASS_TILE_DEFAULTS.surfaceHeight, 0, GLASS_TILE_LIMITS.surfaceHeight),
    curvature: finiteClamped(config.glassTileCurvature, GLASS_TILE_DEFAULTS.curvature, 0, GLASS_TILE_LIMITS.curvature),
    refraction: finiteClamped(config.glassTileRefraction, GLASS_TILE_DEFAULTS.refraction, 0, GLASS_TILE_LIMITS.refraction),
    dispersion: finiteClamped(config.glassTileDispersion, GLASS_TILE_DEFAULTS.dispersion, 0, GLASS_TILE_LIMITS.dispersion),
    roughness: finiteClamped(config.glassTileRoughness, GLASS_TILE_DEFAULTS.roughness, 0, GLASS_TILE_LIMITS.roughness),
    detailScale: finiteClamped(config.glassTileDetailScale, GLASS_TILE_DEFAULTS.detailScale, 0.1, GLASS_TILE_LIMITS.detailScale),
    rotationRadians: rotation * Math.PI / 180,
    mix: finiteClamped(config.glassTileMix, GLASS_TILE_DEFAULTS.mix, 0, GLASS_TILE_LIMITS.mix),
    edgeMode,
    edgeModeIndex: EDGE_MODE_INDEX[edgeMode],
    seed: Math.round(finiteClamped(config.glassTileSeed, GLASS_TILE_DEFAULTS.seed, 0, GLASS_TILE_LIMITS.seed)),
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
