/**
 * Realtime output (Spout) controller.
 *
 * Owns the enabled/sender/frame-rate state and paces frames from the processed
 * preview canvas to a native backend:
 *
 *   preview render → publishProcessedCanvasFrame → markFrameDirty()
 *     → FPS limiter → async RGBA readback → backend.sendFrame (raw IPC)
 *
 * Backpressure is "latest frame wins": at most one readback and a bounded
 * number of sends are in flight (2 with shared-memory slots, 1 otherwise), and
 * at most one captured frame waits for a send slot. Newer preview frames
 * replace the waiting request instead of queueing. The preview renderer never
 * waits on Spout, and Spout failures only stop Spout.
 */

export const DEFAULT_SPOUT_SENDER_NAME = 'KAGARIBI Grad';
export const SPOUT_FRAME_RATES = [30, 60] as const;
export type SpoutFrameRate = (typeof SPOUT_FRAME_RATES)[number];
export const DEFAULT_SPOUT_FRAME_RATE: SpoutFrameRate = 30;
/** Must match MAX_SENDER_NAME_BYTES in src-tauri/src/spout_output.rs. */
export const MAX_SPOUT_SENDER_NAME_LENGTH = 200;

export type SpoutOutputStatus =
  | 'checking'
  | 'unsupported'
  | 'off'
  | 'starting'
  | 'ready'
  | 'sending'
  | 'error';

export type SpoutOutputState = {
  supported: boolean;
  enabled: boolean;
  /** Name requested by the user. */
  senderName: string;
  /** Name registered with Spout; differs when Spout appended "_N" after a collision. */
  activeSenderName: string | null;
  targetFps: SpoutFrameRate;
  status: SpoutOutputStatus;
  lastError: string | null;
  width: number;
  height: number;
  framesSent: number;
  /** Preview frames replaced while a readback/send was still in flight. */
  framesDropped: number;
  /** Measured sends per second over the last second. */
  sendFps: number;
  /** Smoothed milliseconds from readback start until the pixels are on the CPU. */
  readbackMs: number;
  /** Smoothed milliseconds for one backend send (IPC + native SendImage). */
  transferMs: number;
};

/** A tightly packed 8-bit RGBA frame in WebGL readPixels order (bottom row first). */
export type RgbaFrame = {
  pixels: Uint8Array;
  width: number;
  height: number;
  /** Increases per captured frame; the native side drops frames older than the last sent one. */
  sequence: number;
};

export type RealtimeOutputBackendStatus = {
  supported: boolean;
  active: boolean;
  senderName: string | null;
};

/**
 * Native realtime output transport. The Spout backend uses CPU readback and
 * SendImage; a future GPU-shared-texture backend (SendTexture) can implement
 * the same lifecycle with a different frame source.
 */
export interface RealtimeOutputBackend {
  getStatus(): Promise<RealtimeOutputBackendStatus>;
  start(senderName: string): Promise<{ senderName: string | null }>;
  /**
   * Optional: returns frame buffers the native side can read without copying
   * the frame through IPC (e.g. WebView2 shared memory). Null means the
   * controller allocates its own buffers and frames are sent as IPC bodies.
   */
  prepareFrameBuffers?(width: number, height: number, count: number): Promise<Uint8Array[] | null>;
  releaseFrameBuffers?(): Promise<void>;
  sendFrame(frame: RgbaFrame): Promise<void>;
  stop(): Promise<void>;
}

/** Reads the processed preview canvas. */
export interface RgbaFrameSource {
  /** Current drawing buffer size, or null while the canvas cannot be read. */
  getSize(): { width: number; height: number } | null;
  /** Asynchronously reads the current frame into `target`; false when it could not be read. */
  read(target: Uint8Array, width: number, height: number): Promise<boolean>;
  dispose(): void;
}

export type SpoutOutputClock = {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
};

const defaultClock: SpoutOutputClock = {
  now: () => performance.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
};

/** Native shared-memory frame slots requested per frame size. */
const SHARED_FRAME_SLOTS = 3;

/** rAF timestamps jitter; accept a frame this early so 60 fps preview → 30 fps output alternates cleanly. */
const FRAME_INTERVAL_TOLERANCE_MS = 4;

export function frameIntervalMs(fps: number): number {
  return 1000 / Math.max(1, fps);
}

/**
 * FPS limiter. `due` tells whether a frame may start now; the next deadline is
 * kept on the fps grid so jitter does not accumulate into a lower rate.
 */
