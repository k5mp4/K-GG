import { describe, expect, it, vi } from 'vitest';
import { updateGradientRampTexture, type WebGLContext } from './webgl';
import { STORE_DEFAULTS } from '../store/documentModel';
import { buildRampTextureData } from './gradientRampUtils';

function context() {
  return {
    gl: {
      activeTexture: vi.fn(), bindTexture: vi.fn(), texSubImage2D: vi.fn(),
      isContextLost: () => false,
    },
    gradientRampTexture: {},
    disposed: false,
  } as unknown as WebGLContext;
}

describe('context-owned gradient ramp uploads', () => {
  it('reuses identical evaluated ramp values across frames and UI updates', () => {
    const ctx = context();
    const gradient = structuredClone(STORE_DEFAULTS.gradient);
    const first = updateGradientRampTexture(ctx, gradient);
    expect(first).toEqual(buildRampTextureData(gradient.stops, gradient.rampInterpolation,
      gradient.rampMirror ?? false, gradient.opacityStops, gradient.rampColorMode,
      gradient.rampVariable ?? 0, gradient.rampRepeat ?? 1));
    expect(updateGradientRampTexture(ctx, { ...structuredClone(gradient), angle: 123 })).toBe(first);
    expect(ctx.gl.texSubImage2D).toHaveBeenCalledTimes(1);
    gradient.stops[0].color = '#123456';
    expect(updateGradientRampTexture(ctx, gradient)).not.toEqual(first);
    expect(ctx.gl.texSubImage2D).toHaveBeenCalledTimes(2);
  });

  it('uploads independently in a restored context and tracks all ramp inputs', () => {
    const ctx = context();
    let gradient = structuredClone(STORE_DEFAULTS.gradient);
    updateGradientRampTexture(ctx, gradient);
    for (const change of [{ rampRepeat: 3 }, { rampMirror: true }, { rampVariable: 0.8 }]) {
      gradient = { ...gradient, ...change };
      updateGradientRampTexture(ctx, gradient);
    }
    expect(ctx.gl.texSubImage2D).toHaveBeenCalledTimes(4);
    const restored = context();
    updateGradientRampTexture(restored, gradient);
    expect(restored.gl.texSubImage2D).toHaveBeenCalledTimes(1);
  });

  it('does not publish failed uploads as cached', () => {
    const ctx = context();
    vi.mocked(ctx.gl.texSubImage2D).mockImplementationOnce(() => { throw new Error('upload'); });
    expect(() => updateGradientRampTexture(ctx, STORE_DEFAULTS.gradient)).toThrow('upload');
    updateGradientRampTexture(ctx, STORE_DEFAULTS.gradient);
    expect(ctx.gl.texSubImage2D).toHaveBeenCalledTimes(2);
  });

  it('rejects stale owners even when their ramp values are cached', () => {
    const ctx = context();
    updateGradientRampTexture(ctx, STORE_DEFAULTS.gradient);
    ctx.disposed = true;
    expect(() => updateGradientRampTexture(ctx, STORE_DEFAULTS.gradient)).toThrow('disposed');
    expect(ctx.gl.texSubImage2D).toHaveBeenCalledTimes(1);
  });
});
