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

// Triangle wave with period 2: mirrors x back and forth inside [0, 1].
float kaleidoscopeFold(float x) {
  return abs(mod(x + 1.0, 2.0) - 1.0);
}

// Lattice types (Flip, Flip Flop, Dia Cross, Triangle) tile the frame with
// mirrored cells. Slices sets the cell density (Slices / 2 cells per frame
// height) and Zoom scales the sampled source cell like the polar types.
vec2 kaleidoscopeLatticeOffset(vec2 centered, float slices) {
  float c = cos(u_kaleidoscopeRotation);
  float s = sin(u_kaleidoscopeRotation);
  vec2 rotated = vec2(c * centered.x - s * centered.y, s * centered.x + c * centered.y);
  float cell = 2.0 / slices;
  vec2 q = rotated / cell;
  vec2 local;

  if (u_kaleidoscopeType == 5) {
    // Flip: rectangular mirror cells (p2mm).
    local = vec2(kaleidoscopeFold(q.x), kaleidoscopeFold(q.y));
  } else if (u_kaleidoscopeType == 6) {
    // Flip Flop: the four cells of each 2x2 block are quarter turns of one
    // another, so the source tumbles around the block center (p4).
    vec2 b = mod(q + 1.0, 2.0) - 1.0;
    if (b.x < 0.0 && b.y >= 0.0) {
      b = vec2(b.y, -b.x);
    } else if (b.x < 0.0) {
      b = -b;
    } else if (b.y < 0.0) {
      b = vec2(-b.y, b.x);
    }
    local = b;
  } else if (u_kaleidoscopeType == 7) {
    // Dia Cross: square mirrors crossed by both diagonals (p4m).
    local = vec2(kaleidoscopeFold(q.x), kaleidoscopeFold(q.y));
    if (local.y > local.x) local = local.yx;
  } else {
    // Triangle: hexagonal cells folded into twelve mirrored 30-60-90
    // triangles, the classic three-mirror kaleidoscope (p6m). Hex edges are
    // mirror lines, so neighbouring cells meet without seams.
    vec2 h = q + vec2(0.5, 0.8660254);
    vec2 stride = vec2(1.0, 1.7320508);
    vec4 hexCell = floor(vec4(h, h - vec2(0.5, 0.8660254)) / stride.xyxy) + 0.5;
    vec4 hexDelta = vec4(h - hexCell.xy * stride, h - (hexCell.zw + 0.5) * stride);
    vec2 hex = dot(hexDelta.xy, hexDelta.xy) < dot(hexDelta.zw, hexDelta.zw) ? hexDelta.xy : hexDelta.zw;
    float wedge = PI / 3.0;
    float hexAngle = abs(mod(atan(hex.y, hex.x), wedge) - wedge * 0.5);
    local = vec2(cos(hexAngle), sin(hexAngle)) * length(hex) * 2.0;
  }

  return local * cell / max(u_kaleidoscopeZoom, 0.001);
}

vec2 kaleidoscopeUv(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 centered = uv - vec2(0.5);
  centered.x *= aspect;

  float slices = clamp(floor(u_kaleidoscopeSlices + 0.5), 2.0, 64.0);
  if (u_kaleidoscopeType == 5 || u_kaleidoscopeType == 6 || u_kaleidoscopeType == 7 || u_kaleidoscopeType == 9) {
    vec2 latticeSampled = kaleidoscopeLatticeOffset(centered, slices);
    latticeSampled.x /= aspect;
    return latticeSampled + vec2(0.5);
  }

  float sector = (2.0 * PI) / slices;
  float angle = atan(centered.y, centered.x) + u_kaleidoscopeRotation;
  float radius = length(centered) / max(u_kaleidoscopeZoom, 0.001);

  if (u_kaleidoscopeType == 1) {
    float petal = sin(angle * slices);
    radius *= 0.72 + 0.28 * abs(petal);
    angle = abs(mod(angle, sector) - sector * 0.5);
  } else if (u_kaleidoscopeType == 2) {
    float spoke = pow(abs(cos(angle * slices * 0.5)), 2.5);
    radius *= 0.62 + 0.38 * spoke;
    angle = abs(mod(angle + sector * 0.25, sector) - sector * 0.5);
  } else if (u_kaleidoscopeType == 3) {
    // Fold: Unfold's mirrored wedges, also folded back toward the center at
    // every half frame height so the source repeats as concentric bands.
    angle = abs(mod(angle, sector) - sector * 0.5);
    radius = 0.5 * kaleidoscopeFold(radius * 2.0);
  } else if (u_kaleidoscopeType == 4) {
    // Wheel: rotational copies without reflection.
    angle = mod(angle, sector);
  } else if (u_kaleidoscopeType == 8) {
    // Flipper: wedges bent by distance from the center into curved fins.
    angle = abs(mod(angle + radius * 3.0, sector) - sector * 0.5);
  } else if (u_kaleidoscopeType == 10) {
    // Tunnel: mirrored wedges with log-radius mirroring, so each octave of
    // distance repeats the same ring and Zoom travels through the tunnel.
    angle = abs(mod(angle, sector) - sector * 0.5);
    radius = 0.25 * exp2(kaleidoscopeFold(log2(max(radius, 0.00001))));
  } else {
    angle = mod(angle, sector);
    angle = abs(angle - sector * 0.5);
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

