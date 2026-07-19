precision highp float;

uniform sampler2D u_sourceTex;
uniform sampler2D u_gradientRamp;
uniform sampler2D u_distortMap;
uniform vec2 u_tileResolution;
uniform vec2 u_tileOffset;
uniform vec2 u_gradAnchor0;
uniform vec2 u_gradAnchor1;
uniform float u_maxDisplacement;
uniform bool u_effectEnabled;
uniform int u_effectMode;
uniform bool u_noiseEnabled;
uniform int u_noiseType;
uniform float u_noiseAmount;
uniform float u_noiseScale;
uniform int u_noiseOctaves;
uniform float u_noiseEvolution;
uniform float u_prismSpeed;
uniform int u_mirrorMode;
uniform int u_kaleidoscopeType;
uniform float u_kaleidoscopeSlices;
uniform float u_kaleidoscopeRotation;
uniform float u_kaleidoscopeZoom;
uniform vec2 u_prismCenter;
uniform float u_prismRayCount;
uniform float u_prismLength;
uniform float u_prismLengthRandomness;
uniform float u_prismWidth;
uniform float u_prismRandomness;
uniform float u_prismBlur;
uniform float u_prismIntensity;
uniform float u_prismSeed;
uniform float u_prismInnerRadius;
uniform float u_postVoronoiScale;
uniform float u_postVoronoiRandomness;
uniform float u_postVoronoiAngle;
uniform float u_postVoronoiGradientScale;
uniform float u_postVoronoiEdgeWidth;
uniform float u_postVoronoiSeed;
uniform float u_glassScale;
uniform float u_glassStretch;
uniform float u_glassRotation;
uniform int u_glassComplexity;
uniform float u_glassWarp;
uniform float u_glassSeed;
uniform float u_glassNoiseInfluence;
uniform float u_glassRefraction;
uniform float u_glassChromaticAberration;
uniform float u_glassRoughness;
uniform float u_glassHighlight;
uniform float u_glassMix;
uniform float u_glassEvolution;
uniform float u_glassMotion;
uniform bool u_diffuseEnabled;
uniform int u_diffuseMode;
uniform float u_diffuseScatter;
uniform float u_diffuseGrain;
uniform float u_diffuseSeed;
uniform float u_diffuseDitherThreshold;
uniform int u_stackSlitMode;
uniform float u_stackSlitAngle;
uniform int u_stackSlitWaveType;
uniform float u_stackSlitWaveHeight;
uniform int u_stackSlitPolygonSides;
uniform float u_stackSlitOffsetAngle;
uniform float u_stackSlitWidth;
uniform float u_stackSlitOffset;
uniform float u_stackSlitVariance;
uniform vec2 u_stackSlitParams;
uniform bool u_stackSlitDiffuseAfter;
uniform vec4 u_stackSlitDelta01;
uniform vec4 u_stackSlitDelta23;
uniform vec4 u_stackSlitDelta45;
uniform vec4 u_stackSlitDelta67;
uniform vec4 u_stackSlitDelta89;
uniform vec4 u_stackSlitDeltaAB;
uniform vec4 u_stackSlitDeltaCD;
uniform vec4 u_stackSlitDeltaEF;
uniform vec4 u_stackSlitDeltaGH;
uniform vec4 u_stackSlitDeltaIJ;
uniform vec4 u_stackSlitDeltaKL;
uniform vec4 u_stackSlitDeltaMN;
uniform vec4 u_stackSlitDeltaOP;
uniform vec4 u_stackSlitDeltaQR;
uniform vec4 u_stackSlitDeltaST;
uniform vec4 u_stackSlitDeltaUV;
uniform bool u_stackSlitAnimEnabled;
uniform float u_stackSlitAnimTime;
uniform int u_stackSlitAnimMode;
uniform bool u_stackSlitPixelPerfect;
uniform int u_curlSteps;
uniform float u_curlSpeed;
uniform float u_curlEps;
uniform float u_curlSeed;

const float PI = 3.141592653589793;

#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
vec2 mirroredUv(vec2 uv) {
  if (u_mirrorMode == 0) {
    uv.x = uv.x <= 0.5 ? uv.x : 1.0 - uv.x;
  } else if (u_mirrorMode == 1) {
    uv.y = uv.y <= 0.5 ? uv.y : 1.0 - uv.y;
  } else {
    uv.x = uv.x <= 0.5 ? uv.x : 1.0 - uv.x;
    uv.y = uv.y <= 0.5 ? uv.y : 1.0 - uv.y;
  }
  return uv;
}

