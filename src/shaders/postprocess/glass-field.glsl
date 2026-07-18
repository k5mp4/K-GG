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
  return vec2(
    finiteFloat(uv.x, 0.5),
    finiteFloat(uv.y, 0.5)
  );
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

#if !defined(KGG_GLASS_V2_ONLY)
float glassHash(float value) {
  return fract(sin(value * 127.1 + glassFloat(u_glassSeed, 0.0, 0.0, 99.0) * 311.7) * 43758.5453123);
}
#endif

float glassUvPixelFootprint(float scale, float stretch, vec2 resolution) {
  float aspect = resolution.x / max(resolution.y, 1.0);
  float axisScale = max(aspect, 1.0) * max(1.0, 1.0 / max(stretch, 0.001));
  return finiteFloat(scale * axisScale / max(min(resolution.x, resolution.y), 1.0), 0.0);
}

#if !defined(KGG_GLASS_V2_ONLY)
float glassFilteredRidge(float phase, float phaseFootprint) {
  float wave = sin(phase);
  float ridge = 1.0 - abs(wave);
  ridge = ridge * ridge * (3.0 - 2.0 * ridge);

  // Scale/Stretch can move the later Glass octaves beyond the pixel Nyquist
  // limit. Blend those octaves toward their neutral mean instead of allowing
  // a one-pixel phase change to become a temporal shimmer during scrubbing.
  // The explicit footprint works in GLSL ES 1.00 specialized programs without
  // requiring the OES_standard_derivatives extension.
  phaseFootprint = clamp(finiteFloat(phaseFootprint, 0.0), 0.0, 100.0);
  float bandLimit = smoothstep(0.65, 2.4, phaseFootprint);
  return mix(ridge, 0.5, bandLimit);
}

float glassHeight(vec2 uv) {
  float glassScale = glassFloat(u_glassScale, 3.2, 0.5, 12.0);
  float glassStretch = glassFloat(u_glassStretch, 4.0, 0.25, 8.0);
  float glassRotation = glassFloat(u_glassRotation, 0.0, -6.28318530718, 6.28318530718);
  float glassComplexity = glassFloat(float(u_glassComplexity), 4.0, 1.0, 5.0);
  float glassWarp = glassFloat(u_glassWarp, 0.55, 0.0, 1.0);
  float glassEvolution = glassFloat(u_glassEvolution, 0.0, 0.0, 1.0);
  float glassMotion = glassFloat(u_glassMotion, 0.35, 0.0, 1.0);
  vec2 resolution = glassResolution();
  float aspect = resolution.x / resolution.y;
  vec2 p = uv - vec2(0.5);
  p.x *= aspect;

  float c = cos(glassRotation);
  float s = sin(glassRotation);
  p = mat2(c, -s, s, c) * p;
  p *= glassScale;
  p.y /= glassStretch;

  float loopPhase = prismLoopProgress() * 2.0 * PI;
  float evolutionPhase = glassEvolution * 2.0 * PI;
  float phase = loopPhase + evolutionPhase;
  vec2 flow = vec2(sin(phase), cos(phase)) * glassMotion;

  float seedPhase = glassHash(7.0) * 2.0 * PI;
  vec2 domainWarp = vec2(
    sin(p.y * 1.37 + seedPhase + flow.x * 1.8),
    sin(p.x * 0.91 - seedPhase * 0.73 + flow.y * 1.6)
  );
  p += domainWarp * glassWarp * 0.72;

  float height = 0.0;
  float amplitude = 0.58;
  float amplitudeSum = 0.0;
  float frequency = 1.0;
  float octaveFootprint = glassUvPixelFootprint(glassScale, glassStretch, resolution)
    * (1.0 + glassWarp * 0.72);
  for (int i = 0; i < 5; i++) {
    if (float(i) >= glassComplexity) break;
    float fi = float(i);
    float directionJitter = (glassHash(fi + 19.0) - 0.5) * 0.7;
    vec2 direction = glassSafeDirection(vec2(1.0, directionJitter));
    float harmonic = fi + 1.0;
    float animatedPhase = glassMotion * (
      sin(phase * harmonic + glassHash(fi + 31.0) * 2.0 * PI) +
      cos(phase * (harmonic + 1.0) + glassHash(fi + 47.0) * 2.0 * PI)
    );
    float wavePhase = dot(p, direction) * frequency * 2.0 * PI
      + glassHash(fi + 61.0) * 2.0 * PI
      + animatedPhase;
    float ridge = glassFilteredRidge(wavePhase, octaveFootprint * frequency * 2.0 * PI);
    height += ridge * amplitude;
    amplitudeSum += amplitude;

    p = mat2(0.86, -0.51, 0.51, 0.86) * p * 1.73
      + vec2(3.1, -2.7)
      + flow * (0.11 + fi * 0.035);
    frequency *= 1.31;
    octaveFootprint *= 1.73;
    amplitude *= 0.54;
  }
  return finiteFloat(height / max(amplitudeSum, 0.0001), 0.5);
}
#endif

