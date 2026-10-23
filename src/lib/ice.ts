import type { EffectPipelineConfig } from '../types/distortion';
import { isIceOpticallyIdentity, type IceConfig } from '../types/ice';
import { isEffectStackLayerEnabled } from './effectPipeline';

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
