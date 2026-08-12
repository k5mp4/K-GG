// Dedicated Glass programs intentionally keep this source independent from
// the full Noise Distortion implementation. The general postprocess shader
// still owns every Noise algorithm; Glass only needs a small, deterministic
// height field and the optical samples below. This keeps ANGLE's fragment
// compiler below the driver-specific complexity cliff seen on large stacks.
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_PRISM_ONLY)
float glassFloat(float value, float fallback, float minimum, float maximum) {
  return clamp(finiteFloat(value, fallback), minimum, maximum);
}

vec2 glassResolution() {
  return max(vec2(
    finiteFloat(u_fullResolution.x, 1.0),
    finiteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
}

vec2 glassTileSize() {
  return max(vec2(
    finiteFloat(u_tileResolution.x, 1.0),
    finiteFloat(u_tileResolution.y, 1.0)
  ), vec2(1.0));
}

vec2 glassFiniteUv(vec2 uv) {
  return vec2(finiteFloat(uv.x, 0.5), finiteFloat(uv.y, 0.5));
}

vec2 glassSafeDirection(vec2 value) {
  value = vec2(finiteFloat(value.x, 0.0), finiteFloat(value.y, 0.0));
  float lengthSquared = dot(value, value);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(0.0);
  return value * inversesqrt(lengthSquared);
}

vec3 glassSafeNormal(vec2 boundedGradient) {
  vec3 candidate = vec3(-boundedGradient * 2.4, 1.0);
  float lengthSquared = dot(candidate, candidate);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec3(0.0, 0.0, 1.0);
  return candidate * inversesqrt(lengthSquared);
}

float glassCauchyIor(float wavelengthMicrometers, float chromaticAberration) {
  float wavelength = clamp(wavelengthMicrometers, 0.4, 0.7);
  float amount = clamp(chromaticAberration / 40.0, 0.0, 2.0);
  return 1.5 + (0.5876 / max(wavelength, 0.0001) - 1.0) * 0.035 * amount;
}

float glassUvPixelFootprint(float scale, float stretch, vec2 resolution) {
  float aspect = resolution.x / max(resolution.y, 1.0);
  float axisScale = max(aspect, 1.0) * max(1.0, 1.0 / max(stretch, 0.001));
  return finiteFloat(scale * axisScale / max(min(resolution.x, resolution.y), 1.0), 0.0);
}

// Keep the public helper names shared with the full Glass implementation so
// diagnostics and shader parity tests can compare both compile boundaries.
vec2 glassV2Gradient(vec2 cell, float seedOffset) {
  vec2 gradient = hash22(cell, glassFloat(u_glassSeed, 0.0, 0.0, 99.0) + seedOffset) * 2.0 - 1.0;
  float lengthSquared = dot(gradient, gradient);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(1.0, 0.0);
  return gradient * inversesqrt(lengthSquared);
}

vec2 glassV2QuinticFade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float glassV2GradientNoise(vec2 p, float seedOffset) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 fade = glassV2QuinticFade(local);
  float n00 = dot(glassV2Gradient(cell, seedOffset), local);
  float n10 = dot(glassV2Gradient(cell + vec2(1.0, 0.0), seedOffset), local - vec2(1.0, 0.0));
  float n01 = dot(glassV2Gradient(cell + vec2(0.0, 1.0), seedOffset), local - vec2(0.0, 1.0));
  float n11 = dot(glassV2Gradient(cell + vec2(1.0, 1.0), seedOffset), local - vec2(1.0, 1.0));
  return finiteFloat(mix(mix(n00, n10, fade.x), mix(n01, n11, fade.x), fade.y), 0.0);
}

float glassV2Height(vec2 uv) {
  float scale = glassFloat(u_glassScale, 3.2, 0.5, 12.0);
  float stretch = glassFloat(u_glassStretch, 4.0, 0.25, 8.0);
  float rotation = glassFloat(u_glassRotation, 0.0, -6.28318530718, 6.28318530718);
  float complexity = glassFloat(float(u_glassComplexity), 4.0, 1.0, 3.0);
  float warp = glassFloat(u_glassWarp, 0.55, 0.0, 1.0);
  float evolution = glassFloat(u_glassEvolution, 0.0, 0.0, 1.0);
  float motion = glassFloat(u_glassMotion, 0.35, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 p = glassFiniteUv(uv) - vec2(0.5);
  p.x *= resolution.x / resolution.y;

  float c = cos(rotation);
  float s = sin(rotation);
  p = mat2(c, -s, s, c) * p * scale;
  p.y /= stretch;

  float phase = prismLoopProgress() * 6.28318530718 + evolution * 6.28318530718;
  vec2 loopOffset = vec2(cos(phase), sin(phase)) * motion * 0.42;
  vec2 warpField = vec2(
    glassV2GradientNoise(p * 0.73 + loopOffset, 17.0),
    glassV2GradientNoise(p * 0.73 - loopOffset.yx, 43.0)
  );
  p += warpField * warp * 0.85 + loopOffset;

  float value = 0.0;
  float weight = 0.56;
  float weightSum = 0.0;
  float footprint = glassUvPixelFootprint(scale, stretch, resolution);
  for (int i = 0; i < 3; i++) {
    if (float(i) >= complexity) break;
    float fi = float(i);
    float octave = glassV2GradientNoise(p, 71.0 + fi * 29.0);
    float bandLimit = 1.0 - smoothstep(0.35, 0.9, clamp(footprint, 0.0, 100.0));
    value += octave * weight * bandLimit;
    weightSum += weight * bandLimit;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.93 + vec2(11.7, -8.3) + loopOffset * (0.17 + fi * 0.04);
    footprint *= 1.93;
    weight *= 0.52;
  }
  return finiteFloat(0.5 + 0.42 * value / max(weightSum, 0.0001), 0.5);
}

// Noise Distortion remains a separate Effect Stack pass. For the optional
// Glass surface blend, use a bounded value-noise companion instead of
// importing every Noise algorithm into the Glass program.
float glassNoiseHeight(vec2 uv) {
  vec2 resolution = glassResolution();
  vec2 p = (glassFiniteUv(uv) - vec2(0.5)) * resolution / max(min(resolution.x, resolution.y), 1.0);
  p *= max(glassFloat(u_noiseScale, 1.0, 0.001, 1000000.0), 0.001);
  p += glassSafeDirection(u_animDir) * glassFloat(u_noiseEvolution + u_time, 0.0, -1000000.0, 1000000.0);
  float value = 0.0;
  float amplitude = 0.5;
  float normalization = 0.0;
  for (int i = 0; i < 4; i++) {
    value += valueNoise(p) * amplitude;
    normalization += amplitude;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 19.17;
    amplitude *= 0.5;
  }
  return finiteFloat(value / max(normalization, 0.0001), 0.5);
}

float glassV2SurfaceHeight(vec2 uv) {
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  float glassHeight = glassV2Height(uv);
  if (influence <= 0.0) return glassHeight;
  return finiteFloat(mix(glassHeight, glassNoiseHeight(uv), influence), 0.5);
}

vec2 diffuseGlassGlobalUv(vec2 uv, vec2 globalCoord) {
  uv = glassFiniteUv(uv);
  if (!u_diffuseEnabled || u_diffuseMode >= 2) return mirrorRepeatUv(uv);
  return mirrorRepeatUv(uv + diffusePanelDisplacement(globalCoord) * u_diffuseScatter / glassResolution());
}

vec4 sampleGlassSource(vec2 globalUv) {
  vec2 resolution = glassResolution();
  vec2 tileOffset = vec2(finiteFloat(u_tileOffset.x, 0.0), finiteFloat(u_tileOffset.y, 0.0));
  vec2 sampleGlobalCoord = mirrorRepeatUv(glassFiniteUv(globalUv)) * resolution;
  vec2 sampleUv = (sampleGlobalCoord - tileOffset) / glassTileSize();
  return texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0));
}

