import { describe, expect, it } from 'vitest';
import { createDefaultEffectPipeline, updateEffectStackLayer } from './effectPipeline';
import { getIceSampleRadii, getIceTilePadding, getIceTileRequirement, isIceLayerActive } from './ice';
import { getPostprocessStackSamplePadding } from './glass';
import { assertTileRequirement } from './tileRender';
import { DEFAULT_ICE } from '../types/ice';
import { STORE_DEFAULTS } from '../store/gradientStore';

const icePipeline = () => {
  const pipeline = createDefaultEffectPipeline();
  return { ...pipeline, effectStack: updateEffectStackLayer(pipeline.effectStack, 'ice', { enabled: true }) };
};

describe('Ice reference radius and tiles', () => {
  it('scales the reserved radii with the output height', () => {
    expect(getIceSampleRadii(1000)).toEqual({ refraction: 20, dispersion: 2, roughness: 4 });
    expect(getIceTilePadding(1080)).toBe(Math.ceil(1080 * 0.026) + 2);
    expect(getIceTilePadding(Number.NaN)).toBe(3);
  });

  it('is active only for an enabled, non-identity, unprotected V2 layer', () => {
    const base = { ice: { ...DEFAULT_ICE, enabled: true }, effectPipeline: icePipeline(), imageGradientProtected: false };
    expect(isIceLayerActive(base)).toBe(true);
    expect(isIceLayerActive({ ...base, imageGradientProtected: true })).toBe(false);
    expect(isIceLayerActive({ ...base, ice: { ...base.ice, mix: 0 } })).toBe(false);
    expect(isIceLayerActive({ ...base, effectPipeline: { ...base.effectPipeline, version: 'legacy-v1' } })).toBe(false);
    expect(isIceLayerActive({ ...base, effectPipeline: createDefaultEffectPipeline() })).toBe(false);
  });

  it('adds the full Ice margin to the stack padding and requires it strictly', () => {
    const scene = { ice: { ...DEFAULT_ICE, enabled: true, refraction: 0 }, effectPipeline: icePipeline(), imageGradientProtected: false, outputHeight: 2000 };
    const requirement = getIceTileRequirement(scene);
    // The margin uses the radius limits, not the current refraction value.
    expect(requirement).toEqual({ padding: getIceTilePadding(2000), unsupportedReason: null });
    expect(getPostprocessStackSamplePadding(STORE_DEFAULTS.postprocess, scene.effectPipeline, requirement)).toBe(requirement.padding);
    expect(getIceTileRequirement({ ...scene, imageGradientProtected: true })).toEqual({ padding: 0, unsupportedReason: null });

    expect(() => assertTileRequirement(requirement, requirement.padding, 4096)).not.toThrow();
    expect(() => assertTileRequirement(requirement, requirement.padding - 1, 100)).toThrow(/needs \d+px of padding for Ice/);
  });

  it('refuses tiled output when other layers read outside any tile margin', () => {
    const effectPipeline = { ...icePipeline(), effectStack: updateEffectStackLayer(icePipeline().effectStack, 'mirror', { enabled: true }) };
    const requirement = getIceTileRequirement({ ice: { ...DEFAULT_ICE, enabled: true }, effectPipeline, imageGradientProtected: false, outputHeight: 1080 });
    expect(requirement.unsupportedReason).toMatch(/mirror/);
    expect(() => assertTileRequirement(requirement, 9999, 8192)).toThrow(/does not support Ice/);
  });
});