#if !defined(KGG_LEGACY_GLASS_ONLY)
vec2 glassV2Gradient(vec2 cell, float seedOffset) {
  vec2 gradient = hash22(cell, glassFloat(u_glassSeed, 0.0, 0.0, 99.0) + seedOffset) * 2.0 - 1.0;
  float lengthSquared = dot(gradient, gradient);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(1.0, 0.0);
  return gradient * inversesqrt(lengthSquared);
}

vec2 glassV2QuinticFade(vec2 t) {
  // Improved Perlin fade: 6t^5 - 15t^4 + 10t^3. Its first and second
  // derivatives vanish at lattice boundaries, keeping reconstructed normals
  // smooth while the surface moves.
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
  float complexity = glassFloat(float(u_glassComplexity), 4.0, 1.0, 5.0);
  float warp = glassFloat(u_glassWarp, 0.55, 0.0, 1.0);
  float evolution = glassFloat(u_glassEvolution, 0.0, 0.0, 1.0);
  float motion = glassFloat(u_glassMotion, 0.35, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 p = uv - vec2(0.5);
  p.x *= resolution.x / resolution.y;
  float c = cos(rotation);
  float s = sin(rotation);
  p = mat2(c, -s, s, c) * p;
  p *= scale;
  p.y /= stretch;

  float phase = prismLoopProgress() * 2.0 * PI + evolution * 2.0 * PI;
  vec2 loopOffset = vec2(cos(phase), sin(phase)) * motion * 0.42;
  vec2 warpField = vec2(
    glassV2GradientNoise(p * 0.73 + loopOffset, 17.0),
    glassV2GradientNoise(p * 0.73 - loopOffset.yx, 43.0)
  );
  p += warpField * warp * 0.85 + loopOffset;

  float value = 0.0;
  float weight = 0.56;
  float weightSum = 0.0;
  float octaveFootprint = glassUvPixelFootprint(scale, stretch, resolution)
    * (1.0 + warp * 0.85);
  for (int i = 0; i < 5; i++) {
    if (float(i) >= complexity) break;
    float fi = float(i);
    float octave = glassV2GradientNoise(p, 71.0 + fi * 29.0);
    float footprint = clamp(finiteFloat(octaveFootprint, 0.0), 0.0, 100.0);
    float bandLimit = 1.0 - smoothstep(0.35, 0.9, footprint);
    value += octave * weight * bandLimit;
    weightSum += weight * bandLimit;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.93
      + vec2(11.7, -8.3)
      + loopOffset * (0.17 + fi * 0.04);
    octaveFootprint *= 1.93;
    weight *= 0.52;
  }
  return finiteFloat(0.5 + 0.42 * value / max(weightSum, 0.0001), 0.5);
}
#endif

vec2 glassNoiseDomain(vec2 uv) {
  vec2 resolution = glassResolution();
  float aspect = resolution.x / resolution.y;
  vec2 p = uv - vec2(0.5);
  p.x *= aspect;
  p *= max(glassFloat(u_noiseScale, 1.0, 0.001, 1000000.0), 0.001);

  vec2 direction = glassSafeDirection(vec2(
    finiteFloat(u_animDir.x, 0.0),
    finiteFloat(u_animDir.y, -1.0)
  ));
  if (length(direction) <= 0.0001) direction = vec2(0.0, -1.0);
  if (u_noiseLoopMode == 1) {
    float phase = prismLoopProgress() * 2.0 * PI;
    p += vec2(cos(phase), sin(phase)) * 0.72;
    p += direction * glassFloat(u_noiseEvolution, 0.0, -1000000.0, 1000000.0);
  } else {
    p += direction * (glassFloat(u_noiseEvolution, 0.0, -1000000.0, 1000000.0) + glassFloat(u_time, 0.0, -1000000000.0, 1000000000.0));
  }
  return p;
}

float glassVoronoiDistance(vec2 delta) {
  vec2 ad = abs(delta);
  if (u_voronoiDistMetric == 1) return ad.x + ad.y;
  if (u_voronoiDistMetric == 2) return max(ad.x, ad.y);
  if (u_voronoiDistMetric == 3) {
    float exponent = glassFloat(u_voronoiMinkowskiExp, 2.0, 0.25, 8.0);
    return pow(pow(ad.x, exponent) + pow(ad.y, exponent), 1.0 / exponent);
  }
  return length(delta);
}

float glassVoronoiScalar(vec2 p) {
  vec2 baseCell = floor(p);
  vec2 local = fract(p);
  float first = 10.0;
  float second = 10.0;
  float randomness = glassFloat(u_voronoiRandomness, 1.0, 0.0, 1.0);
  float seed = glassFloat(u_noiseSeed, 0.0, -1000000.0, 1000000.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = vec2(float(x), float(y));
      vec2 randomPoint = hash22(baseCell + cell, seed);
      vec2 point = cell + mix(vec2(0.5), randomPoint, randomness);
      float distanceToPoint = glassVoronoiDistance(point - local);
      if (distanceToPoint < first) {
        second = first;
        first = distanceToPoint;
      } else if (distanceToPoint < second) {
        second = distanceToPoint;
      }
    }
  }

  if (u_voronoiFeature == 1) return clamp(second * 0.7, 0.0, 1.0);
  if (u_voronoiFeature == 2) return clamp((second - first) * 1.8, 0.0, 1.0);
  return clamp(first * 0.9, 0.0, 1.0);
}

