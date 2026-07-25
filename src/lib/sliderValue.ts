export function clampSliderValue(value: number, min: number, max: number): number {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  const lower = Math.min(safeMin, safeMax);
  const upper = Math.max(safeMin, safeMax);
  return Number.isFinite(value) ? Math.min(upper, Math.max(lower, value)) : lower;
}

export function isSliderValueOutOfRange(value: number, min: number, max: number): boolean {
  if (!Number.isFinite(value)) return false;
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return value < lower || value > upper;
}
