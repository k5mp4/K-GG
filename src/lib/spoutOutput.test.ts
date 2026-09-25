import { describe, expect, it, vi } from 'vitest';
import {
  FrameRateLimiter,
  SpoutOutputController,
  validateSpoutSenderName,
  type RealtimeOutputBackend,
  type RgbaFrame,
  type RgbaFrameSource,
  type SpoutOutputClock,
} from './spoutOutput';

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void };

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

class FakeClock implements SpoutOutputClock {
  time = 0;
  private timers: { at: number; callback: () => void; id: number }[] = [];
  private nextId = 1;
  now = () => this.time;
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = this.nextId++;
    this.timers.push({ at: this.time + delayMs, callback, id });
    return id;
  };
  clearTimeout = (handle: unknown) => {
    this.timers = this.timers.filter(timer => timer.id !== handle);
  };
  advance(ms: number) {
    this.time += ms;
    const due = this.timers.filter(timer => timer.at <= this.time);
    this.timers = this.timers.filter(timer => timer.at > this.time);
    due.forEach(timer => timer.callback());
  }
  get pending() {
    return this.timers.length;
  }
}

function fakeBackend(options: { supported?: boolean; active?: boolean } = {}) {
  const sends: Deferred<void>[] = [];
  const frames: RgbaFrame[] = [];
  const backend = {
    getStatus: vi.fn(async () => ({ supported: options.supported ?? true, active: options.active ?? false, senderName: null })),
    start: vi.fn(async (senderName: string) => ({ senderName })),
    sendFrame: vi.fn((frame: RgbaFrame) => {
      frames.push({ ...frame, pixels: frame.pixels });
      const next = deferred<void>();
      sends.push(next);
      return next.promise;
    }),
    stop: vi.fn(async () => undefined),
  } satisfies RealtimeOutputBackend;
  return { backend, sends, frames };
}

function fakeSource(width = 4, height = 2) {
  const reads: Deferred<boolean>[] = [];
  const source = {
    getSize: vi.fn(() => ({ width, height })),
    read: vi.fn((_target: Uint8Array) => {
      const next = deferred<boolean>();
      reads.push(next);
      return next.promise;
    }),
    dispose: vi.fn(),
  } satisfies RgbaFrameSource;
  return { source, reads };
}

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

async function startedController(fps: 30 | 60 = 30) {
  const clock = new FakeClock();
  const { backend, sends, frames } = fakeBackend();
  const { source, reads } = fakeSource();
  const output = new SpoutOutputController({ backend, clock, initialFps: fps });
  await output.initialize();
  output.setFrameSource(source);
  await output.setEnabled(true);
  return { output, clock, backend, sends, frames, source, reads };
}

describe('FrameRateLimiter', () => {
  it('halves a 60 Hz preview to 30 fps without drifting', () => {
    const limiter = new FrameRateLimiter(30);
    let sent = 0;
    for (let frame = 0; frame < 60; frame += 1) {
      const now = frame * (1000 / 60) + (frame % 2 ? 1.5 : -1.5); // rAF jitter
      if (limiter.isDue(now)) {
        limiter.consume(now);
        sent += 1;
      }
    }
    expect(sent).toBe(30);
  });

  it('passes every 60 Hz frame at 60 fps', () => {
    const limiter = new FrameRateLimiter(60);
    let sent = 0;
    for (let frame = 0; frame < 60; frame += 1) {
      const now = frame * (1000 / 60) + (frame % 3 === 0 ? 2 : 0);
      if (limiter.isDue(now)) {
        limiter.consume(now);
        sent += 1;
      }
    }
    expect(sent).toBe(60);
  });

  it('reports the remaining delay and resynchronizes after idling', () => {
    const limiter = new FrameRateLimiter(30);
    limiter.consume(0);
    expect(limiter.isDue(10)).toBe(false);
    expect(limiter.delayUntilDue(10)).toBeCloseTo(1000 / 30 - 4 - 10);
    limiter.consume(5000);
    expect(limiter.isDue(5010)).toBe(false);
    expect(limiter.isDue(5000 + 1000 / 30)).toBe(true);
  });
});

describe('validateSpoutSenderName', () => {
  it('accepts printable ASCII and rejects empty, long, or non-ASCII names', () => {
    expect(validateSpoutSenderName('KAGARIBI Grad')).toBeNull();
    expect(validateSpoutSenderName('   ')).toBe('empty');
    expect(validateSpoutSenderName('a'.repeat(201))).toBe('too-long');
    expect(validateSpoutSenderName('カガリビ')).toBe('not-ascii');
    expect(validateSpoutSenderName('tab\tname')).toBe('not-ascii');
  });
});

