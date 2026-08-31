import { CONE_SEAM_BLEND_MAX } from '../types/coneView';

export type ConeRgba = readonly [number, number, number, number];

const CONE_SEAM_ZERO_WIDTH_EPSILON = 0.00001;

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function applyConeRgbDelta(
  center: ConeRgba,
  sideEdge: ConeRgba,
  target: readonly [number, number, number],
  weight: number,
): [number, number, number, number] {
  const influence = clampUnit(weight);
  return [
    clampUnit(center[0] + (target[0] - sideEdge[0]) * influence),
    clampUnit(center[1] + (target[1] - sideEdge[1]) * influence),
    clampUnit(center[2] + (target[2] - sideEdge[2]) * influence),
    center[3],
  ];
}

/** Returns the raised-cosine influence from a normalized texture seam. */
export function getRaisedCosineSeamWeight(coordinate: number, blendWidth: number): number {
  if (!Number.isFinite(coordinate) || !Number.isFinite(blendWidth)) return 0;
  const safeCoordinate = clampUnit(coordinate);
  const safeBlendWidth = Math.min(CONE_SEAM_BLEND_MAX, Math.max(0, blendWidth));
  const distanceToSeam = Math.min(safeCoordinate, 1 - safeCoordinate);
  if (safeBlendWidth <= 0) return distanceToSeam <= CONE_SEAM_ZERO_WIDTH_EPSILON ? 1 : 0;
  const normalizedDistance = clampUnit(distanceToSeam / safeBlendWidth);
  return 0.5 * (1 + Math.cos(Math.PI * normalizedDistance));
}

/** Applies an RGB edge-color delta without using edge alpha as a blend weight. */
export function reapplyConeSeamColor(
  center: ConeRgba,
  sideEdge: ConeRgba,
  edgeA: ConeRgba,
  edgeB: ConeRgba,
  weight: number,
): [number, number, number, number] {
  const target = [
    0.5 * (edgeA[0] + edgeB[0]),
    0.5 * (edgeA[1] + edgeB[1]),
    0.5 * (edgeA[2] + edgeB[2]),
  ] as const;
  return applyConeRgbDelta(center, sideEdge, target, weight);
}

/** Pulls a corner sample toward the average RGB of all four texture corners. */
export function reapplyConeCornerColor(
  color: ConeRgba,
  corner00: ConeRgba,
  corner10: ConeRgba,
  corner01: ConeRgba,
  corner11: ConeRgba,
  weight: number,
): [number, number, number, number] {
  const target = [
    0.25 * (corner00[0] + corner10[0] + corner01[0] + corner11[0]),
    0.25 * (corner00[1] + corner10[1] + corner01[1] + corner11[1]),
    0.25 * (corner00[2] + corner10[2] + corner01[2] + corner11[2]),
  ] as const;
  return applyConeRgbDelta(color, color, target, weight);
}

/** GLSL implementation kept beside the CPU reference for parity review and tests. */
export const CONE_GRADIENT_REAPPLY_SHADER = `
float coneRaisedCosineSeamWeight(float coordinate, float blendWidth) {
  float safeCoordinate = clamp(coordinate, 0.0, 1.0);
  float distanceToSeam = min(safeCoordinate, 1.0 - safeCoordinate);
  if (blendWidth <= 0.0) return distanceToSeam <= ${CONE_SEAM_ZERO_WIDTH_EPSILON} ? 1.0 : 0.0;
  float normalizedDistance = clamp(distanceToSeam / blendWidth, 0.0, 1.0);
  return 0.5 * (1.0 + cos(3.141592653589793 * normalizedDistance));
}

vec3 coneApplyRgbDelta(vec3 center, vec3 sideEdge, vec3 target, float weight) {
  return clamp(center + (target - sideEdge) * clamp(weight, 0.0, 1.0), 0.0, 1.0);
}

vec3 coneReapplyRgb(vec3 center, vec3 sideEdge, vec3 edgeA, vec3 edgeB, float weight) {
  return coneApplyRgbDelta(center, sideEdge, 0.5 * (edgeA + edgeB), weight);
}

vec4 coneGradientReapplySample(vec2 uv, float blendWidth) {
  vec4 center = texture2D(map, uv);
  float seamX = coneRaisedCosineSeamWeight(uv.x, blendWidth);
  float seamY = coneRaisedCosineSeamWeight(uv.y, blendWidth);
  vec3 color = center.rgb;
  if (seamX > 0.0) {
    vec3 edgeX0 = texture2D(map, vec2(0.0, uv.y)).rgb;
    vec3 edgeX1 = texture2D(map, vec2(1.0, uv.y)).rgb;
    vec3 sideEdgeX = uv.x <= 0.5 ? edgeX0 : edgeX1;
    color = coneReapplyRgb(color, sideEdgeX, edgeX0, edgeX1, seamX);
  }
  if (seamY > 0.0) {
    vec3 edgeY0 = texture2D(map, vec2(uv.x, 0.0)).rgb;
    vec3 edgeY1 = texture2D(map, vec2(uv.x, 1.0)).rgb;
    vec3 sideEdgeY = uv.y <= 0.5 ? edgeY0 : edgeY1;
    color = coneReapplyRgb(color, sideEdgeY, edgeY0, edgeY1, seamY);
  }
  if (seamX > 0.0 && seamY > 0.0) {
    vec3 corner00 = texture2D(map, vec2(0.0, 0.0)).rgb;
    vec3 corner10 = texture2D(map, vec2(1.0, 0.0)).rgb;
    vec3 corner01 = texture2D(map, vec2(0.0, 1.0)).rgb;
    vec3 corner11 = texture2D(map, vec2(1.0, 1.0)).rgb;
    vec3 cornerTarget = 0.25 * (
      corner00 + corner10 + corner01 + corner11
    );
    color = coneApplyRgbDelta(color, color, cornerTarget, seamX * seamY);
  }
  return vec4(color, center.a);
}
`;
