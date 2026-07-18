export function getTweeqValuePosition(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return 0;
  }

  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
