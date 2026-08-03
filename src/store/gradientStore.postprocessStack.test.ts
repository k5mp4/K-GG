import { describe, expect, it } from 'vitest';
import { normalizePostprocessConfig, STORE_DEFAULTS } from './gradientStore';

describe('Postprocess stack preset compatibility', () => {
  it('migrates legacy manual Distort values into the canonical Postprocess config', () => {
    const loaded = normalizePostprocessConfig(undefined, {
      enabled: true,
      mode: 'swirl',
      brushSize: 88,
      strength: 1.4,
      falloff: 2.1,
      showOverlay: true,
      mapResolution: STORE_DEFAULTS.manualDistort.mapResolution,
      displacement: [...STORE_DEFAULTS.manualDistort.displacement],
      smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask],
      smoothStrength: 0.8,
      smoothRadius: 12,
      maxDisplacement: 0.75,
    });

    expect(loaded).toMatchObject({
      enabled: true,
      effectMode: 'distort',
      mode: 'swirl',
      brushSize: 88,
      strength: 1.4,
      falloff: 2.1,
      smoothStrength: 0.8,
      smoothRadius: 12,
      maxDisplacement: 0.75,
    });
    expect(loaded.effectStack.find(layer => layer.kind === 'distort')?.enabled).toBe(true);
  });

  it('converts a legacy single-mode Glass preset to Glass V2', () => {
    const loaded = normalizePostprocessConfig({
      enabled: true,
      effectMode: 'glass',
      glassMotion: 0.5,
    });

    expect(loaded.effectMode).toBe('glassV2');
    expect(loaded.effectStack.filter(layer => layer.enabled)).toEqual([
      { kind: 'glassV2', enabled: true },
    ]);
  });

  it('preserves stack order while collapsing legacy Glass aliases', () => {
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
        { kind: 'glassV2', enabled: false },
      ],
    }));

    const loaded = normalizePostprocessConfig(saved);
    expect(loaded.effectMode).toBe('mirror');
    expect(loaded.effectStack.map(layer => layer.kind)).toEqual([
      'glassV2',
      'mirror',
      'distort',
      'kaleidoscope',
      'prism',
      'voronoi',
    ]);
    expect(loaded.effectStack.filter(layer => layer.enabled).map(layer => layer.kind)).toEqual([
      'glassV2',
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
