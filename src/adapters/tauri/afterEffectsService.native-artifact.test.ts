import { beforeEach, describe, expect, it, vi } from 'vitest';

type NativeVideoArtifact = {
  kind: 'native-path';
  path: string;
  mimeType: 'video/quicktime' | 'video/mp4';
  release(): Promise<void>;
};

const mocks = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue({ status: 'ok' }),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
  tempDir: vi.fn().mockResolvedValue('C:/Temp'),
  mkdir: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  artifactArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/api/path', () => ({ join: mocks.join, tempDir: mocks.tempDir }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));
vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: mocks.mkdir,
  remove: mocks.remove,
  writeFile: mocks.writeFile,
}));
vi.mock('./exportService', () => ({ isTauriRuntime: vi.fn(() => true) }));

const { tauriAfterEffectsService } = await import('./afterEffectsService');

type VideoCase = {
  extension: 'mov' | 'mp4';
  mimeType: NativeVideoArtifact['mimeType'];
};

const videoCases: VideoCase[] = [
  { extension: 'mov', mimeType: 'video/quicktime' },
  { extension: 'mp4', mimeType: 'video/mp4' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.invoke.mockResolvedValue({ status: 'ok' });
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.artifactArrayBuffer.mockResolvedValue(new ArrayBuffer(0));
});

describe('tauriAfterEffectsService native video artifact contract', () => {
  it.each(videoCases)(
    'passes a verified $extension artifact path directly to the native transfer command',
    async ({ extension, mimeType }) => {
      const artifactPath = `C:/Temp/kagaribi-grad/export/output.${extension}`;
      const artifact = {
        kind: 'native-path',
        path: artifactPath,
        mimeType,
        release: vi.fn().mockResolvedValue(undefined),
        // A legacy Blob conversion must never be attempted for a native artifact.
        arrayBuffer: mocks.artifactArrayBuffer,
      } as unknown as NativeVideoArtifact & Blob;

      await expect(
        tauriAfterEffectsService.importVideo(artifact, extension, 'gradient'),
      ).resolves.toBe('ok');

      expect.soft(mocks.artifactArrayBuffer).not.toHaveBeenCalled();
      expect.soft(mocks.writeFile).not.toHaveBeenCalled();
      expect.soft(mocks.invoke).toHaveBeenCalledWith('send_after_effects_asset', {
        request: expect.objectContaining({
          inputPath: artifactPath,
          extension,
          name: 'gradient',
        }),
      });
    },
  );

  it('keeps the legacy Blob fallback for non-export callers', async () => {
    const blob = new Blob(['video'], { type: 'video/quicktime' });

    await expect(tauriAfterEffectsService.importVideo(blob, 'mov', 'legacy')).resolves.toBe('ok');

    expect.soft(mocks.writeFile).toHaveBeenCalledTimes(1);
    expect.soft(mocks.invoke).toHaveBeenCalledWith('send_after_effects_asset', {
      request: expect.objectContaining({
        inputPath: expect.stringMatching(/after-effects-client\/request-.+\/input\.mov$/),
        extension: 'mov',
        name: 'legacy',
      }),
    });
    expect.soft(mocks.remove).toHaveBeenCalledTimes(1);
  });
});
