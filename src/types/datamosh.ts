/**
 * Datamosh Effect Stack layer: GPU feedback that re-uses the previous output
 * as a motion-compensated "P-frame" reference. The motion field is estimated
 * from the animated layer input (optical flow), generated procedurally,
 * taken from the decoded Video Motion source, or fixed to one direction so
 * bright pixels grow into streaks that stay drawn (Pixel Stretch).
 */
export type DatamoshMotionSource = 'animation' | 'procedural' | 'video' | 'pixelStretch';

/** How the motion-compensated history is combined with the current frame. */
export type DatamoshMixMode = 'mix' | 'lighten' | 'difference' | 'rampLock';

export const DATAMOSH_MOTION_SOURCES = ['animation', 'procedural', 'video', 'pixelStretch'] as const satisfies readonly DatamoshMotionSource[];
export const DATAMOSH_MIX_MODES = ['mix', 'lighten', 'difference', 'rampLock'] as const satisfies readonly DatamoshMixMode[];

export type DatamoshConfig = {
  enabled: boolean;
  motionSource: DatamoshMotionSource;
  mixMode: DatamoshMixMode;
  /** History displacement along the motion vector per frame. */
  strength: number;
  /** Fraction of macroblocks that receive a clean current-frame update (intra refresh). */
  refresh: number;
  /** Weight of the motion-compensated history inside non-refreshed blocks. */
  feedback: number;
  /** Macroblock edge length in output pixels. 1 disables quantization. */
  blockSize: number;
  /** 1 = every pixel follows its macroblock vector, 0 = per-pixel motion only. */
  blockLock: number;
  /** Probability that a macroblock is merged or split into irregular partitions. */
  blockVariance: number;
  /** How much brighter history pixels lengthen (negative: shorten) the drag. */
  lumaStretch: number;
  /** How much more saturated history pixels lengthen (negative: shorten) the drag. */
  saturationStretch: number;
  motionScale: number;
  motionSpeed: number;
  glitchAmount: number;
  /** Blocks whose hash is above this value are corrupted. Higher = fewer blocks. */
  glitchThreshold: number;
  neighborMix: number;
  jitter: number;
  useColorDrift: boolean;
  /** Stops writing the history buffer; the held history keeps being displaced. */
  freeze: boolean;
  /** Video source only: temporal damping of the estimated vectors. */
  videoMotionDamping: number;
  /** Video source only: spatial smoothing of the estimated field. */
  videoFieldSmoothing: number;
  /** Pixel Stretch source only: streak direction in degrees, counterclockwise from +x (0 = right, 90 = up). */
  pixelStretchAngle: number;
  /** Pixel Stretch source only: how far a streak may grow from a live anchor, in output pixels. */
  pixelStretchLength: number;
  /** Pixel Stretch source only: pixels at or above this luma are anchors and stretched streaks. */
  pixelStretchThreshold: number;
  /** Random per-band shortening of the streak length (bands are Block Size wide). */
  pixelStretchVariance: number;
  /** Pixel Stretch source only: how far the direction follows a curl-noise field instead of Angle (0 = one fixed direction). */
  pixelStretchCurl: number;
  /** Pixel Stretch source only: spatial frequency of the curl field (higher = tighter swirls). */
  pixelStretchCurlScale: number;
  /** Pixel Stretch source only: whole cycles the curl field evolves per timeline loop, so exports close seamlessly (0 = static). */
  pixelStretchCurlLoops: number;
};

type DatamoshNumericKey = {
  [Key in keyof DatamoshConfig]: DatamoshConfig[Key] extends number ? Key : never
}[keyof DatamoshConfig];

export type DatamoshRange = { min: number; max: number; step: number };

export const DATAMOSH_RANGES: Record<DatamoshNumericKey, DatamoshRange> = {
  strength: { min: 0, max: 2, step: 0.01 },
  refresh: { min: 0, max: 1, step: 0.01 },
  feedback: { min: 0, max: 0.995, step: 0.005 },
  blockSize: { min: 1, max: 128, step: 1 },
  blockLock: { min: 0, max: 1, step: 0.01 },
  blockVariance: { min: 0, max: 1, step: 0.01 },
  lumaStretch: { min: -2, max: 2, step: 0.01 },
  saturationStretch: { min: -2, max: 2, step: 0.01 },
  motionScale: { min: 0.1, max: 8, step: 0.05 },
  motionSpeed: { min: 0, max: 4, step: 0.01 },
  glitchAmount: { min: 0, max: 1, step: 0.01 },
  glitchThreshold: { min: 0, max: 1, step: 0.01 },
  neighborMix: { min: 0, max: 1, step: 0.01 },
  jitter: { min: 0, max: 1, step: 0.01 },
  videoMotionDamping: { min: 0, max: 0.95, step: 0.01 },
  videoFieldSmoothing: { min: 0, max: 0.95, step: 0.01 },
  pixelStretchAngle: { min: 0, max: 360, step: 1 },
  pixelStretchLength: { min: 1, max: 2048, step: 1 },
  pixelStretchThreshold: { min: 0, max: 1, step: 0.01 },
  pixelStretchVariance: { min: 0, max: 1, step: 0.01 },
  pixelStretchCurl: { min: 0, max: 1, step: 0.01 },
  pixelStretchCurlScale: { min: 0.25, max: 8, step: 0.05 },
  pixelStretchCurlLoops: { min: 0, max: 8, step: 1 },
};

