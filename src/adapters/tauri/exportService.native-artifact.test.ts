import { beforeEach, describe, expect, it, vi } from 'vitest';

type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  mimeType: 'video/quicktime' | 'video/mp4';
  release(): Promise<void>;
};

const mocks = vi.hoisted(() => ({
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
  saveDialog: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  copyFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@tauri-apps/api/path', () => ({ join: mocks.join }));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: mocks.saveDialog,
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
  copyFile: mocks.copyFile,
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
  mocks.copyFile.mockResolvedValue(undefined);
});

describe('tauriExportService native video artifact contract', () => {
  it('copies a native artifact from its verified path without materializing Blob bytes in WebView', async () => {
    const artifactPath = 'C:/Temp/kagaribi-grad/export/output.mov';
    const artifact = {
      kind: 'native-path',
      path: artifactPath,
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
      // A legacy Blob conversion must never be attempted for a native artifact.
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    } as unknown as NativeVideoArtifact & Blob;

    const result = await (tauriExportService.saveNativeVideoArtifact as (
      value: NativeVideoArtifact,
      filename: string,
      dirHandle: string,
    ) => Promise<boolean>)(artifact, 'gradient.mov', 'C:/Exports');

    expect.soft(result).toBe(true);
    expect.soft(artifact.arrayBuffer).not.toHaveBeenCalled();
    expect.soft(mocks.copyFile).toHaveBeenCalledWith(
      artifactPath,
      'C:/Exports/gradient.mov',
    );
    expect.soft(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('returns false without copying when the native save dialog is cancelled', async () => {
    mocks.saveDialog.mockResolvedValueOnce(null);

    const result = await tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', null);

    expect.soft(result).toBe(false);
    expect.soft(mocks.copyFile).not.toHaveBeenCalled();
  });

  it('rejects browser directory handles in the native save path', async () => {
    await expect(tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', { name: 'browser-directory' } as FileSystemDirectoryHandle)).rejects.toThrow(
      'ネイティブ動画はローカルフォルダーにのみ保存できます。',
    );

    expect.soft(mocks.copyFile).not.toHaveBeenCalled();
  });

  it('propagates native copy failures so the caller can release the artifact', async () => {
    mocks.copyFile.mockRejectedValueOnce(new Error('copy failed'));

    await expect(tauriExportService.saveNativeVideoArtifact?.({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/export/output.mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'gradient.mov', 'C:/Exports')).rejects.toThrow('copy failed');
  });
});
