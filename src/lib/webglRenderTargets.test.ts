import { describe, expect, it, vi } from 'vitest';
import { ensureWebGLTargetStorage } from './webglResources';
import { createDefaultEffectPipeline, getV2RenderPlan } from './effectPipeline';

describe('planned render target storage', () => {
  it('allocates Normal and Prism scratch only when their stages consume them', () => {
    const pipeline = createDefaultEffectPipeline();
    pipeline.effectStack = pipeline.effectStack.map(layer => ({ ...layer, enabled: false }));
    const options = { normalMapEnabled: true, normalMapBlur: 0, prismGlowRadius: 0 };
    expect(getV2RenderPlan(pipeline, options).framebufferTargets).toEqual([
      'gradient', 'postprocessA', 'postprocessB', 'normal',
    ]);
    expect(getV2RenderPlan({ ...pipeline, prismEnabled: true }, { ...options, normalMapEnabled: false }).framebufferTargets).toEqual([
      'gradient', 'postprocessA', 'postprocessB', 'prismScratch',
    ]);
    expect(getV2RenderPlan(pipeline, { ...options, normalMapEnabled: false }).framebufferTargets).toEqual([]);
    expect(getV2RenderPlan({ ...pipeline, prismEnabled: true }, {
      ...options, normalMapBlur: 2, prismGlowRadius: 5,
    }).framebufferTargets).toEqual([
      'gradient', 'postprocessA', 'postprocessB', 'normal', 'horizontalBlur',
      'prismScratch', 'prismBlur', 'prismGlow',
    ]);
  });

  it('reuses same-size storage across Core/Full switches without clearing contents', () => {
    const gl = { bindTexture: vi.fn(), texImage2D: vi.fn() } as unknown as WebGL2RenderingContext;
    const core = {} as WebGLTexture;
    const normal = {} as WebGLTexture;
    expect(ensureWebGLTargetStorage(gl, core, 800, 600)).toBe(true);
    expect(ensureWebGLTargetStorage(gl, core, 800, 600)).toBe(false);
    expect(ensureWebGLTargetStorage(gl, normal, 800, 600)).toBe(true);
    expect(gl.texImage2D).toHaveBeenCalledTimes(2);
    ensureWebGLTargetStorage(gl, core, 400, 300);
    ensureWebGLTargetStorage(gl, core, 800, 600);
    ensureWebGLTargetStorage(gl, normal, 800, 600);
    expect(gl.texImage2D).toHaveBeenCalledTimes(4);
    expect(ensureWebGLTargetStorage(gl, {} as WebGLTexture, 800, 600)).toBe(true);
  });
});
