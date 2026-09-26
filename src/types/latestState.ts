import type { AnimationConfig } from './animation';
import type {
  DiffuseConfig,
  EffectPipelineConfig,
  ManualDistortConfig,
  PostprocessConfig,
  NoiseDistortionConfig,
  NormalMapConfig,
  SlitScanConfig,
  StretchConfig,
} from './distortion';
import type { GradientConfig } from './gradient';
import type { ImageGradientConfig } from './imageGradient';
import type { PropertyTrack } from './keyframe';
import type { ClothGradientConfig } from './clothGradient';
import type { ConeViewConfig } from './coneView';
import type { SeamlessConfig } from './seamless';
import type { FlowGradientConfig } from './flowGradient';
import type { VideoMotionConfig } from './videoMotion';

export type LatestState = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  imageGradient: ImageGradientConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  normalMap: NormalMapConfig;
  clothGradient?: ClothGradientConfig;
  coneView: ConeViewConfig;
  seamless?: SeamlessConfig;
  flowGradient?: FlowGradientConfig;
  videoMotion?: VideoMotionConfig;
  manualDistort: ManualDistortConfig;
  postprocess: PostprocessConfig;
  effectPipeline: EffectPipelineConfig;
  animation: AnimationConfig;
  keyframeTracks: Record<string, PropertyTrack>;
  width: number;
  height: number;
  animDirection: number;
  sourceImageCanvas?: HTMLCanvasElement | null;
  imageGradientSource?: HTMLCanvasElement | null;
  imageMaskSource?: TexImageSource | null;
  imageMaskEnabled?: boolean;
};
