import { strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from '../store/gradientStore';
import { createLegacyEffectPipeline } from './effectPipeline';
import { createEmptyPresetLibrary, encodePresetExport } from './presetLibrary';
import { compactPresetState, expandPresetState, makePreset, type Preset, type StoreSnapshot } from './presetModel';

function createSnapshot(): StoreSnapshot {
  return {
    gradient: { ...STORE_DEFAULTS.gradient },
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse },
    imageGradient: { ...STORE_DEFAULTS.imageGradient },
    slitScan: { ...STORE_DEFAULTS.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch },
    animation: { ...STORE_DEFAULTS.animation },
    normalMap: { ...STORE_DEFAULTS.normalMap },
    manualDistort: {
      ...STORE_DEFAULTS.manualDistort,
      displacement: [...STORE_DEFAULTS.manualDistort.displacement],
      smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask],
    },
    postprocess: {
      ...STORE_DEFAULTS.postprocess,
      displacement: [...STORE_DEFAULTS.postprocess.displacement],
      smoothMask: [...STORE_DEFAULTS.postprocess.smoothMask],
    },
    effectPipeline: { ...STORE_DEFAULTS.effectPipeline },
  };
}

describe('compact preset state', () => {
  it('omits the legacy Distort fallback, empty maps and Legacy v1-only Postprocess fields of a Stack v2 preset', () => {
    const { state } = makePreset('Compact', createSnapshot());

    expect(state.effectPipeline?.version).toBe('stack-v2');
    expect(state).not.toHaveProperty('manualDistort');
    expect(state.postprocess).not.toHaveProperty('displacement');
    expect(state.postprocess).not.toHaveProperty('smoothMask');
    expect(state.postprocess).not.toHaveProperty('effectStack');
    expect(Object.keys(state.postprocess ?? {}).filter(key => key.startsWith('diffuse'))).toEqual([]);
    expect(state.postprocess).toMatchObject({
      mapResolution: STORE_DEFAULTS.postprocess.mapResolution,
      kaleidoscopeSlices: STORE_DEFAULTS.postprocess.kaleidoscopeSlices,
      glassScale: STORE_DEFAULTS.postprocess.glassScale,
    });
  });

  it('loads the compacted Postprocess state identically for Stack v2 rendering', () => {
    const source = createSnapshot();
    source.postprocess!.kaleidoscopeSlices = 9;
    const { state } = makePreset('Round trip', source);
    const original = normalizePostprocessConfig(source.postprocess);
    const loaded = normalizePostprocessConfig(state.postprocess);
    const withoutLegacyV1 = (config: typeof original) => Object.fromEntries(Object.entries(config)
      .filter(([key]) => key !== 'effectStack' && !key.startsWith('diffuse')));

    expect(withoutLegacyV1(loaded)).toEqual(withoutLegacyV1(original));
    expect(loaded.displacement).toEqual(original.displacement);
    expect(loaded.smoothMask).toEqual(original.smoothMask);
  });

  it('keeps painted Distort maps', () => {
    const source = createSnapshot();
    source.postprocess!.displacement![10] = 0.25;
    source.postprocess!.smoothMask![3] = 0.5;
    const { state } = makePreset('Painted', source);

    expect(state.postprocess?.displacement).toEqual(source.postprocess?.displacement);
    expect(state.postprocess?.smoothMask).toEqual(source.postprocess?.smoothMask);
  });

  it('keeps Legacy v1 Postprocess fields when the preset still renders with Legacy v1', () => {
    const state = compactPresetState({ ...createSnapshot(), effectPipeline: createLegacyEffectPipeline() });

    expect(state.postprocess?.effectStack).toEqual(STORE_DEFAULTS.postprocess.effectStack);
    expect(state.postprocess?.diffuseMode).toBe(STORE_DEFAULTS.postprocess.diffuseMode);
    expect(state.postprocess).not.toHaveProperty('displacement');
  });

  it('keeps manualDistort when an old preset has no Postprocess to fall back to', () => {
    const source = createSnapshot();
    delete source.postprocess;
    source.manualDistort!.brushSize = 42;
    const state = compactPresetState(source);

    expect(state.manualDistort).toMatchObject({ brushSize: 42 });
    expect(state.manualDistort).not.toHaveProperty('displacement');
  });

  it('keeps only the user color palettes applied to the ramp', () => {
    const source = createSnapshot();
    const applied = { id: 'applied', name: 'Applied', createdAt: 1, stops: source.gradient.stops.map(stop => ({ ...stop, color: stop.color.toUpperCase() })) };
    const unused = { id: 'unused', name: 'Unused', createdAt: 2, stops: [{ position: 0, color: '#000000' }, { position: 1, color: '#ffffff' }] };
    source.colorPalettes = [unused, applied];

    expect(compactPresetState(source).colorPalettes).toEqual([applied]);
    expect(compactPresetState({ ...source, colorPalettes: [unused] })).not.toHaveProperty('colorPalettes');
  });

  it('matches a palette applied in Mirror mode, where the ramp holds halved positions', () => {
    const source = createSnapshot();
    const palette = { id: 'mirror', name: 'Mirror', createdAt: 1, stops: [{ position: 0, color: '#112233' }, { position: 1, color: '#445566' }] };
    source.gradient = { ...source.gradient, rampMirror: true, stops: palette.stops.map(stop => ({ ...stop, position: stop.position * 0.5 })) };
    source.colorPalettes = [palette];

    expect(compactPresetState(source).colorPalettes).toEqual([palette]);
  });

  it('restores omitted fields for consumers that merge presets without normalizing', () => {
    const source = createSnapshot();
    source.postprocess!.brushSize = 77;
    const expanded = expandPresetState(makePreset('Expand', source).state);

    expect(expanded.postprocess?.displacement).toEqual(STORE_DEFAULTS.postprocess.displacement);
    expect(expanded.postprocess?.smoothMask).toEqual(STORE_DEFAULTS.postprocess.smoothMask);
    expect(expanded.manualDistort).toMatchObject({
      enabled: false,
      brushSize: 77,
      displacement: STORE_DEFAULTS.postprocess.displacement,
    });
  });

  it('compacts presets saved in the older full format when exporting', () => {
    const saved = makePreset('Old', createSnapshot());
    const legacy: Preset = { ...saved, state: createSnapshot() };
    const library = { ...createEmptyPresetLibrary(), presets: [legacy] };
    const exported = encodePresetExport(library, { kind: 'preset', presetId: legacy.id });
    const [preset] = JSON.parse(strFromU8(exported.bytes)) as Preset[];

    expect(preset.state).not.toHaveProperty('manualDistort');
    expect(preset.state.postprocess).not.toHaveProperty('displacement');
    expect(exported.bytes.byteLength).toBeLessThan(20_000);
  });
});
