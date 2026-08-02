import { describe, expect, it } from 'vitest';
import { createDefaultEffectStack } from './effectPipeline';
import {
  beginEffectStackTransition,
  EFFECT_STACK_TRANSITION_DURATION_MS,
  easeInOut,
  finishEffectStackTransition,
  getEffectStackTransition,
  isEffectStackTransitionActive,
} from './effectStackTransition';

describe('effectStackTransition', () => {
  it('uses a smooth ease-in-out progress curve', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });

  it('keeps the transition transient and expires after the configured duration', () => {
    const from = createDefaultEffectStack();
    const to = [...from].reverse();
    beginEffectStackTransition(from, to, 1000);

    expect(getEffectStackTransition(1000)?.progress).toBe(0);
    expect(getEffectStackTransition(1200)?.progress).toBeGreaterThan(0);
    expect(isEffectStackTransitionActive(1200)).toBe(true);
    expect(isEffectStackTransitionActive(1000 + EFFECT_STACK_TRANSITION_DURATION_MS)).toBe(false);

    finishEffectStackTransition();
    expect(getEffectStackTransition(1200)).toBeNull();
  });
});
