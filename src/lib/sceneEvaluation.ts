import type { LatestState } from '../types/latestState';
import type {
  DiffuseConfig,
  IridescenceConfig,
  PostprocessConfig,
  RadonConfig,
  SlitScanConfig,
  StretchConfig,
  NoiseDistortionConfig,
} from '../types/distortion';
import type { GradientConfig } from '../types/gradient';
import type { PropertyTrack } from '../types/keyframe';
import { getTrackMode } from '../types/keyframe';
import { interpolateKeyframes } from './keyframeInterpolator';
import { applyTimeRemap } from './timeRemap';
import { hexToRgb255, rgb255ToHex } from './gradientRampUtils';
import { withAnimatedDiffuseSeed } from './diffuseSeed';
import { isPostprocessTimeAnimationActive } from './postprocessAnimation';

export type EvaluatedScene = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  radon: RadonConfig;
  iridescence: IridescenceConfig;
  postprocess: PostprocessConfig;
  renderTime: number;
  slitAnimationTime: number | null;
  stretchTime: number | null;
  noiseLoopPeriod: number;
  animationSpeed: number;
  autoTime: number;
};

function isKeysTrack(track: PropertyTrack): boolean {
  return getTrackMode(track) === 'keys' && track.keyframes.length > 0;
}

function applyGradientTracks(
  gradient: GradientConfig,
  tracks: Record<string, PropertyTrack>,
  time: number,
): GradientConfig {
  const stopOverrides = new Map<string, { position?: number; r?: number; g?: number; b?: number }>();
  const opacityOverrides = new Map<string, { position?: number; opacity?: number }>();
  const anchorOverrides = new Map<number, { x?: number; y?: number }>();

  for (const track of Object.values(tracks)) {
    if (!isKeysTrack(track)) continue;
    const value = interpolateKeyframes(time, track.keyframes);
    const parts = track.propertyId.split('.');
    if (parts.length !== 3) continue;

    if (parts[0] === 'gradientStop') {
      const current = stopOverrides.get(parts[1]) ?? {};
      if (parts[2] === 'position') current.position = value;
      if (parts[2] === 'r') current.r = value;
      if (parts[2] === 'g') current.g = value;
      if (parts[2] === 'b') current.b = value;
      stopOverrides.set(parts[1], current);
    } else if (parts[0] === 'opacityStop') {
      const current = opacityOverrides.get(parts[1]) ?? {};
      if (parts[2] === 'position') current.position = value;
      if (parts[2] === 'opacity') current.opacity = value;
      opacityOverrides.set(parts[1], current);
    } else if (parts[0] === 'gradientAnchor') {
      const index = Number(parts[1]);
      if (!Number.isInteger(index)) continue;
      const current = anchorOverrides.get(index) ?? {};
      if (parts[2] === 'x') current.x = value;
      if (parts[2] === 'y') current.y = value;
      anchorOverrides.set(index, current);
    }
  }

  let result = gradient;
  if (stopOverrides.size > 0) {
    result = {
      ...result,
      stops: result.stops.map(stop => {
        if (!stop.stopId) return stop;
        const override = stopOverrides.get(stop.stopId);
        if (!override) return stop;
        const [r, g, b] = hexToRgb255(stop.color);
        return {
          ...stop,
          position: override.position === undefined
            ? stop.position
            : Math.max(0, Math.min(1, override.position)),
          color: override.r === undefined && override.g === undefined && override.b === undefined
            ? stop.color
            : rgb255ToHex(override.r ?? r, override.g ?? g, override.b ?? b),
        };
      }),
    };
  }
  if (opacityOverrides.size > 0 && result.opacityStops) {
    result = {
      ...result,
      opacityStops: result.opacityStops.map(stop => {
        if (!stop.stopId) return stop;
        const override = opacityOverrides.get(stop.stopId);
        if (!override) return stop;
        return {
          ...stop,
          position: override.position === undefined ? stop.position : Math.max(0, Math.min(1, override.position)),
          opacity: override.opacity === undefined ? stop.opacity : Math.max(0, Math.min(1, override.opacity)),
        };
      }),
    };
  }
  if (anchorOverrides.size > 0 && result.anchors) {
    result = {
      ...result,
      anchors: result.anchors.map((anchor, index) => {
        const override = anchorOverrides.get(index);
        if (!override) return anchor;
        return [
          override.x === undefined ? anchor[0] : Math.max(0, Math.min(1, override.x)),
          override.y === undefined ? anchor[1] : Math.max(0, Math.min(1, override.y)),
        ] as [number, number];
      }) as typeof result.anchors,
    };
  }
  return result;
}

