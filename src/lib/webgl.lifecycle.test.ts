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
  const bootstrapProgram = {} as WebGLProgram;
  const noiseVariantProgram = {} as WebGLProgram;
  const context = {
    gl,
    performanceProfiler: null,
    program: bootstrapProgram,
    bootstrapProgram,
    noiseVariantPrograms: new Map([
      ['generator:-1', { program: bootstrapProgram, uniforms: {} }],
      ['noiseStack:11', { program: noiseVariantProgram, uniforms: {} }],
    ]),
    geometryBuffer,
    transitionGeometryBuffer,
    flowGradient: makeFlowResources(),
    threeDPrograms: {},
    datamoshHistoryTextures: [{} as WebGLTexture, {} as WebGLTexture],
    datamoshHistoryFbos: [{} as WebGLFramebuffer, {} as WebGLFramebuffer],
    datamoshInputTextures: [{} as WebGLTexture, {} as WebGLTexture],
    datamoshInputFbos: [{} as WebGLFramebuffer, {} as WebGLFramebuffer],
    disposed: false,
  } as unknown as WebGLContext;
  return { context, gl, geometryBuffer, transitionGeometryBuffer, bootstrapProgram, noiseVariantProgram };
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

  it('deletes every compiled Noise variant once, including inactive ones', () => {
    const { context, gl, bootstrapProgram, noiseVariantProgram } = makeContext();

    disposeWebGL(context);

    const deleted = vi.mocked(gl.deleteProgram).mock.calls.map(([program]) => program);
    expect(deleted.filter(program => program === bootstrapProgram)).toHaveLength(1);
    expect(deleted.filter(program => program === noiseVariantProgram)).toHaveLength(1);
  });
});
