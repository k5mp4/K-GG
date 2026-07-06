import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from './gradientStore';

describe('Glass postprocess preset compatibility', () => {
  it('fills Glass defaults when loading a legacy postprocess preset', () => {
    const loaded = normalizePostprocessConfig({
      enabled: true,
      effectMode: 'mirror',
      mirrorMode: 'quad',
    });

    expect(loaded.glassScale).toBe(STORE_DEFAULTS.postprocess.glassScale);
    expect(loaded.glassChromaticAberration).toBe(
      STORE_DEFAULTS.postprocess.glassChromaticAberration,
    );
    expect(loaded.glassNoiseInfluence).toBe(
      STORE_DEFAULTS.postprocess.glassNoiseInfluence,
    );
    expect(loaded.effectMode).toBe('mirror');
  });

  it('preserves Glass values through a JSON preset round trip', () => {
    const saved = JSON.parse(JSON.stringify({
      ...STORE_DEFAULTS.postprocess,
      enabled: true,
      effectMode: 'glass',
      glassSeed: 37,
      glassNoiseInfluence: 0.72,
      glassRefraction: 64,
      glassEvolution: 0.625,
    }));
    const loaded = normalizePostprocessConfig(saved);

    expect(loaded.effectMode).toBe('glass');
    expect(loaded.glassSeed).toBe(37);
    expect(loaded.glassNoiseInfluence).toBe(0.72);
    expect(loaded.glassRefraction).toBe(64);
    expect(loaded.glassEvolution).toBe(0.625);
  });
});
