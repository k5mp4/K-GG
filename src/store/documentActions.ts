import { DEFAULT_MESH_GRADIENT, normalizeMeshGradientConfig, type Vec2Tuple } from '../types/gradient';
import { stripSlitPhaseMotionFields, type NoiseDistortionConfig } from '../types/distortion';
import { DEFAULT_DIFFUSE_ASCII_CHARSET, DEFAULT_DIFFUSE_BACKGROUND_COLOR } from '../types/distortion';
import { normalizeClothGradientConfig } from '../types/clothGradient';
import { normalizeConeViewConfig } from '../types/coneView';
import { normalizeSeamlessConfig } from '../types/seamless';
import { normalizeImageGradientConfig } from '../types/imageGradient';
import { normalizePropertyTrack, type AnimationMode, type Keyframe } from '../types/keyframe';
import { computeAutoHandles } from '../lib/autoBezier';
import { createAnimationTrack, getAnimationDefinition, isRemovedAnimationProperty } from '../lib/animationRegistry';
import { clampKeyframeTime } from '../lib/loopKeyframes';
import { isPostprocessTimeAnimationActive } from '../lib/postprocessAnimation';
import { normalizePostprocessEffectMode, normalizePostprocessEffectStack } from '../lib/postprocessStack';
import {
  getPostprocessEffectStackEnabledSignature,
  hasEnabledPostprocessEffectStack,
  normalizeEffectPipelineConfig,
  updateEffectStackLayer,
} from '../lib/effectPipeline';
import { normalizeDiffuseBezier, resolveDiffuseBezier } from '../lib/diffuseCurve';
import { clampParameter, getParameterLimit, normalizeTrackValue } from '../lib/parameterLimits';
import { normalizeFlowGradientConfig } from '../types/flowGradient';
import {
  ANIMATION_DURATION_MAX,
  ANIMATION_DURATION_MIN,
  ANIMATION_SPEED_MAX,
  ANIMATION_SPEED_MIN,
  getBeatSyncDurationSeconds,
} from '../lib/animationConfig';
import type { DocumentActions, DocumentDefaults, DocumentStoreSet } from './documentSlice';
import {
  GRADIENT_ANCHOR_DEFAULTS,
  NOISE_TYPE_PRESETS,
  createEmptyManualDistortMap,
  createEmptyManualSmoothMask,
  defaultBezierControlsForAnchors,
  ensureAutoTrack,
  ensureDefaultAutoTracks,
  isGradientType,
  migratePropertyTracks,
  normalizeNoiseDistortionConfig,
  normalizeDiffuseBackgroundColor,
} from './documentModel';

