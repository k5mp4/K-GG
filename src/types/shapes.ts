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
 * SANDBOX Shapes: an SVG silhouette becomes a continuous luminance field that
 * is mapped through the Gradient Ramp, like a thermal image or a depth pass.
 *
 *   smooth outline (Softness) → inner shadow depth (Inner Shadow) →
 *   animated interior fill (Fill) + outer aura (Glow) → luminance →
 *   Gradient Ramp
 *
 * Only the shape's alpha is used; its colours and styles are ignored.
 */
export type ShapesSource = 'circle' | 'star' | 'text' | 'custom';

/**
 * What moves inside the shape. `flow` is looping domain-warped noise,
 * `ripple` bands that follow the depth, `stripes` warped straight bands, and
 * `render` the luminance of the finished K-GG frame.
 */
export type ShapesFillSource = 'flow' | 'ripple' | 'stripes' | 'render';

/** How the shape appears and disappears within each show/hide cycle. */
export type ShapesReveal = 'none' | 'fadeGlow' | 'wipe' | 'flicker';

export const SHAPES_SOURCES = getEnumParameterLimit('shapes.source').values as readonly ShapesSource[];
export const SHAPES_FILL_SOURCES = getEnumParameterLimit('shapes.fillSource').values as readonly ShapesFillSource[];
export const SHAPES_REVEALS = getEnumParameterLimit('shapes.reveal').values as readonly ShapesReveal[];

export type ShapesConfig = {
  enabled: boolean;
  source: ShapesSource;
  /** Fraction of the canvas the shape's content box fits into (contain). */
  scale: number;
  /** Centre offset in half canvas-short-side units. +Y moves the shape down. */
  offsetX: number;
  offsetY: number;
  rotation: number;
  /** Blur of the silhouette, giving the path a smooth outline. */
  softness: number;
  /** How far the inner shadow darkens the interior towards the edge (0 = flat). */
  innerShadow: number;
  /** Reach of the inner shadow from the edge. */
  innerShadowSize: number;
  /** Shift of the shadow away from the light, as a fraction of its size (0 = even all round). */
  shadowOffset: number;
  /** Direction the light comes from, in degrees (0 = right, 90 = up). */
  lightAngle: number;
  fillSource: ShapesFillSource;
  /** How strongly the moving fill modulates the interior luminance. */
  fillAmount: number;
  /** Feature size of the fill (noise cells, band spacing). */
  fillScale: number;
  /** Organic distortion of the fill. */
  fillWarp: number;
  /** Direction of the Stripes fill. */
  fillAngle: number;
  /** Whole motion cycles of the fill per animation loop; integers loop seamlessly. */
  fillCycles: number;
  /** Reach of the outer aura. */
  glowRadius: number;
  /** Brightness of the outer aura in the luminance field. */
  glowIntensity: number;
  /** Gamma applied to the luminance before the Gradient Ramp lookup (>1 pushes towards the low end). */
  contrast: number;
  grain: number;
  /** Outside the shape and aura: transparent instead of the Ramp's low end (for compositing). */
  transparentBackground: boolean;
  reveal: ShapesReveal;
  /** Show/hide cycles per animation loop. */
  revealCycles: number;
  /** Length of each appear and disappear transition, as a fraction of one cycle. */
  revealTransition: number;
  /** Hidden part of each cycle. */
  revealHidden: number;
  /** Phase shift of the cycle. */
  revealOffset: number;
};

type ShapesNumericKey = {
  [Key in keyof ShapesConfig]: ShapesConfig[Key] extends number ? Key : never
}[keyof ShapesConfig];

export const SHAPES_LIMIT_KEYS: Record<ShapesNumericKey, ParameterLimitKey> = {
  scale: 'shapes.scale',
  offsetX: 'shapes.offsetX',
  offsetY: 'shapes.offsetY',
  rotation: 'shapes.rotation',
  softness: 'shapes.softness',
  innerShadow: 'shapes.innerShadow',
  innerShadowSize: 'shapes.innerShadowSize',
  shadowOffset: 'shapes.shadowOffset',
  lightAngle: 'shapes.lightAngle',
  fillAmount: 'shapes.fillAmount',
  fillScale: 'shapes.fillScale',
  fillWarp: 'shapes.fillWarp',
  fillAngle: 'shapes.fillAngle',
  fillCycles: 'shapes.fillCycles',
  glowRadius: 'shapes.glowRadius',
  glowIntensity: 'shapes.glowIntensity',
  contrast: 'shapes.contrast',
  grain: 'shapes.grain',
  revealCycles: 'shapes.revealCycles',
  revealTransition: 'shapes.revealTransition',
  revealHidden: 'shapes.revealHidden',
  revealOffset: 'shapes.revealOffset',
};

