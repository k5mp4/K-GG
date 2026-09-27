import {
  CONE_APEX_LIMIT,
  CONE_SEAM_MODE_INDEX,
  CONE_SHAPE_INDEX,
  THREE_D_SURFACE_MAPPING_INDEX,
  type ConeViewConfig,
  type ConeSeamMode,
  type CameraWigglePreset,
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
    // Torus uses Rotation as a camera roll (see getThreeDCamera) so the
    // tunnel's bend direction can be chosen. Its texture turns around the tube
    // only through Spin, in whole turns per loop.
    offsetU: config.shape === 'torus'
      ? getTorusSpinOffset(config, time)
      : rotationTurns - Math.floor(rotationTurns),
    // Direct Projection keeps the processed 2D frame fixed on the cone.
    // Flow mode is the only mode that advances the texture from apex to opening.
    offsetV: config.mappingMode === 'projection' ? 0 : time * config.flowCycles,
    seamBlend: config.seamBlend,
    seamMode: config.seamMode,
  };
}

export function getConeShapeIndex(config: ConeViewConfig): number {
  return CONE_SHAPE_INDEX[config.shape];
}

function getTorusSpinOffset(config: ConeViewConfig, normalizedTime: number): number {
  const turns = Math.round(safeFinite(config.spin, 0)) * normalizedTime;
  return turns - Math.floor(turns);
}

/**
 * Whole texture turns around the tube over one full ring. Twist is set per
 * ring tile; rounding the ring total keeps the texture continuous where the
 * ring angle wraps.
 */
export function getTorusTwistTurns(config: ConeViewConfig): number {
  const ringRepeat = Math.max(1, Math.round(safeFinite(config.ringRepeat, 1)));
  return Math.round(safeFinite(config.torusTwist, 0) * ringRepeat);
}

/** Ring radius of the torus when its tube radius is 1. */
export function getTorusMajorRadius(config: ConeViewConfig): number {
  return 1 / Math.max(0.01, Math.min(0.95, safeFinite(config.torusBend, 0.3)));
}

export type ThreeDCamera = {
  /** Offset inside the tube cross-section in camera-right/up tube radii, before roll. */
  offsetX: number;
  offsetY: number;
  yawRadians: number;
  pitchRadians: number;
  /** Base roll (Rotation) plus the wiggle roll. */
  rollRadians: number;
};

/** Keeps the camera clear of the tube wall (radius 1) regardless of direction. */
export const CAMERA_MAX_OFFSET = 0.8;

type WiggleChannel = 'yaw' | 'pitch' | 'roll' | 'x' | 'y';

/**
 * One sinusoid of a wiggle preset. Angles are in degrees and offsets in tube
 * radii. `harmonic` is an integer count of cycles per loop, which makes every
 * preset return to its start value at the loop boundary.
 */
type WiggleTerm = {
  channel: WiggleChannel;
  amplitude: number;
  harmonic: number;
  phase: number;
};

/**
 * A continuous rotation of an angle channel by whole turns per loop. Whole
 * turns close the loop, so Amount does not scale them; Speed multiplies them.
 */
type WiggleSpin = {
  channel: Extract<WiggleChannel, 'yaw' | 'pitch' | 'roll'>;
  turns: number;
};

const CAMERA_WIGGLE_TERMS: Record<CameraWigglePreset, readonly WiggleTerm[]> = {
  off: [],
  // A slow look-around: one wide sweep per loop with a lazy second harmonic.
  drift: [
    { channel: 'yaw', amplitude: 7, harmonic: 1, phase: 0 },
    { channel: 'yaw', amplitude: 2, harmonic: 2, phase: 0.9 },
    { channel: 'pitch', amplitude: 4, harmonic: 1, phase: 1.7 },
    { channel: 'roll', amplitude: 2, harmonic: 1, phase: 2.6 },
  ],
  // Small incommensurate-looking but integer harmonics read as hand shake.
  handheld: [
    { channel: 'yaw', amplitude: 1.1, harmonic: 5, phase: 0.3 },
    { channel: 'yaw', amplitude: 0.6, harmonic: 13, phase: 2.1 },
    { channel: 'pitch', amplitude: 0.9, harmonic: 7, phase: 1.2 },
    { channel: 'pitch', amplitude: 0.5, harmonic: 17, phase: 0.4 },
    { channel: 'roll', amplitude: 0.8, harmonic: 4, phase: 2.8 },
    { channel: 'roll', amplitude: 0.4, harmonic: 11, phase: 1.5 },
    { channel: 'x', amplitude: 0.02, harmonic: 9, phase: 0.7 },
    { channel: 'y', amplitude: 0.02, harmonic: 8, phase: 2.4 },
  ],
  // The camera bobs on a figure-eight inside the tube.
  float: [
    { channel: 'x', amplitude: 0.22, harmonic: 1, phase: 0 },
    { channel: 'y', amplitude: 0.16, harmonic: 2, phase: 0 },
    { channel: 'roll', amplitude: 4, harmonic: 1, phase: Math.PI / 2 },
    { channel: 'pitch', amplitude: 2, harmonic: 2, phase: Math.PI / 2 },
  ],
  // The camera circles the tube center line once per loop.
  orbit: [
    { channel: 'x', amplitude: 0.35, harmonic: 1, phase: Math.PI / 2 },
    { channel: 'y', amplitude: 0.35, harmonic: 1, phase: 0 },
    { channel: 'roll', amplitude: 3, harmonic: 2, phase: 0 },
  ],
  // A rocking barrel roll with a matching sideways drift.
  sway: [
    { channel: 'roll', amplitude: 14, harmonic: 1, phase: 0 },
    { channel: 'x', amplitude: 0.15, harmonic: 1, phase: Math.PI },
    { channel: 'yaw', amplitude: 2, harmonic: 1, phase: Math.PI / 2 },
  ],
  // The look direction turns a full circle while nodding gently, so the
  // camera glances at the walls and behind before facing forward again.
  lookAround: [
    { channel: 'pitch', amplitude: 6, harmonic: 2, phase: 0 },
    { channel: 'roll', amplitude: 3, harmonic: 1, phase: Math.PI / 2 },
  ],
};

