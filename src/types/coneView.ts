import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export type ConeMappingMode = 'flow' | 'projection';
/** Geometry of the 3D layer. The layer kind and preset key stay `cone` for compatibility. */
export type ConeShape = 'cone' | 'torus';
export const CONE_SHAPES = ['cone', 'torus'] as const satisfies readonly ConeShape[];
export const CONE_SHAPE_INDEX = {
  cone: 0,
  torus: 1,
} as const satisfies Record<ConeShape, number>;
export type ConeSeamMode = 'mirror' | 'weld' | 'reapply';

export const CONE_SEAM_MODES = ['mirror', 'weld', 'reapply'] as const satisfies readonly ConeSeamMode[];
export const CONE_SEAM_MODE_INDEX = {
  mirror: 0,
  weld: 1,
  reapply: 2,
} as const satisfies Record<ConeSeamMode, number>;

export const CONE_SEAM_MODE_OPTIONS: { value: ConeSeamMode; label: string }[] = [
  { value: 'mirror', label: 'Mirror Repeat' },
  { value: 'weld', label: 'Edge Weld' },
  { value: 'reapply', label: 'Gradient Reapply' },
];
export const DEFAULT_CONE_SEAM_MODE: ConeSeamMode = 'mirror';

/** Procedural torus camera motion. Every preset is periodic over one loop. */
export type TorusWigglePreset = 'off' | 'drift' | 'handheld' | 'float' | 'orbit' | 'sway' | 'lookAround';
export const TORUS_WIGGLE_PRESETS = ['off', 'drift', 'handheld', 'float', 'orbit', 'sway', 'lookAround'] as const satisfies readonly TorusWigglePreset[];
export const TORUS_WIGGLE_PRESET_OPTIONS: { value: TorusWigglePreset; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'drift', label: 'Drift · Slow look' },
  { value: 'handheld', label: 'Handheld · Shake' },
  { value: 'float', label: 'Float · Bobbing' },
  { value: 'orbit', label: 'Orbit · Circle' },
  { value: 'sway', label: 'Sway · Barrel roll' },
  { value: 'lookAround', label: 'Look Around · 360° Yaw' },
];

export type ConeViewConfig = {
  shape: ConeShape;
  depth: number;
  rotation: number;
  textureRepeat: number;
  flowCycles: number;
  apexX: number;
  apexY: number;
  seamBlend: number;
  seamMode: ConeSeamMode;
  mappingMode: ConeMappingMode;
  /** Torus only: tube radius divided by ring radius. Larger values bend the tunnel more tightly. */
  torusBend: number;
  /** Torus only: texture tiles around the ring. Integer values keep the ring seamless. */
  torusRingRepeat: number;
  /** Torus only: camera offset inside the tube cross-section, in tube radii (screen right/up). */
  torusCameraX: number;
  torusCameraY: number;
  /** Torus only: look-direction adjustment in degrees, relative to the automatic aim into the bend. */
  torusCameraYaw: number;
  torusCameraPitch: number;
  torusWigglePreset: TorusWigglePreset;
  /** Scales the preset's amplitudes. */
  torusWiggleAmount: number;
  /** Integer multiplier of every wiggle frequency, so the motion still closes on the loop. */
  torusWiggleSpeed: number;
};

/** Normalized apex movement limit; ±2 reaches 50% of the canvas outside its edge. */
export const CONE_APEX_LIMIT = Math.max(
  Math.abs(getParameterLimit('cone.apexX').min),
  Math.abs(getParameterLimit('cone.apexX').max),
);
export const CONE_SEAM_BLEND_MIN = 0;
// A half-tile is the widest blend that keeps each seam local to its own side.
export const CONE_SEAM_BLEND_MAX = getParameterLimit('cone.seamBlend').max;