export const DATAMOSH_DEFAULTS: DatamoshConfig = {
  enabled: false,
  motionSource: 'animation',
  mixMode: 'mix',
  strength: 0.6,
  refresh: 0.04,
  feedback: 0.94,
  blockSize: 16,
  blockLock: 0.6,
  blockVariance: 0.5,
  lumaStretch: 0.8,
  saturationStretch: 0.5,
  motionScale: 1.5,
  motionSpeed: 0.6,
  glitchAmount: 0.35,
  glitchThreshold: 0.72,
  neighborMix: 0.3,
  jitter: 0.15,
  useColorDrift: false,
  freeze: false,
  videoMotionDamping: 0.35,
  videoFieldSmoothing: 0.45,
  pixelStretchAngle: 0,
  pixelStretchLength: 240,
  pixelStretchThreshold: 0.6,
  pixelStretchVariance: 0.5,
  pixelStretchCurl: 0,
  pixelStretchCurlScale: 1.5,
  pixelStretchCurlLoops: 1,
};

function bounded(value: unknown, key: DatamoshNumericKey): number {
  const range = DATAMOSH_RANGES[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return DATAMOSH_DEFAULTS[key];
  return Math.min(range.max, Math.max(range.min, value));
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : fallback;
}

export function normalizeDatamoshConfig(value: unknown): DatamoshConfig {
  const raw = value && typeof value === 'object' ? value as Partial<Record<keyof DatamoshConfig, unknown>> : {};
  return {
    enabled: raw.enabled === true,
    motionSource: oneOf(raw.motionSource, DATAMOSH_MOTION_SOURCES, DATAMOSH_DEFAULTS.motionSource),
    mixMode: oneOf(raw.mixMode, DATAMOSH_MIX_MODES, DATAMOSH_DEFAULTS.mixMode),
    strength: bounded(raw.strength, 'strength'),
    refresh: bounded(raw.refresh, 'refresh'),
    feedback: bounded(raw.feedback, 'feedback'),
    blockSize: Math.round(bounded(raw.blockSize, 'blockSize')),
    blockLock: bounded(raw.blockLock, 'blockLock'),
    blockVariance: bounded(raw.blockVariance, 'blockVariance'),
    lumaStretch: bounded(raw.lumaStretch, 'lumaStretch'),
    saturationStretch: bounded(raw.saturationStretch, 'saturationStretch'),
    motionScale: bounded(raw.motionScale, 'motionScale'),
    motionSpeed: bounded(raw.motionSpeed, 'motionSpeed'),
    glitchAmount: bounded(raw.glitchAmount, 'glitchAmount'),
    glitchThreshold: bounded(raw.glitchThreshold, 'glitchThreshold'),
    neighborMix: bounded(raw.neighborMix, 'neighborMix'),
    jitter: bounded(raw.jitter, 'jitter'),
    useColorDrift: raw.useColorDrift === true,
    freeze: raw.freeze === true,
    videoMotionDamping: bounded(raw.videoMotionDamping, 'videoMotionDamping'),
    videoFieldSmoothing: bounded(raw.videoFieldSmoothing, 'videoFieldSmoothing'),
    pixelStretchAngle: bounded(raw.pixelStretchAngle, 'pixelStretchAngle'),
    pixelStretchLength: bounded(raw.pixelStretchLength, 'pixelStretchLength'),
    pixelStretchThreshold: bounded(raw.pixelStretchThreshold, 'pixelStretchThreshold'),
    pixelStretchVariance: bounded(raw.pixelStretchVariance, 'pixelStretchVariance'),
    pixelStretchCurl: bounded(raw.pixelStretchCurl, 'pixelStretchCurl'),
    pixelStretchCurlScale: bounded(raw.pixelStretchCurlScale, 'pixelStretchCurlScale'),
    pixelStretchCurlLoops: Math.round(bounded(raw.pixelStretchCurlLoops, 'pixelStretchCurlLoops')),
  };
}

function legacyNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/**
 * Converts the removed `Video Motion` settings (Motion Feedback) into the
 * equivalent Datamosh settings: video motion source, Gradient Ramp
 * lock, no macroblocks and no corruption. `enabled` is decided by the caller
 * because the V2 on/off state lives in the Effect Stack layer.
 */
export function datamoshFromLegacyVideoMotion(value: unknown, enabled: boolean): DatamoshConfig {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const effectStrength = legacyNumber(raw.effectStrength, 0.75, 0, 1);
  const blendAmount = legacyNumber(raw.blendAmount, 0.8, 0, 1);
  const feedbackAmount = legacyNumber(raw.feedbackAmount, 0.72, 0, 1);
  const decay = legacyNumber(raw.decay, 0.86, 0, 0.99);
  const smearLength = legacyNumber(raw.smearLength, 0.65, 0, 2);
  // Motion Feedback capped the history contribution at 82% before the blend.
  const historyWeight = Math.min(feedbackAmount * decay, 0.82) * blendAmount * effectStrength;
  return normalizeDatamoshConfig({
    ...DATAMOSH_DEFAULTS,
    enabled,
    motionSource: 'video',
    mixMode: 'rampLock',
    strength: smearLength * effectStrength,
    refresh: 0,
    feedback: historyWeight,
    blockSize: 1,
    blockLock: 1,
    blockVariance: 0,
    lumaStretch: 0,
    saturationStretch: 0,
    glitchAmount: 0,
    neighborMix: 0,
    jitter: 0,
    videoMotionDamping: legacyNumber(raw.motionDamping, DATAMOSH_DEFAULTS.videoMotionDamping, 0, 0.95),
    videoFieldSmoothing: legacyNumber(raw.fieldSmoothing, DATAMOSH_DEFAULTS.videoFieldSmoothing, 0, 0.95),
  });
}

/** Returns the legacy layer state, or null when the stack has no Video Motion layer. */
function legacyVideoMotionLayerState(effectPipeline: unknown): boolean | null {
  if (!effectPipeline || typeof effectPipeline !== 'object') return null;
  const stack = (effectPipeline as { effectStack?: unknown }).effectStack;
  if (!Array.isArray(stack)) return null;
  const layer = stack.find(entry => (
    typeof entry === 'object'
    && entry !== null
    && (entry as { kind?: unknown }).kind === 'videoMotion'
  )) as { enabled?: unknown } | undefined;
  return layer ? layer.enabled === true : null;
}

/**
 * Resolves the Datamosh state of a persisted document. Documents saved before
 * Datamosh carry `videoMotion` and possibly an Effect Stack `videoMotion`
 * layer; those are migrated once, and a present `datamosh` field always wins.
 */
export function resolvePersistedDatamosh(state: {
  datamosh?: unknown;
  videoMotion?: unknown;
  effectPipeline?: unknown;
}): DatamoshConfig {
  if (state.datamosh !== undefined) return normalizeDatamoshConfig(state.datamosh);
  const layerState = legacyVideoMotionLayerState(state.effectPipeline);
  if (state.videoMotion === undefined && layerState !== true) return { ...DATAMOSH_DEFAULTS };
  const pipelineVersion = state.effectPipeline && typeof state.effectPipeline === 'object'
    ? (state.effectPipeline as { version?: unknown }).version
    : undefined;
  const standaloneEnabled = (state.videoMotion as { enabled?: unknown } | undefined)?.enabled === true;
  // V2 stored the on/off state in the stack layer. Documents written before
  // the layer existed only carry the standalone flag.
  const legacyEnabled = pipelineVersion === 'stack-v2' && layerState !== null
    ? layerState
    : standaloneEnabled;
  return datamoshFromLegacyVideoMotion(state.videoMotion, legacyEnabled);
}

/** Field-estimation options for the shared Video Motion source. */
export function getDatamoshVideoFieldOptions(config: DatamoshConfig): { fieldSmoothing: number; motionDamping: number } {
  return { fieldSmoothing: config.videoFieldSmoothing, motionDamping: config.videoMotionDamping };
}

/** True when the Datamosh stage consumes the decoded video motion field. */
export function isDatamoshVideoSourceActive(config: DatamoshConfig | undefined): boolean {
  return config?.enabled === true && config.motionSource === 'video';
}
