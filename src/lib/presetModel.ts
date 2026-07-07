import type { AnimationConfig } from '../store/gradientStore';
import type {
  BezierAxisConfig,
  DiffuseConfig,
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
import type { GradientConfig } from '../types/gradient';
import type { PropertyTrack } from '../types/keyframe';
import type { UserColorPalette } from './colorPalettes';

export type StoreSnapshot = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  bezierAxis: BezierAxisConfig;
  slitScan: SlitScanConfig;
  stretch?: StretchConfig;
  animation: AnimationConfig;
  normalMap: NormalMapConfig;
  radon: RadonConfig;
  iridescence?: IridescenceConfig;
  manualDistort?: ManualDistortConfig;
  postprocess?: Partial<PostprocessConfig>;
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
};

export function makePreset(name: string, state: StoreSnapshot): Preset {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    createdAt: Date.now(),
    state,
  };
}

export function isPreset(value: unknown): value is Preset {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as Preset).id === 'string' &&
    typeof (value as Preset).name === 'string' &&
    typeof (value as Preset).createdAt === 'number' &&
    typeof (value as Preset).state === 'object' && (value as Preset).state !== null
  );
}
