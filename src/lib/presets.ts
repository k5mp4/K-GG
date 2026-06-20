import type { GradientConfig } from '../types/gradient';
import type { NoiseDistortionConfig, BezierAxisConfig, DiffuseConfig, SlitScanConfig, StretchConfig, NormalMapConfig, RadonConfig, IridescenceConfig, ManualDistortConfig, PostprocessConfig, MatcapConfig } from '../types/distortion';
import type { AnimationConfig } from '../store/gradientStore';
import type { PropertyTrack } from '../types/keyframe';
import type { UserColorPalette } from './colorPalettes';
import { adapters } from '../adapters';

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

export async function loadPresets(): Promise<Preset[]> {
  return await adapters.presetRepository.loadPresets();
}

export async function savePreset(name: string, state: StoreSnapshot): Promise<Preset> {
  return await adapters.presetRepository.savePreset(name, state);
}

export async function deletePreset(id: string): Promise<void> {
  await adapters.presetRepository.deletePreset(id);
}

export async function exportPresetsJSON(stem?: string): Promise<void> {
  await adapters.presetRepository.exportPresetsJSON(stem);
}

export async function importPresetsJSON(file: File, merge: boolean): Promise<void> {
  await adapters.presetRepository.importPresetsJSON(file, merge);
}