describe('SpoutOutputController', () => {
  it('reports unsupported without a native backend and never starts', async () => {
    const output = new SpoutOutputController({ backend: null });
    await output.initialize();
    await output.setEnabled(true);
    expect(output.getState().status).toBe('unsupported');
    expect(output.getState().supported).toBe(false);
  });

  it('reports unsupported when the native backend is not Windows', async () => {
    const { backend } = fakeBackend({ supported: false });
    const output = new SpoutOutputController({ backend });
    await output.initialize();
    await output.setEnabled(true);
    expect(output.getState().status).toBe('unsupported');
    expect(backend.start).not.toHaveBeenCalled();
  });

  it('releases a sender left active by a previous page load', async () => {
    const { backend } = fakeBackend({ active: true });
    const output = new SpoutOutputController({ backend });
    await output.initialize();
    expect(backend.stop).toHaveBeenCalledTimes(1);
    expect(output.getState().status).toBe('off');
  });

  it('sends the current canvas immediately after enabling, even without a new render', async () => {
    const { output, backend, reads, sends } = await startedController();
    expect(backend.start).toHaveBeenCalledWith('KAGARIBI Grad');
    expect(output.getState().status).toBe('ready');
    expect(reads).toHaveLength(1);
    reads[0].resolve(true);
    await flush();
    expect(backend.sendFrame).toHaveBeenCalledTimes(1);
    expect(backend.sendFrame.mock.calls[0][0]).toMatchObject({ width: 4, height: 2 });
    sends[0].resolve();
    await flush();
    expect(output.getState()).toMatchObject({ status: 'sending', framesSent: 1, width: 4, height: 2 });
  });

  it('keeps one send in flight, holds only the latest captured frame, and counts drops', async () => {
    const { output, clock, backend, reads, sends } = await startedController(60);
    reads[0].resolve(true);
    await flush();
    expect(backend.sendFrame).toHaveBeenCalledTimes(1);

    // Send 1 is still in flight; the next due frame is captured into the second buffer.
    clock.advance(17);
    output.markFrameDirty();
    expect(reads).toHaveLength(2);
    reads[1].resolve(true);
    await flush();
    expect(backend.sendFrame).toHaveBeenCalledTimes(1);

    // More preview frames arrive while one frame is waiting: they replace the
    // request instead of queueing, and are counted as dropped.
    clock.advance(17);
    output.markFrameDirty();
    clock.advance(17);
    output.markFrameDirty();
    expect(reads).toHaveLength(2);
    expect(output.getState().framesDropped).toBe(1);

    sends[0].resolve();
    await flush();
    // The waiting frame is sent, then the newest dirty frame is captured.
    expect(backend.sendFrame).toHaveBeenCalledTimes(2);
    expect(reads).toHaveLength(3);
  });

  it('reuses two frame buffers instead of allocating per frame', async () => {
    const { output, clock, reads, sends, frames } = await startedController(60);
    for (let frame = 0; frame < 4; frame += 1) {
      reads[frame].resolve(true);
      await flush();
      sends[frame].resolve();
      await flush();
      clock.advance(17);
      output.markFrameDirty();
    }
    const unique = new Set(frames.map(frame => frame.pixels));
    expect(unique.size).toBeLessThanOrEqual(2);
  });

  it('limits sends to the target fps and defers a static change to the next slot', async () => {
    const { output, clock, reads, sends } = await startedController(30);
    reads[0].resolve(true);
    await flush();
    sends[0].resolve();
    await flush();

    clock.advance(10);
    output.markFrameDirty();
    expect(reads).toHaveLength(1);
    expect(clock.pending).toBe(1);
    clock.advance(20);
    expect(reads).toHaveLength(2);
  });

  it('waits instead of failing while the canvas cannot be read', async () => {
    const clock = new FakeClock();
    const { backend } = fakeBackend();
    let blocked = true;
    const { source, reads } = fakeSource();
    const output = new SpoutOutputController({ backend, clock, isCaptureBlocked: () => blocked });
    await output.initialize();
    output.setFrameSource(source);
    await output.setEnabled(true);
    expect(reads).toHaveLength(0);
    expect(output.getState().status).toBe('ready');
    blocked = false;
    clock.advance(40);
    await flush();
    expect(reads).toHaveLength(1);

    reads[0].resolve(false); // e.g. context lost during readback
    await flush();
    expect(output.getState().status).toBe('ready');
    clock.advance(40);
    expect(reads).toHaveLength(2);
  });

  it('stops pacing and releases the sender when disabled', async () => {
    const { output, backend, reads } = await startedController();
    await output.setEnabled(false);
    expect(backend.stop).toHaveBeenCalledTimes(1);
    expect(output.getState()).toMatchObject({ enabled: false, status: 'off', activeSenderName: null });
    // An in-flight readback that completes after stop is ignored.
    reads[0].resolve(true);
    await flush();
    expect(backend.sendFrame).not.toHaveBeenCalled();
    output.markFrameDirty();
    expect(reads).toHaveLength(1);
  });

  it('restarts the sender with a new name while enabled', async () => {
    const { output, backend } = await startedController();
    await output.setSenderName('Stage Left');
    expect(backend.start).toHaveBeenLastCalledWith('Stage Left');
    expect(output.getState().activeSenderName).toBe('Stage Left');
    await output.setSenderName('bad\tname');
    expect(backend.start).toHaveBeenCalledTimes(2);
  });

  it('turns a send failure into an error state without throwing into the renderer', async () => {
    const { output, backend, reads, sends } = await startedController();
    reads[0].resolve(true);
    await flush();
    sends[0].reject(new Error('Spout frame send failed.'));
    await flush();
    expect(output.getState()).toMatchObject({ enabled: false, status: 'error', lastError: 'Spout frame send failed.' });
    expect(backend.stop).toHaveBeenCalled();
    expect(() => output.markFrameDirty()).not.toThrow();
  });

  it('uses native shared buffers with two sends in flight and increasing sequences', async () => {
    const clock = new FakeClock();
    const { backend, sends, frames } = fakeBackend();
    const sharedBuffers = [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)];
    const shared = {
      ...backend,
      prepareFrameBuffers: vi.fn(async () => sharedBuffers),
      releaseFrameBuffers: vi.fn(async () => undefined),
    } satisfies RealtimeOutputBackend;
    const { source, reads } = fakeSource();
    const output = new SpoutOutputController({ backend: shared, clock, initialFps: 60 });
    await output.initialize();
    output.setFrameSource(source);
    await output.setEnabled(true);
    await flush();
    expect(shared.prepareFrameBuffers).toHaveBeenCalledWith(4, 2, 3);

    reads[0].resolve(true);
    await flush();
    clock.advance(17);
    output.markFrameDirty();
    reads[1].resolve(true);
    await flush();
    // Two sends are in flight at once; the third slot is free for the next capture.
    expect(backend.sendFrame).toHaveBeenCalledTimes(2);
    expect(frames.map(frame => frame.sequence)).toEqual([1, 2]);
    expect(sharedBuffers).toContain(frames[0].pixels);
    expect(frames[0].pixels).not.toBe(frames[1].pixels);

    clock.advance(17);
    output.markFrameDirty();
    expect(reads).toHaveLength(3);
    reads[2].resolve(true);
    await flush();
    // Both send slots are busy: the captured frame waits.
    expect(backend.sendFrame).toHaveBeenCalledTimes(2);
    sends[0].resolve();
    await flush();
    expect(backend.sendFrame).toHaveBeenCalledTimes(3);
    expect(frames[2].sequence).toBe(3);

    await output.setEnabled(false);
    expect(shared.releaseFrameBuffers).toHaveBeenCalled();
  });

  it('falls back to local buffers and one send at a time when shared buffers are unavailable', async () => {
    const clock = new FakeClock();
    const { backend } = fakeBackend();
    const fallback = { ...backend, prepareFrameBuffers: vi.fn(async () => null) } satisfies RealtimeOutputBackend;
    const { source, reads } = fakeSource();
    const output = new SpoutOutputController({ backend: fallback, clock, initialFps: 60 });
    await output.initialize();
    output.setFrameSource(source);
    await output.setEnabled(true);
    await flush();
    reads[0].resolve(true);
    await flush();
    clock.advance(17);
    output.markFrameDirty();
    reads[1].resolve(true);
    await flush();
    expect(backend.sendFrame).toHaveBeenCalledTimes(1);
  });

  it('reports a start failure as an error', async () => {
    const { backend } = fakeBackend();
    backend.start.mockRejectedValueOnce('DirectX 11 is unavailable, so Spout output cannot start.');
    const output = new SpoutOutputController({ backend });
    await output.initialize();
    await output.setEnabled(true);
    expect(output.getState()).toMatchObject({ enabled: false, status: 'error' });
    expect(output.getState().lastError).toContain('DirectX 11');
  });
});
