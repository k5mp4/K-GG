/**
 * Convert the clockwise UI angle into the canvas/WebGL direction vector.
 * 0° points up, 90° points right, and the angle increases clockwise.
 */
export function getAnimationDirectionVector(directionDegrees: number): [number, number] {
  const safeDirection = Number.isFinite(directionDegrees) ? directionDegrees : 0;
  const radians = (safeDirection * Math.PI) / 180;
  return [Math.sin(radians), -Math.cos(radians)];
}