vec2 kaleidoscopeUv(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 centered = uv - vec2(0.5);
  centered.x *= aspect;

  float slices = clamp(floor(u_kaleidoscopeSlices + 0.5), 2.0, 64.0);
  float sector = (2.0 * PI) / slices;
  float angle = atan(centered.y, centered.x) + u_kaleidoscopeRotation;
  float radius = length(centered) / max(u_kaleidoscopeZoom, 0.001);

  if (u_kaleidoscopeType == 0) {
    angle = mod(angle, sector);
    angle = abs(angle - sector * 0.5);
  } else if (u_kaleidoscopeType == 1) {
    float petal = sin(angle * slices);
    radius *= 0.72 + 0.28 * abs(petal);
    angle = abs(mod(angle, sector) - sector * 0.5);
  } else {
    float spoke = pow(abs(cos(angle * slices * 0.5)), 2.5);
    radius *= 0.62 + 0.38 * spoke;
    angle = abs(mod(angle + sector * 0.25, sector) - sector * 0.5);
  }

  vec2 sampled = vec2(cos(angle), sin(angle)) * radius;
  sampled.x /= aspect;
  return sampled + vec2(0.5);
}
#endif

vec2 mirrorRepeatUv(vec2 uv) {
  vec2 f = fract(uv * 0.5) * 2.0;
  return 1.0 - abs(f - 1.0);
}

#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
vec2 rotateUnitUv(vec2 uv, float angle) {
  vec2 centered = uv - vec2(0.5);
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * centered.x - s * centered.y, s * centered.x + c * centered.y) + vec2(0.5);
}
#endif

vec2 hash22(vec2 p, float seed) {
  p += vec2(seed * 31.17, seed * 73.41);
  float x = dot(p, vec2(127.1, 311.7));
  float y = dot(p, vec2(269.5, 183.3));
  return fract(sin(vec2(x, y)) * 43758.5453123);
}

float hashWithSeed(float p, float seed) {
  return fract(sin(p * 127.1 + seed * 31.7) * 43758.5453123);
}

float finiteFloat(float value, float fallback) {
  return value == value && abs(value) < 1000000000.0 ? value : fallback;
}

float prismLoopProgress() {
  return fract(finiteFloat(u_time, 0.0) / max(finiteFloat(u_noiseLoopPeriod, 1.0), 0.0001));
}

#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
float prismPeriodicPhase() {
  return prismLoopProgress();
}

float animatedPrismSeed() {
  return u_prismSeed + prismPeriodicPhase() + u_noiseEvolution * 0.25;
}

float hash11(float p) {
  return hashWithSeed(p, u_prismSeed);
}

float animatedHash11(float p, float channel) {
  float phase = animatedPrismSeed() * 6.28318530718;
  float offset = hashWithSeed(p + channel * 37.19, u_prismSeed) * 6.28318530718;
  float amount = clamp(u_prismSpeed / 3.0, 0.0, 1.0);
  return mix(hashWithSeed(p + channel * 37.19, u_prismSeed), 0.5 + 0.5 * sin(phase + offset + p * 2.399963), amount);
}
#endif

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i + vec2(0.0, 0.0), vec2(127.1, 311.7)) + u_noiseSeed * 17.3) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7)) + u_noiseSeed * 17.3) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7)) + u_noiseSeed * 17.3) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7)) + u_noiseSeed * 17.3) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float colorFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= u_noiseOctaves) break;
    value += valueNoise(p) * amplitude;
    norm += amplitude;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 19.17;
    amplitude *= 0.5;
  }
  return value / max(norm, 0.0001);
}

#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
float angleDistance(float a, float b) {
  float d = abs(mod(a - b + PI, 2.0 * PI) - PI);
  return d;
}

