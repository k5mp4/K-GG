import { browserColorPaletteRepository } from './browser/colorPaletteRepository';
import { browserExportService } from './browser/exportService';
import { browserPresetRepository } from './browser/presetRepository';
import { browserVideoExportService } from './browser/videoExportService';
import { isTauriRuntime, tauriExportService } from './tauri/exportService';
import { tauriPresetRepository } from './tauri/presetRepository';
import { tauriVideoExportService } from './tauri/videoExportService';
import type { AppAdapters } from './types';

export const browserAdapters: AppAdapters = {
  presetRepository: browserPresetRepository,
  colorPaletteRepository: browserColorPaletteRepository,
  exportService: browserExportService,
  videoExportService: browserVideoExportService,
};

export const tauriAdapters: AppAdapters = {
  ...browserAdapters,
  presetRepository: tauriPresetRepository,
  exportService: tauriExportService,
  videoExportService: tauriVideoExportService,
};

export const adapters = isTauriRuntime() ? tauriAdapters : browserAdapters;

export type {
  AppAdapters,
  ColorPaletteRepository,
  ExportDirectoryHandle,
  ExportStage,
  ExportService,
  Mp4QualityPreset,
  NativeFfmpegStatus,
  PresetRepository,
  VideoExportConfig,
  VideoExportService,
} from './types';
export { MP4_QUALITY_PRESETS } from './types';
