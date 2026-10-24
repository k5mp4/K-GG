import { beforeEach, describe, expect, it } from 'vitest';
import { applicationCommands } from '../application/commands';
import { preparePresetToDocument } from '../lib/applyPreset';
import { redo, resetHistoryForTest, undo } from '../lib/history';
import { makePreset } from '../lib/presetModel';
import { DEFAULT_MATERIAL_FIELD } from '../types/materialField';
import { DEFAULT_GRADIENT_FIELD_INPUT } from '../types/gradient';
import { STORE_DEFAULTS, useGradientStore } from './gradientStore';
import { selectDocumentState } from './selectors';

describe('shared material field document state', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    resetHistoryForTest();
  });

  it('merges normalized structure and nested ramp input without enabling effects', () => {
    const original = useGradientStore.getState();
    applicationCommands.setMaterialField({ seed: 8.7, scale: 99 });
    applicationCommands.setGradient({ fieldInput: { source: 'thickness' } });
    applicationCommands.setGradient({ fieldInput: { influence: 0.4 } });
    const state = useGradientStore.getState();
    expect(state.materialField).toMatchObject({ seed: 9, scale: 32, morph: DEFAULT_MATERIAL_FIELD.morph });
    expect(state.gradient.fieldInput).toEqual({ source: 'thickness', influence: 0.4 });
    expect(state.gradient.stops).toBe(original.gradient.stops);
    expect(state.effectPipeline).toBe(original.effectPipeline);
    expect(selectDocumentState(state).materialField).toBe(state.materialField);
    expect(STORE_DEFAULTS.materialField).toEqual(DEFAULT_MATERIAL_FIELD);
  });

  it('undoes and redoes shared structure and color input together', () => {
    applicationCommands.setMaterialField({ seed: 42 });
    applicationCommands.setGradient({ fieldInput: { source: 'cracks' } });
    undo();
    expect(useGradientStore.getState().materialField).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(useGradientStore.getState().gradient.fieldInput).toEqual(DEFAULT_GRADIENT_FIELD_INPUT);
    redo();
    expect(useGradientStore.getState().materialField.seed).toBe(42);
    expect(useGradientStore.getState().gradient.fieldInput?.source).toBe('cracks');
  });

  it('resets missing legacy settings on preset load instead of inheriting the open document', () => {
    applicationCommands.setMaterialField({ seed: 123 });
    applicationCommands.setGradient({ fieldInput: { source: 'cracks' } });
    const legacy = makePreset('Legacy', STORE_DEFAULTS);
    delete legacy.state.materialField;
    delete legacy.state.gradient.fieldInput;
    const prepared = preparePresetToDocument(legacy);
    expect(prepared.patch.materialField).toEqual(DEFAULT_MATERIAL_FIELD);
    expect(prepared.patch.gradient?.fieldInput).toEqual(DEFAULT_GRADIENT_FIELD_INPUT);
  });

  it('retains selected input while image protection or mesh direct color is active', () => {
    applicationCommands.setGradient({ fieldInput: { source: 'cracks', influence: 0.6 } });
    applicationCommands.setImageGradient({ enabled: true });
    applicationCommands.setGradient({ gradientType: 'mesh' });
    applicationCommands.setMeshColorMode('direct');
    expect(useGradientStore.getState().gradient.fieldInput).toEqual({ source: 'cracks', influence: 0.6 });
  });
});
