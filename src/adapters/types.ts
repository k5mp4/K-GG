import type { AnimationEasing } from '../store/gradientStore';
import type { ColorStop } from '../types/gradient';
import type { Preset, StoreSnapshot } from '../lib/presets';
import type { UserColorPalette } from '../lib/colorPalettes';

export type MaybePromise<T> = T | Promise<T>;
export type ExportDirectoryHandle = FileSystemDirectoryHandle | string;

export interface PresetRepository {
  loadPresets(): MaybePromise<Preset[]>;
  savePreset(name: string, state: StoreSnapshot): MaybePromise<Preset>;
  deletePreset(id: string): MaybePromise<void>;
  exportPresetsJSON(stem?: string): MaybePromise<void>;
  importPresetsJSON(file: File, merge: boolean): Promise<void>;
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
  signal?: AbortSignal;
  onProgress?: (p: number) => void;
};

export type NativeFfmpegStatus = {
  supported: boolean;
  path: string | null;
  version: string | null;
  error: string | null;
};

export interface VideoExportService {
  exportLosslessMOV(config: VideoExportConfig): Promise<Blob>;
  exportHighQualityMP4(config: VideoExportConfig): Promise<Blob>;
  exportFrameZip(config: VideoExportConfig): Promise<Blob>;
  nativeFfmpegSupported?(): boolean;
}

export interface AppAdapters {
  presetRepository: PresetRepository;
  colorPaletteRepository: ColorPaletteRepository;
  exportService: ExportService;
  videoExportService: VideoExportService;
}
