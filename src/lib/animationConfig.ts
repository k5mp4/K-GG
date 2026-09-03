/** Animation limits and timing helpers shared outside the Zustand store. */

export const BEAT_SYNC_BEATS_PER_LOOP = 4;
export const ANIMATION_DURATION_MIN = 1;
export const ANIMATION_DURATION_MAX = 10;
export const ANIMATION_SPEED_MIN = 1;
export const ANIMATION_SPEED_MAX = 5;

export function getBeatSyncDurationSeconds(bpm: number): number {
  const safeBpm = Math.max(1, Math.min(999, Number.isFinite(bpm) ? bpm : 120));
  return BEAT_SYNC_BEATS_PER_LOOP * 60 / safeBpm;
}
