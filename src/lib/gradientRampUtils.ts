import type { ColorStop, OpacityStop, RampColorMode, RampInterpolation } from '../types/gradient';
import { RAMP_TEX_WIDTH } from './constants';

export { RAMP_TEX_WIDTH };

const RAMP_SUPERSAMPLE_OFFSETS = [-0.25, 0.25] as const;

// ---------------------------------------------------------------------------
// 公開ユーティリティ（アニメーション用）
// ---------------------------------------------------------------------------

export function hexToRgb255(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgb255ToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// ---------------------------------------------------------------------------
// 内部ユーティリティ
// ---------------------------------------------------------------------------

function hexToRgb01(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getStopOpacity(stop: OpacityStop | undefined): number {
  return clamp01(stop?.opacity ?? 1);
}

type NormalizedRampSettings = {
  colorMode: RampColorMode;
  interpolation: RampInterpolation;
};

export function normalizeRampSettings(
  colorMode: RampColorMode | RampInterpolation | undefined,
  interpolation?: RampInterpolation,
): NormalizedRampSettings {
  if (colorMode === 'hsv' || colorMode === 'hsl' || colorMode === 'lch' || colorMode === 'oklch') {
    return { colorMode, interpolation: interpolation && isHueInterpolation(interpolation) ? interpolation : 'near' };
  }
  if (colorMode === 'rgb' || colorMode === 'linearrgb' || colorMode === 'lab' || colorMode === 'xyz' || colorMode === 'oklab') {
    if ((colorMode === 'linearrgb' || colorMode === 'lab' || colorMode === 'xyz' || colorMode === 'oklab') && interpolation === colorMode) {
      return { colorMode, interpolation: 'linear' };
    }
    return { colorMode, interpolation: interpolation && isRgbInterpolation(interpolation) ? interpolation : 'ease' };
  }
  if (colorMode === 'srgb') {
    return { colorMode: 'rgb', interpolation: 'linear' };
  }
  const nextInterpolation = interpolation ?? colorMode ?? 'ease';
  return { colorMode: 'rgb', interpolation: isRgbInterpolation(nextInterpolation) ? nextInterpolation : 'ease' };
}

function usesHueInterpolation(colorMode: RampColorMode): boolean {
  return colorMode === 'hsv' || colorMode === 'hsl' || colorMode === 'lch' || colorMode === 'oklch';
}

function isRgbInterpolation(interpolation: RampInterpolation): boolean {
  return interpolation === 'ease' || interpolation === 'cardinal' || interpolation === 'linear' || interpolation === 'b-spline' || interpolation === 'constant' || interpolation === 'variable';
}

function isHueInterpolation(interpolation: RampInterpolation): boolean {
  return interpolation === 'near' || interpolation === 'far' || interpolation === 'clockwise' || interpolation === 'counterclockwise';
}

function normalizeHueDelta(delta: number): number {
  let d = ((delta % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
}

function hueDelta(h0: number, h1: number, interpolation: RampInterpolation): number {
  const clockwise = ((h1 - h0) % 360 + 360) % 360;
  const counterclockwise = clockwise === 0 ? 0 : clockwise - 360;
  const near = normalizeHueDelta(h1 - h0);

  switch (interpolation) {
    case 'far':
      return near === 0 ? 0 : near > 0 ? near - 360 : near + 360;
    case 'clockwise':
      return clockwise;
    case 'counterclockwise':
      return counterclockwise;
    case 'near':
    default:
      return near;
  }
}

/** HSV/HSL 色相補間 (0–360) */
function lerpHue(h0: number, h1: number, t: number, interpolation: RampInterpolation = 'near'): number {
  return h0 + hueDelta(h0, h1, interpolation) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function bSpline(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    ((1 - 3 * t + 3 * t2 - t3) * p0) +
    ((4 - 6 * t2 + 3 * t3) * p1) +
    ((1 + 3 * t + 3 * t2 - 3 * t3) * p2) +
    (t3 * p3)
  ) / 6;
}

function variableT(t: number, variable = 0): number {
  const v = Math.max(-1, Math.min(1, variable));
  if (v >= 0.999) return t >= 1 ? 1 : 0;
  if (v <= -0.999) return t <= 0 ? 0 : 1;

  const skew = 1 + Math.abs(v) * 24;
  const curvedT = v >= 0
    ? Math.pow(t, skew)
    : 1 - Math.pow(1 - t, skew);

  return smoothstep(curvedT);
}

// ---------------------------------------------------------------------------
// sRGB ↔ Linear RGB（ガンマ変換）
// ---------------------------------------------------------------------------

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = clamp01(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// Linear RGB ↔ XYZ D65（IEC 61966-2-1 行列）
// ---------------------------------------------------------------------------

function linearRgbToXyz(r: number, g: number, b: number): [number, number, number] {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  ];
}

function xyzToLinearRgb(x: number, y: number, z: number): [number, number, number] {
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

// sRGB ↔ XYZ（ガンマ含む完全パイプライン）
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  return linearRgbToXyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
}

function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  const [lr, lg, lb] = xyzToLinearRgb(x, y, z);
  return [clamp01(linearToSrgb(lr)), clamp01(linearToSrgb(lg)), clamp01(linearToSrgb(lb))];
}

// ---------------------------------------------------------------------------
// XYZ D65 ↔ CIELAB（D65 白色点）
// ---------------------------------------------------------------------------

const D65 = [0.95047, 1.00000, 1.08883] as const;

function labF(t: number): number {
  const d = 6 / 29;
  return t > d ** 3 ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29;
}

function labFInv(t: number): number {
  const d = 6 / 29;
  return t > d ? t ** 3 : 3 * d * d * (t - 4 / 29);
}

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const fx = labF(x / D65[0]), fy = labF(y / D65[1]), fz = labF(z / D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToXyz(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  return [D65[0] * labFInv(a / 500 + fy), D65[1] * labFInv(fy), D65[2] * labFInv(fy - b / 200)];
}

// sRGB ↔ CIELAB
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  return xyzToLab(...rgbToXyz(r, g, b));
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  return xyzToRgb(...labToXyz(L, a, b));
}

// ---------------------------------------------------------------------------
// CIELAB ↔ CIELCh（極座標変換）
// ---------------------------------------------------------------------------

function labToLch(L: number, a: number, b: number): [number, number, number] {
  return [L, Math.sqrt(a * a + b * b), Math.atan2(b, a) * (180 / Math.PI)];
}

function lchToLab(L: number, C: number, H: number): [number, number, number] {
  const hr = H * (Math.PI / 180);
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

// ---------------------------------------------------------------------------
// sRGB ↔ OKLab（Björn Ottosson）
// ---------------------------------------------------------------------------

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, sv = s_ ** 3;
  return [
    clamp01(linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * sv)),
    clamp01(linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * sv)),
    clamp01(linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * sv)),
  ];
}

