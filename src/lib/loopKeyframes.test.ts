import { describe, expect, it } from 'vitest';
import type { Keyframe } from '../types/keyframe';
import {
  clampKeyframeTime,
  getDisplayKeyframes,
  interpolateKeyframesWithLoop,
} from './loopKeyframes';

const keyframes: Keyframe<number>[] = [
  { id: 'start', time: 0, value: 0, interpolation: 'linear' },
  { id: 'middle', time: 0.5, value: 10, interpolation: 'linear' },
];

describe('loopKeyframes', () => {
  it('mirrors the first half of a loop during evaluation', () => {
    expect(interpolateKeyframesWithLoop(0.25, keyframes, true)).toBe(5);
    expect(interpolateKeyframesWithLoop(0.75, keyframes, true)).toBe(5);
    expect(interpolateKeyframesWithLoop(0.9, keyframes, true)).toBeCloseTo(2);
  });

  it('keeps the original timeline when looping is disabled', () => {
    expect(interpolateKeyframesWithLoop(0.75, keyframes, false)).toBe(10);
  });

  it('limits editable keyframe time to the first half', () => {
    expect(clampKeyframeTime(0.8, true)).toBe(0.5);
    expect(clampKeyframeTime(0.8, false)).toBe(0.8);
  });

  it('returns source markers and read-only mirror markers', () => {
    const display = getDisplayKeyframes(keyframes, true);

    expect(display.map(item => [item.time, item.isMirror])).toEqual([
      [0, false],
      [0.5, false],
      [1, true],
    ]);
  });
});
