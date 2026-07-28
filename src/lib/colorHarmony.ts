export type HarmonyType =
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triad'
  | 'square'
  | 'compound'
  | 'shades'
  | 'monochromatic';

export const HARMONY_TYPES: readonly HarmonyType[] = [
  'analogous',
  'complementary',
  'split-complementary',
  'triad',
  'square',
  'compound',
  'shades',
  'monochromatic',
];

type Hsl = { h: number; s: number; l: number };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function wrapHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeHex(value: string): string {
  const trimmed = value.trim().replace(/^#/, '');
  const expanded = trimmed.length === 3
    ? trimmed.split('').map((part) => `${part}${part}`).join('')
    : trimmed;
  return /^[0-9a-f]{6}$/i.test(expanded) ? `#${expanded.toUpperCase()}` : '#808080';
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  return [
    Number.parseInt(normalized.slice(1, 3), 16) / 255,
    Number.parseInt(normalized.slice(3, 5), 16) / 255,
    Number.parseInt(normalized.slice(5, 7), 16) / 255,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const channel = (value: number) => Math.round(clamp01(value) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function rgbToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = 60 * (((g - b) / delta) % 6);
  else if (max === g) h = 60 * ((b - r) / delta + 2);
  else h = 60 * ((r - g) / delta + 4);

  return { h: wrapHue(h), s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hue = wrapHue(h) / 360;
  const chroma = (1 - Math.abs(2 * clamp01(l) - 1)) * clamp01(s);
  const x = chroma * (1 - Math.abs((hue * 6) % 2 - 1));
  const m = clamp01(l) - chroma / 2;
  let rgb: [number, number, number];

  if (hue < 1 / 6) rgb = [chroma, x, 0];
  else if (hue < 2 / 6) rgb = [x, chroma, 0];
  else if (hue < 3 / 6) rgb = [0, chroma, x];
  else if (hue < 4 / 6) rgb = [0, x, chroma];
  else if (hue < 5 / 6) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return rgbToHex(rgb[0] + m, rgb[1] + m, rgb[2] + m);
}

function rotateHue(base: Hsl, degrees: number): string {
  return hslToHex({ ...base, h: base.h + degrees });
}

function withLightness(base: Hsl, lightness: number): string {
  return hslToHex({ ...base, l: clamp01(lightness) });
}

function withTone(base: Hsl, saturation: number, lightness: number): string {
  return hslToHex({ ...base, s: clamp01(saturation), l: clamp01(lightness) });
}

function huePalette(base: Hsl, offsets: readonly number[]): string[] {
  return offsets.map((offset) => rotateHue(base, offset));
}

function shadesPalette(base: Hsl): string[] {
  const levels = [0.16, 0.30, 0.44, 0.58, 0.72, 0.86];
  const closestIndex = levels.reduce((best, level, index) => (
    Math.abs(level - base.l) < Math.abs(levels[best] - base.l) ? index : best
  ), 0);
  levels[closestIndex] = base.l;
  return levels.map((level) => withLightness(base, level));
}

function monochromaticPalette(base: Hsl, baseHex: string): string[] {
  return [
    withTone(base, Math.max(0.12, base.s * 0.45), clamp01(base.l + 0.22)),
    withTone(base, Math.max(0.18, base.s * 0.72), clamp01(base.l + 0.10)),
    baseHex,
    withTone(base, Math.min(1, base.s * 1.12 + 0.04), clamp01(base.l - 0.10)),
    withTone(base, Math.min(1, base.s * 1.24 + 0.08), clamp01(base.l - 0.22)),
  ];
}

/**
 * Generate a small, deterministic palette from one base color.
 * The first/central base color is kept in every harmony family so the
 * result can be judged and applied without entering a second color.
 */
export function generateHarmonyPalette(baseHex: string, type: HarmonyType): string[] {
  const base = normalizeHex(baseHex);
  const hsl = rgbToHsl(base);

  switch (type) {
    case 'analogous': return huePalette(hsl, [-30, -15, 0, 15, 30]);
    case 'complementary': return huePalette(hsl, [0, 180]);
    case 'split-complementary': return huePalette(hsl, [0, 150, 210]);
    case 'triad': return huePalette(hsl, [0, 120, 240]);
    case 'square': return huePalette(hsl, [0, 90, 180, 270]);
    case 'compound': return huePalette(hsl, [0, 30, 180, 210]);
    case 'shades': return shadesPalette(hsl);
    case 'monochromatic': return monochromaticPalette(hsl, base);
  }
}