vec3 prismRamp(float t, float hueShift) {
  vec3 centerColor = texture2D(u_gradientRamp, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
  vec3 splitColor = vec3(
    texture2D(u_gradientRamp, vec2(clamp(t + hueShift, 0.0, 1.0), 0.5)).r,
    texture2D(u_gradientRamp, vec2(clamp(t, 0.0, 1.0), 0.5)).g,
    texture2D(u_gradientRamp, vec2(clamp(t - hueShift, 0.0, 1.0), 0.5)).b
  );
  vec3 warmShift = texture2D(u_gradientRamp, vec2(clamp(t + hueShift * 2.0, 0.0, 1.0), 0.5)).rgb;
  vec3 coolShift = texture2D(u_gradientRamp, vec2(clamp(t - hueShift * 2.0, 0.0, 1.0), 0.5)).rgb;
  return max(mix(centerColor, splitColor, 0.7), max(warmShift, coolShift) * 0.45);
}

float prismGradientT(vec2 uv, float local, float rayHash) {
  float t = local + (rayHash - 0.5) * 0.08 * u_prismRandomness;

  if (u_noiseEnabled) {
    float loopAngle = prismPeriodicPhase() * 2.0 * PI;
    float driftAmount = mix(0.28, 1.25, clamp(u_prismSpeed / 3.0, 0.0, 1.0));
    vec2 drift = vec2(cos(loopAngle + u_noiseEvolution), sin(loopAngle + u_noiseEvolution * 0.73));
    float n = colorFbm(uv * max(u_noiseScale, 0.001) + drift * driftAmount + u_noiseEvolution * 0.12);
    t += (n - 0.5) * u_noiseAmount * 0.45;
  }

  return clamp(t, 0.0, 1.0);
}

vec4 prismRays(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 p = uv - u_prismCenter;
  p.x *= aspect;

  float radius = length(p);
  float angle = atan(p.y, p.x);
  float rays = clamp(floor(u_prismRayCount + 0.5), 1.0, 96.0);
  float sector = (2.0 * PI) / rays;
  float baseIndex = floor((angle + PI) / sector);

  vec3 color = vec3(0.0);
  float alpha = 0.0;
  for (int i = -1; i <= 1; i++) {
    float rayIndex = baseIndex + float(i);
    float h0 = animatedHash11(rayIndex + 1.0, 0.0);
    float h1 = animatedHash11(rayIndex + 17.0, 1.0);
    float h2 = animatedHash11(rayIndex + 43.0, 2.0);
    float h3 = animatedHash11(rayIndex + 89.0, 3.0);
    float h4 = animatedHash11(rayIndex + 131.0, 4.0);

    float rayAngle = (rayIndex + 0.5) * sector - PI;
    rayAngle += (h0 - 0.5) * sector * 0.9 * u_prismRandomness;

    float inner = max(u_prismInnerRadius * (0.55 + h4 * 0.9 * u_prismRandomness), 0.0);
    float lengthJitter = mix(1.0, 0.45 + h1 * 1.1, clamp(u_prismLengthRandomness, 0.0, 1.0));
    float rayLength = max(inner + 0.02, u_prismLength * lengthJitter);
    float local = clamp((radius - inner) / max(rayLength - inner, 0.001), 0.0, 1.0);
    float width = max(u_prismWidth * (0.55 + h2 * 1.25 * u_prismRandomness), 0.0005);
    float taperedWidth = width * mix(0.35, 1.35, pow(local, 0.85));
    float feather = max(width * mix(0.6, 4.0, clamp(u_prismBlur, 0.0, 1.0)), 0.0008);

    float angular = 1.0 - smoothstep(taperedWidth, taperedWidth + feather, angleDistance(angle, rayAngle));
    float radialHead = smoothstep(inner, inner + feather * 6.0, radius);
    float radialTail = 1.0 - smoothstep(rayLength - feather * 8.0, rayLength + feather * 8.0, radius);
    float core = pow(max(1.0 - abs(local - (0.42 + h3 * 0.32)) * 1.6, 0.0), 1.5);
    float mask = angular * radialHead * radialTail * mix(0.45, 1.0, core);

    float rampT = prismGradientT(uv, local, h0);
    vec3 rayColor = prismRamp(rampT, 0.035 + h2 * 0.055);
    float brightness = 0.45 + h1 * 0.95;
    float whiteCore = pow(angular, 7.0) * radialHead * radialTail * (0.25 + core * 0.75);
    float rayAlpha = clamp(mask * brightness + whiteCore * 0.35, 0.0, 1.0);
    color += rayColor * mask * brightness * (1.0 + whiteCore * 0.8);
    alpha = max(alpha, rayAlpha);
  }

  float vignette = 1.0 - smoothstep(u_prismLength * 0.95, u_prismLength * 1.35, radius);
  return vec4(color * vignette, clamp(alpha * vignette, 0.0, 1.0));
}
#endif

#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
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
  // Map the complete input texture into every Voronoi cell. The preceding
  // stack result is therefore tiled by the cells instead of being drawn as a
  // ramp-colored overlay on top of the original gradient.
  vec2 cellLocal = p - nearestCell - 0.5;
  float cosAngle = cos(-cellAngle);
  float sinAngle = sin(-cellAngle);
  vec2 rotatedLocal = vec2(
    cellLocal.x * cosAngle - cellLocal.y * sinAngle,
    cellLocal.x * sinAngle + cellLocal.y * cosAngle
  );
  vec2 tiledUv = fract(rotatedLocal + 0.5 + vec2(cellPhase, cellPhase * 0.731));
  vec4 sourceColor = texture2D(u_sourceTex, tiledUv);

  // The preceding stack texture is the only color source. Do not overlay the
  // original gradient here; Voronoi should reshape the already-processed image.
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

#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
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

vec2 applyStackFastCurlNoiseUv(vec2 uv, float evolution) {
  float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
  for (int stepIndex = 0; stepIndex < 8; stepIndex++) {
    if (stepIndex >= u_curlSteps) break;
    uv -= fastCurlField(uv, u_noiseScale, evolution, u_noiseOctaves) * dt;
  }
  return uv;
}

vec2 stackNoiseUv(vec2 uv) {
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
    return applyStackFastCurlNoiseUv(uv, evolution);
  }
  vec2 offset = noiseDisplace(uv, u_noiseScale, evolution, u_noiseType, u_noiseOctaves);
  return uv + offset * u_noiseAmount;
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

#if defined(KGG_GLASS_ONLY) || defined(KGG_PRISM_ONLY)
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

float glassUvPixelFootprint(float scale, float stretch, vec2 resolution) {
  float aspect = resolution.x / max(resolution.y, 1.0);
  float axisScale = max(aspect, 1.0) * max(1.0, 1.0 / max(stretch, 0.001));
  return finiteFloat(scale * axisScale / max(min(resolution.x, resolution.y), 1.0), 0.0);
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

float glassHash(float value) {
  return fract(sin(value * 127.1 + glassFloat(u_glassSeed, 0.0, 0.0, 99.0) * 311.7) * 43758.5453123);
}

float glassFilteredRidge(float phase) {
  float wave = sin(phase);
  float ridge = 1.0 - abs(wave);
  ridge = ridge * ridge * (3.0 - 2.0 * ridge);

  // Scale/Stretch can move the later Glass octaves beyond the pixel Nyquist
  // limit. Blend those octaves toward their neutral mean instead of allowing
  // a one-pixel phase change to become a temporal shimmer during scrubbing.
  float phaseFootprint = clamp(finiteFloat(fwidth(phase), 0.0), 0.0, 100.0);
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
    float ridge = glassFilteredRidge(wavePhase);
    height += ridge * amplitude;
    amplitudeSum += amplitude;

    p = mat2(0.86, -0.51, 0.51, 0.86) * p * 1.73
      + vec2(3.1, -2.7)
      + flow * (0.11 + fi * 0.035);
    frequency *= 1.31;
    amplitude *= 0.54;
  }
  return finiteFloat(height / max(amplitudeSum, 0.0001), 0.5);
}

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

float glassSurfaceHeight(vec2 uv) {
  uv = glassFiniteUv(uv);
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  if (influence <= 0.0) return finiteFloat(glassHeight(uv), 0.5);
  if (influence >= 1.0) return finiteFloat(glassNoiseHeight(uv), 0.5);
  return finiteFloat(mix(glassHeight(uv), glassNoiseHeight(uv), influence), 0.5);
}

vec2 diffuseGlassGlobalUv(vec2 uv, vec2 globalCoord) {
  uv = glassFiniteUv(uv);
  if (!u_diffuseEnabled || u_diffuseMode == 2) return mirrorRepeatUv(uv);
  return mirrorRepeatUv(
    uv + diffusePanelDisplacement(globalCoord) * u_diffuseScatter
      / glassResolution()
  );
}

vec4 sampleGlassSource(vec2 globalUv) {
  vec2 resolution = glassResolution();
  vec2 tileOffset = vec2(
    finiteFloat(u_tileOffset.x, 0.0),
    finiteFloat(u_tileOffset.y, 0.0)
  );
  vec2 mirrored = mirrorRepeatUv(glassFiniteUv(globalUv));
  vec2 sampleGlobalCoord = mirrored * resolution;
  vec2 sampleUv = (sampleGlobalCoord - tileOffset) / glassTileSize();
  return texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0));
}

