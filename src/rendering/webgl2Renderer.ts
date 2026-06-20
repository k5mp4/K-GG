import { initWebGL, type WebGLContext } from '../lib/webgl';
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
    const gl = this.context?.gl;
    if (!gl || !this.context) {
      this.context = null;
      return;
    }

    gl.deleteTexture(this.context.distanceTexture);
    gl.deleteTexture(this.context.gradientRampTexture);
    gl.deleteTexture(this.context.manualDistortTexture);
    gl.deleteTexture(this.context.sourceImageTexture);
    gl.deleteTexture(this.context.imageMaskTexture);
    gl.deleteTexture(this.context.gradTexture);
    gl.deleteTexture(this.context.normalTexture);
    gl.deleteTexture(this.context.hBlurTexture);
    gl.deleteFramebuffer(this.context.gradFbo);
    gl.deleteFramebuffer(this.context.normalFbo);
    gl.deleteFramebuffer(this.context.hBlurFbo);
    gl.deleteProgram(this.context.program);
    gl.deleteProgram(this.context.normalMapProgram);
    gl.deleteProgram(this.context.blurProgram);
    gl.deleteProgram(this.context.stretchProgram);
    gl.deleteProgram(this.context.postprocessProgram);
    gl.deleteProgram(this.context.prismCompositeProgram);
    gl.deleteProgram(this.context.particleProgram);
    gl.deleteVertexArray(this.context.particleVao);
    gl.deleteBuffer(this.context.particleQuadBuffer);
    gl.deleteBuffer(this.context.particleInstanceBuffer);
    this.context = null;
  }
}
