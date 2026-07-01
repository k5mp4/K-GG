import { Zip, ZipPassThrough } from 'fflate';
import { renderBridge } from '../../lib/renderBridge';
import { applyTimeRemap } from '../../lib/timeRemap';
import { needsTiledRender, renderTiledToCanvas2D, canvas2dToPngBlob } from '../../lib/tileRender';
import type { AnimationEasing } from '../../store/gradientStore';
import type { VideoExportConfig, VideoExportService } from '../types';

// ---------- 共通ユーティリティ ----------

function calcExportNormalizedTime(frameIndex: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0;
  // Sample the composition frame interval [0, 1). Preview looping is a transport
  // choice and must not replace a keyed animation's final frame with frame zero.
  return Math.max(0, Math.min(1, frameIndex / totalFrames));
}

/** easing に応じた normalizedTime → u_time を計算 */
function calcTimeFromNormalized(
  normalizedTime: number,
  speed: number,
  duration: number,
  easing?: AnimationEasing,
): number {
  const nt = applyTimeRemap(normalizedTime, duration, easing);
  return nt * speed * duration;
}

/** canvas → PNG Blob。タイルが必要な場合はタイル描画を行う。 */
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

  // 通常パス: 描画して capture
  renderBridge.renderAtTime(t, nt);
  
  // WebGL レンダリング完了を待機 (preserveDrawingBuffer 用)
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

/** PNG ZIP 用: フレームを描画・キャプチャしながら ZIP チャンクへ流す。 */
async function captureFrameZipChunks(
  canvas: HTMLCanvasElement,
  totalFrames: number,
  speed: number,
  duration: number,
  onProgress: (p: number) => void,
  easing?: AnimationEasing,
  signal?: AbortSignal,
): Promise<Blob> {
  const zipChunks: BlobPart[] = [];
  const fullW = canvas.width;
  const fullH = canvas.height;
  const useTiled = needsTiledRender(canvas, fullW, fullH);

  if (useTiled) console.log(`[exportVideo] Using tiled render path for ${fullW}×${fullH} (ZIP)`);

  const zipBlobPromise = new Promise<Blob>((resolve, reject) => {
    const zip = new Zip((err, data, final) => {
      if (err) {
        reject(err);
        return;
      }
      if (data.length > 0) {
        const chunk = new Uint8Array(data.length);
        chunk.set(data);
        zipChunks.push(chunk.buffer);
      }
      if (final) resolve(new Blob(zipChunks, { type: 'application/zip' }));
    });

    void (async () => {
      renderBridge.stopAnimation();
      try {
        // WebGL canvas は単一の描画先なので、通常パスもタイルパスも逐次処理する。
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
            useTiled ? (tileProgress) => onProgress(frameBaseProgress + tileProgress / totalFrames) : undefined,
          );
          const frame = new Uint8Array(await blob.arrayBuffer());
          const file = new ZipPassThrough(`frame_${String(i).padStart(4, '0')}.png`);
          zip.add(file);
          file.push(frame, true);

          onProgress((i + 1) / totalFrames);
          if (i % 5 === 0) await new Promise(res => setTimeout(res, 0));
        }

        zip.end();
      } catch (e) {
        zip.terminate();
        reject(e);
      } finally {
        renderBridge.startAnimation();
      }
    })();
  });

  return zipBlobPromise;
}

// ---------- 公開型 ----------

export type ExportConfig = VideoExportConfig;

// ---------- Lossless RGB MOV エクスポート ----------

/** QuickTime Animation (qtrle) でロスレス RGB MOV を生成して Blob を返す。
 *  YUV 変換を行わないため PNG と同一の色が保持される。 */
export async function exportLosslessMOV(_config: ExportConfig): Promise<Blob> {
  throw new Error('Lossless MOV エクスポートには Tauri ローカルアプリと外部 FFmpeg バイナリが必要です。');
}

export async function exportHighQualityMP4(_config: ExportConfig): Promise<Blob> {
  throw new Error('MP4 エクスポートには Tauri ローカルアプリと外部 FFmpeg バイナリが必要です。');
}

// ---------- 連番 PNG ZIP エクスポート ----------

/** 連番 PNG ZIP を生成して Blob を返す（保存は呼び出し側が行う） */
export async function exportFrameZip(config: ExportConfig): Promise<Blob> {
  const { canvas, fps, duration, speed, easing, signal, onProgress = () => {} } = config;
  const totalFrames = Math.ceil(fps * duration);

  // フレームをZIPへ逐次追加（95%）。巨大な連続 ArrayBuffer を作らず、中尺動画でのメモリ不足を避ける。
  const blob = await captureFrameZipChunks(
    canvas, totalFrames, speed, duration,
    (p) => onProgress(p * 0.95),
    easing,
    signal,
  );

  onProgress(1);
  return blob;
}

export const browserVideoExportService: VideoExportService = {
  exportLosslessMOV,
  exportHighQualityMP4,
  exportFrameZip,
};
