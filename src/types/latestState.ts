import type { AnimationConfig } from '../store/gradientStore';
import type {
  BezierAxisConfig,
  DiffuseConfig,
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
import type { PropertyTrack } from './keyframe';

export type LatestState = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  bezierAxis: BezierAxisConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  normalMap: NormalMapConfig;
  radon: RadonConfig;
  iridescence: IridescenceConfig;
  manualDistort: ManualDistortConfig;
  postprocess: PostprocessConfig;
  matcap: MatcapConfig;
  animation: AnimationConfig;
  keyframeTracks: Record<string, PropertyTrack>;
  width: number;
  height: number;
  animDirection: number;
  sourceImageCanvas?: HTMLCanvasElement | null;
  imageMaskSource?: TexImageSource | null;
  imageMaskEnabled?: boolean;
};
