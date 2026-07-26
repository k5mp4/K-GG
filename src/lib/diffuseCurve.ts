import type { DiffuseBezierValue, DiffuseCurvePoint } from '../types/distortion';

export const IDENTITY_DIFFUSE_BEZIER: DiffuseBezierValue = [1 / 3, 1 / 3, 2 / 3, 2 / 3];
export const LEGACY_DIFFUSE_CURVE_SAMPLE_COUNT = 65;

export const DIFFUSE_CURVE_ENDPOINTS: readonly [DiffuseCurvePoint, DiffuseCurvePoint] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];

export const DIFFUSE_CURVE_MAX_POINTS = 16;

export type DiffuseCurveBezierSegment = {
  left: DiffuseCurvePoint;
  right: DiffuseCurvePoint;
  leftControl: DiffuseCurvePoint;
  rightControl: DiffuseCurvePoint;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function normalizeDiffuseBezier(value: unknown): DiffuseBezierValue {
  if (!Array.isArray(value) || value.length !== 4) return [...IDENTITY_DIFFUSE_BEZIER];
  return value.map((entry, index) => (
    Number.isFinite(entry) ? clamp01(Number(entry)) : IDENTITY_DIFFUSE_BEZIER[index]
  )) as DiffuseBezierValue;
}

export function normalizeDiffuseCurve(value: unknown): DiffuseCurvePoint[] {
  const input = Array.isArray(value) ? value : [];
  const middle = input
    .filter((point): point is DiffuseCurvePoint => (
      typeof point === 'object'
      && point !== null
      && Number.isFinite((point as DiffuseCurvePoint).x)
      && Number.isFinite((point as DiffuseCurvePoint).y)
    ))
    .map(point => ({ x: clamp01(point.x), y: clamp01(point.y) }))
    .filter(point => point.x > 0 && point.x < 1)
    .sort((a, b) => a.x - b.x)
    .filter((point, index, points) => index === 0 || Math.abs(point.x - points[index - 1].x) > 1e-4)
    .slice(0, DIFFUSE_CURVE_MAX_POINTS - 2);

  return [DIFFUSE_CURVE_ENDPOINTS[0], ...middle, DIFFUSE_CURVE_ENDPOINTS[1]];
}

export function diffuseCurveValue(curve: readonly DiffuseCurvePoint[], input: number): number {
  const points = normalizeDiffuseCurve(curve);
  const x = clamp01(input);
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;
  const tangents = monotoneTangents(points);
  for (let index = 1; index < points.length; index += 1) {
    const right = points[index];
    const left = points[index - 1];
    if (x > right.x) continue;
    const width = Math.max(right.x - left.x, 1e-6);
    const t = (x - left.x) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return clamp01(
      h00 * left.y
      + h10 * width * tangents[index - 1]
      + h01 * right.y
      + h11 * width * tangents[index],
    );
  }
  return points[points.length - 1].y;
}

function cubicCoordinate(t: number, p1: number, p2: number): number {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * p1 + 3 * inverse * t * t * p2 + t * t * t;
}

/** Evaluate a CSS-style cubic Bezier by solving x(t) and evaluating y(t). */
export function diffuseBezierValue(value: unknown, input: number): number {
  const [x1, y1, x2, y2] = normalizeDiffuseBezier(value);
  const x = clamp01(input);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (cubicCoordinate(middle, x1, x2) < x) low = middle;
    else high = middle;
  }
  return clamp01(cubicCoordinate((low + high) / 2, y1, y2));
}

/**
 * Convert the legacy monotone multi-point interpolation to one cubic Bezier.
 * With x1=1/3 and x2=2/3, x(t)=t, so y1/y2 form a two-variable linear
 * least-squares problem over 65 uniformly sampled legacy values.
 */
