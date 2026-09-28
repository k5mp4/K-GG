import type { NoiseDistortionConfig } from '../types/distortion';
import { noiseAngleDegreesForShader } from './noiseAngle';
import { clampParameter, getParameterDefault, getParameterLimit } from './parameterLimits';

/**
 * Chladni Noise support shared by the renderer and tests.
 *
 * A square-plate Chladni field is
 *   F(x, y; m, n) = cos(nπx)·cos(mπy) − cos(mπx)·cos(nπy)
 * whose zero set (F = 0) is the nodal line pattern. The key patterns A–D are
 * chosen here on the CPU so the selection is deterministic, easy to
 * de-duplicate, and uploaded identically to the Legacy generator and the V2
 * Noise Stack. The GLSL implementation lives in `chladniDistortion()` in
 * src/shaders/noise.glsl; the reference evaluator below mirrors it for tests.
 */

export const CHLADNI_MAX_PATTERNS = 4;

/** An ordered plate mode. (n, m) is the same nodal set as (m, n) with F negated. */
export type ChladniMode = readonly [m: number, n: number];

type ChladniConfig = Pick<
  NoiseDistortionConfig,
  | 'noiseSeed'
  | 'chladniPatternCount'
  | 'chladniComplexity'
  | 'chladniLineWidth'
  | 'chladniSharpness'
  | 'chladniWarpStrength'
  | 'chladniRotation'
>;

export type ChladniUniformValues = {
  patternCount: number;
  /** (mA, nA, mB, nB) */
  modesAB: [number, number, number, number];
  /** (mC, nC, mD, nD) */
  modesCD: [number, number, number, number];
  lineWidth: number;
  sharpness: number;
  warpStrength: number;
  /** Radians, sign-mirrored like the other Noise angles at the upload boundary. */
  rotation: number;
};

/** Highest mode index for a Complexity value. Complexity 1 → 3, 8 → 10. */
export function getChladniModeLimit(complexity: number): number {
  return clampParameter(complexity, getParameterDefault('noise.chladniComplexity'), getParameterLimit('noise.chladniComplexity')) + 2;
}

/**
 * Unordered mode pairs {m < n} in [0, limit] with m + n ≥ limit. Excluding
 * m == n removes the identically-zero field, and keeping only m < n treats
 * (m, n) / (n, m) as the same pattern. The m + n floor makes higher
 * Complexity select finer patterns; limit ≥ 3 always leaves at least four
 * distinct candidates, so Pattern A–D never repeat.
 */
export function listChladniModeCandidates(limit: number): ChladniMode[] {
  const candidates: ChladniMode[] = [];
  for (let m = 0; m <= limit; m++) {
    for (let n = m + 1; n <= limit; n++) {
      if (m + n >= limit) candidates.push([m, n]);
    }
  }
  return candidates;
}

