import { DEFAULT_CLOTH_GRADIENT } from '../types/clothGradient';
import { DEFAULT_CONE_VIEW } from '../types/coneView';
import { DEFAULT_SEAMLESS } from '../types/seamless';
import { DEFAULT_DIFFUSE_ASCII_CHARSET, DEFAULT_DIFFUSE_BACKGROUND_COLOR } from '../types/distortion';
import type { DiffuseAdaptiveChannel, DiffuseConfig, DiffuseHalftoneShape, ManualDistortConfig, NoiseDistortionConfig, PostprocessConfig } from '../types/distortion';
import { IMAGE_GRADIENT_DEFAULTS } from '../types/imageGradient';
import { gradientRampPresets } from '../lib/gradientRampUtils';
import type { PropertyTrack } from '../types/keyframe';
import { normalizePropertyTrack } from '../types/keyframe';
import { createAnimationTrack, getAnimationDefinition, isRemovedAnimationProperty } from '../lib/animationRegistry';
import { isPostprocessTimeAnimationActive } from '../lib/postprocessAnimation';
import { createDefaultPostprocessStack, normalizePostprocessEffectMode, normalizePostprocessEffectStack } from '../lib/postprocessStack';
import { createDefaultEffectPipeline } from '../lib/effectPipeline';
import { IDENTITY_DIFFUSE_BEZIER } from '../lib/diffuseCurve';
import { clampParameter, getDiffuseGrainParameterLimitKey, getEnumParameterDefault, getParameterDefault, getParameterLimit, normalizeEnumParameter, normalizePartialNumericConfig, normalizeTrackValue } from '../lib/parameterLimits';
import type { ParameterLimitKey } from '../lib/parameterLimits';
import { GLASS_V2_COLOR_DEFAULTS, normalizeGlassV2ColorParameters } from '../lib/glass';
import { GLASS_TILE_DEFAULTS, normalizeGlassTileRenderParameters } from '../lib/glassTile';
import { FLOW_GRADIENT_DEFAULTS } from '../types/flowGradient';
import type { DocumentState } from './documentSlice';

