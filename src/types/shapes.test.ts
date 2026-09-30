import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHAPES,
  evaluateShapesReveal,
  normalizeShapesConfig,
  resolveShapesFillPhase,
  SHAPES_WIPE_SOFTNESS,
  type ShapesConfig,
} from './shapes';

function shapes(patch: Partial<ShapesConfig> = {}): ShapesConfig {
  return normalizeShapesConfig({ ...DEFAULT_SHAPES, enabled: true, ...patch });
}

describe('normalizeShapesConfig', () => {
  it('uses disabled defaults for missing or invalid values', () => {
    expect(normalizeShapesConfig(undefined)).toEqual(DEFAULT_SHAPES);
    expect(DEFAULT_SHAPES).toMatchObject({ enabled: false, source: 'star', fillSource: 'flow', reveal: 'fadeGlow', transparentBackground: false });
    expect(normalizeShapesConfig({ source: 'hexagon', fillSource: 'lava', reveal: 'spin', transparentBackground: 'yes' })).toMatchObject({
      source: 'star',
      fillSource: 'flow',
      reveal: 'fadeGlow',
      transparentBackground: false,
    });
  });

  it('clamps numeric values to the shared parameter limits', () => {
    const config = normalizeShapesConfig({ scale: 99, grain: -1, fillCycles: 3.6, revealCycles: 0, rotation: 450 });
    expect(config.scale).toBe(1.5);
    expect(config.grain).toBe(0);
    expect(config.fillCycles).toBe(4);
    expect(config.revealCycles).toBe(1);
    expect(config.rotation).toBeGreaterThanOrEqual(0);
    expect(config.rotation).toBeLessThan(360);
  });
});

describe('evaluateShapesReveal', () => {
  it('shows the whole shape when Animation is off or the loop is disabled', () => {
    expect(evaluateShapesReveal(shapes(), 0.7, false)).toMatchObject({ opacity: 1, glowScale: 1 });
    expect(evaluateShapesReveal(shapes({ reveal: 'none' }), 0.7, true)).toMatchObject({ opacity: 1, glowScale: 1 });
  });

  it('starts each cycle visible, then disappears, stays hidden and reappears', () => {
    // transition 0.2, hidden 0.2 → hold [0, 0.4), out [0.4, 0.6), hidden [0.6, 0.8), in [0.8, 1).
    const config = shapes({ reveal: 'fadeGlow', revealTransition: 0.2, revealHidden: 0.2 });
    expect(evaluateShapesReveal(config, 0, true).opacity).toBe(1);
    expect(evaluateShapesReveal(config, 0.39, true).opacity).toBe(1);
    expect(evaluateShapesReveal(config, 0.5, true).opacity).toBeCloseTo(0.5, 5);
    expect(evaluateShapesReveal(config, 0.7, true).opacity).toBe(0);
    expect(evaluateShapesReveal(config, 0.9, true).opacity).toBeCloseTo(0.5, 5);
  });

  it('widens the aura together with the opacity in Fade + Glow', () => {
    const config = shapes({ reveal: 'fadeGlow' });
    const dim = evaluateShapesReveal(config, 0.55, true);
    const bright = evaluateShapesReveal(config, 0.45, true);
    expect(dim.opacity).toBeLessThan(bright.opacity);
    expect(dim.glowScale).toBeLessThan(bright.glowScale);
  });

  it('closes the loop: time 1 equals time 0 for every mode', () => {
    for (const reveal of ['fadeGlow', 'wipe', 'flicker'] as const) {
      for (const revealCycles of [1, 3]) {
        const config = shapes({ reveal, revealCycles, revealOffset: 0.3 });
        expect(evaluateShapesReveal(config, 1, true)).toEqual(evaluateShapesReveal(config, 0, true));
      }
    }
  });

  it('repeats the cycle Cycles times per loop', () => {
    const config = shapes({ revealCycles: 2 });
    expect(evaluateShapesReveal(config, 0.25, true)).toEqual(evaluateShapesReveal(config, 0.75, true));
  });

  it('wipes in from the start side and wipes out from the same side', () => {
    const config = shapes({ reveal: 'wipe', revealTransition: 0.2, revealHidden: 0.2 });
    const appearing = evaluateShapesReveal(config, 0.9, true);
    expect(appearing.opacity).toBe(1);
    expect(appearing.wipeStart).toBeLessThan(-1);
    expect(appearing.wipeEnd).toBeCloseTo(0.5, 5);
    const disappearing = evaluateShapesReveal(config, 0.5, true);
    expect(disappearing.wipeStart).toBeCloseTo(0.5, 5);
    expect(disappearing.wipeEnd).toBeGreaterThan(2);
    const hidden = evaluateShapesReveal(config, 0.7, true);
    expect(hidden.wipeStart).toBe(hidden.wipeEnd);
    // The edge starts and ends outside the shape, soft edge included.
    expect(evaluateShapesReveal(config, 0.8, true).wipeEnd).toBeCloseTo(-SHAPES_WIPE_SOFTNESS, 5);
  });

  it('flickers deterministically and settles at full brightness', () => {
    const config = shapes({ reveal: 'flicker', revealTransition: 0.2, revealHidden: 0.2 });
    const samples = Array.from({ length: 40 }, (_, index) => evaluateShapesReveal(config, 0.8 + index * 0.005, true).opacity);
    expect(samples).toEqual(Array.from({ length: 40 }, (_, index) => evaluateShapesReveal(config, 0.8 + index * 0.005, true).opacity));
    expect(new Set(samples.map(value => value > 0.5)).size).toBe(2);
    expect(evaluateShapesReveal(config, 0.999, true).opacity).toBe(1);
  });

  it('fits both transitions and the hidden part into one cycle', () => {
    const config = shapes({ reveal: 'fadeGlow', revealTransition: 0.5, revealHidden: 0.6 });
    // transition is capped to (1 - 0.6) / 2 = 0.2 and there is no visible hold.
    expect(evaluateShapesReveal(config, 0.1, true).opacity).toBeCloseTo(0.5, 5);
    expect(evaluateShapesReveal(config, 0.5, true).opacity).toBe(0);
  });
});

describe('resolveShapesFillPhase', () => {
  it('moves whole cycles per loop so the fill loops seamlessly', () => {
    const config = shapes({ fillCycles: 3 });
    expect(resolveShapesFillPhase(config, 0, true)).toBe(0);
    expect(resolveShapesFillPhase(config, 1, true)).toBe(0);
    expect(resolveShapesFillPhase(config, 0.5, true)).toBeCloseTo(0.5, 10);
    expect(resolveShapesFillPhase(shapes({ fillCycles: -1 }), 0.25, true)).toBeCloseTo(0.75, 10);
    expect(resolveShapesFillPhase(config, 0.5, false)).toBe(0);
  });
});
