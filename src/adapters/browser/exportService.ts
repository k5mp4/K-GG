import { pngInjectSrgb } from '../../lib/pngIcc';
import {
  needsTiledRender,
  renderTiledToCanvas2D,
  canvas2dToPngBlob,
  canvas2dToJpegBlob,
  canvas2dToWebpBlob,
} from '../../lib/tileRender';
import { renderBridge } from '../../lib/renderBridge';
import type { ExportDirectoryHandle, ExportService } from '../types';

/** プリセット名をファイル名に使える文字列に変換 */
export function sanitizeStem(name: string): string {
  return name.trim().replace(/[^\w\u3000-\u9fff\u30a0-\u30ff\u3040-\u309f-]/g, '_').slice(0, 60) || 'gradient';
}

/** showDirectoryPicker が利用可能か */
export function canUseDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/** フォルダ選択ダイアログを開いてハンドルを返す。キャンセル時は null */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return null;
    throw e;
  }
}

export async function createDirectory(
  dirHandle: ExportDirectoryHandle,
  dirname: string,
): Promise<ExportDirectoryHandle> {
  if (typeof dirHandle === 'string') {
    throw new Error('String directory handles are only supported in the Tauri adapter.');
  }
  return await dirHandle.getDirectoryHandle(dirname, { create: true });
}

/**
 * Blob をフォルダハンドルに直接書き込む。
 * ハンドルがなければ <a download> でブラウザのダウンロードフォルダに保存する。
 */
export async function saveBlobToDir(
  blob: Blob,
  filename: string,
  dirHandle: ExportDirectoryHandle | null,
): Promise<void> {
  if (dirHandle && typeof dirHandle !== 'string') {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  // フォールバック: <a download>
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------- Canvas → 各フォーマット Blob ----------

/**
 * 高解像度エクスポート用: drawingBuffer 限界を超える場合はタイルレンダリングで合成。
 * 戻り値の Canvas は呼び出し側で必要なフォーマットに変換する。
 */
async function getExportSourceCanvas(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const fullW = canvas.width;
  const fullH = canvas.height;

  if (needsTiledRender(canvas, fullW, fullH)) {
    console.log(`[export] Using tiled render for ${fullW}×${fullH}`);
    // 現在の再生位置を維持してタイル描画
    const t = renderBridge.getCurrentTime();
    return await renderTiledToCanvas2D({
      canvas,
      fullWidth: fullW,
      fullHeight: fullH,
      time: t,
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

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas);
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

async function canvasToJpgBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas);
  if (src !== canvas) return canvas2dToJpegBlob(src, quality);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
      'image/jpeg', quality,
    );
  });
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas);
  if (src !== canvas) return canvas2dToWebpBlob(src, quality);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
      'image/webp', quality,
    );
  });
}

// ---------- 公開保存関数 ----------

export async function downloadPNG(
  canvas: HTMLCanvasElement,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  const blob = await canvasToPngBlob(canvas);
  await saveBlobToDir(blob, `${stem}.png`, dirHandle);
}

export async function downloadJPG(
  canvas: HTMLCanvasElement,
  quality = 0.92,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  const blob = await canvasToJpgBlob(canvas, quality);
  await saveBlobToDir(blob, `${stem}.jpg`, dirHandle);
}

export async function downloadWebP(
  canvas: HTMLCanvasElement,
  quality = 0.92,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  const blob = await canvasToWebpBlob(canvas, quality);
  await saveBlobToDir(blob, `${stem}.webp`, dirHandle);
}

export const browserExportService: ExportService = {
  sanitizeStem,
  canUseDirectoryPicker,
  pickDirectory,
  createDirectory,
  saveBlobToDir,
  canvasToPngBlob,
  savePNG: downloadPNG,
  saveJPG: downloadJPG,
  saveWebP: downloadWebP,
};
