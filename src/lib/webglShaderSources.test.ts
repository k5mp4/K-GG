import { describe, expect, it } from 'vitest';
import { getInitialProgramSource, getProgramSource } from './webglShaderSources';

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

    expect(glass).toContain('#define KGG_GLASS_ONLY');
    expect(glass).toContain('#define KGG_LEGACY_GLASS_ONLY');
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
  });
});
