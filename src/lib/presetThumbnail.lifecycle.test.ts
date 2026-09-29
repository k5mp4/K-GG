import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturePresetThumbnail, disposePresetThumbnailRenderer, encodePresetThumbnail, getThumbnailWarmupTimes } from './presetThumbnail';
import { initWebGL, disposeWebGL, settleLazyProgram } from './webgl';
import { renderSceneAtTime } from './renderSceneAtTime';
import { STORE_DEFAULTS } from '../store/documentModel';
import type { StoreSnapshot } from './presetModel';
import type { WebGLContext } from './webgl';

vi.mock('./webgl', () => ({ initWebGL: vi.fn(), disposeWebGL: vi.fn(), settleLazyProgram: vi.fn(async () => 'ready') }));
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

describe('thumbnail encoding', () => {
  const canvasWith = (png: string, webp: string) => ({
    toDataURL: (type?: string) => (type === 'image/webp' ? webp : png),
  });

  it('keeps WebP when it is smaller than PNG', () => {
    expect(encodePresetThumbnail(canvasWith('data:image/png;base64,AAAAAAAA', 'data:image/webp;base64,AA')))
      .toBe('data:image/webp;base64,AA');
  });

  it('keeps PNG for noisy frames where WebP is larger', () => {
    expect(encodePresetThumbnail(canvasWith('data:image/png;base64,AA', 'data:image/webp;base64,AAAAAAAA')))
      .toBe('data:image/png;base64,AA');
  });

  it('keeps PNG when the browser cannot encode WebP', () => {
    expect(encodePresetThumbnail(canvasWith('data:image/png;base64,AAAA', 'data:image/png;base64,AAAA')))
      .toBe('data:image/png;base64,AAAA');
  });
});

describe('thumbnail frame', () => {
  function stubRenderer() {
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn() },
      createElement: () => ({ style: {}, setAttribute: vi.fn(), remove: vi.fn(), toDataURL: () => 'data:image/png;base64,frame' }),
    });
    vi.mocked(initWebGL).mockResolvedValue({ disposed: false, gl: { isContextLost: () => false } } as unknown as WebGLContext);
  }

  function snapshotWithStack(kinds: string[]): StoreSnapshot {
    const snapshot = JSON.parse(JSON.stringify(STORE_DEFAULTS)) as StoreSnapshot;
    snapshot.effectPipeline = {
      ...snapshot.effectPipeline!,
      effectStack: snapshot.effectPipeline!.effectStack.map(layer => ({ ...layer, enabled: kinds.includes(layer.kind) })),
    };
    return snapshot;
  }

  it('waits for every stack shader before drawing the frame', async () => {
    stubRenderer();
    const order: string[] = [];
    vi.mocked(settleLazyProgram).mockImplementation(async (_ctx, key) => { order.push(`settle:${key}`); return 'ready'; });
    vi.mocked(renderSceneAtTime).mockImplementation(() => { order.push('render'); });

    await capturePresetThumbnail(snapshotWithStack(['glass']));

    expect(order).toContain('settle:glassV2');
    expect(order.slice(order.indexOf('render'))).toEqual(['render']);
  });

  it('warms Datamosh history up to time 0 in a fresh session without stack transitions', async () => {
    stubRenderer();
    await capturePresetThumbnail(snapshotWithStack(['datamosh']));
    await capturePresetThumbnail(snapshotWithStack(['datamosh']));

    const calls = vi.mocked(renderSceneAtTime).mock.calls;
    const frames = calls.length / 2;
    expect(frames).toBeGreaterThan(1);
    expect(calls[frames - 1][2]).toBe(0);
    expect(calls[0][3]).toMatchObject({ allowEffectStackTransition: false });
    expect(calls[0][3].renderSessionId).not.toBe(calls[frames][3].renderSessionId);
  });

  it('stops waiting for shaders that never settle so saving can finish', async () => {
    vi.useFakeTimers();
    try {
      stubRenderer();
      vi.mocked(settleLazyProgram).mockImplementation(() => new Promise(() => {}));
      const capture = capturePresetThumbnail(snapshotWithStack(['glass']));
      await vi.advanceTimersByTimeAsync(10_000);

      expect(await capture).toContain('data:image/png');
      expect(renderSceneAtTime).toHaveBeenCalledTimes(1);
    } finally {
      vi.mocked(settleLazyProgram).mockImplementation(async () => 'ready');
      vi.useRealTimers();
    }
  });

  it('renders a single frame when no feedback layer is enabled', async () => {
    stubRenderer();
    await capturePresetThumbnail(snapshotWithStack(['noise']));
    expect(renderSceneAtTime).toHaveBeenCalledTimes(1);
  });

  it('spreads warm-up frames over the second before the loop returns to time 0', () => {
    const times = getThumbnailWarmupTimes({ animation: { ...STORE_DEFAULTS.animation, fps: 24, duration: 5 } });
    expect(times).toHaveLength(24);
    expect(times[0]).toBeCloseTo(1 - 24 / 120);
    expect(times.at(-1)).toBeCloseTo(1 - 1 / 120);
    expect(getThumbnailWarmupTimes({ animation: { ...STORE_DEFAULTS.animation, fps: 24, duration: 0.5 } })).toHaveLength(11);
  });
});
