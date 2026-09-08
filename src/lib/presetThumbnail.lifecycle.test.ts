import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturePresetThumbnail, disposePresetThumbnailRenderer } from './presetThumbnail';
import { initWebGL, disposeWebGL } from './webgl';
import { STORE_DEFAULTS } from '../store/documentModel';
import type { StoreSnapshot } from './presetModel';
import type { WebGLContext } from './webgl';

vi.mock('./webgl', () => ({ initWebGL: vi.fn(), disposeWebGL: vi.fn() }));
vi.mock('./renderSceneAtTime', () => ({ renderSceneAtTime: vi.fn() }));

afterEach(async () => {
  await disposePresetThumbnailRenderer();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('thumbnail renderer ownership', () => {
  it('reuses a healthy owner and replaces a disposed owner after context loss', async () => {
    const canvases: { remove: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn() },
      createElement: () => {
        const canvas = { style: {}, setAttribute: vi.fn(), remove: vi.fn(), toDataURL: () => 'data:image/png;base64,frame' };
        canvases.push(canvas);
        return canvas;
      },
    });
    const first = { disposed: false, gl: { isContextLost: () => false } } as unknown as WebGLContext;
    const restored = { disposed: false, gl: { isContextLost: () => false } } as unknown as WebGLContext;
    vi.mocked(initWebGL).mockResolvedValueOnce(first).mockResolvedValueOnce(restored);
    const snapshot = STORE_DEFAULTS as unknown as StoreSnapshot;
    expect(await capturePresetThumbnail(snapshot)).toContain('data:image/png');
    expect(await capturePresetThumbnail(snapshot)).toContain('data:image/png');
    expect(initWebGL).toHaveBeenCalledTimes(1);
    first.disposed = true;
    expect(await capturePresetThumbnail(snapshot)).toContain('data:image/png');
    expect(initWebGL).toHaveBeenCalledTimes(2);
    expect(disposeWebGL).toHaveBeenCalledWith(first);
    expect(canvases[0].remove).toHaveBeenCalledTimes(1);
    await disposePresetThumbnailRenderer();
    expect(disposeWebGL).toHaveBeenCalledWith(restored);
    expect(canvases[1].remove).toHaveBeenCalledTimes(1);
  });
});
