import { create } from 'zustand';
import type { GradientConfig } from '../types/gradient';
import type { NoiseDistortionConfig, BezierAxisConfig, DiffuseConfig, SlitScanConfig, StretchConfig, NormalMapConfig, RadonConfig, IridescenceConfig, ManualDistortConfig, PostprocessConfig, MatcapConfig, HistogramConfig } from '../types/distortion';
import { gradientRampPresets } from '../lib/gradientRampUtils';
import type { Keyframe, PropertyTrack } from '../types/keyframe';
import { computeAutoHandles } from '../lib/autoBezier';

export type AnimationEasing = {
  enabled: boolean;
  p1: [number, number]; // control point 1 (x, y) — [0,1] 範囲
  p2: [number, number]; // control point 2 (x, y) — [0,1] 範囲
  linkMode: 'none' | 'symmetric' | 'coincide';
  beatSync?: {
    enabled: boolean;
    bpm: number;
    beatsPerBar: number;
    subdivision: 3 | 4;
  };
};

export type AnimationConfig = {
  enabled: boolean;
  speed: number;
  intensity: number;
  duration: number;
  fps: 24 | 30 | 60;
  direction: number;  // 0–360°: アニメーションの UV スクロール方向
  easing: AnimationEasing;
  affectNoise: boolean;  // Noise/Iridescence をメインアニメーションループで制御するか
  affectSlit: boolean;   // Slit Scan をメインアニメーションループで制御するか
  affectRamp: boolean;   // Gradient Ramp ストップをキーフレームでアニメーションするか
  affectStretch: boolean; // Stretch の左→右スキャンをメインアニメーションループで制御するか
};

export const BEAT_SYNC_BEATS_PER_LOOP = 4;

export function getBeatSyncDurationSeconds(bpm: number): number {
  const safeBpm = Math.max(1, Math.min(999, Number.isFinite(bpm) ? bpm : 120));
  return BEAT_SYNC_BEATS_PER_LOOP * 60 / safeBpm;
}

type GradientStore = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  bezierAxis: BezierAxisConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  animation: AnimationConfig;
  normalMap: NormalMapConfig;
  radon: RadonConfig;
  iridescence: IridescenceConfig;
  manualDistort: ManualDistortConfig;
  postprocess: PostprocessConfig;
  matcap: MatcapConfig;
  histogram: HistogramConfig;

  // Keyframes
  keyframeTracks: Record<string, PropertyTrack>;
  currentTime: number;

  presetName: string;
  isSlitAdjusting: boolean;
  slitOverlayEnabled: boolean;
  selectedStops: number[];
  selectedGradientAnchors: number[];
  isGradientAnchorDragging: boolean;

  setGradient: (v: Partial<GradientConfig>) => void;
  setNoiseDistortion: (v: Partial<NoiseDistortionConfig>) => void;
  setDiffuse: (v: Partial<DiffuseConfig>) => void;
  setBezierAxis: (v: Partial<BezierAxisConfig>) => void;
  setSlitScan: (v: Partial<SlitScanConfig>) => void;
  setStretch: (v: Partial<StretchConfig>) => void;
  setAnimation: (v: Partial<AnimationConfig>) => void;
  setNormalMap: (v: Partial<NormalMapConfig>) => void;
  setRadon: (v: Partial<RadonConfig>) => void;
  setIridescence: (v: Partial<IridescenceConfig>) => void;
  setManualDistort: (v: Partial<ManualDistortConfig>) => void;
  setPostprocess: (v: Partial<PostprocessConfig>) => void;
  setMatcap: (v: Partial<MatcapConfig>) => void;
  setHistogram: (v: Partial<HistogramConfig>) => void;
  setKeyframeTracks: (v: Record<string, PropertyTrack> | ((prev: Record<string, PropertyTrack>) => Record<string, PropertyTrack>)) => void;
  setKeyframe: (trackId: string, kf: Partial<Keyframe> & { id: string }) => void;
  removeKeyframe: (trackId: string, kfId: string) => void;
  addKeyframe: (trackId: string, kf: Omit<Keyframe, 'id'>, options?: { preserveHandles?: boolean }) => void;
  setCurrentTime: (v: number) => void;
  setPresetName: (name: string) => void;
  setIsSlitAdjusting: (v: boolean) => void;
  setSlitOverlayEnabled: (v: boolean) => void;
  setSelectedStops: (v: number[]) => void;
  setSelectedGradientAnchors: (v: number[]) => void;
  setIsGradientAnchorDragging: (v: boolean) => void;
};

