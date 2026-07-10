import { describe, expect, it } from 'vitest';
import { blendImageGradientT, coverImageUv, imageGradientChannelValue } from './imageGradient';
import { IMAGE_GRADIENT_DEFAULTS, normalizeImageGradientConfig } from '../types/imageGradient';

describe('imageGradientChannelValue', () => {
  it('maps luminance and individual RGB channels deterministically', () => {
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'luminance')).toBeCloseTo(0.4451);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'red')).toBe(0.2);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'green')).toBe(0.5);
    expect(imageGradientChannelValue([0.2, 0.5, 0.8], 'blue')).toBe(0.8);
  });
});

describe('coverImageUv', () => {
  it('center-crops a wide image for a square output', () => {
    expect(coverImageUv([0, 0.5], 2000, 1000, 1000, 1000)).toEqual([0.25, 0.5]);
    expect(coverImageUv([1, 0.5], 2000, 1000, 1000, 1000)).toEqual([0.75, 0.5]);
  });

  it('center-crops a tall image for a wide output', () => {
    expect(coverImageUv([0.5, 0], 1000, 2000, 1000, 1000)).toEqual([0.5, 0.25]);
  });
});

describe('blendImageGradientT', () => {
  it('uses the fixed image value at 0%, the anchor value at 100%, and interpolates between them', () => {
    expect(blendImageGradientT(0.2, 0.8, 0)).toBeCloseTo(0.2);
    expect(blendImageGradientT(0.2, 0.8, 0.5)).toBeCloseTo(0.5);
    expect(blendImageGradientT(0.2, 0.8, 1)).toBeCloseTo(0.8);
  });

  it('clamps an invalid influence to the supported range', () => {
    expect(blendImageGradientT(0.2, 0.8, -1)).toBeCloseTo(0.2);
    expect(blendImageGradientT(0.2, 0.8, 2)).toBeCloseTo(0.8);
  });
});

describe('normalizeImageGradientConfig', () => {
  it('uses 50% for a new configuration and preserves valid saved values', () => {
    expect(normalizeImageGradientConfig(undefined)).toEqual(IMAGE_GRADIENT_DEFAULTS);
    expect(normalizeImageGradientConfig({ enabled: true, channel: 'blue', anchorInfluence: 0.75 })).toEqual({
      enabled: true,
      channel: 'blue',
      anchorInfluence: 0.75,
    });
  });

  it('migrates a legacy image-gradient configuration without changing its appearance', () => {
    expect(normalizeImageGradientConfig({ enabled: true, channel: 'luminance' }, 0)).toEqual({
      enabled: true,
      channel: 'luminance',
      anchorInfluence: 0,
    });
  });
});
