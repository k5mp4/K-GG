import type { AnimationMode, Keyframe, PropertyTrack } from '../types/keyframe';
import type { ClothGradientConfig } from '../types/clothGradient';
import type { ConeViewConfig } from '../types/coneView';
import type { FlowGradientConfig } from '../types/flowGradient';
import type { ImageGradientConfig } from '../types/imageGradient';
import type { GradientConfig, MeshEdge, Vec2Tuple } from '../types/gradient';
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
import type { SeamlessConfig } from '../types/seamless';
import type { WorkspaceSlice } from './workspaceSlice';

/**
 * Persisted/renderable state.  Keeping this contract independent from the
 * Zustand store makes it possible for adapters and renderers to consume a
 * document without importing the store implementation.
 */
export type DocumentState = {
  gradient: GradientConfig;
  noiseDistortion: NoiseDistortionConfig;
  diffuse: DiffuseConfig;
  imageGradient: ImageGradientConfig;
  slitScan: SlitScanConfig;
  stretch: StretchConfig;
  animation: import('../types/animation').AnimationConfig;
  normalMap: NormalMapConfig;
  clothGradient: ClothGradientConfig;
  coneView: ConeViewConfig;
  seamless: SeamlessConfig;
  flowGradient: FlowGradientConfig;
  radon: RadonConfig;
  iridescence: IridescenceConfig;
  manualDistort: ManualDistortConfig;
  postprocess: PostprocessConfig;
  effectPipeline: EffectPipelineConfig;
  matcap: MatcapConfig;
  keyframeTracks: Record<string, PropertyTrack>;
};

export type DocumentActions = {
  setGradient: (value: Partial<GradientConfig>) => void;
  setMeshCorner: (index: number, position: Vec2Tuple) => void;
  setMeshHandle: (edge: MeshEdge, index: 0 | 1, position: Vec2Tuple) => void;
  setMeshColorPosition: (index: number, value: number) => void;
  resetMeshGradient: () => void;
  straightenMeshHandles: () => void;
  setNoiseDistortion: (value: Partial<NoiseDistortionConfig>) => void;
  setDiffuse: (value: Partial<DiffuseConfig>) => void;
  setImageGradient: (value: Partial<ImageGradientConfig>) => void;
  setSlitScan: (value: Partial<SlitScanConfig>) => void;
  setStretch: (value: Partial<StretchConfig>) => void;
  setAnimation: (value: Partial<import('../types/animation').AnimationConfig>) => void;
  setNormalMap: (value: Partial<NormalMapConfig>) => void;
  setClothGradient: (value: Partial<ClothGradientConfig>) => void;
  setConeView: (value: Partial<ConeViewConfig>) => void;
  setSeamless: (value: Partial<SeamlessConfig>) => void;
  setFlowGradient: (value: Partial<FlowGradientConfig>) => void;
  setRadon: (value: Partial<RadonConfig>) => void;
  setIridescence: (value: Partial<IridescenceConfig>) => void;
  setManualDistort: (value: Partial<ManualDistortConfig>) => void;
  setPostprocess: (value: Partial<PostprocessConfig>) => void;
  setEffectPipeline: (value: Partial<EffectPipelineConfig>) => void;
  setMatcap: (value: Partial<MatcapConfig>) => void;
  setKeyframeTracks: (value: Record<string, PropertyTrack> | ((previous: Record<string, PropertyTrack>) => Record<string, PropertyTrack>)) => void;
  setTrackMode: (trackId: string, mode: AnimationMode, options?: { label?: string; value?: number; time?: number }) => void;
  setKeyframe: (trackId: string, keyframe: Partial<Keyframe> & { id: string }) => void;
  removeKeyframe: (trackId: string, keyframeId: string) => void;
  addKeyframe: (trackId: string, keyframe: Omit<Keyframe, 'id'>, options?: { preserveHandles?: boolean }) => void;
};

export type DocumentSlice = DocumentState & DocumentActions;

export type DocumentDefaults = Omit<DocumentState, 'keyframeTracks'>;

export type DocumentStoreState = DocumentState & DocumentActions & WorkspaceSlice;

export type DocumentStoreSet = (
  partial: Partial<DocumentStoreState> | ((state: DocumentStoreState) => Partial<DocumentStoreState>),
) => void;

/** Creates an isolated document state without sharing mutable default arrays. */
export function createDocumentState(defaults: DocumentDefaults): DocumentState {
  return {
    gradient: { ...defaults.gradient },
    noiseDistortion: { ...defaults.noiseDistortion },
    diffuse: { ...defaults.diffuse },
    imageGradient: { ...defaults.imageGradient },
    slitScan: { ...defaults.slitScan },
    stretch: { ...defaults.stretch },
    animation: { ...defaults.animation },
    normalMap: { ...defaults.normalMap },
    clothGradient: { ...defaults.clothGradient },
    coneView: { ...defaults.coneView },
    seamless: { ...defaults.seamless },
    flowGradient: { ...defaults.flowGradient },
    radon: { ...defaults.radon },
    iridescence: { ...defaults.iridescence },
    manualDistort: {
      ...defaults.manualDistort,
      displacement: [...defaults.manualDistort.displacement],
      smoothMask: [...defaults.manualDistort.smoothMask],
    },
    postprocess: {
      ...defaults.postprocess,
      effectStack: defaults.postprocess.effectStack.map(layer => ({ ...layer })),
      displacement: [...defaults.postprocess.displacement],
      smoothMask: [...defaults.postprocess.smoothMask],
    },
    effectPipeline: {
      ...defaults.effectPipeline,
      effectStack: defaults.effectPipeline.effectStack.map(layer => ({ ...layer })),
    },
    matcap: { ...defaults.matcap },
    keyframeTracks: {},
  };
}