// ---------------------------------------------------------------------------
// OKLab ↔ OKLCH
// ---------------------------------------------------------------------------

function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  return [L, Math.sqrt(a * a + b * b), Math.atan2(b, a) * (180 / Math.PI)];
}

function oklchToOklab(L: number, C: number, H: number): [number, number, number] {
  const hr = H * (Math.PI / 180);
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
}

// ---------------------------------------------------------------------------
// sRGB ↔ HSV
// ---------------------------------------------------------------------------

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const h6 = ((h % 360) + 360) % 360 / 60;
  const i = Math.floor(h6), f = h6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    default: return [v, p, q];
  }
}

// ---------------------------------------------------------------------------
// sRGB ↔ HSL
// ---------------------------------------------------------------------------

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (l < 0.5 ? max + min : 2 - max - min);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return [hue2rgb(p, q, hn + 1 / 3), hue2rgb(p, q, hn), hue2rgb(p, q, hn - 1 / 3)];
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

function rgb01ToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('');
}

function rgbToModeVector(r: number, g: number, b: number, colorMode: RampColorMode): [number, number, number] {
  switch (colorMode) {
    case 'linearrgb':
      return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
    case 'xyz':
      return rgbToXyz(r, g, b);
    case 'lab':
      return rgbToLab(r, g, b);
    case 'oklab':
      return rgbToOklab(r, g, b);
    default:
      return [r, g, b];
  }
}

function modeVectorToRgb(v0: number, v1: number, v2: number, colorMode: RampColorMode): [number, number, number] {
  switch (colorMode) {
    case 'linearrgb':
      return [clamp01(linearToSrgb(v0)), clamp01(linearToSrgb(v1)), clamp01(linearToSrgb(v2))];
    case 'xyz':
      return xyzToRgb(v0, v1, v2);
    case 'lab':
      return labToRgb(v0, v1, v2);
    case 'oklab':
      return oklabToRgb(v0, v1, v2);
    default:
      return [clamp01(v0), clamp01(v1), clamp01(v2)];
  }
}