export class FrameRateLimiter {
  private nextDueAt = Number.NEGATIVE_INFINITY;
  private fps: number;

  constructor(fps: number) {
    this.fps = fps;
  }

  setFps(fps: number): void {
    this.fps = fps;
    this.nextDueAt = Number.NEGATIVE_INFINITY;
  }

  reset(): void {
    this.nextDueAt = Number.NEGATIVE_INFINITY;
  }

  isDue(now: number): boolean {
    return now >= this.nextDueAt - FRAME_INTERVAL_TOLERANCE_MS;
  }

  /** Milliseconds until the next frame may start (0 when due). */
  delayUntilDue(now: number): number {
    return this.isDue(now) ? 0 : Math.max(0, this.nextDueAt - FRAME_INTERVAL_TOLERANCE_MS - now);
  }

  consume(now: number): void {
    const interval = frameIntervalMs(this.fps);
    const scheduled = this.nextDueAt + interval;
    // Stay on the grid while keeping up; resynchronize after an idle period.
    this.nextDueAt = scheduled > now ? scheduled : now + interval;
  }
}

export function validateSpoutSenderName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'empty';
  if (name.length > MAX_SPOUT_SENDER_NAME_LENGTH) return 'too-long';
  if (!/^[\x20-\x7e]+$/.test(name)) return 'not-ascii';
  return null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Spout output failed.';
}

type Listener = () => void;

/** Exponential moving average for per-stage timings. */
function smooth(previous: number, sample: number): number {
  return previous === 0 ? sample : previous * 0.9 + sample * 0.1;
}

type SpoutOutputOptions = {
  backend: RealtimeOutputBackend | null;
  clock?: SpoutOutputClock;
  initialSenderName?: string;
  initialFps?: SpoutFrameRate;
  /** Frames are not read while this returns true (e.g. during video export). */
  isCaptureBlocked?: () => boolean;
};

export class SpoutOutputController {
  private state: SpoutOutputState;
  private readonly listeners = new Set<Listener>();
  private readonly backend: RealtimeOutputBackend | null;
  private readonly clock: SpoutOutputClock;
  private readonly isCaptureBlocked: () => boolean;
  private readonly limiter: FrameRateLimiter;
  private source: RgbaFrameSource | null = null;

  /** Increments on every start/stop so stale async results are ignored. */
  private generation = 0;
  private running = false;
  private dirty = false;
  private capturing = false;
  private inFlightSends = 0;
  private maxInFlightSends = 1;
  private pendingFrame: RgbaFrame | null = null;
  private timer: unknown = null;
  /** Reusable frame buffers for the current size (shared with native when supported). */
  private pool: { width: number; height: number; buffers: Uint8Array[] } | null = null;
  private preparingPool = false;
  private busyBuffers = new Set<Uint8Array>();
  private nextSequence = 1;
  private sendTimes: number[] = [];
  private lifecycle: Promise<void> = Promise.resolve();
  private readbackMs = 0;
  private transferMs = 0;

  constructor(options: SpoutOutputOptions) {
    this.backend = options.backend;
    this.clock = options.clock ?? defaultClock;
    this.isCaptureBlocked = options.isCaptureBlocked ?? (() => false);
    const targetFps = options.initialFps ?? DEFAULT_SPOUT_FRAME_RATE;
    this.limiter = new FrameRateLimiter(targetFps);
    this.state = {
      supported: false,
      enabled: false,
      senderName: options.initialSenderName ?? DEFAULT_SPOUT_SENDER_NAME,
      activeSenderName: null,
      targetFps,
      status: options.backend ? 'checking' : 'unsupported',
      lastError: null,
      width: 0,
      height: 0,
      framesSent: 0,
      framesDropped: 0,
      sendFps: 0,
      readbackMs: 0,
      transferMs: 0,
    };
  }

  getState = (): SpoutOutputState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private setState(patch: Partial<SpoutOutputState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }

  /** Queries native support and releases a sender left by a previous page load. */
  async initialize(): Promise<void> {
    if (!this.backend) {
      this.setState({ supported: false, status: 'unsupported' });
      return;
    }
    try {
      const status = await this.backend.getStatus();
      if (status.active && !this.state.enabled) await this.backend.stop();
      if (!status.supported) {
        this.setState({ supported: false, status: 'unsupported' });
        return;
      }
      this.setState({ supported: true, status: this.state.enabled ? this.state.status : 'off' });
    } catch (error) {
      this.setState({ supported: false, status: 'unsupported', lastError: errorMessage(error) });
    }
  }

