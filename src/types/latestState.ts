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
import type { TextureConfig } from './texture';
import type { FlowGradientConfig } from './flowGradient';
import type { DatamoshConfig } from './datamosh';
import type { ShapesConfig } from './shapes';
import type { ShapesMask } from '../lib/shapesLibrary';

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
  texture?: TextureConfig;
  flowGradient?: FlowGradientConfig;
  datamosh?: DatamoshConfig;
  shapes?: ShapesConfig;
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
  /** Session-only height map for the SANDBOX Texture stage; never saved in a Preset. */
  textureImageSource?: HTMLCanvasElement | null;
  /** Session-only rasterized custom SVG for SANDBOX Shapes; never saved in a Preset. */
  shapesCustomMask?: ShapesMask | null;
};