/** 2色を指定カラーモードで補間して hex を返す */
export function interpolateColor(
  hexA: string,
  hexB: string,
  t: number,
  colorModeOrInterpolation: RampColorMode | RampInterpolation = 'rgb',
  interpolation?: RampInterpolation,
): string {
  if (!interpolation) {
    const legacySettings = normalizeRampSettings(colorModeOrInterpolation, 'linear');
    return interpolateColor(hexA, hexB, t, legacySettings.colorMode, legacySettings.interpolation);
  }

  const { colorMode, interpolation: interp } = normalizeRampSettings(colorModeOrInterpolation, interpolation);
  const [ar, ag, ab] = hexToRgb01(hexA);
  const [br, bg, bb] = hexToRgb01(hexB);
  let r: number, g: number, b: number;

  switch (colorMode) {
    case 'hsl': {
      const [ah, as_, al] = rgbToHsl(ar, ag, ab);
      const [bh, bs, bl] = rgbToHsl(br, bg, bb);
      [r, g, b] = hslToRgb(lerpHue(ah, bh, t, isHueInterpolation(interp) ? interp : 'near'), lerp(as_, bs, t), lerp(al, bl, t));
      break;
    }
    case 'hsv': {
      const [ah, as_, av] = rgbToHsv(ar, ag, ab);
      const [bh, bs, bv] = rgbToHsv(br, bg, bb);
      [r, g, b] = hsvToRgb(lerpHue(ah, bh, t, isHueInterpolation(interp) ? interp : 'near'), lerp(as_, bs, t), lerp(av, bv, t));
      break;
    }
    case 'lch': {
      const [aL, aC, aH] = labToLch(...rgbToLab(ar, ag, ab));
      const [bL, bC, bH] = labToLch(...rgbToLab(br, bg, bb));
      [r, g, b] = labToRgb(...lchToLab(lerp(aL, bL, t), lerp(aC, bC, t), lerpHue(aH, bH, t, isHueInterpolation(interp) ? interp : 'near')));
      break;
    }
    case 'oklch': {
      const [aL, aC, aH] = oklabToOklch(...rgbToOklab(ar, ag, ab));
      const [bL, bC, bH] = oklabToOklch(...rgbToOklab(br, bg, bb));
      [r, g, b] = oklabToRgb(...oklchToOklab(lerp(aL, bL, t), lerp(aC, bC, t), lerpHue(aH, bH, t, isHueInterpolation(interp) ? interp : 'near')));
      break;
    }
    default: { // srgb
      const modeT = interp === 'ease' ? smoothstep(t) : t;
      const a = rgbToModeVector(ar, ag, ab, colorMode);
      const bv = rgbToModeVector(br, bg, bb, colorMode);
      [r, g, b] = modeVectorToRgb(lerp(a[0], bv[0], modeT), lerp(a[1], bv[1], modeT), lerp(a[2], bv[2], modeT), colorMode);
    }
  }

  return rgb01ToHex(r, g, b);
}

function stopToModeVector(stop: ColorStop, colorMode: RampColorMode): [number, number, number] {
  const [r, g, b] = hexToRgb01(stop.color);
  return rgbToModeVector(r, g, b, colorMode);
}

function interpolateModeSpline(stops: ColorStop[], segmentIndex: number, t: number, interpolation: RampInterpolation, colorMode: RampColorMode): string {
  const p0 = stopToModeVector(stops[Math.max(0, segmentIndex - 1)], colorMode);
  const p1 = stopToModeVector(stops[segmentIndex], colorMode);
  const p2 = stopToModeVector(stops[segmentIndex + 1], colorMode);
  const p3 = stopToModeVector(stops[Math.min(stops.length - 1, segmentIndex + 2)], colorMode);
  const fn = interpolation === 'b-spline' ? bSpline : catmullRom;
  const [r, g, b] = modeVectorToRgb(
    fn(p0[0], p1[0], p2[0], p3[0], t),
    fn(p0[1], p1[1], p2[1], p3[1], t),
    fn(p0[2], p1[2], p2[2], p3[2], t),
    colorMode,
  );

  return rgb01ToHex(r, g, b);
}

