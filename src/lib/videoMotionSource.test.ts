import { describe, expect, it } from 'vitest';
import {
  VIDEO_MOTION_FIELD_HEIGHT,
  VIDEO_MOTION_FIELD_WIDTH,
  createVideoMotionSource,
  estimateVideoMotionField,
  getVideoMotionFieldStats,
} from './videoMotionSource';

function pixelIndex(x: number, y: number): number {
  return y * VIDEO_MOTION_FIELD_WIDTH + x;
}

describe('video motion field estimator', () => {
  it('keeps a flat frame stable instead of selecting the first search offset', () => {
    const source = createVideoMotionSource();
    const previous = new Float32Array(VIDEO_MOTION_FIELD_WIDTH * VIDEO_MOTION_FIELD_HEIGHT);
    const current = new Float32Array(previous);

    estimateVideoMotionField(source.field, current, previous, {
      fieldSmoothing: 0,
      motionDamping: 0,
    });

    const stats = getVideoMotionFieldStats(source);
    expect(stats.meanMagnitude).toBe(0);
    expect(stats.activeRatio).toBe(0);
  });

  it('keeps a clean one-cell translation instead of suppressing exact matches', () => {
    const source = createVideoMotionSource();
    const previous = new Float32Array(VIDEO_MOTION_FIELD_WIDTH * VIDEO_MOTION_FIELD_HEIGHT);
    const current = new Float32Array(previous.length);
    for (let y = 0; y < VIDEO_MOTION_FIELD_HEIGHT; y += 1) {
      for (let x = 0; x < VIDEO_MOTION_FIELD_WIDTH; x += 1) {
        previous[pixelIndex(x, y)] = ((x * 17 + y * 31) % 97) / 97;
      }
    }
    for (let y = 0; y < VIDEO_MOTION_FIELD_HEIGHT; y += 1) {
      for (let x = 0; x < VIDEO_MOTION_FIELD_WIDTH; x += 1) {
        current[pixelIndex(x, y)] = previous[pixelIndex(Math.max(0, x - 1), y)];
      }
    }

    estimateVideoMotionField(source.field, current, previous, {
      fieldSmoothing: 0,
      motionDamping: 0,
    });

    const stats = getVideoMotionFieldStats(source);
    expect(stats.meanMagnitude).toBeGreaterThan(0.15);
    expect(stats.meanX).toBeGreaterThan(0.45);
    expect(Math.abs(stats.meanY)).toBeLessThan(0.15);
    expect(stats.meanChange).toBeGreaterThan(0);
    expect(stats.maxChange).toBeGreaterThan(0);
    expect(stats.changeRatio).toBeGreaterThan(0);
  });
});
