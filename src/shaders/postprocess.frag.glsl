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
  vec2 anchorA = rotateUnitUv(u_gradAnchor0, cellAngle);
  vec2 anchorB = rotateUnitUv(u_gradAnchor1, cellAngle);
  vec2 axis = anchorB - anchorA;
  vec2 localUv = p - nearestCell;
  float t = dot(localUv - anchorA, axis) / max(dot(axis, axis), 0.0001);
  t = (t - 0.5) * max(u_postVoronoiGradientScale, 0.001) + 0.5;
  t += (cellPhase - 0.5) * 0.18;
  vec4 color = texture2D(u_gradientRamp, vec2(clamp(t, 0.0, 1.0), 0.5));

  float edgeWidth = clamp(u_postVoronoiEdgeWidth, 0.0, 0.2);
  if (edgeWidth > 0.0) {
    float edge = smoothstep(0.0, edgeWidth, f2 - f1);
    vec3 edgeColor = texture2D(u_gradientRamp, vec2(clamp(cellPhase, 0.0, 1.0), 0.5)).rgb;
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

float glassHash(float value) {
  return fract(sin(value * 127.1 + glassFloat(u_glassSeed, 0.0, 0.0, 99.0) * 311.7) * 43758.5453123);
}

float glassHeight(vec2 uv) {
  float glassScale = glassFloat(u_glassScale, 3.2, 0.5, 12.0);
  float glassStretch = glassFloat(u_glassStretch, 4.0, 0.25, 8.0);
  float glassRotation = glassFloat(u_glassRotation, 0.0, -6.28318530718, 6.28318530718);
  float glassComplexity = glassFloat(float(u_glassComplexity), 4.0, 1.0, 5.0);
  float glassWarp = glassFloat(u_glassWarp, 0.55, 0.0, 1.0);
  float glassEvolution = glassFloat(u_glassEvolution, 0.0, 0.0, 1.0);
  float glassMotion = glassFloat(u_glassMotion, 0.35, 0.0, 1.0);
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
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
    vec2 direction = normalize(vec2(1.0, directionJitter));
    float harmonic = fi + 1.0;
    float animatedPhase = glassMotion * (
      sin(phase * harmonic + glassHash(fi + 31.0) * 2.0 * PI) +
      cos(phase * (harmonic + 1.0) + glassHash(fi + 47.0) * 2.0 * PI)
    );
    float wave = sin(dot(p, direction) * frequency * 2.0 * PI
      + glassHash(fi + 61.0) * 2.0 * PI
      + animatedPhase);
    float ridge = 1.0 - abs(wave);
    ridge = ridge * ridge * (3.0 - 2.0 * ridge);
    height += ridge * amplitude;
    amplitudeSum += amplitude;

    p = mat2(0.86, -0.51, 0.51, 0.86) * p * 1.73
      + vec2(3.1, -2.7)
      + flow * (0.11 + fi * 0.035);
    frequency *= 1.31;
    amplitude *= 0.54;
  }
  return height / max(amplitudeSum, 0.0001);
}

vec2 glassNoiseDomain(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 p = uv - vec2(0.5);
  p.x *= aspect;
  p *= max(glassFloat(u_noiseScale, 1.0, 0.001, 1000000.0), 0.001);

  vec2 direction = length(u_animDir) > 0.0001
    ? normalize(u_animDir)
    : vec2(0.0, -1.0);
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
    float exponent = clamp(u_voronoiMinkowskiExp, 0.25, 8.0);
    return pow(pow(ad.x, exponent) + pow(ad.y, exponent), 1.0 / exponent);
  }
  return length(delta);
}

