export type ParameterLimit = {
  min: number;
  max: number;
  step: number;
  integer?: boolean;
  angleUnit?: 'degrees' | 'radians';
  wrapAngle?: boolean;
};

export const PARAMETER_LIMITS = {
  angleDegrees: { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  angleRadians: { min: 0, max: Math.PI * 2, step: Math.PI / 180, angleUnit: 'radians', wrapAngle: true },
  'diffuse.scatter': { min: 0, max: 300, step: 1 },
  'diffuse.grain': { min: 0.01, max: 5, step: 0.01 },
  'diffuse.ditherGrain': { min: 0.01, max: 12, step: 0.01 },
  'diffuse.seed': { min: 0, max: 99, step: 1, integer: true },
  'diffuse.ditherThreshold': { min: 0, max: 1, step: 0.01 },
  'noise.dwRotAngle1': { min: 0, max: Math.PI * 2, step: Math.PI / 180, angleUnit: 'radians', wrapAngle: true },
  'noise.dwRotAngle2': { min: 0, max: Math.PI * 2, step: Math.PI / 180, angleUnit: 'radians', wrapAngle: true },
  'noise.dwDriftAngle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'noise.aeSubRotation': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'slit.angle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'slit.offsetAngle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'gradient.angle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'normalMap.angle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'radon.angle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'iridescence.angle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.kaleidoscopeRotation': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.voronoiAngle': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.glassRotation': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.particleDirection': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'animation.direction': { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  'animation.speed': { min: 0.01, max: 8, step: 0.01 },
} as const satisfies Record<string, ParameterLimit>;

export type ParameterLimitKey = keyof typeof PARAMETER_LIMITS;

export function getParameterLimit(key: ParameterLimitKey): ParameterLimit {
  return PARAMETER_LIMITS[key];
}

export function wrapAngleDegrees(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

export function wrapAngleRadians(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const tau = Math.PI * 2;
  return ((value % tau) + tau) % tau;
}

export function clampParameter(value: unknown, fallback: number, limit: ParameterLimit): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (limit.wrapAngle) {
    return limit.angleUnit === 'radians' ? wrapAngleRadians(value) : wrapAngleDegrees(value);
  }
  const clamped = Math.min(limit.max, Math.max(limit.min, value));
  return limit.integer ? Math.round(clamped) : clamped;
}

export function normalizePartialNumericConfig<T extends Record<string, unknown>>(
  value: T,
  defaults: T,
  limits: Partial<Record<keyof T, ParameterLimit>>,
): T {
  const next = { ...defaults, ...value } as T;
  for (const key of Object.keys(limits) as Array<keyof T>) {
    const limit = limits[key];
    if (!limit) continue;
    next[key] = clampParameter(next[key], defaults[key] as number, limit) as T[keyof T];
  }
  return next;
}

const TRACK_LIMIT_KEYS: Record<string, ParameterLimitKey> = {
  'gradient.angle': 'gradient.angle',
  'noiseDistortion.dwRotAngle1': 'noise.dwRotAngle1',
  'noiseDistortion.dwRotAngle2': 'noise.dwRotAngle2',
  'noiseDistortion.dwDriftAngle': 'noise.dwDriftAngle',
  'noiseDistortion.aeSubRotation': 'noise.aeSubRotation',
  'slitScan.angle': 'slit.angle',
  'slitScan.offsetAngle': 'slit.offsetAngle',
  'normalMap.angle': 'normalMap.angle',
  'radon.angle': 'radon.angle',
  'iridescence.angle': 'iridescence.angle',
  'postprocess.kaleidoscopeRotation': 'postprocess.kaleidoscopeRotation',
  'postprocess.voronoiAngle': 'postprocess.voronoiAngle',
  'postprocess.glassRotation': 'postprocess.glassRotation',
  'postprocess.particleDirection': 'postprocess.particleDirection',
  'animation.direction': 'animation.direction',
  'animation.speed': 'animation.speed',
};

export function normalizeTrackValue(trackId: string, value: number): number {
  const key = TRACK_LIMIT_KEYS[trackId];
  return key ? clampParameter(value, 0, PARAMETER_LIMITS[key]) : Number.isFinite(value) ? value : 0;
}
