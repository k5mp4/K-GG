import { describe, expect, it } from 'vitest';
import { onePercentLowFrameMs } from './webglPerformance';

describe('benchmark frame metrics', () => {
  it('uses one frame for very short benchmark runs', () => {
    expect(onePercentLowFrameMs([16.7])).toBe(16.7);
  });

  it('does not mutate the input order while selecting the slowest frames', () => {
    const input = [10, 30, 20];
    onePercentLowFrameMs(input);
    expect(input).toEqual([10, 30, 20]);
  });
});
