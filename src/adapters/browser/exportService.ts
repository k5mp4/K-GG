import {
  canvasToJpgBlob as exportCanvasToJpgBlob,
  canvasToPngBlob as exportCanvasToPngBlob,
  canvasToWebpBlob as exportCanvasToWebpBlob,
} from '../../lib/exportCanvas';
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

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await exportCanvasToPngBlob(canvas, { logTiledRender: true });
}

async function canvasToJpgBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await exportCanvasToJpgBlob(canvas, quality, { logTiledRender: true });
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await exportCanvasToWebpBlob(canvas, quality, { logTiledRender: true });
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
