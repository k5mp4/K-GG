/** Animation limits and timing helpers shared outside the Zustand store. */

import type { AnimationConfig } from '../types/animation';
import { getParameterLimit } from './parameterLimits';

export const BEAT_SYNC_BEATS_PER_LOOP = 4;
export const ANIMATION_DURATION_MIN = getParameterLimit('animation.duration').min;
export const ANIMATION_DURATION_MAX = getParameterLimit('animation.duration').max;
export const ANIMATION_SPEED_MIN = getParameterLimit('animation.speed').min;
export const ANIMATION_SPEED_MAX = getParameterLimit('animation.speed').max;

export function getBeatSyncDurationSeconds(bpm: number): number {
  const safeBpm = Math.max(1, Math.min(999, Number.isFinite(bpm) ? bpm : 120));
  return BEAT_SYNC_BEATS_PER_LOOP * 60 / safeBpm;
}

/**
 * Preview Loop and Loop Timing are playback settings the user tunes while
 * browsing Presets. Loading a Preset keeps the current values instead of
 * replacing them with whatever the Preset happened to store.
 */
export function keepLoopTimingOnPresetLoad(
  loaded: Partial<AnimationConfig>,
  current: Pick<AnimationConfig, 'previewLoop' | 'easing'>,
): Partial<AnimationConfig> {
  return {
    ...loaded,
    previewLoop: current.previewLoop ?? true,
    easing: current.easing,
  };
}
