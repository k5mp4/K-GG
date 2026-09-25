import { describe, expect, it } from 'vitest';
import { createCanvasFrameSource, WebGLCanvasFrameReader } from './webglFrameReadback';

const GL = {
  PIXEL_PACK_BUFFER: 0x88eb,
  PIXEL_PACK_BUFFER_BINDING: 0x88ed,
  READ_FRAMEBUFFER: 0x8ca8,
  READ_FRAMEBUFFER_BINDING: 0x8caa,
  PACK_ALIGNMENT: 0x0d05,
  STREAM_READ: 0x88e1,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
  TIMEOUT_EXPIRED: 0x911b,
  CONDITION_SATISFIED: 0x911c,
  WAIT_FAILED: 0x911d,
};

function fakeGl(options: { width?: number; height?: number; pendingPolls?: number } = {}) {
  const calls: string[] = [];
  const rendererPackBuffer = { name: 'renderer-pack' };
  const rendererFramebuffer = { name: 'renderer-fbo' };
  const state = {
    packBuffer: rendererPackBuffer as object | null,
    readFramebuffer: rendererFramebuffer as object | null,
    packAlignment: 1,
    lost: false,
    pendingPolls: options.pendingPolls ?? 1,
  };
  const gl = {
    ...GL,
    drawingBufferWidth: options.width ?? 2,
    drawingBufferHeight: options.height ?? 1,
    isContextLost: () => state.lost,
    getParameter: (name: number) => {
      if (name === GL.PIXEL_PACK_BUFFER_BINDING) return state.packBuffer;
      if (name === GL.READ_FRAMEBUFFER_BINDING) return state.readFramebuffer;
      if (name === GL.PACK_ALIGNMENT) return state.packAlignment;
      return null;
    },
    createBuffer: () => { calls.push('createBuffer'); return { name: 'pbo' }; },
    deleteBuffer: () => calls.push('deleteBuffer'),
    bindBuffer: (_target: number, buffer: object | null) => { state.packBuffer = buffer; },
    bindFramebuffer: (_target: number, framebuffer: object | null) => { state.readFramebuffer = framebuffer; },
    pixelStorei: (_name: number, value: number) => { state.packAlignment = value; },
    bufferData: () => calls.push('bufferData'),
    readPixels: (...args: unknown[]) => {
      calls.push(`readPixels:${args.slice(0, 4).join(',')}:fbo=${state.readFramebuffer === null ? 'default' : 'other'}:pbo=${(state.packBuffer as { name?: string } | null)?.name}`);
    },
    fenceSync: () => ({ name: 'sync' }),
    flush: () => calls.push('flush'),
    clientWaitSync: () => {
      if (state.pendingPolls > 0) {
        state.pendingPolls -= 1;
        return GL.TIMEOUT_EXPIRED;
      }
      return GL.CONDITION_SATISFIED;
    },
    deleteSync: () => calls.push('deleteSync'),
    getBufferSubData: (_target: number, _offset: number, target: Uint8Array) => {
      calls.push('getBufferSubData');
      target.set([1, 2, 3, 4, 5, 6, 7, 8]);
    },
  };
  return { gl: gl as unknown as WebGL2RenderingContext, calls, state, rendererPackBuffer, rendererFramebuffer };
}

function manualScheduler() {
  const queue: (() => void)[] = [];
  return {
    schedule: (callback: () => void) => { queue.push(callback); },
    run() {
      while (queue.length) queue.shift()?.();
    },
  };
}

describe('WebGLCanvasFrameReader', () => {
  it('reads the default framebuffer through a PBO and restores renderer bindings', async () => {
    const { gl, calls, state, rendererPackBuffer, rendererFramebuffer } = fakeGl({ pendingPolls: 2 });
    const scheduler = manualScheduler();
    const reader = new WebGLCanvasFrameReader(gl, scheduler.schedule, () => 0);
    const target = new Uint8Array(8);

    const result = reader.read(target, 2, 1);
    expect(calls).toContain('readPixels:0,0,2,1:fbo=default:pbo=pbo');
    // Bindings are restored synchronously, before the GPU finishes.
    expect(state.packBuffer).toBe(rendererPackBuffer);
    expect(state.readFramebuffer).toBe(rendererFramebuffer);
    expect(state.packAlignment).toBe(1);
    expect(calls).not.toContain('getBufferSubData');

    scheduler.run();
    await expect(result).resolves.toBe(true);
    expect(Array.from(target)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(state.packBuffer).toBe(rendererPackBuffer);
    expect(calls.filter(call => call === 'createBuffer')).toHaveLength(1);

    // The PBO is reused for the next frame of the same size.
    const second = reader.read(target, 2, 1);
    scheduler.run();
    await expect(second).resolves.toBe(true);
    expect(calls.filter(call => call === 'createBuffer')).toHaveLength(1);
  });

  it('fails soft when the context is lost or the size no longer matches', async () => {
    const { gl, state } = fakeGl();
    const scheduler = manualScheduler();
    const reader = new WebGLCanvasFrameReader(gl, scheduler.schedule, () => 0);
    await expect(reader.read(new Uint8Array(32), 4, 2)).resolves.toBe(false);

    const pending = reader.read(new Uint8Array(8), 2, 1);
    state.lost = true;
    scheduler.run();
    await expect(pending).resolves.toBe(false);
    expect(reader.getSize()).toBeNull();
  });
});

describe('createCanvasFrameSource', () => {
  it('drops the reader on context loss and recreates it after restore', () => {
    const { gl, state } = fakeGl();
    const canvas = new EventTarget() as HTMLCanvasElement;
    const source = createCanvasFrameSource(() => canvas, () => gl);
    expect(source.getSize()).toEqual({ width: 2, height: 1 });
    state.lost = true;
    canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(source.getSize()).toBeNull();
    state.lost = false;
    expect(source.getSize()).toEqual({ width: 2, height: 1 });
    source.dispose();
    expect(source.getSize()).toBeNull();
  });

  it('reports no frame while the canvas is not mounted', async () => {
    const source = createCanvasFrameSource(() => null, () => null);
    expect(source.getSize()).toBeNull();
    await expect(source.read(new Uint8Array(4), 1, 1)).resolves.toBe(false);
  });
});
