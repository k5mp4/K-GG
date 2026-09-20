export type VideoMotionMode = 'feedback';

export type VideoMotionConfig = {
  enabled: boolean;
  mode: VideoMotionMode;
  effectStrength: number;
  blendAmount: number;
  motionDamping: number;
  fieldSmoothing: number;
  feedbackAmount: number;
  decay: number;
  smearLength: number;
  stabilization: number;
};

export const VIDEO_MOTION_DEFAULTS: VideoMotionConfig = {
  enabled: false,
  mode: 'feedback',
  effectStrength: 0.75,
  blendAmount: 0.8,
  motionDamping: 0.35,
  fieldSmoothing: 0.45,
  feedbackAmount: 0.72,
  decay: 0.86,
  smearLength: 0.65,
  stabilization: 0.35,
};

function bounded(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function normalizeVideoMotionConfig(value: unknown): VideoMotionConfig {
  const raw = value && typeof value === 'object' ? value as Partial<VideoMotionConfig> : {};
  return {
    enabled: raw.enabled === true,
    // Legacy presets may contain one of the removed experimental modes.
    // Video Motion now has one stable behavior, so every value normalizes to it.
    mode: 'feedback',
    effectStrength: bounded(raw.effectStrength, VIDEO_MOTION_DEFAULTS.effectStrength, 0, 1),
    blendAmount: bounded(raw.blendAmount, VIDEO_MOTION_DEFAULTS.blendAmount, 0, 1),
    motionDamping: bounded(raw.motionDamping, VIDEO_MOTION_DEFAULTS.motionDamping, 0, 0.95),
    fieldSmoothing: bounded(raw.fieldSmoothing, VIDEO_MOTION_DEFAULTS.fieldSmoothing, 0, 0.95),
    feedbackAmount: bounded(raw.feedbackAmount, VIDEO_MOTION_DEFAULTS.feedbackAmount, 0, 1),
    decay: bounded(raw.decay, VIDEO_MOTION_DEFAULTS.decay, 0, 0.99),
    smearLength: bounded(raw.smearLength, VIDEO_MOTION_DEFAULTS.smearLength, 0, 2),
    stabilization: bounded(raw.stabilization, VIDEO_MOTION_DEFAULTS.stabilization, 0, 0.95),
  };
}
