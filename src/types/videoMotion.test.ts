import { describe, expect, it } from 'vitest';
import { VIDEO_MOTION_DEFAULTS, normalizeVideoMotionConfig } from './videoMotion';

describe('video motion config', () => {
  it('normalizes persisted values to feedback-only parameter ranges', () => {
    const value = normalizeVideoMotionConfig({
      enabled: true,
      mode: 'datamosh',
      effectStrength: 4,
      decay: 2,
      smearLength: Number.NaN,
    });

    expect(value.enabled).toBe(true);
    expect(value.mode).toBe('feedback');
    expect(value.effectStrength).toBe(1);
    expect(value.decay).toBe(0.99);
    expect(value.smearLength).toBe(VIDEO_MOTION_DEFAULTS.smearLength);
    expect(value).not.toHaveProperty('glitchAmount');
    expect(value).not.toHaveProperty('warpStrength');
  });

  it('falls back to defaults for malformed or unknown input', () => {
    expect(normalizeVideoMotionConfig(null)).toEqual(VIDEO_MOTION_DEFAULTS);
    expect(normalizeVideoMotionConfig({ mode: 'unknown', enabled: 'yes' })).toEqual(VIDEO_MOTION_DEFAULTS);
  });

});