vec2 glassSurfaceGradient(vec2 globalUv, vec2 resolution, float radiusPx) {
  vec2 stepUv = radiusPx / resolution;
  float hLeft = glassSurfaceHeight(globalUv - vec2(stepUv.x, 0.0));
  float hRight = glassSurfaceHeight(globalUv + vec2(stepUv.x, 0.0));
  float hDown = glassSurfaceHeight(globalUv - vec2(0.0, stepUv.y));
  float hUp = glassSurfaceHeight(globalUv + vec2(0.0, stepUv.y));
  return vec2(hRight - hLeft, hUp - hDown) / (radiusPx * 2.0) * min(resolution.x, resolution.y);
}

vec2 glassBoundedGradient(vec2 gradient) {
  gradient = vec2(finiteFloat(gradient.x, 0.0), finiteFloat(gradient.y, 0.0));
  float gradientLength = length(gradient);
  if (!(gradientLength > 0.000001) || gradientLength >= 1000000000.0) return vec2(0.0);
  // Preserve small slopes at approximately unit gain; only large gradients
  // are compressed to keep refraction bounded and continuous.
  return gradient / (1.0 + gradientLength * 0.085);
}

vec2 glassStableDirection(vec2 boundedGradient) {
  boundedGradient = vec2(
    finiteFloat(boundedGradient.x, 0.0),
    finiteFloat(boundedGradient.y, 0.0)
  );
  float slope = length(boundedGradient);
  // Keep the optical direction and its strength in one continuous vector.
  // This removes the direction flip that occurs when a finite difference
  // crosses zero while a gradient anchor or Glass parameter is dragged.
  const float directionSoftness = 0.02;
  return boundedGradient / (slope + directionSoftness);
}

