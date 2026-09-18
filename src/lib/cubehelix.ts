import type { ColorStop } from '../types/gradient';
import { clamp, clamp01, rgb01ToHex, type Rgb01, wrapHue } from './colorSpace';

/** Dave Green's original Cubehelix parameters, plus safe endpoint controls. */
export type CubehelixParams = {
  /** Start hue in degrees. The original START parameter is startHue / 120. */
  startHue: number;
  /** Signed R → G → B rotations. */
  rotations: number;
  /** Original HUE/saturation amplitude. */
  hue: number;
  /** Original gamma correction factor. */
  gamma: number;
  /** Safe lightness range applied to the original 0 → 1 trajectory. */
  lightnessStart: number;
  lightnessEnd: number;
  stopCount?: number;
};

const CUBEHELIX_COEFFICIENTS = {
  red: [-0.14861, 1.78277],
  green: [-0.29227, -0.90649],
  blue: [1.97294, 0],
} as const;

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function safeStopCount(value: number | undefined): number {
  return Math.round(clamp(value ?? 5, 3, 10, 5));
}

function safeParams(params: CubehelixParams): Required<CubehelixParams> {
  const lightnessStart = clamp(params.lightnessStart, 0, 1, 0.05);
  const lightnessEnd = clamp(params.lightnessEnd, 0, 1, 0.95);
  return {
    startHue: wrapHue(finite(params.startHue, 240)),
    rotations: clamp(params.rotations, -8, 8, 1),
    hue: clamp(params.hue, 0, 2, 0.7),
    gamma: clamp(params.gamma, 0.05, 8, 1),
    lightnessStart,
    lightnessEnd,
    stopCount: safeStopCount(params.stopCount),
  };
}

/**
 * Evaluate the original Cubehelix formula at t ∈ [0, 1].
 *
 * The phase uses the un-gamma-corrected fraction, exactly as Green's public
 * Fortran reference does. Gamma affects the intensity fraction and the
 * tapered amplitude, while the optional endpoints safely scale the resulting
 * black→white trajectory without replacing the Cubehelix path with OKLCH.
 */
export function cubehelixAt(t: number, params: CubehelixParams): Rgb01 {
  const safe = safeParams(params);
  return evaluateCubehelix(clamp01(t), safe);
}

function evaluateCubehelix(position: number, safe: Required<CubehelixParams>): Rgb01 {
  const angle = 2 * Math.PI * (safe.startHue / 360 + 1 + safe.rotations * position);
  const fraction = position ** safe.gamma;
  const amplitude = safe.hue * fraction * (1 - fraction) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const red = fraction + amplitude * (CUBEHELIX_COEFFICIENTS.red[0] * cos + CUBEHELIX_COEFFICIENTS.red[1] * sin);
  const green = fraction + amplitude * (CUBEHELIX_COEFFICIENTS.green[0] * cos + CUBEHELIX_COEFFICIENTS.green[1] * sin);
  const blue = fraction + amplitude * (CUBEHELIX_COEFFICIENTS.blue[0] * cos + CUBEHELIX_COEFFICIENTS.blue[1] * sin);
  const scale = safe.lightnessEnd - safe.lightnessStart;
  return {
    r: clamp01(safe.lightnessStart + scale * red),
    g: clamp01(safe.lightnessStart + scale * green),
    b: clamp01(safe.lightnessStart + scale * blue),
  };
}

export function generateCubehelixGradient(params: CubehelixParams): ColorStop[] {
  const safe = safeParams(params);
  return Array.from({ length: safe.stopCount }, (_, index) => {
    const position = index / (safe.stopCount - 1);
    return { position, color: rgb01ToHex(evaluateCubehelix(position, safe)) };
  });
}