export function createDocumentActions(set: DocumentStoreSet, defaults: DocumentDefaults): DocumentActions {
  return {
  setGradient: (v) => set((s) => {
    const ensureStopIds = (stops: import('../types/gradient').ColorStop[]) =>
      stops.map(stop => stop.stopId ? stop : { ...stop, stopId: crypto.randomUUID() });
    const ensureOpacityStopIds = (stops: import('../types/gradient').OpacityStop[]) =>
      stops.map(stop => stop.stopId ? stop : { ...stop, stopId: crypto.randomUUID() });
    const next = {
      ...v,
      ...(v.stops ? { stops: ensureStopIds(v.stops) } : {}),
      ...(v.opacityStops ? { opacityStops: ensureOpacityStopIds(v.opacityStops) } : {}),
    };
    next.angle = clampParameter(next.angle, s.gradient.angle, getParameterLimit('gradient.angle'));
    const requestedType = next.gradientType;
    const nextType = isGradientType(requestedType)
      ? requestedType
      : s.gradient.gradientType;
    if (requestedType !== undefined && requestedType !== nextType) next.gradientType = nextType;
    const hasMeshValue = Object.prototype.hasOwnProperty.call(v, 'mesh');
    const currentMesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const mesh = nextType === 'mesh'
      ? normalizeMeshGradientConfig(hasMeshValue ? v.mesh : currentMesh)
      : undefined;
    const anchors = next.gradientType && next.gradientType !== s.gradient.gradientType
      ? GRADIENT_ANCHOR_DEFAULTS[next.gradientType]
      : s.gradient.anchors;
    return {
      gradient: {
        ...s.gradient,
        ...next,
        ...(next.gradientType && next.gradientType !== s.gradient.gradientType ? { anchors } : {}),
        ...(nextType === 'bezier' && next.gradientType !== s.gradient.gradientType
          ? { bezierControls: defaultBezierControlsForAnchors(anchors ?? GRADIENT_ANCHOR_DEFAULTS.bezier) }
          : {}),
        mesh,
      },
    };
  }),
  setMeshCorner: (index, position) => set((s) => {
    if (!Number.isInteger(index) || index < 0 || index > 3) return {};
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const corners = mesh.corners.map((corner, cornerIndex) => cornerIndex === index ? position : corner) as typeof mesh.corners;
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, corners }) } };
  }),
  setMeshHandle: (edge, index, position) => set((s) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_MESH_GRADIENT.handles, edge)) return {};
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const handles = {
      ...mesh.handles,
      [edge]: mesh.handles[edge].map((handle, handleIndex) => handleIndex === index ? position : handle),
    } as typeof mesh.handles;
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, handles }) } };
  }),
  setMeshColorPosition: (index, value) => set((s) => {
    if (!Number.isInteger(index) || index < 0 || index > 3) return {};
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const colorPositions = mesh.colorPositions.map((position, colorIndex) => colorIndex === index ? value : position) as typeof mesh.colorPositions;
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, colorPositions }) } };
  }),
  resetMeshGradient: () => set((s) => ({ gradient: { ...s.gradient, gradientType: 'mesh', mesh: normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT), anchors: GRADIENT_ANCHOR_DEFAULTS.mesh } })),
  straightenMeshHandles: () => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const lerp = (a: Vec2Tuple, b: Vec2Tuple, t: number): Vec2Tuple => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
    ];
    const [bl, br, tl, tr] = mesh.corners;
    const handles = {
      bottom: [lerp(bl, br, 1 / 3), lerp(bl, br, 2 / 3)],
      right: [lerp(br, tr, 1 / 3), lerp(br, tr, 2 / 3)],
      top: [lerp(tr, tl, 1 / 3), lerp(tr, tl, 2 / 3)],
      left: [lerp(tl, bl, 1 / 3), lerp(tl, bl, 2 / 3)],
    } as typeof mesh.handles;
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, handles }) } };
  }),
  setNoiseDistortion: (v) => set((s) => {
    let nextNoiseDistortion: Partial<NoiseDistortionConfig>;
    if (v.type && v.type !== s.noiseDistortion.type) {
      nextNoiseDistortion = { ...s.noiseDistortion, ...NOISE_TYPE_PRESETS[v.type], ...v };
    } else {
      nextNoiseDistortion = { ...s.noiseDistortion, ...v };
    }
    const noiseDistortion = normalizeNoiseDistortionConfig(nextNoiseDistortion);
    const keyframeTracks = s.animation.enabled && noiseDistortion.enabled
      ? ensureAutoTrack(s.keyframeTracks, 'noiseDistortion.evolution')
      : s.keyframeTracks;
    const effectPipeline = v.enabled !== undefined && s.effectPipeline.version === 'stack-v2'
      ? { ...s.effectPipeline, effectStack: updateEffectStackLayer(s.effectPipeline.effectStack, 'noise', { enabled: v.enabled }) }
      : s.effectPipeline;
    return { noiseDistortion, keyframeTracks, effectPipeline };
  }),
  setDiffuse: (v) => set((s) => {
    const hasBezier = Object.prototype.hasOwnProperty.call(v, 'luminanceBezier');
    const hasLegacyCurve = Object.prototype.hasOwnProperty.call(v, 'luminanceCurve');
    const luminanceBezier = hasBezier
      ? normalizeDiffuseBezier(v.luminanceBezier)
      : hasLegacyCurve
        ? resolveDiffuseBezier(undefined, v.luminanceCurve)
        : normalizeDiffuseBezier(s.diffuse.luminanceBezier);
    const grainBezier = Object.prototype.hasOwnProperty.call(v, 'grainBezier')
      ? normalizeDiffuseBezier(v.grainBezier)
      : normalizeDiffuseBezier(s.diffuse.grainBezier);
    const diffuse = { ...s.diffuse, ...v, luminanceBezier, grainBezier };
    delete diffuse.luminanceCurve;
    diffuse.scatter = clampParameter(diffuse.scatter, s.diffuse.scatter, getParameterLimit('diffuse.scatter'));
    diffuse.grain = clampParameter(diffuse.grain, s.diffuse.grain, {
      ...getParameterLimit(
        diffuse.mode === 'dither'
          ? 'diffuse.ditherGrain'
          : diffuse.mode === 'halftone'
            ? 'diffuse.halftoneGrain'
            : diffuse.mode === 'ascii'
              ? 'diffuse.asciiGrain'
              : 'diffuse.grain',
      ),
    });
    diffuse.seed = clampParameter(diffuse.seed, s.diffuse.seed, getParameterLimit('diffuse.seed'));
    diffuse.ditherThreshold = clampParameter(diffuse.ditherThreshold, s.diffuse.ditherThreshold, getParameterLimit('diffuse.ditherThreshold'));
    diffuse.halftoneSize = clampParameter(diffuse.halftoneSize, s.diffuse.halftoneSize, getParameterLimit('diffuse.halftoneSize'));
    diffuse.grainAdaptiveAmount = clampParameter(diffuse.grainAdaptiveAmount, s.diffuse.grainAdaptiveAmount, getParameterLimit('diffuse.grainAdaptiveAmount'));
    diffuse.adaptiveChannel = diffuse.adaptiveChannel === 'hue' || diffuse.adaptiveChannel === 'saturation'
      ? diffuse.adaptiveChannel
      : 'luminance';
    diffuse.halftoneShape = diffuse.halftoneShape === 'square' ? 'square' : 'circle';
    diffuse.asciiCharset = typeof diffuse.asciiCharset === 'string' && diffuse.asciiCharset.length > 0
      ? diffuse.asciiCharset.slice(0, 64)
      : DEFAULT_DIFFUSE_ASCII_CHARSET;
    diffuse.asciiFont = typeof diffuse.asciiFont === 'string' && diffuse.asciiFont.length > 0
      ? diffuse.asciiFont
      : 'monospace';
    diffuse.asciiFontSize = clampParameter(diffuse.asciiFontSize, s.diffuse.asciiFontSize, getParameterLimit('diffuse.asciiFontSize'));
    diffuse.asciiRotation = clampParameter(diffuse.asciiRotation, s.diffuse.asciiRotation, getParameterLimit('diffuse.asciiRotation'));
    diffuse.adaptiveEnabled = Boolean(diffuse.adaptiveEnabled);
    diffuse.grainAdaptiveEnabled = Boolean(diffuse.grainAdaptiveEnabled);
    diffuse.backgroundColor = normalizeDiffuseBackgroundColor(
      diffuse.backgroundColor,
      s.diffuse.backgroundColor ?? DEFAULT_DIFFUSE_BACKGROUND_COLOR,
    );
    const keyframeTracks = s.animation.enabled && diffuse.enabled && diffuse.seedAnimEnabled
      ? ensureAutoTrack(s.keyframeTracks, 'diffuse.seed')
      : s.keyframeTracks;
    const effectPipeline = v.enabled !== undefined && s.effectPipeline.version === 'stack-v2'
      ? { ...s.effectPipeline, effectStack: updateEffectStackLayer(s.effectPipeline.effectStack, 'diffuse', { enabled: v.enabled }) }
      : s.effectPipeline;
    return { diffuse, keyframeTracks, effectPipeline };
  }),
  setImageGradient: (v) => set((s) => ({ imageGradient: normalizeImageGradientConfig({ ...s.imageGradient, ...v }) })),
  setSlitScan: (v) => set((s) => {
    const slitScan = stripSlitPhaseMotionFields({ ...s.slitScan, ...v });
    slitScan.angle = clampParameter(slitScan.angle, s.slitScan.angle, getParameterLimit('slit.angle'));
    slitScan.offsetAngle = clampParameter(slitScan.offsetAngle, s.slitScan.offsetAngle ?? 0, getParameterLimit('slit.offsetAngle'));
    let keyframeTracks = s.keyframeTracks;
    if (s.animation.enabled && slitScan.enabled && s.animation.affectSlit) {
      keyframeTracks = ensureAutoTrack(keyframeTracks, 'slitScan.offset');
    }
    const effectPipeline = v.enabled !== undefined && s.effectPipeline.version === 'stack-v2'
      ? { ...s.effectPipeline, effectStack: updateEffectStackLayer(s.effectPipeline.effectStack, 'slit', { enabled: v.enabled }) }
      : s.effectPipeline;
    return { slitScan, keyframeTracks, effectPipeline };
  }),
  setStretch: (v) => set((s) => {
    const stretch = { ...s.stretch, ...v };
    const keyframeTracks = s.animation.enabled && stretch.enabled
      ? ensureAutoTrack(s.keyframeTracks, 'stretch.__scan')
      : s.keyframeTracks;
    const effectPipeline = v.enabled !== undefined && s.effectPipeline.version === 'stack-v2'
      ? { ...s.effectPipeline, effectStack: updateEffectStackLayer(s.effectPipeline.effectStack, 'stretch', { enabled: v.enabled }) }
      : s.effectPipeline;
    const postprocessEnabledSignatureChanged = v.enabled !== undefined
      && getPostprocessEffectStackEnabledSignature(s.effectPipeline) !== getPostprocessEffectStackEnabledSignature(effectPipeline);
    return {
      stretch,
      keyframeTracks,
      effectPipeline,
      ...(postprocessEnabledSignatureChanged
        ? { postprocess: { ...s.postprocess, enabled: hasEnabledPostprocessEffectStack(effectPipeline) } }
        : {}),
    };
  }),
  setAnimation: (v) => set((s) => {
    const nextAnimation = { ...s.animation, ...v };
    const beatSync = nextAnimation.easing.beatSync;
    const beatSyncEnabled = beatSync?.enabled ?? false;
    const animation = {
      ...nextAnimation,
      previewLoop: nextAnimation.previewLoop ?? true,
      speed: Math.max(ANIMATION_SPEED_MIN, Math.min(ANIMATION_SPEED_MAX, Number.isFinite(nextAnimation.speed) ? nextAnimation.speed : ANIMATION_SPEED_MIN)),
      duration: beatSyncEnabled
        ? getBeatSyncDurationSeconds(beatSync?.bpm ?? 120)
        : Math.max(ANIMATION_DURATION_MIN, Math.min(ANIMATION_DURATION_MAX, Number.isFinite(nextAnimation.duration) ? nextAnimation.duration : ANIMATION_DURATION_MIN)),
    };
    animation.direction = clampParameter(animation.direction, s.animation.direction, getParameterLimit('animation.direction'));
    return {
      animation,
      keyframeTracks: animation.enabled
        ? ensureDefaultAutoTracks(s, s.keyframeTracks)
        : s.keyframeTracks,
    };
  }),
  setNormalMap: (v) => set((s) => ({ normalMap: { ...s.normalMap, ...v, angle: clampParameter(v.angle ?? s.normalMap.angle, s.normalMap.angle, getParameterLimit('normalMap.angle')) } })),
  setClothGradient: (v) => set((s) => ({ clothGradient: normalizeClothGradientConfig({ ...s.clothGradient, ...v }) })),
  setConeView: (v) => set((s) => ({ coneView: normalizeConeViewConfig({ ...s.coneView, ...v }) })),
  setSeamless: (v) => set((s) => ({ seamless: normalizeSeamlessConfig({ ...s.seamless, ...v }) })),
  setFlowGradient: (v) => set((s) => ({
    flowGradient: normalizeFlowGradientConfig({ ...s.flowGradient, ...v }),
  })),
  setRadon: (v) => set((s) => {
    const radon = { ...s.radon, ...v };
    radon.angle = clampParameter(radon.angle, s.radon.angle, getParameterLimit('radon.angle'));
    const keyframeTracks = s.animation.enabled && radon.enabled
      ? ensureAutoTrack(s.keyframeTracks, 'radon.evolution')
      : s.keyframeTracks;
    return { radon, keyframeTracks };
  }),
  setIridescence: (v) => set((s) => {
    const iridescence = { ...s.iridescence, ...v };
    iridescence.angle = clampParameter(iridescence.angle, s.iridescence.angle, getParameterLimit('iridescence.angle'));
    const keyframeTracks = s.animation.enabled && iridescence.enabled
      ? ensureAutoTrack(s.keyframeTracks, 'iridescence.__time')
      : s.keyframeTracks;
    return { iridescence, keyframeTracks };
  }),
  setManualDistort: (v) => set((s) => {
    const resolution = v.mapResolution ?? s.manualDistort.mapResolution;
    const displacement = v.displacement
      ? [...v.displacement]
      : v.mapResolution && v.mapResolution !== s.manualDistort.mapResolution
        ? createEmptyManualDistortMap(resolution)
        : s.manualDistort.displacement;
    const smoothMask = v.smoothMask
      ? [...v.smoothMask]
      : v.mapResolution && v.mapResolution !== s.manualDistort.mapResolution
        ? createEmptyManualSmoothMask(resolution)
        : s.manualDistort.smoothMask ?? createEmptyManualSmoothMask(resolution);
    return { manualDistort: { ...s.manualDistort, ...v, displacement, smoothMask } };
  }),
  setPostprocess: (v) => set((s) => {
    const resolution = v.mapResolution ?? s.postprocess.mapResolution;
    const displacement = v.displacement
      ? [...v.displacement]
      : v.mapResolution && v.mapResolution !== s.postprocess.mapResolution
        ? createEmptyManualDistortMap(resolution)
        : s.postprocess.displacement;
    const smoothMask = v.smoothMask
      ? [...v.smoothMask]
      : v.mapResolution && v.mapResolution !== s.postprocess.mapResolution
        ? createEmptyManualSmoothMask(resolution)
        : s.postprocess.smoothMask ?? createEmptyManualSmoothMask(resolution);
    const effectMode = normalizePostprocessEffectMode(
      v.effectMode ?? s.postprocess.effectMode,
      s.postprocess.effectMode,
    );
    const effectStack = normalizePostprocessEffectStack(v.effectStack ?? s.postprocess.effectStack, effectMode);
    const next = { ...s.postprocess, ...v, effectMode, effectStack, displacement, smoothMask };
    next.diffuseBackgroundColor = normalizeDiffuseBackgroundColor(
      next.diffuseBackgroundColor,
      s.postprocess.diffuseBackgroundColor ?? DEFAULT_DIFFUSE_BACKGROUND_COLOR,
    );
    if (v.effectStack !== undefined && v.enabled === undefined) {
      next.enabled = effectStack.some(layer => layer.enabled);
    }
    next.kaleidoscopeRotation = clampParameter(next.kaleidoscopeRotation, s.postprocess.kaleidoscopeRotation, getParameterLimit('postprocess.kaleidoscopeRotation'));
    next.voronoiAngle = clampParameter(next.voronoiAngle, s.postprocess.voronoiAngle, getParameterLimit('postprocess.voronoiAngle'));
    next.glassRotation = clampParameter(next.glassRotation, s.postprocess.glassRotation, getParameterLimit('postprocess.glassRotation'));
    next.particleDirection = clampParameter(next.particleDirection, s.postprocess.particleDirection, getParameterLimit('postprocess.particleDirection'));
    if ((next.particleEmitterType as string) === 'nexus') next.particleEmitterType = 'point';
    if (!next.particleEmitterPoint) next.particleEmitterPoint = [...defaults.postprocess.particleEmitterPoint] as [number, number];
    const keyframeTracks = s.animation.enabled && isPostprocessTimeAnimationActive(next, s.effectPipeline)
      ? ensureAutoTrack(s.keyframeTracks, 'postprocess.__time')
      : s.keyframeTracks;
    return { postprocess: next, keyframeTracks };
  }),
  setEffectPipeline: (v) => set((s) => {
    const effectPipeline = normalizeEffectPipelineConfig({
      ...s.effectPipeline,
      ...v,
      effectStack: v.effectStack ?? s.effectPipeline.effectStack,
    });
    if (effectPipeline.version !== 'stack-v2') return { effectPipeline };
    const enabled = (kind: import('../types/distortion').EffectStackKind) => (
      effectPipeline.effectStack.some(layer => layer.kind === kind && layer.enabled)
    );
    const keyframeTracks = s.animation.enabled && isPostprocessTimeAnimationActive(s.postprocess, effectPipeline)
      ? ensureAutoTrack(s.keyframeTracks, 'postprocess.__time')
      : s.keyframeTracks;
    const postprocessEnabledSignatureChanged = v.effectStack !== undefined
      && getPostprocessEffectStackEnabledSignature(s.effectPipeline) !== getPostprocessEffectStackEnabledSignature(effectPipeline);
    return {
      effectPipeline,
      noiseDistortion: { ...s.noiseDistortion, enabled: enabled('noise') },
      diffuse: { ...s.diffuse, enabled: enabled('diffuse') },
      slitScan: { ...s.slitScan, enabled: enabled('slit') },
      stretch: { ...s.stretch, enabled: enabled('stretch') },
      ...(postprocessEnabledSignatureChanged
        ? { postprocess: { ...s.postprocess, enabled: hasEnabledPostprocessEffectStack(effectPipeline) } }
        : {}),
      keyframeTracks,
    };
  }),
  setMatcap: (v) => set((s) => ({ matcap: { ...s.matcap, ...v } })),
  setKeyframeTracks: (v) => set((s) => ({
    keyframeTracks: migratePropertyTracks(typeof v === 'function' ? v(s.keyframeTracks) : v),
  })),
  setTrackMode: (trackId, requestedMode, options) => set((s) => {
    if (isRemovedAnimationProperty(trackId)) return {};
    const definition = getAnimationDefinition(trackId);
    const mode: AnimationMode = requestedMode === 'auto' && !definition?.autoCapable
      ? 'static'
      : requestedMode;
    const existing = s.keyframeTracks[trackId];
    const track = existing
      ? normalizePropertyTrack(existing)
      : createAnimationTrack(trackId, options?.label ?? definition?.label ?? trackId, mode);
    let keyframes = track.keyframes;
    if (mode === 'keys' && keyframes.length === 0 && typeof options?.value === 'number' && Number.isFinite(options.value)) {
      keyframes = [{
        id: crypto.randomUUID(),
        time: clampKeyframeTime(options?.time ?? s.currentTime, s.animation.previewLoop ?? true),
        value: normalizeTrackValue(trackId, options?.value ?? 0),
        interpolation: 'linear',
      }];
    }
    return {
      keyframeTracks: {
        ...s.keyframeTracks,
        [trackId]: {
          ...track,
          label: options?.label ?? track.label,
          mode,
          enabled: mode === 'keys',
          keyframes,
        },
      },
    };
  }),
  setKeyframe: (trackId, kf) => set((s) => {
    const track = s.keyframeTracks[trackId];
    if (!track) return s;
    const nextKeyframes = track.keyframes.map(k => {
      if (k.id !== kf.id) return k;
      const next = { ...k, ...kf };
      return {
        ...next,
        value: normalizeTrackValue(trackId, kf.value ?? k.value),
        time: clampKeyframeTime(next.time, s.animation.previewLoop ?? true),
      };
    });
    return { keyframeTracks: { ...s.keyframeTracks, [trackId]: { ...track, mode: 'keys', enabled: true, keyframes: nextKeyframes } } };
  }),
  removeKeyframe: (trackId, kfId) => set((s) => {
    const track = s.keyframeTracks[trackId];
    if (!track) return s;
    let nextKeyframes = track.keyframes.filter(k => k.id !== kfId);
    // bezier キーフレームが含まれる場合はハンドルを再計算
    if (nextKeyframes.some(k => k.interpolation === 'bezier')) {
      nextKeyframes = computeAutoHandles(nextKeyframes);
    }
    return { keyframeTracks: { ...s.keyframeTracks, [trackId]: { ...track, keyframes: nextKeyframes } } };
  }),
  addKeyframe: (trackId, kf, options) => set((s) => {
    const track = s.keyframeTracks[trackId];
    if (!track) return s;
    const newKf: Keyframe = {
      ...kf,
      id: crypto.randomUUID(),
      value: normalizeTrackValue(trackId, kf.value),
      time: clampKeyframeTime(kf.time, s.animation.previewLoop ?? true),
    };
    let nextKeyframes = [...track.keyframes, newKf].sort((a, b) => a.time - b.time);

    // bezier キーフレームが含まれ、かつ preserveHandles が false の場合のみハンドルを自動計算
    if (!options?.preserveHandles && nextKeyframes.some(k => k.interpolation === 'bezier')) {
      nextKeyframes = computeAutoHandles(nextKeyframes);
    }
    return { keyframeTracks: { ...s.keyframeTracks, [trackId]: { ...track, mode: 'keys', enabled: true, keyframes: nextKeyframes } } };
  }),
  };
}
