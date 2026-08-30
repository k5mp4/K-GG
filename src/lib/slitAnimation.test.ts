import { describe, expect, it } from 'vitest';
import { getSlitAnimationPhase } from './slitAnimation';

describe('getSlitAnimationPhase', () => {
  it('returns to the starting shader phase at the duration boundary', () => {
    expect(getSlitAnimationPhase(0, 5, 0.3)).toBe(0);
    expect(getSlitAnimationPhase(5, 5, 0.3)).toBe(0);
    expect(getSlitAnimationPhase(2.5, 5, 0.3)).toBeCloseTo(1);
    expect(getSlitAnimationPhase(4.999, 5, 0.3)).toBeCloseTo(1.9996);
  });

  it('preserves direction and keeps zero speed static', () => {
    expect(getSlitAnimationPhase(2.5, 5, -0.3)).toBeCloseTo(-1);
    expect(getSlitAnimationPhase(2.5, 5, 0)).toBe(0);
  });

  it('uses the speed-adjusted animation period', () => {
    expect(getSlitAnimationPhase(0, 14, 0.5)).toBe(0);
    expect(getSlitAnimationPhase(7, 14, 0.5)).toBeCloseTo(3.5);
    expect(getSlitAnimationPhase(14, 14, 0.5)).toBe(0);
  });
});