/** グラデーションタイプ別のデフォルトアンカーポイント（UV空間: y=0が底辺） */
export const GRADIENT_ANCHOR_DEFAULTS: Record<import('../types/gradient').GradientType, [[number,number],[number,number],[number,number],[number,number]]> = {
  linear:    [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]], // 下→上 (angle=180°と一致)
  radial:    [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、右端
  fourcolor: [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], // 4コーナー
  diamond:   [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、右端
  angle:     [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、角度基準点
  bezier:    [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]], // A/B端点を使うベジェ軸
  mesh:      [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], // Meshは専用のgradient.meshを一次情報とする
};

export function defaultBezierControlsForAnchors(
  anchors: [[number,number],[number,number],[number,number],[number,number]],
): [[number, number], [number, number]] {
  return [
    [
      anchors[0][0] + (anchors[1][0] - anchors[0][0]) / 3,
      anchors[0][1] + (anchors[1][1] - anchors[0][1]) / 3,
    ],
    [
      anchors[0][0] + (anchors[1][0] - anchors[0][0]) * 2 / 3,
      anchors[0][1] + (anchors[1][1] - anchors[0][1]) * 2 / 3,
    ],
  ];
}

const GRADIENT_TYPES = ['linear', 'radial', 'fourcolor', 'diamond', 'angle', 'bezier', 'mesh'] as const;

export function isGradientType(value: unknown): value is import('../types/gradient').GradientType {
  return typeof value === 'string' && (GRADIENT_TYPES as readonly string[]).includes(value);
}

/** ノイズタイプ切り替え時に自動適用するタイプ別初期値 */
export const NOISE_TYPE_PRESETS: Record<NoiseDistortionConfig['type'], Partial<NoiseDistortionConfig>> = {
  simplex: { amount: 0.15, scale: 3.0 },
  fbm: { amount: 0.20, scale: 2.0, octaves: 4 },
  voronoi: { amount: 0.15, scale: 6.0, voronoiDistMetric: 'euclidean', voronoiRandomness: 1.0, voronoiFeature: 'f1', voronoiMinkowskiExp: 2.0 },
  curl: { amount: 0.30, scale: 0.5, octaves: 3, curlSteps: 4, curlSpeed: 0.5, curlEps: 0.01, curlSeed: 0.0 },
  fast_curl: { amount: 0.30, scale: 0.5, octaves: 3, curlSteps: 2, curlSpeed: 0.5, curlSeed: 0.0, noiseLoopMode: 'seamless' },
  domain_warp_anim: { amount: 0.30, scale: 5.0, octaves: 3 },
  seamless: { amount: 0.30, scale: 0.5, octaves: 4, seamlessType: 'simplex', seamlessAnimation: 'drift', seamlessTwist: 0.0, noiseLoopMode: 'seamless', noiseLoopBlend: 0.75 },
  ridged_fbm: { amount: 0.40, scale: 2.5, octaves: 5, ridgeSharpness: 2.0, ridgeGain: 0.0, ridgeLacunarity: 2.0, ridgePersistence: 0.6, ridgeOffset: 1.0, ridgeWarp: 1.0 },
  ae_fractal: { amount: 0.30, scale: 2.0, octaves: 6, aeFractalType: 'basic', aeSubInfluence: 0.7, aeSubScaling: 1.78, aeSubRotation: 45, aeContrast: 1.0, aeBrightness: 0.0 },
  caustics: { amount: 0.45, scale: 2.4, octaves: 4, speed: 0.5, noiseLoopMode: 'seamless', noiseLoopBlend: 0.75, causticsDepth: 0.65, causticsRefraction: 1.0, causticsSharpness: 2.5, causticsComplexity: 4, causticsWaveSpread: 0.75, causticsBoundaryWidth: 0.75 },
  phasor: { amount: 0.24, scale: 2.8, octaves: 3, speed: 0.5, noiseLoopMode: 'seamless', noiseLoopBlend: 0.75, phasorFrequency: 5.0, phasorBandwidth: 0.8, phasorDirection: 28, phasorDirectionSpread: 0.35, phasorSharpness: 3.0, phasorWarpStrength: 0.18, phasorTangentMix: 0.65, phasorKernelDensity: 1.0, phasorDirectionMode: 'directional' },
};

const MANUAL_DISTORT_MAP_RESOLUTION = 64;

export const createEmptyManualDistortMap = (resolution = MANUAL_DISTORT_MAP_RESOLUTION): number[] =>
  Array(resolution * resolution * 2).fill(0);

export const createEmptyManualSmoothMask = (resolution = MANUAL_DISTORT_MAP_RESOLUTION): number[] =>
  Array(resolution * resolution).fill(0);

export const STORE_DEFAULTS = {
  gradient: {
    angle: getParameterDefault('gradient.angle'),
    stops: [...gradientRampPresets.Kagaribi_15_BG],
    opacityStops: [
      { position: 0.0, opacity: 1.0 },
      { position: 1.0, opacity: 1.0 },
    ],
    rampColorMode: 'rgb' as const,
    rampInterpolation: 'ease' as const,
    rampVariable: getParameterDefault('gradient.rampVariable'),
    rampRepeat: getParameterDefault('gradient.rampRepeat'),
    gradientType: 'linear' as import('../types/gradient').GradientType,
    anchors: [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]] as [[number,number],[number,number],[number,number],[number,number]],
    bezierControls: defaultBezierControlsForAnchors(GRADIENT_ANCHOR_DEFAULTS.bezier),
    rampMirror: false,
  },
  noiseDistortion: {
    enabled: false,
    type: 'simplex' as const,
    amount: getParameterDefault('noise.amount'),
    scale: getParameterDefault('noise.scale'),
    octaves: getParameterDefault('noise.octaves'),
    evolution: getParameterDefault('noise.evolution'),
    speed: getParameterDefault('noise.speed'),
    dwRotAngle1: getParameterDefault('noise.dwRotAngle1'),
    dwRotAngle2: getParameterDefault('noise.dwRotAngle2'),
    dwDist1: getParameterDefault('noise.dwDist1'),
    dwDist2: getParameterDefault('noise.dwDist2'),
    dwDist3: getParameterDefault('noise.dwDist3'),
    curlSteps: getParameterDefault('noise.curlSteps'),
    curlSpeed: getParameterDefault('noise.curlSpeed'),
    curlEps: getParameterDefault('noise.curlEps'),
    curlSeed: getParameterDefault('noise.seed'),
    noiseSeed: getParameterDefault('noise.seed'),
    noiseLoopMode: 'seamless' as const,
    noiseLoopBlend: getParameterDefault('noise.noiseLoopBlend'),
    dwInitVal: getParameterDefault('noise.dwInitVal'),
    dwInitAmp: getParameterDefault('noise.dwInitAmp'),
    dwDriftAngle: getParameterDefault('noise.dwDriftAngle'),
    seamlessType: 'simplex' as const,
    seamlessAnimation: 'drift' as const,
    seamlessTwist: getParameterDefault('noise.seamlessTwist'),
    voronoiDistMetric: getEnumParameterDefault('noise.voronoiDistMetric'),
    voronoiRandomness: getParameterDefault('noise.voronoiRandomness'),
    voronoiFeature: getEnumParameterDefault('noise.voronoiFeature'),
    voronoiMinkowskiExp: getParameterDefault('noise.voronoiMinkowskiExp'),
    ridgeSharpness: getParameterDefault('noise.ridgeSharpness'),
    ridgeGain: getParameterDefault('noise.ridgeGain'),
    ridgeLacunarity: getParameterDefault('noise.ridgeLacunarity'),
    ridgePersistence: getParameterDefault('noise.ridgePersistence'),
    ridgeOffset: getParameterDefault('noise.ridgeOffset'),
    ridgeWarp: getParameterDefault('noise.ridgeWarp'),
    aeFractalType: 'basic' as const,
    aeSubInfluence: getParameterDefault('noise.aeSubInfluence'),
    aeSubScaling: getParameterDefault('noise.aeSubScaling'),
    aeSubRotation: getParameterDefault('noise.aeSubRotation'),
    aeContrast: getParameterDefault('noise.aeContrast'),
    aeBrightness: getParameterDefault('noise.aeBrightness'),
    causticsDepth: getParameterDefault('noise.causticsDepth'),
    causticsRefraction: getParameterDefault('noise.causticsRefraction'),
    causticsSharpness: getParameterDefault('noise.causticsSharpness'),
    causticsComplexity: getParameterDefault('noise.causticsComplexity'),
    causticsWaveSpread: getParameterDefault('noise.causticsWaveSpread'),
    causticsBoundaryWidth: getParameterDefault('noise.causticsBoundaryWidth'),
    phasorFrequency: getParameterDefault('noise.phasorFrequency'),
    phasorBandwidth: getParameterDefault('noise.phasorBandwidth'),
    phasorDirection: getParameterDefault('noise.phasorDirection'),
    phasorDirectionSpread: getParameterDefault('noise.phasorDirectionSpread'),
    phasorSharpness: getParameterDefault('noise.phasorSharpness'),
    phasorWarpStrength: getParameterDefault('noise.phasorWarpStrength'),
    phasorTangentMix: getParameterDefault('noise.phasorTangentMix'),
    phasorKernelDensity: getParameterDefault('noise.phasorKernelDensity'),
    phasorDirectionMode: 'directional' as const,
  },
  diffuse: {
    enabled: true,
    mode: 'smooth' as const,
    ditherMode: 'pattern_dither' as const,
    scatter: getParameterDefault('diffuse.scatter'),
    grain: getParameterDefault('diffuse.grain'),
    seed: getParameterDefault('diffuse.seed'),
    seedAnimEnabled: false,
    ditherThreshold: getParameterDefault('diffuse.ditherThreshold'),
    halftoneShape: 'circle' as const,
    halftoneSize: getParameterDefault('diffuse.halftoneSize'),
    asciiCharset: DEFAULT_DIFFUSE_ASCII_CHARSET,
    asciiFont: 'monospace',
    asciiFontSize: getParameterDefault('diffuse.asciiFontSize'),
    asciiRotation: getParameterDefault('diffuse.asciiRotation'),
    backgroundColor: DEFAULT_DIFFUSE_BACKGROUND_COLOR,
    adaptiveEnabled: false,
    adaptiveChannel: 'luminance' as DiffuseAdaptiveChannel,
    luminanceBezier: [...IDENTITY_DIFFUSE_BEZIER] as DiffuseConfig['luminanceBezier'],
    grainAdaptiveEnabled: false,
    grainAdaptiveAmount: getParameterDefault('diffuse.grainAdaptiveAmount'),
    grainBezier: [...IDENTITY_DIFFUSE_BEZIER] as DiffuseConfig['grainBezier'],
  },
  imageGradient: IMAGE_GRADIENT_DEFAULTS,
  slitScan: {
    enabled: false,
    mode: 'linear' as const,
    angle: getParameterDefault('slit.angle'),
    waveType: 'sine' as const,
    waveHeight: getParameterDefault('slit.waveHeight'),
    polygonSides: getParameterDefault('slit.polygonSides'),
    slitWidth: getParameterDefault('slit.slitWidth'),
    offset: getParameterDefault('slit.offset'),
    offsetSpeed: getParameterDefault('slit.offsetSpeed'),
    animEnabled: false,
    animMode: 'unidirectional' as const,
    variance: getParameterDefault('slit.variance'),
    seed: getParameterDefault('slit.seed'),
    slitPhase: 0,
    selectedSlitIdx: -1,
    slitDeltas: {} as Record<number, number>,
    pixelPerfect: false,
    offsetAngle: getParameterDefault('slit.offsetAngle'),
  },
  stretch: {
    enabled: false,
    bandHeight: getParameterDefault('stretch.bandHeight'),
    bandHeightVariance: getParameterDefault('stretch.bandHeightVariance'),
    variation: getParameterDefault('stretch.variation'),
    seed: getParameterDefault('stretch.seed'),
    glowEnabled: false,
    glowIntensity: getParameterDefault('stretch.glowIntensity'),
    glowRadius: getParameterDefault('stretch.glowRadius'),
    glowThreshold: getParameterDefault('stretch.glowThreshold'),
    glowTint: '#F0EAD9',
  },
  animation: {
    enabled: false,
    previewLoop: true,
    speed: getParameterDefault('animation.speed'),
    intensity: getParameterDefault('animation.intensity'),
    duration: getParameterDefault('animation.duration'),
    fps: 24 as 24 | 30 | 60,
    direction: getParameterDefault('animation.direction'),  // 0° = 左→右
    easing: {
      enabled: false,
      p1: [0.25, 0.25] as [number, number],
      p2: [0.75, 0.75] as [number, number],
      linkMode: 'none' as const,
      beatSync: {
        enabled: false,
        bpm: 120,
        beatsPerBar: 4,
        subdivision: 4 as 3 | 4,
      },
    },
    affectNoise: true,
    affectSlit: false,
    affectRamp: false,
    affectStretch: false,
  },
  normalMap: {
    enabled: false,
    strength: getParameterDefault('normalMap.strength'),
    blur: getParameterDefault('normalMap.blur'),   // Gaussian sigma (px) for post-effect blur
    angle: getParameterDefault('normalMap.angle'),
    bevelSize: getParameterDefault('normalMap.bevelSize'),
    invert: false,
  },
  clothGradient: { ...DEFAULT_CLOTH_GRADIENT },
  coneView: { ...DEFAULT_CONE_VIEW },
  seamless: { ...DEFAULT_SEAMLESS },
  flowGradient: { ...FLOW_GRADIENT_DEFAULTS },
  radon: {
    enabled: false,
    strength: getParameterDefault('radon.strength'),
    freq: getParameterDefault('radon.freq'),
    radius: getParameterDefault('radon.radius'),
    angle: getParameterDefault('radon.angle'),
    blur: getParameterDefault('radon.blur'),
    evolution: getParameterDefault('radon.evolution'),
    speed: getParameterDefault('radon.speed'),
  },
  iridescence: {
    enabled: false,
    strength: getParameterDefault('iridescence.strength'),
    speed: getParameterDefault('iridescence.speed'),
    frequency: getParameterDefault('iridescence.frequency'),
    angle: getParameterDefault('iridescence.angle'),
  },
  manualDistort: {
    enabled: false,
    mode: 'warp' as const,
    brushSize: getParameterDefault('manualDistort.brushSize'),
    strength: getParameterDefault('manualDistort.strength'),
    falloff: getParameterDefault('manualDistort.falloff'),
    showOverlay: true,
    mapResolution: MANUAL_DISTORT_MAP_RESOLUTION,
    displacement: createEmptyManualDistortMap(MANUAL_DISTORT_MAP_RESOLUTION),
    smoothMask: createEmptyManualSmoothMask(MANUAL_DISTORT_MAP_RESOLUTION),
    smoothStrength: 0.65,
    smoothRadius: 18,
    maxDisplacement: getParameterDefault('manualDistort.maxDisplacement'),
  },
  postprocess: {
    enabled: false,
    effectMode: 'distort' as const,
    effectStack: createDefaultPostprocessStack('distort'),
    mirrorMode: 'horizontal' as const,
    kaleidoscopeType: 'unfold' as const,
    kaleidoscopeSlices: getParameterDefault('postprocess.kaleidoscopeSlices'),
    kaleidoscopeRotation: getParameterDefault('postprocess.kaleidoscopeRotation'),
    kaleidoscopeZoom: getParameterDefault('postprocess.kaleidoscopeZoom'),
    prismCenter: [0.5, 0.5] as [number, number],
    prismRayCount: getParameterDefault('postprocess.prismRayCount'),
    prismLength: getParameterDefault('postprocess.prismLength'),
    prismLengthRandomness: getParameterDefault('postprocess.prismLengthRandomness'),
    prismWidth: getParameterDefault('postprocess.prismWidth'),
    prismRandomness: getParameterDefault('postprocess.prismRandomness'),
    prismBlur: getParameterDefault('postprocess.prismBlur'),
    prismIntensity: getParameterDefault('postprocess.prismIntensity'),
    prismGlowRadius: getParameterDefault('postprocess.prismGlowRadius'),
    prismChromaticAberration: getParameterDefault('postprocess.prismChromaticAberration'),
    prismSeed: getParameterDefault('postprocess.prismSeed'),
    prismInnerRadius: getParameterDefault('postprocess.prismInnerRadius'),
    voronoiScale: getParameterDefault('postprocess.voronoiScale'),
    voronoiRandomness: getParameterDefault('postprocess.voronoiRandomness'),
    voronoiDistMetric: getEnumParameterDefault('postprocess.voronoiDistMetric'),
    voronoiFeature: getEnumParameterDefault('postprocess.voronoiFeature'),
    voronoiMinkowskiExp: getParameterDefault('postprocess.voronoiMinkowskiExp'),
    voronoiAngle: getParameterDefault('postprocess.voronoiAngle'),
    voronoiGradientScale: getParameterDefault('postprocess.voronoiGradientScale'),
    voronoiEdgeWidth: getParameterDefault('postprocess.voronoiEdgeWidth'),
    voronoiSeed: getParameterDefault('postprocess.voronoiSeed'),
    glassScale: getParameterDefault('postprocess.glassScale'),
    glassStretch: getParameterDefault('postprocess.glassStretch'),
    glassRotation: getParameterDefault('postprocess.glassRotation'),
    glassComplexity: getParameterDefault('postprocess.glassComplexity'),
    glassWarp: getParameterDefault('postprocess.glassWarp'),
    glassSeed: getParameterDefault('postprocess.glassSeed'),
    glassNoiseInfluence: getParameterDefault('postprocess.glassNoiseInfluence'),
    glassRefraction: getParameterDefault('postprocess.glassRefraction'),
    glassChromaticAberration: getParameterDefault('postprocess.glassChromaticAberration'),
    glassRoughness: getParameterDefault('postprocess.glassRoughness'),
    glassHighlight: getParameterDefault('postprocess.glassHighlight'),
    glassMix: getParameterDefault('postprocess.glassMix'),
    glassEvolution: getParameterDefault('postprocess.glassEvolution'),
    glassMotion: getParameterDefault('postprocess.glassMotion'),
    glassV2ChromaticHue: GLASS_V2_COLOR_DEFAULTS.chromaticHue,
    glassV2ChromaticSaturation: GLASS_V2_COLOR_DEFAULTS.chromaticSaturation,
    glassV2TransmissionTint: GLASS_V2_COLOR_DEFAULTS.transmissionTint,
    glassV2HighlightTint: GLASS_V2_COLOR_DEFAULTS.highlightTint,
    glassTilePattern: GLASS_TILE_DEFAULTS.pattern,
    glassTileSize: GLASS_TILE_DEFAULTS.tileSize,
    glassTileBevel: GLASS_TILE_DEFAULTS.bevel,
    glassTileSurfaceHeight: GLASS_TILE_DEFAULTS.surfaceHeight,
    glassTileCurvature: GLASS_TILE_DEFAULTS.curvature,
    glassTileRefraction: GLASS_TILE_DEFAULTS.refraction,
    glassTileDispersion: GLASS_TILE_DEFAULTS.dispersion,
    glassTileRoughness: GLASS_TILE_DEFAULTS.roughness,
    glassTileDetailScale: GLASS_TILE_DEFAULTS.detailScale,
    glassTileRotation: GLASS_TILE_DEFAULTS.rotation,
    glassTileMix: GLASS_TILE_DEFAULTS.mix,
    glassTileEdgeMode: GLASS_TILE_DEFAULTS.edgeMode,
    glassTileSeed: GLASS_TILE_DEFAULTS.seed,
    particleCount: getParameterDefault('postprocess.particleCount'),
    particleEmitterType: 'field' as const,
    particleEmitterPoint: [getParameterDefault('postprocess.particleEmitterPointX'), getParameterDefault('postprocess.particleEmitterPointY')] as [number, number],
    particleSize: getParameterDefault('postprocess.particleSize'),
    particleSizeRandomness: getParameterDefault('postprocess.particleSizeRandomness'),
    particleLifeCycle: getParameterDefault('postprocess.particleLifeCycle'),
    particleLifeRandom: getParameterDefault('postprocess.particleLifeRandom'),
    particleSizeOverLife: getParameterDefault('postprocess.particleSizeOverLife'),
    particleFeather: getParameterDefault('postprocess.particleFeather'),
    particleCore: getParameterDefault('postprocess.particleCore'),
    particleBrightness: getParameterDefault('postprocess.particleBrightness'),
    particleEdgeFade: getParameterDefault('postprocess.particleEdgeFade'),
    particleSpeed: getParameterDefault('postprocess.particleSpeed'),
    particleSpread: getParameterDefault('postprocess.particleSpread'),
    particleTurbulence: getParameterDefault('postprocess.particleTurbulence'),
    particleCurlScale: getParameterDefault('postprocess.particleCurlScale'),
    particleCurlStrength: getParameterDefault('postprocess.particleCurlStrength'),
    particleCurlSpeed: getParameterDefault('postprocess.particleCurlSpeed'),
    particleCurlEvolution: getParameterDefault('postprocess.particleCurlEvolution'),
    particleRadialForce: getParameterDefault('postprocess.particleRadialForce'),
    particleRadialFalloff: getParameterDefault('postprocess.particleRadialFalloff'),
    particleDepth: getParameterDefault('postprocess.particleDepth'),
    particleOpacity: getParameterDefault('postprocess.particleOpacity'),
    particleColorVariance: getParameterDefault('postprocess.particleColorVariance'),
    particleColorOverLifeMode: 'ramp' as const,
    particleColorOverLife: getParameterDefault('postprocess.particleColorOverLife'),
    particleDirection: getParameterDefault('postprocess.particleDirection'),
    particleSeed: getParameterDefault('postprocess.particleSeed'),
    particleBlendMode: 'add' as const,
    diffuseEnabled: false,
    diffuseMode: 'smooth' as const,
    diffuseScatter: getParameterDefault('diffuse.scatter'),
    diffuseGrain: getParameterDefault('diffuse.grain'),
    diffuseSeed: getParameterDefault('diffuse.seed'),
    diffuseDitherThreshold: getParameterDefault('diffuse.ditherThreshold'),
    diffuseHalftoneShape: 'circle' as DiffuseHalftoneShape,
    diffuseHalftoneSize: getParameterDefault('diffuse.halftoneSize'),
    diffuseAsciiCharset: DEFAULT_DIFFUSE_ASCII_CHARSET,
    diffuseBackgroundColor: DEFAULT_DIFFUSE_BACKGROUND_COLOR,
    diffuseAdaptiveChannel: 'luminance' as DiffuseAdaptiveChannel,
    diffuseGrainAdaptiveEnabled: false,
    diffuseGrainAdaptiveAmount: getParameterDefault('diffuse.grainAdaptiveAmount'),
    diffuseGrainBezier: [...IDENTITY_DIFFUSE_BEZIER] as DiffuseConfig['grainBezier'],
    mode: 'warp' as const,
    brushSize: 120,
    strength: 1.0,
    falloff: 1.8,
    showOverlay: true,
    mapResolution: MANUAL_DISTORT_MAP_RESOLUTION,
    displacement: createEmptyManualDistortMap(MANUAL_DISTORT_MAP_RESOLUTION),
    smoothMask: createEmptyManualSmoothMask(MANUAL_DISTORT_MAP_RESOLUTION),
    smoothStrength: 0.65,
    smoothRadius: 18,
    maxDisplacement: 1.0,
  },
  effectPipeline: createDefaultEffectPipeline(),
  matcap: {
    enabled: false,
  },
  histogram: {
    enabled: true,
    showRampDistribution: true,
    scale: 1.0,
  },
};

