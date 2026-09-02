import {
  adapters,
  type ExportDirectoryHandle,
  type NativeFfmpegStatus,
  type NativeVideoArtifact,
  type VideoExportConfig,
} from '../adapters';

export type ExportConfig = VideoExportConfig;
const FFMPEG_BUILDS_URL = 'https://www.gyan.dev/ffmpeg/builds/#release-builds';

export function shouldSimulateMissingFfmpeg(isDev: boolean, flag: string | undefined): boolean {
  return isDev && flag === '1';
}

function isFfmpegMissingDebugEnabled(): boolean {
  return shouldSimulateMissingFfmpeg(
    import.meta.env.DEV,
    import.meta.env.VITE_KGG_DEBUG_FFMPEG_MISSING,
  );
}

export async function exportLosslessMOV(config: ExportConfig): Promise<NativeVideoArtifact> {
  return await adapters.videoExportService.exportLosslessMOV(config);
}

export async function exportHighQualityMP4(config: ExportConfig): Promise<NativeVideoArtifact> {
  return await adapters.videoExportService.exportHighQualityMP4(config);
}

export async function saveNativeVideoArtifact(
  artifact: NativeVideoArtifact,
  filename: string,
  dirHandle: ExportDirectoryHandle | null,
): Promise<boolean> {
  const save = adapters.exportService.saveNativeVideoArtifact;
  if (!save) throw new Error('この環境ではネイティブ動画ファイルを保存できません。');
  return await save(artifact, filename, dirHandle);
}

export async function exportFrameZip(config: ExportConfig): Promise<Blob> {
  return await adapters.videoExportService.exportFrameZip(config);
}

export function nativeFfmpegSupported(): boolean {
  return adapters.videoExportService.nativeFfmpegSupported?.() ?? false;
}

export async function getNativeFfmpegStatus(): Promise<NativeFfmpegStatus> {
  if (isFfmpegMissingDebugEnabled()) {
    return {
      supported: true,
      available: false,
      source: null,
      path: null,
      version: null,
      error: null,
      warning: null,
      folderPath: null,
    };
  }
  if (adapters.videoExportService.getNativeFfmpegStatus) {
    return await adapters.videoExportService.getNativeFfmpegStatus();
  }
  return {
    supported: false,
    available: false,
    source: null,
    path: null,
    version: null,
    error: 'MOV / MP4 エクスポートはWindows x64デスクトップ版でのみ利用できます。',
    warning: null,
    folderPath: null,
  };
}

export async function openNativeFfmpegFolder(): Promise<void> {
  if (!adapters.videoExportService.openNativeFfmpegFolder) {
    throw new Error('この環境ではK-GG専用FFmpegフォルダを開けません。');
  }
  await adapters.videoExportService.openNativeFfmpegFolder();
}

export async function openFfmpegBuildsPage(): Promise<void> {
  if (!adapters.videoExportService.openFfmpegBuildsPage) {
    window.open(FFMPEG_BUILDS_URL, '_blank', 'noopener,noreferrer');
    return;
  }
  await adapters.videoExportService.openFfmpegBuildsPage();
}
