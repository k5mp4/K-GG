import { beforeEach, describe, expect, it, vi } from 'vitest';

type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  format: 'mov' | 'mp4' | 'gif' | 'webm';
  mimeType: 'video/quicktime' | 'video/mp4' | 'image/gif' | 'video/webm';
  release(): Promise<void>;
};

const mocks = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
  tempDir: vi.fn().mockResolvedValue('C:/Temp'),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(new Uint8Array([0x6d, 0x6f, 0x76])),
  remove: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  needsTiledRender: vi.fn(() => false),
  renderAndCaptureExportFrame: vi.fn().mockResolvedValue({ blob: new Blob(['frame']) }),
  withExportSession: vi.fn(async (
    _signal: AbortSignal | undefined,
    callback: (session: { id: string }) => Promise<unknown>,
  ) => await callback({ id: 'test-session' })),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/api/path', () => ({ join: mocks.join, tempDir: mocks.tempDir }));
vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mocks.mkdir,
  readFile: mocks.readFile,
  remove: mocks.remove,
  writeFile: mocks.writeFile,
}));
vi.mock('../../lib/tileRender', () => ({ needsTiledRender: mocks.needsTiledRender }));
vi.mock('../../lib/videoExportFrames', () => ({
  renderAndCaptureExportFrame: mocks.renderAndCaptureExportFrame,
  withExportSession: mocks.withExportSession,
}));
vi.mock('../browser/videoExportService', () => ({
  browserVideoExportService: { exportFrameZip: vi.fn() },
}));
vi.mock('./exportService', () => ({ isTauriRuntime: vi.fn(() => true) }));

const { tauriVideoExportService } = await import('./videoExportService');

type NativeExportCase = {
  format: NativeVideoArtifact['format'];
  mimeType: NativeVideoArtifact['mimeType'];
};

const nativeExportCases: NativeExportCase[] = [
  { format: 'mov', mimeType: 'video/quicktime' },
  { format: 'mp4', mimeType: 'video/mp4' },
  { format: 'gif', mimeType: 'image/gif' },
  { format: 'webm', mimeType: 'video/webm' },
];

function exportConfig() {
  return {
    canvas: { width: 1, height: 1 } as HTMLCanvasElement,
    fps: 24 as const,
    duration: 1 / 24,
    speed: 1,
  };
}

type EncodeRequest = { format: string; outputPath: string; quality: string; gifMaxFileMb: number | null };

function encodedRequest(): EncodeRequest {
  const call = mocks.invoke.mock.calls.find(([name]) => name === 'encode_native_video');
  return call?.[1] as EncodeRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invoke.mockResolvedValue(undefined);
  mocks.readFile.mockResolvedValue(new Uint8Array([0x6d, 0x6f, 0x76]));
  mocks.remove.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.renderAndCaptureExportFrame.mockResolvedValue({ blob: new Blob(['frame']) });
});

describe('tauriVideoExportService native video artifact contract', () => {
  it('sends the GIF max file size only for GIF, defaulting to 15MB', async () => {
    await tauriVideoExportService.exportNativeVideo('gif', exportConfig());
    expect(encodedRequest().gifMaxFileMb).toBe(15);

    mocks.invoke.mockClear();
    await tauriVideoExportService.exportNativeVideo('gif', { ...exportConfig(), gifMaxFileMb: 8 });
    expect(encodedRequest().gifMaxFileMb).toBe(8);

    mocks.invoke.mockClear();
    await tauriVideoExportService.exportNativeVideo('mp4', { ...exportConfig(), gifMaxFileMb: 8 });
    expect(encodedRequest().gifMaxFileMb).toBeNull();
  });

  it.each(nativeExportCases)(
    '$format returns a native path artifact without reading the encoded movie into WebView memory',
    async ({ format, mimeType }) => {
      const result = await tauriVideoExportService.exportNativeVideo(format, exportConfig());
      const artifact = result as unknown as Partial<NativeVideoArtifact>;
      const request = encodedRequest();

      expect.soft(mocks.readFile).not.toHaveBeenCalled();
      expect.soft(request.format).toBe(format);
      expect.soft(artifact).toMatchObject({
        kind: 'native-path',
        path: request.outputPath,
        format,
        mimeType,
      });
      expect.soft(typeof artifact.release).toBe('function');
      expect.soft(request.outputPath).toMatch(new RegExp(`output\\.${format}$`));
    },
  );

  it.each(nativeExportCases)(
    '$format keeps its workspace until release and release is safe to call more than once',
    async ({ format }) => {
      const result = await tauriVideoExportService.exportNativeVideo(format, exportConfig());
      const artifact = result as unknown as Partial<NativeVideoArtifact>;
      const request = encodedRequest();

      expect.soft(typeof artifact.release).toBe('function');
      expect.soft(mocks.remove).not.toHaveBeenCalled();

      if (typeof artifact.release === 'function') {
        await artifact.release();
        expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
        expect.soft(mocks.remove).toHaveBeenCalledWith(
          expect.stringContaining(request.outputPath.replace(/[/\\]output\.(mov|mp4|gif|webm)$/, '')),
          { recursive: true },
        );

        await artifact.release();
        expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
      }
    },
  );

  it.each(nativeExportCases)(
    '$format removes its workspace when encoding fails',
    async ({ format }) => {
      mocks.invoke.mockRejectedValueOnce(new Error('encoder failed'));

      await expect(tauriVideoExportService.exportNativeVideo(format, exportConfig())).rejects.toThrow('encoder failed');

      expect(mocks.remove).toHaveBeenCalledTimes(1);
      expect(mocks.remove).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${format}-`)),
        { recursive: true },
      );
      expect(mocks.readFile).not.toHaveBeenCalled();
    },
  );

  it('allows release cleanup to be retried after a transient failure', async () => {
    const artifact = await tauriVideoExportService.exportNativeVideo('mov', exportConfig());
    mocks.remove
      .mockRejectedValueOnce(new Error('temporary lock'))
      .mockResolvedValueOnce(undefined);

    await expect(artifact.release()).rejects.toThrow('temporary lock');
    await expect(artifact.release()).resolves.toBeUndefined();

    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it.each(nativeExportCases)(
    '$format removes its workspace when export is already cancelled',
    async ({ format }) => {
      const controller = new AbortController();
      controller.abort();

      await expect(tauriVideoExportService.exportNativeVideo(format, {
        ...exportConfig(),
        signal: controller.signal,
      })).rejects.toMatchObject({ name: 'AbortError' });

      expect.soft(mocks.invoke.mock.calls.some(([name]) => name === 'encode_native_video')).toBe(false);
      expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
    },
  );
});
