import {
  DEFAULT_MESH_GRADIENT,
  MESH_GRID_MAX,
  MESH_GRID_MIN,
  cloneEdgeHandles,
  defaultEdgeHandles,
  legacyProjection,
  normalizeMeshGradientConfig,
  type Vec2Tuple,
} from '../types/gradient';
import { evaluateMeshPatch } from '../lib/meshGradientField';
import { applyMirrorT, applyRampRepeatT, getColorAtPosition } from '../lib/gradientRampUtils';
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
import { normalizeGlassTileRenderParameters } from '../lib/glassTile';
import {
  getPostprocessEffectStackEnabledSignature,
  hasEnabledPostprocessEffectStack,
  normalizeEffectPipelineConfig,
  updateEffectStackLayer,
} from '../lib/effectPipeline';
import { normalizeDiffuseBezier, resolveDiffuseBezier } from '../lib/diffuseCurve';
import { clampParameter, getParameterLimit, normalizeTrackValue } from '../lib/parameterLimits';
import { normalizeFlowGradientConfig } from '../types/flowGradient';
import { normalizeVideoMotionConfig } from '../types/videoMotion';
import {
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
    // Legacy corner edit: delegate to the matching grid point (BL, BR, TL, TR).
    if (!Number.isInteger(index) || index < 0 || index > 3) return {};
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const rows = mesh.rows;
    const columns = mesh.columns;
    const cornerToPoint = (corner: number): number => {
      if (corner === 0) return 0;
      if (corner === 1) return columns - 1;
      if (corner === 2) return (rows - 1) * columns;
      return rows * columns - 1;
    };
    const pointIndex = cornerToPoint(index);
    const points = mesh.points.map((point, pointI) => (pointI === pointIndex ? position : point));
    const edgeHandles = mesh.edgeHandles;
    const { corners, handles } = legacyProjection({ points, edgeHandles, rows, columns });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, points, corners, handles }) } };
  }),
  setMeshHandle: (edge, index, position) => set((s) => {
    // Legacy single-patch handle edit. Only meaningful for the 2×2 grid.
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_MESH_GRADIENT.handles, edge)) return {};
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    if (mesh.rows !== 2 || mesh.columns !== 2) return {};
    const orientation = edge === 'bottom' || edge === 'top' ? 'h' : 'v';
    const row = edge === 'top' || edge === 'left' ? 1 : 0;
    const col = edge === 'right' ? 1 : 0;
    const edgeHandles = cloneEdgeHandles(mesh.edgeHandles);
    const table = orientation === 'h' ? edgeHandles.horizontal : edgeHandles.vertical;
    const tableRow = orientation === 'h' ? row : row;
    const edgeIndex = orientation === 'h' ? col : col;
    if (!table[tableRow]?.[edgeIndex]) return {};
    table[tableRow][edgeIndex][index] = position;
    const points = mesh.points;
    const { corners, handles } = legacyProjection({ points, edgeHandles, rows: mesh.rows, columns: mesh.columns });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, edgeHandles, corners, handles }) } };
  }),
  setMeshColorMode: (mode) => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    if (mode !== 'ramp' && mode !== 'direct') return {};
    if (mesh.colorMode === mode) return {};
    if (mode === 'ramp') {
      // Back to ramp: drop per-point colors; the ramp drives the mesh again.
      return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, colorMode: 'ramp', pointColors: undefined }) } };
    }
    // Switch to direct: bake the current ramp colors (sampled along v) into
    // per-point hex colors so the look is continuous before editing.
    const rampColorAt = (t: number): string => {
      const repeated = applyRampRepeatT(t, s.gradient.rampRepeat ?? 1);
      const mapped = s.gradient.rampMirror ? applyMirrorT(repeated) : repeated;
      return getColorAtPosition(s.gradient.stops, mapped, s.gradient.rampInterpolation, s.gradient.rampColorMode, s.gradient.rampVariable ?? 0);
    };
    const pointColors = mesh.points.map((_, index) => {
      const row = Math.floor(index / mesh.columns);
      const v = mesh.rows <= 1 ? 0 : row / (mesh.rows - 1);
      return rampColorAt(v);
    });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, colorMode: 'direct', pointColors }) } };
  }),
  setMeshPointColor: (index, color) => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const count = mesh.rows * mesh.columns;
    if (!Number.isInteger(index) || index < 0 || index >= count) return {};
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return {};
    const existing = mesh.colorMode === 'direct' && mesh.pointColors
      ? [...mesh.pointColors]
      : undefined;
    if (mesh.colorMode !== 'direct') return {};
    const pointColors = existing ?? mesh.points.map((_, pointIndex) => {
      const row = Math.floor(pointIndex / mesh.columns);
      const v = mesh.rows <= 1 ? 0 : row / (mesh.rows - 1);
      const repeated = applyRampRepeatT(v, s.gradient.rampRepeat ?? 1);
      const mapped = s.gradient.rampMirror ? applyMirrorT(repeated) : repeated;
      return getColorAtPosition(s.gradient.stops, mapped, s.gradient.rampInterpolation, s.gradient.rampColorMode, s.gradient.rampVariable ?? 0);
    });
    pointColors[index] = color.toUpperCase();
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, pointColors }) } };
  }),
  setMeshGridPoint: (index, position) => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const count = mesh.rows * mesh.columns;
    if (!Number.isInteger(index) || index < 0 || index >= count) return {};
    const points = mesh.points.map((point, pointIndex) => pointIndex === index ? position : point);
    const { corners, handles } = legacyProjection({ points, edgeHandles: mesh.edgeHandles, rows: mesh.rows, columns: mesh.columns });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, points, corners, handles }) } };
  }),
  setMeshEdgeHandle: (orientation, row, col, handleIndex, position) => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const edgeHandles = cloneEdgeHandles(mesh.edgeHandles);
    const table = orientation === 'h' ? edgeHandles.horizontal : edgeHandles.vertical;
    const maxRow = orientation === 'h' ? mesh.rows : mesh.rows - 1;
    const maxCol = orientation === 'h' ? mesh.columns - 1 : mesh.columns;
    if (!Number.isInteger(row) || row < 0 || row >= maxRow) return {};
    if (!Number.isInteger(col) || col < 0 || col >= maxCol) return {};
    if (!table[row]?.[col]) return {};
    table[row][col][handleIndex] = position;
    const { corners, handles } = legacyProjection({ points: mesh.points, edgeHandles, rows: mesh.rows, columns: mesh.columns });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, edgeHandles, corners, handles }) } };
  }),
  setMeshGridSize: (rows, columns) => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const nextRows = Math.max(MESH_GRID_MIN, Math.min(MESH_GRID_MAX, Math.round(rows)));
    const nextColumns = Math.max(MESH_GRID_MIN, Math.min(MESH_GRID_MAX, Math.round(columns)));
    if (nextRows === mesh.rows && nextColumns === mesh.columns) return {};
    // Resample point positions onto the new lattice by evaluating the current
    // Coons grid at each new lattice node. Colors stay ramp-driven: the
    // continuous mesh field samples the shared gradient ramp along logical v.
    const pointAt = (r: number, c: number): Vec2Tuple => {
      const u = nextColumns <= 1 ? 0 : c / (nextColumns - 1);
      const v = nextRows <= 1 ? 0 : r / (nextRows - 1);
      return evaluateMeshPatch(mesh, u, v);
    };
    const points: Vec2Tuple[] = [];
    for (let r = 0; r < nextRows; r += 1) {
      for (let c = 0; c < nextColumns; c += 1) {
        points.push(pointAt(r, c));
      }
    }
    const edgeHandles = defaultEdgeHandles(points, nextRows, nextColumns);
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, rows: nextRows, columns: nextColumns, points, edgeHandles }) } };
  }),
  setBezierControl: (index, position) => set((s) => {
    if (index !== 0 && index !== 1) return {};
    const current = s.gradient.bezierControls ?? defaultBezierControlsForAnchors(s.gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS.bezier);
    const bezierControls = current.map((cp, cpIndex) => cpIndex === index ? position : cp) as [[number, number], [number, number]];
    return { gradient: { ...s.gradient, bezierControls } };
  }),
  resetMeshGradient: () => set((s) => ({ gradient: { ...s.gradient, gradientType: 'mesh', mesh: normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT), anchors: GRADIENT_ANCHOR_DEFAULTS.mesh } })),
  straightenMeshHandles: () => set((s) => {
    const mesh = normalizeMeshGradientConfig(s.gradient.mesh);
    const edgeHandles = defaultEdgeHandles(mesh.points, mesh.rows, mesh.columns);
    const { corners, handles } = legacyProjection({ points: mesh.points, edgeHandles, rows: mesh.rows, columns: mesh.columns });
    return { gradient: { ...s.gradient, mesh: normalizeMeshGradientConfig({ ...mesh, edgeHandles, corners, handles }) } };
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
    slitScan.offset = clampParameter(slitScan.offset, s.slitScan.offset, getParameterLimit('slit.offset'));
    slitScan.waveHeight = clampParameter(slitScan.waveHeight, s.slitScan.waveHeight, getParameterLimit('slit.waveHeight'));
    slitScan.polygonSides = clampParameter(slitScan.polygonSides, s.slitScan.polygonSides, getParameterLimit('slit.polygonSides'));
    slitScan.slitWidth = clampParameter(slitScan.slitWidth, s.slitScan.slitWidth, getParameterLimit('slit.slitWidth'));
    slitScan.offsetSpeed = clampParameter(slitScan.offsetSpeed, s.slitScan.offsetSpeed, getParameterLimit('slit.offsetSpeed'));
    slitScan.variance = clampParameter(slitScan.variance, s.slitScan.variance, getParameterLimit('slit.variance'));
    slitScan.seed = clampParameter(slitScan.seed, s.slitScan.seed, getParameterLimit('slit.seed'));
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
    stretch.bandHeight = clampParameter(stretch.bandHeight, s.stretch.bandHeight, getParameterLimit('stretch.bandHeight'));
    stretch.bandHeightVariance = clampParameter(stretch.bandHeightVariance, s.stretch.bandHeightVariance, getParameterLimit('stretch.bandHeightVariance'));
    stretch.variation = clampParameter(stretch.variation, s.stretch.variation, getParameterLimit('stretch.variation'));
    stretch.seed = clampParameter(stretch.seed, s.stretch.seed, getParameterLimit('stretch.seed'));
    stretch.glowIntensity = clampParameter(stretch.glowIntensity, s.stretch.glowIntensity, getParameterLimit('stretch.glowIntensity'));
    stretch.glowRadius = clampParameter(stretch.glowRadius, s.stretch.glowRadius, getParameterLimit('stretch.glowRadius'));
    stretch.glowThreshold = clampParameter(stretch.glowThreshold, s.stretch.glowThreshold, getParameterLimit('stretch.glowThreshold'));
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
      speed: clampParameter(nextAnimation.speed, s.animation.speed, getParameterLimit('animation.speed')),
      duration: beatSyncEnabled
        ? getBeatSyncDurationSeconds(beatSync?.bpm ?? 120)
        : clampParameter(nextAnimation.duration, s.animation.duration, getParameterLimit('animation.duration')),
    };
    animation.intensity = clampParameter(animation.intensity, s.animation.intensity, getParameterLimit('animation.intensity'));
    animation.direction = clampParameter(animation.direction, s.animation.direction, getParameterLimit('animation.direction'));
    return {
      animation,
      keyframeTracks: animation.enabled
        ? ensureDefaultAutoTracks(s, s.keyframeTracks)
        : s.keyframeTracks,
    };
  }),
  setNormalMap: (v) => set((s) => {
    const normalMap = { ...s.normalMap, ...v };
    normalMap.strength = clampParameter(normalMap.strength, s.normalMap.strength, getParameterLimit('normalMap.strength'));
    normalMap.blur = clampParameter(normalMap.blur, s.normalMap.blur, getParameterLimit('normalMap.blur'));
    normalMap.angle = clampParameter(normalMap.angle, s.normalMap.angle, getParameterLimit('normalMap.angle'));
    normalMap.bevelSize = clampParameter(normalMap.bevelSize, s.normalMap.bevelSize, getParameterLimit('normalMap.bevelSize'));
    return { normalMap };
  }),
  setClothGradient: (v) => set((s) => ({ clothGradient: normalizeClothGradientConfig({ ...s.clothGradient, ...v }) })),
  setConeView: (v) => set((s) => ({ coneView: normalizeConeViewConfig({ ...s.coneView, ...v }) })),
  setSeamless: (v) => set((s) => ({ seamless: normalizeSeamlessConfig({ ...s.seamless, ...v }) })),
  setFlowGradient: (v) => set((s) => ({
    flowGradient: normalizeFlowGradientConfig({ ...s.flowGradient, ...v }),
  })),
  setVideoMotion: (v) => set((s) => {
    const videoMotion = normalizeVideoMotionConfig({ ...s.videoMotion, ...v });
    const effectPipeline = v.enabled !== undefined && s.effectPipeline.version === 'stack-v2'
      ? {
        ...s.effectPipeline,
        effectStack: updateEffectStackLayer(s.effectPipeline.effectStack, 'videoMotion', { enabled: v.enabled }),
      }
      : s.effectPipeline;
    return { videoMotion, effectPipeline };
  }),
  setRadon: (v) => set((s) => {
    const radon = { ...s.radon, ...v };
    radon.strength = clampParameter(radon.strength, s.radon.strength, getParameterLimit('radon.strength'));
    radon.freq = clampParameter(radon.freq, s.radon.freq, getParameterLimit('radon.freq'));
    radon.radius = clampParameter(radon.radius, s.radon.radius, getParameterLimit('radon.radius'));
    radon.blur = clampParameter(radon.blur, s.radon.blur, getParameterLimit('radon.blur'));
    radon.angle = clampParameter(radon.angle, s.radon.angle, getParameterLimit('radon.angle'));
    radon.evolution = clampParameter(radon.evolution, s.radon.evolution, getParameterLimit('radon.evolution'));
    radon.speed = clampParameter(radon.speed, s.radon.speed, getParameterLimit('radon.speed'));
    const keyframeTracks = s.animation.enabled && radon.enabled
      ? ensureAutoTrack(s.keyframeTracks, 'radon.evolution')
      : s.keyframeTracks;
    return { radon, keyframeTracks };
  }),
  setIridescence: (v) => set((s) => {
    const iridescence = { ...s.iridescence, ...v };
    iridescence.strength = clampParameter(iridescence.strength, s.iridescence.strength, getParameterLimit('iridescence.strength'));
    iridescence.frequency = clampParameter(iridescence.frequency, s.iridescence.frequency, getParameterLimit('iridescence.frequency'));
    iridescence.speed = clampParameter(iridescence.speed, s.iridescence.speed, getParameterLimit('iridescence.speed'));
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
    const manualDistort = { ...s.manualDistort, ...v, displacement, smoothMask };
    manualDistort.brushSize = clampParameter(manualDistort.brushSize, s.manualDistort.brushSize, getParameterLimit('manualDistort.brushSize'));
    manualDistort.strength = clampParameter(manualDistort.strength, s.manualDistort.strength, getParameterLimit('manualDistort.strength'));
    manualDistort.falloff = clampParameter(manualDistort.falloff, s.manualDistort.falloff, getParameterLimit('manualDistort.falloff'));
    manualDistort.maxDisplacement = clampParameter(manualDistort.maxDisplacement, s.manualDistort.maxDisplacement, getParameterLimit('manualDistort.maxDisplacement'));
    return { manualDistort };
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
    const glassTile = normalizeGlassTileRenderParameters(next);
    next.glassTilePattern = glassTile.pattern;
    next.glassTileFacetDensity = glassTile.facetDensity;
    next.glassTileFacetDepth = glassTile.facetDepth;
    next.glassTileSize = glassTile.tileSize;
    next.glassTileBevel = glassTile.bevel;
    next.glassTileSurfaceHeight = glassTile.surfaceHeight;
    next.glassTileCurvature = glassTile.curvature;
    next.glassTileRefraction = glassTile.refraction;
    next.glassTileDispersion = glassTile.dispersion;
    next.glassTileRoughness = glassTile.roughness;
    next.glassTileDetailScale = glassTile.detailScale;
    next.glassTileRotation = glassTile.rotationRadians * 180 / Math.PI;
    next.glassTileMix = glassTile.mix;
    next.glassTileEdgeMode = glassTile.edgeMode;
    next.glassTileSeed = glassTile.seed;
    next.particleDirection = clampParameter(next.particleDirection, s.postprocess.particleDirection, getParameterLimit('postprocess.particleDirection'));
    if ((next.particleEmitterType as string) === 'nexus') next.particleEmitterType = 'point';
    if (!next.particleEmitterPoint) next.particleEmitterPoint = [...defaults.postprocess.particleEmitterPoint] as [number, number];
    const keyframeTracks = s.animation.enabled && isPostprocessTimeAnimationActive(next, s.effectPipeline)
      ? ensureAutoTrack(s.keyframeTracks, 'postprocess.__time')
      : s.keyframeTracks;
    return { postprocess: next, keyframeTracks };
  }),
  setEffectPipeline: (v) => set((s) => {
    const rawEffectStack = v.effectStack ?? s.effectPipeline.effectStack;
    const rawHasVideoMotionLayer = Array.isArray(rawEffectStack)
      && rawEffectStack.some(layer => (
        typeof layer === 'object'
        && layer !== null
        && (layer as { kind?: unknown }).kind === 'videoMotion'
      ));
    const effectPipeline = normalizeEffectPipelineConfig({
      ...s.effectPipeline,
      ...v,
      effectStack: rawEffectStack,
    });
    if (effectPipeline.version !== 'stack-v2') return { effectPipeline };
    // Presets written before Video Motion became a stack layer may carry an
    // enabled standalone config but no layer. Preserve that source while the
    // normalized pipeline acquires its canonical layer.
    if (!rawHasVideoMotionLayer && s.videoMotion.enabled) {
      effectPipeline.effectStack = updateEffectStackLayer(
        effectPipeline.effectStack,
        'videoMotion',
        { enabled: true },
      );
    }
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
      videoMotion: { ...s.videoMotion, enabled: enabled('videoMotion') },
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
