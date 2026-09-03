import { describe, expect, it, vi } from 'vitest';
import { disposeFlowGradientResources, type FlowGradientResources } from './flowGradientRenderer';

function makeResources(): FlowGradientResources {
  return {
    splatProgram: {} as WebGLProgram,
    splatUniforms: {},
    trailProgram: {} as WebGLProgram,
    trailUniforms: {},
    compositeProgram: {} as WebGLProgram,
    compositeUniforms: {},
    vao: {} as WebGLVertexArrayObject,
    quadBuffer: {} as WebGLBuffer,
    densityFbo: {} as WebGLFramebuffer,
    densityTexture: {} as WebGLTexture,
    trailFboA: {} as WebGLFramebuffer,
    trailTextureA: {} as WebGLTexture,
    trailFboB: {} as WebGLFramebuffer,
    trailTextureB: {} as WebGLTexture,
    size: [64, 64],
    trailIndex: 0,
    hasTrail: true,
    available: true,
    format: 'rgba8',
    lastConfigSignature: 'config',
    lastPhase: 0.5,
    lastRegionKey: 'region',
    lastFrameKey: 'frame',
    lastSessionId: 'session',
    lastLoopEnabled: true,
  };
}

describe('Flow Gradient resource lifecycle', () => {
  it('deletes stage programs, geometry, targets, and marks the owner unavailable', () => {
    const resources = makeResources();
    const vao = resources.vao;
    const quadBuffer = resources.quadBuffer;
    const gl = {
      deleteProgram: vi.fn(),
      deleteVertexArray: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteFramebuffer: vi.fn(),
      deleteTexture: vi.fn(),
    } as unknown as WebGL2RenderingContext;

    disposeFlowGradientResources(gl, resources);

    expect(gl.deleteProgram).toHaveBeenCalledTimes(3);
    expect(gl.deleteVertexArray).toHaveBeenCalledWith(vao);
    expect(gl.deleteBuffer).toHaveBeenCalledWith(quadBuffer);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(3);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(3);
    expect(resources.available).toBe(false);
    expect(resources.hasTrail).toBe(false);
    expect(resources.splatProgram).toBeNull();
    expect(resources.vao).toBeNull();
  });
});