/**
 * Completes persisted Noise Distortion data before it reaches rendering or
 * history. This keeps presets written before a Noise type gained fields
 * forward-compatible without relying on a type assertion alone.
 */
const NOISE_PARAMETER_LIMIT_KEYS = {
  amount: 'noise.amount',
  octaves: 'noise.octaves',
  evolution: 'noise.evolution',
  speed: 'noise.speed',
  curlSteps: 'noise.curlSteps',
  curlSpeed: 'noise.curlSpeed',
  curlEps: 'noise.curlEps',
  curlSeed: 'noise.seed',
  noiseSeed: 'noise.seed',
  noiseLoopBlend: 'noise.noiseLoopBlend',
  seamlessTwist: 'noise.seamlessTwist',
  voronoiRandomness: 'noise.voronoiRandomness',
  voronoiMinkowskiExp: 'noise.voronoiMinkowskiExp',
  ridgeWarp: 'noise.ridgeWarp',
  ridgeSharpness: 'noise.ridgeSharpness',
  ridgeOffset: 'noise.ridgeOffset',
  ridgeLacunarity: 'noise.ridgeLacunarity',
  ridgePersistence: 'noise.ridgePersistence',
  ridgeGain: 'noise.ridgeGain',
  aeSubInfluence: 'noise.aeSubInfluence',
  aeSubScaling: 'noise.aeSubScaling',
  aeContrast: 'noise.aeContrast',
  aeBrightness: 'noise.aeBrightness',
  dwInitAmp: 'noise.dwInitAmp',
  dwInitVal: 'noise.dwInitVal',
  dwDist1: 'noise.dwDist1',
  dwDist2: 'noise.dwDist2',
  dwDist3: 'noise.dwDist3',
  dwRotAngle1: 'noise.dwRotAngle1',
  dwRotAngle2: 'noise.dwRotAngle2',
  dwDriftAngle: 'noise.dwDriftAngle',
  aeSubRotation: 'noise.aeSubRotation',
  causticsDepth: 'noise.causticsDepth',
  causticsSharpness: 'noise.causticsSharpness',
  causticsComplexity: 'noise.causticsComplexity',
  causticsWaveSpread: 'noise.causticsWaveSpread',
  causticsBoundaryWidth: 'noise.causticsBoundaryWidth',
  phasorFrequency: 'noise.phasorFrequency',
  phasorBandwidth: 'noise.phasorBandwidth',
  phasorDirection: 'noise.phasorDirection',
  phasorDirectionSpread: 'noise.phasorDirectionSpread',
  phasorSharpness: 'noise.phasorSharpness',
  phasorWarpStrength: 'noise.phasorWarpStrength',
  phasorTangentMix: 'noise.phasorTangentMix',
  phasorKernelDensity: 'noise.phasorKernelDensity',
} as const satisfies Partial<Record<keyof NoiseDistortionConfig, ParameterLimitKey>>;