function applyObjectTracks<T extends object>(
  category: string,
  source: T,
  tracks: Record<string, PropertyTrack>,
  time: number,
): T {
  let result = source;
  const sourceRecord = source as Record<string, unknown>;
  for (const track of Object.values(tracks)) {
    if (!isKeysTrack(track)) continue;
    const [trackCategory, field] = track.propertyId.split('.');
    if (trackCategory !== category || !(field in sourceRecord)) continue;
    result = {
      ...result,
      [field]: interpolateKeyframes(time, track.keyframes),
    } as T;
  }
  return result;
}

function trackMode(
  state: LatestState,
  propertyId: string,
  legacyAuto: boolean,
): 'static' | 'auto' | 'keys' {
  if (!propertyOwnerEnabled(state, propertyId)) return 'static';
  const track = state.keyframeTracks[propertyId];
  return track ? getTrackMode(track) : legacyAuto ? 'auto' : 'static';
}

function propertyOwnerEnabled(state: LatestState, propertyId: string): boolean {
  if (propertyId.startsWith('gradientStop.') || propertyId.startsWith('opacityStop.') || propertyId.startsWith('gradientAnchor.')) return true;
  if (propertyId.startsWith('noiseDistortion.')) return state.noiseDistortion.enabled;
  if (propertyId.startsWith('diffuse.')) return state.diffuse.enabled;
  if (propertyId.startsWith('slitScan.')) return state.slitScan.enabled;
  if (propertyId.startsWith('stretch.')) return state.stretch.enabled;
  if (propertyId.startsWith('radon.')) return state.radon.enabled;
  if (propertyId.startsWith('iridescence.')) return state.iridescence.enabled;
  if (propertyId === 'postprocess.__time') {
    return isPostprocessTimeAnimationActive(state.postprocess, state.effectPipeline);
  }
  if (propertyId.startsWith('postprocess.')) return state.postprocess.enabled;
  return true;
}

function keyedTrackValue(state: LatestState, propertyId: string, time: number): number | null {
  const track = state.keyframeTracks[propertyId];
  if (!track || getTrackMode(track) !== 'keys' || track.keyframes.length === 0) return null;
  return interpolateKeyframes(time, track.keyframes);
}

export function hasActiveAnimation(state: LatestState): boolean {
  if (!state.animation.enabled) return false;
  if (Object.values(state.keyframeTracks).some(track => (
    propertyOwnerEnabled(state, track.propertyId) && getTrackMode(track) !== 'static'
  ))) return true;
  return (
    (state.animation.affectNoise && (state.noiseDistortion.enabled || state.radon.enabled || state.iridescence.enabled)) ||
    (state.animation.affectSlit && state.slitScan.enabled) ||
    (state.animation.affectStretch && state.stretch.enabled) ||
    state.animation.affectRamp ||
    (state.diffuse.enabled && Boolean(state.diffuse.seedAnimEnabled)) ||
    isPostprocessTimeAnimationActive(state.postprocess, state.effectPipeline)
  );
}

