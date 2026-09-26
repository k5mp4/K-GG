import { describe, expect, it } from 'vitest';
import { getInitialProgramSource, getProgramSource } from './webglShaderSources';
import { GRADIENT_TYPE_MAP, NOISE_TYPE_MAP } from './webgl';

// Whether each program compiles and links is checked in a real WebGL2 context
// by tests/e2e/shaders.spec.ts. These tests cover what a compiler cannot:
// which code each specialized program leaves out (compile time on slow
// drivers) and the integer contracts shared between TypeScript and GLSL.

describe('webglShaderSources compile boundaries', () => {
  it('keeps the bootstrap program free of the heavy noise implementations', () => {
    const initial = getInitialProgramSource().fragment;
    expect(initial).toContain('#define KGG_BOOTSTRAP');
    expect(initial).not.toContain('\r');
    expect(initial).not.toContain('float simplex3D(');
    expect(initial).not.toContain('vec2 fastCurlField(');

    const generator = getProgramSource('generator').fragment;
    expect(generator).not.toContain('#define KGG_BOOTSTRAP');
    expect(generator).toContain('float simplex3D(');
  });

  it('specializes the Glass, Prism, and stack programs with exclusive defines', () => {
    const glass = getProgramSource('glass').fragment;
    const glassV2 = getProgramSource('glassV2').fragment;
    const prism = getProgramSource('prism').fragment;
    const core = getProgramSource('stackCore').fragment;
    const general = getProgramSource('postprocess').fragment;

    expect(glass).toContain('#define KGG_LEGACY_GLASS_ONLY');
    expect(glass).not.toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).not.toContain('#define KGG_LEGACY_GLASS_ONLY');
    for (const specialized of [glass, glassV2]) {
      expect(specialized).toContain('#define KGG_GLASS_ONLY');
      expect(specialized).not.toContain('#define KGG_PRISM_ONLY');
    }
    expect(prism).toContain('#define KGG_PRISM_ONLY');
    expect(prism).not.toContain('#define KGG_GLASS_ONLY');
    expect(core).toContain('#define KGG_LIGHTWEIGHT');
    expect(core).toContain('#define KGG_STACK_CORE_NO_NOISE');
    expect(core).not.toContain('vec2 noiseDisplaceRaw(');
    expect(general).not.toContain('#define KGG_GLASS_ONLY');
  });

  it('keeps the dedicated Glass programs below the general postprocess compile', () => {
    for (const key of ['glass', 'glassV2'] as const) {
      const specialized = getProgramSource(key).fragment;
      for (const excluded of [
        'vec2 diffuseDomainWarp(',
        'vec4 prismRays(',
        'vec2 stackSlitUv(',
        'float angleDistance(',
        'vec2 glassNoiseDomain(',
        'float glassDomainWarpScalar(',
        'causticsDistortion(',
        'phasorDistortion(',
      ]) {
        expect(specialized, `${key} should not compile ${excluded}`).not.toContain(excluded);
      }
    }
    expect(getProgramSource('glassV2').fragment.length)
      .toBeLessThan(getProgramSource('postprocess').fragment.length);
  });

  it('fuses Noise and Diffuse displacement without the ramp or duplicated inputs', () => {
    const fused = getProgramSource('noiseDiffuseStack').fragment;
    expect(fused).toContain('#define KGG_STACK_NOISE_ONLY');
    expect(fused).toContain('#define KGG_DIFFUSE_DISPLACEMENT_ONLY');
    expect(fused).not.toContain('uniform sampler2D u_gradientRamp;');
  });
});

describe('TypeScript and GLSL integer contracts', () => {
  it('keeps gradient type values stable for the generator shader', () => {
    expect(GRADIENT_TYPE_MAP).toEqual({ linear: 0, radial: 1, fourcolor: 2, diamond: 3, angle: 4, bezier: 5, mesh: 6 });
    expect(getInitialProgramSource().fragment).toContain('if (u_gradientType == 6) return sampleMeshGradient(sampleUV);');
  });

  it('matches the Noise type constants declared in GLSL', () => {
    expect(NOISE_TYPE_MAP).toMatchObject({ simplex: 0, fast_curl: 8, caustics: 9, phasor: 10, perlin: 11 });
    for (const key of ['generator', 'noiseStack'] as const) {
      const source = getProgramSource(key).fragment;
      expect(source).toContain(`const int CAUSTICS_NOISE_TYPE = ${NOISE_TYPE_MAP.caustics};`);
      expect(source).toContain(`const int PHASOR_NOISE_TYPE = ${NOISE_TYPE_MAP.phasor};`);
      expect(source).toContain(`const int PERLIN_NOISE_TYPE = ${NOISE_TYPE_MAP.perlin};`);
    }
  });
});