vec2 glassV2SurfaceGradient(vec2 globalUv, vec2 resolution, float radiusPx) {
  vec2 stepUv = radiusPx / resolution;
  float hLeft = glassV2SurfaceHeight(globalUv - vec2(stepUv.x, 0.0));
  float hRight = glassV2SurfaceHeight(globalUv + vec2(stepUv.x, 0.0));
  float hDown = glassV2SurfaceHeight(globalUv - vec2(0.0, stepUv.y));
  float hUp = glassV2SurfaceHeight(globalUv + vec2(0.0, stepUv.y));
  return vec2(hRight - hLeft, hUp - hDown) / (radiusPx * 2.0) * min(resolution.x, resolution.y);
}

vec2 glassV2RefractDirection(vec3 incident, vec3 normal, float ior) {
  float safeIor = glassFloat(ior, 1.5, 1.0, 2.5);
  vec3 transmitted = refract(incident, normal, 1.0 / safeIor);
  vec2 direction = vec2(finiteFloat(transmitted.x, 0.0), finiteFloat(transmitted.y, 0.0));
  float lengthSquared = dot(direction, direction);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(0.0);
  return direction * inversesqrt(lengthSquared);
}

vec3 glassV2AdjustChromaticResidual(vec3 color, vec3 base, float hue, float saturation) {
  if (abs(hue) <= 0.000001 && abs(saturation - 1.0) <= 0.000001) {
    return color;
  }
  vec3 residual = color - base;
  float neutral = dot(residual, vec3(0.2126, 0.7152, 0.0722));
  residual = mix(vec3(neutral), residual, saturation);
  float c = cos(hue);
  float s = sin(hue);
  vec3 axis = vec3(0.57735026919);
  return clamp(base + residual * c + cross(axis, residual) * s + axis * dot(axis, residual) * (1.0 - c), 0.0, 1.0);
}