float glassDomainWarpScalar(vec2 p) {
  float strength = glassFloat(abs(u_dwInitAmp), 0.0, 0.0, 4.0);
  vec2 q = vec2(
    colorFbm(p + vec2(0.0, 5.2)),
    colorFbm(p + vec2(1.7, 9.2))
  ) - vec2(0.5);
  return colorFbm(p + q * (0.7 + strength * 0.65));
}

float glassRidgedScalar(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float norm = 0.0;
  float sharpness = glassFloat(u_ridgeSharpness, 2.0, 0.5, 6.0);
  float lacunarity = glassFloat(u_ridgeLacunarity, 2.0, 1.01, 4.0);
  float persistence = glassFloat(u_ridgePersistence, 0.6, 0.01, 1.0);
  float offset = glassFloat(u_ridgeOffset, 1.0, 0.0, 2.0);
  float warp = glassFloat(u_ridgeWarp, 1.0, 0.0, 4.0);
  for (int i = 0; i < 8; i++) {
    if (i >= u_noiseOctaves) break;
    float ridge = clamp(offset - abs(valueNoise(p) * 2.0 - 1.0), 0.0, 1.0);
    ridge = pow(ridge, sharpness);
    value += ridge * amplitude;
    norm += amplitude;
    p = mat2(0.84, -0.54, 0.54, 0.84) * p * lacunarity
      + vec2(ridge, -ridge) * warp * 0.18;
    amplitude *= persistence;
  }
  return value / max(norm, 0.0001);
}

