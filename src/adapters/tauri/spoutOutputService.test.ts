import { describe, expect, it, vi } from 'vitest';
import { createTauriSpoutOutputBackend, SPOUT_FRAME_HEIGHT_HEADER, SPOUT_FRAME_WIDTH_HEADER, type WebView2Host } from './spoutOutputService';

const nativeStatus = {
  supported: true,
  active: true,
  requestedName: 'KAGARIBI Grad',
  senderName: 'KAGARIBI Grad_1',
  width: 0,
  height: 0,
  framesSent: 0,
  lastError: null,
};

describe('tauri Spout output backend', () => {
  it('sends frames as a raw binary body with dimension headers', async () => {
    const call = vi.fn(async () => undefined);
    const backend = createTauriSpoutOutputBackend(call as never, null);
    const pixels = new Uint8Array(4 * 2 * 4);
    await backend.sendFrame({ pixels, width: 4, height: 2, sequence: 1 });
    expect(call).toHaveBeenCalledWith('send_spout_output_frame', pixels, {
      headers: { [SPOUT_FRAME_WIDTH_HEADER]: '4', [SPOUT_FRAME_HEIGHT_HEADER]: '2' },
    });
    // The payload is the typed array itself, never a JSON-serializable copy.
    const [, payload] = call.mock.calls[0] as unknown as [string, unknown];
    expect(payload).toBe(pixels);
  });

  it('maps start and status responses to the registered sender name', async () => {
    const call = vi.fn(async () => nativeStatus);
    const backend = createTauriSpoutOutputBackend(call as never, null);
    await expect(backend.start('KAGARIBI Grad')).resolves.toEqual({ senderName: 'KAGARIBI Grad_1' });
    expect(call).toHaveBeenCalledWith('start_spout_output', { senderName: 'KAGARIBI Grad' });
    await expect(backend.getStatus()).resolves.toEqual({ supported: true, active: true, senderName: 'KAGARIBI Grad_1' });
    await backend.stop();
    expect(call).toHaveBeenLastCalledWith('stop_spout_output');
  });

  it('shares frame memory through WebView2 buffers and sends only slot references', async () => {
    const host = new FakeWebView2Host();
    const call = vi.fn(async (command: string, args?: unknown) => {
      if (command === 'create_spout_frame_buffers') {
        const { generation, width, height, count } = args as { generation: number; width: number; height: number; count: number };
        for (let slot = 0; slot < count; slot += 1) host.post({ kggSpoutFrame: { generation, slot, width, height } }, width * height * 4);
      }
      return undefined;
    });
    const backend = createTauriSpoutOutputBackend(call as never, host);
    const buffers = await backend.prepareFrameBuffers!(4, 2, 3);
    expect(buffers).toHaveLength(3);
    expect(buffers![0].byteLength).toBe(32);

    await backend.sendFrame({ pixels: buffers![1], width: 4, height: 2, sequence: 9 });
    expect(call).toHaveBeenLastCalledWith('send_spout_shared_frame', { generation: 1, slot: 1, sequence: 9 });

    // Resizing replaces the generation; frames still holding old buffers are dropped.
    const next = await backend.prepareFrameBuffers!(8, 2, 3);
    expect(host.released).toHaveLength(3);
    call.mockClear();
    await backend.sendFrame({ pixels: buffers![0], width: 4, height: 2, sequence: 10 });
    expect(call).not.toHaveBeenCalled();
    await backend.sendFrame({ pixels: next![0], width: 8, height: 2, sequence: 11 });
    expect(call).toHaveBeenLastCalledWith('send_spout_shared_frame', { generation: 2, slot: 0, sequence: 11 });

    await backend.releaseFrameBuffers!();
    expect(host.released).toHaveLength(6);
    expect(call).toHaveBeenLastCalledWith('release_spout_frame_buffers');
  });

  it('falls back to raw IPC frames when the runtime cannot create shared buffers', async () => {
    const host = new FakeWebView2Host();
    const call = vi.fn(async (command: string) => {
      if (command === 'create_spout_frame_buffers') throw new Error('WebView2 SharedBuffer is unavailable');
      return undefined;
    });
    const backend = createTauriSpoutOutputBackend(call as never, host);
    await expect(backend.prepareFrameBuffers!(4, 2, 3)).resolves.toBeNull();
    const pixels = new Uint8Array(32);
    await backend.sendFrame({ pixels, width: 4, height: 2, sequence: 1 });
    expect(call).toHaveBeenLastCalledWith('send_spout_output_frame', pixels, expect.anything());
  });
});

class FakeWebView2Host implements WebView2Host {
  released: ArrayBuffer[] = [];
  private listeners: ((event: Event & { additionalData?: unknown; getBuffer(): ArrayBuffer }) => void)[] = [];
  addEventListener(_type: 'sharedbufferreceived', listener: (event: Event & { additionalData?: unknown; getBuffer(): ArrayBuffer }) => void) {
    this.listeners.push(listener);
  }
  removeEventListener() {}
  releaseBuffer(buffer: ArrayBuffer) {
    this.released.push(buffer);
  }
  post(additionalData: unknown, byteLength: number) {
    const buffer = new ArrayBuffer(byteLength);
    const event = Object.assign(new Event('sharedbufferreceived'), { additionalData, getBuffer: () => buffer });
    this.listeners.forEach(listener => listener(event));
  }
}
