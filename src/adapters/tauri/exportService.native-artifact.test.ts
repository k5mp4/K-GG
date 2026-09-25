import { beforeEach, describe, expect, it, vi } from 'vitest';

type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  format: 'mov' | 'mp4';
  mimeType: 'video/quicktime' | 'video/mp4';
  release(): Promise<void>;
};

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
  saveDialog: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/api/path', () => ({ join: mocks.join }));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: mocks.saveDialog,
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
}));
vi.mock('../../lib/exportCanvas', () => ({
  canvasToJpgBlob: vi.fn(),
  canvasToPngBlob: vi.fn(),
  canvasToWebpBlob: vi.fn(),
}));
vi.mock('../browser/exportService', () => ({
  browserExportService: {
    sanitizeStem: (name: string) => name,
    saveBlobToDir: vi.fn().mockResolvedValue(true),
  },
}));

const { tauriExportService } = await import('./exportService');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.invoke.mockResolvedValue('C:/Exports/gradient.mov');
});

describe('tauriExportService native video artifact contract', () => {
  it('saves a native artifact from its verified path without materializing Blob bytes in WebView', async () => {
    const artifactPath = 'C:/Temp/kagaribi-grad/export/output.mov';
    const artifact = {
      kind: 'native-path',
      path: artifactPath,
      format: 'mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
      // A legacy Blob conversion must never be attempted for a native artifact.
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    } as unknown as NativeVideoArtifact & Blob;

    const result = await (tauriExportService.saveNativeVideoArtifact as (
      value: NativeVideoArtifact,
      filename: string,
      dirHandle: string,
    ) => Promise<string | null>)(artifact, 'gradient.mov', 'C:/Exports');

    expect.soft(result).toBe('C:/Exports/gradient.mov');
    expect.soft(artifact.arrayBuffer).not.toHaveBeenCalled();
    expect.soft(mocks.invoke).toHaveBeenCalledWith('save_native_video_artifact', {
      request: {
        inputPath: artifactPath,
        outputPath: 'C:/Exports/gradient.mov',
      },
    });
    expect.soft(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('returns null without saving when the native save dialog is cancelled', async () => {
    mocks.saveDialog.mockResolvedValueOnce(null);

    const result = await tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      format: 'mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', null);

    expect.soft(result).toBeNull();
    expect.soft(mocks.invoke).not.toHaveBeenCalled();
  });

  it('rejects browser directory handles in the native save path', async () => {
    await expect(tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      format: 'mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', { name: 'browser-directory' } as FileSystemDirectoryHandle)).rejects.toThrow(
      'ネイティブ動画はローカルフォルダーにのみ保存できます。',
    );

    expect.soft(mocks.invoke).not.toHaveBeenCalled();
  });

  it('propagates native save failures so the caller can release the artifact', async () => {
    mocks.invoke.mockRejectedValueOnce(new Error('copy failed'));

    await expect(tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      format: 'mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', 'C:/Exports')).rejects.toThrow('copy failed');
  });

  it('registers the native artifact when the requested output is already the source path', async () => {
    const artifactPath = 'C:/Exports/gradient.mov';
    const artifact = {
      kind: 'native-path',
      path: artifactPath,
      format: 'mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    } as NativeVideoArtifact;

    const result = await tauriExportService.saveNativeVideoArtifact?.(
      artifact,
      'gradient.mov',
      'C:/Exports',
    );

    expect.soft(result).toBe(artifactPath);
    expect.soft(mocks.invoke).toHaveBeenCalledWith('save_native_video_artifact', {
      request: {
        inputPath: artifactPath,
        outputPath: artifactPath,
      },
    });
  });
});