export function evaluateSceneAtTime(state: LatestState, normalizedTime: number): EvaluatedScene {
  const time = Math.max(0, Math.min(1, Number.isFinite(normalizedTime) ? normalizedTime : 0));
  const animation = state.animation;
  const autoTime = applyTimeRemap(time, animation.duration, animation.easing);
  const tracks = state.keyframeTracks;

  const noiseMode = trackMode(state, 'noiseDistortion.evolution', animation.affectNoise && state.noiseDistortion.enabled);
  const radonMode = trackMode(state, 'radon.evolution', animation.affectNoise && state.radon.enabled);
  const iridescenceMode = trackMode(state, 'iridescence.__time', animation.affectNoise && state.iridescence.enabled);
  const slitOffsetMode = trackMode(state, 'slitScan.offset', animation.affectSlit && state.slitScan.enabled);
  const slitPhaseMode = trackMode(state, 'slitScan.slitPhase', animation.affectSlit && state.slitScan.enabled && state.slitScan.phaseAnimEnabled);
  const stretchMode = trackMode(state, 'stretch.__scan', animation.affectStretch && state.stretch.enabled);
  const diffuseMode = trackMode(state, 'diffuse.seed', state.diffuse.enabled && Boolean(state.diffuse.seedAnimEnabled));
  const postprocessMode = trackMode(
    state,
    'postprocess.__time',
    isPostprocessTimeAnimationActive(state.postprocess, state.effectPipeline),
  );

  const anySharedAuto = (
    noiseMode === 'auto' ||
    radonMode === 'auto' ||
    iridescenceMode === 'auto' ||
    postprocessMode === 'auto'
  );
  const iridescenceKeyTime = keyedTrackValue(state, 'iridescence.__time', time);
  const postprocessKeyTime = keyedTrackValue(state, 'postprocess.__time', time);
  const keyedSharedTime = postprocessKeyTime ?? iridescenceKeyTime;
  const renderTime = animation.enabled
    ? anySharedAuto
      ? autoTime * animation.speed * animation.duration
      : (keyedSharedTime ?? 0) * animation.duration
    : 0;

  let noiseDistortion = applyObjectTracks(
    'noiseDistortion',
    { ...state.noiseDistortion },
    tracks,
    time,
  );
  let radon = applyObjectTracks('radon', { ...state.radon }, tracks, time);
  let iridescence = applyObjectTracks(
    'iridescence',
    { ...state.iridescence },
    tracks,
    time,
  );

  if (noiseMode !== 'auto') {
    noiseDistortion = {
      ...noiseDistortion,
      evolution: noiseDistortion.evolution - renderTime,
      curlSpeed: 0,
    };
  }
  if (radonMode !== 'auto') radon = { ...radon, speed: 0 };
  if (iridescenceMode === 'keys' && iridescenceKeyTime !== null) {
    const desiredTime = iridescenceKeyTime * animation.duration;
    iridescence = {
      ...iridescence,
      speed: Math.abs(renderTime) < 1e-6 ? 0 : iridescence.speed * desiredTime / renderTime,
    };
  } else if (iridescenceMode !== 'auto') {
    iridescence = { ...iridescence, speed: 0 };
  }

  let slitScan = applyObjectTracks(
    'slitScan',
    { ...state.slitScan },
    tracks,
    time,
  );
  slitScan = {
    ...slitScan,
    animEnabled: slitOffsetMode === 'auto' || slitPhaseMode === 'auto',
    phaseAnimEnabled: slitPhaseMode === 'auto',
  };
  const stretch = applyObjectTracks(
    'stretch',
    { ...state.stretch },
    tracks,
    time,
  );
  const postprocess = applyObjectTracks(
    'postprocess',
    { ...state.postprocess },
    tracks,
    time,
  );

  const seedFrame = animation.enabled && diffuseMode === 'auto'
    ? Math.floor(autoTime * animation.duration * animation.fps)
    : 0;
  const diffuse = withAnimatedDiffuseSeed(
    { ...state.diffuse, seedAnimEnabled: diffuseMode === 'auto' },
    seedFrame,
  );

  return {
    gradient: applyGradientTracks(state.gradient, tracks, time),
    noiseDistortion,
    diffuse,
    slitScan,
    stretch,
    radon,
    iridescence,
    postprocess,
    renderTime,
    slitAnimationTime: animation.enabled && (slitOffsetMode === 'auto' || slitPhaseMode === 'auto')
      ? autoTime * animation.duration
      : null,
    stretchTime: animation.enabled
      ? stretchMode === 'auto'
        ? autoTime
        : stretchMode === 'keys'
          ? keyedTrackValue(state, 'stretch.__scan', time)
          : null
      : null,
    noiseLoopPeriod: Math.max(Math.abs(animation.speed * animation.duration), 0.0001),
    animationSpeed: postprocessMode === 'auto' ? Math.abs(animation.speed) : 0,
    autoTime,
  };
}
