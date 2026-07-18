export const ANGLE_TURN_DEGREES = 360;

/**
 * Keep an angle in the canonical UI range. A full turn is equivalent to zero
 * for the slit renderer, so the returned range is [0, 360).
 */
export function normalizeAngle(value: number): number {
  if (!Number.isFinite(value)) return value;
  return ((value % ANGLE_TURN_DEGREES) + ANGLE_TURN_DEGREES) % ANGLE_TURN_DEGREES;
}

/**
 * Tweeq's screen-space rotary control increases clockwise, while K-GG's
 * canvas angle convention increases counter-clockwise. Keep the displayed
 * control value intuitive and mirror only at the adapter boundary.
 */
export function toTweeqAngle(modelValue: number): number {
  return normalizeAngle(-modelValue);
}

export function fromTweeqAngle(inputValue: number): number {
  return normalizeAngle(-inputValue);
}
