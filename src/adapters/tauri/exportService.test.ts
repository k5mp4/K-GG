import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('\\'))),
  saveDialog: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({ join: mocks.join }));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: mocks.saveDialog,
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: vi.fn(),
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

describe('tauriExportService.saveBlobToDir', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reports false and does not write when the save dialog is cancelled', async () => {
    mocks.saveDialog.mockResolvedValue(null);

    await expect(tauriExportService.saveBlobToDir(
      new Blob(['video']),
      'gradient.mov',
      null,
    )).resolves.toBe(false);

    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('reports true only after writing the selected target', async () => {
    mocks.saveDialog.mockResolvedValue('C:\\exports\\gradient.mov');

    await expect(tauriExportService.saveBlobToDir(
      new Blob(['video']),
      'gradient.mov',
      null,
    )).resolves.toBe(true);

    expect(mocks.writeFile).toHaveBeenCalledWith(
      'C:\\exports\\gradient.mov',
      expect.any(Uint8Array),
    );
  });

  it('propagates a target write failure instead of reporting success', async () => {
    const writeError = new Error('write failed');
    mocks.saveDialog.mockResolvedValue('C:\\exports\\gradient.mov');
    mocks.writeFile.mockRejectedValueOnce(writeError);

    await expect(tauriExportService.saveBlobToDir(
      new Blob(['video']),
      'gradient.mov',
      null,
    )).rejects.toBe(writeError);
  });
});
