import { beforeEach, describe, expect, it } from 'vitest';
import { applicationCommands } from '../application/commands';
import { preparePresetToDocument } from './applyPreset';
import { redo, resetHistoryForTest, undo } from './history';
import { compactPresetState, expandPresetState, makePreset } from './presetModel';
import { createPresetThumbnailState } from './presetThumbnail';
import { normalizeEffectPipelineConfig } from './effectPipeline';
import { DEFAULT_ICE, normalizeIceConfig } from '../types/ice';
import { STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';

const enabledKinds = () => useGradientStore.getState().effectPipeline.effectStack.filter(layer => layer.enabled).map(layer => layer.kind);

describe('Ice persistence and stack layer', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    resetHistoryForTest();
  });

  it('appends a disabled Ice layer to stacks saved before Ice existed', () => {
    const legacyStack = STORE_DEFAULTS.effectPipeline.effectStack.filter(layer => layer.kind !== 'ice').reverse();
    const pipeline = normalizeEffectPipelineConfig({ ...STORE_DEFAULTS.effectPipeline, effectStack: legacyStack });
    expect(pipeline.effectStack.map(layer => layer.kind).slice(0, -1)).toEqual(legacyStack.map(layer => layer.kind));
    expect(pipeline.effectStack.at(-1)).toEqual({ kind: 'ice', enabled: false });
  });

  it('loads presets without Ice as disabled and round-trips saved optics', () => {
    const legacy = makePreset('Legacy', STORE_DEFAULTS);
    delete legacy.state.ice;
    expect(preparePresetToDocument(legacy).patch.ice).toEqual(DEFAULT_ICE);

    const ice = normalizeIceConfig({ enabled: true, ior: 1.4, absorption: 1.5, scatterColor: '#E0F0FF', lightCycles: 2 });
    const preset = makePreset('Ice', { ...STORE_DEFAULTS, ice });
    const restored = expandPresetState(JSON.parse(JSON.stringify(compactPresetState(preset.state))));
    expect(restored.ice).toEqual(ice);
    expect(createPresetThumbnailState(restored).ice).toEqual(ice);
  });

  it('keeps ice.enabled and the stack layer in step through commands and Undo', () => {
    applicationCommands.setIce({ enabled: true, mix: 0.6 });
    expect(enabledKinds()).toContain('ice');
    applicationCommands.setEffectPipeline({
      effectStack: useGradientStore.getState().effectPipeline.effectStack.map(layer => layer.kind === 'ice' ? { ...layer, enabled: false } : layer),
    });
    expect(useGradientStore.getState().ice.enabled).toBe(false);
    // History groups rapid edits, so Undo returns to the document before Ice.
    undo();
    expect(useGradientStore.getState().ice).toMatchObject({ enabled: false, mix: DEFAULT_ICE.mix });
    expect(enabledKinds()).not.toContain('ice');
    redo();
    expect(useGradientStore.getState().ice).toMatchObject({ enabled: false, mix: 0.6 });
    expect(enabledKinds()).not.toContain('ice');
  });

  it('does not enable Ice when the shared structure changes', () => {
    applicationCommands.setMaterialField({ cracks: 0.9 });
    expect(useGradientStore.getState().ice.enabled).toBe(false);
    expect(enabledKinds()).not.toContain('ice');
  });
});
