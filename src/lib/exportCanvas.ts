import { pngInjectSrgb } from './pngIcc';
import { renderBridge } from './renderBridge';
import {
  canvas2dToJpegBlob,
  canvas2dToPngBlob,
  canvas2dToWebpBlob,
  needsTiledRender,
  renderTiledToCanvas2D,
} from './tileRender';

export type ExportCanvasOptions = {
  logTiledRender?: boolean;
};

/**
 * 高解像度エクスポート用: drawingBuffer 限界を超える場合はタイルレンダリングで合成。
 * 戻り値の Canvas は呼び出し側で必要なフォーマットに変換する。
 */
export async function getExportSourceCanvas(
  canvas: HTMLCanvasElement,
  options: ExportCanvasOptions = {},
): Promise<HTMLCanvasElement> {
  const fullW = canvas.width;
  const fullH = canvas.height;

  if (needsTiledRender(canvas, fullW, fullH)) {
    if (options.logTiledRender) {
      console.log(`[export] Using tiled render for ${fullW}×${fullH}`);
    }
    // 現在の再生位置を維持してタイル描画
    const t = renderBridge.getCurrentTime();
    const nt = renderBridge.getCurrentNormalizedTime();
    return await renderTiledToCanvas2D({
      canvas,
      fullWidth: fullW,
      fullHeight: fullH,
      time: t,
      normalizedTime: nt,
    });
  }

  // 通常パス: 既存の WebGL canvas をそのまま使用
  // GPU→CPU 同期のため複数フレーム待機
  for (let i = 0; i < 3; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  return canvas;
}

export async function canvasToPngBlob(
  canvas: HTMLCanvasElement,
  options: ExportCanvasOptions = {},
): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas, options);
  const raw = src === canvas
    ? await new Promise<Blob>((resolve, reject) => {
        try {
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
            'image/png',
          );
        } catch (e) {
          reject(e);
        }
      })
    : await canvas2dToPngBlob(src);

  try {
    const buf = await raw.arrayBuffer();
    const patched = pngInjectSrgb(new Uint8Array(buf));
    return new Blob([patched], { type: 'image/png' });
  } catch (e) {
    console.error('ICC profile injection failed, falling back to raw PNG:', e);
    return raw;
  }
}

export async function canvasToJpgBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  options: ExportCanvasOptions = {},
): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas, options);
  if (src !== canvas) return canvas2dToJpegBlob(src, quality);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
      'image/jpeg',
      quality,
    );
  });
}

export async function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
  options: ExportCanvasOptions = {},
): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas, options);
  if (src !== canvas) return canvas2dToWebpBlob(src, quality);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
      'image/webp',
      quality,
    );
  });
}
