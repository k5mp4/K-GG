import { disposeWebGL, initWebGL, type WebGLContext } from '../lib/webgl';
import type { RenderBackend } from './types';

export class WebGL2RendererBackend implements RenderBackend {
  readonly kind = 'webgl2' as const;
  private context: WebGLContext | null = null;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.context = await initWebGL(canvas);
  }

  getContext(): WebGLContext | null {
    return this.context;
  }

  dispose(): void {
    if (!this.context) {
      this.context = null;
      return;
    }

    disposeWebGL(this.context);
    this.context = null;
  }
}
