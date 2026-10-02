import { describe, expect, it, vi } from 'vitest';
import { FIELD_MODEL_TEXTURE_UNIT, bindFieldModelTexture, uploadThreeDUniforms } from './threeDUniforms';
import { getThreeDRenderParams } from './coneView';
import { DEFAULT_CONE_VIEW } from '../types/coneView';
import type { FieldModel } from './fieldModelRuntime';

function fakeGl() {
  return {
    TEXTURE0: 0x84c0,
    TEXTURE_2D: 0x0de1,
    RG16F: 0x822f,
    RG: 0x8227,
    FLOAT: 0x1406,
    UNPACK_FLIP_Y_WEBGL: 0x9240,
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform3f: vi.fn(),
  };
}

const uniforms = {
  u_fieldModelTex: {} as WebGLUniformLocation,
  u_fieldModelReady: {} as WebGLUniformLocation,
  u_fieldModelGrid: {} as WebGLUniformLocation,
};

const model: FieldModel = {
  name: 'knot.glb',
  version: 3,
  resolution: 4,
  tilesX: 2,
  tilesY: 2,
  data: new Float32Array(8 * 8 * 2),
  triangleCount: 10,
  edgeCount: 12,
};

describe('Geometry Field model texture', () => {
  it('uploads the atlas once per model version as RG16F', () => {
    const gl = fakeGl();
    const texture = {} as WebGLTexture;
    const version = bindFieldModelTexture(gl as unknown as WebGL2RenderingContext, uniforms, texture, model, 0);
    expect(version).toBe(3);
    expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + FIELD_MODEL_TEXTURE_UNIT);
    expect(gl.texImage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 0, gl.RG16F, 8, 8, 0, gl.RG, gl.FLOAT, model.data);
    expect(gl.uniform1f).toHaveBeenCalledWith(uniforms.u_fieldModelReady, 1);
    expect(gl.uniform3f).toHaveBeenCalledWith(uniforms.u_fieldModelGrid, 4, 2, 2);

    bindFieldModelTexture(gl as unknown as WebGL2RenderingContext, uniforms, texture, model, version);
    expect(gl.texImage2D).toHaveBeenCalledTimes(1);
  });

  it('marks the model missing without uploading', () => {
    const gl = fakeGl();
    expect(bindFieldModelTexture(gl as unknown as WebGL2RenderingContext, uniforms, {} as WebGLTexture, null, 5)).toBe(5);
    expect(gl.texImage2D).not.toHaveBeenCalled();
    expect(gl.uniform1f).toHaveBeenCalledWith(uniforms.u_fieldModelReady, 0);
  });
});

describe('3D uniform upload', () => {
  it('uploads the Crystals arrays in one call each', () => {
    const gl = {
      uniform1f: vi.fn(),
      uniform1i: vi.fn(),
      uniform2f: vi.fn(),
      uniform4fv: vi.fn(),
      uniformMatrix3fv: vi.fn(),
    };
    const crystalUniforms = {
      u_crystalCount: {} as WebGLUniformLocation,
      u_crystalCenter: {} as WebGLUniformLocation,
      u_crystalRotation: {} as WebGLUniformLocation,
      u_crystalShape: {} as WebGLUniformLocation,
      u_crystalDispersionBlur: {} as WebGLUniformLocation,
    };
    const params = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, shape: 'crystal' }, 0.2, 16 / 9);
    uploadThreeDUniforms(gl as unknown as WebGL2RenderingContext, crystalUniforms, params);
    expect(gl.uniform1i).toHaveBeenCalledWith(crystalUniforms.u_crystalCount, params.crystal.count);
    expect(gl.uniform4fv).toHaveBeenCalledWith(crystalUniforms.u_crystalCenter, params.crystal.centers);
    expect(gl.uniform4fv).toHaveBeenCalledWith(crystalUniforms.u_crystalShape, params.crystal.shapes);
    expect(gl.uniformMatrix3fv).toHaveBeenCalledWith(crystalUniforms.u_crystalRotation, false, params.crystal.rotations);
    expect(gl.uniform1f).toHaveBeenCalledWith(crystalUniforms.u_crystalDispersionBlur, params.crystal.dispersionBlur);
  });
});
