import { describe, expect, it } from 'vitest';
import { mapVideoMotionTimelineTime } from './videoMotionRuntime';

describe('video motion timeline mapping', () => {
  it('maps normalized composition time to the loaded video duration', () => {
    expect(mapVideoMotionTimelineTime(0, 12)).toBe(0);
    expect(mapVideoMotionTimelineTime(0.25, 12)).toBe(3);
    expect(mapVideoMotionTimelineTime(1, 12)).toBe(12);
  });

  it('clamps malformed timeline values instead of producing invalid seek times', () => {
    expect(mapVideoMotionTimelineTime(-1, 12)).toBe(0);
    expect(mapVideoMotionTimelineTime(2, 12)).toBe(12);
    expect(mapVideoMotionTimelineTime(Number.NaN, 12)).toBe(0);
    expect(mapVideoMotionTimelineTime(0.5, 0)).toBe(0);
  });
});