function getSegmentColor(sorted: ColorStop[], segmentIndex: number, localT: number, colorMode: RampColorMode, interpolation: RampInterpolation, variable = 0): string {
  const before = sorted[segmentIndex];
  const after = sorted[segmentIndex + 1] ?? sorted[segmentIndex];

  if (!usesHueInterpolation(colorMode)) {
    if (interpolation === 'constant') return localT >= 1 ? after.color : before.color;
    if (interpolation === 'variable') return interpolateColor(before.color, after.color, variableT(localT, variable), colorMode, 'linear');
    if (interpolation === 'cardinal' && sorted.length > 2) return interpolateModeSpline(sorted, segmentIndex, localT, 'cardinal', colorMode);
    if (interpolation === 'b-spline' && sorted.length > 2) return interpolateModeSpline(sorted, segmentIndex, localT, 'b-spline', colorMode);
  }

  return interpolateColor(before.color, after.color, localT, colorMode, interpolation);
}

/** 複数ストップ列から位置 t の補間色を返す */
export function getColorAtPosition(
  stops: ColorStop[],
  t: number,
  interpolation: RampInterpolation,
  colorMode?: RampColorMode,
  variable = 0,
): string {
  const settings = normalizeRampSettings(colorMode ?? interpolation, interpolation);
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (sorted.length === 0) return '#808080';
  const tc = Math.max(sorted[0].position, Math.min(sorted[sorted.length - 1].position, t));
  let segmentIndex = Math.max(0, sorted.length - 2);
  for (let j = 0; j < sorted.length - 1; j++) {
    if (tc >= sorted[j].position && tc <= sorted[j + 1].position) {
      segmentIndex = j; break;
    }
  }
  const before = sorted[segmentIndex], after = sorted[segmentIndex + 1] ?? sorted[segmentIndex];
  const range = after.position - before.position;
  const localT = range === 0 ? 0 : (tc - before.position) / range;
  return getSegmentColor(sorted, segmentIndex, localT, settings.colorMode, settings.interpolation, variable);
}

/** 複数不透明度ストップ列から位置 t の補間 alpha を返す */
export function getOpacityAtPosition(stops: OpacityStop[] | undefined, t: number): number {
  if (!stops || stops.length === 0) return 1;
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const tc = Math.max(sorted[0].position, Math.min(sorted[sorted.length - 1].position, t));
  let before = sorted[0], after = sorted[sorted.length - 1];
  for (let j = 0; j < sorted.length - 1; j++) {
    if (tc >= sorted[j].position && tc <= sorted[j + 1].position) {
      before = sorted[j]; after = sorted[j + 1]; break;
    }
  }
  const range = after.position - before.position;
  const localT = range === 0 ? 0 : (tc - before.position) / range;
  return lerp(getStopOpacity(before), getStopOpacity(after), localT);
}

/**
 * mirrorモード用のt変換関数。
 * キャンバス座標 t ∈ [0, 1] をストップ位置にマッピングする（0.5 中心で左右対称）
 * 左半分（0～0.5）はそのまま、右半分（0.5～1）は左にミラー
 */
export function applyMirrorT(t: number): number {
  return t <= 0.5 ? t : 1 - t;
}

export function applyRampRepeatT(t: number, repeat = 1): number {
  const tc = Math.max(0, Math.min(1, t));
  const repeats = Math.max(1, Math.min(20, Math.round(repeat)));
  if (repeats <= 1) return tc;
  if (tc >= 1) return 1;
  return (tc * repeats) % 1;
}

/**
 * ColorStop 配列から 256×1 RGBA テクスチャデータを生成する
 */
