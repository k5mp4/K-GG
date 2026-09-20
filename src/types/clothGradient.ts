import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export type ClothGradientQuality = 'low' | 'medium' | 'high';

export type ClothGradientConfig = {
  enabled: boolean;
  /** アニメーションON時に t=0 と t=duration で波形が一致するシームレスループ */
  loopEnabled: boolean;

  amplitude1: number;
  amplitude2: number;
  frequency1: number;
  frequency2: number;
  speed1: number;
  speed2: number;
  direction1: [number, number];
  direction2: [number, number];
  normalStrength: number;

  warpStrength: number;
  noiseScale: number;
  noiseAmplitude: number;
  noiseSpeed: number;

  ambientIntensity: number;
  lightIntensity: number;
  lightAzimuth: number;
  lightElevation: number;
  skyLightColor: string;
  groundLightColor: string;

  specularStrength: number;
  specularPower: number;
  specularColor: string;

  fresnelPower: number;
  fresnelColor: string;
  fresnelColorStrength: number;

  rampOffset: number;

  quality: ClothGradientQuality;
};

export const DEFAULT_CLOTH_GRADIENT: ClothGradientConfig = {
  enabled: false,
  loopEnabled: false,

  amplitude1: getParameterDefault('cloth.amplitude1'),
  amplitude2: getParameterDefault('cloth.amplitude2'),
  frequency1: getParameterDefault('cloth.frequency1'),
  frequency2: getParameterDefault('cloth.frequency2'),
  speed1: getParameterDefault('cloth.speed1'),
  speed2: getParameterDefault('cloth.speed2'),
  direction1: [1.0, 0.5],
  direction2: [-0.6, 0.8],
  normalStrength: getParameterDefault('cloth.normalStrength'),

  warpStrength: getParameterDefault('cloth.warpStrength'),
  noiseScale: getParameterDefault('cloth.noiseScale'),
  noiseAmplitude: getParameterDefault('cloth.noiseAmplitude'),
  noiseSpeed: getParameterDefault('cloth.noiseSpeed'),

  ambientIntensity: getParameterDefault('cloth.ambientIntensity'),
  lightIntensity: getParameterDefault('cloth.lightIntensity'),
  lightAzimuth: getParameterDefault('cloth.lightAzimuth'),
  lightElevation: getParameterDefault('cloth.lightElevation'),
  skyLightColor: '#e0e7ff',
  groundLightColor: '#1e1b4b',

  specularStrength: getParameterDefault('cloth.specularStrength'),
  specularPower: getParameterDefault('cloth.specularPower'),
  specularColor: '#ffffff',

  fresnelPower: getParameterDefault('cloth.fresnelPower'),
  fresnelColor: '#ffffff',
  fresnelColorStrength: getParameterDefault('cloth.fresnelColorStrength'),

  rampOffset: getParameterDefault('cloth.rampOffset'),

  quality: 'medium',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sanitizeNumber(val: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return clamp(val, min, max);
}

function sanitizeHexColor(color: unknown, fallback: string): string {
  if (typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

function sanitizeDirection(dir: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(dir) || dir.length < 2) return fallback;
  const x = sanitizeNumber(dir[0], fallback[0], -10, 10);
  const y = sanitizeNumber(dir[1], fallback[1], -10, 10);
  const len = Math.hypot(x, y);
  if (len < 1e-5) return fallback;
  return [x / len, y / len];
}

export function normalizeClothGradientConfig(value: unknown): ClothGradientConfig {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_CLOTH_GRADIENT };
  }

  const raw = value as Partial<ClothGradientConfig>;

  const quality: ClothGradientQuality =
    raw.quality === 'low' || raw.quality === 'medium' || raw.quality === 'high'
      ? raw.quality
      : DEFAULT_CLOTH_GRADIENT.quality;

  return {
    enabled: Boolean(raw.enabled),
    loopEnabled: Boolean(raw.loopEnabled),

    amplitude1: clampParameter(raw.amplitude1, DEFAULT_CLOTH_GRADIENT.amplitude1, getParameterLimit('cloth.amplitude1')),
    amplitude2: clampParameter(raw.amplitude2, DEFAULT_CLOTH_GRADIENT.amplitude2, getParameterLimit('cloth.amplitude2')),
    frequency1: clampParameter(raw.frequency1, DEFAULT_CLOTH_GRADIENT.frequency1, getParameterLimit('cloth.frequency1')),
    frequency2: clampParameter(raw.frequency2, DEFAULT_CLOTH_GRADIENT.frequency2, getParameterLimit('cloth.frequency2')),
    speed1: clampParameter(raw.speed1, DEFAULT_CLOTH_GRADIENT.speed1, getParameterLimit('cloth.speed1')),
    speed2: clampParameter(raw.speed2, DEFAULT_CLOTH_GRADIENT.speed2, getParameterLimit('cloth.speed2')),
    direction1: sanitizeDirection(raw.direction1, DEFAULT_CLOTH_GRADIENT.direction1),
    direction2: sanitizeDirection(raw.direction2, DEFAULT_CLOTH_GRADIENT.direction2),
    normalStrength: clampParameter(raw.normalStrength, DEFAULT_CLOTH_GRADIENT.normalStrength, getParameterLimit('cloth.normalStrength')),

    warpStrength: clampParameter(raw.warpStrength, DEFAULT_CLOTH_GRADIENT.warpStrength, getParameterLimit('cloth.warpStrength')),
    noiseScale: clampParameter(raw.noiseScale, DEFAULT_CLOTH_GRADIENT.noiseScale, getParameterLimit('cloth.noiseScale')),
    noiseAmplitude: clampParameter(raw.noiseAmplitude, DEFAULT_CLOTH_GRADIENT.noiseAmplitude, getParameterLimit('cloth.noiseAmplitude')),
    noiseSpeed: clampParameter(raw.noiseSpeed, DEFAULT_CLOTH_GRADIENT.noiseSpeed, getParameterLimit('cloth.noiseSpeed')),

    ambientIntensity: clampParameter(raw.ambientIntensity, DEFAULT_CLOTH_GRADIENT.ambientIntensity, getParameterLimit('cloth.ambientIntensity')),
    lightIntensity: clampParameter(raw.lightIntensity, DEFAULT_CLOTH_GRADIENT.lightIntensity, getParameterLimit('cloth.lightIntensity')),
    lightAzimuth: clampParameter(raw.lightAzimuth, DEFAULT_CLOTH_GRADIENT.lightAzimuth, getParameterLimit('cloth.lightAzimuth')),
    lightElevation: clampParameter(raw.lightElevation, DEFAULT_CLOTH_GRADIENT.lightElevation, getParameterLimit('cloth.lightElevation')),
    skyLightColor: sanitizeHexColor(raw.skyLightColor, DEFAULT_CLOTH_GRADIENT.skyLightColor),
    groundLightColor: sanitizeHexColor(raw.groundLightColor, DEFAULT_CLOTH_GRADIENT.groundLightColor),

    specularStrength: clampParameter(raw.specularStrength, DEFAULT_CLOTH_GRADIENT.specularStrength, getParameterLimit('cloth.specularStrength')),
    specularPower: clampParameter(raw.specularPower, DEFAULT_CLOTH_GRADIENT.specularPower, getParameterLimit('cloth.specularPower')),
    specularColor: sanitizeHexColor(raw.specularColor, DEFAULT_CLOTH_GRADIENT.specularColor),

    fresnelPower: clampParameter(raw.fresnelPower, DEFAULT_CLOTH_GRADIENT.fresnelPower, getParameterLimit('cloth.fresnelPower')),
    fresnelColor: sanitizeHexColor(raw.fresnelColor, DEFAULT_CLOTH_GRADIENT.fresnelColor),
    fresnelColorStrength: clampParameter(raw.fresnelColorStrength, DEFAULT_CLOTH_GRADIENT.fresnelColorStrength, getParameterLimit('cloth.fresnelColorStrength')),

    rampOffset: clampParameter(raw.rampOffset, DEFAULT_CLOTH_GRADIENT.rampOffset, getParameterLimit('cloth.rampOffset')),

    quality,
  };
}
