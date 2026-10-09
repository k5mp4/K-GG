import type { AnimationConfig } from '../types/animation';
import { stripSlitPhaseMotionFields } from '../types/distortion';
import type {
  DiffuseConfig,
  EffectPipelineConfig,
  ManualDistortConfig,
  NoiseDistortionConfig,
  NormalMapConfig,
  PostprocessConfig,
  SlitScanConfig,
  StretchConfig,
} from '../types/distortion';
import { createDefaultEffectPipeline, normalizeEffectPipelineConfig } from './effectPipeline';
import { resolveDiffuseBezier } from './diffuseCurve';
import type { ImageGradientConfig } from '../types/imageGradient';
import { normalizeMeshGradientConfig, type GradientConfig } from '../types/gradient';
import type { PropertyTrack } from '../types/keyframe';
import type { UserColorPalette } from './colorPalettes';

import type { ClothGradientConfig } from '../types/clothGradient';
import { normalizeClothGradientConfig } from '../types/clothGradient';
import type { ConeViewConfig } from '../types/coneView';
import { normalizeConeViewConfig } from '../types/coneView';
import type { SeamlessConfig } from '../types/seamless';
import { normalizeSeamlessConfig } from '../types/seamless';
import type { TextureConfig } from '../types/texture';
import { normalizeTextureConfig } from '../types/texture';
import type { DistortChromaConfig } from '../types/distortChroma';
import { normalizeDistortChromaConfig } from '../types/distortChroma';
import type { ShapesConfig } from '../types/shapes';
import { normalizeShapesConfig } from '../types/shapes';
import type { FlowGradientConfig } from '../types/flowGradient';
import { normalizeFlowGradientConfig } from '../types/flowGradient';
import { isRemovedAnimationProperty } from './animationRegistry';
import type { DatamoshConfig } from '../types/datamosh';
import { resolvePersistedDatamosh } from '../types/datamosh';

export type StoreSnapshot = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  imageGradient?: ImageGradientConfig;
  slitScan: SlitScanConfig;
  stretch?: StretchConfig;
  animation: AnimationConfig;
  normalMap: NormalMapConfig;
  clothGradient?: ClothGradientConfig;
  coneView?: ConeViewConfig;
  seamless?: SeamlessConfig;
  texture?: TextureConfig;
  distortChroma?: DistortChromaConfig;
  shapes?: ShapesConfig;
  flowGradient?: FlowGradientConfig;
  datamosh?: DatamoshConfig;
  /**
   * Removed Effect Stack Video Motion settings. Only read to migrate older
   * presets into `datamosh`; never written.
   */
  videoMotion?: unknown;
  manualDistort?: ManualDistortConfig;
  postprocess?: Partial<PostprocessConfig>;
  /** Omitted by presets saved before SPEC-012; those load through Legacy v1. */
  effectPipeline?: EffectPipelineConfig;
  postprocessDistort?: Partial<PostprocessConfig>; // Backward compatibility for older preset files.
  keyframeTracks?: Record<string, PropertyTrack>;
  selectedStops?: number[];
  colorPalettes?: UserColorPalette[];
  resolution?: { width: number; height: number };
};

/**
 * Every serializable preset field except values deliberately supplied or reset
 * at save time. Adding a required StoreSnapshot field makes the call site
 * update explicit rather than silently omitting it from saved SANDBOX state.
 */
type PresetSaveStateSource = Omit<StoreSnapshot,
  | 'colorPalettes'
  | 'resolution'
  | 'selectedStops'
  | 'postprocessDistort'
>;

/** Builds the serializable state passed from the live store to preset storage. */
export function createPresetSaveState(
  state: PresetSaveStateSource,
  colorPalettes: UserColorPalette[],
  resolution: { width: number; height: number },
): StoreSnapshot {
  return {
    ...state,
    slitScan: { ...state.slitScan, selectedSlitIdx: -1 },
    manualDistort: state.manualDistort
      ? { ...state.manualDistort, enabled: false }
      : state.manualDistort,
    colorPalettes,
    resolution,
  };
}