vec2 glassStableDisplacement(vec2 boundedGradient) {
  boundedGradient = vec2(
    finiteFloat(boundedGradient.x, 0.0),
    finiteFloat(boundedGradient.y, 0.0)
  );
  float slope = length(boundedGradient);
  if (!(slope > 0.000001) || slope >= 1000000000.0) return vec2(0.0);

  // Refraction is expressed in pixels by the UI and by tile padding. Keep
  // the procedural slope as a continuous strength factor in [0, 1), so a
  // strong normal cannot multiply a 120px control into a multi-canvas jump.
  return boundedGradient / (1.0 + slope);
}

vec3 glassOpticalColor(
  vec4 center,
  vec2 centerGlobal,
  vec2 stableDirection,
  float chromaticAberration,
  float roughness,
  vec2 resolution
) {
  vec3 opticalColor = center.rgb;
  if (chromaticAberration > 0.0001) {
    vec2 aberrationUv = stableDirection * chromaticAberration / resolution;
    vec4 redSample = sampleGlassSource(centerGlobal + aberrationUv);
    vec4 blueSample = sampleGlassSource(centerGlobal - aberrationUv);
    opticalColor = vec3(redSample.r, center.g, blueSample.b);
  }

  if (roughness > 0.0001) {
    vec2 tangent = vec2(-stableDirection.y, stableDirection.x);
    vec2 roughnessUv = tangent * roughness / resolution;
    vec3 roughColor = (
      center.rgb +
      sampleGlassSource(centerGlobal + roughnessUv).rgb +
      sampleGlassSource(centerGlobal - roughnessUv).rgb
    ) / 3.0;
    opticalColor = mix(opticalColor, roughColor, clamp(roughness / 12.0, 0.0, 1.0));
  }
  return opticalColor;
}

vec4 organicGlass(vec2 globalUv, vec2 globalCoord) {
  float glassRefraction = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float glassChromaticAberration = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0);
  float glassRoughness = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float glassHighlight = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float glassMix = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 resolution = glassResolution();
  const float normalRadiusPx = 4.0;
  vec2 gradient = glassSurfaceGradient(globalUv, resolution, normalRadiusPx);
  vec2 boundedGradient = glassBoundedGradient(gradient);
  float slope = length(boundedGradient);
  vec2 stableDirection = glassStableDirection(boundedGradient);
  vec2 refractionPx = glassStableDisplacement(boundedGradient) * glassRefraction;

  vec2 centerGlobal = diffuseGlassGlobalUv(
    globalUv + refractionPx / resolution,
    globalCoord
  );
  vec4 center = sampleGlassSource(centerGlobal);
  vec3 opticalColor = glassOpticalColor(
    center, centerGlobal, stableDirection, glassChromaticAberration, glassRoughness, resolution
  );

  vec3 surfaceNormal = glassSafeNormal(boundedGradient);
  vec3 lightDirection = normalize(vec3(-0.38, 0.48, 0.79));
  // 広いローブにして、パラメータの微小変化でハイライトが点滅しないようにする。
  float specular = pow(max(dot(surfaceNormal, lightDirection), 0.0), 8.0);
  float fresnel = pow(clamp(1.0 - surfaceNormal.z, 0.0, 1.0), 2.0);
  float highlight = clamp((specular * 0.72 + fresnel * 0.48 + slope * 0.08) * glassHighlight, 0.0, 1.0);
  vec3 highlighted = vec3(1.0) - (vec3(1.0) - opticalColor) * (vec3(1.0) - highlight);

  vec4 original = sampleGlassSource(diffuseGlassGlobalUv(globalUv, globalCoord));
  vec4 result = vec4(mix(original.rgb, highlighted, glassMix), original.a);
  return applyDiffuseDither(result, globalCoord);
}