export const DEFAULT_CONE_VIEW: ConeViewConfig = {
  shape: 'cone',
  depth: getParameterDefault('cone.depth'),
  rotation: getParameterDefault('cone.rotation'),
  textureRepeat: getParameterDefault('cone.textureRepeat'),
  flowCycles: getParameterDefault('cone.flowCycles'),
  apexX: 0,
  apexY: 0,
  seamBlend: getParameterDefault('cone.seamBlend'),
  seamMode: DEFAULT_CONE_SEAM_MODE,
  mappingMode: 'flow',
  torusBend: getParameterDefault('cone.torusBend'),
  torusRingRepeat: getParameterDefault('cone.torusRingRepeat'),
  torusCameraX: getParameterDefault('cone.torusCameraX'),
  torusCameraY: getParameterDefault('cone.torusCameraY'),
  torusCameraYaw: getParameterDefault('cone.torusCameraYaw'),
  torusCameraPitch: getParameterDefault('cone.torusCameraPitch'),
  torusWigglePreset: 'off',
  torusWiggleAmount: getParameterDefault('cone.torusWiggleAmount'),
  torusWiggleSpeed: getParameterDefault('cone.torusWiggleSpeed'),
};

function normalizeSeamMode(value: unknown): ConeSeamMode {
  return typeof value === 'string' && CONE_SEAM_MODES.includes(value as ConeSeamMode)
    ? value as ConeSeamMode
    : DEFAULT_CONE_SEAM_MODE;
}

export function normalizeConeViewConfig(value: unknown): ConeViewConfig {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_CONE_VIEW };
  const raw = value as Partial<ConeViewConfig>;
  return {
    shape: raw.shape === 'torus' ? 'torus' : DEFAULT_CONE_VIEW.shape,
    depth: clampParameter(raw.depth, DEFAULT_CONE_VIEW.depth, getParameterLimit('cone.depth')),
    rotation: clampParameter(raw.rotation, DEFAULT_CONE_VIEW.rotation, getParameterLimit('cone.rotation')),
    textureRepeat: clampParameter(raw.textureRepeat, DEFAULT_CONE_VIEW.textureRepeat, getParameterLimit('cone.textureRepeat')),
    flowCycles: clampParameter(raw.flowCycles, DEFAULT_CONE_VIEW.flowCycles, getParameterLimit('cone.flowCycles')),
    apexX: clampParameter(raw.apexX, DEFAULT_CONE_VIEW.apexX, getParameterLimit('cone.apexX')),
    apexY: clampParameter(raw.apexY, DEFAULT_CONE_VIEW.apexY, getParameterLimit('cone.apexY')),
    seamBlend: clampParameter(raw.seamBlend, DEFAULT_CONE_VIEW.seamBlend, getParameterLimit('cone.seamBlend')),
    seamMode: normalizeSeamMode(raw.seamMode),
    mappingMode: raw.mappingMode === 'projection' ? 'projection' : DEFAULT_CONE_VIEW.mappingMode,
    torusBend: clampParameter(raw.torusBend, DEFAULT_CONE_VIEW.torusBend, getParameterLimit('cone.torusBend')),
    torusRingRepeat: clampParameter(raw.torusRingRepeat, DEFAULT_CONE_VIEW.torusRingRepeat, getParameterLimit('cone.torusRingRepeat')),
    torusCameraX: clampParameter(raw.torusCameraX, DEFAULT_CONE_VIEW.torusCameraX, getParameterLimit('cone.torusCameraX')),
    torusCameraY: clampParameter(raw.torusCameraY, DEFAULT_CONE_VIEW.torusCameraY, getParameterLimit('cone.torusCameraY')),
    torusCameraYaw: clampParameter(raw.torusCameraYaw, DEFAULT_CONE_VIEW.torusCameraYaw, getParameterLimit('cone.torusCameraYaw')),
    torusCameraPitch: clampParameter(raw.torusCameraPitch, DEFAULT_CONE_VIEW.torusCameraPitch, getParameterLimit('cone.torusCameraPitch')),
    torusWigglePreset: typeof raw.torusWigglePreset === 'string' && TORUS_WIGGLE_PRESETS.includes(raw.torusWigglePreset as TorusWigglePreset)
      ? raw.torusWigglePreset as TorusWigglePreset
      : DEFAULT_CONE_VIEW.torusWigglePreset,
    torusWiggleAmount: clampParameter(raw.torusWiggleAmount, DEFAULT_CONE_VIEW.torusWiggleAmount, getParameterLimit('cone.torusWiggleAmount')),
    torusWiggleSpeed: clampParameter(raw.torusWiggleSpeed, DEFAULT_CONE_VIEW.torusWiggleSpeed, getParameterLimit('cone.torusWiggleSpeed')),
  };
}
