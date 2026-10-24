import type { EffectPipelineConfig } from '../types/distortion';
import { isIceOpticallyIdentity, type IceConfig } from '../types/ice';
import { isEffectStackLayerEnabled } from './effectPipeline';
import type { MaterialFieldUniforms } from './materialField';

/**
 * Maximum reference distances of the Ice pass as fractions of the output
 * height (KTD5). They keep the look proportional across resolutions and are
 * shared by the shader uniforms and the tile padding.
 */
export const ICE_REFRACTION_RADIUS = 0.020;
export const ICE_DISPERSION_RADIUS = 0.002;
export const ICE_ROUGHNESS_RADIUS = 0.004;

export type IceSampleRadii = { refraction: number; dispersion: number; roughness: number };

/** Upper bounds, in output pixels, of every source reference made by Ice. */
export function getIceSampleRadii(outputHeight: number): IceSampleRadii {
  const height = Number.isFinite(outputHeight) && outputHeight > 0 ? outputHeight : 1;
  return {
    refraction: ICE_REFRACTION_RADIUS * height,
    dispersion: ICE_DISPERSION_RADIUS * height,
    roughness: ICE_ROUGHNESS_RADIUS * height,
  };
}

/**
 * Pixels a tile must render around its core so Ice never reads outside the
 * tile. It uses the radii at their limits, not the current values, so a key
 * that raises refraction after the first frame still fits.
 */
export function getIceTilePadding(outputHeight: number): number {
  const radii = getIceSampleRadii(outputHeight);
  return Math.ceil(radii.refraction + radii.dispersion + radii.roughness) + 2;
}

type IceScene = {
  ice?: IceConfig;
  effectPipeline: EffectPipelineConfig;
  imageGradientProtected: boolean;
};

/** Whether the Ice pass draws: V2 layer on, not protected, and not an identity mix. */
export function isIceLayerActive(scene: IceScene): boolean {
  return scene.effectPipeline.version === 'stack-v2'
    && !scene.imageGradientProtected
    && !isIceOpticallyIdentity(scene.ice)
    && isEffectStackLayerEnabled(scene.effectPipeline, 'ice');
}

/** Layers that read far from their own pixel and therefore cannot be bounded by a tile margin. */
const REMOTE_REFERENCE_KINDS = ['mirror', 'kaleidoscope'] as const;

export type IceTileRequirement = {
  /** Padding that tiled output must honour exactly; 0 when Ice is inactive. */
  padding: number;
  /** Set when tiled output cannot reproduce this stack with Ice. */
  unsupportedReason: string | null;
};

/**
 * Tiled output with Ice either reserves the full Ice radius or refuses to
 * start. It never falls back to a lower-quality or Ice-free result.
 */
export function getIceTileRequirement(scene: IceScene & { outputHeight: number }): IceTileRequirement {
  if (!isIceLayerActive(scene)) return { padding: 0, unsupportedReason: null };
  const remote = REMOTE_REFERENCE_KINDS.filter(kind => isEffectStackLayerEnabled(scene.effectPipeline, kind));
  return {
    padding: getIceTilePadding(scene.outputHeight),
    unsupportedReason: remote.length > 0
      ? `Tiled output does not support Ice together with ${remote.join(' / ')}, which read pixels outside a tile.`
      : null,
  };
}

function hexToLinearRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  const decode = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [decode((value >> 16) & 0xff), decode((value >> 8) & 0xff), decode(value & 0xff)];
}

export type IceUniformValues = {
  floats: Record<string, number>;
  vec2s: Record<string, [number, number]>;
  vec3s: Record<string, [number, number, number]>;
};

/**
 * Every Ice uniform except the source texture and the viewport, from the
 * evaluated configs. Shared by the renderer and the WebGL fixtures so they
 * can never drive the shader differently.
 */
export function getIceUniformValues(
  ice: IceConfig,
  field: MaterialFieldUniforms,
  iceLightPhase: number,
  outputHeight: number,
): IceUniformValues {
  const radii = getIceSampleRadii(outputHeight);
  return {
    floats: {
      u_mix: ice.mix,
      u_refractionPx: radii.refraction * ice.refraction,
      u_dispersionPx: radii.dispersion * ice.refraction,
      u_roughnessPx: radii.roughness,
      u_roughness: ice.roughness,
      u_roughnessVariation: ice.roughnessVariation,
      u_noiseScale: ice.noiseScale,
      u_bump: ice.bump,
      u_bumpCoverage: ice.bumpCoverage,
      u_bevel: ice.bevel,
      u_microBump: ice.microBump,
      u_highlight: ice.highlight,
      u_backlight: ice.backlight,
      u_reflection: ice.reflection,
      u_ior: ice.ior,
      u_absorption: ice.absorption,
      u_scattering: ice.scattering,
      u_lightAngle: iceLightPhase * Math.PI * 2,
      u_mfSeedZ: field.seedZ,
      u_mfScale: field.scale,
      u_mfThickness: field.thickness,
      u_mfThicknessVariation: field.thicknessVariation,
      u_mfCracks: field.cracks,
      u_mfFrost: field.frost,
      u_mfBubbles: field.bubbles,
      u_mfWarp: field.warp,
      u_mfMorph: field.morph,
      u_mfAngle: field.angle,
    },
    vec2s: { u_mfSeedOffset: field.seedOffset },
    vec3s: {
      u_absorptionColor: hexToLinearRgb(ice.absorptionColor),
      u_scatterColor: hexToLinearRgb(ice.scatterColor),
    },
  };
}
