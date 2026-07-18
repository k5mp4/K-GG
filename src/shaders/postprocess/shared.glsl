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

