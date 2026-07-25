import { describe, expect, it } from 'vitest';
import { getAnimationDirectionVector } from './animationDirection';

describe('Animation direction vector', () => {
  it('maps clockwise UI angles to canvas directions', () => {
    expect(getAnimationDirectionVector(0)[0]).toBeCloseTo(0);
    expect(getAnimationDirectionVector(0)[1]).toBeCloseTo(-1);
    expect(getAnimationDirectionVector(90)[0]).toBeCloseTo(1);
    expect(getAnimationDirectionVector(90)[1]).toBeCloseTo(0);
    expect(getAnimationDirectionVector(180)[0]).toBeCloseTo(0);
    expect(getAnimationDirectionVector(180)[1]).toBeCloseTo(1);
    expect(getAnimationDirectionVector(270)[0]).toBeCloseTo(-1);
    expect(getAnimationDirectionVector(270)[1]).toBeCloseTo(0);
  });

  it('uses the neutral upward direction for non-finite input', () => {
    expect(getAnimationDirectionVector(Number.NaN)).toEqual([0, -1]);
  });
});
