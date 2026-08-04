vec3 diffuseRgbToHsv(vec3 c) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, k.wz), vec4(c.gb, k.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(d < 0.00001 ? 0.0 : abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float diffuseAdaptiveInput(vec3 rgb) {
  vec3 hsv = diffuseRgbToHsv(clamp(rgb, 0.0, 1.0));
  if (u_diffuseAdaptiveChannel == 1) return hsv.x;
  if (u_diffuseAdaptiveChannel == 2) return hsv.y;
  return dot(clamp(rgb, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
}

float diffuseCurveValue(float inputValue, bool grainCurve) {
  vec4 curve = texture2D(u_diffuseCurve, vec2(clamp(inputValue, 0.0, 1.0), 0.5));
  return grainCurve ? curve.g : curve.r;
}

float diffuseCellSize(float inputValue) {
  float baseSize = max(u_diffuseGrain, 0.01);
  if (!u_diffuseGrainAdaptiveEnabled) return baseSize;
  float response = diffuseCurveValue(inputValue, true);
  float scale = mix(1.0, mix(0.55, 1.55, response), clamp(u_diffuseGrainAdaptiveAmount, 0.0, 1.0));
  return max(baseSize * scale, 0.01);
}

vec2 diffuseCellFraction(vec2 coord, float cellSize) {
  float baseSize = max(u_diffuseGrain, 0.01);
  vec2 baseCellCenter = (floor(coord / baseSize) + 0.5) * baseSize;
  return clamp((coord - baseCellCenter) / max(cellSize, 0.01) + 0.5, 0.0, 1.0);
}

float diffuseCellSizeAtCoord(vec2 coord, vec3 fallbackColor) {
  float baseSize = max(u_diffuseGrain, 0.01);
  if (!u_diffuseGrainAdaptiveEnabled) return baseSize;
  vec2 baseCellCenter = (floor(coord / baseSize) + 0.5) * baseSize;
  vec2 sourceUv = clamp(
    (baseCellCenter - u_tileOffset) / max(u_tileResolution, vec2(1.0)),
    0.0,
    1.0
  );
  vec3 representativeColor = texture2D(u_sourceTex, sourceUv).rgb;
  return diffuseCellSize(diffuseAdaptiveInput(representativeColor));
}

vec3 diffusePatternBackground(vec3 cellColor) {
  return u_diffuseBackgroundColor;
}

float diffuseShapeMask(vec2 cellFraction, float radius) {
  vec2 centered = cellFraction - 0.5;
  float edge = 0.035;
  if (u_diffuseHalftoneShape == 1) {
    float distanceToEdge = max(abs(centered.x), abs(centered.y));
    return 1.0 - smoothstep(radius, radius + edge, distanceToEdge);
  }
  return 1.0 - smoothstep(radius, radius + edge, length(centered));
}

vec3 applyDiffuseHalftone(vec3 cellColor, vec2 coord, float cellSize) {
  float luminance = dot(clamp(cellColor, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
  float radius = 0.5 * clamp(u_diffuseHalftoneSize, 0.05, 1.0) * sqrt(clamp(luminance, 0.0, 1.0));
  float mask = diffuseShapeMask(diffuseCellFraction(coord, cellSize), radius);
  vec3 patternColor = mix(diffusePatternBackground(cellColor), cellColor, mask);
  float amount = u_diffuseAdaptiveEnabled
    ? diffuseCurveValue(diffuseAdaptiveInput(cellColor), false)
    : 1.0;
  return mix(cellColor, patternColor, amount);
}

vec3 applyDiffuseAscii(vec3 cellColor, vec2 coord, float cellSize) {
  float luminance = dot(clamp(cellColor, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
  float glyphIndex = floor(clamp(luminance, 0.0, 1.0) * max(u_diffuseAsciiCount - 1.0, 0.0) + 0.5);
  float column = mod(glyphIndex, max(u_diffuseAsciiColumns, 1.0));
  float row = floor(glyphIndex / max(u_diffuseAsciiColumns, 1.0));
  vec2 local = diffuseCellFraction(coord, cellSize);
  vec2 atlasUv = vec2((column + local.x) / max(u_diffuseAsciiColumns, 1.0), (row + local.y) / max(u_diffuseAsciiRows, 1.0));
  // Canvas text is white in RGB; sampling red keeps the mask visible even on
  // browsers that premultiply the transparent atlas alpha during upload.
  float glyph = texture2D(u_diffuseAsciiAtlas, vec2(atlasUv.x, 1.0 - atlasUv.y)).r;
  vec3 patternColor = mix(diffusePatternBackground(cellColor), cellColor, glyph);
  float amount = u_diffuseAdaptiveEnabled
    ? diffuseCurveValue(diffuseAdaptiveInput(cellColor), false)
    : 1.0;
  return mix(cellColor, patternColor, amount);
}

#if defined(KGG_GLASS_ONLY)
// V2 applies Diffuse as its own stack layer, so the dedicated Glass pass
// always receives u_diffuseEnabled=false. Keep only the two symbols referenced
// by Glass and let the preprocessor discard the full Diffuse implementation.
vec2 diffusePanelDisplacement(vec2 globalCoord) {
  return vec2(0.0);
}

vec4 applyDiffuseDither(vec4 color, vec2 globalCoord) {
  return color;
}
#else
#if defined(KGG_PRISM_ONLY)
vec2 diffuseHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}
#endif

vec2 diffuseDomainWarp(vec2 globalCoord) {
  vec2 normalized = globalCoord / max(u_fullResolution, vec2(1.0));
  float seedPhase = u_diffuseSeed * 0.61803398875;
  vec2 warp = vec2(
    sin((normalized.y * 2.0 + normalized.x) * 2.0 * PI + seedPhase * 7.13),
    sin((normalized.x * 3.0 - normalized.y) * 2.0 * PI - seedPhase * 5.71)
  );
  warp += 0.5 * vec2(
    sin((normalized.x * 2.0 - normalized.y * 3.0) * 2.0 * PI + seedPhase * 11.31),
    sin((normalized.y * 3.0 + normalized.x * 2.0) * 2.0 * PI - seedPhase * 13.17)
  );
  return globalCoord + warp * max(u_diffuseGrain * 1.75, 1.0);
}

vec2 diffusePanelDisplacement(vec2 globalCoord) {
  vec2 seedOffset = vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26);
  vec2 grainCoord = diffuseDomainWarp(globalCoord) / max(u_diffuseGrain, 0.01);
  if (u_diffuseMode == 1) {
    vec2 cell = floor(grainCoord);
    vec2 fraction = fract(grainCoord);
    vec2 smoothFraction = fraction * fraction * (3.0 - 2.0 * fraction);
    vec2 h00 = diffuseHash(cell + seedOffset);
    vec2 h10 = diffuseHash(cell + vec2(1.0, 0.0) + seedOffset);
    vec2 h01 = diffuseHash(cell + vec2(0.0, 1.0) + seedOffset);
    vec2 h11 = diffuseHash(cell + vec2(1.0, 1.0) + seedOffset);
    return mix(mix(h00, h10, smoothFraction.x), mix(h01, h11, smoothFraction.x), smoothFraction.y);
  }
  return diffuseHash(floor(grainCoord) + seedOffset);
}

float patternDither8x8(vec2 cell) {
  vec2 m = mod(cell, 8.0);
  float x = m.x;
  float y = m.y;
  float rank = 0.0;
  if (y < 1.0) {
    if (x < 1.0) rank = 0.0;
    else if (x < 2.0) rank = 48.0;
    else if (x < 3.0) rank = 12.0;
    else if (x < 4.0) rank = 60.0;
    else if (x < 5.0) rank = 3.0;
    else if (x < 6.0) rank = 51.0;
    else if (x < 7.0) rank = 15.0;
    else rank = 63.0;
  } else if (y < 2.0) {
    if (x < 1.0) rank = 32.0;
    else if (x < 2.0) rank = 16.0;
    else if (x < 3.0) rank = 44.0;
    else if (x < 4.0) rank = 28.0;
    else if (x < 5.0) rank = 35.0;
    else if (x < 6.0) rank = 19.0;
    else if (x < 7.0) rank = 47.0;
    else rank = 31.0;
  } else if (y < 3.0) {
    if (x < 1.0) rank = 8.0;
    else if (x < 2.0) rank = 56.0;
    else if (x < 3.0) rank = 4.0;
    else if (x < 4.0) rank = 52.0;
    else if (x < 5.0) rank = 11.0;
    else if (x < 6.0) rank = 59.0;
    else if (x < 7.0) rank = 7.0;
    else rank = 55.0;
  } else if (y < 4.0) {
    if (x < 1.0) rank = 40.0;
    else if (x < 2.0) rank = 24.0;
    else if (x < 3.0) rank = 36.0;
    else if (x < 4.0) rank = 20.0;
    else if (x < 5.0) rank = 43.0;
    else if (x < 6.0) rank = 27.0;
    else if (x < 7.0) rank = 39.0;
    else rank = 23.0;
  } else if (y < 5.0) {
    if (x < 1.0) rank = 2.0;
    else if (x < 2.0) rank = 50.0;
    else if (x < 3.0) rank = 14.0;
    else if (x < 4.0) rank = 62.0;
    else if (x < 5.0) rank = 1.0;
    else if (x < 6.0) rank = 49.0;
    else if (x < 7.0) rank = 13.0;
    else rank = 61.0;
  } else if (y < 6.0) {
    if (x < 1.0) rank = 34.0;
    else if (x < 2.0) rank = 18.0;
    else if (x < 3.0) rank = 46.0;
    else if (x < 4.0) rank = 30.0;
    else if (x < 5.0) rank = 33.0;
    else if (x < 6.0) rank = 17.0;
    else if (x < 7.0) rank = 45.0;
    else rank = 29.0;
  } else if (y < 7.0) {
    if (x < 1.0) rank = 10.0;
    else if (x < 2.0) rank = 58.0;
    else if (x < 3.0) rank = 6.0;
    else if (x < 4.0) rank = 54.0;
    else if (x < 5.0) rank = 9.0;
    else if (x < 6.0) rank = 57.0;
    else if (x < 7.0) rank = 5.0;
    else rank = 53.0;
  } else {
    if (x < 1.0) rank = 42.0;
    else if (x < 2.0) rank = 26.0;
    else if (x < 3.0) rank = 38.0;
    else if (x < 4.0) rank = 22.0;
    else if (x < 5.0) rank = 41.0;
    else if (x < 6.0) rank = 25.0;
    else if (x < 7.0) rank = 37.0;
    else rank = 21.0;
  }
  return (rank + 0.5) / 64.0;
}

float ditherCellSize() {
  return max(floor(u_diffuseGrain + 0.5), 1.0);
}

vec2 ditherCellIndex(vec2 coord) {
  float size = ditherCellSize();
  return floor(floor(coord) / size);
}

vec2 ditherCellCenter(vec2 coord) {
  float size = ditherCellSize();
  return (ditherCellIndex(coord) + 0.5) * size;
}

vec2 diffuseSampleUv(vec2 sampleUv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode >= 2) return sampleUv;
  vec2 sampleGlobalCoord = sampleUv * u_tileResolution + u_tileOffset;
  float luminance = dot(texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
  float adaptiveFactor = u_diffuseAdaptiveEnabled
    ? diffuseCurveValue(diffuseAdaptiveInput(texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0)).rgb), false)
    : 1.0;
  sampleGlobalCoord += diffusePanelDisplacement(globalCoord) * clamp(u_diffuseScatter, 0.0, 300.0) * adaptiveFactor;
  return clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
}

vec2 diffuseSampleUvMirrorRepeat(vec2 sampleUv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode >= 2) return sampleUv;
  vec2 sampleGlobalCoord = sampleUv * u_tileResolution + u_tileOffset;
  float luminance = dot(texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
  float adaptiveFactor = u_diffuseAdaptiveEnabled
    ? diffuseCurveValue(diffuseAdaptiveInput(texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0)).rgb), false)
    : 1.0;
  sampleGlobalCoord += diffusePanelDisplacement(globalCoord) * clamp(u_diffuseScatter, 0.0, 300.0) * adaptiveFactor;
  return mirrorRepeatUv((sampleGlobalCoord - u_tileOffset) / u_tileResolution);
}

vec2 diffuseGlobalUv(vec2 uv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode >= 2) return uv;
  vec2 sampleGlobalCoord = uv * u_fullResolution
    + diffusePanelDisplacement(globalCoord) * clamp(u_diffuseScatter, 0.0, 300.0) * (
      u_diffuseAdaptiveEnabled
        ? diffuseCurveValue(diffuseAdaptiveInput(texture2D(u_sourceTex, clamp(uv, 0.0, 1.0)).rgb), false)
        : 1.0
    );
  return clamp(sampleGlobalCoord / u_fullResolution, 0.0, 1.0);
}

vec4 applyDiffuseDither(vec4 color, vec2 globalCoord) {
  if (!u_diffuseEnabled) return color;
  if (u_diffuseMode == 3) {
    float cellSize = diffuseCellSizeAtCoord(globalCoord, color.rgb);
    return vec4(applyDiffuseHalftone(color.rgb, globalCoord, cellSize), 1.0);
  }
  if (u_diffuseMode == 4) {
    float cellSize = diffuseCellSizeAtCoord(globalCoord, color.rgb);
    return vec4(applyDiffuseAscii(color.rgb, globalCoord, cellSize), 1.0);
  }
  if (u_diffuseMode != 2) return color;
  const float paletteSteps = 16.0;
  vec2 seedOff = floor(vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26));
  vec2 cell = ditherCellIndex(globalCoord) + seedOff;
  float threshold = clamp(patternDither8x8(cell) + (u_diffuseDitherThreshold - 0.5), 0.0, 1.0);
  float paletteT = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float scaledT = clamp(paletteT, 0.0, 1.0) * (paletteSteps - 1.0);
  float lower = floor(scaledT);
  float upperMix = step(threshold, fract(scaledT));
  float ditherT = (lower + upperMix) / (paletteSteps - 1.0);
  vec3 paletteColor = texture2D(u_gradientRamp, vec2(clamp(ditherT, 0.0, 1.0), 0.5)).rgb;
  float adaptiveFactor = u_diffuseAdaptiveEnabled
    ? diffuseCurveValue(diffuseAdaptiveInput(color.rgb), false)
    : 1.0;
  float amount = clamp(u_diffuseScatter / 100.0, 0.0, 1.0) * adaptiveFactor;
  return vec4(mix(color.rgb, paletteColor, amount), color.a);
}
#endif
