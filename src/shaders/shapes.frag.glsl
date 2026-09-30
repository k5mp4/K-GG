#version 300 es
precision highp float;

// SANDBOX Shapes: turns an SVG silhouette into one continuous luminance
// field and maps it through the Gradient Ramp, like a thermal image or a
// depth pass. The stage runs after every other stage (see renderShapesPass)
// and reads only the alpha of the shape mask.
//
//   1. Smooth outline – the mask alpha blurred by u_softness
//   2. Inner shadow   – a depth that rises from 0 at the edge to 1 inside,
//                       optionally shifted away from the light
//   3. Fill motion    – looping flow noise / depth ripples / warped stripes /
//                       K-GG frame luminance, modulating the interior
//   4. Aura           – the widely blurred alpha continues the field outside,
//                       so the edge has no step: core → edge → aura → background
//   5. Luminance → Gradient Ramp (with contrast and grain)
//
// All lengths are fractions of the shape's shorter content side
// (u_shapeUnit pixels), so the look does not depend on the SVG's own units or
// on the output resolution. Coordinates are global (gl_FragCoord + tile
// offset), so tiled exports match the full frame.
//
// The blur is a 25-tap ring kernel on the mask's mipmaps: the mip level
// pre-filters to about half the ring spacing, the rings approximate a
// Gaussian (sigma ≈ 0.75 × radius). This keeps any radius at a constant cost.

uniform sampler2D u_frameTex;
uniform sampler2D u_maskTex;
uniform sampler2D u_rampTex;

uniform vec2 u_resolution;
uniform vec2 u_tileOffset;
uniform vec2 u_maskSize;
uniform vec2 u_shapeCenter;
uniform vec2 u_shapeExtent;
uniform vec2 u_contentHalf;
uniform float u_shapeUnit;
uniform float u_rotation;

uniform float u_softness;
uniform float u_innerShadow;
uniform float u_innerShadowSize;
uniform float u_shadowOffset;
uniform float u_lightAngle;

uniform int u_fillSource;
uniform float u_fillAmount;
uniform float u_fillScale;
uniform float u_fillWarp;
uniform float u_fillAngle;
uniform float u_fillPhase;

uniform float u_glowRadius;
uniform float u_glowIntensity;
uniform float u_contrast;
uniform float u_grain;
uniform int u_transparentBackground;

uniform float u_revealOpacity;
uniform float u_revealGlowScale;
uniform float u_wipeAngle;
uniform vec2 u_wipeRange;
uniform float u_wipeSoftness;

out vec4 fragColor;

const float TAU = 6.28318530718;
const int FILL_FLOW = 0;
const int FILL_RIPPLE = 1;
const int FILL_STRIPES = 2;
const int FILL_RENDER = 3;

vec2 rotate2d(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Local (rotated, bottom-up, pixels) → mask UV (top-down rows).
vec2 localToMaskUv(vec2 local) {
  vec2 q = local / u_shapeExtent + 0.5;
  return vec2(q.x, 1.0 - q.y);
}

// Gaussian-like blur of the mask alpha around `uv` with a radius in frame pixels.
float blurMask(vec2 uv, float radiusPx) {
  float texelsPerPx = u_maskSize.x / max(u_shapeExtent.x, 1.0);
  float radiusTexels = radiusPx * texelsPerPx;
  if (radiusTexels < 1.0) return texture(u_maskTex, uv).a;
  float lod = max(log2(radiusTexels * 0.5), 0.0);
  // Radius in UV units on each axis (mask UV y is flipped, the kernel is symmetric).
  vec2 radiusUv = vec2(radiusPx) / u_shapeExtent;
  float sum = textureLod(u_maskTex, uv, lod).a;
  float weight = 1.0;
  for (int ring = 1; ring <= 3; ring++) {
    float distance = 0.5 * float(ring);
    // sigma = 0.75 radius → exp(-d² / (2 σ²)) with d in radius units.
    float w = exp(-(distance * distance) / 1.125);
    float twist = float(ring) * 0.3927;
    for (int tap = 0; tap < 8; tap++) {
      float angle = twist + float(tap) * 0.78539816;
      vec2 offset = vec2(cos(angle), sin(angle)) * distance * radiusUv;
      sum += textureLod(u_maskTex, uv + offset, lod).a * w;
      weight += w;
    }
  }
  return sum / weight;
}

// --- Loopable 3D gradient noise -------------------------------------------

vec3 hash33(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6))
  );
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0));
  float n100 = dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
  float n010 = dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
  float n110 = dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
  float n001 = dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
  float n101 = dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
  float n011 = dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
  float n111 = dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