export function buildRampTextureData(
  stops: ColorStop[],
  interpolation: RampInterpolation = 'ease',
  mirror = false,
  opacityStops?: OpacityStop[],
  colorMode?: RampColorMode,
  variable = 0,
  repeat = 1,
): Uint8Array {
  const settings = normalizeRampSettings(colorMode ?? interpolation, interpolation);
  const data = new Uint8Array(RAMP_TEX_WIDTH * 4);
  const sorted = [...stops].sort((a, b) => a.position - b.position);

  if (sorted.length === 0) {
    for (let i = 0; i < RAMP_TEX_WIDTH; i++) {
      data[i * 4] = i; data[i * 4 + 1] = i; data[i * 4 + 2] = i; data[i * 4 + 3] = 255;
    }
    return data;
  }

  for (let i = 0; i < RAMP_TEX_WIDTH; i++) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    RAMP_SUPERSAMPLE_OFFSETS.forEach(offset => {
      const rawT = i === 0
        ? 0
        : i === RAMP_TEX_WIDTH - 1
          ? 1
          : Math.max(0, Math.min(1, (i + 0.5 + offset) / RAMP_TEX_WIDTH));
      const repeatedT = applyRampRepeatT(rawT, repeat);
      const t = mirror ? applyMirrorT(repeatedT) : repeatedT;
      const tc = Math.max(sorted[0].position, Math.min(sorted[sorted.length - 1].position, t));
      let segmentIndex = Math.max(0, sorted.length - 2);
      for (let j = 0; j < sorted.length - 1; j++) {
        if (tc >= sorted[j].position && tc <= sorted[j + 1].position) {
          segmentIndex = j; break;
        }
      }
      const before = sorted[segmentIndex], after = sorted[segmentIndex + 1] ?? sorted[segmentIndex];
      const range = after.position - before.position;
      const localT = range === 0 ? 0 : (tc - before.position) / range;
      const [rv, gv, bv] = hexToRgb01(getSegmentColor(sorted, segmentIndex, localT, settings.colorMode, settings.interpolation, variable));
      rSum += rv * 255;
      gSum += gv * 255;
      bSum += bv * 255;
      aSum += getOpacityAtPosition(opacityStops, t) * 255;
    });

    data[i * 4] = Math.round(rSum / RAMP_SUPERSAMPLE_OFFSETS.length);
    data[i * 4 + 1] = Math.round(gSum / RAMP_SUPERSAMPLE_OFFSETS.length);
    data[i * 4 + 2] = Math.round(bSum / RAMP_SUPERSAMPLE_OFFSETS.length);
    data[i * 4 + 3] = Math.round(aSum / RAMP_SUPERSAMPLE_OFFSETS.length);
  }

  return data;
}

export const gradientRampPresets: Record<string, ColorStop[]> = {
  Kagaribi_15_BG: [
    { position: 0.0, color: '#e5dabd' },
    { position: 0.1, color: '#6377a6' },
    { position: 0.2, color: '#c03421' },
    { position: 0.3, color: '#c03421' },
    { position: 0.5, color: '#d8896d' },
    { position: 0.8, color: '#e5dabd' },
  ],
    Kagaribi_15: [
    { position: 0.1, color: '#ecdbbe' },
    { position: 0.2, color: '#6075a4' },
    { position: 0.4, color: '#d11402' },
    { position: 0.8, color: '#ecdbbe' },

  ],
  Kagaribi_14: [
    { position: 0.0, color: '#141414' },
    { position: 0.8, color: '#be1e28' },
    { position: 1.0, color: '#dbdcd7' },
  ],
  mono: [
    { position: 0.0, color: '#000000' },
    { position: 1.0, color: '#ffffff' },
  ],
  temperature: [
    { position: 0.0, color: '#ff3300' },
    { position: 0.2, color: '#ff8200' },
    { position: 0.4, color: '#fff4f2' },
    { position: 0.6, color: '#bbccff' },
    { position: 1.0, color: '#9bbcff' },
  ],
  water: [
    { position: 0.0, color: '#001433' },
    { position: 0.4, color: '#006994' },
    { position: 0.7, color: '#40a4d8' },
    { position: 1.0, color: '#c8e8f5' },
  ],
  plasma: [
    { position: 0.0, color: '#0d0887' },
    { position: 0.25, color: '#7e03a8' },
    { position: 0.5, color: '#cc4778' },
    { position: 0.75, color: '#f89441' },
    { position: 1.0, color: '#f0f921' },
  ],
  ThinFilm: [
    { position: 0.00, color: '#02030a' },
    { position: 0.08, color: '#121a54' },
    { position: 0.18, color: '#244dff' },
    { position: 0.30, color: '#00d7ff' },
    { position: 0.42, color: '#49ffbf' },
    { position: 0.54, color: '#f8ff6a' },
    { position: 0.66, color: '#ff7a22' },
    { position: 0.78, color: '#ff2a84' },
    { position: 0.90, color: '#7a2cff' },
    { position: 1.00, color: '#f7fbff' },
  ],
  prism: [
    { position: 0.00, color: '#030308' },
    { position: 0.10, color: '#1433ff' },
    { position: 0.22, color: '#00a8ff' },
    { position: 0.34, color: '#00fff0' },
    { position: 0.46, color: '#38ff62' },
    { position: 0.58, color: '#fff43d' },
    { position: 0.70, color: '#ff8a1c' },
    { position: 0.82, color: '#ff1f2f' },
    { position: 0.92, color: '#ff35d1' },
    { position: 1.00, color: '#ffffff' },
  ],
  lava: [
    { position: 0.0, color: '#000000' },
    { position: 0.25, color: '#3d0000' },
    { position: 0.5, color: '#8b1a1a' },
    { position: 0.75, color: '#ff6600' },
    { position: 1.0, color: '#ffcc00' },
  ],
};
