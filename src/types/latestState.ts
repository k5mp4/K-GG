import type { AnimationConfig } from '../store/gradientStore';
import type {
  DiffuseConfig,
  EffectPipelineConfig,
  IridescenceConfig,
  ManualDistortConfig,
  PostprocessConfig,
  MatcapConfig,
  NoiseDistortionConfig,
  NormalMapConfig,
  RadonConfig,
  SlitScanConfig,
  StretchConfig,
} from './distortion';
import type { GradientConfig } from './gradient';
import type { ImageGradientConfig } from './imageGradient';
import type { PropertyTrack } from './keyframe';
import type { ClothGradientConfig } from './clothGradient';
import type { ConeViewConfig } from './coneView';
import type { SeamlessConfig } from './seamless';

export type LatestState = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  imageGradient: ImageGradientConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  normalMap: NormalMapConfig;
  clothGradient?: ClothGradientConfig;
  coneView?: ConeViewConfig;
  seamless?: SeamlessConfig;
  radon: RadonConfig;
  iridescence: IridescenceConfig;
  manualDistort: ManualDistortConfig;
  postprocess: PostprocessConfig;
  effectPipeline: EffectPipelineConfig;
  matcap: MatcapConfig;
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
