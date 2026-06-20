import { adapters } from '../adapters';
import type { ExportDirectoryHandle } from '../adapters';

/** プリセット名をファイル名に使える文字列に変換 */
export function sanitizeStem(name: string): string {
  return adapters.exportService.sanitizeStem(name);
}

/** showDirectoryPicker が利用可能か */
export function canUseDirectoryPicker(): boolean {
  return adapters.exportService.canUseDirectoryPicker();
}

/** フォルダ選択ダイアログを開いてハンドルを返す。キャンセル時は null */
export async function pickDirectory(): Promise<ExportDirectoryHandle | null> {
  return await adapters.exportService.pickDirectory();
}

export async function createExportDirectory(
  dirHandle: ExportDirectoryHandle,
  dirname: string,
): Promise<ExportDirectoryHandle> {
  return await adapters.exportService.createDirectory(dirHandle, dirname);
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
  await adapters.exportService.saveBlobToDir(blob, filename, dirHandle);
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await adapters.exportService.canvasToPngBlob(canvas);
}

// ---------- 公開保存関数 ----------

export async function downloadPNG(
  canvas: HTMLCanvasElement,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  await adapters.exportService.savePNG(canvas, stem, dirHandle);
}

export async function downloadJPG(
  canvas: HTMLCanvasElement,
  quality = 0.92,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  await adapters.exportService.saveJPG(canvas, quality, stem, dirHandle);
}

export async function downloadWebP(
  canvas: HTMLCanvasElement,
  quality = 0.92,
  stem = 'gradient',
  dirHandle: ExportDirectoryHandle | null = null,
): Promise<void> {
  await adapters.exportService.saveWebP(canvas, quality, stem, dirHandle);
}
