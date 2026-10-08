import {
  clampParameter,
  getEnumParameterDefault,
  getEnumParameterLimit,
  getParameterDefault,
  getParameterLimit,
  normalizeEnumParameter,
  type ParameterLimitKey,
} from '../lib/parameterLimits';

/**
 * Distort Chroma: a Main Stack layer that refracts the previous layers' result
 * along the luminance gradient of a Lens image and disperses the colours by
 * sampling several spectrum positions with different displacement amounts.
 */
export type DistortChromaLensSource = 'source' | 'image';

/** Outside-the-canvas handling for displaced samples. */
export type DistortChromaWrap = 'clamp' | 'repeat' | 'mirror';

export const DISTORT_CHROMA_LENS_SOURCES = getEnumParameterLimit('distortChroma.lensSource').values as readonly DistortChromaLensSource[];
export const DISTORT_CHROMA_WRAPS = getEnumParameterLimit('distortChroma.wrap').values as readonly DistortChromaWrap[];

export type DistortChromaConfig = {
  enabled: boolean;
  /** `source` uses the layer's own input as the Lens; `image` uses a session-only loaded image. */
  lensSource: DistortChromaLensSource;
  wrap: DistortChromaWrap;
  /** Maximum displacement in canvas pixels. Negative values reverse the direction. */
  amountX: number;
  amountY: number;
  /** Displacement multiplier at the red / blue end of the spectrum. */
  warpRed: number;
  warpBlue: number;
  /** Spectrum samples per pixel. Cost grows linearly with it. */
  steps: number;
  /** Sensitivity to the Lens slope. */
  bump: number;
  /** Rotation of the displacement direction in degrees. */
  rotate: number;
  /** Gaussian sigma in pixels applied to the Lens before measuring its slope. */
  lensBlur: number;
  /** Spectrum colours. Default red / green / blue. */
  color1: string;
  color2: string;
  color3: string;
  /** Normalise the three colours so that their sum is white. */
  whiteBalance: boolean;
};

type DistortChromaNumericKey = {
  [Key in keyof DistortChromaConfig]: DistortChromaConfig[Key] extends number ? Key : never
}[keyof DistortChromaConfig];

export const DISTORT_CHROMA_LIMIT_KEYS: Record<DistortChromaNumericKey, ParameterLimitKey> = {
  amountX: 'distortChroma.amountX',
  amountY: 'distortChroma.amountY',
  warpRed: 'distortChroma.warpRed',
  warpBlue: 'distortChroma.warpBlue',
  steps: 'distortChroma.steps',
  bump: 'distortChroma.bump',
  rotate: 'distortChroma.rotate',
  lensBlur: 'distortChroma.lensBlur',
};

const DISTORT_CHROMA_NUMERIC_KEYS = Object.keys(DISTORT_CHROMA_LIMIT_KEYS) as DistortChromaNumericKey[];

export const DISTORT_CHROMA_COLOR_KEYS = ['color1', 'color2', 'color3'] as const;

export const DEFAULT_DISTORT_CHROMA: DistortChromaConfig = {
  enabled: false,
  lensSource: getEnumParameterDefault('distortChroma.lensSource'),
  wrap: getEnumParameterDefault('distortChroma.wrap'),
  amountX: getParameterDefault('distortChroma.amountX'),
  amountY: getParameterDefault('distortChroma.amountY'),
  warpRed: getParameterDefault('distortChroma.warpRed'),
  warpBlue: getParameterDefault('distortChroma.warpBlue'),
  steps: getParameterDefault('distortChroma.steps'),
  bump: getParameterDefault('distortChroma.bump'),
  rotate: getParameterDefault('distortChroma.rotate'),
  lensBlur: getParameterDefault('distortChroma.lensBlur'),
  color1: '#FF0000',
  color2: '#00FF00',
  color3: '#0000FF',
  whiteBalance: true,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value.toUpperCase() : fallback;
}

export function normalizeDistortChromaConfig(value: unknown): DistortChromaConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof DistortChromaConfig, unknown>>
    : {};
  const config: DistortChromaConfig = {
    ...DEFAULT_DISTORT_CHROMA,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_DISTORT_CHROMA.enabled,
    lensSource: normalizeEnumParameter('distortChroma.lensSource', raw.lensSource),
    wrap: normalizeEnumParameter('distortChroma.wrap', raw.wrap),
    color1: normalizeColor(raw.color1, DEFAULT_DISTORT_CHROMA.color1),
    color2: normalizeColor(raw.color2, DEFAULT_DISTORT_CHROMA.color2),
    color3: normalizeColor(raw.color3, DEFAULT_DISTORT_CHROMA.color3),
    whiteBalance: typeof raw.whiteBalance === 'boolean' ? raw.whiteBalance : DEFAULT_DISTORT_CHROMA.whiteBalance,
  };
  for (const key of DISTORT_CHROMA_NUMERIC_KEYS) {
    config[key] = clampParameter(raw[key], DEFAULT_DISTORT_CHROMA[key], getParameterLimit(DISTORT_CHROMA_LIMIT_KEYS[key]));
  }
  return config;
}

/**
 * Spectrum colour at position `t` (0 = red end, 1 = blue end), as the three
 * triangular weights blended over Color1 / Color2 / Color3.
 *
 * Each colour's weight is divided by its sum over all `steps` samples, so the
 * accumulated result of an undisplaced image is `Color1 + Color2 + Color3`
 * regardless of the step count. This is the CPU reference for the shader.
 */
export function getDistortChromaSpectrumWeights(t: number, steps: number): [number, number, number] {
  const count = Math.max(2, Math.round(steps));
  const weight = (u: number): [number, number, number] => [
    Math.max(1 - 2 * u, 0),
    1 - Math.abs(2 * u - 1),
    Math.max(2 * u - 1, 0),
  ];
  const totals: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < count; i += 1) {
    const w = weight(i / (count - 1));
    totals[0] += w[0];
    totals[1] += w[1];
    totals[2] += w[2];
  }
  const w = weight(t);
  return [
    w[0] / Math.max(totals[0], 1e-4),
    w[1] / Math.max(totals[1], 1e-4),
    w[2] / Math.max(totals[2], 1e-4),
  ];
}

function hexToUnitRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/**
 * The three spectrum colours as linear-light multipliers in 0..1.
 *
 * With White Balance on, each channel is divided by the sum of the three
 * colours, so the colours always add up to white and an undisplaced pixel
 * keeps its original colour. Off, the colours are used as they are, which
 * tints or dims the result when they do not add up to white.
 */
export function resolveDistortChromaColors(
  config: Pick<DistortChromaConfig, 'color1' | 'color2' | 'color3' | 'whiteBalance'>,
): [[number, number, number], [number, number, number], [number, number, number]] {
  const colors = [config.color1, config.color2, config.color3].map(hexToUnitRgb) as [
    [number, number, number], [number, number, number], [number, number, number],
  ];
  if (!config.whiteBalance) return colors;
  const inverse = [0, 1, 2].map(channel => {
    const sum = colors[0][channel] + colors[1][channel] + colors[2][channel];
    return sum > 1e-4 ? 1 / sum : 0;
  });
  return colors.map(color => color.map((value, channel) => value * inverse[channel])) as typeof colors;
}
