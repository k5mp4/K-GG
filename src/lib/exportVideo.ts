import { adapters, type VideoExportConfig } from '../adapters';

export type ExportConfig = VideoExportConfig;

export async function exportLosslessMOV(config: ExportConfig): Promise<Blob> {
  return await adapters.videoExportService.exportLosslessMOV(config);
}

export async function exportHighQualityMP4(config: ExportConfig): Promise<Blob> {
  return await adapters.videoExportService.exportHighQualityMP4(config);
}

export async function exportFrameZip(config: ExportConfig): Promise<Blob> {
  return await adapters.videoExportService.exportFrameZip(config);
}

export function nativeFfmpegSupported(): boolean {
  return adapters.videoExportService.nativeFfmpegSupported?.() ?? false;
}
