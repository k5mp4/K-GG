import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { StoreSnapshot } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

function snapshot(): StoreSnapshot {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    animation: { ...STORE_DEFAULTS.animation },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    radon: { ...STORE_DEFAULTS.radon },
    iridescence: { ...STORE_DEFAULTS.iridescence },
    manualDistort: {
      ...STORE_DEFAULTS.manualDistort,
      displacement: [...STORE_DEFAULTS.manualDistort.displacement],
      smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask],
    },
    postprocess: { ...STORE_DEFAULTS.postprocess },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline, effectStack: STORE_DEFAULTS.effectPipeline.effectStack.map(layer => ({ ...layer })) },
    matcap: { ...STORE_DEFAULTS.matcap },
    keyframeTracks: {},
  };
}

describe('presetThumbnail', () => {
  it('creates an isolated normalized render state without changing the snapshot', () => {
    const source = snapshot();
    const displacement = source.manualDistort?.displacement;
    const preview = createPresetThumbnailState(source);

    expect(preview.width).toBe(320);
    expect(preview.height).toBe(200);
    expect(preview.sourceImageCanvas).toBeNull();
    expect(preview.imageMaskEnabled).toBe(false);
    expect(preview.seamless).toEqual(STORE_DEFAULTS.seamless);
    expect(preview.manualDistort.displacement).not.toBe(displacement);
    expect(source.manualDistort?.displacement).toBe(displacement);
  });

  it('fills new Diffuse and Slit fields when loading a legacy snapshot', () => {
    const legacy = snapshot();
    const legacyDiffuse = { ...legacy.diffuse };
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).halftoneShape;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).halftoneSize;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).asciiCharset;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).backgroundColor;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).adaptiveChannel;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).grainAdaptiveEnabled;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).grainAdaptiveAmount;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).grainBezier;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).asciiFont;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).asciiFontSize;
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).asciiRotation;

    const preview = createPresetThumbnailState({
      ...legacy,
      diffuse: legacyDiffuse,
    });

    expect(preview.diffuse.halftoneShape).toBe(STORE_DEFAULTS.diffuse.halftoneShape);
    expect(preview.diffuse.asciiCharset).toBe(STORE_DEFAULTS.diffuse.asciiCharset);
    expect(preview.diffuse.backgroundColor).toBe(STORE_DEFAULTS.diffuse.backgroundColor);
    expect(preview.diffuse.grainBezier).toEqual(STORE_DEFAULTS.diffuse.grainBezier);
    expect(preview.diffuse.asciiFont).toBe(STORE_DEFAULTS.diffuse.asciiFont);
    expect(preview.diffuse.asciiFontSize).toBe(STORE_DEFAULTS.diffuse.asciiFontSize);
    expect(preview.diffuse.asciiRotation).toBe(STORE_DEFAULTS.diffuse.asciiRotation);
    expect('autoLoop' in preview.slitScan).toBe(false);
  });
});