  setFrameSource(source: RgbaFrameSource | null): void {
    if (this.source === source) return;
    this.source?.dispose();
    this.source = source;
    if (source) this.markFrameDirty();
  }

  setTargetFps(fps: SpoutFrameRate): void {
    if (fps === this.state.targetFps) return;
    this.limiter.setFps(fps);
    this.setState({ targetFps: fps });
    this.pump();
  }

  setEnabled(enabled: boolean): Promise<void> {
    if (enabled === this.state.enabled) return this.lifecycle;
    this.setState({ enabled });
    return this.enqueue(() => (enabled ? this.startSender() : this.stopSender('off')));
  }

  /** Applies a new sender name; restarts the sender when output is on. */
  setSenderName(value: string): Promise<void> {
    const name = value.trim();
    if (validateSpoutSenderName(name) || name === this.state.senderName) return this.lifecycle;
    this.setState({ senderName: name });
    if (!this.state.enabled) return this.lifecycle;
    return this.enqueue(() => this.startSender());
  }

  /** Called after every processed preview frame. Never blocks the renderer. */
  markFrameDirty = (): void => {
    if (!this.running) return;
    if (this.dirty && (this.capturing || this.pendingFrame) && this.limiter.isDue(this.clock.now())) {
      this.setState({ framesDropped: this.state.framesDropped + 1 });
    }
    this.dirty = true;
    this.pump();
  };

  dispose(): Promise<void> {
    this.listeners.clear();
    this.source?.dispose();
    this.source = null;
    if (!this.running && !this.state.enabled) return this.lifecycle;
    this.state = { ...this.state, enabled: false };
    return this.enqueue(() => this.stopSender('off'));
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.lifecycle = this.lifecycle.then(task, task);
    return this.lifecycle;
  }

  private async startSender(): Promise<void> {
    if (!this.backend || !this.state.enabled) return;
    if (!this.state.supported) {
      this.setState({ status: 'unsupported' });
      return;
    }
    this.halt();
    const generation = this.generation;
    this.setState({ status: 'starting', lastError: null });
    try {
      const result = await this.backend.start(this.state.senderName);
      if (generation !== this.generation || !this.state.enabled) return;
      this.running = true;
      this.limiter.reset();
      this.sendTimes = [];
      this.readbackMs = 0;
      this.transferMs = 0;
      this.setState({
        status: 'ready',
        activeSenderName: result.senderName,
        framesSent: 0,
        framesDropped: 0,
        sendFps: 0,
        readbackMs: 0,
        transferMs: 0,
      });
      // Send the current canvas right away, even when the preview is static.
      this.dirty = true;
      this.pump();
    } catch (error) {
      if (generation !== this.generation) return;
      this.fail(error);
    }
  }

  private async stopSender(status: SpoutOutputStatus): Promise<void> {
    this.halt();
    this.setState({ status: this.state.supported ? status : 'unsupported', activeSenderName: null, sendFps: 0 });
    if (!this.backend || !this.state.supported) return;
    try {
      await this.backend.stop();
      await this.backend.releaseFrameBuffers?.();
    } catch (error) {
      this.setState({ lastError: errorMessage(error) });
    }
  }

