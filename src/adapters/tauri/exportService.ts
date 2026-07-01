import { join } from '@tauri-apps/api/path';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { pngInjectSrgb } from '../../lib/pngIcc';
import { renderBridge } from '../../lib/renderBridge';
import {
  canvas2dToJpegBlob,
  canvas2dToPngBlob,
  canvas2dToWebpBlob,
  needsTiledRender,
  renderTiledToCanvas2D,
} from '../../lib/tileRender';
import { browserExportService } from '../browser/exportService';
import type { ExportDirectoryHandle, ExportService } from '../types';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
}

function extensionOf(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && ext !== filename ? ext : '';
}

function dialogFilters(filename: string) {
  const ext = extensionOf(filename);
  return ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : undefined;
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

async function getExportSourceCanvas(canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const fullW = canvas.width;
  const fullH = canvas.height;

  if (needsTiledRender(canvas, fullW, fullH)) {
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

  for (let i = 0; i < 3; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  return canvas;
}

async function canvasToTauriPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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
      'image/jpeg',
      quality,
    );
  });
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const src = await getExportSourceCanvas(canvas);
  if (src !== canvas) return canvas2dToWebpBlob(src, quality);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
      'image/webp',
      quality,
    );
  });
}

export const tauriExportService: ExportService = {
  sanitizeStem: browserExportService.sanitizeStem,
  canUseDirectoryPicker: isTauriRuntime,
  async pickDirectory(): Promise<ExportDirectoryHandle | null> {
    const selected = await openDialog({
      title: '書き出し先フォルダを選択',
      directory: true,
      multiple: false,
      recursive: true,
      canCreateDirectories: true,
    });
    return typeof selected === 'string' ? selected : null;
  },
  async createDirectory(dirHandle: ExportDirectoryHandle, dirname: string): Promise<ExportDirectoryHandle> {
    if (typeof dirHandle !== 'string') {
      return await dirHandle.getDirectoryHandle(dirname, { create: true });
    }
    const childPath = await join(dirHandle, dirname);
    await mkdir(childPath, { recursive: true });
    return childPath;
  },
  async saveBlobToDir(
    blob: Blob,
    filename: string,
    dirHandle: ExportDirectoryHandle | null,
  ): Promise<void> {
    const bytes = await blobToBytes(blob);

    if (typeof dirHandle === 'string') {
      await writeFile(await join(dirHandle, filename), bytes);
      return;
    }

    if (dirHandle) {
      await browserExportService.saveBlobToDir(blob, filename, dirHandle);
      return;
    }

    const target = await saveDialog({
      title: 'ファイルを保存',
      defaultPath: filename,
      filters: dialogFilters(filename),
      canCreateDirectories: true,
    });
    if (!target) return;
    await writeFile(target, bytes);
  },
  canvasToPngBlob: canvasToTauriPngBlob,
  async savePNG(canvas, stem, dirHandle = null) {
    const blob = await canvasToTauriPngBlob(canvas);
    await this.saveBlobToDir(blob, `${stem}.png`, dirHandle);
  },
  async saveJPG(canvas, quality, stem, dirHandle = null) {
    const blob = await canvasToJpgBlob(canvas, quality);
    await this.saveBlobToDir(blob, `${stem}.jpg`, dirHandle);
  },
  async saveWebP(canvas, quality, stem, dirHandle = null) {
    const blob = await canvasToWebpBlob(canvas, quality);
    await this.saveBlobToDir(blob, `${stem}.webp`, dirHandle);
  },
};
