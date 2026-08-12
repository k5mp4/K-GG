import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { StoreSnapshot } from './presetModel';
import { isPreset, makePreset } from './presetModel';

describe('legacy Diffuse preset migration', () => {
  it('saves a legacy luminance curve as Bezier only and reloads the JSON', () => {
    const legacyDiffuse = {
      ...STORE_DEFAULTS.diffuse,
      luminanceCurve: [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }],
    };
    delete (legacyDiffuse as Partial<typeof legacyDiffuse>).luminanceBezier;
    const legacyState = { diffuse: legacyDiffuse } as unknown as StoreSnapshot;

    const saved = makePreset('Legacy Diffuse', legacyState);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    expect(reloaded.state.diffuse.luminanceCurve).toBeUndefined();
    expect(reloaded.state.diffuse.luminanceBezier).toHaveLength(4);
    reloaded.state.diffuse.luminanceBezier.forEach((value, index) => {
      expect(value).toBeCloseTo([1 / 3, 1 / 3, 2 / 3, 2 / 3][index], 10);
    });
  });

  it('round-trips Stipple with its legacy internal mode value', () => {
    const state = {
      diffuse: {
        ...STORE_DEFAULTS.diffuse,
        mode: 'legacy' as const,
        scatter: 47,
        grain: 0.23,
        seed: 0,
        seedAnimEnabled: true,
      },
    } as unknown as StoreSnapshot;

    const saved = makePreset('Stipple', state);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    expect(reloaded.state.diffuse).toMatchObject({
      mode: 'legacy',
      scatter: 47,
      grain: 0.23,
      seed: 0,
      seedAnimEnabled: true,
    });
  });

  it('adds the disabled Seamless defaults to legacy presets', () => {
    const saved = makePreset('Legacy', { diffuse: STORE_DEFAULTS.diffuse } as unknown as StoreSnapshot);

    expect(saved.state.seamless).toEqual(STORE_DEFAULTS.seamless);
  });
});