  /** Stops pacing locally; in-flight results are discarded by generation. */
  private halt(): void {
    this.generation += 1;
    this.running = false;
    this.dirty = false;
    this.pendingFrame = null;
    this.capturing = false;
    this.inFlightSends = 0;
    this.maxInFlightSends = 1;
    this.pool = null;
    this.preparingPool = false;
    this.busyBuffers.clear();
    if (this.timer !== null) {
      this.clock.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private fail(error: unknown): void {
    this.halt();
    // The native side has already released the sender on a send failure;
    // stop() also covers failures that happened before a sender existed.
    void this.backend?.stop().catch(() => undefined);
    void this.backend?.releaseFrameBuffers?.().catch(() => undefined);
    this.setState({ enabled: false, status: 'error', lastError: errorMessage(error), activeSenderName: null, sendFps: 0 });
  }

  /**
   * Creates the buffer pool for a frame size: three native shared-memory slots
   * when the backend offers them (one being filled, two being sent), otherwise
   * two local buffers sent as IPC bodies one at a time.
   */
  private preparePool(width: number, height: number): void {
    const generation = this.generation;
    this.preparingPool = true;
    const prepare = this.backend?.prepareFrameBuffers
      ? this.backend.prepareFrameBuffers(width, height, SHARED_FRAME_SLOTS).catch(() => null)
      : Promise.resolve(null);
    void prepare.then((shared) => {
      if (generation !== this.generation) return;
      const byteLength = width * height * 4;
      const buffers = shared ?? [new Uint8Array(byteLength), new Uint8Array(byteLength)];
      this.pool = { width, height, buffers };
      this.maxInFlightSends = shared ? SHARED_FRAME_SLOTS - 1 : 1;
      this.preparingPool = false;
      this.pump();
    });
  }

  private pump(): void {
    if (!this.running) return;
    if (this.pendingFrame && this.inFlightSends < this.maxInFlightSends) {
      const frame = this.pendingFrame;
      this.pendingFrame = null;
      this.send(frame);
    }
    if (!this.dirty || this.capturing || this.pendingFrame || this.preparingPool) return;
    const now = this.clock.now();
    if (!this.limiter.isDue(now)) {
      this.scheduleTimer(this.limiter.delayUntilDue(now));
      return;
    }
    const source = this.source;
    const size = source?.getSize() ?? null;
    if (!source || !size || this.isCaptureBlocked()) {
      // Canvas unavailable, context lost, or export in progress: retry later
      // without failing the sender.
      this.scheduleTimer(frameIntervalMs(this.state.targetFps));
      return;
    }
    if (!this.pool || this.pool.width !== size.width || this.pool.height !== size.height) {
      this.preparePool(size.width, size.height);
      return;
    }
    const buffer = this.pool.buffers.find(candidate => !this.busyBuffers.has(candidate));
    // Every buffer is being sent: wait for a send to finish (backpressure).
    if (!buffer) return;
    this.dirty = false;
    this.limiter.consume(now);
    this.capture(source, size.width, size.height, buffer);
  }

  private scheduleTimer(delayMs: number): void {
    if (this.timer !== null) return;
    this.timer = this.clock.setTimeout(() => {
      this.timer = null;
      this.pump();
    }, Math.max(1, Math.ceil(delayMs)));
  }

  private capture(source: RgbaFrameSource, width: number, height: number, buffer: Uint8Array): void {
    const generation = this.generation;
    this.busyBuffers.add(buffer);
    this.capturing = true;
    const startedAt = this.clock.now();
    source.read(buffer, width, height).then(
      (ok) => {
        if (generation !== this.generation) return;
        this.capturing = false;
        this.readbackMs = smooth(this.readbackMs, this.clock.now() - startedAt);
        if (!ok) {
          this.busyBuffers.delete(buffer);
          this.dirty = true;
          this.scheduleTimer(frameIntervalMs(this.state.targetFps));
          return;
        }
        if (this.pendingFrame) this.busyBuffers.delete(this.pendingFrame.pixels);
        this.pendingFrame = { pixels: buffer, width, height, sequence: this.nextSequence++ };
        this.pump();
      },
      () => {
        if (generation !== this.generation) return;
        this.capturing = false;
        this.busyBuffers.delete(buffer);
        this.dirty = true;
        this.scheduleTimer(frameIntervalMs(this.state.targetFps));
      },
    );
  }

  private send(frame: RgbaFrame): void {
    if (!this.backend) return;
    const generation = this.generation;
    this.inFlightSends += 1;
    const startedAt = this.clock.now();
    this.backend.sendFrame(frame).then(
      () => {
        if (generation !== this.generation) return;
        this.inFlightSends -= 1;
        this.busyBuffers.delete(frame.pixels);
        const now = this.clock.now();
        this.transferMs = smooth(this.transferMs, now - startedAt);
        this.sendTimes.push(now);
        while (this.sendTimes.length > 0 && this.sendTimes[0] < now - 1000) this.sendTimes.shift();
        this.setState({
          status: 'sending',
          width: frame.width,
          height: frame.height,
          framesSent: this.state.framesSent + 1,
          sendFps: this.sendTimes.length,
          readbackMs: Math.round(this.readbackMs * 10) / 10,
          transferMs: Math.round(this.transferMs * 10) / 10,
        });
        this.pump();
      },
      (error: unknown) => {
        if (generation !== this.generation) return;
        this.fail(error);
      },
    );
  }
}
