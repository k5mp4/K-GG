import { describe, expect, it } from 'vitest';
import {
  getInitialProgramSource,
  getPostprocessFragmentSource,
  getProgramSource,
} from './webglShaderSources';
import { GRADIENT_TYPE_MAP, NOISE_TYPE_MAP } from './webgl';

describe('webglShaderSources', () => {
  it('adds Mesh Gradation at mapping value 6 without shifting existing types', () => {
    expect(GRADIENT_TYPE_MAP).toEqual({ linear: 0, radial: 1, fourcolor: 2, diamond: 3, angle: 4, bezier: 5, mesh: 6 });
    const source = getInitialProgramSource().fragment;
    for (const uniform of [
      'u_meshCorner0', 'u_meshCorner1', 'u_meshCorner2', 'u_meshCorner3',
      'u_meshBottomCp0', 'u_meshBottomCp1', 'u_meshRightCp0', 'u_meshRightCp1',
      'u_meshTopCp0', 'u_meshTopCp1', 'u_meshLeftCp0', 'u_meshLeftCp1',
      'u_meshColorPositions',
    ]) expect(source).toContain(`uniform ${uniform.startsWith('u_meshColor') ? 'vec4' : 'vec2'} ${uniform};`);
    expect(source).toContain('uniform sampler2D u_meshGradient;');
    expect(source).toContain('return texture2D(u_meshGradient, clamp(sampleUV, 0.0, 1.0));');
    expect(source).not.toContain('inverseMapMeshUV(');
    expect(source).toContain('if (u_gradientType == 6) return sampleMeshGradient(sampleUV);');
  });
  it('keeps the initial program on the base generator source', () => {
    const source = getInitialProgramSource();
    expect(source.vertex).toContain('a_position');
    expect(source.fragment).toContain('u_gradientType');
    expect(source.fragment).toContain('#define KGG_BOOTSTRAP');
    expect(source.fragment).not.toContain('\r');
    expect(source.fragment).not.toContain('float simplex3D(');
    expect(source.fragment).not.toContain('vec2 fastCurlField(');
    expect(source.fragment).toContain('#if !defined(KGG_BOOTSTRAP)\n    if (u_iridEnabled');

    const generator = getProgramSource('generator');
    expect(generator.fragment).toContain('float simplex3D(');
    expect(generator.fragment).toContain('vec2 fastCurlField(');
    expect(generator.fragment).toContain('vec2 causticsDistortion(');

    const noiseStack = getProgramSource('noiseStack').fragment;
    expect(noiseStack).toContain('#define KGG_STACK_NOISE_ONLY');
    expect(noiseStack.match(/uniform float u_time;/g)).toHaveLength(1);
    expect(noiseStack).toContain('uniform sampler2D u_sourceTex;');
    expect(noiseStack).toContain('uniform vec2 u_tileResolution;');
    for (const declaration of [
      'uniform int u_curlSteps;',
      'uniform float u_curlSpeed;',
      'uniform float u_curlEps;',
      'uniform float u_curlSeed;',
    ]) {
      expect(noiseStack.match(new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(1);
      expect(noiseStack.indexOf(declaration)).toBeLessThan(noiseStack.indexOf('vec2 fastCurlField('));
    }
    expect(noiseStack).toContain('fract(evolution / loopPeriod)');
    expect(noiseStack).not.toContain('fract((u_time + u_noiseEvolution) / loopPeriod)');

    const general = getProgramSource('postprocess').fragment;
    for (const declaration of [
      'uniform int u_curlSteps;',
      'uniform float u_curlSpeed;',
      'uniform float u_curlEps;',
      'uniform float u_curlSeed;',
    ]) {
      expect(general.match(new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(1);
    }
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
    expect(noiseStack).toContain('vec2 causticsDistortion(');
    expect(noiseStack).toContain('void main()');
  });

  it('declares Caustics and Phasor uniforms once in generator and Noise Stack sources', () => {
    const declarations = [
      'uniform float u_noiseSpeed;',
      'uniform float u_causticsDepth;',
      'uniform float u_causticsRefraction;',
      'uniform float u_causticsSharpness;',
      'uniform int u_causticsComplexity;',
      'uniform float u_causticsWaveSpread;',
      'uniform float u_causticsBoundaryWidth;',
      'uniform float u_phasorFrequency;',
      'uniform float u_phasorBandwidth;',
      'uniform float u_phasorDirection;',
      'uniform float u_phasorDirectionSpread;',
      'uniform float u_phasorSharpness;',
      'uniform float u_phasorWarpStrength;',
      'uniform float u_phasorTangentMix;',
      'uniform float u_phasorKernelDensity;',
      'uniform int u_phasorDirectionMode;',
    ];
    const generator = getProgramSource('generator').fragment;
    const noiseStack = getProgramSource('noiseStack').fragment;
    const general = getProgramSource('postprocess').fragment;
    for (const declaration of declarations) {
      const escaped = declaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(generator.match(new RegExp(escaped, 'g'))).toHaveLength(1);
      expect(noiseStack.match(new RegExp(escaped, 'g'))).toHaveLength(1);
      expect(general.match(new RegExp(escaped, 'g'))).toHaveLength(1);
    }
    expect(getProgramSource('glassV2').fragment).not.toContain('causticsDistortion(');
  });

  it('keeps the Caustics TypeScript and GLSL integer mapping at the end', () => {
    expect(NOISE_TYPE_MAP).toMatchObject({ simplex: 0, fast_curl: 8, caustics: 9 });
    const generator = getProgramSource('generator').fragment;
    expect(generator).toContain('const int CAUSTICS_NOISE_TYPE = 9;');
    expect(generator).toContain('noiseType == CAUSTICS_NOISE_TYPE');
    expect(generator).toContain('return causticsDistortion(uv, evolution, scale, octaves);');
    expect(generator).toContain('if (complexity < 2) complexity = 2;');
    expect(generator).not.toContain('int complexity = clamp(');
    expect(generator).toContain('evolution - wrapPeriod');
    expect(generator).toContain('boundaryInfluence');
  });

  it('keeps Phasor Lines at the end of the Noise type mapping and includes its field contract', () => {
    expect(NOISE_TYPE_MAP).toMatchObject({ caustics: 9, phasor: 10 });
    const generator = getProgramSource('generator').fragment;
    const noiseStack = getProgramSource('noiseStack').fragment;
    for (const source of [generator, noiseStack]) {
      expect(source).toContain('const int PHASOR_NOISE_TYPE = 10;');
      expect(source).toContain('vec2 phasorKernelHash(');
      expect(source).toContain('void phasorComplexField(');
      expect(source).toContain('vec2 phasorPhaseGradient(');
      expect(source).toContain('float phasorLineMask(');
      expect(source).toContain('vec2 phasorDistortion(');
      const phaseHelpers = source.slice(source.indexOf('float phasorPhase('), source.indexOf('float phasorLineMask('));
      expect(phaseHelpers).not.toContain('u_noiseOctaves');
      expect(source).toContain('for (int y = -1; y <= 1; y++)');
      expect(source).toMatch(
        /float pixelFootprint = 1\.0 \/ max\(min\(u_(?:resolution|fullResolution)\.x, u_(?:resolution|fullResolution)\.y\), 1\.0\);/,
      );
    }
    expect(generator).toContain('noiseType == PHASOR_NOISE_TYPE');
    expect(noiseStack).toContain('u_phasorWarpStrength == 0.0');
    expect(getProgramSource('glassV2').fragment).not.toContain('phasorDistortion(');
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
