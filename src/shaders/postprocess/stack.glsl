#if !defined(KGG_STACK_NOISE_ONLY)
vec2 sourceUvFromGlobal(vec2 globalUv) {
  return clamp((globalUv * u_fullResolution - u_tileOffset) / u_tileResolution, 0.0, 1.0);
}
#endif

#if !defined(KGG_STACK_NOISE_ONLY) && !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
float postVoronoiDistance(vec2 diff) {
  if (u_postVoronoiDistMetric == 1) {
    return abs(diff.x) + abs(diff.y);
  }
  if (u_postVoronoiDistMetric == 2) {
    return max(abs(diff.x), abs(diff.y));
  }
  if (u_postVoronoiDistMetric == 3) {
    float exponent = max(u_postVoronoiMinkowskiExp, 0.5);
    return pow(pow(abs(diff.x), exponent) + pow(abs(diff.y), exponent), 1.0 / exponent);
  }
  return length(diff);
}

float postVoronoiFeatureValue(float f1, float f2) {
  float value = u_postVoronoiFeature == 1
    ? f2
    : (u_postVoronoiFeature == 2 ? f2 - f1 : f1);
  if (u_postVoronoiDistMetric == 1) {
    value /= 1.5;
  } else if (u_postVoronoiDistMetric == 2) {
    value /= 0.5;
  } else {
    value /= 0.7;
  }
  return clamp(value, 0.0, 1.0);
}

vec4 voronoiGradient(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 p = uv * vec2(aspect, 1.0) * max(u_postVoronoiScale, 0.001);
  vec2 base = floor(p);
  vec2 nearestPoint = vec2(0.0);
  vec2 nearestCell = vec2(0.0);
  float f1 = 9999.0;
  float f2 = 9999.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = base + vec2(float(x), float(y));
      vec2 jitter = mix(vec2(0.5), hash22(cell, u_postVoronoiSeed), clamp(u_postVoronoiRandomness, 0.0, 1.0));
      vec2 point = cell + jitter;
      float d = postVoronoiDistance(p - point);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        nearestPoint = point;
        nearestCell = cell;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }

  float cellPhase = hashWithSeed(dot(nearestCell, vec2(17.0, 59.0)), u_postVoronoiSeed);
  float featureValue = postVoronoiFeatureValue(f1, f2);
  float cellAngle = u_postVoronoiAngle
    + (cellPhase - 0.5) * PI * clamp(u_postVoronoiRandomness, 0.0, 1.0)
    + (featureValue - 0.5) * 0.35;
  // Tile the preceding stack texture into each Voronoi cell. Voronoi must
  // reshape the already-processed image instead of overlaying a second copy
  // of the original gradient ramp.
  float textureScale = u_postVoronoiFeature == 2
    ? mix(1.35, 0.72, featureValue)
    : mix(0.88, 1.18, featureValue);
  vec2 cellLocal = (p - nearestCell - 0.5) * textureScale;
  float cosAngle = cos(-cellAngle);
  float sinAngle = sin(-cellAngle);
  vec2 rotatedLocal = vec2(
    cellLocal.x * cosAngle - cellLocal.y * sinAngle,
    cellLocal.x * sinAngle + cellLocal.y * cosAngle
  );
  vec2 tiledUv = fract(rotatedLocal + 0.5 + vec2(cellPhase, cellPhase * 0.731));
  vec4 sourceColor = texture2D(u_sourceTex, sourceUvFromGlobal(tiledUv));
  return sourceColor;
}
#endif

