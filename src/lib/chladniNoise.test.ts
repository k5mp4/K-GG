import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/documentModel';
import {
  evaluateChladniDisplacement,
  evaluateChladniField,
  getChladniModeLimit,
  getChladniMorphState,
  getChladniPatternModes,
  getChladniUniformValues,
  listChladniModeCandidates,
  type ChladniPlateMode,
  type ChladniReferenceInput,
} from './chladniNoise';

const DEFAULTS = STORE_DEFAULTS.noiseDistortion;
const LOOP_PERIOD = 5;

function referenceInput(overrides: Partial<typeof DEFAULTS> = {}, resolution: [number, number] = [1920, 1080]): ChladniReferenceInput {
  return {
    uniforms: getChladniUniformValues({ ...DEFAULTS, ...overrides }),
    scale: overrides.scale ?? 1,
    loopPeriod: LOOP_PERIOD,
    resolution,
  };
}

function sampleGrid(size: number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) points.push([x / (size - 1), y / (size - 1)]);
  }
  return points;
}

const unordered = ([m, n]: ChladniPlateMode) => `${Math.min(m, n)},${Math.max(m, n)}`;

describe('Chladni pattern generation', () => {
  it('never produces m == n or a zero mode and treats (m, n) / (n, m) as one candidate', () => {
    for (let complexity = 1; complexity <= 8; complexity++) {
      const candidates = listChladniModeCandidates(getChladniModeLimit(complexity));
      expect(candidates.length).toBeGreaterThanOrEqual(4);
      expect(candidates.every(([m, n]) => m >= 1 && m < n)).toBe(true);
      expect(new Set(candidates.map(unordered)).size).toBe(candidates.length);
    }
  });

  it('is deterministic for the same Seed and Complexity', () => {
    for (const seed of [0, 1, 17.3, 42, 99.9]) {
      for (const complexity of [1, 4, 8]) {
        expect(getChladniPatternModes(seed, complexity)).toEqual(getChladniPatternModes(seed, complexity));
      }
    }
  });

  it('keeps Pattern A-D distinct, including the swapped (n, m) orientation', () => {
    for (let seed = 0; seed <= 100; seed += 0.7) {
      for (let complexity = 1; complexity <= 8; complexity++) {
        const modes = getChladniPatternModes(seed, complexity);
        expect(modes).toHaveLength(4);
        expect(modes.every(([m, n]) => m !== n)).toBe(true);
        expect(new Set(modes.map(unordered)).size).toBe(4);
      }
    }
  });

  it('changes the patterns when the Seed changes', () => {
    const signatures = new Set<string>();
    for (let seed = 0; seed < 20; seed++) signatures.add(JSON.stringify(getChladniPatternModes(seed, 4)));
    expect(signatures.size).toBeGreaterThan(15);
  });

  it('keeps earlier patterns when only Pattern Count changes', () => {
    const three = getChladniUniformValues({ ...DEFAULTS, noiseSeed: 12, chladniPatternCount: 3 });
    const four = getChladniUniformValues({ ...DEFAULTS, noiseSeed: 12, chladniPatternCount: 4 });
    expect(three.patternCount).toBe(3);
    expect(four.patternCount).toBe(4);
    expect(three.modesAB).toEqual(four.modesAB);
    expect(three.modesCD).toEqual(four.modesCD);
  });

  it('selects finer modes as Complexity increases', () => {
    const totalWavenumber = (complexity: number) => {
      let total = 0;
      for (let seed = 0; seed < 50; seed++) {
        total += getChladniPatternModes(seed, complexity).reduce((sum, [m, n]) => sum + Math.hypot(m, n), 0);
      }
      return total;
    };
    expect(totalWavenumber(1)).toBeLessThan(totalWavenumber(4));
    expect(totalWavenumber(4)).toBeLessThan(totalWavenumber(8));
  });

  it('bends the same base patterns toward non-integer modes with Detune', () => {
    for (const seed of [0, 8.8, 57]) {
      const base = getChladniPatternModes(seed, 5);
      const detuned = getChladniPatternModes(seed, 5, 1);
      expect(detuned).toEqual(getChladniPatternModes(seed, 5, 1));
      expect(detuned.flat().some(value => !Number.isInteger(value))).toBe(true);
      detuned.forEach(([m, n], index) => {
        expect(Math.abs(m - base[index][0])).toBeLessThanOrEqual(0.4);
        expect(Math.abs(n - base[index][1])).toBeLessThanOrEqual(0.4);
        expect(Math.abs(m - n)).toBeGreaterThanOrEqual(0.2 - 1e-9);
      });
    }
  });

  it('maps Mode, Map Profile, Map Direction, Mode Mix, and Edge to shader uniforms', () => {
    const uniforms = getChladniUniformValues({
      ...DEFAULTS,
      chladniMode: 'map',
      chladniMapProfile: 'folded',
      chladniMapAngle: 180,
      chladniModeMix: -3,
      chladniEdge: 1,
    });
    expect(uniforms).toMatchObject({ mode: 1, mapProfile: 1, modeMix: -1 });
    expect(uniforms.mapAngle).toBeCloseTo(Math.PI, 10);
    expect(uniforms.edgePhase).toBeCloseTo(Math.PI / 2, 10);

    const fallback = getChladniUniformValues({ ...DEFAULTS, chladniMode: 'bogus' as never, chladniMapProfile: 'bogus' as never });
    expect(fallback).toMatchObject({ mode: 0, mapProfile: 0, modeMix: 1, edgePhase: 0 });
  });

  it('clamps uniform values and mirrors the rotation for the shader', () => {
    const uniforms = getChladniUniformValues({
      ...DEFAULTS,
      chladniPatternCount: 7,
      chladniComplexity: Number.NaN,
      chladniLineWidth: -1,
      chladniSharpness: 100,
      chladniWarpStrength: 2,
      chladniRotation: 90,
    });
    expect(uniforms.patternCount).toBe(4);
    expect(uniforms.lineWidth).toBe(0.01);
    expect(uniforms.sharpness).toBe(8);
    expect(uniforms.warpStrength).toBe(1);
    expect(uniforms.rotation).toBeCloseTo(-Math.PI / 2, 10);
    expect([...uniforms.modesAB, ...uniforms.modesCD].every(Number.isInteger)).toBe(true);
  });
});

