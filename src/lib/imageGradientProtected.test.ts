import { describe, expect, it } from 'vitest';
import gradientShader from '../shaders/gradient.frag.glsl?raw';
import webglSource from './webgl.ts?raw';

describe('Image Gradient protected rendering contract', () => {
  it('keeps source sampling on imageUV and carries source alpha into the final color', () => {
    expect(gradientShader).toContain('vec2 imageUV = globalCoord / u_resolution;');
    expect(gradientShader).toContain('sampleImageGradient(imageUV).a');
    expect(gradientShader).toContain('? mix(imageGradientT(imageUV), computeGradientT(uv)');
  });

  it('selects the fixed color-field generator and bypasses geometry layers in V2, except Stipple', () => {
    expect(webglSource).toContain('const imageGradientProtected = imageGradient.enabled && !!imageGradientSource;');
    expect(webglSource).toContain("diffuse.mode === 'legacy'");
    expect(webglSource).toContain("renderPlan.enabledLayers.filter(layer => layer.kind === 'diffuse')");
    expect(webglSource).toContain("const protectedDirect = imageGradientProtected");
    expect(webglSource).toContain('&& !protectedStipple');
  });

  it('disables Generator Diffuse for protected V2 Stipple before applying the stack pass once', () => {
    expect(webglSource).toContain(
      'const generatorDiffuseEnabled = isV2Pipeline && !imageGradientProtected',
    );
    expect(webglSource).toContain(
      "generatorLegacyColorFieldEnabled && diffuse.enabled && !(isV2Pipeline && imageGradientProtected && diffuse.mode === 'legacy')",
    );
    expect(webglSource).toContain(
      'setUniform1i(gl, uniforms.u_diffuseEnabled, generatorDiffuseEnabled ? 1 : 0);',
    );
    expect(webglSource).toContain(
      "protectedStipple ? renderPlan.enabledLayers.filter(layer => layer.kind === 'diffuse') : []",
    );
  });
});
