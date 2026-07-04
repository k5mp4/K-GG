import { afterEach, describe, expect, it, vi } from 'vitest';
import { LatestFrameScheduler } from './latestFrameScheduler';

describe('LatestFrameScheduler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the default frame APIs with window as their receiver', () => {
    let queuedFrame: FrameRequestCallback | null = null;
    const runtimeWindow = {
      requestAnimationFrame(this: unknown, callback: FrameRequestCallback) {
        if (this !== runtimeWindow) throw new TypeError('Illegal invocation');
        queuedFrame = callback;
        return 42;
      },
      cancelAnimationFrame(this: unknown, handle: number) {
        if (this !== runtimeWindow) throw new TypeError('Illegal invocation');
        expect(handle).toBe(42);
        queuedFrame = null;
      },
    };
    vi.stubGlobal('window', runtimeWindow);
    vi.stubGlobal('requestAnimationFrame', runtimeWindow.requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', runtimeWindow.cancelAnimationFrame);
    const scheduler = new LatestFrameScheduler();

    scheduler.schedule(vi.fn());
    expect(queuedFrame).not.toBeNull();

    scheduler.cancel();
    expect(queuedFrame).toBeNull();
  });

  it('coalesces repeated requests and runs only the latest callback', () => {
    const frames = new Map<number, FrameRequestCallback>();
    let nextHandle = 1;
    const scheduler = new LatestFrameScheduler(
      (callback) => {
        const handle = nextHandle++;
        frames.set(handle, callback);
        return handle;
      },
      (handle) => {
        frames.delete(handle);
      },
    );
    const first = vi.fn();
    const second = vi.fn();
    const latest = vi.fn();

    scheduler.schedule(first);
    scheduler.schedule(second);
    scheduler.schedule(latest);

    expect(frames.size).toBe(1);
    const callback = [...frames.values()][0];
    callback(0);

    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
  });

  it('can cancel a queued frame without running it', () => {
    const frames = new Map<number, FrameRequestCallback>();
    const callback = vi.fn();
    const scheduler = new LatestFrameScheduler(
      (frame) => {
        frames.set(1, frame);
        return 1;
      },
      (handle) => {
        frames.delete(handle);
      },
    );

    scheduler.schedule(callback);
    scheduler.cancel();

    expect(frames.size).toBe(0);
    expect(callback).not.toHaveBeenCalled();
  });
});
