import { describe, expect, it } from 'vitest';
import { DEFAULT_MATERIAL_FIELD, normalizeMaterialFieldConfig } from './materialField';
import { DEFAULT_GRADIENT_FIELD_INPUT, normalizeGradientFieldInput } from './gradient';

describe('material field normalization', () => {
  it('uses independent defaults for missing or malformed settings', () => {
    expect(normalizeMaterialFieldConfig(undefined)).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(normalizeMaterialFieldConfig(null)).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(normalizeMaterialFieldConfig({ seed: NaN, scale: Infinity, morph: '1' })).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(normalizeMaterialFieldConfig({})).not.toBe(DEFAULT_MATERIAL_FIELD);
  });

  it('bounds optical structure and rounds discrete seed and loop counts', () => {
    expect(normalizeMaterialFieldConfig({ seed: 10.7, cycles: 2.8, scale: 90, thickness: -1, thicknessVariation: 5, cracks: 9, phase: -2 }))
      .toMatchObject({ seed: 11, cycles: 3, scale: 32, thickness: 0, thicknessVariation: 1, cracks: 1, phase: 0 });
    expect(normalizeMaterialFieldConfig({ seed: 70000, cycles: 20 })).toMatchObject({ seed: 65535, cycles: 8 });
  });

  it('keeps legacy gradient input disabled and rejects unknown sources', () => {
    expect(normalizeGradientFieldInput(undefined)).toEqual(DEFAULT_GRADIENT_FIELD_INPUT);
    expect(normalizeGradientFieldInput({ source: 'unknown', influence: Infinity })).toEqual(DEFAULT_GRADIENT_FIELD_INPUT);
    expect(normalizeGradientFieldInput({ source: 'cracks', influence: 2 })).toEqual({ source: 'cracks', influence: 1 });
  });
});
