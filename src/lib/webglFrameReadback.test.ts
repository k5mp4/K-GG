import { describe, expect, it } from 'vitest';
import { createCanvasFrameSource, WebGLCanvasFrameReader } from './webglFrameReadback';

const GL = {
  PIXEL_PACK_BUFFER: 0x88eb,
  PIXEL_PACK_BUFFER_BINDING: 0x88ed,
  READ_FRAMEBUFFER: 0x8ca8,
  READ_FRAMEBUFFER_BINDING: 0x8caa,
  DRAW_FRAMEBUFFER: 0x8ca9,
  DRAW_FRAMEBUFFER_BINDING: 0x8ca6,
  RENDERBUFFER: 0x8d41,
  RENDERBUFFER_BINDING: 0x8ca7,
  RGBA8: 0x8058,
  COLOR_ATTACHMENT0: 0x8ce0,
  COLOR_BUFFER_BIT: 0x4000,
  LINEAR: 0x2601,
  SCISSOR_TEST: 0x0c11,
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
  const rendererDrawFramebuffer = { name: 'renderer-draw-fbo' };
  const state = {
    packBuffer: rendererPackBuffer as object | null,
    readFramebuffer: rendererFramebuffer as object | null,
    drawFramebuffer: rendererDrawFramebuffer as object | null,
    scissor: true,
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
      if (name === GL.DRAW_FRAMEBUFFER_BINDING) return state.drawFramebuffer;
      if (name === GL.PACK_ALIGNMENT) return state.packAlignment;
      return null;
    },
    createBuffer: () => { calls.push('createBuffer'); return { name: 'pbo' }; },
    deleteBuffer: () => calls.push('deleteBuffer'),
    bindBuffer: (_target: number, buffer: object | null) => { state.packBuffer = buffer; },
    bindFramebuffer: (target: number, framebuffer: object | null) => {
      if (target === GL.DRAW_FRAMEBUFFER) state.drawFramebuffer = framebuffer;
      else state.readFramebuffer = framebuffer;
    },
    isEnabled: (name: number) => name === GL.SCISSOR_TEST && state.scissor,
    enable: (name: number) => { if (name === GL.SCISSOR_TEST) state.scissor = true; },
    disable: (name: number) => { if (name === GL.SCISSOR_TEST) state.scissor = false; },
    createFramebuffer: () => { calls.push('createFramebuffer'); return { name: 'scaled-fbo' }; },
    createRenderbuffer: () => ({ name: 'scaled-rb' }),
    deleteFramebuffer: () => calls.push('deleteFramebuffer'),
    deleteRenderbuffer: () => calls.push('deleteRenderbuffer'),
    bindRenderbuffer: () => {},
    renderbufferStorage: (...args: unknown[]) => calls.push(`renderbufferStorage:${args.slice(1).join(',')}`),
    framebufferRenderbuffer: () => {},
    blitFramebuffer: (...args: unknown[]) => {
      calls.push(`blit:${args.slice(0, 8).join(',')}:read=${state.readFramebuffer === null ? 'default' : 'other'}:draw=${(state.drawFramebuffer as { name?: string } | null)?.name}:scissor=${state.scissor}`);
    },
    pixelStorei: (_name: number, value: number) => { state.packAlignment = value; },
    bufferData: () => calls.push('bufferData'),
    readPixels: (...args: unknown[]) => {
      calls.push(`readPixels:${args.slice(0, 4).join(',')}:fbo=${state.readFramebuffer === null ? 'default' : (state.readFramebuffer as { name?: string }).name}:pbo=${(state.packBuffer as { name?: string } | null)?.name}`);
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
  return { gl: gl as unknown as WebGL2RenderingContext, calls, state, rendererPackBuffer, rendererFramebuffer, rendererDrawFramebuffer };
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

  it('downscales on the GPU and reads only the small frame', async () => {
    const { gl, calls, state, rendererPackBuffer, rendererFramebuffer, rendererDrawFramebuffer } = fakeGl({ width: 1920, height: 1080 });
    const scheduler = manualScheduler();
    const reader = new WebGLCanvasFrameReader(gl, scheduler.schedule, () => 0);
    const target = new Uint8Array(8);

    const result = reader.readScaled(target, 2, 1);
    expect(calls).toContain('renderbufferStorage:32856,2,1');
    expect(calls).toContain('blit:0,0,1920,1080,0,0,2,1:read=default:draw=scaled-fbo:scissor=false');
    expect(calls).toContain('readPixels:0,0,2,1:fbo=scaled-fbo:pbo=pbo');
    // Renderer state is restored before the GPU finishes.
    expect(state.readFramebuffer).toBe(rendererFramebuffer);
    expect(state.drawFramebuffer).toBe(rendererDrawFramebuffer);
    expect(state.packBuffer).toBe(rendererPackBuffer);
    expect(state.scissor).toBe(true);

    scheduler.run();
    await expect(result).resolves.toBe(true);
    expect(Array.from(target)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    const second = reader.readScaled(target, 2, 1);
    scheduler.run();
    await expect(second).resolves.toBe(true);
    expect(calls.filter(call => call === 'createFramebuffer')).toHaveLength(1);

    reader.dispose();
    expect(calls).toContain('deleteFramebuffer');
    expect(calls).toContain('deleteRenderbuffer');
  });

  it('does not start a second readback while one is in flight', async () => {
    const { gl } = fakeGl({ width: 4, height: 4 });
    const scheduler = manualScheduler();
    const reader = new WebGLCanvasFrameReader(gl, scheduler.schedule, () => 0);
    const first = reader.readScaled(new Uint8Array(8), 2, 1);
    await expect(reader.readScaled(new Uint8Array(8), 2, 1)).resolves.toBe(false);
    scheduler.run();
    await expect(first).resolves.toBe(true);
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