describe('Chladni field and loop', () => {
  it('matches the square-plate formula and its analytic gradient', () => {
    const mode: ChladniPlateMode = [2, 5];
    const [x, y] = [0.31, 0.77];
    const f = (px: number, py: number) => evaluateChladniField(px, py, mode)[0];
    const [value, dx, dy] = evaluateChladniField(x, y, mode);
    expect(value).toBeCloseTo(
      Math.cos(5 * Math.PI * x) * Math.cos(2 * Math.PI * y) - Math.cos(2 * Math.PI * x) * Math.cos(5 * Math.PI * y),
      12,
    );
    const h = 1e-6;
    expect(dx).toBeCloseTo((f(x + h, y) - f(x - h, y)) / (2 * h), 5);
    expect(dy).toBeCloseTo((f(x, y + h) - f(x, y - h)) / (2 * h), 5);
  });

  it('keeps the analytic gradient exact for Mode Mix, Edge, and detuned modes', () => {
    const mode: ChladniPlateMode = [2.3, 4.8];
    for (const [modeMix, edgePhase] of [[-1, 0], [0, 0.4], [0.35, Math.PI / 2]]) {
      const f = (px: number, py: number) => evaluateChladniField(px, py, mode, modeMix, edgePhase)[0];
      const [, dx, dy] = evaluateChladniField(0.27, 0.64, mode, modeMix, edgePhase);
      const h = 1e-6;
      expect(dx).toBeCloseTo((f(0.27 + h, 0.64) - f(0.27 - h, 0.64)) / (2 * h), 5);
      expect(dy).toBeCloseTo((f(0.27, 0.64 + h) - f(0.27, 0.64 - h)) / (2 * h), 5);
    }
  });

  it('uses the sine basis for a fixed edge', () => {
    const [value] = evaluateChladniField(0.21, 0.58, [3, 5], 1, Math.PI / 2);
    expect(value).toBeCloseTo(
      Math.sin(5 * Math.PI * 0.21) * Math.sin(3 * Math.PI * 0.58) - Math.sin(3 * Math.PI * 0.21) * Math.sin(5 * Math.PI * 0.58),
      12,
    );
  });

  it.each([2, 3, 4])('cycles through %i patterns and returns to Pattern A', (count) => {
    const segment = LOOP_PERIOD / count;
    for (let index = 0; index < count; index++) {
      const state = getChladniMorphState(segment * index + 1e-9, LOOP_PERIOD, count);
      expect(state.current).toBe(index);
      expect(state.next).toBe((index + 1) % count);
      expect(state.weight).toBeCloseTo(0, 6);
    }
    const end = getChladniMorphState(LOOP_PERIOD - 1e-9, LOOP_PERIOD, count);
    expect(end).toMatchObject({ current: count - 1, next: 0 });
    expect(end.weight).toBeCloseTo(1, 6);
  });
});

