import type { CubicBezierValue } from 'tweeq';

export type CubicBezierLinkMode = 'none' | 'symmetric' | 'coincide';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function normalize(value: CubicBezierValue): [number, number, number, number] {
  return value.map(clamp01) as [number, number, number, number];
}

/** Apply a link constraint using whichever handle changed most from previous. */
export function applyCubicBezierLink(
  previous: CubicBezierValue,
  candidate: CubicBezierValue,
  mode: CubicBezierLinkMode,
): [number, number, number, number] {
  const next = normalize(candidate);
  if (mode === 'none') return next;
  const p1Delta = Math.hypot(next[0] - previous[0], next[1] - previous[1]);
  const p2Delta = Math.hypot(next[2] - previous[2], next[3] - previous[3]);
  const changedPoint = p2Delta > p1Delta ? 1 : 0;

  if (mode === 'coincide') {
    if (changedPoint === 0) return [next[0], next[1], next[0], next[1]];
    return [next[2], next[3], next[2], next[3]];
  }
  if (changedPoint === 0) return [next[0], next[1], 1 - next[0], 1 - next[1]];
  return [1 - next[2], 1 - next[3], next[2], next[3]];
}
