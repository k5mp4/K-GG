import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { DEFAULT_MATERIAL_FIELD, normalizeMaterialFieldConfig } from '../types/materialField';
import { DEFAULT_GRADIENT_FIELD_INPUT } from '../types/gradient';
import { compactPresetState, expandPresetState, makePreset } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';

describe('material field preset persistence', () => {
  it('defaults old presets to no field-driven color', () => {
    const preset = makePreset('Legacy', STORE_DEFAULTS);
    expect(preset.state.materialField).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(preset.state.gradient.fieldInput).toEqual(DEFAULT_GRADIENT_FIELD_INPUT);
  });

  it('preserves shared structure and ramp input through compact JSON and thumbnails', () => {
    const materialField = normalizeMaterialFieldConfig({ seed: 937, scale: 8, cracks: 0.8, cycles: 2 });
    const gradient = { ...STORE_DEFAULTS.gradient, fieldInput: { source: 'thickness' as const, influence: 0.7 } };
    const preset = makePreset('Field', { ...STORE_DEFAULTS, materialField, gradient });
    const restored = expandPresetState(JSON.parse(JSON.stringify(compactPresetState(preset.state))));
    expect(restored.materialField).toEqual(materialField);
    expect(restored.gradient.fieldInput).toEqual(gradient.fieldInput);
    const thumbnail = createPresetThumbnailState(restored);
    expect(thumbnail.materialField).toEqual(materialField);
    expect(thumbnail.gradient.fieldInput).toEqual(gradient.fieldInput);
  });
});
