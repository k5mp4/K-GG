import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import type { SlitScanConfig } from '../types/distortion';
import { getSlitEdgeUniform, resolveSlitEdge, slitBarFactor, slitBarShift, slitBarSpeed, type SlitEdgeSettings } from './slitEdge';

const slit = (overrides: Partial<SlitScanConfig> = {}): SlitScanConfig => ({
  ...STORE_DEFAULTS.slitScan,
  ...overrides,
});

const edge = (overrides: Partial<SlitEdgeSettings> = {}): SlitEdgeSettings => ({
  side: 'end',
  shape: 'round',
  size: 40,
  length: 0.25,
  lengthVariance: 0,
  cells: 4,
  speedVariance: 0,
  seed: 0,
  ...overrides,
});

const SPAN = 2000;
const SW = 80;
// Band 0 spans slit coordinates [0, 80]; its centre line is 40.
const shiftAt = (tangent: number, slitCoord: number, settings: SlitEdgeSettings, variance = 0, animTime = 0, pingpong = false, index = 0) =>
  slitBarShift({
    slitCoord,
    index,
    left: 0,
    right: SW,
    tangent,
    span: SPAN,
    slitWidth: SW,
    slitVariance: variance,
    edge: settings,
    shiftFactor: (random) => random * 2 - 1,
    animTime,
    pingpong,
  });

/** Centre of every antialiased transition along a scan line, with the shift on each side. */
function transitions(slitCoord: number, settings: SlitEdgeSettings, variance = 0, from = -1000, to = 1000) {
  const found: Array<{ at: number; before: number; after: number }> = [];
  let previous = shiftAt(from, slitCoord, settings, variance);
  let start: number | null = null;
  let before = previous;
  for (let t = from + 0.25; t <= to; t += 0.25) {
    const current = shiftAt(t, slitCoord, settings, variance);
    const changing = Math.abs(current - previous) > 1e-9;
    if (changing && start === null) {
      start = t - 0.25;
      before = previous;
    }
    if (!changing && start !== null) {
      found.push({ at: (start + t - 0.25) / 2, before, after: previous });
      start = null;
    }
    previous = current;
  }
  return found;
}

describe('Slit bar edge settings', () => {
  it('leaves old presets without edge fields unchanged', () => {
    const legacy = slit({
      edgeSide: undefined,
      edgeShape: undefined,
      edgeSize: undefined,
      edgeLength: undefined,
      edgeLengthVariance: undefined,
    });
    expect(getSlitEdgeUniform(legacy)[0]).toBe(0);
    expect(getSlitEdgeUniform(legacy)[1]).toBe(0);
  });

  it('packs size, side, shape, length, variance and cell count for the shader uniforms', () => {
    expect(getSlitEdgeUniform(slit({ edgeSide: 'start', edgeShape: 'round', edgeSize: 30, edgeLength: 0.4, edgeLengthVariance: 0.2 })))
      .toEqual([30, 1, 0, 0.4, 0.2, 3, 0.5]);
    expect(getSlitEdgeUniform(slit({ edgeSide: 'end', edgeShape: 'bevel', edgeSize: 12 }))[1]).toBe(2);
    expect(getSlitEdgeUniform(slit({ edgeSide: 'both', edgeShape: 'bevel', edgeSize: 12 }))[1]).toBe(3);
    expect(getSlitEdgeUniform(slit({ edgeSide: 'random', edgeShape: 'bevel', edgeSize: 12 }))).toEqual([12, 4, 1, 0.25, 0.5, 4, 0.5]);
  });

  it('only applies to Linear mode and falls back for invalid values', () => {
    for (const mode of ['circular', 'polygon', 'wave'] as const) {
      expect(getSlitEdgeUniform(slit({ mode, edgeSide: 'both', edgeSize: 40 }))[0]).toBe(0);
    }
    expect(resolveSlitEdge(slit({ edgeSide: 'left' as never, edgeShape: 'square' as never, edgeSize: 9999 })))
      .toMatchObject({ side: 'none', shape: 'round', size: 0 });
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeSize: 9999 })).size).toBe(250);
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeSize: 0 })).side).toBe('none');
  });

  it('rounds the radius in Pixel Perfect mode', () => {
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeSize: 12.6, pixelPerfect: true })).size).toBe(13);
  });
});

describe('Slit bar colour changes', () => {
  it('uses the stored random value when not animating', () => {
    expect(slitBarFactor(0, 5, false)).toBe(-1);
    expect(slitBarFactor(0.75, 0, false)).toBe(0.5);
  });

  it('changes smoothly with no sudden jumps while animating', () => {
    // A sawtooth jumps by 2 once per cycle for each bar; the bar factor must move in small steps.
    for (const random of [0, 0.13, 0.5, 0.87, 0.999]) {
      let previous = slitBarFactor(random, 0, true);
      let largest = 0;
      for (let time = 0.001; time <= 3; time += 0.001) {
        const current = slitBarFactor(random, time, true);
        largest = Math.max(largest, Math.abs(current - previous));
        previous = current;
      }
      expect(largest).toBeLessThan(0.01);
    }
  });

  it('closes after a whole cycle so the loop has no seam', () => {
    for (const random of [0, 0.31, 0.77]) {
      expect(slitBarFactor(random, 2, true)).toBeCloseTo(slitBarFactor(random, 0, true), 9);
      expect(slitBarFactor(random, -1, true)).toBeCloseTo(slitBarFactor(random, 0, true), 9);
    }
  });
});