// Glass V2 uses a quintic gradient-noise field and wavelength-dependent
// screen-space refraction. It shares the bounded sampling contract with the
// original Glass effect, but keeps its field and optical composition
// independent so both layers can coexist in one stack.
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
  float complexity = glassFloat(float(u_glassComplexity), 4.0, 1.0, 5.0);
  float warp = glassFloat(u_glassWarp, 0.55, 0.0, 1.0);
  float evolution = glassFloat(u_glassEvolution, 0.0, 0.0, 1.0);
  float motion = glassFloat(u_glassMotion, 0.35, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 p = uv - vec2(0.5);
  p.x *= resolution.x / resolution.y;
  float c = cos(rotation);
  float s = sin(rotation);
  p = mat2(c, -s, s, c) * p * scale;
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
  float footprint = glassUvPixelFootprint(scale, stretch, resolution) * (1.0 + warp * 0.85);
  for (int i = 0; i < 5; i++) {
    if (float(i) >= complexity) break;
    float fi = float(i);
    float bandLimit = 1.0 - smoothstep(0.35, 0.9, clamp(finiteFloat(footprint, 0.0), 0.0, 100.0));
    value += glassV2GradientNoise(p, 71.0 + fi * 29.0) * weight * bandLimit;
    weightSum += weight * bandLimit;
    p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.93
      + vec2(11.7, -8.3) + loopOffset * (0.17 + fi * 0.04);
    footprint *= 1.93;
    weight *= 0.52;
  }
  return finiteFloat(0.5 + 0.42 * value / max(weightSum, 0.0001), 0.5);
}

float glassV2SurfaceHeight(vec2 uv) {
  uv = glassFiniteUv(uv);
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  if (influence <= 0.0) return glassV2Height(uv);
  if (influence >= 1.0) return glassNoiseHeight(uv);
  return finiteFloat(mix(glassV2Height(uv), glassNoiseHeight(uv), influence), 0.5);
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
  vec3 transmitted = refract(incident, normal, 1.0 / glassFloat(ior, 1.5, 1.0, 2.5));
  float lengthSquared = dot(transmitted, transmitted);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(0.0);
  vec2 direction = vec2(finiteFloat(transmitted.x, 0.0), finiteFloat(transmitted.y, 0.0));
  float directionLength = length(direction);
  if (!(directionLength >= 0.0) || directionLength >= 1000000000.0) return vec2(0.0);
  return direction / max(1.0, directionLength);
}

float glassCauchyIor(float wavelengthMicrometers, float chromaticAberration) {
  const float nD = 1.5;
  const float lambdaD = 0.5876;
  const float lambdaF = 0.4861;
  const float lambdaC = 0.6563;
  float amount = clamp(chromaticAberration / 40.0, 0.0, 1.0);
  float deltaFC = (nD - 1.0) * amount / 8.0;
  float inverseF = 1.0 / (lambdaF * lambdaF);
  float inverseC = 1.0 / (lambdaC * lambdaC);
  float cauchyB = deltaFC / max(inverseF - inverseC, 0.000001);
  float cauchyA = nD - cauchyB / (lambdaD * lambdaD);
  float wavelength = clamp(wavelengthMicrometers, 0.4, 0.7);
  return cauchyA + cauchyB / (wavelength * wavelength);
}

