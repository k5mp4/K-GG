import { describe, expect, it } from 'vitest';
import { cubehelixAt, generateCubehelixGradient, type CubehelixParams } from './cubehelix';

const DEFAULT_PARAMS: CubehelixParams = {
  startHue: 240,
  rotations: 1,
  hue: 0.7,
  gamma: 1,
  lightnessStart: 0.05,
  lightnessEnd: 0.95,
};

function expectFiniteHex(color: string): void {
  expect(color).toMatch(/^#[0-9A-F]{6}$/);
  expect([...color].every((character) => character !== 'N')).toBe(true);
}

describe('cubehelix gradient generation', () => {
  it('generates 3–10 evenly positioned, valid stops', () => {
    for (const stopCount of [3, 5, 10]) {
      const stops = generateCubehelixGradient({ ...DEFAULT_PARAMS, stopCount });
      expect(stops).toHaveLength(stopCount);
      expect(stops.map((stop) => stop.position)).toEqual(
        Array.from({ length: stopCount }, (_, index) => index / (stopCount - 1)),
      );
      stops.forEach((stop) => expectFiniteHex(stop.color));
    }
  });

  it('is deterministic and preserves the direction of rotations', () => {
    expect(generateCubehelixGradient({ ...DEFAULT_PARAMS, stopCount: 6 }))
      .toEqual(generateCubehelixGradient({ ...DEFAULT_PARAMS, stopCount: 6 }));
    expect(generateCubehelixGradient({ ...DEFAULT_PARAMS, rotations: 1, stopCount: 6 }))
      .not.toEqual(generateCubehelixGradient({ ...DEFAULT_PARAMS, rotations: -1, stopCount: 6 }));
  });

  it('keeps extreme gamma and hue inputs finite', () => {
    const stops = generateCubehelixGradient({
      startHue: Number.POSITIVE_INFINITY,
      rotations: Number.NEGATIVE_INFINITY,
      hue: Number.MAX_VALUE,
      gamma: 0,
      lightnessStart: Number.NaN,
      lightnessEnd: Number.POSITIVE_INFINITY,
      stopCount: 10,
    });
    stops.forEach((stop) => expectFiniteHex(stop.color));
    expect(cubehelixAt(0.5, { ...DEFAULT_PARAMS, gamma: 10_000 })).toEqual(
      cubehelixAt(0.5, { ...DEFAULT_PARAMS, gamma: 10_000 }),
    );
  });

  it('has a monotonic base lightness trajectory when chroma is disabled', () => {
    const values = Array.from({ length: 17 }, (_, index) => {
      const color = cubehelixAt(index / 16, { ...DEFAULT_PARAMS, hue: 0 });
      return color.r + color.g + color.b;
    });
    expect(values.every((value, index) => index === 0 || value >= values[index - 1])).toBe(true);
  });
});
