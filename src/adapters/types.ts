import type { AnimationEasing } from '../store/gradientStore';
import type { ColorStop } from '../types/gradient';
import type { Preset, StoreSnapshot } from '../lib/presetModel';
import type { PresetExportScope, PresetFolder, PresetLibrary } from '../lib/presetLibrary';
import type { UserColorPalette } from '../lib/colorPalettes';

export type MaybePromise<T> = T | Promise<T>;
export type ExportDirectoryHandle = FileSystemDirectoryHandle | string;
export const MP4_QUALITY_PRESETS = [
  { value: 'high', label: 'High', crf: 18, description: '画質優先' },
  { value: 'balanced', label: 'Balanced', crf: 22, description: 'バランス' },
  { value: 'small', label: 'Small', crf: 27, description: 'サイズ優先' },
] as const;
export type Mp4QualityPreset = (typeof MP4_QUALITY_PRESETS)[number]['value'];
export type ExportStage = 'preparing' | 'rendering' | 'encoding' | 'saving';

export interface PresetRepository {
  loadPresetLibrary(): MaybePromise<PresetLibrary>;
  savePreset(name: string, state: StoreSnapshot, folderId: string | null, thumbnail?: string): MaybePromise<Preset>;
  deletePreset(id: string): MaybePromise<void>;
  movePreset(id: string, folderId: string | null): MaybePromise<void>;
  createFolder(name: string, parentId: string | null): MaybePromise<PresetFolder>;
  renameFolder(id: string, name: string): MaybePromise<void>;
  moveFolder(id: string, parentId: string | null): MaybePromise<void>;
  deleteFolder(id: string): MaybePromise<void>;
  exportPresetPackage(scope: PresetExportScope): MaybePromise<void>;
  importPresetPackage(file: File, targetFolderId: string | null): Promise<void>;
}

export interface ColorPaletteRepository {
  loadUserColorPalettes(): MaybePromise<UserColorPalette[]>;
  saveUserColorPalette(name: string, stops: ColorStop[]): MaybePromise<UserColorPalette>;
  deleteUserColorPalette(id: string): MaybePromise<void>;
  mergeUserColorPalettes(palettes: UserColorPalette[] | undefined): MaybePromise<void>;
}

export interface ExportService {
  sanitizeStem(name: string): string;
  canUseDirectoryPicker(): boolean;
  pickDirectory(): Promise<ExportDirectoryHandle | null>;
  createDirectory(
    dirHandle: ExportDirectoryHandle,
    dirname: string,
  ): Promise<ExportDirectoryHandle>;
  saveBlobToDir(
    blob: Blob,
    filename: string,
    dirHandle: ExportDirectoryHandle | null,
  ): Promise<void>;
  canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob>;
  savePNG(
    canvas: HTMLCanvasElement,
    stem: string,
    dirHandle?: ExportDirectoryHandle | null,
  ): Promise<void>;
  saveJPG(
    canvas: HTMLCanvasElement,
    quality: number,
    stem: string,
    dirHandle?: ExportDirectoryHandle | null,
  ): Promise<void>;
  saveWebP(
    canvas: HTMLCanvasElement,
    quality: number,
    stem: string,
    dirHandle?: ExportDirectoryHandle | null,
  ): Promise<void>;
}

export type VideoExportConfig = {
  canvas: HTMLCanvasElement;
  fps: 24 | 30 | 60;
  duration: number;
  speed: number;
  easing?: AnimationEasing;
  mp4Quality?: Mp4QualityPreset;
  signal?: AbortSignal;
  onProgress?: (p: number) => void;
  onStage?: (stage: ExportStage) => void;
};

export type NativeFfmpegStatus = {
  supported: boolean;
  available: boolean;
  source: 'app-data-folder' | 'system-path' | null;
  path: string | null;
  version: string | null;
  error: string | null;
  warning: string | null;
  folderPath: string | null;
};

export interface VideoExportService {
  exportLosslessMOV(config: VideoExportConfig): Promise<Blob>;
  exportHighQualityMP4(config: VideoExportConfig): Promise<Blob>;
  exportFrameZip(config: VideoExportConfig): Promise<Blob>;
  nativeFfmpegSupported?(): boolean;
  getNativeFfmpegStatus?(): Promise<NativeFfmpegStatus>;
  openNativeFfmpegFolder?(): Promise<void>;
  openFfmpegBuildsPage?(): Promise<void>;
}

export interface AppAdapters {
  presetRepository: PresetRepository;
  colorPaletteRepository: ColorPaletteRepository;
  exportService: ExportService;
  videoExportService: VideoExportService;
}
