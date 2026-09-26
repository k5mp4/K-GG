import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { StoreSnapshot } from './presetModel';
import { makePreset } from './presetModel';

describe('Removed Radon / Iridescence / Matcap migration', () => {
  it('drops the removed state groups and their animation tracks when saving a preset', () => {
    const saved = makePreset('Old preset', {
      diffuse: STORE_DEFAULTS.diffuse,
      slitScan: STORE_DEFAULTS.slitScan,
      radon: { enabled: true, strength: 1, freq: 1, radius: 1.2, angle: 0, blur: 1, evolution: 0, speed: 0.2 },
      iridescence: { enabled: true, strength: 0.3, speed: 1, frequency: 3, angle: 45 },
      matcap: { enabled: true },
      keyframeTracks: {
        'radon.evolution': { propertyId: 'radon.evolution', label: 'Evolution', mode: 'auto', enabled: true, keyframes: [] },
        'iridescence.__time': { propertyId: 'iridescence.__time', label: 'Motion Phase', mode: 'auto', enabled: true, keyframes: [] },
        'stretch.__scan': { propertyId: 'stretch.__scan', label: 'Scan Position', mode: 'auto', enabled: true, keyframes: [] },
      },
    } as unknown as StoreSnapshot);

    expect(saved.state).not.toHaveProperty('radon');
    expect(saved.state).not.toHaveProperty('iridescence');
    expect(saved.state).not.toHaveProperty('matcap');
    expect(Object.keys(saved.state.keyframeTracks ?? {})).toEqual(['stretch.__scan']);
  });
});