vec3 glassV2Transmission(
  vec2 baseUv,
  vec2 redOffset,
  vec2 yellowOffset,
  vec2 greenOffset,
  vec2 cyanOffset,
  vec2 blueOffset,
  vec2 roughnessOffset,
  float roughness
) {
  vec3 red = sampleGlassSource(baseUv + redOffset).rgb;
  vec3 yellow = sampleGlassSource(baseUv + yellowOffset).rgb;
  vec3 green = sampleGlassSource(baseUv + greenOffset).rgb;
  vec3 cyan = sampleGlassSource(baseUv + cyanOffset).rgb;
  vec3 blue = sampleGlassSource(baseUv + blueOffset).rgb;
  vec3 color = vec3(
    red.r * 0.72 + yellow.r * 0.28,
    yellow.g * 0.22 + green.g * 0.56 + cyan.g * 0.22,
    cyan.b * 0.28 + blue.b * 0.72
  );
  if (roughness <= 0.0001) return color;
  vec3 roughColor = (
    green +
    sampleGlassSource(baseUv + greenOffset + roughnessOffset).rgb +
    sampleGlassSource(baseUv + greenOffset - roughnessOffset).rgb
  ) / 3.0;
  return mix(color, roughColor, clamp(roughness / 12.0, 0.0, 1.0));
}

vec4 opticalGlassV2(vec2 globalUv, vec2 globalCoord) {
  float refractionPx = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float chromaticPx = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0);
  float roughnessPx = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float highlightAmount = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float mixAmount = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 gradient = glassV2SurfaceGradient(globalUv, resolution, 2.0);
  vec2 boundedGradient = glassBoundedGradient(gradient);
  vec3 normal = glassSafeNormal(boundedGradient);
  vec3 incident = vec3(0.0, 0.0, -1.0);
  float redIor = glassCauchyIor(0.6563, chromaticPx);
  float yellowIor = glassCauchyIor(0.5893, chromaticPx);
  float greenIor = glassCauchyIor(0.5461, chromaticPx);
  float cyanIor = glassCauchyIor(0.4861, chromaticPx);
  float blueIor = glassCauchyIor(0.4358, chromaticPx);
  vec2 redDirection = glassV2RefractDirection(incident, normal, redIor);
  vec2 yellowDirection = glassV2RefractDirection(incident, normal, yellowIor);
  vec2 greenDirection = glassV2RefractDirection(incident, normal, greenIor);
  vec2 cyanDirection = glassV2RefractDirection(incident, normal, cyanIor);
  vec2 blueDirection = glassV2RefractDirection(incident, normal, blueIor);
  vec2 redOffset = redDirection * (refractionPx + chromaticPx) / resolution;
  vec2 yellowOffset = yellowDirection * (refractionPx + chromaticPx) / resolution;
  vec2 greenOffset = greenDirection * refractionPx / resolution;
  vec2 cyanOffset = cyanDirection * (refractionPx + chromaticPx) / resolution;
  vec2 blueOffset = blueDirection * (refractionPx + chromaticPx) / resolution;
  vec2 tangent = glassSafeDirection(vec2(-boundedGradient.y, boundedGradient.x));
  if (length(tangent) <= 0.0001) tangent = vec2(1.0, 0.0);
  vec2 roughnessOffset = tangent * roughnessPx / resolution;
  vec2 baseUv = diffuseGlassGlobalUv(globalUv, globalCoord);
  vec3 transmission = glassV2Transmission(
    baseUv, redOffset, yellowOffset, greenOffset, cyanOffset, blueOffset, roughnessOffset, roughnessPx
  );
  float f0 = pow((greenIor - 1.0) / (greenIor + 1.0), 2.0);
  float cosTheta = clamp(dot(-incident, normal), 0.0, 1.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
  vec3 lightDirection = normalize(vec3(-0.38, 0.48, 0.79));
  vec3 halfVector = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
  float broadSpecular = pow(max(dot(normal, halfVector), 0.0), 8.0);
  float highlight = clamp((fresnel * 0.72 + broadSpecular * 0.58) * highlightAmount, 0.0, 1.0);
  vec3 highlighted = vec3(1.0) - (vec3(1.0) - transmission) * (vec3(1.0) - highlight);
  vec4 original = sampleGlassSource(baseUv);
  return applyDiffuseDither(vec4(mix(original.rgb, highlighted, mixAmount), original.a), globalCoord);
}
#endif

