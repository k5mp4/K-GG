import type { AnimationConfig } from '../store/gradientStore';
import type {
  DiffuseConfig,
  EffectPipelineConfig,
  IridescenceConfig,
  ManualDistortConfig,
  MatcapConfig,
  NoiseDistortionConfig,
  NormalMapConfig,
  PostprocessConfig,
  RadonConfig,
  SlitScanConfig,
  StretchConfig,
} from '../types/distortion';
import { createDefaultEffectPipeline, normalizeEffectPipelineConfig } from './effectPipeline';
import type { ImageGradientConfig } from '../types/imageGradient';
import type { GradientConfig } from '../types/gradient';
import type { PropertyTrack } from '../types/keyframe';
import type { UserColorPalette } from './colorPalettes';

export type StoreSnapshot = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  imageGradient?: ImageGradientConfig;
  slitScan: SlitScanConfig;
  stretch?: StretchConfig;
  animation: AnimationConfig;
  normalMap: NormalMapConfig;
  radon: RadonConfig;
  iridescence?: IridescenceConfig;
  manualDistort?: ManualDistortConfig;
  postprocess?: Partial<PostprocessConfig>;
  /** Omitted by presets saved before SPEC-012; those load through Legacy v1. */
  effectPipeline?: EffectPipelineConfig;
  postprocessDistort?: Partial<PostprocessConfig>; // Backward compatibility for older preset files.
  matcap?: MatcapConfig;
  keyframeTracks?: Record<string, PropertyTrack>;
  selectedStops?: number[];
  colorPalettes?: UserColorPalette[];
  resolution?: { width: number; height: number };
};

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

export function makePreset(
  name: string,
  state: StoreSnapshot,
  metadata: { folderId?: string | null; order?: number; thumbnail?: string } = {},
): Preset {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    createdAt: Date.now(),
    folderId: metadata.folderId ?? null,
    order: metadata.order ?? 0,
    ...(metadata.thumbnail ? { thumbnail: metadata.thumbnail } : {}),
    state: {
      ...state,
      effectPipeline: state.effectPipeline
        ? normalizeEffectPipelineConfig(state.effectPipeline)
        : createDefaultEffectPipeline(),
    },
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