describe('Slit bar flow speed', () => {
  it('keeps every band at the base speed without variance', () => {
    for (let index = -8; index < 24; index++) {
      expect(slitBarSpeed(index, 0, 0, false)).toBe(1);
      expect(slitBarSpeed(index, 0, 0, true)).toBe(1);
    }
  });

  it('spreads the speeds between bands, as whole multiples for Loop', () => {
    const loop = Array.from({ length: 32 }, (_, index) => slitBarSpeed(index, 0, 1, false));
    expect(Math.min(...loop)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...loop)).toBeLessThanOrEqual(4);
    expect(loop.every(Number.isInteger)).toBe(true);
    expect(new Set(loop).size).toBeGreaterThanOrEqual(3);
    const pingpong = Array.from({ length: 32 }, (_, index) => slitBarSpeed(index, 0, 1, true));
    expect(new Set(pingpong).size).toBeGreaterThan(8);
  });

  it('moves each band at its own speed and still closes the loop after whole cycles', () => {
    const settings = edge({ side: 'both', lengthVariance: 0.5, speedVariance: 1 });
    const period = settings.cells * settings.length * SPAN;
    const seen = new Set<number>();
    for (let index = 0; index < 12; index++) {
      const speed = slitBarSpeed(index, settings.seed, 1, false);
      seen.add(speed);
      for (let t = -900; t <= 900; t += 61.7) {
        const rest = shiftAt(t, 40, settings, 0, 0, false, index);
        expect(shiftAt(t, 40, settings, 0, 1, false, index)).toBeCloseTo(rest, 9);
        expect(shiftAt(t, 40, settings, 0, 3, false, index)).toBeCloseTo(rest, 9);
        // A quarter cycle carries this band's pattern speed/4 periods along.
        expect(shiftAt(t + (period * speed) / 4, 40, settings, 0, 0.25, false, index)).toBeCloseTo(rest, 9);
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('swings PingPong bands by a speed-scaled amount and returns after each cycle', () => {
    const settings = edge({ side: 'both', speedVariance: 1 });
    const len = settings.length * SPAN;
    for (let index = 0; index < 8; index++) {
      const speed = slitBarSpeed(index, settings.seed, 1, true);
      for (let t = -900; t <= 900; t += 71.3) {
        const rest = shiftAt(t, 40, settings, 0, 0, true, index);
        expect(shiftAt(t, 40, settings, 0, 1, true, index)).toBeCloseTo(rest, 9);
        expect(shiftAt(t + len * speed, 40, settings, 0, 0.25, true, index)).toBeCloseTo(rest, 9);
      }
    }
  });
});

describe('Slit bars', () => {
  it('fills the whole band with several bars of different shifts', () => {
    const along = transitions(40, edge());
    // 2000px at 25% length: about four bars across the canvas, each with its own shift.
    expect(along.length).toBeGreaterThanOrEqual(3);
    const values = new Set([shiftAt(-900, 40, edge()), ...along.map((t) => t.after)]);
    expect(values.size).toBeGreaterThanOrEqual(4);
  });

  it('draws End caps as true semicircles over the next bar', () => {
    const settings = edge({ side: 'end', size: 40 }); // radius = half of the 80px band
    const axis = transitions(40, settings).find((t) => t.at > -500 && t.at < 500)!;
    expect(axis).toBeDefined();
    // Scanning towards +tangent the lower bar (z higher for smaller k) ends in its cap tip on the axis.
    // A line 1px from the side edge meets the circle much earlier (a = 1, r = 40).
    const side = transitions(1, settings).find((t) => Math.abs(t.at - axis.at) < 60)!;
    expect(side).toBeDefined();
    const circleOffset = Math.sqrt(40 * 40 - 39 * 39); // tangent offset of the circle at 1px from the side
    expect(axis.at - side.at).toBeCloseTo(40 - circleOffset, 0);
    // Halfway: a = 20 gives a tangent offset of sqrt(r^2 - (r - a)^2).
    const mid = transitions(20, settings).find((t) => Math.abs(t.at - axis.at) < 60)!;
    expect(axis.at - mid.at).toBeCloseTo(40 - Math.sqrt(40 * 40 - 20 * 20), 0);
  });

  it('keeps the circle true when Variance warps the band', () => {
    // With Variance the band edges are warped; the unwarped bounds must be used so the arc stays circular.
    const variance = 0.5;
    const warp = (x: number) => x + Math.sin((x / (SW * 4)) * 6.2832) * variance * SW;
    // Band 0 in real space: find the real coordinates whose warped value is 0 and SW.
    const unwarp = (target: number) => {
      let x = target;
      for (let i = 0; i < 50; i++) x -= (warp(x) - target) / (1 + Math.cos((x / (SW * 4)) * 6.2832) * variance * 1.5708);
      return x;
    };
    const xl = unwarp(0);
    const xr = unwarp(SW);
    const half = (xr - xl) / 2;
    const settings = edge({ side: 'end', size: 200 }); // clamps to the real half width
    const at = (offset: number) => transitions(xl + offset, settings, variance).map((t) => t.at);
    const axisCut = at(half).find((t) => t > -500)!;
    const cornerCut = at(1).find((t) => Math.abs(t - axisCut) < half * 1.2)!;
    expect(axisCut - cornerCut).toBeCloseTo(half - Math.sqrt(half * half - (half - 1) * (half - 1)), 0);
  });

  it('cuts a straight 45 degree chamfer for Bevel', () => {
    const settings = edge({ side: 'end', shape: 'bevel', size: 30 });
    const axis = transitions(40, settings).find((t) => t.at > -500 && t.at < 500)!;
    const side = transitions(5, settings).find((t) => Math.abs(t.at - axis.at) < 60)!;
    // The chamfer line is a + b = r: moving 35px in from the side edge (a = 5 -> 30) shifts the cut by 25px.
    expect(axis.at - side.at).toBeCloseTo(25, 0);
  });

  it('puts the cap at the opposite end for Start and varies per bar for Random', () => {
    const end = transitions(40, edge({ side: 'end' }));
    const start = transitions(40, edge({ side: 'start' }));
    expect(end.length).toBeGreaterThan(0);
    expect(start.length).toBeGreaterThan(0);
    // End: the cap tip is beyond the cut; Start: the tip is before it. So the axis cut differs from the side cut in opposite directions.
    const endSide = transitions(1, edge({ side: 'end' }));
    const startSide = transitions(1, edge({ side: 'start' }));
    const gap = (a: typeof end, b: typeof end) => a.slice(0, 3).map((t, i) => b[i].at - t.at);
    expect(Math.sign(gap(end, endSide)[0])).toBe(-Math.sign(gap(start, startSide)[0]));

    const random = transitions(40, edge({ side: 'random' }));
    expect(random.length).toBeGreaterThan(2);
  });

  it('derives how many bars the pattern repeats over from the length', () => {
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeLength: 0.25 })).cells).toBe(4);
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeLength: 0.3 })).cells).toBe(4);
    expect(resolveSlitEdge(slit({ edgeSide: 'end', edgeLength: 1 })).cells).toBe(1);
    expect(getSlitEdgeUniform(slit({ edgeSide: 'end', edgeLength: 0.05 }))[5]).toBe(20);
  });

  it('slides the bars along the band and loops seamlessly after whole cycles', () => {
    for (const side of ['end', 'start', 'both', 'random'] as const) {
      const settings = edge({ side, lengthVariance: 0.7 });
      const period = settings.cells * settings.length * SPAN;
      for (let t = -900; t <= 900; t += 37.3) {
        for (const coord of [3, 40, 77]) {
          const rest = shiftAt(t, coord, settings, 0.4);
          // A whole cycle moves the pattern by exactly one period: back to the starting picture.
          expect(shiftAt(t, coord, settings, 0.4, 1)).toBeCloseTo(rest, 9);
          expect(shiftAt(t, coord, settings, 0.4, -3)).toBeCloseTo(rest, 9);
          // A quarter cycle carries the pattern a quarter of the period along the band.
          expect(shiftAt(t + period / 4, coord, settings, 0.4, 0.25)).toBeCloseTo(rest, 9);
        }
      }
    }
  });

  it('swings the bars back and forth for PingPong and returns after each cycle', () => {
    const settings = edge({ side: 'both', lengthVariance: 0.5 });
    const len = settings.length * SPAN;
    for (let t = -900; t <= 900; t += 53.1) {
      const rest = shiftAt(t, 40, settings, 0, 0, true);
      expect(shiftAt(t, 40, settings, 0, 1, true)).toBeCloseTo(rest, 9);
      expect(shiftAt(t, 40, settings, 0, 0.5, true)).toBeCloseTo(rest, 9);
      // A quarter cycle displaces by one bar length, a three-quarter cycle by one in the other direction.
      expect(shiftAt(t + len, 40, settings, 0, 0.25, true)).toBeCloseTo(rest, 9);
      expect(shiftAt(t - len, 40, settings, 0, 0.75, true)).toBeCloseTo(rest, 9);
    }
  });

  it('varies the bar length per band by the variance', () => {
    const lengths = (variance: number) => {
      const cuts = transitions(40, edge({ lengthVariance: variance })).map((t) => t.at);
      return cuts.slice(1).map((c, i) => c - cuts[i]);
    };
    const fixed = lengths(0);
    expect(Math.max(...fixed) - Math.min(...fixed)).toBeLessThan(1);
    const varied = lengths(1);
    expect(Math.max(...varied) - Math.min(...varied)).toBeGreaterThan(20);
  });
});
