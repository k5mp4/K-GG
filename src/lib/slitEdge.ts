import type { SlitEdgeShape, SlitEdgeSide, SlitScanConfig } from '../types/distortion';
import { clampParameter, getParameterDefault, getParameterLimit, normalizeEnumParameter } from './parameterLimits';

/**
 * Slit bars with rounded / beveled ends.
 *
 * In Linear mode each slit band is split along its length into several bars.
 * Every bar gets its own Slit shift, so the column is filled without leaving the
 * original image showing between bars. The bar ends are cut with a rounded
 * (Round) or 45 degree (Bevel) corner of radius `size`, capped at half the band
 * width, so a radius of half the width gives a full semicircular end. A capped
 * end reaches over the neighbouring bar by that radius; the neighbour shows
 * through the corners.
 * The bar pattern repeats every `cells` bars (about one canvas length). The Slit
 * animation slides the whole pattern along the band by that period per cycle, so
 * a loop that closes after whole cycles is seamless.
 * The shape is measured in canvas pixels: the band bounds are mapped back through
 * the Variance warp so the corners stay true circles.
 * The GLSL twins are `slitBarShift` and friends in gradient.frag.glsl and
 * `stackSlitBarShift` in postprocess/stack.glsl.
 */

const SIDE_UNIFORM: Record<SlitEdgeSide, number> = { none: 0, start: 1, end: 2, both: 3, random: 4 };

export type SlitEdgeSettings = {
  side: SlitEdgeSide;
  shape: SlitEdgeShape;
  size: number;
  /** Bar length as a fraction of the canvas extent along the band. */
  length: number;
  lengthVariance: number;
  /** Number of bars after which the pattern repeats. */
  cells: number;
  seed: number;
};

type SlitEdgeInput = Pick<
  SlitScanConfig,
  'mode' | 'edgeSide' | 'edgeShape' | 'edgeSize' | 'edgeLength' | 'edgeLengthVariance' | 'pixelPerfect' | 'seed'
>;

export function resolveSlitEdge(slitScan: SlitEdgeInput): SlitEdgeSettings {
  const side = normalizeEnumParameter('slit.edgeSide', slitScan.edgeSide);
  const shape = normalizeEnumParameter('slit.edgeShape', slitScan.edgeShape);
  let size = clampParameter(slitScan.edgeSize, getParameterDefault('slit.edgeSize'), getParameterLimit('slit.edgeSize'));
  if (slitScan.pixelPerfect) size = Math.round(size);
  const length = clampParameter(slitScan.edgeLength, getParameterDefault('slit.edgeLength'), getParameterLimit('slit.edgeLength'));
  const lengthVariance = clampParameter(
    slitScan.edgeLengthVariance,
    getParameterDefault('slit.edgeLengthVariance'),
    getParameterLimit('slit.edgeLengthVariance'),
  );
  // Only Linear bands run along a straight axis; the other modes keep their hard cuts.
  const active = slitScan.mode === 'linear' && side !== 'none' && size > 0;
  // Cast away float noise so 1 / 0.25 and friends give the same count on every platform.
  const cells = Math.max(1, Math.ceil(1 / length - 1e-6));
  return { side: active ? side : 'none', shape, size: active ? size : 0, length, lengthVariance, cells, seed: slitScan.seed };
}