const SHAPES_NUMERIC_KEYS = Object.keys(SHAPES_LIMIT_KEYS) as ShapesNumericKey[];

export const DEFAULT_SHAPES: ShapesConfig = {
  enabled: false,
  transparentBackground: false,
  source: getEnumParameterDefault('shapes.source'),
  fillSource: getEnumParameterDefault('shapes.fillSource'),
  reveal: getEnumParameterDefault('shapes.reveal'),
  ...Object.fromEntries(SHAPES_NUMERIC_KEYS.map(key => [key, getParameterDefault(SHAPES_LIMIT_KEYS[key])])) as Record<ShapesNumericKey, number>,
};

export function normalizeShapesConfig(value: unknown): ShapesConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof ShapesConfig, unknown>>
    : {};
  const config: ShapesConfig = {
    ...DEFAULT_SHAPES,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SHAPES.enabled,
    transparentBackground: typeof raw.transparentBackground === 'boolean'
      ? raw.transparentBackground
      : DEFAULT_SHAPES.transparentBackground,
    source: normalizeEnumParameter('shapes.source', raw.source),
    fillSource: normalizeEnumParameter('shapes.fillSource', raw.fillSource),
    reveal: normalizeEnumParameter('shapes.reveal', raw.reveal),
  };
  for (const key of SHAPES_NUMERIC_KEYS) {
    config[key] = clampParameter(raw[key], DEFAULT_SHAPES[key], getParameterLimit(SHAPES_LIMIT_KEYS[key]));
  }
  return config;
}

/** Visibility of the shape at one instant, consumed by the Shapes pass as uniforms. */
export type ShapesRevealState = {
  /** Overall opacity of the shape and its glow (0..1). */
  opacity: number;
  /** Multiplier of the glow radius (the aura widens as the shape lights up). */
  glowScale: number;
  /**
   * Visible interval along the wipe direction, in 0..1 across the shape's
   * bounding box. `[-Infinity-like, +Infinity-like]` means fully visible.
   */
  wipeStart: number;
  wipeEnd: number;
};

/** Wipe bounds far outside 0..1 so the soft edge never reaches the shape. */
const WIPE_OPEN_START = -8;
const WIPE_OPEN_END = 8;
/** Soft wipe edge half-width; the edge travels from -W to 1+W so it fully clears the shape. */
export const SHAPES_WIPE_SOFTNESS = 0.06;

const FULLY_VISIBLE: ShapesRevealState = { opacity: 1, glowScale: 1, wipeStart: WIPE_OPEN_START, wipeEnd: WIPE_OPEN_END };

type RevealPhase =
  | { kind: 'visible' }
  | { kind: 'hidden' }
  | { kind: 'out'; progress: number; cycle: number }
  | { kind: 'in'; progress: number; cycle: number };

function fract(value: number): number {
  return value - Math.floor(value);
}

