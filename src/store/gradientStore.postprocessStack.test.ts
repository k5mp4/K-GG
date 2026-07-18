import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from './gradientStore';

describe('Postprocess stack preset compatibility', () => {
  it('converts a legacy single-mode preset into one enabled stack layer', () => {
    const loaded = normalizePostprocessConfig({
      enabled: true,
      effectMode: 'glass',
      glassMotion: 0.5,
    });

    expect(loaded.effectMode).toBe('glass');
    expect(loaded.effectStack.filter(layer => layer.enabled)).toEqual([
      { kind: 'glass', enabled: true },
    ]);
  });

  it('preserves stack order and selected mode through JSON round trip', () => {
    const saved = JSON.parse(JSON.stringify({
      ...STORE_DEFAULTS.postprocess,
      enabled: true,
      effectMode: 'mirror',
      effectStack: [
        { kind: 'glass', enabled: true },
        { kind: 'mirror', enabled: true },
        { kind: 'distort', enabled: false },
        { kind: 'kaleidoscope', enabled: false },
        { kind: 'prism', enabled: false },
        { kind: 'voronoi', enabled: false },
      ],
    }));

    const loaded = normalizePostprocessConfig(saved);
    expect(loaded.effectMode).toBe('mirror');
    expect(loaded.effectStack.map(layer => layer.kind)).toEqual([
      'glass',
      'mirror',
      'distort',
      'kaleidoscope',
      'prism',
      'voronoi',
      'glassV2',
    ]);
    expect(loaded.effectStack.filter(layer => layer.enabled).map(layer => layer.kind)).toEqual([
      'glass',
      'mirror',
    ]);
  });

  it('normalizes corrupted stack data', () => {
    const loaded = normalizePostprocessConfig({
      effectMode: 'prism',
      effectStack: [
        { kind: 'mirror', enabled: true },
        { kind: 'unknown', enabled: true },
        { kind: 'mirror', enabled: false },
      ] as never,
    });

    expect(loaded.effectStack).toEqual([
      { kind: 'mirror', enabled: true },
      { kind: 'distort', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'glass', enabled: false },
      { kind: 'glassV2', enabled: false },
    ]);
  });

  it('bounds legacy distort maps and rejects malformed numeric arrays', () => {
    const loaded = normalizePostprocessConfig({
      mapResolution: 2048,
      displacement: [Number.NaN, 1],
      smoothMask: [Number.POSITIVE_INFINITY],
    } as never);

    expect(loaded.mapResolution).toBe(512);
    expect(loaded.displacement).toHaveLength(512 * 512 * 2);
    expect(loaded.smoothMask).toHaveLength(512 * 512);
    expect(loaded.displacement.every(Number.isFinite)).toBe(true);
    expect(loaded.smoothMask.every(Number.isFinite)).toBe(true);
  });
});