export function normalizeNoiseDistortionConfig(
  saved?: Partial<NoiseDistortionConfig>,
): NoiseDistortionConfig {
  const merged: NoiseDistortionConfig = {
    ...STORE_DEFAULTS.noiseDistortion,
    ...saved,
  };
  const normalized = normalizePartialNumericConfig(
    merged,
    STORE_DEFAULTS.noiseDistortion,
    {
      ...NOISE_PARAMETER_LIMIT_KEYS,
      scale: merged.type === 'caustics' ? 'noise.causticsScale' : 'noise.scale',
    },
  );
  normalized.voronoiDistMetric = normalizeEnumParameter('noise.voronoiDistMetric', normalized.voronoiDistMetric);
  normalized.voronoiFeature = normalizeEnumParameter('noise.voronoiFeature', normalized.voronoiFeature);
  // Refraction is intentionally fixed at 1 for Caustics. Keep the field in
  // persisted data so older presets remain readable, but do not expose an
  // obsolete user-controlled degree of freedom.
  normalized.causticsRefraction = normalized.type === 'caustics'
    ? 1.0
    : clampParameter(normalized.causticsRefraction, STORE_DEFAULTS.noiseDistortion.causticsRefraction, getParameterLimit('noise.causticsRefraction'));
  if (normalized.phasorDirectionMode !== 'radial' && normalized.phasorDirectionMode !== 'swirl') {
    normalized.phasorDirectionMode = 'directional';
  }
  return normalized;
}

export function normalizeDiffuseBackgroundColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

const POSTPROCESS_PARAMETER_LIMIT_KEYS = {
  brushSize: 'manualDistort.brushSize',
  strength: 'manualDistort.strength',
  falloff: 'manualDistort.falloff',
  maxDisplacement: 'manualDistort.maxDisplacement',
  kaleidoscopeSlices: 'postprocess.kaleidoscopeSlices',
  kaleidoscopeRotation: 'postprocess.kaleidoscopeRotation',
  kaleidoscopeZoom: 'postprocess.kaleidoscopeZoom',
  prismRayCount: 'postprocess.prismRayCount',
  prismLength: 'postprocess.prismLength',
  prismLengthRandomness: 'postprocess.prismLengthRandomness',
  prismWidth: 'postprocess.prismWidth',
  prismRandomness: 'postprocess.prismRandomness',
  prismBlur: 'postprocess.prismBlur',
  prismIntensity: 'postprocess.prismIntensity',
  prismGlowRadius: 'postprocess.prismGlowRadius',
  prismChromaticAberration: 'postprocess.prismChromaticAberration',
  prismInnerRadius: 'postprocess.prismInnerRadius',
  prismSeed: 'postprocess.prismSeed',
  voronoiScale: 'postprocess.voronoiScale',
  voronoiRandomness: 'postprocess.voronoiRandomness',
  voronoiMinkowskiExp: 'postprocess.voronoiMinkowskiExp',
  voronoiAngle: 'postprocess.voronoiAngle',
  voronoiGradientScale: 'postprocess.voronoiGradientScale',
  voronoiEdgeWidth: 'postprocess.voronoiEdgeWidth',
  voronoiSeed: 'postprocess.voronoiSeed',
  glassScale: 'postprocess.glassScale',
  glassStretch: 'postprocess.glassStretch',
  glassRotation: 'postprocess.glassRotation',
  glassComplexity: 'postprocess.glassComplexity',
  glassWarp: 'postprocess.glassWarp',
  glassSeed: 'postprocess.glassSeed',
  glassNoiseInfluence: 'postprocess.glassNoiseInfluence',
  glassRefraction: 'postprocess.glassRefraction',
  glassChromaticAberration: 'postprocess.glassChromaticAberration',
  glassRoughness: 'postprocess.glassRoughness',
  glassHighlight: 'postprocess.glassHighlight',
  glassMix: 'postprocess.glassMix',
  glassEvolution: 'postprocess.glassEvolution',
  glassMotion: 'postprocess.glassMotion',
  particleCount: 'postprocess.particleCount',
  particleSize: 'postprocess.particleSize',
  particleSizeRandomness: 'postprocess.particleSizeRandomness',
  particleLifeCycle: 'postprocess.particleLifeCycle',
  particleLifeRandom: 'postprocess.particleLifeRandom',
  particleSizeOverLife: 'postprocess.particleSizeOverLife',
  particleFeather: 'postprocess.particleFeather',
  particleCore: 'postprocess.particleCore',
  particleBrightness: 'postprocess.particleBrightness',
  particleEdgeFade: 'postprocess.particleEdgeFade',
  particleSpeed: 'postprocess.particleSpeed',
  particleSpread: 'postprocess.particleSpread',
  particleTurbulence: 'postprocess.particleTurbulence',
  particleCurlScale: 'postprocess.particleCurlScale',
  particleCurlStrength: 'postprocess.particleCurlStrength',
  particleCurlSpeed: 'postprocess.particleCurlSpeed',
  particleCurlEvolution: 'postprocess.particleCurlEvolution',
  particleRadialForce: 'postprocess.particleRadialForce',
  particleRadialFalloff: 'postprocess.particleRadialFalloff',
  particleDepth: 'postprocess.particleDepth',
  particleOpacity: 'postprocess.particleOpacity',
  particleColorVariance: 'postprocess.particleColorVariance',
  particleColorOverLife: 'postprocess.particleColorOverLife',
  diffuseScatter: 'diffuse.scatter',
  diffuseGrain: 'diffuse.grain',
  diffuseSeed: 'diffuse.seed',
  diffuseDitherThreshold: 'diffuse.ditherThreshold',
  particleDirection: 'postprocess.particleDirection',
  particleSeed: 'postprocess.particleSeed',
} as const satisfies Partial<Record<keyof PostprocessConfig, ParameterLimitKey>>;

