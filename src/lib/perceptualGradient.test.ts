import { describe, expect, it } from 'vitest';
import {
  generatePerceptualGradient,
  isOklchInSrgbGamut,
  mapOklchToSrgb,
  type PerceptualGradientParams,
} from './perceptualGradient';

const FAMILIES = ['sweep', 'soft', 'pastel', 'deep', 'accent'] as const;
const BASE_PARAMS: PerceptualGradientParams = {
  family: 'sweep',
  baseHue: 210,
  hueTravel: 180,
  brightness: 0.55,
  contrast: 0.55,
  chroma: 0.7,
  accentPosition: 0.58,
  accentWidth: 0.16,
  stopCount: 6,
  sampleCount: 128,
};

describe('perceptual gradient generation', () => {
  it('generates every family with valid, ordered stops', () => {
    for (const family of FAMILIES) {
      const stops = generatePerceptualGradient({ ...BASE_PARAMS, family });
      expect(stops).toHaveLength(6);
      expect(stops.map((stop) => stop.position)).toEqual(
        Array.from({ length: 6 }, (_, index) => index / 5),
      );
      stops.forEach((stop) => expect(stop.color).toMatch(/^#[0-9A-F]{6}$/));
    }
  });

  it('supports hue wrapping and negative hue travel', () => {
    const stops = generatePerceptualGradient({ ...BASE_PARAMS, baseHue: 359, hueTravel: -540 });
    expect(stops).toHaveLength(BASE_PARAMS.stopCount);
    expect(stops.map((stop) => stop.color)).not.toEqual(
      generatePerceptualGradient({ ...BASE_PARAMS, baseHue: 359, hueTravel: 540 }).map((stop) => stop.color),
    );
  });

  it('maps extreme chroma into sRGB by reducing chroma instead of producing invalid RGB', () => {
    const mapped = mapOklchToSrgb({ L: 0.5, C: 4, H: -725 });
    expect(mapped.wasGamutMapped).toBe(true);
    expect(isOklchInSrgbGamut(mapped.oklch)).toBe(true);
    expect(mapped.hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('keeps nearby high-chroma samples inside sRGB after gamut mapping', () => {
    for (let index = 0; index < 64; index += 1) {
      const mapped = mapOklchToSrgb({
        L: 0.08 + index * 0.0137,
        C: 0.5,
        H: 0.5 + index * 5.61,
      });
      expect(isOklchInSrgbGamut(mapped.oklch)).toBe(true);
    }
  });

  it('keeps black, white, gray and extreme parameter inputs finite', () => {
    for (const baseHue of [0, 120, 240]) {
      const stops = generatePerceptualGradient({
        ...BASE_PARAMS,
        baseHue,
        brightness: Number.NaN,
        contrast: Number.POSITIVE_INFINITY,
        chroma: Number.MAX_VALUE,
        hueTravel: Number.NEGATIVE_INFINITY,
        stopCount: 10,
      });
      stops.forEach((stop) => expect(stop.color).toMatch(/^#[0-9A-F]{6}$/));
    }
  });

  it('uses perceptual resampling when the equalization blend is enabled', () => {
    const uniform = generatePerceptualGradient({ ...BASE_PARAMS, equalization: 0 });
    const equalized = generatePerceptualGradient({ ...BASE_PARAMS, equalization: 1 });
    expect(equalized.map((stop) => stop.color)).not.toEqual(uniform.map((stop) => stop.color));
  });
});