/** グラデーションタイプ別のデフォルトアンカーポイント（UV空間: y=0が底辺） */
export const GRADIENT_ANCHOR_DEFAULTS: Record<import('../types/gradient').GradientType, [[number,number],[number,number],[number,number],[number,number]]> = {
  linear:    [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]], // 下→上 (angle=180°と一致)
  radial:    [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、右端
  fourcolor: [[0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], // 4コーナー
  diamond:   [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、右端
  angle:     [[0.5, 0.5], [1.0, 0.5], [0.5, 0.5], [0.5, 0.5]], // 中心、角度基準点
  bezier:    [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]], // A/B端点を使うベジェ軸
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

/** ノイズタイプ切り替え時に自動適用するタイプ別初期値 */
export const NOISE_TYPE_PRESETS: Record<NoiseDistortionConfig['type'], Partial<NoiseDistortionConfig>> = {
  simplex: { amount: 0.15, scale: 3.0 },
  fbm: { amount: 0.20, scale: 2.0, octaves: 4 },
  voronoi: { amount: 0.15, scale: 6.0, voronoiDistMetric: 'euclidean', voronoiRandomness: 1.0, voronoiFeature: 'f1', voronoiMinkowskiExp: 2.0 },
  curl: { amount: 0.30, scale: 0.5, octaves: 3, curlSteps: 4, curlSpeed: 0.5, curlEps: 0.01, curlSeed: 0.0 },
  domain_warp_anim: { amount: 0.30, scale: 5.0, octaves: 3 },
  seamless: { amount: 0.30, scale: 0.5, octaves: 4, seamlessType: 'simplex', seamlessAnimation: 'drift', seamlessTwist: 0.0, noiseLoopMode: 'seamless', noiseLoopBlend: 0.75 },
  ridged_fbm: { amount: 0.40, scale: 2.5, octaves: 5, ridgeSharpness: 2.0, ridgeGain: 0.0, ridgeLacunarity: 2.0, ridgePersistence: 0.6, ridgeOffset: 1.0, ridgeWarp: 1.0 },
  ae_fractal: { amount: 0.30, scale: 2.0, octaves: 6, aeFractalType: 'basic', aeSubInfluence: 0.7, aeSubScaling: 1.78, aeSubRotation: 45, aeContrast: 1.0, aeBrightness: 0.0 },
};

const MANUAL_DISTORT_MAP_RESOLUTION = 64;

export const createEmptyManualDistortMap = (resolution = MANUAL_DISTORT_MAP_RESOLUTION): number[] =>
  Array(resolution * resolution * 2).fill(0);

export const createEmptyManualSmoothMask = (resolution = MANUAL_DISTORT_MAP_RESOLUTION): number[] =>
  Array(resolution * resolution).fill(0);

export const STORE_DEFAULTS = {
  gradient: {
    angle: 180,
    stops: [...gradientRampPresets.Kagaribi_15_BG],
    opacityStops: [
      { position: 0.0, opacity: 1.0 },
      { position: 1.0, opacity: 1.0 },
    ],
    rampColorMode: 'rgb' as const,
    rampInterpolation: 'ease' as const,
    rampVariable: 0,
    rampRepeat: 1,
    gradientType: 'linear' as import('../types/gradient').GradientType,
    anchors: [[0.5, 0.0], [0.5, 1.0], [0.5, 0.5], [0.5, 0.5]] as [[number,number],[number,number],[number,number],[number,number]],
    bezierControls: defaultBezierControlsForAnchors(GRADIENT_ANCHOR_DEFAULTS.bezier),
    rampMirror: false,
  },
  noiseDistortion: {
    enabled: false,
    type: 'simplex' as const,
    amount: 0.15,
    scale: 3.0,
    octaves: 3,
    evolution: 0.0,
    speed: 0.5,
    dwRotAngle1: 0.5,
    dwRotAngle2: 0.1,
    dwDist1: 0.00001,
    dwDist2: 0.005,
    dwDist3: 0.12,
    curlSteps: 4,
    curlSpeed: 0.5,
    curlEps: 0.01,
    curlSeed: 0.0,
    noiseSeed: 0.0,
    noiseLoopMode: 'seamless' as const,
    noiseLoopBlend: 0.75,
    dwInitVal: 0.1,
    dwInitAmp: 1.0,
    dwDriftAngle: 45,
    seamlessType: 'simplex' as const,
    seamlessAnimation: 'drift' as const,
    seamlessTwist: 0.0,
    voronoiDistMetric: 'euclidean' as const,
    voronoiRandomness: 1.0,
    voronoiFeature: 'f1' as const,
    voronoiMinkowskiExp: 2.0,
    ridgeSharpness: 2.0,
    ridgeGain: 0.0,
    ridgeLacunarity: 2.0,
    ridgePersistence: 0.6,
    ridgeOffset: 1.0,
    ridgeWarp: 1.0,
    aeFractalType: 'basic' as const,
    aeSubInfluence: 0.7,
    aeSubScaling: 1.78,
    aeSubRotation: 45,
    aeContrast: 1.0,
    aeBrightness: 0.0,
  },
  diffuse: {
    enabled: true,
    mode: 'smooth' as const,
    ditherMode: 'pattern_dither' as const,
    scatter: 70,
    grain: 2,
    seed: 0,
    seedAnimEnabled: false,
    ditherThreshold: 0.5,
  },
  bezierAxis: {
    enabled: false,
    paths: [] as import('../types/distortion').BezierPath[],
    strength: 1.0,
    boundary: 'clamp' as const,
    radius: 1.0,
    curvatureInfluence: 0.0,
    curvatureMode: 'wide' as const,
    bezierSide: 'both' as const,
  },
  slitScan: {
    enabled: false,
    mode: 'linear' as const,
    angle: 0,
    waveType: 'sine' as const,
    waveHeight: 80,
    polygonSides: 6,
    slitWidth: 80,
    offset: 1.0,
    offsetSpeed: 0.3,
    animEnabled: false,
    animMode: 'unidirectional' as const,
    phaseAnimEnabled: false,
    phaseSpeed: 1.0,
    variance: 0.5,
    seed: 0,
    slitPhase: 0,
    selectedSlitIdx: -1,
    slitDeltas: {} as Record<number, number>,
    noiseAfterSlit: false,
    pixelPerfect: false,
    offsetAngle: 0,
  },
  stretch: {
    enabled: false,
    bandHeight: 18,
    bandHeightVariance: 0,
    variation: 0.42,
    seed: 12,
    glowEnabled: false,
    glowIntensity: 0.6,
    glowRadius: 18,
    glowThreshold: 0.55,
    glowTint: '#F0EAD9',
  },
  animation: {
    enabled: false,
    speed: 0.3,
    intensity: 0.5,
    duration: 5,
    fps: 24 as 24 | 30 | 60,
    direction: 0,  // 0° = 左→右
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
    strength: 0.3,
    blur: 2.0,   // Gaussian sigma (px) for post-effect blur
    angle: 0,
    bevelSize: 1.0,
    invert: false,
  },
  radon: {
    enabled: false,
    strength: 1.0,
    freq: 1.0,
    radius: 1.2,
    angle: 0,
    blur: 1.0,
    evolution: 0.0,
    speed: 0.2,
  },
  iridescence: {
    enabled: false,
    strength: 0.3,
    speed: 1.0,
    frequency: 3.0,
    angle: 45,
    bezierWarpStrength: 0.5,
  },
  manualDistort: {
    enabled: false,
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
  postprocess: {
    enabled: false,
    effectMode: 'distort' as const,
    mirrorMode: 'horizontal' as const,
    kaleidoscopeType: 'unfold' as const,
    kaleidoscopeSlices: 8,
    kaleidoscopeRotation: 0,
    kaleidoscopeZoom: 1,
    prismCenter: [0.5, 0.5] as [number, number],
    prismRayCount: 24,
    prismLength: 0.65,
    prismLengthRandomness: 0.45,
    prismWidth: 0.018,
    prismRandomness: 0.45,
    prismBlur: 0.35,
    prismIntensity: 0.9,
    prismGlowRadius: 18,
    prismChromaticAberration: 4,
    prismSeed: 0,
    prismInnerRadius: 0.16,
    voronoiScale: 8,
    voronoiRandomness: 0.85,
    voronoiAngle: 35,
    voronoiGradientScale: 1.15,
    voronoiEdgeWidth: 0.025,
    voronoiSeed: 0,
    particleCount: 180000,
    particleEmitterType: 'field' as const,
    particleEmitterPoint: [0.5, 0.5] as [number, number],
    particleSize: 2.8,
    particleSizeRandomness: 0.65,
    particleLifeCycle: 4,
    particleLifeRandom: 0,
    particleSizeOverLife: 0,
    particleFeather: 0.82,
    particleCore: 0.35,
    particleBrightness: 1.25,
    particleEdgeFade: 0,
    particleSpeed: 0.48,
    particleSpread: 0.72,
    particleTurbulence: 0.72,
    particleCurlScale: 5.5,
    particleCurlStrength: 0.88,
    particleCurlSpeed: 0.9,
    particleCurlEvolution: 0,
    particleRadialForce: 0.18,
    particleRadialFalloff: 0.85,
    particleDepth: 0.75,
    particleOpacity: 0.86,
    particleColorVariance: 0.12,
    particleColorOverLifeMode: 'ramp' as const,
    particleColorOverLife: 0,
    particleDirection: 0,
    particleSeed: 0,
    particleBlendMode: 'add' as const,
    diffuseEnabled: false,
    diffuseMode: 'smooth' as const,
    diffuseScatter: 70,
    diffuseGrain: 2,
    diffuseSeed: 0,
    diffuseDitherThreshold: 0.5,
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
  matcap: {
    enabled: false,
  },
  histogram: {
    enabled: true,
    showRampDistribution: true,
    scale: 1.0,
  },
};

export const useGradientStore = create<GradientStore>((set) => ({
  gradient: { ...STORE_DEFAULTS.gradient },
  noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion },
  diffuse: { ...STORE_DEFAULTS.diffuse },
  bezierAxis: { ...STORE_DEFAULTS.bezierAxis },
  slitScan: { ...STORE_DEFAULTS.slitScan },
  stretch: { ...STORE_DEFAULTS.stretch },
  animation: { ...STORE_DEFAULTS.animation },
  normalMap: { ...STORE_DEFAULTS.normalMap },
  radon: { ...STORE_DEFAULTS.radon },
  iridescence: { ...STORE_DEFAULTS.iridescence },
  manualDistort: {
    ...STORE_DEFAULTS.manualDistort,
    displacement: [...STORE_DEFAULTS.manualDistort.displacement],
    smoothMask: [...STORE_DEFAULTS.manualDistort.smoothMask],
  },
  postprocess: {
    ...STORE_DEFAULTS.postprocess,
    displacement: [...STORE_DEFAULTS.postprocess.displacement],
    smoothMask: [...STORE_DEFAULTS.postprocess.smoothMask],
  },
  matcap: { ...STORE_DEFAULTS.matcap },
  histogram: { ...STORE_DEFAULTS.histogram },
  keyframeTracks: {},
  currentTime: 0,
  presetName: 'Kagaribi_15',
  isSlitAdjusting: false,
  slitOverlayEnabled: false,
  selectedStops: [],
  selectedGradientAnchors: [],
  isGradientAnchorDragging: false,

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
    if (next.gradientType && next.gradientType !== s.gradient.gradientType) {
      const anchors = GRADIENT_ANCHOR_DEFAULTS[next.gradientType];
      return {
        gradient: {
          ...s.gradient,
          anchors,
          ...(next.gradientType === 'bezier' ? { bezierControls: defaultBezierControlsForAnchors(anchors) } : {}),
          ...next,
        },
      };
    }
    return { gradient: { ...s.gradient, ...next } };
  }),
  setNoiseDistortion: (v) => set((s) => {
    if (v.type && v.type !== s.noiseDistortion.type) {
      return { noiseDistortion: { ...s.noiseDistortion, ...NOISE_TYPE_PRESETS[v.type], ...v } };
    }
    return { noiseDistortion: { ...s.noiseDistortion, ...v } };
  }),
  setDiffuse: (v) => set((s) => ({ diffuse: { ...s.diffuse, ...v } })),
  setBezierAxis: (v) => set((s) => ({ bezierAxis: { ...s.bezierAxis, ...v } })),
  setSlitScan: (v) => set((s) => ({ slitScan: { ...s.slitScan, ...v } })),
  setStretch: (v) => set((s) => ({ stretch: { ...s.stretch, ...v } })),
  setAnimation: (v) => set((s) => {
    const nextAnimation = { ...s.animation, ...v };
    const beatSync = nextAnimation.easing.beatSync;
    const beatSyncEnabled = beatSync?.enabled ?? false;
    return {
      animation: {
        ...nextAnimation,
        duration: beatSyncEnabled ? getBeatSyncDurationSeconds(beatSync?.bpm ?? 120) : nextAnimation.duration,
      },
    };
  }),
  setNormalMap: (v) => set((s) => ({ normalMap: { ...s.normalMap, ...v } })),
  setRadon: (v) => set((s) => ({ radon: { ...s.radon, ...v } })),
  setIridescence: (v) => set((s) => ({ iridescence: { ...s.iridescence, ...v } })),
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
    const next = { ...s.postprocess, ...v, displacement, smoothMask };
    if ((next.particleEmitterType as string) === 'nexus') next.particleEmitterType = 'point';
    if (!next.particleEmitterPoint) next.particleEmitterPoint = [...STORE_DEFAULTS.postprocess.particleEmitterPoint] as [number, number];
    return { postprocess: next };
  }),
  setMatcap: (v) => set((s) => ({ matcap: { ...s.matcap, ...v } })),
  setHistogram: (v) => set((s) => ({ histogram: { ...s.histogram, ...v } })),
  setKeyframeTracks: (v) => set((s) => ({ 
    keyframeTracks: typeof v === 'function' ? v(s.keyframeTracks) : v 
  })),
  setKeyframe: (trackId, kf) => set((s) => {
    const track = s.keyframeTracks[trackId];
    if (!track) return s;
    const nextKeyframes = track.keyframes.map(k => k.id === kf.id ? { ...k, ...kf } : k);
    return { keyframeTracks: { ...s.keyframeTracks, [trackId]: { ...track, keyframes: nextKeyframes } } };
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
    const newKf: Keyframe = { ...kf, id: crypto.randomUUID() };
    let nextKeyframes = [...track.keyframes, newKf].sort((a, b) => a.time - b.time);
    
    // bezier キーフレームが含まれ、かつ preserveHandles が false の場合のみハンドルを自動計算
    if (!options?.preserveHandles && nextKeyframes.some(k => k.interpolation === 'bezier')) {
      nextKeyframes = computeAutoHandles(nextKeyframes);
    }
    return { keyframeTracks: { ...s.keyframeTracks, [trackId]: { ...track, keyframes: nextKeyframes } } };
  }),
  setCurrentTime: (v) => set({ currentTime: v }),
  setPresetName: (name) => set({ presetName: name }),
  setIsSlitAdjusting: (v) => set({ isSlitAdjusting: v }),
  setSlitOverlayEnabled: (v) => set({ slitOverlayEnabled: v }),
  setSelectedStops: (v) => set({ selectedStops: v }),
  setSelectedGradientAnchors: (v) => set({ selectedGradientAnchors: v }),
  setIsGradientAnchorDragging: (v) => set({ isGradientAnchorDragging: v }),
}));