export type Preset = {
  id: string;
  name: string;
  createdAt: number;
  state: StoreSnapshot;
  /** Virtual folder. null is the library root. Optional for legacy JSON. */
  folderId?: string | null;
  /** Stable sibling ordering. Optional for legacy JSON. */
  order?: number;
  /** Optional PNG data URL captured from the effect stack at save time. */
  thumbnail?: string;
};

/** State groups of removed effects (Radon, Iridescence, Matcap) that older preset files may still carry. */
const REMOVED_STATE_KEYS: ReadonlySet<string> = new Set(['radon', 'iridescence', 'matcap']);

function withoutRemovedStateKeys(state: StoreSnapshot): StoreSnapshot {
  return Object.fromEntries(
    Object.entries(state).filter(([key]) => !REMOVED_STATE_KEYS.has(key)),
  ) as StoreSnapshot;
}

type DistortMapFields = { displacement?: number[]; smoothMask?: number[] };

const isZeroMap = (value: unknown): boolean => (
  Array.isArray(value) && value.every(item => item === 0)
);

/** Empty maps are rebuilt from `mapResolution` on load, so they need not be stored. */
function withoutEmptyDistortMaps<T extends DistortMapFields>(config: T): T {
  const next = { ...config };
  if (isZeroMap(next.displacement)) delete next.displacement;
  if (isZeroMap(next.smoothMask)) delete next.smoothMask;
  return next;
}

/**
 * Postprocess fields that only the Legacy v1 pipeline reads. Stack v2 takes
 * layer order from `effectPipeline` and Post Diffuse from `state.diffuse`, so
 * persisting these for a v2 preset only duplicates those groups with stale values.
 */
const isLegacyV1OnlyPostprocessKey = (key: string): boolean => (
  key === 'effectStack' || key.startsWith('diffuse')
);

const colorStopsKey = (stops: readonly { position: number; color: string }[], positionScale = 1): string => (
  stops.map(stop => `${stop.position * positionScale}:${String(stop.color).toLowerCase()}`).join('|')
);

/**
 * Applying a palette copies its stops into the ramp (halving positions in
 * Mirror mode) instead of linking to it, so a palette is in use exactly when
 * its stops still equal the ramp stops.
 */
function getAppliedColorPalettes(state: StoreSnapshot): UserColorPalette[] {
  const stops = state.gradient?.stops;
  if (!Array.isArray(stops) || !Array.isArray(state.colorPalettes)) return [];
  const rampKey = colorStopsKey(stops);
  const positionScale = state.gradient.rampMirror ? 0.5 : 1;
  return state.colorPalettes.filter(palette => (
    Array.isArray(palette?.stops) && colorStopsKey(palette.stops, positionScale) === rampKey
  ));
}

/**
 * Drops persisted data that loading reconstructs identically, plus library
 * data the preset does not use: the legacy `manualDistort` fallback when
 * Postprocess exists, all-zero distort maps, Legacy v1-only Postprocess fields
 * of a Stack v2 preset, and user color palettes not applied to the ramp.
 */
export function compactPresetState(state: StoreSnapshot): StoreSnapshot {
  const { manualDistort, colorPalettes: _colorPalettes, ...rest }: StoreSnapshot = state;
  const appliedPalettes = getAppliedColorPalettes(state);
  const compacted: StoreSnapshot = appliedPalettes.length > 0 ? { ...rest, colorPalettes: appliedPalettes } : rest;
  if (typeof state.postprocess !== 'object' || state.postprocess === null) {
    return manualDistort ? { ...compacted, manualDistort: withoutEmptyDistortMaps(manualDistort) } : compacted;
  }
  const postprocess: Partial<PostprocessConfig> = withoutEmptyDistortMaps(state.postprocess);
  if (state.effectPipeline?.version === 'stack-v2') {
    for (const key of Object.keys(postprocess)) {
      if (isLegacyV1OnlyPostprocessKey(key)) delete postprocess[key as keyof PostprocessConfig];
    }
  }
  return { ...compacted, postprocess };
}

export function compactPreset(preset: Preset): Preset {
  return { ...preset, state: compactPresetState(preset.state) };
}

const MANUAL_DISTORT_KEYS = [
  'mode', 'brushSize', 'strength', 'falloff', 'showOverlay', 'mapResolution',
  'displacement', 'smoothMask', 'smoothStrength', 'smoothRadius', 'maxDisplacement',
] as const satisfies readonly (keyof ManualDistortConfig)[];