// Three octaves, roughly in -1..1.
float fbm(vec3 p) {
  float sum = 0.0;
  float amplitude = 0.55;
  for (int octave = 0; octave < 3; octave++) {
    sum += gradientNoise(p) * amplitude;
    p = p * 2.03 + vec3(17.1, 9.2, 3.7);
    amplitude *= 0.5;
  }
  return sum;
}

// Time moves the sample point once around a circle in noise space per cycle,
// so phase 0 and 1 are the same frame and the motion never stops.
vec2 loopOffset(float radius) {
  float angle = TAU * u_fillPhase;
  return vec2(cos(angle), sin(angle)) * radius;
}

// Domain-warped flow: an organic, fluid field in 0..1.
float flowField(vec2 q) {
  vec2 loop = loopOffset(0.65);
  vec2 warp = vec2(
    fbm(vec3(q + loop, 1.7)),
    fbm(vec3(q + vec2(5.2, 1.3) - loop.yx, 9.1))
  );
  float value = fbm(vec3(q + u_fillWarp * 1.6 * warp + loop * 0.5, 3.3));
  return clamp(0.5 + 0.9 * value, 0.0, 1.0);
}

// Bands that follow the depth and travel inwards, warped by the flow noise.
float rippleField(vec2 q, float depthField) {
  float bands = 2.0 / max(u_fillScale, 0.05);
  float warp = fbm(vec3(q * 0.8 + loopOffset(0.4), 5.5)) * u_fillWarp;
  return 0.5 + 0.5 * cos(TAU * (depthField * bands * 0.5 - u_fillPhase) + warp * 3.0);
}

// Straight bands in u_fillAngle that never stop, bent by the flow noise.
float stripeField(vec2 shapePos, vec2 q) {
  vec2 direction = vec2(cos(u_fillAngle), sin(u_fillAngle));
  float warp = fbm(vec3(q * 0.8 + loopOffset(0.4), 7.7)) * u_fillWarp;
  float coord = dot(shapePos, direction) / max(u_fillScale, 0.05) - u_fillPhase + warp;
  return 0.5 + 0.5 * cos(TAU * coord);
}

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Stable per-pixel hash (integer-ish inputs) for the grain.
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Linear up to the knee, then rolls off towards 1, so hot cores approach the
// Ramp's high end without clipping into a flat patch.
float softKnee(float value) {
  const float knee = 0.75;
  if (value <= knee) return max(value, 0.0);
  return knee + (1.0 - knee) * (1.0 - exp(-(value - knee) / (1.0 - knee)));
}

float wipeMask(vec2 shapePos, float softness) {
  vec2 direction = vec2(cos(u_wipeAngle), sin(u_wipeAngle));
  float extent = abs(direction.x) * u_contentHalf.x + abs(direction.y) * u_contentHalf.y;
  float s = dot(shapePos, direction) / max(2.0 * extent, 1e-4) + 0.5;
  float start = smoothstep(u_wipeRange.x - softness, u_wipeRange.x + softness, s);
  float end = 1.0 - smoothstep(u_wipeRange.y - softness, u_wipeRange.y + softness, s);
  return start * end;
}

