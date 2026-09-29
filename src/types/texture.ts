import {
  clampParameter,
  getEnumParameterDefault,
  getEnumParameterLimit,
  getParameterDefault,
  getParameterLimit,
  normalizeEnumParameter,
  wrapAngleDegrees,
  type ParameterLimitKey,
} from '../lib/parameterLimits';

/**
 * SANDBOX Texture: a material stage that lights the finished Main Stack image
 * with a height field. The field is either a built-in procedural pattern or a
 * loaded image, and the reflection is anisotropic (Ward) with an optional
 * diffraction rainbow, which covers brushed metal, spun metal, CD surfaces
 * and paper.
 */
export type TextureSource = 'procedural' | 'image';

export type TexturePreset = 'brushedMetal' | 'spunMetal' | 'cdGroove' | 'paper';

/** `cover` fits the image to the canvas, `tile` repeats it `scale` times. */
export type TextureImageFit = 'cover' | 'tile';

export const TEXTURE_SOURCES = getEnumParameterLimit('texture.source').values as readonly TextureSource[];
export const TEXTURE_PRESETS = getEnumParameterLimit('texture.preset').values as readonly TexturePreset[];
export const TEXTURE_IMAGE_FITS = getEnumParameterLimit('texture.imageFit').values as readonly TextureImageFit[];

export type TextureConfig = {
  enabled: boolean;
  source: TextureSource;
  preset: TexturePreset;
  imageFit: TextureImageFit;
  /** Blend of the lit result over the untouched Main Stack image. */
  strength: number;
  /** Pattern frequency multiplier, or the repeat count of a tiled image. */
  scale: number;
  /** Grain direction in degrees. Radial presets follow the disc instead. */
  rotation: number;
  /** Relief height. Negative values invert the height field. */
  bump: number;
  /** Centre of the concentric presets in canvas coordinates. */
  centerX: number;
  centerY: number;
  roughness: number;
  /** 0 = round highlight, 1 = highlight stretched across the grain. */
  anisotropy: number;
  /** 0 = white highlight over the base colour, 1 = highlight tinted by it. */
  metallic: number;
  specular: number;
  lightAngle: number;
  lightHeight: number;
  /** Full turns of the light around the canvas per animation loop. */
  lightSweep: number;
  /** Strength of the grating rainbow along the groove normal. */
  diffraction: number;
  diffractionSpread: number;
};

type TextureNumericKey = {
  [Key in keyof TextureConfig]: TextureConfig[Key] extends number ? Key : never
}[keyof TextureConfig];

export const TEXTURE_LIMIT_KEYS: Record<TextureNumericKey, ParameterLimitKey> = {
  strength: 'texture.strength',
  scale: 'texture.scale',
  rotation: 'texture.rotation',
  bump: 'texture.bump',
  centerX: 'texture.centerX',
  centerY: 'texture.centerY',
  roughness: 'texture.roughness',
  anisotropy: 'texture.anisotropy',
  metallic: 'texture.metallic',
  specular: 'texture.specular',
  lightAngle: 'texture.lightAngle',
  lightHeight: 'texture.lightHeight',
  lightSweep: 'texture.lightSweep',
  diffraction: 'texture.diffraction',
  diffractionSpread: 'texture.diffractionSpread',
};

const TEXTURE_NUMERIC_KEYS = Object.keys(TEXTURE_LIMIT_KEYS) as TextureNumericKey[];