export function normalizePostprocessConfig(
  saved?: Partial<PostprocessConfig>,
  legacyDistort?: Partial<ManualDistortConfig>,
): PostprocessConfig {
  // Postprocess Distort is the canonical editor state. `manualDistort` is
  // accepted only as a read-time fallback for presets created before Distort
  // moved under Postprocess.
  const source: Partial<PostprocessConfig> = saved ?? legacyDistort ?? {};
  const rawResolution = source?.mapResolution;
  const resolution = typeof rawResolution === 'number' && Number.isFinite(rawResolution)
    ? Math.max(1, Math.min(512, Math.round(rawResolution)))
    : STORE_DEFAULTS.postprocess.mapResolution;
  const displacementLength = resolution * resolution * 2;
  const smoothMaskLength = resolution * resolution;
  const savedDisplacement = source?.displacement;
  const savedSmoothMask = source?.smoothMask;
  const validFiniteArray = (value: unknown, expectedLength: number): value is number[] => (
    Array.isArray(value)
    && value.length === expectedLength
    && value.every(item => typeof item === 'number' && Number.isFinite(item))
  );
  const effectMode = normalizePostprocessEffectMode(
    source?.effectMode,
    STORE_DEFAULTS.postprocess.effectMode,
  );
  const diffuseGrainParameterLimitKey = getDiffuseGrainParameterLimitKey(source.diffuseMode);
  const defaults = {
    ...STORE_DEFAULTS.postprocess,
    diffuseGrain: clampParameter(
      STORE_DEFAULTS.postprocess.diffuseGrain,
      getParameterDefault(diffuseGrainParameterLimitKey),
      getParameterLimit(diffuseGrainParameterLimitKey),
    ),
  };
  const parameterLimitKeys = {
    ...POSTPROCESS_PARAMETER_LIMIT_KEYS,
    diffuseGrain: diffuseGrainParameterLimitKey,
  };
  const normalized = normalizePartialNumericConfig<PostprocessConfig>({
    ...defaults,
    ...source,
    effectMode,
    effectStack: normalizePostprocessEffectStack(source?.effectStack, effectMode),
    mapResolution: resolution,
    displacement: validFiniteArray(savedDisplacement, displacementLength)
      ? [...savedDisplacement]
      : createEmptyManualDistortMap(resolution),
    smoothMask: validFiniteArray(savedSmoothMask, smoothMaskLength)
      ? [...savedSmoothMask]
      : createEmptyManualSmoothMask(resolution),
  },
    defaults,
    parameterLimitKeys,
  );
  normalized.prismCenter = [
    clampParameter(normalized.prismCenter[0], STORE_DEFAULTS.postprocess.prismCenter[0], getParameterLimit('postprocess.prismCenterX')),
    clampParameter(normalized.prismCenter[1], STORE_DEFAULTS.postprocess.prismCenter[1], getParameterLimit('postprocess.prismCenterY')),
  ];
  normalized.voronoiDistMetric = normalizeEnumParameter('postprocess.voronoiDistMetric', normalized.voronoiDistMetric);
  normalized.voronoiFeature = normalizeEnumParameter('postprocess.voronoiFeature', normalized.voronoiFeature);
  const glassV2Color = normalizeGlassV2ColorParameters(normalized);
  normalized.glassV2ChromaticHue = glassV2Color.chromaticHueDegrees;
  normalized.glassV2ChromaticSaturation = glassV2Color.chromaticSaturation;
  normalized.glassV2TransmissionTint = glassV2Color.transmissionTint;
  normalized.glassV2HighlightTint = glassV2Color.highlightTint;
  const glassTile = normalizeGlassTileRenderParameters(normalized);
  normalized.glassTilePattern = glassTile.pattern;
  normalized.glassTileSize = glassTile.tileSize;
  normalized.glassTileBevel = glassTile.bevel;
  normalized.glassTileSurfaceHeight = glassTile.surfaceHeight;
  normalized.glassTileCurvature = glassTile.curvature;
  normalized.glassTileRefraction = glassTile.refraction;
  normalized.glassTileDispersion = glassTile.dispersion;
  normalized.glassTileRoughness = glassTile.roughness;
  normalized.glassTileDetailScale = glassTile.detailScale;
  normalized.glassTileRotation = glassTile.rotationRadians * 180 / Math.PI;
  normalized.glassTileMix = glassTile.mix;
  normalized.glassTileEdgeMode = glassTile.edgeMode;
  normalized.glassTileSeed = glassTile.seed;
  normalized.particleEmitterPoint = [
    clampParameter(normalized.particleEmitterPoint[0], STORE_DEFAULTS.postprocess.particleEmitterPoint[0], getParameterLimit('postprocess.particleEmitterPointX')),
    clampParameter(normalized.particleEmitterPoint[1], STORE_DEFAULTS.postprocess.particleEmitterPoint[1], getParameterLimit('postprocess.particleEmitterPointY')),
  ];
  normalized.diffuseBackgroundColor = normalizeDiffuseBackgroundColor(
    normalized.diffuseBackgroundColor,
    STORE_DEFAULTS.postprocess.diffuseBackgroundColor,
  );
  if (normalized.diffuseHalftoneSize !== undefined) {
    normalized.diffuseHalftoneSize = clampParameter(normalized.diffuseHalftoneSize, STORE_DEFAULTS.postprocess.diffuseHalftoneSize ?? getParameterDefault('diffuse.halftoneSize'), getParameterLimit('diffuse.halftoneSize'));
  }
  if (normalized.diffuseGrainAdaptiveAmount !== undefined) {
    normalized.diffuseGrainAdaptiveAmount = clampParameter(normalized.diffuseGrainAdaptiveAmount, STORE_DEFAULTS.postprocess.diffuseGrainAdaptiveAmount ?? getParameterDefault('diffuse.grainAdaptiveAmount'), getParameterLimit('diffuse.grainAdaptiveAmount'));
  }
  return normalized;
}

