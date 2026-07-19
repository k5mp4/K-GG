import { describe, expect, it } from 'vitest';
import {
  getInitialProgramSource,
  getPostprocessFragmentSource,
  getProgramSource,
} from './webglShaderSources';

describe('webglShaderSources', () => {
  it('keeps the initial program on the base generator source', () => {
    const source = getInitialProgramSource();
    expect(source.vertex).toContain('a_position');
    expect(source.fragment).toContain('u_gradientType');
    expect(source.fragment).toContain('#define KGG_BOOTSTRAP');
    expect(source.fragment).not.toContain('float simplex3D(');
    expect(source.fragment).not.toContain('vec2 fastCurlField(');

    const generator = getProgramSource('generator');
    expect(generator.fragment).toContain('float simplex3D(');
    expect(generator.fragment).toContain('vec2 fastCurlField(');
  });

  it('keeps Glass and Prism compile boundaries independent', () => {
    const glass = getProgramSource('glass').fragment;
    const glassV2 = getProgramSource('glassV2').fragment;
    const prism = getProgramSource('prism').fragment;
    const core = getProgramSource('stackCore').fragment;
    const noiseStack = getProgramSource('noiseStack').fragment;

    expect(glass).toContain('#define KGG_GLASS_ONLY');
    expect(glass).toContain('#define KGG_LEGACY_GLASS_ONLY');
    expect(glass).not.toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).toContain('#define KGG_GLASS_ONLY');
    expect(glassV2).toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).not.toContain('#define KGG_LEGACY_GLASS_ONLY');
    expect(glass).toContain('vec4 organicGlass(');
    expect(glass).not.toContain('#define KGG_PRISM_ONLY');
    expect(glassV2).toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).toContain('vec2 glassV2Gradient(');
    expect(glassV2).toContain('vec4 opticalGlassV2(');
    expect(glassV2).toContain('refract(');
    expect(glassV2).toContain('glassV2QuinticFade');
    expect(prism).toContain('#define KGG_PRISM_ONLY');
    expect(prism).not.toContain('#define KGG_GLASS_ONLY');
    expect(core).toContain('#define KGG_LIGHTWEIGHT');
    expect(core).toContain('#define KGG_STACK_CORE_NO_NOISE');
    expect(core).not.toContain('vec2 noiseDisplaceRaw(');
    expect(noiseStack).toContain('#define KGG_STACK_NOISE_ONLY');
    expect(noiseStack).toContain('vec2 noiseDisplaceRaw(');
    expect(noiseStack).toContain('void main()');
  });

  it('guards mode-specific Glass code while keeping both modes in the general fallback', () => {
    const legacy = getProgramSource('glass').fragment;
    const v2 = getProgramSource('glassV2').fragment;
    const general = getProgramSource('postprocess').fragment;

    expect(general).not.toContain('#define KGG_GLASS_ONLY');
    expect(legacy).toContain('#if !defined(KGG_GLASS_V2_ONLY)');
    expect(v2).toContain('#if !defined(KGG_LEGACY_GLASS_ONLY)');
    for (const source of [legacy, v2, general]) {
      expect(source).toContain('vec4 organicGlass(');
      expect(source).toContain('vec4 opticalGlassV2(');
      expect(source).toContain('u_effectMode == 9');
      expect(source).not.toMatch(/\b(?:fwidth|dFdx|dFdy)\s*\(/);
    }
  });

  it('removes the Diffuse implementation from the dedicated Glass compiles', () => {
    for (const key of ['glass', 'glassV2'] as const) {
      const specialized = getProgramSource(key).fragment;

      expect(specialized).toContain('#if defined(KGG_GLASS_ONLY)');
      expect(specialized).toContain('vec2 diffusePanelDisplacement(vec2 globalCoord) {\n  return vec2(0.0);');
      expect(specialized).toContain('vec4 applyDiffuseDither(vec4 color, vec2 globalCoord) {\n  return color;');
      expect(specialized).toContain('#else\n#if defined(KGG_PRISM_ONLY)\nvec2 diffuseHash');
      expect(specialized).not.toContain('vec2 diffuseDomainWarp(');
    }
  });

  it('omits unrelated Prism and stack source from the dedicated Glass compile', () => {
    const specialized = getProgramSource('glassV2').fragment;

    expect(specialized).toContain('vec4 organicGlass(');
    expect(specialized).toContain('vec4 opticalGlassV2(');
    expect(specialized).not.toContain('vec4 prismRays(');
    expect(specialized).not.toContain('vec2 stackSlitUv(');
    expect(specialized).not.toContain('float angleDistance(');
  });

  it('assembles postprocess sections in dependency order', () => {
    const source = getPostprocessFragmentSource();
    const functions = [
      'vec2 mirroredUv',
      'float angleDistance',
      'vec4 voronoiGradient',
      'vec2 diffuseHash',
      'float glassFloat',
      'vec4 sampleGlassSource',
      'void main()',
    ];

    const positions = functions.map((signature) => source.indexOf(signature));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });
});
