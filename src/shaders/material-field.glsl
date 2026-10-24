// Shared Material Field (KGG_MATERIAL_FIELD).
// A pure function of the full-output position, Seed, settings, and loop
// angle. It never reads textures, colors, or a previous frame, so any frame,
// tile, or evaluation order reproduces the same structure.
// Coordinates are expressed in screen heights: p = globalPx / u_resolution.y.
// The hashes need full precision even where the Generator defaults to mediump.
precision highp float;

uniform float u_mfSeedZ;        // Seed folded into a small hash lattice coordinate.
uniform vec2 u_mfSeedOffset;    // Seed-dependent domain offset in cells.
uniform float u_mfScale;        // Base cells per screen height.
uniform float u_mfThickness;
uniform float u_mfThicknessVariation;
uniform float u_mfCracks;
uniform float u_mfFrost;
uniform float u_mfBubbles;
uniform float u_mfWarp;
uniform float u_mfMorph;
uniform float u_mfAngle;        // 2*pi*(cycles*time + phase), evaluated once on the CPU.

const float MF_MAX_THICKNESS = 4.0;

// Sine-free hashes keep the lattice stable across GPUs and large inputs.
vec2 mfHash23(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float mfGradientNoise(vec2 p, float layer) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float z = u_mfSeedZ + layer;
  float a = dot(mfHash23(vec3(i, z)) * 2.0 - 1.0, f);
  float b = dot(mfHash23(vec3(i + vec2(1.0, 0.0), z)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
  float c = dot(mfHash23(vec3(i + vec2(0.0, 1.0), z)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
  float d = dot(mfHash23(vec3(i + vec2(1.0, 1.0), z)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
  return clamp(mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.6, -1.0, 1.0);
}

// Three fixed octaves: the octave count never changes during a frame or export.
float mfFbm(vec2 p, float layer) {
  const mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
  float value = mfGradientNoise(p, layer);
  p = rotation * p * 2.03 + vec2(5.2, 1.3);
  value += 0.5 * mfGradientNoise(p, layer + 1.0);
  p = rotation * p * 2.01 + vec2(1.7, 9.2);
  value += 0.25 * mfGradientNoise(p, layer + 2.0);
  return value / 1.75;
}

// Common domain deformation for every component. The fixed warp shapes the
// structure; the periodic part only uses integer harmonics of the loop angle,
// so the value and its time derivative match at the loop boundary.
vec2 mfDomain(vec2 p) {
  vec2 q = p * u_mfScale + u_mfSeedOffset;
  vec2 warp = vec2(mfFbm(q * 0.35 + vec2(1.7, 9.2), 11.0), mfFbm(q * 0.35 + vec2(8.3, 2.8), 17.0));
  q += warp * u_mfWarp * 1.2;
  if (u_mfMorph > 0.0) {
    vec2 spatialPhase = vec2(
      mfGradientNoise(q * 0.21 + vec2(3.1, 7.7), 23.0),
      mfGradientNoise(q * 0.21 + vec2(5.9, 1.3), 29.0)
    ) * 3.14159265;
    float a = u_mfAngle;
    vec2 motion = vec2(sin(a + spatialPhase.x), cos(a + spatialPhase.y))
      + 0.35 * vec2(sin(2.0 * a + spatialPhase.y), cos(2.0 * a - spatialPhase.x));
    q += motion * u_mfMorph * 0.35;
  }
  return q;
}

// Relative optical distance in [0, MF_MAX_THICKNESS].
float mfThicknessDistance(vec2 q) {
  float n = mfFbm(q * 0.5 + vec2(17.0, 3.0), 41.0);
  return clamp(u_mfThickness * (1.0 + u_mfThicknessVariation * n), 0.0, MF_MAX_THICKNESS);
}

// Distance to the nearest cell border in cell units (two-pass Voronoi border).
float mfCellBorder(vec2 x, float layer) {
  vec2 n = floor(x);
  vec2 f = x - n;
  float z = u_mfSeedZ + layer;
  vec2 nearestCell = vec2(0.0);
  vec2 nearestOffset = vec2(0.0);
  float nearest = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + mfHash23(vec3(n + g, z)) - f;
      float d = dot(r, r);
      if (d < nearest) {
        nearest = d;
        nearestOffset = r;
        nearestCell = g;
      }
    }
  }
  float border = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = nearestCell + vec2(float(i), float(j));
      vec2 r = g + mfHash23(vec3(n + g, z)) - f;
      vec2 delta = r - nearestOffset;
      if (dot(delta, delta) > 1.0e-5) {
        border = min(border, dot(0.5 * (nearestOffset + r), normalize(delta)));
      }
    }
  }
  return border;
}

// Band-limited line: below the pixel footprint the line keeps its average
// coverage instead of aliasing into flickering dots.
float mfLine(float dist, float halfWidth, float footprint) {
  float fp = max(footprint, 1.0e-5);
  float hw = max(halfWidth, 0.5 * fp);
  float core = 1.0 - smoothstep(hw, hw + fp, dist);
  return core * min(1.0, halfWidth / (0.5 * fp));
}

// Crack density in [0, 1]: a bright core plus a soft halo along distorted
// cell borders at two scales. The trunk-to-branch ratio is fixed; only the
// overall strength is a control. `pixelCells` is the full-output pixel
// footprint in base cells and never depends on the tile size.
float mfCrackDensity(vec2 q, float pixelCells) {
  if (u_mfCracks <= 0.0) return 0.0;
  float trunkMask = smoothstep(-0.35, 0.45, mfFbm(q * 0.23 + vec2(41.0, 13.0), 53.0));
  float branchMask = smoothstep(-0.10, 0.60, mfFbm(q * 0.40 + vec2(7.0, 29.0), 59.0));

  const float trunkScale = 0.9;
  vec2 trunkDomain = q * trunkScale + 0.25 * vec2(mfGradientNoise(q * 1.7, 61.0), mfGradientNoise(q * 1.7 + 4.0, 67.0));
  float trunkBorder = mfCellBorder(trunkDomain, 71.0) / trunkScale;
  float trunk = mfLine(trunkBorder, 0.018, pixelCells * 1.5);
  float halo = exp(-trunkBorder / 0.09) * 0.35;

  const mat2 branchRotation = mat2(0.76, 0.65, -0.65, 0.76);
  const float branchScale = 2.6;
  vec2 branchDomain = branchRotation * q * branchScale + vec2(13.1, 4.7);
  branchDomain += 0.35 * vec2(mfGradientNoise(branchDomain * 0.9, 73.0), mfGradientNoise(branchDomain * 0.9 + 3.0, 79.0));
  float branchBorder = mfCellBorder(branchDomain, 83.0) / branchScale;
  float branch = mfLine(branchBorder, 0.008, pixelCells * 1.5);

  float density = (trunk + halo) * mix(0.35, 1.0, trunkMask) + 0.6 * branch * branchMask;
  return clamp(u_mfCracks * density, 0.0, 1.0);
}

// Low-frequency frost density in [0, 1].
float mfFrostDensity(vec2 q) {
  if (u_mfFrost <= 0.0) return 0.0;
  float body = mfFbm(q * 0.7 + vec2(13.0, 57.0), 113.0);
  float grain = 0.5 + 0.5 * mfGradientNoise(q * 6.0, 127.0);
  return clamp(u_mfFrost * smoothstep(-0.25, 0.55, body) * mix(0.7, 1.0, grain), 0.0, 1.0);
}

// One layer of hashed small bubbles: a faint disk with a brighter rim,
// band-limited by the full-output pixel footprint. Density in [0, 1].
float mfBubbleDensity(vec2 q, float pixelCells) {
  if (u_mfBubbles <= 0.0) return 0.0;
  const float bubbleScale = 3.5;
  vec2 x = q * bubbleScale + vec2(7.7, 1.9);
  vec2 cell = floor(x);
  vec2 f = x - cell;
  float footprint = max(pixelCells * bubbleScale * 1.5, 1.0e-4);
  float density = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 presence = mfHash23(vec3(cell + g, u_mfSeedZ + 137.0));
      if (presence.x > u_mfBubbles * 0.7) continue;
      vec2 center = mfHash23(vec3(cell + g, u_mfSeedZ + 131.0));
      float radius = mix(0.06, 0.22, presence.y);
      float dist = length(g + center - f);
      float disk = 1.0 - smoothstep(radius - 0.5 * footprint, radius + 0.5 * footprint, dist);
      float rim = disk * smoothstep(0.4 * radius, radius, dist);
      density = max(density, 0.35 * disk + 0.65 * rim);
    }
  }
  return clamp(density, 0.0, 1.0);
}

precision mediump float;
