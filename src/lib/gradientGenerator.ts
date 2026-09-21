import type { ColorStop } from '../types/gradient';
import { clamp, hexToOklch } from './colorSpace';
import { generateCubehelixGradient, type CubehelixParams } from './cubehelix';
import {
  generatePerceptualGradient,
  type PerceptualGradientFamily,
  type PerceptualGradientParams,
} from './perceptualGradient';

export type GradientGeneratorAlgorithm = 'cubehelix' | 'perceptual';

/** User-facing controls. Algorithm-specific values are derived below. */
export type GradientGeneratorUiParams = {
  algorithm: GradientGeneratorAlgorithm;
  baseColor: string;
  colorIntensity: number;
  brightness: number;
  contrast: number;
  family: PerceptualGradientFamily;
  accentPosition: number;
  accentWidth: number;
  stopCount: number;
};

// Preserve the generator's original colorful default without a separate
// Hue Travel control.
const DEFAULT_HUE_TRAVEL = 0.5;

function safeStopCount(value: number): number {
  return Math.round(clamp(value, 3, 10, 5));
}

function baseHueFromColor(baseColor: string): number {
  const hue = hexToOklch(baseColor).H;
  return Number.isFinite(hue) ? hue : 0;
}

export function mapUiToCubehelix(params: GradientGeneratorUiParams): CubehelixParams {
  const brightness = clamp(params.brightness, 0, 1, 0.5);
  const contrast = clamp(params.contrast, 0, 1, 0.5);
  const intensity = clamp(params.colorIntensity, 0, 1, 0.5);
  const center = 0.15 + brightness * 0.7;
  const span = 0.34 + contrast * 0.52;
  const lightnessStart = clamp(center - span / 2, 0.04, 0.82, 0.08);
  const lightnessEnd = Math.max(
    lightnessStart + 0.08,
    clamp(center + span / 2, 0.18, 0.96, 0.92),
  );
  return {
    startHue: baseHueFromColor(params.baseColor),
    rotations: DEFAULT_HUE_TRAVEL * 1.75,
    hue: 0.12 + intensity * 0.78,
    gamma: 0.78 + (1 - brightness) * 0.44,
    lightnessStart,
    lightnessEnd: Math.min(0.98, lightnessEnd),
    stopCount: safeStopCount(params.stopCount),
  };
}

export function mapUiToPerceptual(params: GradientGeneratorUiParams): PerceptualGradientParams {
  return {
    family: params.family,
    baseHue: baseHueFromColor(params.baseColor),
    hueTravel: DEFAULT_HUE_TRAVEL * 360,
    brightness: clamp(params.brightness, 0, 1, 0.5),
    contrast: clamp(params.contrast, 0, 1, 0.5),
    chroma: clamp(params.colorIntensity, 0, 1, 0.5),
    accentPosition: clamp(params.accentPosition, 0, 1, 0.5),
    accentWidth: clamp(params.accentWidth, 0.04, 0.5, 0.2),
    stopCount: safeStopCount(params.stopCount),
    sampleCount: 128,
    equalization: 0.72,
  };
}

export function generateGradientFromUi(params: GradientGeneratorUiParams): ColorStop[] {
  return params.algorithm === 'cubehelix'
    ? generateCubehelixGradient(mapUiToCubehelix(params))
    : generatePerceptualGradient(mapUiToPerceptual(params));
}