#if !defined(KGG_STACK_CORE_NO_NOISE) && !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
vec2 applyStackCurlNoiseUv(vec2 uv, float evolution, float curlTime) {
  float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
  vec3 seedOffset = vec3(u_curlSeed, u_curlSeed * 1.37, u_curlSeed * 0.71);
  for (int stepIndex = 0; stepIndex < 8; stepIndex++) {
    if (stepIndex >= u_curlSteps) break;
    vec3 p = vec3(uv * u_noiseScale + evolution * u_animDir, curlTime) + seedOffset;
    float eps = max(u_curlEps, 0.0001);
    float phiRight = fbm3D(p + vec3( eps, 0.0, 0.0), u_noiseOctaves);
    float phiLeft  = fbm3D(p + vec3(-eps, 0.0, 0.0), u_noiseOctaves);
    float phiUp    = fbm3D(p + vec3(0.0,  eps, 0.0), u_noiseOctaves);
    float phiDown  = fbm3D(p + vec3(0.0, -eps, 0.0), u_noiseOctaves);
    vec2 curlVector = vec2(phiUp - phiDown, -(phiRight - phiLeft)) / (2.0 * eps);
    uv -= curlVector * dt;
  }
  return uv;
}

vec2 applyFastCurlNoiseUV(vec2 uv, float evolution) {
  float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
  for (int stepIndex = 0; stepIndex < 8; stepIndex++) {
    if (stepIndex >= u_curlSteps) break;
    uv -= fastCurlField(uv, u_noiseScale, evolution, u_noiseOctaves) * dt;
  }
  return uv;
}

vec2 applyStackFastCurlNoiseUv(vec2 uv, float evolution) {
  float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
  for (int stepIndex = 0; stepIndex < 8; stepIndex++) {
    if (stepIndex >= u_curlSteps) break;
    uv -= fastCurlField(uv, u_noiseScale, evolution, u_noiseOctaves) * dt;
  }
  return uv;
}

vec2 stackNoiseUv(vec2 uv) {
#if defined(KGG_BOOTSTRAP)
  return uv;
#else
  if (!u_noiseEnabled) return uv;
  float evolution = u_noiseEvolution + u_time;
#if KGG_NOISE_VARIANT < 0 || KGG_NOISE_VARIANT == 3
  if (KGG_NOISE_TYPE == 3) {
    vec2 current = applyStackCurlNoiseUv(uv, evolution, u_time * u_curlSpeed);
    float blend = loopBlendWeight();
    if (blend <= 0.0001) return current;
    vec2 wrapped = applyStackCurlNoiseUv(
      uv,
      evolution - u_noiseLoopPeriod,
      (u_time - u_noiseLoopPeriod) * u_curlSpeed
    );
    return mix(current, wrapped, blend);
  }
#endif
#if KGG_NOISE_VARIANT < 0 || KGG_NOISE_VARIANT == 8
  if (KGG_NOISE_TYPE == 8) {
    return applyFastCurlNoiseUV(uv, evolution);
  }
#endif
  if ((KGG_NOISE_TYPE == CAUSTICS_NOISE_TYPE && u_noiseAmount == 0.0)
    || (KGG_NOISE_TYPE == PHASOR_NOISE_TYPE && (u_noiseAmount == 0.0 || u_phasorWarpStrength == 0.0))
    || (KGG_NOISE_TYPE == CHLADNI_NOISE_TYPE && (u_noiseAmount == 0.0 || u_chladniWarpStrength == 0.0))) {
    return uv;
  }
  vec2 offset = noiseDisplace(uv, u_noiseScale, evolution, KGG_NOISE_TYPE, u_noiseOctaves);
  return uv + offset * u_noiseAmount;
#endif
}

// Legacy postprocess consumers (not the V2 Noise layer) keep their historical
// lightweight color-domain warp. Glass has its own material-noise path below.
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
vec2 legacyPostNoiseWarpUv(vec2 uv) {
  if (!u_noiseEnabled || u_noiseAmount == 0.0) return uv;
  float loopAngle = prismPeriodicPhase() * 2.0 * PI;
  vec2 drift = vec2(cos(loopAngle + u_noiseEvolution), sin(loopAngle + u_noiseEvolution * 0.73));
  vec2 p = uv * max(u_noiseScale, 0.001) + drift * 0.85 + u_noiseEvolution * 0.12;
  float nx = colorFbm(p + vec2(u_noiseSeed * 11.7, 19.3));
  float ny = colorFbm(p + vec2(41.9, u_noiseSeed * 17.1));
  return clamp(uv + (vec2(nx, ny) * 2.0 - 1.0) * u_noiseAmount * 0.12, 0.0, 1.0);
}
#endif

