import { clampParameter, getParameterDefault, getParameterLimit } from '../lib/parameterLimits';

export type ConeMappingMode = 'flow' | 'projection';
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

export type ConeViewConfig = {
  depth: number;
  rotation: number;
  textureRepeat: number;
  flowCycles: number;
  apexX: number;
  apexY: number;
  seamBlend: number;
  seamMode: ConeSeamMode;
  mappingMode: ConeMappingMode;
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
  depth: getParameterDefault('cone.depth'),
  rotation: getParameterDefault('cone.rotation'),
  textureRepeat: getParameterDefault('cone.textureRepeat'),
  flowCycles: getParameterDefault('cone.flowCycles'),
  apexX: 0,
  apexY: 0,
  seamBlend: getParameterDefault('cone.seamBlend'),
  seamMode: DEFAULT_CONE_SEAM_MODE,
  mappingMode: 'flow',
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
    depth: clampParameter(raw.depth, DEFAULT_CONE_VIEW.depth, getParameterLimit('cone.depth')),
    rotation: clampParameter(raw.rotation, DEFAULT_CONE_VIEW.rotation, getParameterLimit('cone.rotation')),
    textureRepeat: clampParameter(raw.textureRepeat, DEFAULT_CONE_VIEW.textureRepeat, getParameterLimit('cone.textureRepeat')),
    flowCycles: clampParameter(raw.flowCycles, DEFAULT_CONE_VIEW.flowCycles, getParameterLimit('cone.flowCycles')),
    apexX: clampParameter(raw.apexX, DEFAULT_CONE_VIEW.apexX, getParameterLimit('cone.apexX')),
    apexY: clampParameter(raw.apexY, DEFAULT_CONE_VIEW.apexY, getParameterLimit('cone.apexY')),
    seamBlend: clampParameter(raw.seamBlend, DEFAULT_CONE_VIEW.seamBlend, getParameterLimit('cone.seamBlend')),
    seamMode: normalizeSeamMode(raw.seamMode),
    mappingMode: raw.mappingMode === 'projection' ? 'projection' : DEFAULT_CONE_VIEW.mappingMode,
  };
}
