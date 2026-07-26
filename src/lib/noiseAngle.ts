/**
 * Noise angle controls share the canvas InputAngle convention. Noise's GLSL
 * coordinate rotation is screen-space inverted, so the sign conversion stays
 * at the renderer boundary instead of changing saved presets or keyframes.
 */
export function noiseAngleRadiansForShader(value: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  return -value;
}

export function noiseAngleDegreesForShader(value: number): number {
  return noiseAngleRadiansForShader((Number.isFinite(value) ? value : 0) * Math.PI / 180);
}
