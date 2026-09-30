import { describe, expect, it } from 'vitest';
import { STORE_DEFAULTS } from '../store/gradientStore';
import { keepLoopTimingOnPresetLoad } from './animationConfig';

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
