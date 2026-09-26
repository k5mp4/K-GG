import { describe, expect, it } from 'vitest';
import gradientShader from '../shaders/gradient.frag.glsl?raw';
import postprocessDiffuseShader from '../shaders/postprocess/diffuse.glsl?raw';
import { getPostprocessFragmentSource, getProgramSource } from './webglShaderSources';

// Normalize line endings so indexOf-based guards (e.g. '#else\n#if ...') stay
// reliable when the repository is checked out with CRLF on Windows runners.
const postprocessShader = getPostprocessFragmentSource().replace(/\r\n?/g, '\n');
const normalizedDiffuseShader = postprocessDiffuseShader.replace(/\r\n?/g, '\n');
const normalizedGradientShader = gradientShader.replace(/\r\n?/g, '\n');

function extractFunction(source: string, name: string): string {
  const signature = new RegExp(`\\b(?:float|vec2|vec3|vec4)\\s+${name}\\s*\\(`).exec(source);
  if (!signature || signature.index === undefined) throw new Error(`GLSL function not found: ${name}`);
  const openBrace = source.indexOf('{', signature.index);
  if (openBrace < 0) throw new Error(`GLSL function body not found: ${name}`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index++) {
    if (source[index] === '{') depth++;
    if (source[index] === '}') {
      depth--;
      if (depth === 0) return source.slice(signature.index, index + 1);
    }
  }
  throw new Error(`Unterminated GLSL function: ${name}`);
}

function compact(source: string): string {
  return source.replace(/\/\/.*$/gm, '').replace(/\s+/g, '');
}

function canonicalNoise(source: string): string {
  return compact(source
    .replaceAll('applyCurlNoiseUV', 'curlNoise')
    .replaceAll('applyStackCurlNoiseUv', 'curlNoise')
    .replaceAll('applyNoiseUV', 'noiseUv')
    .replaceAll('stackNoiseUv', 'noiseUv')
    .replace(/\bevo\b/g, 'evolution')
    .replace(/\bs\b/g, 'stepIndex')
    .replace(/\bphi_r\b/g, 'phiRight')
    .replace(/\bphi_l\b/g, 'phiLeft')
    .replace(/\bphi_u\b/g, 'phiUp')
    .replace(/\bphi_d\b/g, 'phiDown')
    .replace(/\bcurlVec\b/g, 'curlVector')
    .replace(/\belse\b/g, ''))
    .replace(/[{}]/g, '');
}

function canonicalFastCurl(source: string): string {
  return compact(source
    .replaceAll('applyFastCurlNoiseUV', 'fastCurlNoise')
    .replaceAll('applyStackFastCurlNoiseUv', 'fastCurlNoise')
    .replace(/\bevo\b/g, 'evolution')
    .replace(/\bs\b/g, 'stepIndex'))
    .replace(/[{}]/g, '');
}