float glassVoronoiScalar(vec2 p) {
  vec2 baseCell = floor(p);
  vec2 local = fract(p);
  float first = 10.0;
  float second = 10.0;
  float randomness = clamp(u_voronoiRandomness, 0.0, 1.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = vec2(float(x), float(y));
      vec2 randomPoint = hash22(baseCell + cell, u_noiseSeed);
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
  float strength = clamp(abs(u_dwInitAmp), 0.0, 4.0);
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
  float sharpness = clamp(u_ridgeSharpness, 0.5, 6.0);
  float lacunarity = clamp(u_ridgeLacunarity, 1.01, 4.0);
  float persistence = clamp(u_ridgePersistence, 0.01, 1.0);
  float offset = clamp(u_ridgeOffset, 0.0, 2.0);
  float warp = clamp(u_ridgeWarp, 0.0, 4.0);
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
  float scaling = clamp(u_aeSubScaling, 1.01, 4.0);
  float influence = clamp(u_aeSubInfluence, 0.01, 1.0);
  float c = cos(u_aeSubRotation);
  float s = sin(u_aeSubRotation);
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
  return clamp((result - 0.5) * max(u_aeContrast, 0.0) + 0.5 + u_aeBrightness, 0.0, 1.0);
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
  return mix(0.5, clamp(pattern, 0.0, 1.0), amount);
}

float glassSurfaceHeight(vec2 uv) {
  float influence = glassFloat(u_glassNoiseInfluence, 0.0, 0.0, 1.0);
  if (influence <= 0.0) return glassHeight(uv);
  if (influence >= 1.0) return glassNoiseHeight(uv);
  return mix(glassHeight(uv), glassNoiseHeight(uv), influence);
}

vec2 diffuseGlassGlobalUv(vec2 uv, vec2 globalCoord) {
  if (!u_diffuseEnabled || u_diffuseMode == 2) return mirrorRepeatUv(uv);
  return mirrorRepeatUv(
    uv + diffusePanelDisplacement(globalCoord) * u_diffuseScatter
      / max(u_fullResolution, vec2(1.0))
  );
}

vec4 sampleGlassSource(vec2 globalUv) {
  vec2 mirrored = mirrorRepeatUv(globalUv);
  vec2 sampleGlobalCoord = mirrored * u_fullResolution;
  vec2 sampleUv = (sampleGlobalCoord - u_tileOffset) / u_tileResolution;
  return texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0));
}

vec4 organicGlass(vec2 globalUv, vec2 globalCoord) {
  float glassRefraction = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float glassChromaticAberration = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0);
  float glassRoughness = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float glassHighlight = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float glassMix = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 pixel = 1.0 / max(u_fullResolution, vec2(1.0));
  // 広めの中心差分で高周波リッジを空間的に安定化し、Scale/Rotation/Noiseの
  // 連続操作中に隣接ピクセル間で屈折方向が反転するのを抑える。
  const float normalRadiusPx = 4.0;
  vec2 normalStep = pixel * normalRadiusPx;
  float hLeft = glassSurfaceHeight(globalUv - vec2(normalStep.x, 0.0));
  float hRight = glassSurfaceHeight(globalUv + vec2(normalStep.x, 0.0));
  float hDown = glassSurfaceHeight(globalUv - vec2(0.0, normalStep.y));
  float hUp = glassSurfaceHeight(globalUv + vec2(0.0, normalStep.y));
  vec2 gradient = vec2(hRight - hLeft, hUp - hDown)
    * min(u_fullResolution.x, u_fullResolution.y)
    / (normalRadiusPx * 2.0);
  float gradientLength = length(gradient);
  // 正規化方向とslopeを別々に計算せず、有界な連続ベクトルへ直接変換する。
  // 勾配ゼロ付近の方向反転によるスペキュラの点滅を防ぐ。
  vec2 boundedGradient = gradient * (0.085 / (1.0 + gradientLength * 0.085));
  float slope = length(boundedGradient);
  vec2 refractionDirection = slope > 0.00001
    ? boundedGradient / slope
    : vec2(0.0);
  vec2 refractionPx = boundedGradient * glassRefraction;

  vec2 centerGlobal = diffuseGlassGlobalUv(
    globalUv + refractionPx / max(u_fullResolution, vec2(1.0)),
    globalCoord
  );
  vec4 center = sampleGlassSource(centerGlobal);
  vec3 opticalColor = center.rgb;

  if (glassChromaticAberration > 0.0001 && gradientLength > 0.00001) {
    vec2 aberrationUv = refractionDirection * glassChromaticAberration
      / max(u_fullResolution, vec2(1.0));
    vec4 redSample = sampleGlassSource(centerGlobal + aberrationUv);
    vec4 blueSample = sampleGlassSource(centerGlobal - aberrationUv);
    opticalColor = vec3(redSample.r, center.g, blueSample.b);
  }

  if (glassRoughness > 0.0001) {
    vec2 tangent = gradientLength > 0.00001
      ? vec2(-refractionDirection.y, refractionDirection.x)
      : vec2(1.0, 0.0);
    vec2 roughnessUv = tangent * glassRoughness / max(u_fullResolution, vec2(1.0));
    vec3 roughColor = (
      center.rgb +
      sampleGlassSource(centerGlobal + roughnessUv).rgb +
      sampleGlassSource(centerGlobal - roughnessUv).rgb
    ) / 3.0;
    opticalColor = mix(opticalColor, roughColor, clamp(glassRoughness / 12.0, 0.0, 1.0));
  }

  vec3 surfaceNormal = normalize(vec3(-boundedGradient * 2.4, 1.0));
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
#endif

void main() {
  vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
  vec2 globalUv = globalCoord / u_fullResolution;
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
    gl_FragColor = texture2D(u_sourceTex, sourceUvFromGlobal(slitUv));
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
  if (u_effectEnabled && u_effectMode == 5) {
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
    gl_FragColor = organicGlass(globalUv, globalCoord);
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