void main() {
  vec2 frameUv = gl_FragCoord.xy / max(u_resolution, vec2(1.0));
  vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
  vec2 local = rotate2d(globalCoord - u_shapeCenter, -u_rotation);
  vec2 maskUv = localToMaskUv(local);
  vec2 shapePos = local / max(u_shapeUnit, 1.0);

  float field = 0.0;
  float coverage = 0.0;
  // The aura may reach past the padded mask; samples there read the
  // transparent border texels, so only pixels far outside are skipped.
  bool nearShape = all(greaterThanEqual(maskUv, vec2(-0.5))) && all(lessThanEqual(maskUv, vec2(1.5)));

  if (nearShape && u_revealOpacity > 0.001) {
    float bodyWipe = wipeMask(shapePos, u_wipeSoftness);
    float glowWipe = wipeMask(shapePos, u_wipeSoftness * 3.0);

    // 1. Smooth outline.
    float softPx = max(u_softness * u_shapeUnit, 0.75);
    float body = blurMask(maskUv, softPx);

    // 2. Inner shadow: depth rises continuously from the edge towards the
    // inside. Averaging three blur scales approximates a smoothed distance to
    // the edge, so the field keeps changing deep inside instead of reaching a
    // plateau. The offset moves it away from the light for a lit / shaded side.
    float shadowPx = max(u_innerShadowSize * u_shapeUnit, 1.0);
    vec2 lightDir = rotate2d(vec2(cos(u_lightAngle), sin(u_lightAngle)), -u_rotation);
    vec2 shadowUv = maskUv + vec2(lightDir.x, -lightDir.y) * shadowPx * u_shadowOffset / u_shapeExtent;
    float blurred = (
      blurMask(shadowUv, shadowPx * 0.5)
      + blurMask(shadowUv, shadowPx)
      + blurMask(shadowUv, shadowPx * 2.0)
    ) / 3.0;
    float depth = clamp((blurred - 0.5) * 2.0, 0.0, 1.0);
    float inner = body * mix(1.0, depth, u_innerShadow);

    // 3. Fill motion, 0.5 = neutral.
    vec2 q = shapePos / max(u_fillScale, 0.05);
    float fill;
    if (u_fillSource == FILL_RENDER) {
      fill = luminance(texture(u_frameTex, frameUv).rgb);
    } else if (u_fillSource == FILL_RIPPLE) {
      fill = rippleField(q, depth);
    } else if (u_fillSource == FILL_STRIPES) {
      fill = stripeField(shapePos, q);
    } else {
      fill = flowField(q);
    }
    // Multiplicative in the core, additive towards the edge, so the motion is
    // visible across the whole shape and still fades out with the outline.
    float interior = clamp(
      inner * mix(1.0, 0.25 + 1.5 * fill, u_fillAmount)
        + u_fillAmount * (fill - 0.5) * 0.5 * body,
      0.0,
      1.0
    );

    // 4. Aura: the wide blur is about 0.5 at the edge, rises inside and falls
    // outside, so the field has no step or plateau from core to background.
    float glowPx = u_glowRadius * u_revealGlowScale * u_shapeUnit;
    float glowAlpha = glowPx > 0.5 ? blurMask(maskUv, glowPx) : body;
    float aura = glowAlpha * u_glowIntensity * glowWipe;

    field = softKnee(0.45 * aura + 0.55 * interior * bodyWipe) * u_revealOpacity;
    coverage = clamp(max(aura, body * bodyWipe), 0.0, 1.0) * u_revealOpacity;
  }

  // 5. Luminance → Gradient Ramp, with film grain in the luminance.
  field = pow(clamp(field, 0.0, 1.0), u_contrast);
  field = clamp(field + (hash12(floor(globalCoord)) - 0.5) * u_grain, 0.0, 1.0);
  vec3 color = texture(u_rampTex, vec2(field, 0.5)).rgb;
  float alpha = u_transparentBackground == 1 ? coverage : 1.0;
  fragColor = vec4(color, alpha);
}
