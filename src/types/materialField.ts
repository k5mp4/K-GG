import { clampParameter, getParameterDefault, getParameterLimit, type ParameterLimitKey } from '../lib/parameterLimits';

/** Shared procedural structure. Consumers decide whether evaluation is needed. */
export type MaterialFieldConfig = {
  seed: number;
  scale: number;
  thickness: number;
  thicknessVariation: number;
  cracks: number;
  warp: number;
  morph: number;
  cycles: number;
  phase: number;
};

export const MATERIAL_FIELD_LIMIT_KEYS = {
  seed: 'materialField.seed',
  scale: 'materialField.scale',
  thickness: 'materialField.thickness',
  thicknessVariation: 'materialField.thicknessVariation',
  cracks: 'materialField.cracks',
  warp: 'materialField.warp',
  morph: 'materialField.morph',
  cycles: 'materialField.cycles',
  phase: 'materialField.phase',
} as const satisfies Record<keyof MaterialFieldConfig, ParameterLimitKey>;

const FIELD_KEYS = Object.keys(MATERIAL_FIELD_LIMIT_KEYS) as (keyof MaterialFieldConfig)[];

export const DEFAULT_MATERIAL_FIELD = Object.fromEntries(FIELD_KEYS.map(key => [
  key, getParameterDefault(MATERIAL_FIELD_LIMIT_KEYS[key]),
])) as MaterialFieldConfig;

export function normalizeMaterialFieldConfig(value: unknown): MaterialFieldConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof MaterialFieldConfig, unknown>> : {};
  return Object.fromEntries(FIELD_KEYS.map(key => [
    key, clampParameter(raw[key], DEFAULT_MATERIAL_FIELD[key], getParameterLimit(MATERIAL_FIELD_LIMIT_KEYS[key])),
  ])) as MaterialFieldConfig;
}
