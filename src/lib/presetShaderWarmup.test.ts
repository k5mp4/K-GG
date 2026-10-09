import { describe, expect, it } from 'vitest';
import { collectPresetWarmupTargets } from './presetShaderWarmup';
import { builtinPresetLibrary } from './presetLibraryCache';
import { SHADER_WARMUP_PLAN } from './shaderWarmup';
import type { Preset } from './presetModel';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { createDocumentState } from '../store/documentSlice';

describe('collectPresetWarmupTargets', () => {
  it('collects the programs the built-in Presets need without duplicates', () => {
    const targets = collectPresetWarmupTargets(builtinPresetLibrary.presets);
    const ids = targets.map(target => `${target.key}:${target.noiseVariant ?? ''}`);

    expect(targets.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('puts cheap planned programs first and the Generator last', () => {
    const targets = collectPresetWarmupTargets(builtinPresetLibrary.presets);
    const keys = targets.map(target => target.key);
    const planned = keys.filter(key => SHADER_WARMUP_PLAN.includes(key) && key !== 'generator');

    expect(planned).toEqual([...planned].sort((a, b) => SHADER_WARMUP_PLAN.indexOf(a) - SHADER_WARMUP_PLAN.indexOf(b)));
    if (keys.includes('generator')) expect(keys[keys.length - 1]).toBe('generator');
  });

  it('skips a Preset that cannot be evaluated instead of failing', () => {
    const broken = { id: 'broken', name: 'Broken', createdAt: 0, state: null } as unknown as Preset;

    expect(() => collectPresetWarmupTargets([broken, ...builtinPresetLibrary.presets])).not.toThrow();
    expect(collectPresetWarmupTargets([broken])).toEqual([]);
  });
  it('includes the analytic Generator only when a performance set requests complete preparation', () => {
    const cue: Preset = { id: 'noise', name: 'Noise', createdAt: 0, state: {
      ...createDocumentState(STORE_DEFAULTS),
      noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion, type: 'simplex', enabled: true, amount: 0.1, noiseLoopMode: 'legacy' },
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline, version: 'stack-v2', effectStack: [{ kind: 'noise', enabled: true }], selectedKind: 'noise' },
    } };
    const normal = collectPresetWarmupTargets([cue]);
    const performance = collectPresetWarmupTargets([cue], { includeAnalyticNoise: true });
    expect(normal.some(target => target.key === 'generator' && target.noiseVariant === 0)).toBe(false);
    expect(performance.some(target => target.key === 'generator' && target.noiseVariant === 0)).toBe(true);
    expect(performance).toEqual(expect.arrayContaining(normal));
  });
  it('prepares enabled identity Glass and zero Blur for later animation or live changes', () => {
    const cue: Preset = { id: 'animated', name: 'Animated', createdAt: 0, state: {
      ...createDocumentState(STORE_DEFAULTS),
      normalMap: { ...STORE_DEFAULTS.normalMap, enabled: true, blur: 0 },
      postprocess: { ...STORE_DEFAULTS.postprocess, glassMix: 0, glassTileMix: 0 },
      effectPipeline: { ...STORE_DEFAULTS.effectPipeline, version: 'stack-v2',
        effectStack: [{ kind: 'glass', enabled: true }, { kind: 'glassTile', enabled: true }] },
    } };
    const normal = collectPresetWarmupTargets([cue]).map(target => target.key);
    expect(normal).not.toContain('blur');
    expect(normal).not.toContain('glassV2');
    expect(normal).not.toContain('glassTile');
    expect(collectPresetWarmupTargets([cue], { includeAnalyticNoise: true }).map(target => target.key))
      .toEqual(expect.arrayContaining(['blur', 'glassV2', 'glassTile']));
  });
});
