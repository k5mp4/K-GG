import { describe, expect, it } from 'vitest';
import { DEFAULT_ICE, isIceOpticallyIdentity, normalizeIceConfig } from './ice';

describe('Ice config normalization', () => {
  it('uses the shared defaults for missing or malformed values', () => {
    expect(normalizeIceConfig(undefined)).toEqual(DEFAULT_ICE);
    expect(normalizeIceConfig({ mix: Number.NaN, ior: Infinity, absorptionColor: 'blue', enabled: 'yes' })).toEqual(DEFAULT_ICE);
    expect(DEFAULT_ICE).toMatchObject({ enabled: false, ior: 1.31, mix: 1 });
  });

  it('bounds optics, rounds light cycles, and upper-cases colours', () => {
    expect(normalizeIceConfig({ ior: 3, absorption: -1, scattering: 9, lightCycles: 2.6, refraction: 2, scatterColor: '#abcdef' }))
      .toMatchObject({ ior: 1.6, absorption: 0, scattering: 4, lightCycles: 3, refraction: 1, scatterColor: '#ABCDEF' });
  });

  it('treats mix 0 as an identity pass', () => {
    expect(isIceOpticallyIdentity({ mix: 0 })).toBe(true);
    expect(isIceOpticallyIdentity(undefined)).toBe(true);
    expect(isIceOpticallyIdentity({ mix: 0.01 })).toBe(false);
  });
});
