import { describe, expect, it } from 'vitest';
import gradientShader from '../shaders/gradient.frag.glsl?raw';
import webglSource from './webgl.ts?raw';

describe('Image Gradient protected rendering contract', () => {
  it('keeps source sampling on imageUV and carries source alpha into the final color', () => {
    expect(gradientShader).toContain('vec2 imageUV = globalCoord / u_resolution;');
    expect(gradientShader).toContain('sampleImageGradient(imageUV).a');
    expect(gradientShader).toContain('? mix(imageGradientT(imageUV), computeGradientT(uv)');
  });

  it('selects the fixed color-field generator and removes geometry layers in V2', () => {
    expect(webglSource).toContain('const imageGradientProtected = imageGradient.enabled && !!imageGradientSource;');
    expect(webglSource).toContain('const mainLayers = imageGradientProtected ? [] : renderPlan.enabledLayers;');
    expect(webglSource).toContain("const protectedDirect = imageGradientProtected");
  });
});
