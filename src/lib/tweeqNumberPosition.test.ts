import { describe, expect, it } from 'vitest';
import { getTweeqValuePosition } from './tweeqNumberPosition';

describe('getTweeqValuePosition', () => {
  it('maps a value to the controlled handle position', () => {
    expect(getTweeqValuePosition(25, 0, 100)).toBe(0.25);
  });

  it('clamps values outside the display range', () => {
    expect(getTweeqValuePosition(-1, 0, 100)).toBe(0);
    expect(getTweeqValuePosition(101, 0, 100)).toBe(1);
  });

  it('returns the safe start position for invalid or collapsed ranges', () => {
    expect(getTweeqValuePosition(Number.NaN, 0, 100)).toBe(0);
    expect(getTweeqValuePosition(10, 10, 10)).toBe(0);
    expect(getTweeqValuePosition(10, 100, 0)).toBe(0);
  });
});
