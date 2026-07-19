import { describe, expect, it } from 'vitest';
import { fromTweeqAngle, normalizeAngle, toTweeqAngle } from './tweeqAngle';

describe('Tweeq angle adapter', () => {
  it('wraps negative and multi-turn values into one canonical turn', () => {
    expect(normalizeAngle(-360)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(450)).toBe(90);
  });

  it('mirrors the screen-space rotation direction at the adapter boundary', () => {
    expect(toTweeqAngle(90)).toBe(270);
    expect(fromTweeqAngle(270)).toBe(90);
  });

  it('leaves non-finite values available for the caller to reject', () => {
    expect(Number.isNaN(normalizeAngle(Number.NaN))).toBe(true);
    expect(normalizeAngle(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  });
});
