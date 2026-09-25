import {
  adapters,
  type ExportDirectoryHandle,
  type NativeFfmpegStatus,
  type NativeVideoArtifact,
  type NativeVideoFormat,
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

export async function exportNativeVideo(
  format: NativeVideoFormat,
  config: ExportConfig,
): Promise<NativeVideoArtifact> {
  return await adapters.videoExportService.exportNativeVideo(format, config);
}

export async function saveNativeVideoArtifact(
  artifact: NativeVideoArtifact,
  filename: string,
  dirHandle: ExportDirectoryHandle | null,
): Promise<string | null> {
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
      platform: 'unknown',
      supported: true,
      available: false,
      source: null,
      path: null,
      version: null,
      error: null,
      warning: null,
      folderPath: null,
      ffprobePath: null,
      ffprobeVersion: null,
      videoFormats: [],
    };
  }
  if (adapters.videoExportService.getNativeFfmpegStatus) {
    return await adapters.videoExportService.getNativeFfmpegStatus();
  }
  return {
    platform: 'unknown',
    supported: false,
    available: false,
    source: null,
    path: null,
    version: null,
    error: 'MOV / MP4 / GIF / WebM エクスポートにはTauriデスクトップ版と外部FFmpegが必要です。',
    warning: null,
    folderPath: null,
    ffprobePath: null,
    ffprobeVersion: null,
    videoFormats: [],
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
