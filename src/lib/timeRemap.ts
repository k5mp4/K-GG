import type { AnimationEasing } from '../store/gradientStore';
import { evaluateCubicBezier } from './easingBezier';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function applyTimeRemap(
  normalizedTime: number,
  _duration: number,
  easing?: AnimationEasing,
): number {
  const nt = clamp01(normalizedTime);

  const easeLocal = (localTime: number) => {
    const t = clamp01(localTime);
    if (!easing?.enabled) return t;
    return evaluateCubicBezier(t, easing.p1[0], easing.p1[1], easing.p2[0], easing.p2[1]);
  };

  const beatSync = easing?.beatSync;
  if (!beatSync?.enabled) return easeLocal(nt);

  const sections = beatSync.subdivision === 3 ? 3 : 4;
  const sectionPosition = nt * sections;
  const sectionIndex = Math.min(sections - 1, Math.floor(sectionPosition));
  const localTime = sectionPosition - sectionIndex;

  return clamp01((sectionIndex + easeLocal(localTime)) / sections);
}
