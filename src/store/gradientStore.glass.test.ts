import { describe, expect, it } from 'vitest';
import { getPostprocessStackSamplePadding } from '../lib/glass';
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
    expect(loaded.glassV2ChromaticHue).toBe(0);
    expect(loaded.glassV2ChromaticSaturation).toBe(1);
    expect(loaded.glassV2TransmissionTint).toBe('#FFFFFF');
    expect(loaded.glassV2HighlightTint).toBe('#FFFFFF');
    expect(loaded.effectMode).toBe('mirror');
    expect(loaded.effectStack.find(layer => layer.kind === 'glassV2')).toEqual({
      kind: 'glassV2',
      enabled: false,
    });
  });

  it('normalizes an old Glass stack to one Glass V2 layer without changing padding', () => {
    const loaded = normalizePostprocessConfig({
      enabled: true,
      effectMode: 'glass',
      effectStack: [
        { kind: 'glass', enabled: true },
        { kind: 'distort', enabled: false },
        { kind: 'mirror', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'prism', enabled: false },
        { kind: 'voronoi', enabled: false },
      ],
    });

    expect(loaded.effectMode).toBe('glassV2');
    expect(loaded.effectStack.filter(layer => layer.kind === 'glass' || layer.kind === 'glassV2')).toEqual([
      { kind: 'glassV2', enabled: true },
    ]);
    expect(getPostprocessStackSamplePadding(loaded)).toBe(40);
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

    expect(loaded.effectMode).toBe('glassV2');
    expect(loaded.glassSeed).toBe(37);
    expect(loaded.glassNoiseInfluence).toBe(0.72);
    expect(loaded.glassRefraction).toBe(64);
    expect(loaded.glassEvolution).toBe(0.625);
  });

  it('preserves Glass V2 mode, layer order, and shared optics through a JSON round trip', () => {
    const saved = JSON.parse(JSON.stringify({
      ...STORE_DEFAULTS.postprocess,
      enabled: true,
      effectMode: 'glassV2',
      effectStack: [
        { kind: 'glassV2', enabled: true },
        { kind: 'glass', enabled: false },
        ...STORE_DEFAULTS.postprocess.effectStack.filter(layer => (
          layer.kind !== 'glass' && layer.kind !== 'glassV2'
        )),
      ],
      glassRefraction: 48,
      glassChromaticAberration: 9,
      glassRoughness: 3,
      glassV2ChromaticHue: -42,
      glassV2ChromaticSaturation: 1.35,
      glassV2TransmissionTint: '#A0D8FF',
      glassV2HighlightTint: '#FFD6A0',
    }));

    const loaded = normalizePostprocessConfig(saved);
    expect(loaded.effectMode).toBe('glassV2');
    expect(loaded.effectStack.slice(0, 2)).toEqual([
      { kind: 'glassV2', enabled: true },
      { kind: 'distort', enabled: true },
    ]);
    expect(loaded.glassRefraction).toBe(48);
    expect(loaded.glassChromaticAberration).toBe(9);
    expect(loaded.glassRoughness).toBe(3);
    expect(loaded.glassV2ChromaticHue).toBe(-42);
    expect(loaded.glassV2ChromaticSaturation).toBe(1.35);
    expect(loaded.glassV2TransmissionTint).toBe('#A0D8FF');
    expect(loaded.glassV2HighlightTint).toBe('#FFD6A0');
  });

  it('normalizes malformed Glass V2 color values without affecting shared optics', () => {
    const loaded = normalizePostprocessConfig({
      glassRefraction: 48,
      glassV2ChromaticHue: Number.POSITIVE_INFINITY,
      glassV2ChromaticSaturation: 99,
      glassV2TransmissionTint: '#12',
      glassV2HighlightTint: 'transparent',
    });

    expect(loaded.glassRefraction).toBe(48);
    expect(loaded.glassV2ChromaticHue).toBe(0);
    expect(loaded.glassV2ChromaticSaturation).toBe(2);
    expect(loaded.glassV2TransmissionTint).toBe('#FFFFFF');
    expect(loaded.glassV2HighlightTint).toBe('#FFFFFF');
  });
});
