import type { PostprocessConfig } from '../types/distortion';

export const GLASS_LIMITS = {
  refraction: 120,
  chromaticAberration: 40,
  roughness: 12,
} as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Glass固有形状とNoise Distortionの補間率。
 * 端点で一次・二次導関数が0になるため、99%→100%のような操作でも
 * 残ったGlass勾配が急に消えて屈折方向が跳ねることを防ぐ。
 */
export function smoothGlassNoiseBlend(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getGlassSamplePadding(postprocess: PostprocessConfig | null | undefined): number {
  if (
    !postprocess?.enabled ||
    postprocess.effectMode !== 'glass' ||
    clamp(postprocess.glassMix, 0, 1) <= 0
  ) {
    return 0;
  }

  const refraction = clamp(postprocess.glassRefraction, 0, GLASS_LIMITS.refraction);
  const chromaticAberration = clamp(
    postprocess.glassChromaticAberration,
    0,
    GLASS_LIMITS.chromaticAberration,
  );
  const roughness = clamp(postprocess.glassRoughness, 0, GLASS_LIMITS.roughness);
  return Math.ceil(refraction + chromaticAberration + roughness) + 2;
}
