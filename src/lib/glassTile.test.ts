import { describe, expect, it } from 'vitest';
import type { PostprocessConfig } from '../types/distortion';
import {
  GLASS_TILE_DEFAULTS,
  GLASS_TILE_LIMITS,
  getGlassTileSamplePadding,
  isGlassTileOpticallyIdentity,
  normalizeGlassTileRenderParameters,
} from './glassTile';
import { getPostprocessStackSamplePadding } from './glass';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { getEnumParameterDefault, getEnumParameterLimit } from './parameterLimits';

function tileConfig(overrides: Partial<PostprocessConfig> = {}): PostprocessConfig {
  return {
    enabled: true,
    effectMode: 'glassTile',
    effectStack: [{ kind: 'glassTile', enabled: true }],
    ...overrides,
  } as PostprocessConfig;
}

describe('GlassTile parameter contract', () => {
  it('normalizes the AE KG_Glass defaults and enum values', () => {
    const params = normalizeGlassTileRenderParameters({});

    expect(params).toEqual({
      pattern: 'square',
      patternIndex: 0,
      facetDensity: GLASS_TILE_DEFAULTS.facetDensity,
      facetDepth: GLASS_TILE_DEFAULTS.facetDepth,
      tileSize: GLASS_TILE_DEFAULTS.tileSize,
      bevel: GLASS_TILE_DEFAULTS.bevel,
      surfaceHeight: GLASS_TILE_DEFAULTS.surfaceHeight,
      curvature: GLASS_TILE_DEFAULTS.curvature,
      refraction: GLASS_TILE_DEFAULTS.refraction,
      dispersion: GLASS_TILE_DEFAULTS.dispersion,
      roughness: GLASS_TILE_DEFAULTS.roughness,
      detailScale: GLASS_TILE_DEFAULTS.detailScale,
      rotationRadians: 0,
      mix: GLASS_TILE_DEFAULTS.mix,
      edgeMode: getEnumParameterDefault('postprocess.glassTileEdgeMode'),
      edgeModeIndex: 2,
      seed: GLASS_TILE_DEFAULTS.seed,
    });
  });

  it('clamps malformed values to renderer-safe limits', () => {
    const params = normalizeGlassTileRenderParameters({
      glassTilePattern: 'unknown' as never,
      glassTileSize: Number.POSITIVE_INFINITY,
      glassTileBevel: Number.NaN,
      glassTileSurfaceHeight: -1,
      glassTileCurvature: 2,
      glassTileRefraction: Number.POSITIVE_INFINITY,
      glassTileDispersion: -1,
      glassTileRoughness: Number.NaN,
      glassTileDetailScale: Number.POSITIVE_INFINITY,
      glassTileRotation: Number.NEGATIVE_INFINITY,
      glassTileMix: Number.NaN,
      glassTileEdgeMode: 'unknown' as never,
      glassTileSeed: Number.POSITIVE_INFINITY,
    });

    expect(params.tileSize).toBe(GLASS_TILE_DEFAULTS.tileSize);
    expect(params.bevel).toBe(GLASS_TILE_DEFAULTS.bevel);
    expect(params.surfaceHeight).toBe(0);
    expect(params.curvature).toBe(1);
    expect(params.refraction).toBe(GLASS_TILE_DEFAULTS.refraction);
    expect(params.dispersion).toBe(0);
    expect(params.roughness).toBe(GLASS_TILE_DEFAULTS.roughness);
    expect(params.detailScale).toBe(GLASS_TILE_DEFAULTS.detailScale);
    expect(params.rotationRadians).toBe(0);
    expect(params.mix).toBe(GLASS_TILE_DEFAULTS.mix);
    expect(params.edgeMode).toBe(getEnumParameterDefault('postprocess.glassTileEdgeMode'));
    expect(getEnumParameterLimit('postprocess.glassTileEdgeMode').values).toEqual([
      'clamp', 'tile', 'mirror', 'transparent',
    ]);
    expect(params.seed).toBe(GLASS_TILE_DEFAULTS.seed);
    expect(GLASS_TILE_LIMITS.refraction).toBe(256);
  });

  it('normalizes Faceted as a GlassTile pattern with its own density and depth', () => {
    expect(GLASS_TILE_DEFAULTS.facetDensity).toBe(5);
    expect(GLASS_TILE_DEFAULTS.facetDepth).toBe(0.48);
    expect(GLASS_TILE_LIMITS.facetDensity).toBe(16);
    expect(GLASS_TILE_LIMITS.facetDepth).toBe(1);
    expect(normalizeGlassTileRenderParameters({
      glassTilePattern: 'faceted',
      glassTileFacetDensity: 8.4,
      glassTileFacetDepth: 0.72,
    })).toEqual(expect.objectContaining({
      pattern: 'faceted',
      patternIndex: 5,
      facetDensity: 8.4,
      facetDepth: 0.72,
    }));
    expect(normalizeGlassTileRenderParameters({
      glassTileFacetDensity: 99,
      glassTileFacetDepth: Number.NaN,
    })).toEqual(expect.objectContaining({
      facetDensity: 16,
      facetDepth: 0.48,
    }));
  });

  it('uses the largest dispersed refraction radius for tiled export padding', () => {
    const params = normalizeGlassTileRenderParameters({
      glassTileRefraction: GLASS_TILE_LIMITS.refraction,
      glassTileDispersion: GLASS_TILE_LIMITS.dispersion,
    });
    expect(getGlassTileSamplePadding(tileConfig({
      glassTileRefraction: GLASS_TILE_LIMITS.refraction,
      glassTileDispersion: GLASS_TILE_LIMITS.dispersion,
    }))).toBe(Math.ceil(params.refraction * (1 + params.dispersion)) + 2);
  });

  it('combines Glass and GlassTile dependency radii when both layers are active', () => {
    const pipeline = createDefaultEffectPipeline();
    const withTile = updateEffectStackLayer(pipeline.effectStack, 'glassTile', { enabled: true });
    const withGlass = updateEffectStackLayer(withTile, 'glass', { enabled: true });

    expect(getPostprocessStackSamplePadding(
      tileConfig({ glassTileRefraction: 20, glassTileDispersion: 0.1 }),
      { ...pipeline, effectStack: withGlass },
    )).toBe(40 + Math.ceil(20 * 1.1) + 2);
  });

  it('recognizes the mix and zero-surface endpoints as identity', () => {
    expect(isGlassTileOpticallyIdentity(tileConfig({ glassTileMix: 0 }))).toBe(true);
    expect(isGlassTileOpticallyIdentity(tileConfig({ glassTileSurfaceHeight: 0 }))).toBe(true);
    expect(isGlassTileOpticallyIdentity(tileConfig({ glassTileRefraction: 1 }))).toBe(false);
    expect(isGlassTileOpticallyIdentity(tileConfig({
      glassTilePattern: 'faceted',
      glassTileFacetDepth: 0,
      glassTileSurfaceHeight: 0.45,
    }))).toBe(true);
    expect(isGlassTileOpticallyIdentity(tileConfig({
      glassTilePattern: 'faceted',
      glassTileFacetDepth: 0.48,
      glassTileSurfaceHeight: 0,
    }))).toBe(false);
  });
});