export function migrateLegacyDiffuseCurve(value: unknown): DiffuseBezierValue {
  const curve = normalizeDiffuseCurve(value);
  if (curve.length < 2) return [...IDENTITY_DIFFUSE_BEZIER];

  let aa = 0;
  let ab = 0;
  let bb = 0;
  let ar = 0;
  let br = 0;
  for (let index = 0; index < LEGACY_DIFFUSE_CURVE_SAMPLE_COUNT; index += 1) {
    const t = index / (LEGACY_DIFFUSE_CURVE_SAMPLE_COUNT - 1);
    const inverse = 1 - t;
    const basis1 = 3 * inverse * inverse * t;
    const basis2 = 3 * inverse * t * t;
    const target = diffuseCurveValue(curve, t) - t * t * t;
    aa += basis1 * basis1;
    ab += basis1 * basis2;
    bb += basis2 * basis2;
    ar += basis1 * target;
    br += basis2 * target;
  }
  const determinant = aa * bb - ab * ab;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    return [...IDENTITY_DIFFUSE_BEZIER];
  }
  const y1 = (ar * bb - br * ab) / determinant;
  const y2 = (br * aa - ar * ab) / determinant;
  return normalizeDiffuseBezier([1 / 3, y1, 2 / 3, y2]);
}

export function resolveDiffuseBezier(bezier: unknown, legacyCurve?: unknown): DiffuseBezierValue {
  return Array.isArray(bezier) && bezier.length === 4
    ? normalizeDiffuseBezier(bezier)
    : Array.isArray(legacyCurve)
      ? migrateLegacyDiffuseCurve(legacyCurve)
      : [...IDENTITY_DIFFUSE_BEZIER];
}

/**
 * Returns monotone cubic-Bezier handles for the same curve used by the LUT.
 * Keeping this in the shared curve module prevents the editor and WebGL from
 * showing different interpolation than the rendered output.
 */
export function diffuseCurveBezierSegments(
  curve: readonly DiffuseCurvePoint[],
): DiffuseCurveBezierSegment[] {
  const points = normalizeDiffuseCurve(curve);
  const tangents = monotoneTangents(points);
  return points.slice(1).map((right, index) => {
    const left = points[index];
    const width = right.x - left.x;
    return {
      left,
      right,
      leftControl: {
        x: left.x + width / 3,
        y: clamp01(left.y + tangents[index] * width / 3),
      },
      rightControl: {
        x: left.x + width * 2 / 3,
        y: clamp01(Math.abs(tangents[index + 1] - (right.y - left.y) / width) < 1e-12
          ? left.y + (right.y - left.y) * 2 / 3
          : right.y - tangents[index + 1] * width / 3),
      },
    };
  });
}

function monotoneTangents(points: readonly DiffuseCurvePoint[]): number[] {
  if (points.length < 2) return [0];
  const slopes = points.slice(1).map((right, index) => {
    const width = Math.max(right.x - points[index].x, 1e-6);
    return (right.y - points[index].y) / width;
  });
  const tangents = new Array<number>(points.length).fill(0);
  tangents[0] = slopes[0];
  tangents[tangents.length - 1] = slopes[slopes.length - 1];
  for (let index = 1; index < tangents.length - 1; index += 1) {
    const previous = slopes[index - 1];
    const next = slopes[index];
    tangents[index] = previous * next <= 0 ? 0 : (previous + next) / 2;
  }

  // Hyman's monotonicity filter prevents the cubic handles from overshooting
  // a neighboring control point while retaining smooth transitions.
  slopes.forEach((slope, index) => {
    if (Math.abs(slope) < 1e-6) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      return;
    }
    const a = tangents[index] / slope;
    const b = tangents[index + 1] / slope;
    const magnitude = Math.hypot(a, b);
    if (magnitude > 3) {
      const scale = 3 / magnitude;
      tangents[index] = scale * a * slope;
      tangents[index + 1] = scale * b * slope;
    }
  });
  return tangents;
}

export function buildDiffuseCurveLut(curve: readonly DiffuseCurvePoint[], size = 256): Uint8Array {
  const safeSize = Math.max(2, Math.round(size));
  const lut = new Uint8Array(safeSize);
  for (let index = 0; index < safeSize; index += 1) {
    lut[index] = Math.round(diffuseCurveValue(curve, index / (safeSize - 1)) * 255);
  }
  return lut;
}

export function buildDiffuseBezierLut(value: unknown, size = 256): Uint8Array {
  const safeSize = Math.max(2, Math.round(size));
  const lut = new Uint8Array(safeSize);
  for (let index = 0; index < safeSize; index += 1) {
    lut[index] = Math.round(diffuseBezierValue(value, index / (safeSize - 1)) * 255);
  }
  return lut;
}