// The Legacy generator and the V2 stack still carry separate copies of several
// GLSL functions. These tests keep those copies equivalent and keep light code
// outside heavy-only #if guards. Compile/link correctness is covered by
// tests/e2e/shaders.spec.ts, so implementation details are not asserted here.
describe('V2 effect shader parity', () => {
  it('keeps lightweight stack code outside heavy-only shader guards', () => {
    const lightFunctions = ['mirroredUv', 'kaleidoscopeUv', 'voronoiGradient', 'stackNoiseUv', 'stackSlitUv', 'diffuseGlobalUv'];
    for (const name of lightFunctions) {
      const start = postprocessShader.indexOf(extractFunction(postprocessShader, name));
      const guardStart = postprocessShader.lastIndexOf('#ifndef KGG_LIGHTWEIGHT', start);
      const guardEnd = postprocessShader.lastIndexOf('#endif', start);
      expect(guardStart <= guardEnd, name).toBe(true);
    }
    expect(postprocessShader).toContain('#if !defined(KGG_LIGHTWEIGHT)');
  });

  it('keeps Mirror and Kaleidoscope out of the Glass- and Prism-only compiles', () => {
    const mirrorGuard = postprocessShader.slice(
      postprocessShader.indexOf('#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)'),
      postprocessShader.indexOf('vec2 mirrorRepeatUv'),
    );
    expect(mirrorGuard).toContain('vec2 mirroredUv');
    expect(mirrorGuard).toContain('vec2 kaleidoscopeUv');
  });

  it('keeps the Ripple field identical on the general and dedicated Glass routes', () => {
    const compactGlassV2 = getProgramSource('glassV2').fragment.replace(/\r\n?/g, '\n');
    const fullRipple = compact(extractFunction(postprocessShader, 'glassRippleHeight'));
    const compactRipple = compact(extractFunction(compactGlassV2, 'glassV2RippleHeight'));
    expect(fullRipple.replaceAll('glassRippleHeight', 'rippleHeight'))
      .toBe(compactRipple.replaceAll('glassV2RippleHeight', 'rippleHeight'));
  });

  it('keeps Dither cell-center and Bayer threshold behavior identical to the Diffuse panel', () => {
    for (const name of ['ditherCellSize', 'ditherCellIndex', 'ditherCellCenter']) {
      expect(compact(extractFunction(postprocessShader, name)))
        .toBe(compact(extractFunction(normalizedGradientShader, name)));
    }

    const panelPattern = extractFunction(normalizedGradientShader, 'patternDither8x8')
      .replace(/\bp\b/g, 'cell');
    expect(compact(extractFunction(postprocessShader, 'patternDither8x8')))
      .toBe(compact(panelPattern));
  });

  it('keeps shared Diffuse helpers outside the Glass-only stub guard', () => {
    const glassGuard = normalizedDiffuseShader.indexOf('#if defined(KGG_GLASS_ONLY)');
    expect(glassGuard).toBeGreaterThanOrEqual(0);
    expect(normalizedDiffuseShader.indexOf('float diffuseAdaptiveInput')).toBeLessThan(glassGuard);
    expect(normalizedDiffuseShader.indexOf('vec3 applyDiffuseHalftone')).toBeLessThan(glassGuard);
    expect(normalizedDiffuseShader.indexOf('vec3 applyDiffuseAscii')).toBeLessThan(glassGuard);
  });

  it('keeps the V2 Noise transform equivalent to the Legacy generator transform', () => {
    expect(canonicalNoise(extractFunction(postprocessShader, 'applyStackCurlNoiseUv')))
      .toBe(canonicalNoise(extractFunction(normalizedGradientShader, 'applyCurlNoiseUV')));
    expect(canonicalNoise(extractFunction(postprocessShader, 'stackNoiseUv')))
      .toBe(canonicalNoise(extractFunction(normalizedGradientShader, 'applyNoiseUV')));
  });

  it('keeps the Fast Curl Legacy/V2 wrappers equivalent', () => {
    const legacy = extractFunction(normalizedGradientShader, 'applyFastCurlNoiseUV');
    const stack = extractFunction(postprocessShader, 'applyStackFastCurlNoiseUv');
    expect(canonicalFastCurl(stack)).toBe(canonicalFastCurl(legacy));
  });

  it('keeps Slit hashing and pixel-perfect snapping equivalent to Legacy', () => {
    const legacyHash = extractFunction(normalizedGradientShader, 'slitHash')
      .replaceAll('slitHash', 'canonicalSlitHash')
      .replace(/\bn\b/g, 'value');
    const stackHash = extractFunction(postprocessShader, 'stackSlitHash')
      .replaceAll('stackSlitHash', 'canonicalSlitHash');
    expect(compact(stackHash)).toBe(compact(legacyHash));

    const legacySnapUv = extractFunction(normalizedGradientShader, 'snapSlitUVToCanvasPixel')
      .replaceAll('snapSlitUVToCanvasPixel', 'canonicalSnapUv')
      .replaceAll('u_slitPixelPerfect', 'u_pixelPerfect')
      .replaceAll('u_resolution', 'u_fullResolution')
      .replaceAll('sampleUV', 'uv');
    const stackSnapUv = extractFunction(postprocessShader, 'snapStackSlitUv')
      .replaceAll('snapStackSlitUv', 'canonicalSnapUv')
      .replaceAll('u_stackSlitPixelPerfect', 'u_pixelPerfect');
    expect(compact(stackSnapUv)).toBe(compact(legacySnapUv));

    const legacySnapOffset = extractFunction(normalizedGradientShader, 'snapSlitOffsetToCanvasPixel')
      .replaceAll('snapSlitOffsetToCanvasPixel', 'canonicalSnapOffset')
      .replaceAll('u_slitPixelPerfect', 'u_pixelPerfect')
      .replaceAll('u_resolution', 'u_fullResolution')
      .replaceAll('offsetUV', 'offsetUv');
    const stackSnapOffset = extractFunction(postprocessShader, 'snapStackSlitOffset')
      .replaceAll('snapStackSlitOffset', 'canonicalSnapOffset')
      .replaceAll('u_stackSlitPixelPerfect', 'u_pixelPerfect');
    expect(compact(stackSnapOffset)).toBe(compact(legacySnapOffset));
  });
});
