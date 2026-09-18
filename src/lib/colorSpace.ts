/**
 * Small, dependency-free colour-space helpers used by the palette generators.
 *
 * The existing ramp interpolation implementation intentionally remains the
 * source of truth for rendering. These helpers are kept separate so adding a
 * gamut-aware generator cannot change an existing preset's rendered output.
 */

export type Rgb01 = { r: number; g: number; b: number };
export type Oklab = { L: number; a: number; b: number };
export type Oklch = { L: number; C: number; H: number };

const MAX_SEARCH_CHROMA = 0.5;
const MAX_CHROMA_CACHE = new Map<string, number>();

export function clamp(value: number, min: number, max: number, fallback = min): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1, 0);
}

export function wrapHue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function normalizeHex(value: string): string {
  const trimmed = value.trim().replace(/^#/, '');
  const expanded = trimmed.length === 3
    ? trimmed.split('').map((part) => `${part}${part}`).join('')
    : trimmed;
  return /^[0-9a-f]{6}$/i.test(expanded) ? expanded : '808080';
}

export function hexToRgb01(value: string): Rgb01 {
  const normalized = normalizeHex(value);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

export function rgb01ToHex({ r, g, b }: Rgb01): string {
  const channel = (value: number) => Math.round(clamp01(value) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function srgbToLinear(value: number): number {
  const c = clamp01(value);
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Signed inverse transfer function, useful while checking out-of-gamut RGB. */
function linearToSrgb(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const c = Math.abs(value);
  return sign * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
}

/** Convert a normalized sRGB colour to OKLab. */
export function rgbToOklab(color: Rgb01): Oklab {
  const lr = srgbToLinear(color.r);
  const lg = srgbToLinear(color.g);
  const lb = srgbToLinear(color.b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** Convert OKLab to normalized sRGB, clamping only at the public RGB boundary. */
export function oklabToRgb(color: Oklab): Rgb01 {
  const [r, g, b] = oklabToLinearRgb(color);
  return { r: clamp01(linearToSrgb(r)), g: clamp01(linearToSrgb(g)), b: clamp01(linearToSrgb(b)) };
}

export function oklabToLinearRgb({ L, a, b }: Oklab): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function oklabToOklch({ L, a, b }: Oklab): Oklch {
  return { L, C: Math.hypot(a, b), H: wrapHue(Math.atan2(b, a) * 180 / Math.PI) };
}

export function oklchToOklab({ L, C, H }: Oklch): Oklab {
  const radians = wrapHue(H) * Math.PI / 180;
  return { L, a: C * Math.cos(radians), b: C * Math.sin(radians) };
}

export function rgbToOklch(color: Rgb01): Oklch {
  return oklabToOklch(rgbToOklab(color));
}

export function hexToOklch(value: string): Oklch {
  return rgbToOklch(hexToRgb01(value));
}

export function oklchToLinearRgb(color: Oklch): [number, number, number] {
  return oklabToLinearRgb(oklchToOklab(color));
}

export function isOklchInSrgbGamut(color: Oklch, epsilon = 1e-7): boolean {
  if (![color.L, color.C, color.H].every(Number.isFinite)) return false;
  const [r, g, b] = oklchToLinearRgb(color);
  return r >= -epsilon && r <= 1 + epsilon
    && g >= -epsilon && g <= 1 + epsilon
    && b >= -epsilon && b <= 1 + epsilon;
}

/**
 * Find the largest chroma for a fixed OKLCH lightness/hue that is in sRGB.
 * The small cache is important while dragging a UI control: neighbouring
 * samples revisit the same rounded lightness/hue pairs frequently.
 */
export function getMaxChromaForOklch(lightness: number, hue: number): number {
  const L = clamp01(lightness);
  const H = wrapHue(hue);
  // Do not round the coordinates: a rounded cache key can reuse a nearby
  // chroma boundary that is slightly outside the exact point's gamut.
  const key = `${L}:${H}`;
  const cached = MAX_CHROMA_CACHE.get(key);
  if (cached !== undefined) return cached;

  let low = 0;
  let high = MAX_SEARCH_CHROMA;
  if (isOklchInSrgbGamut({ L, C: high, H })) {
    MAX_CHROMA_CACHE.set(key, high);
    return high;
  }

  for (let index = 0; index < 22; index += 1) {
    const middle = (low + high) / 2;
    if (isOklchInSrgbGamut({ L, C: middle, H })) low = middle;
    else high = middle;
  }

  if (MAX_CHROMA_CACHE.size > 4096) MAX_CHROMA_CACHE.clear();
  MAX_CHROMA_CACHE.set(key, low);
  return low;
}

export type GamutMappedColor = {
  hex: string;
  rgb: Rgb01;
  oklch: Oklch;
  maxChroma: number;
  wasGamutMapped: boolean;
};

/** Reduce OKLCH chroma until the colour is in sRGB, preserving L and H. */
export function mapOklchToSrgb(color: Oklch, knownMaxChroma?: number): GamutMappedColor {
  const L = clamp(color.L, 0, 1, 0.5);
  const requestedChroma = clamp(color.C, 0, MAX_SEARCH_CHROMA, 0);
  const H = wrapHue(color.H);
  const maxChroma = clamp(knownMaxChroma ?? getMaxChromaForOklch(L, H), 0, MAX_SEARCH_CHROMA, 0);
  const C = Math.min(requestedChroma, maxChroma);
  const mapped = { L, C, H };
  const rgb = oklabToRgb(oklchToOklab(mapped));
  return {
    hex: rgb01ToHex(rgb),
    rgb,
    oklch: mapped,
    maxChroma,
    wasGamutMapped: C < requestedChroma - 1e-6,
  };
}

export function oklabDistance(a: Oklab, b: Oklab): number {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}
