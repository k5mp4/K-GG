import type { Keyframe } from '../types/keyframe';
import { interpolateKeyframes } from './keyframeInterpolator';

export const LOOP_KEYFRAME_END = 0.5;
const LOOP_TIME_EPSILON = 1e-6;

export type DisplayKeyframe = {
  keyframe: Keyframe<number>;
  time: number;
  isMirror: boolean;
};

export function clampKeyframeTime(time: number, loopEnabled: boolean): number {
  const normalized = Number.isFinite(time) ? Math.max(0, Math.min(1, time)) : 0;
  return loopEnabled ? Math.min(LOOP_KEYFRAME_END, normalized) : normalized;
}

export function getKeyframeEditTime(time: number, loopEnabled: boolean): number {
  return clampKeyframeTime(time, loopEnabled);
}

export function getLoopSourceKeyframes(keyframes: Keyframe<number>[]): Keyframe<number>[] {
  return keyframes
    .filter(keyframe => keyframe.time <= LOOP_KEYFRAME_END + LOOP_TIME_EPSILON)
    .sort((a, b) => a.time - b.time);
}

export function interpolateKeyframesWithLoop(
  time: number,
  keyframes: Keyframe<number>[],
  loopEnabled: boolean,
): number {
  if (!loopEnabled) return interpolateKeyframes(time, keyframes);
  const sourceKeyframes = getLoopSourceKeyframes(keyframes);
  if (sourceKeyframes.length === 0) return 0;
  const normalized = Math.max(0, Math.min(1, Number.isFinite(time) ? time : 0));
  const mirroredTime = normalized > LOOP_KEYFRAME_END
    ? 1 - normalized
    : normalized;
  return interpolateKeyframes(mirroredTime, sourceKeyframes);
}

export function getDisplayKeyframes(
  keyframes: Keyframe<number>[],
  loopEnabled: boolean,
): DisplayKeyframe[] {
  if (!loopEnabled) {
    return keyframes
      .map(keyframe => ({ keyframe, time: keyframe.time, isMirror: false }))
      .sort((a, b) => a.time - b.time);
  }

  const sourceKeyframes = getLoopSourceKeyframes(keyframes);
  const source = sourceKeyframes.map(keyframe => ({
    keyframe,
    time: keyframe.time,
    isMirror: false,
  }));
  const mirror = sourceKeyframes
    .filter(keyframe => keyframe.time < LOOP_KEYFRAME_END - LOOP_TIME_EPSILON)
    .map(keyframe => ({
      keyframe,
      time: 1 - keyframe.time,
      isMirror: true,
    }));

  return [...source, ...mirror].sort((a, b) => a.time - b.time);
}
