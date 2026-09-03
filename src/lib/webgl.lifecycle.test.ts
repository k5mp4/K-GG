import { describe, expect, it, vi } from 'vitest';
import { disposeWebGL, type WebGLContext } from './webgl';
import type { FlowGradientResources } from './flowGradientRenderer';

function makeFlowResources(): FlowGradientResources {
  return {
    splatProgram: null,
    splatUniforms: {},
    trailProgram: null,
    trailUniforms: {},
    compositeProgram: null,
    compositeUniforms: {},
    vao: null,
    quadBuffer: null,
    densityFbo: {} as WebGLFramebuffer,
    densityTexture: {} as WebGLTexture,
    trailFboA: {} as WebGLFramebuffer,
    trailTextureA: {} as WebGLTexture,
    trailFboB: {} as WebGLFramebuffer,
    trailTextureB: {} as WebGLTexture,
    size: [0, 0],
    trailIndex: 0,
    hasTrail: false,
    available: false,
    format: 'rgba8',
    lastConfigSignature: '',
    lastPhase: 0,
    lastRegionKey: '',
    lastFrameKey: '',
    lastSessionId: '',
    lastLoopEnabled: false,
  };
}

function makeContext() {
  const canvas = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLCanvasElement;
  const geometryBuffer = {} as WebGLBuffer;
  const transitionGeometryBuffer = {} as WebGLBuffer;
  const gl = {
    canvas,
    deleteBuffer: vi.fn(),
    deleteFramebuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteTexture: vi.fn(),
    deleteVertexArray: vi.fn(),
  } as unknown as WebGL2RenderingContext;
  const context = {
    gl,
    performanceProfiler: null,
    program: {} as WebGLProgram,
    geometryBuffer,
    transitionGeometryBuffer,
    flowGradient: makeFlowResources(),
    disposed: false,
  } as unknown as WebGLContext;
  return { context, gl, geometryBuffer, transitionGeometryBuffer };
}

describe('WebGL context resource lifecycle', () => {
  it('releases both geometry buffers and is idempotent', () => {
    const { context, gl, geometryBuffer, transitionGeometryBuffer } = makeContext();

    disposeWebGL(context);

    expect(gl.deleteBuffer).toHaveBeenCalledWith(geometryBuffer);
    expect(gl.deleteBuffer).toHaveBeenCalledWith(transitionGeometryBuffer);
    const deleteBufferCount = vi.mocked(gl.deleteBuffer).mock.calls.length;

    disposeWebGL(context);

    expect(vi.mocked(gl.deleteBuffer).mock.calls.length).toBe(deleteBufferCount);
    expect(context.disposed).toBe(true);
  });
});