float glassAeFractalScalar(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float norm = 0.0;
  float scaling = glassFloat(u_aeSubScaling, 1.78, 1.01, 4.0);
  float influence = glassFloat(u_aeSubInfluence, 0.7, 0.01, 1.0);
  float rotation = glassFloat(u_aeSubRotation, 0.0, -1000000.0, 1000000.0);
  float c = cos(rotation);
  float s = sin(rotation);
  mat2 octaveRotation = mat2(c, -s, s, c);
  for (int i = 0; i < 8; i++) {
    if (i >= u_noiseOctaves) break;
    float octave = valueNoise(p);
    if (u_aeFractalType == 1) octave = abs(octave * 2.0 - 1.0);
    value += octave * amplitude;
    norm += amplitude;
    p = octaveRotation * p * scaling + vec2(13.1, -7.7);
    amplitude *= influence;
  }
  float result = value / max(norm, 0.0001);
  float contrast = glassFloat(u_aeContrast, 1.0, 0.0, 8.0);
  float brightness = glassFloat(u_aeBrightness, 0.0, -1.0, 1.0);
  return clamp((result - 0.5) * contrast + 0.5 + brightness, 0.0, 1.0);
}

float glassNoiseHeight(vec2 uv) {
  vec2 p = glassNoiseDomain(uv);
  float pattern;
  if (u_noiseType == 0) {
    pattern = valueNoise(p * 1.35);
  } else if (u_noiseType == 1) {
    pattern = colorFbm(p);
  } else if (u_noiseType == 2) {
    pattern = glassVoronoiScalar(p);
  } else if (u_noiseType == 3) {
    vec2 curlDomain = p + vec2(
      colorFbm(p + vec2(7.3, 2.1)),
      -colorFbm(p + vec2(-3.7, 5.9))
    ) * 1.4;
    pattern = colorFbm(curlDomain);
  } else if (u_noiseType == 4) {
    pattern = glassDomainWarpScalar(p);
  } else if (u_noiseType == 5) {
    float twist = clamp(u_seamlessTwist, -8.0, 8.0);
    float radius = length(p);
    float angle = twist * radius * 0.25;
    float c = cos(angle);
    float s = sin(angle);
    pattern = colorFbm(mat2(c, -s, s, c) * p);
  } else if (u_noiseType == 6) {
    pattern = glassRidgedScalar(p);
  } else {
    pattern = glassAeFractalScalar(p);
  }

  float amount = clamp(abs(u_noiseAmount) * 4.0, 0.0, 1.0);
  return finiteFloat(mix(0.5, clamp(finiteFloat(pattern, 0.5), 0.0, 1.0), amount), 0.5);
}

#if !defined(KGG_GLASS_V2_ONLY)
float glassSurfaceHeight(vec2 uv) {
  uv = glassFiniteUv(uv);
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  if (influence <= 0.0) return finiteFloat(glassHeight(uv), 0.5);
  if (influence >= 1.0) return finiteFloat(glassNoiseHeight(uv), 0.5);
  return finiteFloat(mix(glassHeight(uv), glassNoiseHeight(uv), influence), 0.5);
}
#endif

#if !defined(KGG_LEGACY_GLASS_ONLY)
float glassV2SurfaceHeight(vec2 uv) {
  uv = glassFiniteUv(uv);
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  if (influence <= 0.0) return finiteFloat(glassV2Height(uv), 0.5);
  if (influence >= 1.0) return finiteFloat(glassNoiseHeight(uv), 0.5);
  return finiteFloat(mix(glassV2Height(uv), glassNoiseHeight(uv), influence), 0.5);
}
#endif

vec2 diffuseGlassGlobalUv(vec2 uv, vec2 globalCoord) {
  uv = glassFiniteUv(uv);
  if (!u_diffuseEnabled || u_diffuseMode == 2) return mirrorRepeatUv(uv);
  return mirrorRepeatUv(
    uv + diffusePanelDisplacement(globalCoord) * u_diffuseScatter
      / glassResolution()
  );
}
