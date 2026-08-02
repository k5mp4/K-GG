import type { EffectStackLayer } from '../types/distortion';

export const EFFECT_STACK_TRANSITION_DURATION_MS = 400;

export type EffectStackTransition = {
  from: EffectStackLayer[];
  to: EffectStackLayer[];
  startedAt: number;
  durationMs: number;
};

export type ActiveEffectStackTransition = EffectStackTransition & {
  progress: number;
};

let activeTransition: EffectStackTransition | null = null;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function easeInOut(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return clamped * clamped * (3 - 2 * clamped);
}

export function beginEffectStackTransition(
  from: EffectStackLayer[],
  to: EffectStackLayer[],
  startedAt = now(),
  durationMs = EFFECT_STACK_TRANSITION_DURATION_MS,
): void {
  activeTransition = {
    from: from.map(layer => ({ ...layer })),
    to: to.map(layer => ({ ...layer })),
    startedAt,
    durationMs: Math.max(1, durationMs),
  };
}

export function getEffectStackTransition(at = now()): ActiveEffectStackTransition | null {
  if (!activeTransition) return null;
  const rawProgress = (at - activeTransition.startedAt) / activeTransition.durationMs;
  return {
    ...activeTransition,
    progress: easeInOut(rawProgress),
  };
}

export function isEffectStackTransitionActive(at = now()): boolean {
  const transition = getEffectStackTransition(at);
  return transition !== null && at < transition.startedAt + transition.durationMs;
}

export function finishEffectStackTransition(): void {
  activeTransition = null;
}