#endif

#if !defined(KGG_STACK_NOISE_ONLY)
float stackSlitHash(float value) {
  return fract(sin(value * 127.1 + 311.7) * 43758.5453);
}

vec2 snapStackSlitUv(vec2 uv) {
  if (!u_stackSlitPixelPerfect) return uv;
  return (floor(uv * u_fullResolution) + 0.5) / u_fullResolution;
}

vec2 snapStackSlitOffset(vec2 offsetUv) {
  if (!u_stackSlitPixelPerfect) return offsetUv;
  return floor(offsetUv * u_fullResolution + 0.5) / u_fullResolution;
}

float computeStackSlitIndex(float warpedCoord, float slitWidth) {
  // Index a local copy of the delta table. Selecting each entry through a
  // 32-way branch inside this 32-step loop made the ANGLE/Direct3D compile
  // several times slower for every program that includes the Slit layer.
  vec4 deltas[16];
  deltas[0] = u_stackSlitDelta01;
  deltas[1] = u_stackSlitDelta23;
  deltas[2] = u_stackSlitDelta45;
  deltas[3] = u_stackSlitDelta67;
  deltas[4] = u_stackSlitDelta89;
  deltas[5] = u_stackSlitDeltaAB;
  deltas[6] = u_stackSlitDeltaCD;
  deltas[7] = u_stackSlitDeltaEF;
  deltas[8] = u_stackSlitDeltaGH;
  deltas[9] = u_stackSlitDeltaIJ;
  deltas[10] = u_stackSlitDeltaKL;
  deltas[11] = u_stackSlitDeltaMN;
  deltas[12] = u_stackSlitDeltaOP;
  deltas[13] = u_stackSlitDeltaQR;
  deltas[14] = u_stackSlitDeltaST;
  deltas[15] = u_stackSlitDeltaUV;
  float cumulativeDelta = 0.0;
  for (int index = 0; index < 32; index++) {
    vec4 pair = deltas[index / 2];
    vec2 entry = index - (index / 2) * 2 == 0 ? pair.xy : pair.zw;
    if (entry.x <= -9000.0) continue;
    float left = entry.x * slitWidth + cumulativeDelta;
    float right = left + slitWidth + entry.y;
    if (warpedCoord < left) return floor((warpedCoord - cumulativeDelta) / slitWidth);
    if (warpedCoord < right) return entry.x;
    cumulativeDelta += entry.y;
  }
  return floor((warpedCoord - cumulativeDelta) / slitWidth);
}

float regularStackPolygonCoord(vec2 p) {
  float sides = max(float(u_stackSlitPolygonSides), 3.0);
  float sector = 2.0 * PI / sides;
  float localAngle = abs(mod(atan(p.y, p.x) + u_stackSlitAngle + sector * 0.5, sector) - sector * 0.5);
  return length(p) * cos(localAngle) / max(cos(PI / sides), 0.001);
}

float stackSlitWaveShape(float value) {
  float phase = fract(value);
  if (u_stackSlitWaveType == 1) return phase * 2.0 - 1.0;
  if (u_stackSlitWaveType == 2) {
    float x = phase * 2.0 - 1.0;
    return sqrt(max(1.0 - x * x, 0.0)) * 2.0 - 1.0;
  }
  return sin(phase * 2.0 * PI);
}

