import { describe, expect, it } from 'vitest';
import { collectPresetWarmupTargets } from './presetShaderWarmup';
import { builtinPresetLibrary } from './presetLibraryCache';
import { SHADER_WARMUP_PLAN } from './shaderWarmup';
import type { Preset } from './presetModel';

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
});
