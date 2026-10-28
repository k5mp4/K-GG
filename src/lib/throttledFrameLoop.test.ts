import { describe, expect, it, vi } from 'vitest';
import { startThrottledFrameLoop, type FrameScheduler } from './throttledFrameLoop';

/** 60fps相当のフレームを手動で進めるスケジューラ。 */
function createFrames() {
  let now = 0;
  let nextId = 1;
  const pending = new Map<number, () => void>();
  const scheduler: FrameScheduler = {
    request: callback => { const id = nextId++; pending.set(id, callback); return id; },
    cancel: id => { pending.delete(id); },
    now: () => now,
  };
  const advance = (frames: number) => {
    for (let index = 0; index < frames; index++) {
      now += 1000 / 60;
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback();
    }
  };
  return { scheduler, advance, pendingCount: () => pending.size };
}

describe('startThrottledFrameLoop', () => {
  it('runs on the first frame and then at most once per interval', () => {
    const frames = createFrames();
    const callback = vi.fn(() => true);
    startThrottledFrameLoop(callback, 200, frames.scheduler);

    frames.advance(1);
    expect(callback).toHaveBeenCalledTimes(1);
    frames.advance(59);
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it('retries on the next frame when the callback could not run', () => {
    const frames = createFrames();
    let ready = false;
    const callback = vi.fn(() => ready);
    startThrottledFrameLoop(callback, 200, frames.scheduler);

    frames.advance(3);
    expect(callback).toHaveBeenCalledTimes(3);
    ready = true;
    frames.advance(1);
    expect(callback).toHaveBeenCalledTimes(4);
    frames.advance(1);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('stops requesting frames once stopped', () => {
    const frames = createFrames();
    const callback = vi.fn(() => true);
    const stop = startThrottledFrameLoop(callback, 200, frames.scheduler);

    frames.advance(1);
    stop();
    expect(frames.pendingCount()).toBe(0);
    frames.advance(60);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