type AutoTrackState = Pick<DocumentState,
  'noiseDistortion' | 'diffuse' | 'slitScan' | 'stretch' | 'radon' | 'iridescence' | 'postprocess' | 'effectPipeline' | 'animation'
>;

export function ensureAutoTrack(
  tracks: Record<string, PropertyTrack>,
  propertyId: string,
): Record<string, PropertyTrack> {
  const existing = tracks[propertyId];
  if (existing) {
    return { ...tracks, [propertyId]: normalizePropertyTrack(existing) };
  }
  const definition = getAnimationDefinition(propertyId);
  return {
    ...tracks,
    [propertyId]: createAnimationTrack(propertyId, definition?.label ?? propertyId, 'auto'),
  };
}

export function ensureDefaultAutoTracks(
  state: AutoTrackState,
  source: Record<string, PropertyTrack>,
): Record<string, PropertyTrack> {
  let tracks = source;
  if (state.noiseDistortion.enabled) tracks = ensureAutoTrack(tracks, 'noiseDistortion.evolution');
  if (state.radon.enabled) tracks = ensureAutoTrack(tracks, 'radon.evolution');
  if (state.iridescence.enabled) tracks = ensureAutoTrack(tracks, 'iridescence.__time');
  if (state.slitScan.enabled && state.animation.affectSlit) {
    tracks = ensureAutoTrack(tracks, 'slitScan.offset');
  }
  if (state.stretch.enabled) tracks = ensureAutoTrack(tracks, 'stretch.__scan');
  if (state.diffuse.enabled && state.diffuse.seedAnimEnabled) tracks = ensureAutoTrack(tracks, 'diffuse.seed');
  if (isPostprocessTimeAnimationActive(state.postprocess, state.effectPipeline)) {
    tracks = ensureAutoTrack(tracks, 'postprocess.__time');
  }
  return tracks;
}

export function migratePropertyTracks(
  tracks: Record<string, PropertyTrack> | undefined,
): Record<string, PropertyTrack> {
  if (!tracks) return {};
  return Object.fromEntries(
    Object.entries(tracks).filter(([id, track]) => (
      !isRemovedAnimationProperty(id) && !isRemovedAnimationProperty(track.propertyId)
    )).map(([id, track]) => {
      const normalized = normalizePropertyTrack(track);
      return [id, {
        ...normalized,
        keyframes: normalized.keyframes.map(keyframe => ({
          ...keyframe,
          value: normalizeTrackValue(id, keyframe.value),
        })),
      }];
    }),
  );
}
