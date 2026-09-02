import type { AnimationEasing } from '../store/gradientStore';
import type { ColorStop } from '../types/gradient';
import type { Preset, StoreSnapshot } from '../lib/presetModel';
import type { PresetExportScope, PresetFolder, PresetLibrary } from '../lib/presetLibrary';
import type { UserColorPalette } from '../lib/colorPalettes';
import type { ExportSessionToken } from '../lib/renderBridge';

export type MaybePromise<T> = T | Promise<T>;
export type ExportDirectoryHandle = FileSystemDirectoryHandle | string;

export type AeStatus =
  | 'ok'
  | 'not-running'
  | 'save-failed'
  | 'jsx-failed'
  | 'composition-unavailable'
  | 'unsupported'
  | 'error';

export type AeSaveDirStatus = {
  mode: 'auto' | 'custom';
  path: string | null;
  name: string | null;
};

export type AeRuntime = 'browser-bridge' | 'tauri-native';

export type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  mimeType: 'video/quicktime' | 'video/mp4';
  release(): Promise<void>;
};

export interface AfterEffectsService {
  runtime: AeRuntime;
  isAvailable(): Promise<boolean>;
  ping(): Promise<AeStatus>;
  getSaveDir(): Promise<AeSaveDirStatus>;
  chooseSaveDir(): Promise<AeSaveDirStatus>;
  clearSaveDir(): Promise<AeSaveDirStatus>;
  importImage(blob: Blob, name?: string): Promise<AeStatus>;
  importVideo(source: Blob | NativeVideoArtifact, ext?: 'mov' | 'mp4', name?: string): Promise<AeStatus>;
}
export const MP4_QUALITY_PRESETS = [
  { value: 'high', label: 'High', crf: 18, description: '画質優先' },
  { value: 'balanced', label: 'Balanced', crf: 22, description: 'バランス' },
  { value: 'small', label: 'Small', crf: 27, description: 'サイズ優先' },
] as const;
export type Mp4QualityPreset = (typeof MP4_QUALITY_PRESETS)[number]['value'];
export type ExportStage = 'preparing' | 'rendering' | 'encoding' | 'saving';

/**
 * 2Dの書き出しフレームを別の表示面へ合成するためのコールバック。
 * 3D表示モードでは、renderBridgeが2Dフレームを生成した後に
 * 選択中の表示アダプターがCanvasTextureとしてマッピングし、返されたsequenceを
 * キャプチャ直前の整合性検証に使用する。
 */
export type VideoExportFrameRenderer = (options: {
  session: ExportSessionToken;
  time: number;
  normalizedTime: number;
}) => number;

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
  saveNativeVideoArtifact?(
    artifact: NativeVideoArtifact,
    filename: string,
    dirHandle: ExportDirectoryHandle | null,
  ): Promise<boolean>;
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
  renderFrame?: VideoExportFrameRenderer;
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
  exportLosslessMOV(config: VideoExportConfig): Promise<NativeVideoArtifact>;
  exportHighQualityMP4(config: VideoExportConfig): Promise<NativeVideoArtifact>;
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
  afterEffectsService: AfterEffectsService;
}
