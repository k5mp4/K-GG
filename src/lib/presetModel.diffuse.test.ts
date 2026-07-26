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
});
