import {
  CONE_APEX_LIMIT,
  CONE_SEAM_MODES,
  type ConeViewConfig,
  type ConeSeamMode,
} from '../types/coneView';

export const CONE_CAMERA_DISTANCE = 1.25;
export const CONE_CAMERA_FOV = 60;
export const CONE_APERTURE_OVERSCAN = 1.08;
export { CONE_APEX_LIMIT } from '../types/coneView';

export type ConeTextureTransform = {
  repeatU: number;
  offsetU: number;
  offsetV: number;
  seamBlend: number;
  seamMode: ConeSeamMode;
};

export type ConeApexOffset = {
  x: number;
  y: number;
};

export type ConeApexCanvasPoint = {
  x: number;
  y: number;
};

function safeFinite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getConeApertureRadius(
  cameraDistance: number,
  aspect: number,
  overscan = CONE_APERTURE_OVERSCAN,
): number {
  const safeDistance = Math.max(0.001, safeFinite(cameraDistance, CONE_CAMERA_DISTANCE));
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const halfHeight = safeDistance * Math.tan(CONE_CAMERA_FOV * Math.PI / 360);
  const halfWidth = halfHeight * safeAspect;
  return Math.hypot(halfWidth, halfHeight) * Math.max(1, safeFinite(overscan, 1));
}

export function getConeApexOffset(
  cameraDistance: number,
  depth: number,
  aspect: number,
  apexX: number,
  apexY: number,
): ConeApexOffset {
  const safeDistance = Math.max(0.001, safeFinite(cameraDistance, CONE_CAMERA_DISTANCE));
  const safeDepth = Math.max(0.001, safeFinite(depth, 6));
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const apexDistance = safeDistance + safeDepth;
  const halfHeight = apexDistance * Math.tan(CONE_CAMERA_FOV * Math.PI / 360);
  const halfWidth = halfHeight * safeAspect;
  return {
    x: clamp(safeFinite(apexX, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * halfWidth,
    y: clamp(safeFinite(apexY, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * halfHeight,
  };
}

/** Converts the normalized apex offset into the CSS canvas coordinate system. */
export function getConeApexCanvasPoint(
  width: number,
  height: number,
  apexX: number,
  apexY: number,
): ConeApexCanvasPoint {
  const safeWidth = Math.max(1, safeFinite(width, 1));
  const safeHeight = Math.max(1, safeFinite(height, 1));
  return {
    x: safeWidth * (0.5 + clamp(safeFinite(apexX, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * 0.5),
    y: safeHeight * (0.5 - clamp(safeFinite(apexY, 0), -CONE_APEX_LIMIT, CONE_APEX_LIMIT) * 0.5),
  };
}

export function getConeTextureTransform(
  config: ConeViewConfig,
  normalizedTime: number,
): ConeTextureTransform {
  const time = Number.isFinite(normalizedTime) ? Math.max(0, Math.min(1, normalizedTime)) : 0;
  const rotationTurns = config.rotation / 360;
  return {
    repeatU: config.textureRepeat,
    offsetU: rotationTurns - Math.floor(rotationTurns),
    // Direct Projection keeps the processed 2D frame fixed on the cone.
    // Flow mode is the only mode that advances the texture from apex to opening.
    offsetV: config.mappingMode === 'projection' ? 0 : time * config.flowCycles,
    seamBlend: config.seamBlend,
    seamMode: config.seamMode,
  };
}

export function getConeSeamModeIndex(mode: ConeSeamMode): number {
  return CONE_SEAM_MODES.indexOf(mode);
}
