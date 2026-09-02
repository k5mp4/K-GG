import { browserColorPaletteRepository } from './browser/colorPaletteRepository';
import { browserAfterEffectsService } from './browser/afterEffectsService';
import { browserExportService } from './browser/exportService';
import { browserPresetRepository } from './browser/presetRepository';
import { browserVideoExportService } from './browser/videoExportService';
import { tauriAfterEffectsService } from './tauri/afterEffectsService';
import { isTauriRuntime, tauriExportService } from './tauri/exportService';
import { tauriPresetRepository } from './tauri/presetRepository';
import { tauriVideoExportService } from './tauri/videoExportService';
import type { AppAdapters } from './types';

export const browserAdapters: AppAdapters = {
  presetRepository: browserPresetRepository,
  colorPaletteRepository: browserColorPaletteRepository,
  exportService: browserExportService,
  videoExportService: browserVideoExportService,
  afterEffectsService: browserAfterEffectsService,
};

export const tauriAdapters: AppAdapters = {
  ...browserAdapters,
  presetRepository: tauriPresetRepository,
  exportService: tauriExportService,
  videoExportService: tauriVideoExportService,
  afterEffectsService: tauriAfterEffectsService,
};

export const adapters = isTauriRuntime() ? tauriAdapters : browserAdapters;

export type {
  AppAdapters,
  AeRuntime,
  AeSaveDirStatus,
  AeStatus,
  AfterEffectsService,
  ColorPaletteRepository,
  ExportDirectoryHandle,
  ExportStage,
  ExportService,
  Mp4QualityPreset,
  NativeVideoArtifact,
  NativeFfmpegStatus,
  PresetRepository,
  VideoExportConfig,
  VideoExportFrameRenderer,
  VideoExportService,
} from './types';
export { MP4_QUALITY_PRESETS } from './types';
