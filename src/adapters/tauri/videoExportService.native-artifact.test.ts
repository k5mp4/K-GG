import { beforeEach, describe, expect, it, vi } from 'vitest';

type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  mimeType: 'video/quicktime' | 'video/mp4';
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

type NativeExportMethod = 'exportLosslessMOV' | 'exportHighQualityMP4';
type NativeExportCase = {
  method: NativeExportMethod;
  command: string;
  extension: 'mov' | 'mp4';
  mimeType: NativeVideoArtifact['mimeType'];
};

const nativeExportCases: NativeExportCase[] = [
  {
    method: 'exportLosslessMOV',
    command: 'encode_qtrle_mov',
    extension: 'mov',
    mimeType: 'video/quicktime',
  },
  {
    method: 'exportHighQualityMP4',
    command: 'encode_h264_rgb_mp4',
    extension: 'mp4',
    mimeType: 'video/mp4',
  },
];

function exportConfig() {
  return {
    canvas: { width: 1, height: 1 } as HTMLCanvasElement,
    fps: 24 as const,
    duration: 1 / 24,
    speed: 1,
  };
}

function encodedRequest(command: string): { outputPath: string } {
  const call = mocks.invoke.mock.calls.find(([name]) => name === command);
  return call?.[1] as { outputPath: string };
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
  it.each(nativeExportCases)(
    '$method returns a native path artifact without reading the encoded movie into WebView memory',
    async ({ method, command, extension, mimeType }) => {
      const result = await tauriVideoExportService[method](exportConfig());
      const artifact = result as unknown as Partial<NativeVideoArtifact>;
      const request = encodedRequest(command);

      expect.soft(mocks.readFile).not.toHaveBeenCalled();
      expect.soft(artifact).toMatchObject({
        kind: 'native-path',
        path: request.outputPath,
        mimeType,
      });
      expect.soft(typeof artifact.release).toBe('function');
      expect.soft(request.outputPath).toMatch(new RegExp(`output\\.${extension}$`));
    },
  );

  it.each(nativeExportCases)(
    '$method keeps its workspace until release and release is safe to call more than once',
    async ({ method, command }) => {
      const result = await tauriVideoExportService[method](exportConfig());
      const artifact = result as unknown as Partial<NativeVideoArtifact>;
      const request = encodedRequest(command);

      expect.soft(typeof artifact.release).toBe('function');
      expect.soft(mocks.remove).not.toHaveBeenCalled();

      if (typeof artifact.release === 'function') {
        await artifact.release();
        expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
        expect.soft(mocks.remove).toHaveBeenCalledWith(
          expect.stringContaining(request.outputPath.replace(/[/\\]output\.(mov|mp4)$/, '')),
          { recursive: true },
        );

        await artifact.release();
        expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
      }
    },
  );

  it.each(nativeExportCases)(
    '$method removes its workspace when encoding fails',
    async ({ method, extension }) => {
      mocks.invoke.mockRejectedValueOnce(new Error('encoder failed'));

      await expect(tauriVideoExportService[method](exportConfig())).rejects.toThrow('encoder failed');

      expect(mocks.remove).toHaveBeenCalledTimes(1);
      expect(mocks.remove).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${extension}-`)),
        { recursive: true },
      );
      expect(mocks.readFile).not.toHaveBeenCalled();
    },
  );

  it('allows release cleanup to be retried after a transient failure', async () => {
    const artifact = await tauriVideoExportService.exportLosslessMOV(exportConfig());
    mocks.remove
      .mockRejectedValueOnce(new Error('temporary lock'))
      .mockResolvedValueOnce(undefined);

    await expect(artifact.release()).rejects.toThrow('temporary lock');
    await expect(artifact.release()).resolves.toBeUndefined();

    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it.each(nativeExportCases)(
    '$method removes its workspace when export is already cancelled',
    async ({ method, command }) => {
      const controller = new AbortController();
      controller.abort();

      await expect(tauriVideoExportService[method]({
        ...exportConfig(),
        signal: controller.signal,
      })).rejects.toMatchObject({ name: 'AbortError' });

      expect.soft(mocks.invoke.mock.calls.some(([name]) => name === command)).toBe(false);
      expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
    },
  );
});
