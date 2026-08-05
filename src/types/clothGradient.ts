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

  amplitude1: 0.4,
  amplitude2: 0.25,
  frequency1: 1.5,
  frequency2: 2.2,
  speed1: 0.8,
  speed2: 1.2,
  direction1: [1.0, 0.5],
  direction2: [-0.6, 0.8],
  normalStrength: 1.2,

  warpStrength: 0.35,
  noiseScale: 2.5,
  noiseAmplitude: 0.15,
  noiseSpeed: 0.5,

  ambientIntensity: 0.25,
  lightIntensity: 1.8,
  lightAzimuth: 45,
  lightElevation: 60,
  skyLightColor: '#e0e7ff',
  groundLightColor: '#1e1b4b',

  specularStrength: 0.8,
  specularPower: 32.0,
  specularColor: '#ffffff',

  fresnelPower: 3.0,
  fresnelColor: '#ffffff',
  fresnelColorStrength: 0.4,

  rampOffset: 0.0,

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

    amplitude1: sanitizeNumber(raw.amplitude1, DEFAULT_CLOTH_GRADIENT.amplitude1, 0, 3),
    amplitude2: sanitizeNumber(raw.amplitude2, DEFAULT_CLOTH_GRADIENT.amplitude2, 0, 3),
    frequency1: sanitizeNumber(raw.frequency1, DEFAULT_CLOTH_GRADIENT.frequency1, 0.01, 20),
    frequency2: sanitizeNumber(raw.frequency2, DEFAULT_CLOTH_GRADIENT.frequency2, 0.01, 20),
    speed1: sanitizeNumber(raw.speed1, DEFAULT_CLOTH_GRADIENT.speed1, -10, 10),
    speed2: sanitizeNumber(raw.speed2, DEFAULT_CLOTH_GRADIENT.speed2, -10, 10),
    direction1: sanitizeDirection(raw.direction1, DEFAULT_CLOTH_GRADIENT.direction1),
    direction2: sanitizeDirection(raw.direction2, DEFAULT_CLOTH_GRADIENT.direction2),
    normalStrength: sanitizeNumber(raw.normalStrength, DEFAULT_CLOTH_GRADIENT.normalStrength, 0, 5),

    warpStrength: sanitizeNumber(raw.warpStrength, DEFAULT_CLOTH_GRADIENT.warpStrength, 0, 3),
    noiseScale: sanitizeNumber(raw.noiseScale, DEFAULT_CLOTH_GRADIENT.noiseScale, 0.01, 20),
    noiseAmplitude: sanitizeNumber(raw.noiseAmplitude, DEFAULT_CLOTH_GRADIENT.noiseAmplitude, 0, 3),
    noiseSpeed: sanitizeNumber(raw.noiseSpeed, DEFAULT_CLOTH_GRADIENT.noiseSpeed, -10, 10),

    ambientIntensity: sanitizeNumber(raw.ambientIntensity, DEFAULT_CLOTH_GRADIENT.ambientIntensity, 0, 5),
    lightIntensity: sanitizeNumber(raw.lightIntensity, DEFAULT_CLOTH_GRADIENT.lightIntensity, 0, 10),
    lightAzimuth: sanitizeNumber(raw.lightAzimuth, DEFAULT_CLOTH_GRADIENT.lightAzimuth, -360, 360),
    lightElevation: sanitizeNumber(raw.lightElevation, DEFAULT_CLOTH_GRADIENT.lightElevation, -90, 90),
    skyLightColor: sanitizeHexColor(raw.skyLightColor, DEFAULT_CLOTH_GRADIENT.skyLightColor),
    groundLightColor: sanitizeHexColor(raw.groundLightColor, DEFAULT_CLOTH_GRADIENT.groundLightColor),

    specularStrength: sanitizeNumber(raw.specularStrength, DEFAULT_CLOTH_GRADIENT.specularStrength, 0, 5),
    specularPower: sanitizeNumber(raw.specularPower, DEFAULT_CLOTH_GRADIENT.specularPower, 1, 256),
    specularColor: sanitizeHexColor(raw.specularColor, DEFAULT_CLOTH_GRADIENT.specularColor),

    fresnelPower: sanitizeNumber(raw.fresnelPower, DEFAULT_CLOTH_GRADIENT.fresnelPower, 0.1, 32),
    fresnelColor: sanitizeHexColor(raw.fresnelColor, DEFAULT_CLOTH_GRADIENT.fresnelColor),
    fresnelColorStrength: sanitizeNumber(raw.fresnelColorStrength, DEFAULT_CLOTH_GRADIENT.fresnelColorStrength, 0, 5),

    rampOffset: sanitizeNumber(raw.rampOffset, DEFAULT_CLOTH_GRADIENT.rampOffset, -2, 2),

    quality,
  };
}
