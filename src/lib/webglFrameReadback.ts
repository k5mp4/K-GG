import type { RgbaFrameSource } from './spoutOutput';

type Scheduler = (callback: () => void, delayMs: number) => void;

const POLL_INTERVAL_MS = 1;
/** Give up on a readback whose fence never signals (e.g. a hung GPU process). */
const MAX_WAIT_MS = 1000;

/**
 * Asynchronous RGBA readback of a WebGL2 canvas' default framebuffer.
 *
 * `readPixels` into a PIXEL_PACK_BUFFER is queued on the GPU; a fence is then
 * polled and `getBufferSubData` copies into the caller's reusable buffer only
 * after the GPU has finished. The renderer is never stalled by a synchronous
 * readback. The canvas must use `preserveDrawingBuffer: true` so the last
 * presented frame can be read outside the render callback.
 *
 * Bindings touched here (READ_FRAMEBUFFER, PIXEL_PACK_BUFFER, PACK_ALIGNMENT)
 * are restored so the renderer's own state assumptions stay valid.
 */
export class WebGLCanvasFrameReader implements RgbaFrameSource {
  private pixelBuffer: WebGLBuffer | null = null;
  private pixelBufferBytes = 0;
  private reading = false;
  private disposed = false;
  private readonly gl: WebGL2RenderingContext;
  private readonly schedule: Scheduler;
  private readonly now: () => number;

  constructor(
    gl: WebGL2RenderingContext,
    schedule: Scheduler = (callback, delayMs) => { globalThis.setTimeout(callback, delayMs); },
    now: () => number = () => performance.now(),
  ) {
    this.gl = gl;
    this.schedule = schedule;
    this.now = now;
  }

  getSize(): { width: number; height: number } | null {
    if (this.disposed || this.gl.isContextLost()) return null;
    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  read(target: Uint8Array, width: number, height: number): Promise<boolean> {
    const gl = this.gl;
    const byteLength = width * height * 4;
    if (this.disposed || this.reading || gl.isContextLost() || target.byteLength < byteLength) {
      return Promise.resolve(false);
    }
    if (width !== gl.drawingBufferWidth || height !== gl.drawingBufferHeight) {
      return Promise.resolve(false);
    }

    const previousPackBuffer = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING) as WebGLBuffer | null;
    const previousReadFramebuffer = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const previousPackAlignment = gl.getParameter(gl.PACK_ALIGNMENT) as number;
    const restore = () => {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previousPackBuffer);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, previousReadFramebuffer);
      gl.pixelStorei(gl.PACK_ALIGNMENT, previousPackAlignment);
    };

    let sync: WebGLSync | null = null;
    try {
      if (!this.pixelBuffer || this.pixelBufferBytes !== byteLength) {
        if (this.pixelBuffer) gl.deleteBuffer(this.pixelBuffer);
        this.pixelBuffer = gl.createBuffer();
        this.pixelBufferBytes = 0;
        if (!this.pixelBuffer) return Promise.resolve(false);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pixelBuffer);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, byteLength, gl.STREAM_READ);
        this.pixelBufferBytes = byteLength;
      }
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pixelBuffer);
      gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    } finally {
      restore();
    }
    if (!sync) return Promise.resolve(false);

    this.reading = true;
    const startedAt = this.now();
    const fence = sync;
    return new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => {
        this.reading = false;
        if (!gl.isContextLost()) gl.deleteSync(fence);
        resolve(ok);
      };
      const poll = () => {
        if (this.disposed || gl.isContextLost()) {
          finish(false);
          return;
        }
        const status = gl.clientWaitSync(fence, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          if (this.now() - startedAt > MAX_WAIT_MS) finish(false);
          else this.schedule(poll, POLL_INTERVAL_MS);
          return;
        }
        if (status === gl.WAIT_FAILED) {
          finish(false);
          return;
        }
        const previous = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING) as WebGLBuffer | null;
        try {
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pixelBuffer);
          gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, target, 0, byteLength);
        } finally {
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previous);
        }
        finish(true);
      };
      this.schedule(poll, POLL_INTERVAL_MS);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.pixelBuffer && !this.gl.isContextLost()) this.gl.deleteBuffer(this.pixelBuffer);
    this.pixelBuffer = null;
    this.pixelBufferBytes = 0;
  }
}

/**
 * Frame source bound to the preview canvas, resolved lazily because the
 * canvas element can be remounted. GPU objects do not survive a context loss,
 * so the reader is dropped on `webglcontextlost` (or a canvas change) and
 * recreated from the canvas' registered context once it is usable again.
 */
export function createCanvasFrameSource(
  getCanvas: () => HTMLCanvasElement | null,
  getContext: (canvas: HTMLCanvasElement) => WebGL2RenderingContext | null,
): RgbaFrameSource {
  let reader: WebGLCanvasFrameReader | null = null;
  let boundCanvas: HTMLCanvasElement | null = null;
  let disposed = false;
  const dropReader = () => {
    reader?.dispose();
    reader = null;
  };
  const unbind = () => {
    boundCanvas?.removeEventListener('webglcontextlost', dropReader);
    boundCanvas = null;
    dropReader();
  };
  const currentReader = () => {
    if (disposed) return null;
    const canvas = getCanvas();
    if (canvas !== boundCanvas) {
      unbind();
      if (!canvas) return null;
      boundCanvas = canvas;
      canvas.addEventListener('webglcontextlost', dropReader);
    }
    if (!reader && boundCanvas) {
      const gl = getContext(boundCanvas);
      if (!gl || gl.isContextLost()) return null;
      reader = new WebGLCanvasFrameReader(gl);
    }
    return reader;
  };
  return {
    getSize: () => currentReader()?.getSize() ?? null,
    read: (target, width, height) => currentReader()?.read(target, width, height) ?? Promise.resolve(false),
    dispose: () => {
      disposed = true;
      unbind();
    },
  };
}
