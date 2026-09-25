import { invoke } from '@tauri-apps/api/core';
import type { RealtimeOutputBackend, RealtimeOutputBackendStatus, RgbaFrame } from '../../lib/spoutOutput';

/** Header names must match FRAME_WIDTH_HEADER / FRAME_HEIGHT_HEADER in src-tauri/src/spout_output.rs. */
export const SPOUT_FRAME_WIDTH_HEADER = 'x-kgg-frame-width';
export const SPOUT_FRAME_HEIGHT_HEADER = 'x-kgg-frame-height';

/** How long to wait for WebView2 to deliver the posted shared buffers. */
const SHARED_BUFFER_TIMEOUT_MS = 3000;

type NativeSpoutOutputStatus = {
  supported: boolean;
  active: boolean;
  requestedName: string | null;
  senderName: string | null;
  width: number;
  height: number;
  framesSent: number;
  lastError: string | null;
};

type SharedBufferReceivedEvent = Event & {
  additionalData?: unknown;
  getBuffer(): ArrayBuffer;
};

/** The subset of `window.chrome.webview` (WebView2) used for shared frame memory. */
export type WebView2Host = {
  addEventListener(type: 'sharedbufferreceived', listener: (event: SharedBufferReceivedEvent) => void): void;
  removeEventListener(type: 'sharedbufferreceived', listener: (event: SharedBufferReceivedEvent) => void): void;
  releaseBuffer(buffer: ArrayBuffer): void;
};

type SharedFrameMessage = { generation: number; slot: number; width: number; height: number };

type SharedSlot = SharedFrameMessage & { buffer: ArrayBuffer; view: Uint8Array };

type Invoke = typeof invoke;

function sharedFrameMessage(data: unknown): SharedFrameMessage | null {
  const message = (data as { kggSpoutFrame?: SharedFrameMessage } | null | undefined)?.kggSpoutFrame;
  if (!message || typeof message.generation !== 'number' || typeof message.slot !== 'number') return null;
  return message;
}

export function getWebView2Host(): WebView2Host | null {
  const host = (globalThis as { chrome?: { webview?: Partial<WebView2Host> } }).chrome?.webview;
  return host && typeof host.addEventListener === 'function' && typeof host.releaseBuffer === 'function'
    ? host as WebView2Host
    : null;
}

/**
 * WebView2 shared-memory frame slots. The renderer reads pixels straight into
 * these buffers; each send only names a slot, so no frame bytes travel
 * through IPC (a 1080p IPC body takes seconds on WebView2).
 */
class SharedFrameSlots {
  private generation = 0;
  private slots: SharedSlot[] = [];
  private readonly byView = new WeakMap<Uint8Array, SharedSlot>();
  private waiting: {
    generation: number;
    count: number;
    received: SharedSlot[];
    resolve: (slots: SharedSlot[] | null) => void;
  } | null = null;
  private readonly host: WebView2Host;
  private readonly call: Invoke;

  constructor(host: WebView2Host, call: Invoke) {
    this.host = host;
    this.call = call;
    host.addEventListener('sharedbufferreceived', this.handleBuffer);
  }

  private handleBuffer = (event: SharedBufferReceivedEvent) => {
    const message = sharedFrameMessage(event.additionalData);
    if (!message) return;
    const buffer = event.getBuffer();
    const waiting = this.waiting;
    if (!waiting || waiting.generation !== message.generation) {
      this.host.releaseBuffer(buffer);
      return;
    }
    waiting.received.push({ ...message, buffer, view: new Uint8Array(buffer) });
    if (waiting.received.length === waiting.count) {
      this.waiting = null;
      waiting.resolve(waiting.received.sort((a, b) => a.slot - b.slot));
    }
  };

  async prepare(width: number, height: number, count: number): Promise<Uint8Array[] | null> {
    this.releaseLocal();
    const generation = ++this.generation;
    const received = new Promise<SharedSlot[] | null>((resolve) => {
      this.waiting = { generation, count, received: [], resolve };
      globalThis.setTimeout(() => {
        if (this.waiting?.generation !== generation) return;
        this.waiting.received.forEach(slot => this.host.releaseBuffer(slot.buffer));
        this.waiting = null;
        resolve(null);
      }, SHARED_BUFFER_TIMEOUT_MS);
    });
    try {
      await this.call('create_spout_frame_buffers', { generation, width, height, count });
    } catch {
      // Older WebView2 runtimes have no SharedBuffer: fall back to IPC bodies.
      if (this.waiting?.generation === generation) this.waiting.resolve(null);
      this.waiting = null;
      return null;
    }
    const slots = await received;
    if (!slots || generation !== this.generation) return null;
    this.slots = slots;
    slots.forEach(slot => this.byView.set(slot.view, slot));
    return slots.map(slot => slot.view);
  }

  /**
   * `undefined`: not a shared buffer. `null`: a shared buffer of a replaced
   * generation (already released; the frame is dropped).
   */
  slotFor(pixels: Uint8Array): SharedSlot | null | undefined {
    const slot = this.byView.get(pixels);
    if (!slot) return undefined;
    return slot.generation === this.generation ? slot : null;
  }

  private releaseLocal(): void {
    this.slots.forEach(slot => this.host.releaseBuffer(slot.buffer));
    this.slots = [];
  }

  async release(): Promise<void> {
    this.generation += 1;
    this.releaseLocal();
    await this.call('release_spout_frame_buffers');
  }
}

export function createTauriSpoutOutputBackend(
  call: Invoke = invoke,
  host: WebView2Host | null = getWebView2Host(),
): RealtimeOutputBackend {
  const shared = host ? new SharedFrameSlots(host, call) : null;
  return {
    async getStatus(): Promise<RealtimeOutputBackendStatus> {
      const status = await call<NativeSpoutOutputStatus>('get_spout_output_status');
      return { supported: status.supported, active: status.active, senderName: status.senderName };
    },
    async start(senderName: string) {
      const status = await call<NativeSpoutOutputStatus>('start_spout_output', { senderName });
      return { senderName: status.senderName };
    },
    async prepareFrameBuffers(width: number, height: number, count: number) {
      return shared ? shared.prepare(width, height, count) : null;
    },
    async releaseFrameBuffers() {
      await shared?.release();
    },
    async sendFrame(frame: RgbaFrame) {
      const slot = shared?.slotFor(frame.pixels);
      if (slot === null) return;
      if (slot) {
        // Shared memory: the pixels are already visible to the native side.
        await call<void>('send_spout_shared_frame', {
          generation: slot.generation,
          slot: slot.slot,
          sequence: frame.sequence,
        });
        return;
      }
      // Fallback: the Uint8Array becomes the raw IPC request body (no
      // JSON/base64); dimensions travel as headers.
      await call<void>('send_spout_output_frame', frame.pixels, {
        headers: {
          [SPOUT_FRAME_WIDTH_HEADER]: String(frame.width),
          [SPOUT_FRAME_HEIGHT_HEADER]: String(frame.height),
        },
      });
    },
    async stop() {
      await call<NativeSpoutOutputStatus>('stop_spout_output');
    },
  };
}
