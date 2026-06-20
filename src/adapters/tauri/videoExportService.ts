import { invoke } from '@tauri-apps/api/core';
import { join, tempDir } from '@tauri-apps/api/path';
import { mkdir, readFile, remove, writeFile } from '@tauri-apps/plugin-fs';
import { browserVideoExportService } from '../browser/videoExportService';
import { renderBridge } from '../../lib/renderBridge';
import { applyTimeRemap } from '../../lib/timeRemap';
import { canvas2dToPngBlob, needsTiledRender, renderTiledToCanvas2D } from '../../lib/tileRender';
import type { AnimationEasing } from '../../store/gradientStore';
import type { VideoExportConfig, VideoExportService } from '../types';
import { isTauriRuntime } from './exportService';

function calcExportNormalizedTime(frameIndex: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0;
  if (frameIndex >= totalFrames - 1) return 0;
  return frameIndex / (totalFrames - 1);
}

function calcTimeFromNormalized(
  normalizedTime: number,
  speed: number,
  duration: number,
  easing?: AnimationEasing,
): number {
  const nt = applyTimeRemap(normalizedTime, duration, easing);
  return nt * speed * duration;
}

async function captureBlob(
  canvas: HTMLCanvasElement,
  fullW: number,
  fullH: number,
  t: number,
  nt: number,
  signal?: AbortSignal,
  onTileProgress?: (p: number) => void,
): Promise<Blob> {
  if (needsTiledRender(canvas, fullW, fullH)) {
    const out2d = await renderTiledToCanvas2D({
      canvas,
      fullWidth: fullW,
      fullHeight: fullH,
      time: t,
      normalizedTime: nt,
      signal,
      onProgress: onTileProgress,
    });
    return await canvas2dToPngBlob(out2d);
  }

  renderBridge.renderAtTime(t, nt);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

async function writePngSequenceToTempDir(
  config: VideoExportConfig,
  tempPath: string,
  totalFrames: number,
): Promise<void> {
  const { canvas, speed, duration, easing, signal, onProgress = () => {} } = config;
  const fullW = canvas.width;
  const fullH = canvas.height;
  const useTiled = needsTiledRender(canvas, fullW, fullH);

  renderBridge.stopAnimation();
  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      const nt = calcExportNormalizedTime(i, totalFrames);
      const t = calcTimeFromNormalized(nt, speed, duration, easing);
      const frameBaseProgress = i / totalFrames;
      const blob = await captureBlob(
        canvas,
        fullW,
        fullH,
        t,
        nt,
        signal,
        useTiled ? (tileProgress) => onProgress((frameBaseProgress + tileProgress / totalFrames) * 0.7) : undefined,
      );
      const filename = `frame_${String(i).padStart(4, '0')}.png`;
      await writeFile(await join(tempPath, filename), new Uint8Array(await blob.arrayBuffer()));
      onProgress(((i + 1) / totalFrames) * 0.7);
      if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
  } finally {
    renderBridge.startAnimation();
  }
}

export const tauriVideoExportService: VideoExportService = {
  exportFrameZip: browserVideoExportService.exportFrameZip,
  nativeFfmpegSupported: isTauriRuntime,
  async exportLosslessMOV(config: VideoExportConfig): Promise<Blob> {
    const ffmpegPath = 'ffmpeg';

    const totalFrames = Math.ceil(config.fps * config.duration);
    const rootTemp = await join(await tempDir(), 'kagaribi-grad');
    const exportTemp = await join(rootTemp, `mov-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const outputPath = await join(exportTemp, 'output.mov');

    await mkdir(exportTemp, { recursive: true });

    try {
      await writePngSequenceToTempDir(config, exportTemp, totalFrames);
      config.onProgress?.(0.72);
      await invoke('encode_qtrle_mov', {
        ffmpegPath,
        inputPattern: await join(exportTemp, 'frame_%04d.png'),
        outputPath,
        fps: config.fps,
      });
      config.onProgress?.(0.95);
      const movieBytes = await readFile(outputPath);
      config.onProgress?.(1);
      return new Blob([movieBytes], { type: 'video/quicktime' });
    } finally {
      await remove(exportTemp, { recursive: true }).catch(() => undefined);
    }
  },
  async exportHighQualityMP4(config: VideoExportConfig): Promise<Blob> {
    const ffmpegPath = 'ffmpeg';

    const totalFrames = Math.ceil(config.fps * config.duration);
    const rootTemp = await join(await tempDir(), 'kagaribi-grad');
    const exportTemp = await join(rootTemp, `mp4-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const outputPath = await join(exportTemp, 'output.mp4');

    await mkdir(exportTemp, { recursive: true });

    try {
      await writePngSequenceToTempDir(config, exportTemp, totalFrames);
      config.onProgress?.(0.72);
      await invoke('encode_h264_rgb_mp4', {
        ffmpegPath,
        inputPattern: await join(exportTemp, 'frame_%04d.png'),
        outputPath,
        fps: config.fps,
      });
      config.onProgress?.(0.95);
      const movieBytes = await readFile(outputPath);
      config.onProgress?.(1);
      return new Blob([movieBytes], { type: 'video/mp4' });
    } finally {
      await remove(exportTemp, { recursive: true }).catch(() => undefined);
    }
  },
};
