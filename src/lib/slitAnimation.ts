const MIN_LOOP_PERIOD = 0.0001;
const ZERO_SPEED_EPSILON = 1e-6;

/**
 * Returns the periodic phase consumed by Slit's shader animation.
 *
 * The cycle count is quantized so the phase returns to the same shader
 * position when the animation loop reaches its duration boundary.
 */
export function getSlitAnimationPhase(
  elapsedSeconds: number,
  loopPeriod: number,
  offsetSpeed: number,
): number {
  const safeElapsedSeconds = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
  const safeLoopPeriod = Math.max(
    Math.abs(Number.isFinite(loopPeriod) ? loopPeriod : 0),
    MIN_LOOP_PERIOD,
  );
  const safeOffsetSpeed = Number.isFinite(offsetSpeed) ? offsetSpeed : 0;
  const speedMagnitude = Math.abs(safeOffsetSpeed);

  if (speedMagnitude <= ZERO_SPEED_EPSILON) return 0;

  const loopPhase = ((safeElapsedSeconds / safeLoopPeriod) % 1 + 1) % 1;
  const cycleCount = Math.max(1, Math.floor(speedMagnitude * safeLoopPeriod + 0.5));
  return loopPhase * cycleCount * Math.sign(safeOffsetSpeed);
}