export const DEFAULT_TEXTURE: TextureConfig = {
  enabled: false,
  source: getEnumParameterDefault('texture.source'),
  preset: getEnumParameterDefault('texture.preset'),
  imageFit: getEnumParameterDefault('texture.imageFit'),
  strength: getParameterDefault('texture.strength'),
  scale: getParameterDefault('texture.scale'),
  rotation: getParameterDefault('texture.rotation'),
  bump: getParameterDefault('texture.bump'),
  centerX: getParameterDefault('texture.centerX'),
  centerY: getParameterDefault('texture.centerY'),
  roughness: getParameterDefault('texture.roughness'),
  anisotropy: getParameterDefault('texture.anisotropy'),
  metallic: getParameterDefault('texture.metallic'),
  specular: getParameterDefault('texture.specular'),
  lightAngle: getParameterDefault('texture.lightAngle'),
  lightHeight: getParameterDefault('texture.lightHeight'),
  lightSweep: getParameterDefault('texture.lightSweep'),
  diffraction: getParameterDefault('texture.diffraction'),
  diffractionSpread: getParameterDefault('texture.diffractionSpread'),
};

/** Whether the preset's grain follows a disc around the centre instead of `rotation`. */
export function isRadialTexturePreset(preset: TexturePreset): boolean {
  return preset === 'spunMetal' || preset === 'cdGroove';
}

type TexturePresetLook = Partial<Pick<TextureConfig,
  | 'strength' | 'scale' | 'bump' | 'roughness' | 'anisotropy' | 'metallic' | 'specular'
  | 'lightAngle' | 'lightHeight' | 'diffraction' | 'diffractionSpread'
>>;

/** Starting look applied when the user picks a preset. It never touches enabled/source/image. */
export const TEXTURE_PRESET_LOOKS: Record<TexturePreset, Required<TexturePresetLook>> = {
  brushedMetal: {
    strength: 0.85, scale: 1, bump: 0.6, roughness: 0.3, anisotropy: 0.75, metallic: 0.7,
    specular: 1, lightAngle: 40, lightHeight: 0.55, diffraction: 0, diffractionSpread: 1,
  },
  spunMetal: {
    strength: 0.85, scale: 1, bump: 0.5, roughness: 0.28, anisotropy: 0.85, metallic: 0.8,
    specular: 1.1, lightAngle: 30, lightHeight: 0.5, diffraction: 0, diffractionSpread: 1,
  },
  cdGroove: {
    strength: 0.9, scale: 1, bump: 0.35, roughness: 0.22, anisotropy: 0.95, metallic: 0.9,
    specular: 1, lightAngle: 35, lightHeight: 0.45, diffraction: 0.85, diffractionSpread: 1.2,
  },
  paper: {
    strength: 0.7, scale: 1, bump: 0.7, roughness: 0.85, anisotropy: 0, metallic: 0,
    specular: 0.2, lightAngle: 45, lightHeight: 0.8, diffraction: 0, diffractionSpread: 1,
  },
};

/** Returns the patch a preset switch applies on top of the current config. */
export function getTexturePresetPatch(preset: TexturePreset): Partial<TextureConfig> {
  return { preset, ...TEXTURE_PRESET_LOOKS[preset] };
}

export function normalizeTextureConfig(value: unknown): TextureConfig {
  const raw = typeof value === 'object' && value !== null
    ? value as Partial<Record<keyof TextureConfig, unknown>>
    : {};
  const config: TextureConfig = {
    ...DEFAULT_TEXTURE,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_TEXTURE.enabled,
    source: normalizeEnumParameter('texture.source', raw.source),
    preset: normalizeEnumParameter('texture.preset', raw.preset),
    imageFit: normalizeEnumParameter('texture.imageFit', raw.imageFit),
  };
  for (const key of TEXTURE_NUMERIC_KEYS) {
    config[key] = clampParameter(raw[key], DEFAULT_TEXTURE[key], getParameterLimit(TEXTURE_LIMIT_KEYS[key]));
  }
  return config;
}

/**
 * Light azimuth in degrees at a normalized animation time. Whole-turn sweeps
 * return to the start angle at time 1, so exported loops close seamlessly.
 */
export function resolveTextureLightAngle(config: TextureConfig, normalizedTime: number): number {
  const time = Number.isFinite(normalizedTime) ? normalizedTime : 0;
  return wrapAngleDegrees(config.lightAngle + config.lightSweep * 360 * time);
}