describe('Chladni displacement reference', () => {
  it.each([2, 3, 4])('stays finite for Pattern Count %i across seeds, parameters, and time', (count) => {
    for (const seed of [0, 33.3, 100]) {
      for (const params of [
        {},
        { chladniComplexity: 8, chladniLineWidth: 0.01, chladniSharpness: 0.5, chladniWarpStrength: 1, scale: 5 },
        { chladniComplexity: 1, chladniLineWidth: 1, chladniSharpness: 8, chladniRotation: 270, scale: 0.01 },
        { chladniModeMix: -1, chladniEdge: 1, chladniDetune: 1, chladniWarpStrength: 1 },
        { chladniModeMix: 0, chladniEdge: 0.5, chladniDetune: 0.5 },
        { chladniMode: 'map' as const, chladniMapProfile: 'folded' as const, chladniWarpStrength: 0.5, chladniEdge: 1 },
      ]) {
        const input = referenceInput({ noiseSeed: seed, chladniPatternCount: count, ...params });
        for (const time of [0, 0.37, 1.25, 2.5, 4.99, 123.4]) {
          for (const uv of sampleGrid(9)) {
            const [dx, dy] = evaluateChladniDisplacement(uv, time, input);
            expect(Number.isFinite(dx) && Number.isFinite(dy)).toBe(true);
            expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(1.0001);
          }
        }
      }
    }
  });

  it('stays finite exactly on nodal lines and critical points', () => {
    // The plate center and edges are nodal intersections or critical points
    // (zero gradient) for many modes.
    const input = referenceInput({}, [1000, 1000]);
    for (const uv of [[0.5, 0.5], [0, 0], [1, 1], [0, 1], [0.25, 0.75]] as Array<[number, number]>) {
      for (const time of [0, 0.8, 2.5]) {
        const [dx, dy] = evaluateChladniDisplacement(uv, time, input);
        expect(Number.isFinite(dx) && Number.isFinite(dy)).toBe(true);
      }
    }
  });

  it.each(['warp', 'map'] as const)('is the identity when Warp Strength is 0 in %s mode', (mode) => {
    const input = referenceInput({ chladniWarpStrength: 0, chladniMode: mode });
    for (const uv of sampleGrid(5)) expect(evaluateChladniDisplacement(uv, 1.3, input)).toEqual([0, 0]);
  });

  it('pushes UV along Map Direction by the field height in Gradient Map mode', () => {
    const vertical = referenceInput({ noiseSeed: 4, chladniMode: 'map', chladniMapAngle: 90 });
    const horizontal = referenceInput({ noiseSeed: 4, chladniMode: 'map', chladniMapAngle: 0 });
    let maxHeight = 0;
    for (const uv of sampleGrid(9)) {
      const [vx, vy] = evaluateChladniDisplacement(uv, 0.6, vertical);
      const [hx, hy] = evaluateChladniDisplacement(uv, 0.6, horizontal);
      expect(Math.abs(vx)).toBeLessThan(1e-12);
      expect(Math.abs(hy)).toBeLessThan(1e-12);
      expect(hx).toBeCloseTo(vy, 12);
      // Signed height is |F|/2 ≤ 1, scaled by Map Strength × gain 2.
      expect(Math.abs(vy)).toBeLessThanOrEqual(0.3 * 2 + 1e-12);
      maxHeight = Math.max(maxHeight, Math.abs(vy));
    }
    expect(maxHeight).toBeGreaterThan(0.1);
  });

  it('maps nodal lines to the low end with the Folded profile', () => {
    // uv (0.5, 0.5) is the plate center (0.5, 0.5), where the classic field
    // with Mode Mix 1 cancels for every mode pair: F = 0 on a nodal line.
    const input = referenceInput({ chladniMode: 'map', chladniMapProfile: 'folded', chladniMapAngle: 90 }, [1000, 1000]);
    const [, dy] = evaluateChladniDisplacement([0.5, 0.5], 0, input);
    expect(dy).toBeCloseTo(-1 * 0.3 * 2, 9);
  });

  it.each([
    [2, 'warp'], [3, 'warp'], [4, 'warp'], [2, 'map'], [3, 'map'], [4, 'map'],
  ] as const)('matches at the start and end of the Loop Period with Pattern Count %i (%s)', (count, mode) => {
    const input = referenceInput({ noiseSeed: 7, chladniPatternCount: count, chladniMode: mode, chladniDetune: 0.6, chladniEdge: 0.3 });
    for (const uv of sampleGrid(9)) {
      const start = evaluateChladniDisplacement(uv, 0, input);
      const end = evaluateChladniDisplacement(uv, LOOP_PERIOD - 1e-7, input);
      const nextLoop = evaluateChladniDisplacement(uv, LOOP_PERIOD, input);
      expect(end[0]).toBeCloseTo(start[0], 5);
      expect(end[1]).toBeCloseTo(start[1], 5);
      expect(nextLoop[0]).toBeCloseTo(start[0], 9);
      expect(nextLoop[1]).toBeCloseTo(start[1], 9);
    }
  });

  it.each(['warp', 'map'] as const)('has no velocity jump at the loop boundary or at key patterns (%s)', (mode) => {
    const input = referenceInput({ noiseSeed: 3, chladniPatternCount: 3, chladniMode: mode });
    const h = 1e-4;
    for (const boundary of [0, LOOP_PERIOD / 3, (LOOP_PERIOD * 2) / 3, LOOP_PERIOD]) {
      for (const uv of sampleGrid(5)) {
        const before = evaluateChladniDisplacement(uv, boundary - h, input);
        const at = evaluateChladniDisplacement(uv, boundary, input);
        const after = evaluateChladniDisplacement(uv, boundary + h, input);
        // The eased weight has zero slope at every key pattern, so a small
        // time step only changes the displacement to second order.
        for (const axis of [0, 1] as const) {
          expect(Math.abs(at[axis] - before[axis])).toBeLessThan(1e-5);
          expect(Math.abs(after[axis] - at[axis])).toBeLessThan(1e-5);
        }
      }
    }
  });

  it('interpolates the signed field so the morph passes through new nodal shapes', () => {
    // Halfway between two keys the displacement is not the average of the key
    // displacements, which is what an image cross-fade would produce.
    const input = referenceInput({ noiseSeed: 11, chladniPatternCount: 2 });
    let deviation = 0;
    for (const uv of sampleGrid(9)) {
      const a = evaluateChladniDisplacement(uv, 0, input);
      const b = evaluateChladniDisplacement(uv, LOOP_PERIOD / 2, input);
      const middle = evaluateChladniDisplacement(uv, LOOP_PERIOD / 4, input);
      deviation += Math.abs(middle[0] - (a[0] + b[0]) / 2) + Math.abs(middle[1] - (a[1] + b[1]) / 2);
    }
    expect(deviation).toBeGreaterThan(0.05);
  });

  it('is deterministic for the same Seed and different for another Seed', () => {
    const a = referenceInput({ noiseSeed: 21 });
    const b = referenceInput({ noiseSeed: 21 });
    const other = referenceInput({ noiseSeed: 64 });
    let difference = 0;
    for (const uv of sampleGrid(9)) {
      const first = evaluateChladniDisplacement(uv, 0.8, a);
      expect(first).toEqual(evaluateChladniDisplacement(uv, 0.8, b));
      const [ox, oy] = evaluateChladniDisplacement(uv, 0.8, other);
      difference += Math.abs(first[0] - ox) + Math.abs(first[1] - oy);
    }
    expect(difference).toBeGreaterThan(0.01);
  });

  it('keeps the plate square on non-square canvases', () => {
    // The same pixel offset from the center reaches the same plate point on a
    // 16:9 and a square canvas, and yields the same displacement in pixels.
    const wide = referenceInput({ noiseSeed: 5 }, [1600, 900]);
    const square = referenceInput({ noiseSeed: 5 }, [900, 900]);
    for (let step = -4; step <= 4; step++) {
      const offsetPixels = step * 40;
      const [wx, wy] = evaluateChladniDisplacement([0.5 + offsetPixels / 1600, 0.5], 0.4, wide);
      const [sx, sy] = evaluateChladniDisplacement([0.5 + offsetPixels / 900, 0.5], 0.4, square);
      expect(wx * 1600).toBeCloseTo(sx * 900, 6);
      expect(wy * 900).toBeCloseTo(sy * 900, 6);
    }
  });

  it('keeps the nodal structure when Scale changes', () => {
    // Doubling Scale is the same field sampled at half the offset from center.
    const base = referenceInput({ noiseSeed: 9, scale: 1 }, [1000, 1000]);
    const doubled = referenceInput({ noiseSeed: 9, scale: 2 }, [1000, 1000]);
    for (const [u, v] of sampleGrid(7)) {
      const scaled = evaluateChladniDisplacement([0.5 + (u - 0.5) / 2, 0.5 + (v - 0.5) / 2], 1.1, doubled);
      const reference = evaluateChladniDisplacement([u, v], 1.1, base);
      expect(scaled[0]).toBeCloseTo(reference[0], 9);
      expect(scaled[1]).toBeCloseTo(reference[1], 9);
    }
  });
});
