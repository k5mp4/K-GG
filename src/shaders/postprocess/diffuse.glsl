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
  if (!u_diffuseEnabled || u_diffuseMode == 2) return sampleUv;
  vec2 sampleGlobalCoord = sampleUv * u_tileResolution + u_tileOffset;
  sampleGlobalCoord += diffusePanelDisplacement(globalCoord) * u_diffuseScatter;
  return clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
}

vec2 diffuseSampleUvMirrorRepeat(vec2 sampleUv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode == 2) return sampleUv;
  vec2 sampleGlobalCoord = sampleUv * u_tileResolution + u_tileOffset;
  sampleGlobalCoord += diffusePanelDisplacement(globalCoord) * u_diffuseScatter;
  return mirrorRepeatUv((sampleGlobalCoord - u_tileOffset) / u_tileResolution);
}

vec2 diffuseGlobalUv(vec2 uv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode == 2) return uv;
  vec2 sampleGlobalCoord = uv * u_fullResolution
    + diffusePanelDisplacement(globalCoord) * u_diffuseScatter;
  return clamp(sampleGlobalCoord / u_fullResolution, 0.0, 1.0);
}

vec4 applyDiffuseDither(vec4 color, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode != 2) return color;
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
  float amount = clamp(u_diffuseScatter / 100.0, 0.0, 1.0);
  return vec4(mix(color.rgb, paletteColor, amount), color.a);
}
#endif
