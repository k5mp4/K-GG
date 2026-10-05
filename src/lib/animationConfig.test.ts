import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { getBeatSyncDurationSeconds, keepLoopTimingOnPresetLoad, normalizeBeatSyncBpm, normalizeBeatSyncRate, stepBeatSyncRate } from './animationConfig';

describe('keepLoopTimingOnPresetLoad', () => {
  const current = {
    previewLoop: false,
    easing: {
      ...STORE_DEFAULTS.animation.easing,
      enabled: true,
      beatSync: { enabled: true, bpm: 140, beatsPerBar: 4, subdivision: 3 as const },
    },
  };

  it('keeps the current Preview Loop and Loop Timing over the Preset values', () => {
    const loaded = {
      ...STORE_DEFAULTS.animation,
      previewLoop: true,
      easing: { enabled: false, p1: [0.25, 0.25] as [number, number], p2: [0.75, 0.75] as [number, number], linkMode: 'none' as const },
      duration: 8,
    };

    const result = keepLoopTimingOnPresetLoad(loaded, current);

    expect(result.previewLoop).toBe(false);
    expect(result.easing).toBe(current.easing);
    expect(result.duration).toBe(8);
  });
});

describe('Beat Sync rate', () => {
  it('scales the 4 beat loop by the tempo multiplier', () => {
    expect(getBeatSyncDurationSeconds(120)).toBe(2);
    expect(getBeatSyncDurationSeconds(120, 2)).toBe(1);
    expect(getBeatSyncDurationSeconds(120, 0.5)).toBe(4);
    expect(getBeatSyncDurationSeconds(120, 0.25)).toBe(8);
  });

  it('treats a missing or unknown rate as 1', () => {
    expect(getBeatSyncDurationSeconds(120, undefined)).toBe(2);
    expect(normalizeBeatSyncRate(3)).toBe(1);
    expect(normalizeBeatSyncRate('2')).toBe(1);
  });

  it('steps through the rates and stops at both ends', () => {
    expect(stepBeatSyncRate(1, 1)).toBe(2);
    expect(stepBeatSyncRate(2, 1)).toBe(2);
    expect(stepBeatSyncRate(1, -1)).toBe(0.5);
    expect(stepBeatSyncRate(0.25, -1)).toBe(0.25);
    expect(stepBeatSyncRate(undefined, -1)).toBe(0.5);
  });
});

describe('normalizeBeatSyncBpm', () => {
  it('keeps two decimal places', () => {
    expect(normalizeBeatSyncBpm(128.37)).toBe(128.37);
    expect(normalizeBeatSyncBpm(128.5)).toBe(128.5);
    expect(normalizeBeatSyncBpm(127.456)).toBe(127.46);
    // float32で届く値（例: 128.37 → 128.3699951...）も元の値へ戻る。
    expect(normalizeBeatSyncBpm(Math.fround(128.37))).toBe(128.37);
  });

  it('clamps to the Beat Sync range and falls back for non-finite values', () => {
    expect(normalizeBeatSyncBpm(0.2)).toBe(1);
    expect(normalizeBeatSyncBpm(5000)).toBe(999);
    expect(normalizeBeatSyncBpm(Number.NaN)).toBe(120);
  });
});
