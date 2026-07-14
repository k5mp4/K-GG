import { describe, expect, it } from 'vitest';
import gradientShader from '../shaders/gradient.frag.glsl?raw';
import postprocessShader from '../shaders/postprocess.frag.glsl?raw';

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

  it('keeps Glass-only compilation finite and excludes unrelated core functions', () => {
    expect(postprocessShader).toContain('float finiteFloat(float value, float fallback)');
    expect(postprocessShader).toContain('float glassFloat(float value, float fallback, float minimum, float maximum)');

    const mirrorGuard = postprocessShader.slice(
      postprocessShader.indexOf('#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)'),
      postprocessShader.indexOf('vec2 mirrorRepeatUv'),
    );
    expect(mirrorGuard).toContain('vec2 mirroredUv');
    expect(mirrorGuard).toContain('vec2 kaleidoscopeUv');
  });

  it('keeps Glass sampling direction continuous near a flat gradient', () => {
    const direction = extractFunction(postprocessShader, 'glassStableDirection');
    const displacement = extractFunction(postprocessShader, 'glassStableDisplacement');
    const optical = extractFunction(postprocessShader, 'glassOpticalColor');
    expect(direction).toContain('const float directionSoftness = 0.02;');
    expect(direction).toContain('boundedGradient / (slope + directionSoftness);');
    expect(direction).not.toContain('boundedGradient / slope');
    expect(displacement).toContain('boundedGradient / (1.0 + slope);');
    expect(postprocessShader).toContain('float glassFilteredRidge(float phase)');
    expect(postprocessShader).toContain('fwidth(phase)');
    expect(postprocessShader).toContain('float bandLimit = smoothstep(0.65, 2.4, phaseFootprint);');
    expect(optical).toContain('stableDirection * chromaticAberration');
    expect(optical).toContain('vec2 tangent = vec2(-stableDirection.y, stableDirection.x);');
  });

  it('centralizes finite Glass inputs and separates field, optical, and composition stages', () => {
    for (const name of ['glassResolution', 'glassTileSize', 'glassFiniteUv', 'glassSafeDirection', 'glassSafeNormal']) {
      expect(postprocessShader).toContain(`${name}(`);
    }
    expect(postprocessShader).toContain('vec2 glassSurfaceGradient(');
    expect(postprocessShader).toContain('vec2 glassBoundedGradient(');
    expect(postprocessShader).toContain('vec3 glassOpticalColor(');
    expect(extractFunction(postprocessShader, 'sampleGlassSource')).toContain('glassTileSize()');
  });

  it('keeps the Glass field and gradient finite before optical composition', () => {
    expect(extractFunction(postprocessShader, 'glassSafeDirection')).toContain('finiteFloat(value.x, 0.0)');
    expect(extractFunction(postprocessShader, 'glassBoundedGradient')).toContain('finiteFloat(gradient.x, 0.0)');
    expect(extractFunction(postprocessShader, 'glassSurfaceHeight')).toContain('finiteFloat(mix(');
    expect(extractFunction(postprocessShader, 'glassHeight')).toContain('finiteFloat(height /');
    expect(extractFunction(postprocessShader, 'glassStableDisplacement')).toContain('finiteFloat(boundedGradient.x, 0.0)');
  });

  it('skips the Glass field at the identity endpoint', () => {
    const main = postprocessShader.slice(postprocessShader.indexOf('void main()'));
    expect(main).toContain('glassFloat(u_glassMix, 1.0, 0.0, 1.0) <= 0.0001');
    expect(main).toContain('glassFloat(u_glassRefraction, 32.0, 0.0, 120.0) <= 0.0001');
  });

  it('keeps Dither cell-center and Bayer threshold behavior identical to the Diffuse panel', () => {
    for (const name of ['ditherCellSize', 'ditherCellIndex', 'ditherCellCenter']) {
      expect(compact(extractFunction(postprocessShader, name)))
        .toBe(compact(extractFunction(gradientShader, name)));
    }

    const panelPattern = extractFunction(gradientShader, 'patternDither8x8')
      .replace(/\bp\b/g, 'cell');
    expect(compact(extractFunction(postprocessShader, 'patternDither8x8')))
      .toBe(compact(panelPattern));
  });

  it('keeps the V2 Noise transform equivalent to the Legacy generator transform', () => {
    expect(canonicalNoise(extractFunction(postprocessShader, 'applyStackCurlNoiseUv')))
      .toBe(canonicalNoise(extractFunction(gradientShader, 'applyCurlNoiseUV')));
    expect(canonicalNoise(extractFunction(postprocessShader, 'stackNoiseUv')))
      .toBe(canonicalNoise(extractFunction(gradientShader, 'applyNoiseUV')));
  });

  it('keeps Slit hashing and pixel-perfect snapping equivalent to Legacy', () => {
    const legacyHash = extractFunction(gradientShader, 'slitHash')
      .replaceAll('slitHash', 'canonicalSlitHash')
      .replace(/\bn\b/g, 'value');
    const stackHash = extractFunction(postprocessShader, 'stackSlitHash')
      .replaceAll('stackSlitHash', 'canonicalSlitHash');
    expect(compact(stackHash)).toBe(compact(legacyHash));

    const legacySnapUv = extractFunction(gradientShader, 'snapSlitUVToCanvasPixel')
      .replaceAll('snapSlitUVToCanvasPixel', 'canonicalSnapUv')
      .replaceAll('u_slitPixelPerfect', 'u_pixelPerfect')
      .replaceAll('u_resolution', 'u_fullResolution')
      .replaceAll('sampleUV', 'uv');
    const stackSnapUv = extractFunction(postprocessShader, 'snapStackSlitUv')
      .replaceAll('snapStackSlitUv', 'canonicalSnapUv')
      .replaceAll('u_stackSlitPixelPerfect', 'u_pixelPerfect');
    expect(compact(stackSnapUv)).toBe(compact(legacySnapUv));

    const legacySnapOffset = extractFunction(gradientShader, 'snapSlitOffsetToCanvasPixel')
      .replaceAll('snapSlitOffsetToCanvasPixel', 'canonicalSnapOffset')
      .replaceAll('u_slitPixelPerfect', 'u_pixelPerfect')
      .replaceAll('u_resolution', 'u_fullResolution')
      .replaceAll('offsetUV', 'offsetUv');
    const stackSnapOffset = extractFunction(postprocessShader, 'snapStackSlitOffset')
      .replaceAll('snapStackSlitOffset', 'canonicalSnapOffset')
      .replaceAll('u_stackSlitPixelPerfect', 'u_pixelPerfect');
    expect(compact(stackSnapOffset)).toBe(compact(legacySnapOffset));
  });

  it('retains the Legacy Slit mode, variance, angle, and individual-width inputs', () => {
    const slit = compact(extractFunction(postprocessShader, 'stackSlitUv'));
    expect(slit).toContain(compact('if (u_stackSlitMode == 3)'));
    expect(slit).toContain(compact('u_stackSlitMode == 1 || u_stackSlitMode == 2'));
    expect(slit).toContain(compact('u_stackSlitVariance * slitWidth'));
    expect(slit).toContain(compact('u_stackSlitAngle + u_stackSlitOffsetAngle + PI * 0.5'));
    expect(slit).toContain(compact('computeStackSlitIndex(warpedCoord, slitWidth)'));

    const slitIndex = compact(extractFunction(postprocessShader, 'computeStackSlitIndex'));
    expect(slitIndex).toContain(compact('stackSlitDeltaAt(index)'));
    expect(slitIndex).toContain(compact('cumulativeDelta += entry.y'));
  });
});