void main() {
  vec2 safeTileOffset = vec2(
    finiteFloat(u_tileOffset.x, 0.0),
    finiteFloat(u_tileOffset.y, 0.0)
  );
  vec2 safeFullResolution = max(vec2(
    finiteFloat(u_fullResolution.x, 1.0),
    finiteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
  vec2 globalCoord = gl_FragCoord.xy + safeTileOffset;
  vec2 globalUv = globalCoord / safeFullResolution;
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  if (u_effectEnabled && u_effectMode == 6) {
    // Diffuse panel parity: pattern dither quantizes the sampled image into
    // grain-sized cells before applying its palette threshold pattern.
    vec2 diffuseSampleCoord = u_diffuseMode == 2
      ? ditherCellCenter(globalCoord)
      : globalCoord;
    vec2 diffuseUv = diffuseGlobalUv(diffuseSampleCoord / u_fullResolution, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sourceUvFromGlobal(diffuseUv)), globalCoord);
    return;
  }
  if (u_effectEnabled && u_effectMode == 7) {
    vec2 noiseUv = stackNoiseUv(globalUv);
    gl_FragColor = texture2D(u_sourceTex, sourceUvFromGlobal(noiseUv));
    return;
  }
  if (u_effectEnabled && u_effectMode == 8) {
    vec2 slitUv = stackSlitUv(globalUv, globalCoord);
    vec2 sampleUv = u_stackSlitDiffuseAfter
      ? diffuseGlobalUv(slitUv, globalCoord)
      : slitUv;
    vec4 slitColor = texture2D(u_sourceTex, sourceUvFromGlobal(sampleUv));
    gl_FragColor = u_stackSlitDiffuseAfter
      ? applyDiffuseDither(slitColor, globalCoord)
      : slitColor;
    return;
  }
  if (u_effectEnabled && u_effectMode == 1) {
    vec2 sampleGlobalCoord = mirroredUv(globalUv) * u_fullResolution;
    vec2 sampleUv = clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
    sampleUv = diffuseSampleUv(sampleUv, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
    return;
  }
  if (u_effectEnabled && u_effectMode == 2) {
    vec2 sampleGlobalCoord = kaleidoscopeUv(globalUv) * u_fullResolution;
    vec2 sampleUv = mirrorRepeatUv((sampleGlobalCoord - u_tileOffset) / u_tileResolution);
    sampleUv = diffuseSampleUvMirrorRepeat(sampleUv, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
  if (u_effectEnabled && u_effectMode == 3) {
    gl_FragColor = applyDiffuseDither(prismRays(globalUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  if (u_effectEnabled && u_effectMode == 4) {
    vec2 voronoiUv = diffuseGlobalUv(globalUv, globalCoord);
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
    voronoiUv = legacyPostNoiseWarpUv(voronoiUv);
#endif
    gl_FragColor = applyDiffuseDither(voronoiGradient(voronoiUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_PRISM_ONLY)
#if defined(KGG_GLASS_V2_ONLY)
  if (u_effectEnabled && u_effectMode == 9) {
#elif defined(KGG_GLASS_ONLY)
  if (u_effectEnabled && u_effectMode == 5) {
#else
  if (u_effectEnabled && (u_effectMode == 5 || u_effectMode == 9)) {
#endif
    // Glass is an identity operation when its mix or all optical terms are
    // disabled. Avoid evaluating the four-point height field in that case;
    // this is common while editing the stack and prevents needless unstable
    // normal calculations at zero strength.
    if (glassFloat(u_glassMix, 1.0, 0.0, 1.0) <= 0.0001 || (
      glassFloat(u_glassRefraction, 32.0, 0.0, 120.0) <= 0.0001 &&
      glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0) <= 0.0001 &&
      glassFloat(u_glassRoughness, 1.5, 0.0, 12.0) <= 0.0001 &&
      glassFloat(u_glassHighlight, 0.45, 0.0, 2.0) <= 0.0001
    )) {
      // The Glass specialization owns the source-coordinate conversion. Keep
      // this path on the same helper as the optical path so the specialized
      // program does not depend on legacy postprocess helpers being compiled.
      gl_FragColor = sampleGlassSource(globalUv);
      return;
    }
#if defined(KGG_GLASS_V2_ONLY)
    gl_FragColor = opticalGlassV2(globalUv, globalCoord);
#else
    gl_FragColor = u_effectMode == 9
      ? opticalGlassV2(globalUv, globalCoord)
      : organicGlass(globalUv, globalCoord);
#endif
    return;
  }
#endif
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  vec2 uv = globalUv;
  if (u_effectEnabled) {
    vec4 mapSample = texture2D(u_distortMap, vec2(globalUv.x, 1.0 - globalUv.y));
    vec2 offset = (mapSample.rg * 2.0 - 1.0) * u_maxDisplacement;
    uv += offset;
  }
  vec2 sampleGlobalCoord = uv * u_fullResolution;
  vec2 sampleUv = clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
  sampleUv = diffuseSampleUv(sampleUv, globalCoord);
  gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
#endif
}
