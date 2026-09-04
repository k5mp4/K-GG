import { describe, expect, it } from 'vitest';
import { installWebGLResourceLedger } from './webglResourceLedger';

function createFakeGl(): WebGL2RenderingContext {
  let sequence = 0;
  const create = () => ({ id: ++sequence });
  const fake = {
    createTexture: create,
    deleteTexture: (_resource: unknown) => undefined,
    createBuffer: create,
    deleteBuffer: (_resource: unknown) => undefined,
    createFramebuffer: create,
    deleteFramebuffer: (_resource: unknown) => undefined,
    createProgram: create,
    deleteProgram: (_resource: unknown) => undefined,
    createShader: create,
    deleteShader: (_resource: unknown) => undefined,
    createRenderbuffer: create,
    deleteRenderbuffer: (_resource: unknown) => undefined,
    createVertexArray: create,
    deleteVertexArray: (_resource: unknown) => undefined,
    createQuery: create,
    deleteQuery: (_resource: unknown) => undefined,
  } as unknown as WebGL2RenderingContext;
  return fake;
}

describe('WebGL resource ledger', () => {
  it('tracks create/delete pairs by object identity and reaches zero on dispose', () => {
    const gl = createFakeGl();
    const ledger = installWebGLResourceLedger(gl);
    const texture = gl.createTexture();
    const buffer = gl.createBuffer();
    const framebuffer = gl.createFramebuffer();

    expect(ledger.snapshot()).toMatchObject({
      activeTotal: 3,
      active: { textures: 1, buffers: 1, framebuffers: 1 },
      created: { textures: 1, buffers: 1, framebuffers: 1 },
      deleted: { textures: 0, buffers: 0, framebuffers: 0 },
      peakActiveTotal: 3,
      disposed: false,
    });

    gl.deleteTexture(texture);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    expect(ledger.snapshot()).toMatchObject({
      activeTotal: 1,
      deleted: { textures: 1, buffers: 1 },
    });

    gl.deleteFramebuffer(framebuffer);
    gl.deleteFramebuffer(framebuffer);
    ledger.markContextLost();
    expect(ledger.snapshot().contextLost).toBe(true);
    ledger.markContextRestored();
    expect(ledger.snapshot().contextLost).toBe(false);
    ledger.dispose();
    expect(ledger.snapshot()).toMatchObject({ activeTotal: 0, disposed: true });
    ledger.restore();
  });

  it('restores the original WebGL methods without continuing to track resources', () => {
    const gl = createFakeGl();
    const originalCreateTexture = gl.createTexture;
    const ledger = installWebGLResourceLedger(gl);
    expect(gl.createTexture).not.toBe(originalCreateTexture);
    ledger.restore();
    expect(gl.createTexture).toBe(originalCreateTexture);
  });
});
