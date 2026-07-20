#if !defined(KGG_STACK_NOISE_ONLY) && !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
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
      float d = length(p - point);
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
  float cellAngle = u_postVoronoiAngle + (cellPhase - 0.5) * PI * clamp(u_postVoronoiRandomness, 0.0, 1.0);
  // Tile the preceding stack texture into each Voronoi cell. Voronoi must
  // reshape the already-processed image instead of overlaying a second copy
  // of the original gradient ramp.
  vec2 cellLocal = p - nearestCell - 0.5;
  float cosAngle = cos(-cellAngle);
  float sinAngle = sin(-cellAngle);
  vec2 rotatedLocal = vec2(
    cellLocal.x * cosAngle - cellLocal.y * sinAngle,
    cellLocal.x * sinAngle + cellLocal.y * cosAngle
  );
  vec2 tiledUv = fract(rotatedLocal + 0.5 + vec2(cellPhase, cellPhase * 0.731));
  vec4 sourceColor = texture2D(u_sourceTex, tiledUv);
  vec4 color = sourceColor;

  float edgeWidth = clamp(u_postVoronoiEdgeWidth, 0.0, 0.2);
  if (edgeWidth > 0.0) {
    float edge = smoothstep(0.0, edgeWidth, f2 - f1);
    vec3 edgeColor = sourceColor.rgb * 0.58;
    color.rgb = mix(edgeColor, color.rgb, edge);
  }

  return color;
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
  if (u_noiseType == 3) {
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
  if (u_noiseType == 8) {
    return applyFastCurlNoiseUV(uv, evolution);
  }
  vec2 offset = noiseDisplace(uv, u_noiseScale, evolution, u_noiseType, u_noiseOctaves);
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
vec2 sourceUvFromGlobal(vec2 globalUv) {
  return clamp((globalUv * u_fullResolution - u_tileOffset) / u_tileResolution, 0.0, 1.0);
}

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

vec2 stackSlitDeltaAt(int index) {
  if (index == 0) return u_stackSlitDelta01.xy;
  if (index == 1) return u_stackSlitDelta01.zw;
  if (index == 2) return u_stackSlitDelta23.xy;
  if (index == 3) return u_stackSlitDelta23.zw;
  if (index == 4) return u_stackSlitDelta45.xy;
  if (index == 5) return u_stackSlitDelta45.zw;
  if (index == 6) return u_stackSlitDelta67.xy;
  if (index == 7) return u_stackSlitDelta67.zw;
  if (index == 8) return u_stackSlitDelta89.xy;
  if (index == 9) return u_stackSlitDelta89.zw;
  if (index == 10) return u_stackSlitDeltaAB.xy;
  if (index == 11) return u_stackSlitDeltaAB.zw;
  if (index == 12) return u_stackSlitDeltaCD.xy;
  if (index == 13) return u_stackSlitDeltaCD.zw;
  if (index == 14) return u_stackSlitDeltaEF.xy;
  if (index == 15) return u_stackSlitDeltaEF.zw;
  if (index == 16) return u_stackSlitDeltaGH.xy;
  if (index == 17) return u_stackSlitDeltaGH.zw;
  if (index == 18) return u_stackSlitDeltaIJ.xy;
  if (index == 19) return u_stackSlitDeltaIJ.zw;
  if (index == 20) return u_stackSlitDeltaKL.xy;
  if (index == 21) return u_stackSlitDeltaKL.zw;
  if (index == 22) return u_stackSlitDeltaMN.xy;
  if (index == 23) return u_stackSlitDeltaMN.zw;
  if (index == 24) return u_stackSlitDeltaOP.xy;
  if (index == 25) return u_stackSlitDeltaOP.zw;
  if (index == 26) return u_stackSlitDeltaQR.xy;
  if (index == 27) return u_stackSlitDeltaQR.zw;
  if (index == 28) return u_stackSlitDeltaST.xy;
  if (index == 29) return u_stackSlitDeltaST.zw;
  if (index == 30) return u_stackSlitDeltaUV.xy;
  return u_stackSlitDeltaUV.zw;
}

float computeStackSlitIndex(float warpedCoord, float slitWidth) {
  float cumulativeDelta = 0.0;
  for (int index = 0; index < 32; index++) {
    vec2 entry = stackSlitDeltaAt(index);
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
