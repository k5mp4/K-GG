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
export const CONE_APEX_LIMIT = 2;
export const CONE_SEAM_BLEND_MIN = 0;
// A half-tile is the widest blend that keeps each seam local to its own side.
export const CONE_SEAM_BLEND_MAX = 0.5;

export const DEFAULT_CONE_VIEW: ConeViewConfig = {
  depth: 6,
  rotation: 0,
  textureRepeat: 1,
  flowCycles: 1,
  apexX: 0,
  apexY: 0,
  seamBlend: 0.25,
  seamMode: DEFAULT_CONE_SEAM_MODE,
  mappingMode: 'flow',
};

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  return Math.round(boundedNumber(value, fallback, min, max));
}

function normalizeSeamMode(value: unknown): ConeSeamMode {
  return typeof value === 'string' && CONE_SEAM_MODES.includes(value as ConeSeamMode)
    ? value as ConeSeamMode
    : DEFAULT_CONE_SEAM_MODE;
}

export function normalizeConeViewConfig(value: unknown): ConeViewConfig {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_CONE_VIEW };
  const raw = value as Partial<ConeViewConfig>;
  return {
    depth: boundedNumber(raw.depth, DEFAULT_CONE_VIEW.depth, 2, 30),
    rotation: boundedNumber(raw.rotation, DEFAULT_CONE_VIEW.rotation, -180, 180),
    textureRepeat: boundedInteger(raw.textureRepeat, DEFAULT_CONE_VIEW.textureRepeat, 1, 8),
    flowCycles: boundedInteger(raw.flowCycles, DEFAULT_CONE_VIEW.flowCycles, -30, 30),
    apexX: boundedNumber(raw.apexX, DEFAULT_CONE_VIEW.apexX, -CONE_APEX_LIMIT, CONE_APEX_LIMIT),
    apexY: boundedNumber(raw.apexY, DEFAULT_CONE_VIEW.apexY, -CONE_APEX_LIMIT, CONE_APEX_LIMIT),
    seamBlend: boundedNumber(raw.seamBlend, DEFAULT_CONE_VIEW.seamBlend, CONE_SEAM_BLEND_MIN, CONE_SEAM_BLEND_MAX),
    seamMode: normalizeSeamMode(raw.seamMode),
    mappingMode: raw.mappingMode === 'projection' ? 'projection' : DEFAULT_CONE_VIEW.mappingMode,
  };
}
