import { describe, expect, it } from 'vitest';
import gradientShader from '../shaders/gradient.frag.glsl?raw';
import noiseShader from '../shaders/noise.glsl?raw';
import postprocessDiffuseShader from '../shaders/postprocess/diffuse.glsl?raw';
import webglSource from './webgl.ts?raw';
import sceneRenderPlanSource from './sceneRenderPlan.ts?raw';
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
    const optical = extractFunction(postprocessShader, 'glassSpectralColor');
    expect(direction).toContain('const float directionSoftness = 0.02;');
    expect(direction).toContain('boundedGradient / (slope + directionSoftness);');
    expect(direction).not.toContain('boundedGradient / slope');
    expect(displacement).toContain('boundedGradient / (1.0 + slope);');
    expect(postprocessShader).toContain(
      'float glassFilteredRidge(float phase, float phaseFootprint)',
    );
    expect(postprocessShader).toContain(
      'float glassUvPixelFootprint(float scale, float stretch, vec2 resolution)',
    );
    expect(postprocessShader).not.toMatch(/\b(?:fwidth|dFdx|dFdy)\s*\(/);
    expect(postprocessShader).toContain('float bandLimit = smoothstep(0.65, 2.4, phaseFootprint);');
    expect(optical).toContain('stableDirection * chromaticAberration');
    expect(optical).toContain('vec2 tangent = vec2(-stableDirection.y, stableDirection.x);');
  });

  it('preserves near-unit gain for legacy Glass slopes and only saturates large gradients', () => {
    const boundedGradient = compact(extractFunction(postprocessShader, 'glassBoundedGradient'));
    expect(boundedGradient).toContain(compact(
      'return gradient / (1.0 + gradientLength * 0.085);',
    ));
    expect(boundedGradient).not.toContain(compact('return gradient * 0.085;'));

    const displacement = compact(extractFunction(postprocessShader, 'glassStableDisplacement'));
    expect(displacement).toContain(compact('return boundedGradient / (1.0 + slope);'));
  });

  it('uses quintic fade for the Glass V2 gradient-noise lattice', () => {
    const fade = compact(extractFunction(postprocessShader, 'glassV2QuinticFade'));
    const noise = compact(extractFunction(postprocessShader, 'glassV2GradientNoise'));

    expect(fade).toContain(compact(
      'return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);',
    ));
    expect(noise).toContain(compact('vec2 fade = glassV2QuinticFade(local);'));
    expect(noise).toContain(compact(
      'mix(mix(n00, n10, fade.x), mix(n01, n11, fade.x), fade.y)',
    ));
  });

  it('derives five Glass V2 wavelength samples from Cauchy dispersion with a zero-dispersion endpoint', () => {
    const refractDirection = compact(extractFunction(postprocessShader, 'glassV2RefractDirection'));
    const cauchyIor = compact(extractFunction(postprocessShader, 'glassCauchyIor'));
    const optical = compact(extractFunction(postprocessShader, 'opticalGlassV2'));

    expect(refractDirection).toContain(compact(
      'vec3 transmitted = refract(incident, normal, 1.0 / safeIor);',
    ));
    expect(refractDirection).toContain(compact(
      'if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(0.0);',
    ));
    expect(cauchyIor).toContain(compact('float deltaFC = (nD - 1.0) * amount / 8.0;'));
    expect(cauchyIor).toContain(compact('return cauchyA + cauchyB / (wavelength * wavelength);'));
    expect(optical).toContain(compact('float redIor = glassCauchyIor(0.6563, chromaticPx);'));
    expect(optical).toContain(compact('float yellowIor = glassCauchyIor(0.5893, chromaticPx);'));
    expect(optical).toContain(compact('float greenIor = glassCauchyIor(0.5461, chromaticPx);'));
    expect(optical).toContain(compact('float cyanIor = glassCauchyIor(0.4861, chromaticPx);'));
    expect(optical).toContain(compact('float blueIor = glassCauchyIor(0.4358, chromaticPx);'));
    expect(optical).toContain(compact(
      'vec2 redDirection = glassV2RefractDirection(incident, normal, redIor);',
    ));
    expect(optical).toContain(compact(
      'vec2 greenDirection = glassV2RefractDirection(incident, normal, greenIor);',
    ));
    expect(optical).toContain(compact(
      'vec2 cyanDirection = glassV2RefractDirection(incident, normal, cyanIor);',
    ));
    expect(optical).toContain(compact(
      'vec2 blueDirection = glassV2RefractDirection(incident, normal, blueIor);',
    ));
    expect(optical).toContain(compact('float chromaticTravelPx = chromaticPx;'));
  });

  it('uses fixed roughness taps and Schlick Fresnel in Glass V2 composition', () => {
    const transmission = compact(extractFunction(postprocessShader, 'glassV2Transmission'));
    const optical = compact(extractFunction(postprocessShader, 'opticalGlassV2'));

    expect(transmission).toContain(compact('if (roughness <= 0.0001) return color;'));
    expect(transmission).toContain(compact(
      'sampleGlassSource(baseUv + greenOffset + roughnessOffset).rgb',
    ));
    expect(transmission).toContain(compact(
      'sampleGlassSource(baseUv + greenOffset - roughnessOffset).rgb',
    ));
    expect(transmission).toContain(compact(
      'return mix(color, blurred, clamp(roughness / 12.0, 0.0, 1.0));',
    ));
    expect(optical).toContain(compact(
      'float f0 = pow((greenIor - 1.0) / (greenIor + 1.0), 2.0);',
    ));
    expect(optical).toContain(compact(
      'float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);',
    ));
    expect(optical).toContain(compact(
      'vec4 result = vec4(mix(original.rgb, highlighted, mixAmount), original.a);',
    ));
  });

  it('adjusts only the Glass V2 chromatic residual and preserves identity defaults', () => {
    const adjustment = compact(extractFunction(
      postprocessShader,
      'glassV2AdjustChromaticResidual',
    ));
    const transmission = compact(extractFunction(postprocessShader, 'glassV2Transmission'));
    const optical = compact(extractFunction(postprocessShader, 'opticalGlassV2'));

    expect(adjustment).toContain(compact(
      'if (abs(hueRadians) <= 0.000001 && abs(saturation - 1.0) <= 0.000001) { return spectralColor; }',
    ));
    expect(adjustment).toContain(compact(
      'vec3 residual = spectralColor - baseTransmission;',
    ));
    expect(adjustment).toContain(compact(
      'return clamp(baseTransmission + rotated, 0.0, 1.0);',
    ));
    expect(transmission).toContain(compact(
      'color = glassV2AdjustChromaticResidual(color, greenCenter, chromaticHue, chromaticSaturation);',
    ));
    expect(optical).toContain(compact('transmission *= transmissionTint;'));
    expect(optical).toContain(compact(
      'if (any(lessThan(highlightTint, vec3(0.999999))))',
    ));
  });

  it('declares Glass V2 color uniforms outside the legacy Glass specialization', () => {
    expect(postprocessShader).toContain('#if !defined(KGG_LEGACY_GLASS_ONLY)\nuniform float u_glassV2ChromaticHue;');
    expect(postprocessShader).toContain('uniform float u_glassV2ChromaticSaturation;');
    expect(postprocessShader).toContain('uniform vec3 u_glassV2TransmissionTint;');
    expect(postprocessShader).toContain('uniform vec3 u_glassV2HighlightTint;');
  });

  it('routes effect mode 9 to Glass V2 while retaining mode 5 for legacy Glass', () => {
    const main = compact(postprocessShader.slice(postprocessShader.indexOf('void main()')));
    expect(compact(webglSource)).toContain(compact('glass: 5'));
    expect(compact(webglSource)).toContain(compact('glassV2: 9'));
    expect(main).toContain(compact(
      'if (u_effectEnabled && (u_effectMode == 5 || u_effectMode == 9))',
    ));
    expect(main).toContain(compact(
      'gl_FragColor = u_effectMode == 9 ? opticalGlassV2(globalUv, globalCoord) : organicGlass(globalUv, globalCoord);',
    ));
  });

  it('centralizes finite Glass inputs and separates field, optical, and composition stages', () => {
    for (const name of ['glassResolution', 'glassTileSize', 'glassFiniteUv', 'glassSafeDirection', 'glassSafeNormal']) {
      expect(postprocessShader).toContain(`${name}(`);
    }
    expect(postprocessShader).toContain('vec2 glassSurfaceGradient(');
    expect(postprocessShader).toContain('vec2 glassBoundedGradient(');
    expect(postprocessShader).toContain('vec3 glassSpectralColor(');
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

  it('keeps the expanded chromatic aberration ceiling in the Glass shader', () => {
    expect(postprocessShader).toContain('u_glassChromaticAberration, 4.0, 0.0, 80.0');
    expect(postprocessShader).toContain('chromaticAberration / 40.0');
    expect(postprocessShader).toContain('float amount = clamp(chromaticAberration / 40.0, 0.0, 2.0);');
  });

  it('restores Glass V2 as an independent optical program and stack mode', () => {
    const glassV2 = getProgramSource('glassV2').fragment;
    const main = glassV2.slice(glassV2.indexOf('void main()'));
    expect(glassV2).toContain('#define KGG_GLASS_V2_ONLY');
    expect(glassV2).toContain('float glassV2GradientNoise(');
    expect(glassV2).toContain('float glassCauchyIor(');
    expect(glassV2).toContain('vec4 opticalGlassV2(');
    expect(main).toContain('u_effectMode == 9');
    expect(main).toContain('opticalGlassV2(globalUv, globalCoord)');
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

  it('keeps the six Diffuse mode mapping and adaptive pattern inputs available in both render paths', () => {
    expect(compact(webglSource)).toContain('block:0,smooth:1,dither:2,halftone:3,ascii:4,legacy:5');
    for (const source of [normalizedGradientShader, postprocessShader]) {
      expect(source).toContain('u_diffuseAdaptiveChannel');
      expect(source).toContain('u_diffuseGrainAdaptiveEnabled');
      expect(source).toContain('u_diffuseHalftoneShape');
      expect(source).toContain('u_diffuseBackgroundColor');
      expect(source).toContain('u_diffuseAsciiAtlas');
      expect(source).toContain('applyDiffuseHalftone');
      expect(source).toContain('applyDiffuseAscii');
    }
  });

  it('restores the legacy Generator Stipple grid without adaptive or domain-warp inputs', () => {
    const stackElse = normalizedDiffuseShader.indexOf('#else\n#if defined(KGG_PRISM_ONLY)');
    const legacyDisplacement = extractFunction(
      normalizedDiffuseShader.slice(stackElse),
      'diffuseLegacyDisplacement',
    );
    expect(compact(legacyDisplacement)).toContain(compact(
      'mediump float grain = max(u_diffuseGrain, 0.01);',
    ));
    expect(compact(legacyDisplacement)).toContain(compact(
      'mediump vec2 seedOffset = vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26);',
    ));
    expect(legacyDisplacement).toContain('mediump vec2 legacyGlobalCoord = globalCoord;');
    expect(legacyDisplacement).toContain('mediump vec2 cell = floor(legacyGlobalCoord / grain);');
    expect(legacyDisplacement).toContain('return stippleGeneratorHash(cell + seedOffset);');
    expect(legacyDisplacement).not.toContain('diffuseDomainWarp');
    expect(legacyDisplacement).not.toContain('diffuseCellSizeAtCoord');

    const generatorHash = extractFunction(
      normalizedDiffuseShader.slice(stackElse),
      'stippleGeneratorHash',
    );
    expect(generatorHash).toContain('mediump vec3 p3');
    expect(compact(generatorHash)).toContain(compact(
      'return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;',
    ));

    const stackDisplacement = extractFunction(
      normalizedDiffuseShader.slice(stackElse),
      'diffusePanelDisplacement',
    );
    expect(stackDisplacement).toContain('u_diffuseMode == 5');
    expect(stackDisplacement).toContain('return diffuseLegacyDisplacement(globalCoord);');

    for (const name of ['diffuseSampleUv', 'diffuseSampleUvMirrorRepeat', 'diffuseGlobalUv']) {
      const sample = extractFunction(normalizedDiffuseShader.slice(stackElse), name);
      expect(sample).toContain('u_diffuseMode != 5');
      expect(sample).toContain('u_diffuseMode >= 2 && u_diffuseMode != 5');
    }

    const gradientMain = normalizedGradientShader.slice(normalizedGradientShader.indexOf('void main()'));
    expect(gradientMain).toContain('u_diffuseMode <= 1 || u_diffuseMode == 5');
    expect(gradientMain).toContain('bool isLegacyStipple = u_diffuseMode == 5;');
    expect(gradientMain).toContain('? max(u_diffuseGrain, 0.01)');
    expect(gradientMain).toContain('disp = diffuseHash(cell + seedOff);');
    expect(gradientMain).toContain('!isLegacyStipple && u_diffuseAdaptiveEnabled');
    expect(compact(sceneRenderPlanSource)).toContain(compact(
      "forceTextureDiffusePass: overrides.forceTextureDiffusePass ?? state.diffuse.mode === 'legacy'",
    ));
    expect(webglSource).toContain("renderPlan.framebufferAllocationMode === 'direct'");
  });

  it('point-samples the forced texture pass for legacy Stipple at source texel centers', () => {
    const stackCore = getProgramSource('stackCore').fragment.replace(/\r\n?/g, '\n');
    expect(stackCore).toContain('vec2 diffuseTexelCenterUv(');

    const texelCenterUv = extractFunction(stackCore, 'diffuseTexelCenterUv');
    expect(texelCenterUv).toContain('u_diffuseMode != 5');
    expect(compact(texelCenterUv)).toContain(compact(
      'vec2 sourcePixel = floor(sampleUv * u_tileResolution) + 0.5;',
    ));
    expect(compact(texelCenterUv)).toContain(compact(
      'return sourcePixel / u_tileResolution;',
    ));

    const pureDiffuseStart = stackCore.indexOf('if (u_effectEnabled && u_effectMode == 6)');
    const pureDiffuseEnd = stackCore.indexOf('#if !defined(KGG_STACK_CORE_NO_NOISE)', pureDiffuseStart);
    const pureDiffusePass = stackCore.slice(pureDiffuseStart, pureDiffuseEnd);
    expect(pureDiffuseStart).toBeGreaterThanOrEqual(0);
    expect(pureDiffuseEnd).toBeGreaterThan(pureDiffuseStart);
    expect(compact(pureDiffusePass)).toContain(compact(
      'texture2D(u_sourceTex, diffuseTexelCenterUv(sourceUvFromGlobal(diffuseUv)))',
    ));
  });

  it('keeps Halftone and ASCII at full fragment resolution while reserving cell snapping for Dither', () => {
    const postprocessMain = compact(postprocessShader.slice(postprocessShader.indexOf('void main()')));
    expect(postprocessMain).toContain(compact('vec2 diffuseSampleCoord = u_diffuseMode == 2 ? ditherCellCenter(globalCoord) : globalCoord;'));
    expect(postprocessMain).not.toContain(compact('u_diffuseMode >= 2 ? ditherCellCenter(globalCoord)'));

    const gradientMain = compact(normalizedGradientShader.slice(normalizedGradientShader.lastIndexOf('void main()')));
    expect(gradientMain).toContain(compact('vec2 sampleCoord = usePatternDither ? ditherCoord : globalCoord;'));
    expect(gradientMain).not.toContain(compact('usePatternDither || useCellPattern ? ditherCoord'));
  });

  it('keeps Halftone and ASCII cells visible and addresses the fixed ASCII atlas grid', () => {
    for (const source of [normalizedGradientShader, normalizedDiffuseShader]) {
      expect(source).toContain('vec3 diffusePatternBackground');
      expect(source).toContain('return u_diffuseBackgroundColor;');
      expect(source).toContain('vec2 diffuseCellFraction');
      expect(source).toContain('float diffuseCellSizeAtCoord');
      expect(source).toContain('texture2D(u_diffuseAsciiAtlas, atlasUv).r');
      expect(source).not.toContain('1.0 - atlasUv.y');
    }
    expect(normalizedDiffuseShader).toContain(
      'float cellSize = diffuseCellSizeAtCoord(globalCoord, color.rgb);',
    );
    expect(normalizedDiffuseShader).toContain(
      'return vec4(applyDiffuseAscii(color.rgb, globalCoord, cellSize), 1.0);',
    );
    expect(normalizedGradientShader).toContain('sourceColor.a = 1.0;');
    expect(normalizedGradientShader).toContain('useCellPattern ? 1.0 : rampAlpha * sourceAlpha');
    expect(compact(webglSource)).toContain('diffuseAsciiRows:ASCII_ATLAS_MAX_ROWS');
    expect(compact(webglSource)).toContain('ASCII_GENERIC_FONTS.has(font)?font:`"${font}"`');
  });

  it('keeps adaptive grain on the base cell grid and the shape inside its own cell', () => {
    for (const source of [normalizedGradientShader, normalizedDiffuseShader]) {
      expect(extractFunction(source, 'diffuseCellFraction')).toContain(
        '/ max(baseSize, 0.01) + 0.5',
      );
      // The shape/glyph must stay inside the clamped cell fraction so an
      // adaptive cell or a large font never bleeds into the neighbor.
      const ascii = extractFunction(source, 'applyDiffuseAscii');
      expect(ascii).toContain('vec2 local = diffuseCellFraction(coord, cellSize) - 0.5;');
      expect(ascii).not.toContain('cellScale');
      expect(ascii).not.toContain('u_diffuseAsciiFontScale');
      const halftone = extractFunction(source, 'applyDiffuseHalftone');
      expect(halftone).not.toContain('cellScale');
    }
  });

  it('feeds the adaptive grain cell size into the Block/Smooth displacement grid', () => {
    const stackElse = normalizedDiffuseShader.indexOf('#else\n#if defined(KGG_PRISM_ONLY)');
    const stackDisplacement = extractFunction(
      normalizedDiffuseShader.slice(stackElse),
      'diffusePanelDisplacement',
    );
    expect(stackDisplacement).toContain('diffuseCellSizeAtCoord(globalCoord, vec3(0.0))');
    expect(stackDisplacement).toContain('/ max(cellSize, 0.01)');
    const gradientMain = normalizedGradientShader.slice(normalizedGradientShader.indexOf('void main()'));
    expect(compact(gradientMain)).toContain(compact(
      'float cellSize = isLegacyStipple ? max(u_diffuseGrain, 0.01) : diffuseCellSizeAtCoord(globalCoord, vec3(0.0));',
    ));
    expect(gradientMain).toContain('floor(globalCoord / max(cellSize, 0.01))');
    expect(gradientMain).not.toMatch(/floor\(globalCoord \/ max\(u_diffuseGrain, 0\.01\)\)/);
  });

  it('scales ASCII glyphs with the configured font size in both render paths', () => {
    expect(normalizedGradientShader).not.toContain('u_diffuseAsciiFontScale');
    expect(postprocessShader).not.toContain('u_diffuseAsciiFontScale');
    for (const source of [normalizedGradientShader, normalizedDiffuseShader]) {
      expect(extractFunction(source, 'applyDiffuseAscii')).toContain(
        'vec2 local = diffuseCellFraction(coord, cellSize) - 0.5;',
      );
    }
    // The atlas glyph cell grows with the font size so a large font stays
    // inside its own cell and never samples the neighboring atlas glyph.
    expect(compact(webglSource)).toContain(
      'constglyphSize=Math.max(Math.ceil(resolvedSize*1.15),ASCII_GLYPH_WIDTH)',
    );
    // The font family is quoted so a family with spaces (e.g. "Noto Sans JP")
    // is applied instead of silently falling back.
    expect(compact(webglSource)).toContain('return`bold${size}px${family}`');
    expect(compact(webglSource)).toContain('ASCII_GENERIC_FONTS.has(font)?font:`"${font}"`');
    expect(compact(webglSource)).toContain('fonts.load(fontShorthand)');
  });

  it('rotates ASCII glyphs around the cell center in both render paths', () => {
    for (const source of [normalizedGradientShader, normalizedDiffuseShader]) {
      const ascii = extractFunction(source, 'applyDiffuseAscii');
      expect(ascii).toContain('abs(u_diffuseAsciiRotation) > 0.0001');
      expect(ascii).toContain('local.x * cosR + local.y * sinR');
      expect(ascii).toContain('-local.x * sinR + local.y * cosR');
    }
    expect(normalizedGradientShader).toContain('uniform float u_diffuseAsciiRotation;');
    expect(postprocessShader).toContain('uniform float u_diffuseAsciiRotation;');
    expect(compact(webglSource)).toContain(
      'u_diffuseAsciiRotation:gl.getUniformLocation(program,\'u_diffuseAsciiRotation\')',
    );
    expect(compact(webglSource)).toContain(
      '(diffuse.asciiRotation??0)*Math.PI)/180',
    );
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

  it('uses analytic derivatives for Fast Curl and keeps its Legacy/V2 wrappers equivalent', () => {
    const legacy = extractFunction(normalizedGradientShader, 'applyFastCurlNoiseUV');
    const stack = extractFunction(postprocessShader, 'applyStackFastCurlNoiseUv');
    expect(canonicalFastCurl(stack)).toBe(canonicalFastCurl(legacy));

    const field = extractFunction(noiseShader, 'fastCurlField');
    expect(field).toContain('psrdnoise2D(');
    expect(field).toContain('fract(evolution / loopPeriod)');
    expect(field).not.toContain('u_noiseEvolution');
    expect(field).not.toContain('fbm3D(');
    expect(field).not.toContain('u_curlEps');
    expect(field).not.toContain('loopBlendWeight');
    expect(field).not.toContain('wrapped');
    expect(extractFunction(noiseShader, 'psrdnoise2D')).toContain('vec3(value, derivative)');

    const legacyCurl = extractFunction(normalizedGradientShader, 'applyCurlNoiseUV');
    expect(legacyCurl).toContain('fbm3D(');
    expect(legacyCurl).toContain('u_curlEps');
  });

  it('keeps Phasor as a complex phase-gradient field rather than scalar noise duplication', () => {
    expect(noiseShader).toContain('vec2 phasorKernelHash(');
    expect(noiseShader).toContain('void phasorComplexField(');
    expect(noiseShader).toContain('field.x * derivativeX.y - field.y * derivativeX.x');
    expect(noiseShader).toContain('vec2 tangentDirection = vec2(-normalDirection.y, normalDirection.x);');
    expect(noiseShader).toContain('u_phasorDirectionMode == 1 || u_phasorDirectionMode == 2');
    expect(noiseShader).toContain('if (noiseType == PHASOR_NOISE_TYPE)');
    expect(normalizedGradientShader).toContain('u_noiseType == PHASOR_NOISE_TYPE');
    expect(postprocessShader).toContain('u_noiseType == PHASOR_NOISE_TYPE');
  });

  it('keeps Diffuse independent from upstream Noise UVs and covers a following Slit extension', () => {
    const main = postprocessShader.slice(postprocessShader.indexOf('void main()'));
    expect(main).toContain('vec2 diffuseUv = diffuseGlobalUv(diffuseSampleCoord / u_fullResolution, globalCoord);');
    expect(main).toContain('u_stackSlitDiffuseAfter');
    expect(main).toContain('diffuseGlobalUv(slitUv, globalCoord)');
  });

  it('keeps the analytic Generator order as Noise, Diffuse, then Gradient Ramp', () => {
    const generatorMain = normalizedGradientShader.slice(normalizedGradientShader.lastIndexOf('void main()'));
    const noiseIndex = generatorMain.indexOf('uv = applyNoiseUV(uv);');
    const diffuseIndex = generatorMain.indexOf('if (u_diffuseEnabled && (u_diffuseMode <= 1 || u_diffuseMode == 5))');
    const rampIndex = generatorMain.indexOf('rampColor = texture2D(u_gradientRamp, vec2(rampT, 0.5));');

    expect(noiseIndex).toBeGreaterThanOrEqual(0);
    expect(diffuseIndex).toBeGreaterThan(noiseIndex);
    expect(rampIndex).toBeGreaterThan(diffuseIndex);
  });

  it('skips analytic-consumed layers and avoids requesting a second Noise pass', () => {
    expect(webglSource).toContain('const consumedAnalyticLayers = new Set<string>(renderPlan.analyticPrefix.consumedLayers);');
    expect(webglSource).toContain('renderPlan.enabledLayers.filter(layer => !consumedAnalyticLayers.has(layer.kind))');
    expect(webglSource).toContain('const generatorNoiseEnabled = isV2Pipeline && !imageGradientProtected');
    expect(webglSource).toContain('const analyticDiffuseConsumed = renderPlan?.analyticPrefix.consumedLayers.includes(\'diffuse\') === true;');
  });

  it('uses only the preceding stack texture as Voronoi color input', () => {
    const voronoi = extractFunction(postprocessShader, 'voronoiGradient');
    expect(voronoi).toContain('vec2 tiledUv = fract(rotatedLocal + 0.5 + vec2(cellPhase, cellPhase * 0.731));');
    expect(voronoi).toContain('texture2D(u_sourceTex, tiledUv)');
    expect(voronoi).toContain('vec4 color = sourceColor;');
    expect(voronoi).not.toContain('texture2D(u_gradientRamp');
    expect(voronoi).not.toContain('cellPattern');
    expect(voronoi).not.toContain('edgePattern');
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

  it('uses Offset Speed as the only Slit animation speed', () => {
    expect(compact(webglSource)).toContain(compact('stackSlit.offsetSpeed'));
    expect(compact(webglSource)).toContain(compact('slitScan.offsetSpeed'));
    expect(compact(webglSource)).toContain(compact('getSlitAnimationPhase(stackSlitAnimationBaseTime, noiseLoopPeriod, stackSlit.offsetSpeed)'));
    expect(compact(webglSource)).toContain(compact('getSlitAnimationPhase(slitAnimBaseTime, noiseLoopPeriod, slitScan.offsetSpeed)'));
    expect(webglSource).not.toContain('phaseSpeed');
    expect(webglSource).not.toContain('phaseAnimEnabled');
  });
});