function hashSeed(seed: number, limit: number): number {
  const seedKey = Number.isFinite(seed) ? Math.round(seed * 1000) : 0;
  let hash = Math.imul(seedKey ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(limit + 1, 0xc2b2ae35);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return hash >>> 0;
}

/** mulberry32: small, fully integer-deterministic PRNG. */
function createRandom(state: number): () => number {
  let current = state >>> 0;
  return () => {
    current = (current + 0x6d2b79f5) >>> 0;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pattern A–D for a Seed and Complexity. The list does not depend on Pattern
 * Count, so changing the count only adds or removes trailing patterns.
 */
export function getChladniPatternModes(seed: number, complexity: number): ChladniMode[] {
  const limit = getChladniModeLimit(complexity);
  const candidates = listChladniModeCandidates(limit);
  const random = createRandom(hashSeed(seed, limit));
  const picks = Math.min(CHLADNI_MAX_PATTERNS, candidates.length);
  for (let index = 0; index < picks; index++) {
    const swapIndex = index + Math.floor(random() * (candidates.length - index));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  const modes: ChladniMode[] = [];
  for (let index = 0; index < CHLADNI_MAX_PATTERNS; index++) {
    const [m, n] = candidates[index % picks];
    // The orientation flips the sign of F, which changes the in-between
    // shapes of the signed-field morph without changing the key pattern.
    modes.push(random() < 0.5 ? [m, n] : [n, m]);
  }
  return modes;
}

export function getChladniUniformValues(config: ChladniConfig): ChladniUniformValues {
  const clampNoise = (value: number, key: Parameters<typeof getParameterLimit>[0]) =>
    clampParameter(value, getParameterDefault(key), getParameterLimit(key));
  const [a, b, c, d] = getChladniPatternModes(config.noiseSeed ?? 0, config.chladniComplexity);
  return {
    patternCount: clampNoise(config.chladniPatternCount, 'noise.chladniPatternCount'),
    modesAB: [a[0], a[1], b[0], b[1]],
    modesCD: [c[0], c[1], d[0], d[1]],
    lineWidth: clampNoise(config.chladniLineWidth, 'noise.chladniLineWidth'),
    sharpness: clampNoise(config.chladniSharpness, 'noise.chladniSharpness'),
    warpStrength: clampNoise(config.chladniWarpStrength, 'noise.chladniWarpStrength'),
    rotation: noiseAngleDegreesForShader(clampNoise(config.chladniRotation, 'noise.chladniRotation')),
  };
}

// ---------------------------------------------------------------------------
// CPU reference of chladniDistortion() in src/shaders/noise.glsl. Keep the
// constants and the order of operations identical to the shader.
// ---------------------------------------------------------------------------

const CHLADNI_GRADIENT_EPSILON = 0.5;
const CHLADNI_DISTANCE_EPSILON = 0.0001;

/** Returns [F, ∂F/∂x, ∂F/∂y] at plate coordinate (x, y). */
export function evaluateChladniField(x: number, y: number, mode: ChladniMode): [number, number, number] {
  const m = mode[0] * Math.PI;
  const n = mode[1] * Math.PI;
  const cnx = Math.cos(n * x);
  const snx = Math.sin(n * x);
  const cmy = Math.cos(m * y);
  const smy = Math.sin(m * y);
  const cmx = Math.cos(m * x);
  const smx = Math.sin(m * x);
  const cny = Math.cos(n * y);
  const sny = Math.sin(n * y);
  return [
    cnx * cmy - cmx * cny,
    -n * snx * cmy + m * smx * cny,
    -m * cnx * smy + n * cmx * sny,
  ];
}

export type ChladniMorphState = { current: number; next: number; weight: number };

/**
 * Pattern position within one Loop Period. The weight eases with a raised
 * cosine, so its time derivative is zero at every key pattern, including the
 * wrap from the last pattern back to Pattern A.
 */
export function getChladniMorphState(evolution: number, loopPeriod: number, patternCount: number): ChladniMorphState {
  const count = Math.min(Math.max(Math.round(patternCount), 2), CHLADNI_MAX_PATTERNS);
  const period = Math.max(loopPeriod, 0.0001);
  const cycle = evolution / period;
  const position = (cycle - Math.floor(cycle)) * count;
  const current = Math.min(Math.floor(position), count - 1);
  const t = position - current;
  return {
    current,
    next: current + 1 >= count ? 0 : current + 1,
    weight: 0.5 - 0.5 * Math.cos(Math.PI * t),
  };
}

export type ChladniReferenceInput = {
  uniforms: ChladniUniformValues;
  scale: number;
  loopPeriod: number;
  resolution: readonly [number, number];
};

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

function modeAt(uniforms: ChladniUniformValues, index: number): ChladniMode {
  if (index === 1) return [uniforms.modesAB[2], uniforms.modesAB[3]];
  if (index === 2) return [uniforms.modesCD[0], uniforms.modesCD[1]];
  if (index === 3) return [uniforms.modesCD[2], uniforms.modesCD[3]];
  return [uniforms.modesAB[0], uniforms.modesAB[1]];
}

/** UV offset before the common Amount multiplier, exactly as the shader returns it. */
export function evaluateChladniDisplacement(
  uv: readonly [number, number],
  evolution: number,
  input: ChladniReferenceInput,
): [number, number] {
  const { uniforms } = input;
  const warpStrength = Math.min(Math.max(uniforms.warpStrength, 0), 1);
  if (warpStrength <= 0) return [0, 0];
  const aspect = input.resolution[0] / Math.max(input.resolution[1], 1);
  const px = (uv[0] - 0.5) * aspect;
  const py = uv[1] - 0.5;
  const c = Math.cos(uniforms.rotation);
  const s = Math.sin(uniforms.rotation);
  const scale = Math.min(Math.max(Math.abs(input.scale), 0.01), 10);
  // GLSL mat2(c, s, -s, c) * p
  const x = (c * px - s * py) * scale + 0.5;
  const y = (s * px + c * py) * scale + 0.5;

  const morph = getChladniMorphState(evolution, input.loopPeriod, uniforms.patternCount);
  const modeA = modeAt(uniforms, morph.current);
  const modeB = modeAt(uniforms, morph.next);
  const a = evaluateChladniField(x, y, modeA);
  const b = evaluateChladniField(x, y, modeB);
  const mix = (from: number, to: number) => from + (to - from) * morph.weight;
  const field = [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])];
  const wavenumber = mix(Math.hypot(modeA[0], modeA[1]), Math.hypot(modeB[0], modeB[1]));

  const gradientLength = Math.hypot(field[1], field[2]);
  const lineDistance = Math.abs(field[0]) / Math.max(gradientLength, CHLADNI_DISTANCE_EPSILON) * wavenumber;
  const lineWidth = Math.min(Math.max(uniforms.lineWidth, 0.005), 1);
  const sharpness = Math.min(Math.max(uniforms.sharpness, 0.25), 8);
  const lineInfluence = Math.pow(1 - smoothstep(0, lineWidth, lineDistance), sharpness);

  // GLSL field.yz * rotation == transpose(rotation) * field.yz
  const gx = c * field[1] + s * field[2];
  const gy = -s * field[1] + c * field[2];
  const softLength = Math.sqrt(gx * gx + gy * gy + CHLADNI_GRADIENT_EPSILON * CHLADNI_GRADIENT_EPSILON);
  const signedField = Math.min(Math.max(field[0] * 0.5, -1), 1);
  const strength = (lineInfluence * 0.75 + signedField * 0.25) * warpStrength;
  return [gx / softLength * strength / aspect, gy / softLength * strength];
}
