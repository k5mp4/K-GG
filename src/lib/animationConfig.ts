/** Animation limits and timing helpers shared outside the Zustand store. */

import type { AnimationConfig } from '../types/animation';
import { getParameterLimit } from './parameterLimits';

export const BEAT_SYNC_BEATS_PER_LOOP = 4;
export const ANIMATION_DURATION_MIN = getParameterLimit('animation.duration').min;
export const ANIMATION_DURATION_MAX = getParameterLimit('animation.duration').max;
export const ANIMATION_SPEED_MIN = getParameterLimit('animation.speed').min;
export const ANIMATION_SPEED_MAX = getParameterLimit('animation.speed').max;

/** Tempo multipliers selectable for Beat Sync. 2 plays the beat twice as fast, 1/2 and 1/4 slow it down. */
export const BEAT_SYNC_RATES = [0.25, 0.5, 1, 2] as const;
export type BeatSyncRate = typeof BEAT_SYNC_RATES[number];

export function normalizeBeatSyncRate(rate: unknown): BeatSyncRate {
  return BEAT_SYNC_RATES.find(candidate => candidate === rate) ?? 1;
}

/** The next slower (-1) or faster (+1) rate, stopping at both ends. */
export function stepBeatSyncRate(rate: unknown, direction: -1 | 1): BeatSyncRate {
  const index = BEAT_SYNC_RATES.indexOf(normalizeBeatSyncRate(rate));
  return BEAT_SYNC_RATES[Math.min(BEAT_SYNC_RATES.length - 1, Math.max(0, index + direction))];
}

export const BEAT_SYNC_BPM_MIN = 1;
export const BEAT_SYNC_BPM_MAX = 999;

/** Beat SyncのBPMを許容範囲（1〜999）へ収め、小数第2位（0.01刻み）へ丸める。 */
export function normalizeBeatSyncBpm(bpm: number, fallback = 120): number {
  const value = Number.isFinite(bpm) ? bpm : fallback;
  return Math.min(BEAT_SYNC_BPM_MAX, Math.max(BEAT_SYNC_BPM_MIN, Math.round(value * 100) / 100));
}

export function getBeatSyncDurationSeconds(bpm: number, rate: unknown = 1): number {
  const safeBpm = Math.max(1, Math.min(999, Number.isFinite(bpm) ? bpm : 120));
  return BEAT_SYNC_BEATS_PER_LOOP * 60 / (safeBpm * normalizeBeatSyncRate(rate));
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