/**
 * Restores the fields `compactPresetState` omitted for consumers that merge a
 * preset into the store without normalizing it, so values from the previously
 * open document cannot leak through the missing keys.
 */
export function expandPresetState(state: StoreSnapshot): StoreSnapshot {
  const postprocess = state.postprocess;
  if (typeof postprocess !== 'object' || postprocess === null) return state;
  const rawResolution = postprocess.mapResolution;
  const resolution = typeof rawResolution === 'number' && Number.isFinite(rawResolution)
    ? Math.max(1, Math.min(512, Math.round(rawResolution)))
    : 64;
  const expandedPostprocess = {
    ...postprocess,
    mapResolution: resolution,
    displacement: postprocess.displacement ?? Array<number>(resolution * resolution * 2).fill(0),
    smoothMask: postprocess.smoothMask ?? Array<number>(resolution * resolution).fill(0),
  };
  const manualDistort = state.manualDistort ?? {
    ...Object.fromEntries(MANUAL_DISTORT_KEYS
      .filter(key => expandedPostprocess[key] !== undefined)
      .map(key => [key, expandedPostprocess[key]])),
    enabled: false,
  } as ManualDistortConfig;
  return { ...state, postprocess: expandedPostprocess, manualDistort };
}

export function makePreset(
  name: string,
  sourceState: StoreSnapshot,
  metadata: { folderId?: string | null; order?: number; thumbnail?: string } = {},
): Preset {
  const { videoMotion: _legacyVideoMotion, ...state } = withoutRemovedStateKeys(sourceState);
  const diffuse = {
    ...state.diffuse,
    luminanceBezier: resolveDiffuseBezier(state.diffuse.luminanceBezier, state.diffuse.luminanceCurve),
  };
  delete diffuse.luminanceCurve;
  const slitScan = state.slitScan ? stripSlitPhaseMotionFields(state.slitScan) : state.slitScan;
  const keyframeTracks = state.keyframeTracks
    ? Object.fromEntries(Object.entries(state.keyframeTracks).filter(([id, track]) => (
      !isRemovedAnimationProperty(id) && !isRemovedAnimationProperty(track.propertyId)
    )))
    : state.keyframeTracks;
  const gradient = state.gradient?.gradientType === 'mesh'
    ? { ...state.gradient, mesh: normalizeMeshGradientConfig(state.gradient.mesh) }
    : state.gradient;
  return {
    id: Math.random().toString(36).slice(2),
    name,
    createdAt: Date.now(),
    folderId: metadata.folderId ?? null,
    order: metadata.order ?? 0,
    ...(metadata.thumbnail ? { thumbnail: metadata.thumbnail } : {}),
    state: compactPresetState({
      ...state,
      gradient,
      diffuse,
      slitScan,
      keyframeTracks,
      clothGradient: normalizeClothGradientConfig(state.clothGradient),
      coneView: normalizeConeViewConfig(state.coneView),
      seamless: normalizeSeamlessConfig(state.seamless),
      texture: normalizeTextureConfig(state.texture),
      distortChroma: normalizeDistortChromaConfig(state.distortChroma),
      shapes: normalizeShapesConfig(state.shapes),
      flowGradient: normalizeFlowGradientConfig(state.flowGradient),
      datamosh: resolvePersistedDatamosh(sourceState),
      effectPipeline: state.effectPipeline
        ? normalizeEffectPipelineConfig(state.effectPipeline)
        : createDefaultEffectPipeline(),
    }),
  };
}

export function isPreset(value: unknown): value is Preset {
  if (typeof value !== 'object' || value === null) return false;
  const preset = value as Preset;
  const thumbnail = preset.thumbnail;
  return (
    typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.createdAt === 'number' &&
    typeof preset.state === 'object' && preset.state !== null &&
    (typeof preset.folderId === 'string' || preset.folderId === null || preset.folderId === undefined) &&
    (typeof preset.order === 'number' && Number.isFinite(preset.order) || preset.order === undefined) &&
    (thumbnail === undefined || typeof thumbnail === 'string' && thumbnail.length <= 2_000_000)
  );
}
