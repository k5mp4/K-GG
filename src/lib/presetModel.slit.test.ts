import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { StoreSnapshot } from './presetModel';
import { makePreset } from './presetModel';

describe('Slit phase-motion migration', () => {
  it('omits legacy phase-motion fields and tracks when saving a preset', () => {
    const legacySlit = {
      ...STORE_DEFAULTS.slitScan,
      phaseAnimEnabled: true,
      phaseSpeed: 3,
    };
    const saved = makePreset('Offset-only Slit', {
      diffuse: STORE_DEFAULTS.diffuse,
      slitScan: legacySlit,
      keyframeTracks: {
        'slitScan.slitPhase': {
          propertyId: 'slitScan.slitPhase',
          label: 'Phase Motion',
          mode: 'keys',
          enabled: true,
          keyframes: [
            { id: 'start', time: 0, value: 0, interpolation: 'linear' },
            { id: 'end', time: 1, value: 80, interpolation: 'linear' },
          ],
        },
      },
    } as unknown as StoreSnapshot);

    expect(saved.state.slitScan).not.toHaveProperty('phaseSpeed');
    expect(saved.state.slitScan).not.toHaveProperty('phaseAnimEnabled');
    expect(saved.state.slitScan.slitPhase).toBe(STORE_DEFAULTS.slitScan.slitPhase);
    expect(saved.state.keyframeTracks).not.toHaveProperty('slitScan.slitPhase');
  });
});
