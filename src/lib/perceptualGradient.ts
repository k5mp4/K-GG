import type { ColorStop } from '../types/gradient';
import {
  clamp,
  clamp01,
  getMaxChromaForOklch,
  isOklchInSrgbGamut,
  mapOklchToSrgb,
  oklabDistance,
  rgbToOklab,
  type Oklab,
  type Oklch,
} from './colorSpace';

export const PERCEPTUAL_GRADIENT_FAMILIES = ['sweep', 'soft', 'pastel', 'deep', 'accent'] as const;
export type PerceptualGradientFamily = (typeof PERCEPTUAL_GRADIENT_FAMILIES)[number];

export type PerceptualGradientParams = {
  family: PerceptualGradientFamily;
  baseHue: number;
  /** Hue travel in degrees; negative values are supported. */
  hueTravel: number;
  brightness: number;
  contrast: number;
  chroma: number;
  accentPosition: number;
  accentWidth: number;
  stopCount: number;
  sampleCount?: number;
  /** 0 keeps the original parameterization; 1 uses full arc-length resampling. */
  equalization?: number;
};

type TrajectorySample = {
  t: number;
  oklab: Oklab;
};

type TrajectoryPoint = {
  oklch: Oklch;
  maxChroma: number;
};

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function cubicEase(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function gaussian(value: number, center: number, width: number): number {
  const safeWidth = Math.max(0.04, width);
  const distance = (value - center) / safeWidth;
  return Math.exp(-0.5 * distance * distance);
}

function safeFamily(value: PerceptualGradientFamily): PerceptualGradientFamily {
  return PERCEPTUAL_GRADIENT_FAMILIES.includes(value) ? value : 'sweep';
}

function safeStopCount(value: number): number {
  return Math.round(clamp(value, 3, 10, 5));
}

function safeSampleCount(value: number | undefined): number {
  return Math.round(clamp(value ?? 128, 32, 256, 128));
}

function trajectoryAt(t: number, params: PerceptualGradientParams): TrajectoryPoint {
  const position = clamp01(t);
  const eased = cubicEase(position);
  const brightness = clamp(params.brightness, 0, 1, 0.5);
  const contrast = clamp(params.contrast, 0, 1, 0.5);
  const chroma = clamp(params.chroma, 0, 1, 0.5);
  const baseHue = finite(params.baseHue, 210);
  const hueTravel = clamp(params.hueTravel, -720, 720, 0);
  const accentPosition = clamp(params.accentPosition, 0, 1, 0.5);
  const accentWidth = clamp(params.accentWidth, 0.04, 0.5, 0.18);
  const centeredEase = eased * 2 - 1;

  let L: number;
  let hueScale: number;
  let chromaRatio: number;
  switch (safeFamily(params.family)) {
    case 'soft':
      L = 0.66 + brightness * 0.2 + centeredEase * (0.04 + contrast * 0.08);
      hueScale = 0.68;
      chromaRatio = 0.1 + chroma * 0.34;
      break;
    case 'pastel':
      L = 0.77 + brightness * 0.12 + centeredEase * (0.02 + contrast * 0.04);
      hueScale = 0.46;
      chromaRatio = 0.06 + chroma * 0.2;
      break;
    case 'deep':
      L = 0.16 + brightness * 0.28 + centeredEase * (0.04 + contrast * 0.1);
      hueScale = 0.86;
      chromaRatio = 0.22 + chroma * 0.5;
      break;
    case 'accent': {
      const peak = gaussian(position, accentPosition, accentWidth);
      L = 0.54 + brightness * 0.26 + centeredEase * (0.04 + contrast * 0.1);
      hueScale = 1;
      chromaRatio = 0.08 + peak * (0.18 + chroma * 0.62);
      break;
    }
    case 'sweep':
    default:
      L = 0.34 + brightness * 0.34 + centeredEase * (0.08 + contrast * 0.16);
      hueScale = 1;
      chromaRatio = 0.16 + chroma * 0.66;
      break;
  }

  const H = baseHue + hueTravel * hueScale * eased;
  const safeL = clamp(L, 0.06, 0.94, 0.5);
  const maxChroma = getMaxChromaForOklch(safeL, H);
  return {
    oklch: {
      L: safeL,
      C: maxChroma * clamp(chromaRatio, 0, 0.9, 0.2),
      H,
    },
    maxChroma,
  };
}

function sampleTrajectory(params: PerceptualGradientParams): TrajectorySample[] {
  const sampleCount = safeSampleCount(params.sampleCount);
  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    const trajectory = trajectoryAt(t, params);
    const mapped = mapOklchToSrgb(trajectory.oklch, trajectory.maxChroma);
    return {
      t,
      oklab: rgbToOklab(mapped.rgb),
    };
  });
}

function cumulativeArcLength(samples: TrajectorySample[]): number[] {
  const cumulative = [0];
  for (let index = 1; index < samples.length; index += 1) {
    cumulative.push(cumulative[index - 1] + oklabDistance(samples[index - 1].oklab, samples[index].oklab));
  }
  return cumulative;
}

function parameterAtArcLength(samples: TrajectorySample[], cumulative: number[], target: number): number {
  if (target <= 0 || cumulative[cumulative.length - 1] <= 1e-8) return 0;
  const total = cumulative[cumulative.length - 1];
  if (target >= total) return 1;
  for (let index = 1; index < cumulative.length; index += 1) {
    if (cumulative[index] < target) continue;
    const before = cumulative[index - 1];
    const span = cumulative[index] - before;
    const local = span <= 1e-8 ? 0 : (target - before) / span;
    return samples[index - 1].t + (samples[index].t - samples[index - 1].t) * local;
  }
  return 1;
}

/**
 * Generate a single continuous OKLCH trajectory and extract perceptually
 * spaced stops from it. Chroma is first bounded by the sRGB gamut at each
 * (L,H), then mapped again as a final numerical safety check.
 */
export function generatePerceptualGradient(params: PerceptualGradientParams): ColorStop[] {
  const safeParams = {
    ...params,
    stopCount: safeStopCount(params.stopCount),
    sampleCount: safeSampleCount(params.sampleCount),
    equalization: clamp(params.equalization ?? 0.72, 0, 1, 0.72),
  };
  const samples = sampleTrajectory(safeParams);
  const cumulative = cumulativeArcLength(samples);
  const total = cumulative[cumulative.length - 1];
  const familyBlend = safeParams.family === 'accent' ? 0.5 : 1;
  const equalization = safeParams.equalization * familyBlend;

  return Array.from({ length: safeParams.stopCount }, (_, index) => {
    const originalT = index / (safeParams.stopCount - 1);
    const target = total * originalT;
    const equalizedT = parameterAtArcLength(samples, cumulative, target);
    const sampleT = originalT + (equalizedT - originalT) * equalization;
    const trajectory = trajectoryAt(sampleT, safeParams);
    const mapped = mapOklchToSrgb(trajectory.oklch, trajectory.maxChroma);
    return { position: originalT, color: mapped.hex };
  });
}

export { isOklchInSrgbGamut, mapOklchToSrgb };