float glassV2ChromaticHueValue() {
#if defined(KGG_LEGACY_GLASS_ONLY)
  return 0.0;
#else
  return u_glassV2ChromaticHue;
#endif
}

float glassV2ChromaticSaturationValue() {
#if defined(KGG_LEGACY_GLASS_ONLY)
  return 1.0;
#else
  return u_glassV2ChromaticSaturation;
#endif
}

vec3 glassV2TransmissionTintValue() {
#if defined(KGG_LEGACY_GLASS_ONLY)
  return vec3(1.0);
#else
  return u_glassV2TransmissionTint;
#endif
}

vec3 glassV2HighlightTintValue() {
#if defined(KGG_LEGACY_GLASS_ONLY)
  return vec3(1.0);
#else
  return u_glassV2HighlightTint;
#endif
}

vec3 glassV2Transmission(vec2 baseUv, vec2 redOffset, vec2 greenOffset, vec2 blueOffset, vec2 roughnessOffset, float roughness, float hue, float saturation) {
  vec3 color;
  vec3 green;
  if (redOffset.x == greenOffset.x && redOffset.y == greenOffset.y && blueOffset.x == greenOffset.x && blueOffset.y == greenOffset.y) {
    green = sampleGlassSource(baseUv + greenOffset).rgb;
    color = green;
  } else {
    vec3 red = sampleGlassSource(baseUv + redOffset).rgb;
    green = sampleGlassSource(baseUv + greenOffset).rgb;
    vec3 blue = sampleGlassSource(baseUv + blueOffset).rgb;
    color = vec3(red.r, green.g, blue.b);
  }
  color = glassV2AdjustChromaticResidual(color, green, hue, saturation);
  if (roughness > 0.0001) {
    vec3 rough = (green + sampleGlassSource(baseUv + greenOffset + roughnessOffset).rgb + sampleGlassSource(baseUv + greenOffset - roughnessOffset).rgb) / 3.0;
    color = mix(color, rough, clamp(roughness / 12.0, 0.0, 1.0));
  }
  return color;
}

vec4 opticalGlassV2(vec2 globalUv, vec2 globalCoord) {
  float refraction = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float chromatic = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 80.0);
  float roughness = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float highlightAmount = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float mixAmount = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 gradient = glassV2SurfaceGradient(globalUv, resolution, 2.0);
  vec2 boundedGradient = gradient / (1.0 + length(gradient) * 0.085);
  vec3 normal = glassSafeNormal(boundedGradient);
  vec3 incident = vec3(0.0, 0.0, -1.0);
  vec2 direction = glassV2RefractDirection(incident, normal, glassCauchyIor(0.5461, chromatic));
  vec2 redOffset = direction * (refraction + chromatic) / resolution;
  vec2 greenOffset = direction * refraction / resolution;
  vec2 blueOffset = direction * (refraction - chromatic) / resolution;
  vec2 tangent = glassSafeDirection(vec2(-boundedGradient.y, boundedGradient.x));
  vec2 roughnessOffset = tangent * roughness / resolution;
  vec2 baseUv = diffuseGlassGlobalUv(globalUv, globalCoord);
  vec3 transmission = glassV2Transmission(baseUv, redOffset, greenOffset, blueOffset, roughnessOffset, roughness, glassV2ChromaticHueValue(), glassV2ChromaticSaturationValue());
  transmission *= clamp(glassV2TransmissionTintValue(), 0.0, 1.0);
  float fresnel = pow(clamp(1.0 - dot(-incident, normal), 0.0, 1.0), 2.0);
  float broadSpecular = pow(max(dot(normal, normalize(vec3(-0.38, 0.48, 1.79))), 0.0), 8.0);
  float highlight = clamp((fresnel * 0.72 + broadSpecular * 0.58) * highlightAmount, 0.0, 1.0);
  vec3 highlighted = vec3(1.0) - (vec3(1.0) - transmission) * (1.0 - highlight * clamp(glassV2HighlightTintValue(), 0.0, 1.0));
  vec4 original = sampleGlassSource(baseUv);
  return applyDiffuseDither(vec4(mix(original.rgb, highlighted, mixAmount), original.a), globalCoord);
}

// Legacy presets retain their symbol and route through the same bounded
// implementation. The stack UI exposes the V2 behavior, but old presets must
// not reintroduce the large compiler path when they are opened.
vec4 organicGlass(vec2 globalUv, vec2 globalCoord) {
  return opticalGlassV2(globalUv, globalCoord);
}

#if !defined(KGG_GLASS_V2_ONLY)
float glassLegacyModeMarker() { return 1.0; }
#endif

#if !defined(KGG_LEGACY_GLASS_ONLY)
float glassV2ModeMarker() { return 1.0; }
#endif
#endif
