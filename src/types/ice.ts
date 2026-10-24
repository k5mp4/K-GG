import { clampParameter, getParameterDefault, getParameterLimit, type ParameterLimitKey } from '../lib/parameterLimits';

/**
 * Ice: an Effect Stack layer that treats the previous texture as the scene
 * seen through a thin full-screen ice sheet. Its structure (thickness, cracks,
 * frost, bubbles, surface) comes from the shared `materialField`; this config
 * only holds the optical response, so Ice and the Gradient never keep
 * separate copies of the structure.
 */
export type IceConfig = {
  enabled: boolean;
  /** Blend of the ice result over the untouched input. 0 is an identity pass. */
  mix: number;
  /** Strength of the refracted displacement, bounded by the KTD5 radius. */
  refraction: number;
  /** Mean surface roughness: blur, haze, and highlight spread. */
  roughness: number;
  /** Contrast of the roughness map: 0 is uniform, 1 mixes glossy and frosted patches. */
  roughnessVariation: number;
  /** Cells per screen height of the surface noise texture. */
  noiseScale: number;
  /** Height of the raised (partly melted) areas of the bump map. */
  bump: number;
  /** Share of the surface that is raised. */
  bumpCoverage: number;
  /** Roundness of the raised edges; 0 is a sharp step. */
  bevel: number;
  /** Fine grain over the whole surface. */
  microBump: number;
  /** Sharp specular highlight from the front light. */
  highlight: number;
  /** Light passing through the sheet from behind, glowing at slopes and cracks. */
  backlight: number;
  /** Strength of the procedural environment reflection. */
  reflection: number;
  /** Index of refraction. Independent from Glass. */
  ior: number;
  /** Absorption coefficient per relative optical distance. */
  absorption: number;
  /** Scattering coefficient per relative optical distance of the inner structure. */
  scattering: number;
  /** Colour light keeps after one unit of absorption; white absorbs nothing. */
  absorptionColor: string;
  /** Colour of light scattered by cracks, frost, and bubbles. */
  scatterColor: string;
  /** Whole turns of the procedural light per loop. */
  lightCycles: number;
  /** Light phase offset in turns. */
  lightPhase: number;
};

type IceNumericKey = {
  [Key in keyof IceConfig]: IceConfig[Key] extends number ? Key : never
}[keyof IceConfig];

export const ICE_LIMIT_KEYS = {
  mix: 'ice.mix',
  refraction: 'ice.refraction',
  roughness: 'ice.roughness',
  roughnessVariation: 'ice.roughnessVariation',
  noiseScale: 'ice.noiseScale',
  bump: 'ice.bump',
  bumpCoverage: 'ice.bumpCoverage',
  bevel: 'ice.bevel',
  microBump: 'ice.microBump',
  highlight: 'ice.highlight',
  backlight: 'ice.backlight',
  reflection: 'ice.reflection',
  ior: 'ice.ior',
  absorption: 'ice.absorption',
  scattering: 'ice.scattering',
  lightCycles: 'ice.lightCycles',
  lightPhase: 'ice.lightPhase',
} as const satisfies Record<IceNumericKey, ParameterLimitKey>;

const ICE_NUMERIC_KEYS = Object.keys(ICE_LIMIT_KEYS) as IceNumericKey[];

export const ICE_COLOR_KEYS = ['absorptionColor', 'scatterColor'] as const;

export const DEFAULT_ICE: IceConfig = {
  enabled: false,
  ...Object.fromEntries(ICE_NUMERIC_KEYS.map(key => [key, getParameterDefault(ICE_LIMIT_KEYS[key])])) as Pick<IceConfig, IceNumericKey>,
  absorptionColor: '#BFE0F5',
  scatterColor: '#F2F8FF',
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value.toUpperCase() : fallback;
}

export function normalizeIceConfig(value: unknown): IceConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof IceConfig, unknown>>
    : {};
  const config: IceConfig = {
    ...DEFAULT_ICE,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_ICE.enabled,
    absorptionColor: normalizeColor(raw.absorptionColor, DEFAULT_ICE.absorptionColor),
    scatterColor: normalizeColor(raw.scatterColor, DEFAULT_ICE.scatterColor),
  };
  for (const key of ICE_NUMERIC_KEYS) {
    config[key] = clampParameter(raw[key], DEFAULT_ICE[key], getParameterLimit(ICE_LIMIT_KEYS[key]));
  }
  return config;
}

/** Mix 0 leaves the input untouched, so the pass and its program are skipped. */
export function isIceOpticallyIdentity(ice: Pick<IceConfig, 'mix'> | null | undefined): boolean {
  return !ice || !(ice.mix > 1e-4);
}
