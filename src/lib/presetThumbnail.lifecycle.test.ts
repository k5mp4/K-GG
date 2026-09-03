import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocumentState } from '../store/documentSlice';
import { STORE_DEFAULTS } from '../store/documentModel';
import type { StoreSnapshot } from './presetModel';
import {
  capturePresetThumbnail,
  disposePresetThumbnailRenderer,
} from './presetThumbnail';
import { disposeWebGL, initWebGL, type WebGLContext } from './webgl';

vi.mock('./webgl', () => ({
  disposeWebGL: vi.fn(),
  initWebGL: vi.fn(),
}));
vi.mock('./renderSceneAtTime', () => ({ renderSceneAtTime: vi.fn() }));

describe('preset thumbnail renderer lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('waits for queued capture work before disposing the hidden context', async () => {
    const canvas = {
      height: 0,
      remove: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
      toDataURL: vi.fn(() => 'data:image/png;base64,thumbnail'),
      width: 0,
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn() },
      createElement: vi.fn(() => canvas),
    });

    let resolveInit: ((context: WebGLContext) => void) | undefined;
    const initPromise = new Promise<WebGLContext>(resolve => { resolveInit = resolve; });
    vi.mocked(initWebGL).mockReturnValue(initPromise);

    const snapshot: StoreSnapshot = createDocumentState(STORE_DEFAULTS);
    const capture = capturePresetThumbnail(snapshot);
    await Promise.resolve();
    const disposal = disposePresetThumbnailRenderer();

    expect(disposeWebGL).not.toHaveBeenCalled();
    resolveInit?.({} as WebGLContext);

    await expect(capture).resolves.toBe('data:image/png;base64,thumbnail');
    await expect(disposal).resolves.toBeUndefined();
    expect(disposeWebGL).toHaveBeenCalledTimes(1);
    expect(canvas.remove).toHaveBeenCalledTimes(1);
  });
});
