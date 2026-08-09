function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getClothVertexOffset(
  x: number,
  y: number,
  planeWidth: number,
  planeHeight: number,
  time: number,
): number {
  const u = clamp(x / Math.max(planeWidth, 0.001) + 0.5, 0, 1);
  const v = clamp(y / Math.max(planeHeight, 0.001) + 0.5, 0, 1);
  const hanging = 1 - v;
  const broadFold = Math.sin(time * 1.15 + u * 6.4 + v * 2.2) * (0.035 + hanging * 0.11);
  const fineFold = Math.sin(time * 0.63 - u * 3.1 + v * 7.2) * hanging * 0.06;
  return broadFold + fineFold;
}
