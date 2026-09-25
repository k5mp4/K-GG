import { describe, expect, it } from 'vitest';
import type { NativeFfmpegStatus } from '../adapters';
import {
  FRAME_ZIP_FORMAT,
  NATIVE_VIDEO_FORMATS,
  availableNativeVideoFormats,
  isNativeVideoFormat,
  nativeVideoFileName,
  nativeVideoFormatDefinition,
} from './videoExportFormats';

function status(overrides: Partial<NativeFfmpegStatus>): NativeFfmpegStatus {
  return {
    platform: 'windows',
    supported: true,
    available: true,
    source: 'system-path',
    path: 'C:/ffmpeg/bin/ffmpeg.exe',
    version: 'ffmpeg version 7.1',
    error: null,
    warning: null,
    folderPath: null,
    ffprobePath: null,
    ffprobeVersion: null,
    ...overrides,
  };
}

describe('video export format registry', () => {
  it('keeps unique format ids that match their file extension', () => {
    const ids = NATIVE_VIDEO_FORMATS.map(format => format.value);
    expect(new Set(ids).size).toBe(ids.length);
    for (const format of NATIVE_VIDEO_FORMATS) expect(format.extension).toBe(format.value);
  });

  it('builds saved file names, keeping the legacy MP4 suffix', () => {
    expect(nativeVideoFileName('gradient', 'mov')).toBe('gradient.mov');
    expect(nativeVideoFileName('gradient', 'mp4')).toBe('gradient_h264rgb.mp4');
    expect(nativeVideoFileName('gradient', 'gif')).toBe('gradient.gif');
    expect(nativeVideoFileName('gradient', 'webm')).toBe('gradient.webm');
  });

  it('only allows After Effects sends for MOV and MP4', () => {
    const compatible = NATIVE_VIDEO_FORMATS
      .filter(format => format.afterEffectsCompatible)
      .map(format => format.value);
    expect(compatible).toEqual(['mov', 'mp4']);
    expect(nativeVideoFormatDefinition('gif').afterEffectsCompatible).toBe(false);
  });

  it('lists only formats that the detected FFmpeg reports, in registry order', () => {
    expect(availableNativeVideoFormats(status({ videoFormats: ['gif', 'mp4', 'mov'] })))
      .toEqual(['mov', 'mp4', 'gif']);
    expect(availableNativeVideoFormats(status({ videoFormats: ['mov', 'mp4', 'gif', 'webm'] })))
      .toEqual(['mov', 'mp4', 'webm', 'gif']);
  });

  it('treats a status without videoFormats as the required MOV and MP4 encoders', () => {
    expect(availableNativeVideoFormats(status({}))).toEqual(['mov', 'mp4']);
  });

  it('returns no native formats when FFmpeg is unavailable', () => {
    expect(availableNativeVideoFormats(null)).toEqual([]);
    expect(availableNativeVideoFormats(status({ available: false, videoFormats: ['mov'] }))).toEqual([]);
  });

  it('distinguishes the PNG ZIP sequence from native formats', () => {
    expect(isNativeVideoFormat(FRAME_ZIP_FORMAT)).toBe(false);
    expect(isNativeVideoFormat('gif')).toBe(true);
  });
});
