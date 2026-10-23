import { describe, expect, it, vi } from 'vitest';
import { applyMaterialFieldUniforms, type WebGLContext } from './webgl';
import { DEFAULT_MESH_GRADIENT, normalizeMeshGradientConfig, type GradientConfig } from '../types/gradient';
import { DEFAULT_MATERIAL_FIELD, normalizeMaterialFieldConfig } from '../types/materialField';
import { STORE_DEFAULTS } from '../store/gradientStore';

function fakeContext() {
  const gl = {
    TEXTURE10: 0x84ca,
    TEXTURE_2D: 0x0de1,
    R32F: 0x822e,
    RED: 0x1903,
    FLOAT: 0x1406,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
  };
  const ctx = {
    gl,
    meshCoordinateTexture: {} as WebGLTexture,
    meshCoordinateTextureSignature: '',
    meshCoordinateUploadCount: 0,
  } as unknown as WebGLContext;
  const uniforms = new Proxy({}, { get: (_target, name) => String(name) }) as Record<string, WebGLUniformLocation | null>;
  return { ctx, gl, uniforms };
}

const meshGradient = (mesh = normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT)): GradientConfig => ({
  ...STORE_DEFAULTS.gradient,
  gradientType: 'mesh',
  mesh,
  fieldInput: { source: 'thickness', influence: 0.5 },
});

describe('Material Field renderer uniforms', () => {
  it('zeroes the input when inactive and never builds the Mesh lookup', () => {
    const { ctx, gl, uniforms } = fakeContext();
    applyMaterialFieldUniforms(ctx, uniforms, meshGradient(), DEFAULT_MATERIAL_FIELD, 0, false);
    expect(gl.uniform1i).toHaveBeenCalledWith('u_mfInputSource', 0);
    expect(gl.uniform1f).toHaveBeenCalledWith('u_mfInfluence', 0);
    expect(gl.texImage2D).not.toHaveBeenCalled();
    expect(ctx.meshCoordinateUploadCount).toBe(0);
  });

  it('rebuilds the Mesh lookup only when the geometry changes', () => {
    const { ctx, gl, uniforms } = fakeContext();
    const gradient = meshGradient();
    applyMaterialFieldUniforms(ctx, uniforms, gradient, DEFAULT_MATERIAL_FIELD, 0, true);
    expect(ctx.meshCoordinateUploadCount).toBe(1);
    expect(gl.uniform1i).toHaveBeenCalledWith('u_mfInputSource', 1);
    expect(gl.uniform1f).toHaveBeenCalledWith('u_mfInfluence', 0.5);

    // Ramp colors, Seed, structure, and time leave the lookup alone.
    const recolored = { ...gradient, stops: [...gradient.stops].reverse(), fieldInput: { source: 'cracks' as const, influence: 1 } };
    applyMaterialFieldUniforms(ctx, uniforms, recolored, normalizeMaterialFieldConfig({ seed: 99, cracks: 0.2 }), 0.75, true);
    expect(ctx.meshCoordinateUploadCount).toBe(1);

    const moved = normalizeMeshGradientConfig({
      ...DEFAULT_MESH_GRADIENT,
      edgeHandles: { horizontal: [[[[0.2, 0.3], [0.7, 0.1]]], [[[0.1, 0.9], [0.8, 0.9]]]], vertical: [[[[0.1, 0.2], [0.1, 0.8]], [[0.9, 0.2], [0.9, 0.8]]]] },
    });
    applyMaterialFieldUniforms(ctx, uniforms, meshGradient(moved), DEFAULT_MATERIAL_FIELD, 0, true);
    expect(ctx.meshCoordinateUploadCount).toBe(2);
  });

  it('keeps standard gradients on a 1x1 placeholder lookup', () => {
    const { ctx, gl, uniforms } = fakeContext();
    applyMaterialFieldUniforms(ctx, uniforms, { ...STORE_DEFAULTS.gradient, fieldInput: { source: 'cracks', influence: 1 } }, DEFAULT_MATERIAL_FIELD, 0.25, true);
    expect(ctx.meshCoordinateUploadCount).toBe(0);
    expect(gl.uniform2f).toHaveBeenCalledWith('u_meshCoordinateSize', 1, 1);
    expect(gl.uniform1f).toHaveBeenCalledWith('u_mfAngle', Math.PI / 2);
  });
});