function smoothstep(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/**
 * One show/hide cycle starts fully visible so that time 0 (thumbnails, the
 * first exported frame) shows the shape:
 *
 *   [visible hold] → [disappear] → [hidden] → [appear] → (next cycle)
 *
 * The transition length is capped so both transitions and the hidden part
 * always fit in one cycle.
 */
function getRevealPhase(config: ShapesConfig, normalizedTime: number): RevealPhase {
  const cycles = Math.max(1, Math.round(config.revealCycles));
  const time = Number.isFinite(normalizedTime) ? normalizedTime : 0;
  const cycleTime = time * cycles + config.revealOffset;
  const cycle = Math.floor(cycleTime);
  const u = fract(cycleTime);
  const hidden = Math.min(Math.max(config.revealHidden, 0), 0.9);
  const transition = Math.min(Math.max(config.revealTransition, 0), (1 - hidden) / 2);
  const hold = 1 - hidden - 2 * transition;
  if (u < hold) return { kind: 'visible' };
  if (u < hold + transition) return { kind: 'out', progress: transition > 0 ? (u - hold) / transition : 1, cycle };
  if (u < hold + transition + hidden) return { kind: 'hidden' };
  return { kind: 'in', progress: transition > 0 ? (u - hold - transition - hidden) / transition : 1, cycle };
}

/** Deterministic hash in 0..1 so exported frames flicker identically every time. */
function hash01(a: number, b: number): number {
  const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return fract(value);
}

/** Number of flicker slots in one transition (more slots = faster flicker). */
const FLICKER_STEPS = 14;
/** Brightness of an "off" flicker frame; neon tubes keep a faint glow. */
const FLICKER_OFF_LEVEL = 0.08;

/**
 * Neon ignition: the tube stutters on with rising probability and settles at
 * full brightness. Switching off is a shorter stutter that dies out.
 */
function flickerOpacity(progress: number, cycle: number, rising: boolean): number {
  const p = Math.min(1, Math.max(0, progress));
  if (rising && p >= 0.92) return 1;
  if (!rising && p <= 0.04) return 1;
  const slot = Math.floor(p * FLICKER_STEPS);
  const chance = rising ? 0.1 + 0.85 * Math.pow(p, 0.7) : 0.85 * Math.pow(1 - p, 1.6);
  const on = hash01(slot + (rising ? 0 : 97), cycle + 13) < chance;
  if (!on) return FLICKER_OFF_LEVEL;
  // "On" frames vary slightly, like an unstable discharge.
  return 0.75 + 0.25 * hash01(slot + 41, cycle + 7);
}

/**
 * Resolves the show/hide loop at a normalized animation time. Integer cycle
 * counts close the loop, so the frame at time 1 equals the frame at time 0.
 * `animated === false` (Animation off) always shows the whole shape.
 */
export function evaluateShapesReveal(
  config: ShapesConfig,
  normalizedTime: number,
  animated: boolean,
): ShapesRevealState {
  if (!animated || config.reveal === 'none') return FULLY_VISIBLE;
  const phase = getRevealPhase(config, normalizedTime);
  if (phase.kind === 'visible') return FULLY_VISIBLE;
  if (phase.kind === 'hidden') {
    return config.reveal === 'wipe'
      ? { opacity: 1, glowScale: 1, wipeStart: WIPE_OPEN_END, wipeEnd: WIPE_OPEN_END }
      : { opacity: 0, glowScale: 0.35, wipeStart: WIPE_OPEN_START, wipeEnd: WIPE_OPEN_END };
  }

  const rising = phase.kind === 'in';
  if (config.reveal === 'wipe') {
    // The edge sweeps in the stripe direction both times: appearing reveals
    // from the start side, disappearing erases from the same side.
    const edge = -SHAPES_WIPE_SOFTNESS + (1 + 2 * SHAPES_WIPE_SOFTNESS) * smoothstep(phase.progress);
    return rising
      ? { opacity: 1, glowScale: 1, wipeStart: WIPE_OPEN_START, wipeEnd: edge }
      : { opacity: 1, glowScale: 1, wipeStart: edge, wipeEnd: WIPE_OPEN_END };
  }
  if (config.reveal === 'flicker') {
    const opacity = flickerOpacity(phase.progress, phase.cycle, rising);
    return { opacity, glowScale: 0.6 + 0.4 * opacity, wipeStart: WIPE_OPEN_START, wipeEnd: WIPE_OPEN_END };
  }
  // fadeGlow: opacity and the aura's spread rise and fall together.
  const level = smoothstep(rising ? phase.progress : 1 - phase.progress);
  return { opacity: level, glowScale: 0.35 + 0.65 * level, wipeStart: WIPE_OPEN_START, wipeEnd: WIPE_OPEN_END };
}

/**
 * Fill motion phase in cycles (0..1). Whole-cycle counts make the fill at
 * time 1 identical to time 0, so the motion never jumps at the loop boundary.
 */
export function resolveShapesFillPhase(config: ShapesConfig, normalizedTime: number, animated: boolean): number {
  if (!animated) return 0;
  const time = Number.isFinite(normalizedTime) ? normalizedTime : 0;
  return fract(config.fillCycles * time);
}
