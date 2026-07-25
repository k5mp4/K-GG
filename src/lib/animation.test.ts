import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnimationLoop } from './animation';

describe('AnimationLoop', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('can initialize at frame zero without starting playback', () => {
    const onFrame = vi.fn();
    const loop = new AnimationLoop(5, onFrame);

    loop.start({ paused: true });

    expect(loop.isPaused).toBe(true);
    expect(loop.currentNormalizedTime).toBe(0);
    expect(onFrame).toHaveBeenCalledWith(0, 0);
  });

  it('resumes playback only after an explicit resume operation', () => {
    const onFrame = vi.fn();
    const requestAnimationFrame = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const loop = new AnimationLoop(5, onFrame);

    loop.start({ paused: true });
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    loop.resume();

    expect(loop.isPaused).toBe(false);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });

  it('quantizes seek and render positions to the configured FPS grid', () => {
    const onFrame = vi.fn();
    const loop = new AnimationLoop(2, onFrame, { fps: 2 });

    loop.start({ paused: true });
    loop.seekTo(0.3);
    loop.renderFrame(0.3);

    expect(loop.currentNormalizedTime).toBe(0.25);
    expect(onFrame).toHaveBeenLastCalledWith(0.5, 0.25);
  });

  it('pauses on the requested frame and ignores a stale RAF callback', () => {
    const onFrame = vi.fn();
    let queuedFrame: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queuedFrame = callback;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(100);
    const loop = new AnimationLoop(1, onFrame, { fps: 10 });

    loop.start();
    now.mockReturnValue(200);
    const firstFrame = queuedFrame as unknown as ((timestamp: number) => void) | null;
    firstFrame?.(200);
    now.mockReturnValue(326);
    loop.pause();

    expect(loop.isPaused).toBe(true);
    expect(loop.currentNormalizedTime).toBe(0.1);
    expect(onFrame).toHaveBeenLastCalledWith(0.1, 0.1);

    const staleFrame = queuedFrame as unknown as ((timestamp: number) => void) | null;
    staleFrame?.(326);
    expect(onFrame).toHaveBeenLastCalledWith(0.1, 0.1);
  });
});