const CAMERA_WIGGLE_SPINS: Partial<Record<CameraWigglePreset, readonly WiggleSpin[]>> = {
  lookAround: [{ channel: 'yaw', turns: 1 }],
};

export type CameraWiggle = Record<WiggleChannel, number>;

/**
 * Evaluates the wiggle preset at a loop-normalized time. Amplitudes are
 * scaled by Amount and harmonics and spins by the integer Speed, so time 0 and
 * 1 give identical values (angles modulo a full turn) and the camera motion
 * loops seamlessly.
 */
export function getCameraWiggle(config: ConeViewConfig, normalizedTime: number): CameraWiggle {
  const wiggle: CameraWiggle = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0 };
  const terms = CAMERA_WIGGLE_TERMS[config.wigglePreset] ?? CAMERA_WIGGLE_TERMS.off;
  const spins = CAMERA_WIGGLE_SPINS[config.wigglePreset] ?? [];
  const amount = Math.max(0, safeFinite(config.wiggleAmount, 1));
  const speed = Math.max(1, Math.round(safeFinite(config.wiggleSpeed, 1)));
  const time = safeFinite(normalizedTime, 0);
  for (const spin of spins) {
    // Keep the angle in [0, 360) so the end of the loop equals its start.
    const turns = spin.turns * speed * time;
    wiggle[spin.channel] += (turns - Math.floor(turns)) * 360;
  }
  if (amount === 0) return wiggle;
  for (const term of terms) {
    wiggle[term.channel] += amount * term.amplitude
      * Math.sin(2 * Math.PI * term.harmonic * speed * time + term.phase);
  }
  return wiggle;
}

export function getThreeDCamera(config: ConeViewConfig, normalizedTime = 0): ThreeDCamera {
  const wiggle = getCameraWiggle(config, normalizedTime);
  let offsetX = safeFinite(config.cameraX, 0) + wiggle.x;
  let offsetY = safeFinite(config.cameraY, 0) + wiggle.y;
  const length = Math.hypot(offsetX, offsetY);
  if (length > CAMERA_MAX_OFFSET) {
    offsetX *= CAMERA_MAX_OFFSET / length;
    offsetY *= CAMERA_MAX_OFFSET / length;
  }
  const degrees = Math.PI / 180;
  return {
    offsetX,
    offsetY,
    yawRadians: (safeFinite(config.cameraYaw, 0) + wiggle.yaw) * degrees,
    pitchRadians: (safeFinite(config.cameraPitch, 0) + wiggle.pitch) * degrees,
    rollRadians: (safeFinite(config.rotation, 0) + wiggle.roll) * degrees,
  };
}

/** Every uniform value of the dedicated 3D program, independent of WebGL. */
export type ThreeDRenderParams = {
  shape: number;
  surfaceMapping: number;
  fog: number;
  shade: number;
  /** Loop-normalized geometric motion (in shape-specific units), 0 when fixed. */
  travel: number;
  tangentHalfFov: number;
  textureRepeat: number;
  textureOffset: [number, number];
  seamBlend: number;
  seamMode: number;
  camera: ThreeDCamera;
  cone: {
    cameraDistance: number;
    depth: number;
    apertureRadius: number;
    apexOffset: [number, number];
  };
  torus: {
    majorRadius: number;
    ringRepeat: number;
    twistTurns: number;
  };
};

export function getThreeDRenderParams(
  config: ConeViewConfig,
  normalizedTime: number,
  aspect: number,
): ThreeDRenderParams {
  const transform = getConeTextureTransform(config, normalizedTime);
  const safeAspect = Math.max(0.001, safeFinite(aspect, 1));
  const apexOffset = getConeApexOffset(CONE_CAMERA_DISTANCE, config.depth, safeAspect, config.apexX, config.apexY);
  const camera = getThreeDCamera(config, normalizedTime);
  return {
    shape: getConeShapeIndex(config),
    surfaceMapping: THREE_D_SURFACE_MAPPING_INDEX[config.surfaceMapping] ?? 0,
    fog: clamp(safeFinite(config.fog, 0), 0, 1),
    shade: clamp(safeFinite(config.shade, 0), 0, 1),
    travel: 0,
    tangentHalfFov: Math.tan(CONE_CAMERA_FOV * Math.PI / 360),
    textureRepeat: transform.repeatU,
    textureOffset: [transform.offsetU, transform.offsetV],
    seamBlend: transform.seamBlend,
    seamMode: CONE_SEAM_MODE_INDEX[transform.seamMode],
    // The Cone keeps Rotation as a texture offset, so it does not roll.
    camera: config.shape === 'cone' ? { ...camera, rollRadians: 0 } : camera,
    cone: {
      cameraDistance: CONE_CAMERA_DISTANCE,
      depth: config.depth,
      apertureRadius: getConeApertureRadius(CONE_CAMERA_DISTANCE, safeAspect),
      apexOffset: [apexOffset.x, apexOffset.y],
    },
    torus: {
      majorRadius: getTorusMajorRadius(config),
      ringRepeat: config.ringRepeat,
      twistTurns: getTorusTwistTurns(config),
    },
  };
}

export function getConeSeamModeIndex(mode: ConeSeamMode): number {
  return CONE_SEAM_MODE_INDEX[mode];
}