vec2 stackWaveSlitUv(vec2 uv, vec2 globalCoord, float slitWidth) {
  vec2 direction = vec2(cos(u_stackSlitAngle), sin(u_stackSlitAngle));
  vec2 waveAxis = vec2(-direction.y, direction.x);
  float coord = dot(globalCoord, waveAxis) + u_stackSlitParams.x;
  float bandIndex = floor(coord / max(slitWidth, 1.0));
  float localPhase = fract(coord / max(slitWidth, 1.0));
  float phase = bandIndex + localPhase + u_stackSlitParams.y * 0.137;
  if (u_stackSlitAnimEnabled) phase += u_stackSlitAnimTime;
  float bandGate = smoothstep(0.0, 0.08, localPhase) * (1.0 - smoothstep(0.92, 1.0, localPhase));
  float offsetPixels = stackSlitWaveShape(phase) * u_stackSlitWaveHeight * bandGate;
  return snapStackSlitUv(uv + direction * offsetPixels / u_fullResolution);
}

vec2 stackSlitUv(vec2 globalUv, vec2 globalCoord) {
  float slitWidth = max(u_stackSlitWidth, 1.0);
  if (u_stackSlitMode == 3) return stackWaveSlitUv(globalUv, globalCoord, slitWidth);

  if (u_stackSlitMode == 1 || u_stackSlitMode == 2) {
    vec2 fragmentCentered = globalCoord - u_fullResolution * 0.5;
    float radialPixels = u_stackSlitMode == 2
      ? regularStackPolygonCoord(fragmentCentered)
      : length(fragmentCentered);
    float slitIndex = computeStackSlitIndex(radialPixels + u_stackSlitParams.x, slitWidth);
    float randomValue = stackSlitHash(slitIndex + u_stackSlitParams.y * 91.7);
    float shiftFactor = u_stackSlitAnimEnabled
      ? (u_stackSlitAnimMode == 1
        ? sin((randomValue + u_stackSlitAnimTime) * 2.0 * PI)
        : fract(randomValue + u_stackSlitAnimTime) * 2.0 - 1.0)
      : randomValue * 2.0 - 1.0;
    float delta = shiftFactor * u_stackSlitOffset * PI + slitIndex * u_stackSlitAngle;
    float cosDelta = cos(delta);
    float sinDelta = sin(delta);
    vec2 centeredUv = globalUv - 0.5;
    return snapStackSlitUv(0.5 + vec2(
      centeredUv.x * cosDelta - centeredUv.y * sinDelta,
      centeredUv.x * sinDelta + centeredUv.y * cosDelta
    ));
  }

  float cosAngle = cos(u_stackSlitAngle);
  float sinAngle = sin(u_stackSlitAngle);
  float centerProjection = dot(u_fullResolution * 0.5, vec2(cosAngle, sinAngle));
  float slitCoord = dot(globalCoord, vec2(cosAngle, sinAngle)) - centerProjection + u_stackSlitParams.x;
  float warpedCoord = slitCoord
    + sin(slitCoord / (slitWidth * 4.0) * 6.2832 + u_stackSlitParams.y * 37.4)
      * u_stackSlitVariance * slitWidth;
  float slitIndex = computeStackSlitIndex(warpedCoord, slitWidth);
  float randomValue = stackSlitHash(slitIndex + u_stackSlitParams.y * 91.7);
  float shiftFactor = u_stackSlitAnimEnabled
    ? (u_stackSlitAnimMode == 1
      ? sin((randomValue + u_stackSlitAnimTime) * 2.0 * PI)
      : fract(randomValue + u_stackSlitAnimTime) * 2.0 - 1.0)
    : randomValue * 2.0 - 1.0;
  float offsetAngle = u_stackSlitAngle + u_stackSlitOffsetAngle + PI * 0.5;
  vec2 sourceDirection = vec2(cos(offsetAngle), sin(offsetAngle));
return globalUv + snapStackSlitOffset(shiftFactor * u_stackSlitOffset * sourceDirection);
}
#endif
