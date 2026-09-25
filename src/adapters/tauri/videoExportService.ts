import { invoke } from '@tauri-apps/api/core';
import { join, tempDir } from '@tauri-apps/api/path';
import { mkdir, remove, writeFile } from '@tauri-apps/plugin-fs';
import { browserVideoExportService } from '../browser/videoExportService';
import { needsTiledRender } from '../../lib/tileRender';
import { renderAndCaptureExportFrame, withExportSession } from '../../lib/videoExportFrames';
import { GIF_MAX_FILE_MB } from '../types';
import type {
  NativeFfmpegStatus,
  NativeVideoArtifact,
  NativeVideoFormat,
  VideoExportConfig,
  VideoExportService,
} from '../types';
import { isTauriRuntime } from './exportService';

async function writePngSequenceToTempDir(
  config: VideoExportConfig,
  tempPath: string,
  totalFrames: number,
): Promise<void> {
  const { canvas, speed, duration, easing, signal, onProgress = () => {}, onStage, renderFrame } = config;
  const fullW = canvas.width;
  const fullH = canvas.height;
  const useTiled = !renderFrame && needsTiledRender(canvas, fullW, fullH);

  onStage?.('rendering');
  await withExportSession(signal, async session => {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      const frameBaseProgress = i / totalFrames;
      const { blob } = await renderAndCaptureExportFrame({
        session,
        canvas,
        fullWidth: fullW,
        fullHeight: fullH,
        frameIndex: i,
        totalFrames,
        speed,
        duration,
        easing,
        signal,
        renderFrame,
        onTileProgress: useTiled
          ? tileProgress => onProgress((frameBaseProgress + tileProgress / totalFrames) * 0.7)
          : undefined,
      });
      const filename = `frame_${String(i).padStart(4, '0')}.png`;
      await writeFile(await join(tempPath, filename), new Uint8Array(await blob.arrayBuffer()));
      onProgress(((i + 1) / totalFrames) * 0.7);
      if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
  });
}

const NATIVE_VIDEO_MIME_TYPES: Record<NativeVideoFormat, NativeVideoArtifact['mimeType']> = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  gif: 'image/gif',
  webm: 'video/webm',
};

function nativeVideoArtifact(
  path: string,
  workspace: string,
  format: NativeVideoFormat,
): NativeVideoArtifact {
  let releasePromise: Promise<void> | null = null;
  return {
    kind: 'native-path',
    path,
    format,
    mimeType: NATIVE_VIDEO_MIME_TYPES[format],
    release(): Promise<void> {
      releasePromise ??= remove(workspace, { recursive: true }).catch((error: unknown) => {
        releasePromise = null;
        throw error;
      });
      return releasePromise;
    },
  };
}

export const tauriVideoExportService: VideoExportService = {
  exportFrameZip: browserVideoExportService.exportFrameZip,
  nativeFfmpegSupported: isTauriRuntime,
  async getNativeFfmpegStatus(): Promise<NativeFfmpegStatus> {
    return await invoke<NativeFfmpegStatus>('get_native_ffmpeg_status');
  },
  async openNativeFfmpegFolder(): Promise<void> {
    await invoke('open_native_ffmpeg_folder');
  },
  async openFfmpegBuildsPage(): Promise<void> {
    await invoke('open_ffmpeg_builds_page');
  },
  async exportNativeVideo(format: NativeVideoFormat, config: VideoExportConfig): Promise<NativeVideoArtifact> {
    const totalFrames = Math.ceil(config.fps * config.duration);
    const rootTemp = await join(await tempDir(), 'kagaribi-grad');
    const exportTemp = await join(rootTemp, `${format}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const outputPath = await join(exportTemp, `output.${format}`);

    await mkdir(exportTemp, { recursive: true });

    let retained = false;
    try {
      await writePngSequenceToTempDir(config, exportTemp, totalFrames);
      config.onProgress?.(0.7);
      config.onStage?.('encoding');
      await invoke('encode_native_video', {
        format,
        inputPattern: await join(exportTemp, 'frame_%04d.png'),
        outputPath,
        fps: config.fps,
        quality: config.mp4Quality ?? 'high',
        gifMaxFileMb: format === 'gif' ? config.gifMaxFileMb ?? GIF_MAX_FILE_MB.default : null,
      });
      config.onProgress?.(0.95);
      config.onStage?.('saving');
      const artifact = nativeVideoArtifact(outputPath, exportTemp, format);
      retained = true;
      return artifact;
    } finally {
      if (!retained) await remove(exportTemp, { recursive: true }).catch(() => undefined);
    }
  },
};