/** Packs the settings for the `u_slitEdge` (size, side, shape) and `u_slitEdgeBar` (length, variance, cells) uniforms. */
export function getSlitEdgeUniform(slitScan: SlitEdgeInput): [number, number, number, number, number, number] {
  const { side, shape, size, length, lengthVariance, cells } = resolveSlitEdge(slitScan);
  return [size, SIDE_UNIFORM[side], shape === 'bevel' ? 1 : 0, length, lengthVariance, cells];
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function hash(value: number): number {
  return fract(Math.sin(value * 127.1 + 311.7) * 43758.5453);
}

/** Maps a warped slit coordinate back to the real one (Newton iteration on the Variance warp). */
function unwarpCoord(target: number, slitWidth: number, variance: number, seed: number): number {
  if (variance <= 0) return target;
  let x = target;
  for (let i = 0; i < 6; i++) {
    const phase = (x / (slitWidth * 4)) * 6.2832 + seed * 37.4;
    const fx = x + Math.sin(phase) * variance * slitWidth - target;
    const dfx = Math.max(1 + Math.cos(phase) * variance * 1.5708, 0.2);
    x -= fx / dfx;
  }
  return x;
}

/** Signed distance (px, positive outside the bar) to a Round/Bevel corner at a bar end. */
function capDistance(a: number, b: number, r: number, shape: SlitEdgeShape): number {
  if (a >= r || b >= r) return -b;
  const qx = r - a;
  const qy = r - b;
  return shape === 'bevel' ? (qx + qy - r) * Math.SQRT1_2 : Math.hypot(qx, qy) - r;
}

function mod(value: number, divisor: number): number {
  return value - divisor * Math.floor(value / divisor);
}

function barCut(k: number, index: number, len: number, amp: number, phase: number, cells: number, seed: number): number {
  return (k + phase + (hash(index * 1.37 + mod(k, cells) * 5.31 + seed * 53.1 + 4.2) - 0.5) * amp) * len;
}

type BarLayer = { coverage: number; shift: number; z: number };

export type SlitBarInput = {
  /** Slit coordinate before the Variance warp. */
  slitCoord: number;
  index: number;
  /** Band bounds in the warped slit-coordinate space. */
  left: number;
  right: number;
  /** Position along the band measured from the canvas centre. */
  tangent: number;
  /** Canvas extent along the band. */
  span: number;
  slitWidth: number;
  slitVariance: number;
  edge: SlitEdgeSettings;
  /** Maps a bar's random value in [0, 1) to its shift factor (applies the Slit animation). */
  shiftFactor: (random: number) => number;
  /** Slit animation phase (cycles); the bar pattern slides one period per cycle. 0 when not animating. */
  animTime?: number;
  pingpong?: boolean;
};

/**
 * Shift factor of the bar covering this pixel. Mirrors `slitBarShift` in the
 * shaders; the factor replaces the per-band factor of the plain Slit.
 */
export function slitBarShift(input: SlitBarInput): number {
  const { slitCoord, index, tangent, span, slitWidth, slitVariance, edge, shiftFactor } = input;
  const seed = edge.seed;
  const len = Math.max(edge.length * span, 4);
  const amp = edge.lengthVariance * 0.8;
  const cells = edge.cells;
  const animTime = input.animTime ?? 0;
  const travel = animTime === 0 ? 0 : input.pingpong ? Math.sin(animTime * Math.PI * 2) * len : animTime * cells * len;
  const barTangent = tangent - travel;
  const phase = hash(index * 2.11 + seed * 17.3 + 9.5);
  const xl = unwarpCoord(input.left, slitWidth, slitVariance, seed);
  const xr = unwarpCoord(input.right, slitWidth, slitVariance, seed);
  const a = Math.max(Math.min(slitCoord - xl, xr - slitCoord), 0);
  const r = Math.min(edge.size, (xr - xl) * 0.5, 0.5 * len * (1 - amp));

  const layer = (k: number): BarLayer => {
    const key = mod(k, cells);
    const pick = hash(index * 2.7 + key * 3.3 + seed * 11.1 + 1.7);
    const capLow = edge.side === 'random' ? pick < 0.5 : edge.side === 'start' || edge.side === 'both';
    const capHigh = edge.side === 'random' ? pick >= 0.5 : edge.side === 'end' || edge.side === 'both';
    const z = edge.side === 'start' ? k : edge.side === 'end' ? -k : hash(index * 4.1 + key * 1.9 + seed * 7.7 + 5.3);
    const lo = barCut(k, index, len, amp, phase, cells, seed);
    const hi = barCut(k + 1, index, len, amp, phase, cells, seed);
    const dLow = capLow ? capDistance(a, barTangent - (lo - r), r, edge.shape) : lo - barTangent;
    const dHigh = capHigh ? capDistance(a, hi + r - barTangent, r, edge.shape) : barTangent - hi;
    // Binary on purpose: blending the shifts of neighbouring bars picks up colours from far away and flickers.
    const coverage = Math.max(dLow, dHigh) <= 0 ? 1 : 0;
    return { coverage, shift: shiftFactor(hash(index + seed * 91.7 + key * 7.13)), z };
  };

  let k0 = Math.floor(barTangent / len - phase + 0.5);
  if (barTangent < barCut(k0, index, len, amp, phase, cells, seed)) k0 -= 1;
  else if (barTangent >= barCut(k0 + 1, index, len, amp, phase, cells, seed)) k0 += 1;

  const layers = [layer(k0 - 1), layer(k0), layer(k0 + 1)];
  let shift = layers[1].shift;
  layers.sort((p, q) => p.z - q.z);
  for (const { coverage, shift: barShift } of layers) shift += (barShift - shift) * coverage;
  return shift;
}
