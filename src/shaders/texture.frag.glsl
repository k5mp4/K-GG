precision highp float;

// SANDBOX Texture: lights the Main Stack image with a height field.
// Coordinates are canvas-height units (y up, x runs 0..aspect) evaluated from
// the global pixel position, so tiled export matches the full-frame preview.

uniform sampler2D u_sourceTex;
uniform sampler2D u_textureImage;
uniform vec2 u_resolution;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform vec2 u_imageSize;
uniform int u_source;    // 0 = procedural preset, 1 = image height map
uniform int u_preset;    // 0 brushed, 1 spun, 2 cd, 3 paper
uniform int u_imageFit;  // 0 = cover, 1 = tile
uniform float u_strength;
uniform float u_scale;
uniform float u_rotation;
uniform float u_bump;
uniform vec2 u_center;
uniform float u_roughness;
uniform float u_anisotropy;
uniform float u_metallic;
uniform float u_specular;
uniform float u_lightAngle;
uniform float u_lightHeight;
uniform float u_diffraction;
uniform float u_diffractionSpread;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
// Height slope is measured over this distance so the relief does not depend
// on the output resolution.
const float SLOPE_STEP = 0.0008;
const float PROCEDURAL_SLOPE_GAIN = 0.004;
const float IMAGE_SLOPE_GAIN = 5.0;
const float LIGHT_RADIUS = 0.4;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec2 rotate2(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float aspectRatio() {
  return max(u_fullResolution.x, 1.0) / max(u_fullResolution.y, 1.0);
}

vec2 centerP() {
  return vec2(u_center.x * aspectRatio(), u_center.y);
}

// Height of the procedural presets, 0..1.
float proceduralHeight(vec2 p) {
  vec2 d = p - centerP();
  if (u_preset == 0) {
    // Brushed: fine scratches stretched along the grain direction.
    vec2 q = rotate2(d, -u_rotation) * u_scale;
    float a = valueNoise(vec2(q.x * 7.0, q.y * 380.0));
    float b = valueNoise(vec2(q.x * 19.0 + 11.7, q.y * 210.0));
    float c = valueNoise(vec2(q.x * 3.0 + 3.1, q.y * 720.0));
    return 0.5 * a + 0.3 * b + 0.2 * c;
  }
  if (u_preset == 1) {
    // Spun: concentric turning marks whose depth wanders around the disc.
    float r = length(d) * u_scale;
    float a = valueNoise(vec2(r * 260.0, 0.5));
    float b = valueNoise(vec2(r * 610.0 + 5.0, 2.7));
    float wander = 0.7 + 0.6 * valueNoise(p * 6.0);
    return 0.5 + (0.6 * a + 0.4 * b - 0.5) * wander;
  }
  if (u_preset == 2) {
    // CD: one spiral track. The phase jumps by exactly one turn at the atan
    // seam, so the cosine profile stays continuous.
    float r = length(d) * u_scale;
    float phase = r * 260.0 - atan(d.y, d.x) / TAU;
    float groove = 0.5 + 0.5 * cos(TAU * phase);
    float dust = valueNoise(vec2(phase * 2.0, r * 40.0));
    return mix(groove, dust, 0.12);
  }
  // Paper: overlapping fibres plus low-frequency cloudiness.
  vec2 w = p * u_scale;
  float n1 = valueNoise(w * 90.0);
  float n2 = valueNoise(rotate2(w, 0.7) * 140.0 + 3.0);
  float n3 = valueNoise(rotate2(w, -0.5) * vec2(40.0, 320.0) + 9.0);
  float n4 = valueNoise(w * 14.0);
  return 0.3 * n1 + 0.25 * n2 + 0.25 * n3 + 0.2 * n4;
}

// UV of the loaded image at canvas position p (before flipping v for upload).
vec2 imageUv(vec2 p) {
  float imageAspect = max(u_imageSize.x, 1.0) / max(u_imageSize.y, 1.0);
  if (u_imageFit == 1) {
    vec2 q = rotate2(p - centerP(), -u_rotation);
    float tileH = 1.0 / max(u_scale, 0.001);
    return q / vec2(tileH * imageAspect, tileH) + 0.5;
  }
  float outputAspect = aspectRatio();
  vec2 uv = p / vec2(outputAspect, 1.0);
  vec2 cover = uv;
  if (outputAspect > imageAspect) {
    cover.y = 0.5 + (uv.y - 0.5) * imageAspect / outputAspect;
  } else {
    cover.x = 0.5 + (uv.x - 0.5) * outputAspect / imageAspect;
  }
  return cover;
}

// Distance in canvas units covered by about 1.5 image texels, so the slope
// comes from real image differences instead of a sub-texel bilinear ramp.
float imageStep() {
  float imageAspect = max(u_imageSize.x, 1.0) / max(u_imageSize.y, 1.0);
  float texel = 1.0 / max(u_imageSize.y, 1.0);
  float uvPerCanvasHeight = 1.0;
  if (u_imageFit == 1) {
    uvPerCanvasHeight = max(u_scale, 0.001);
  } else if (aspectRatio() > imageAspect) {
    uvPerCanvasHeight = imageAspect / aspectRatio();
  }
  return max(1.5 * texel / uvPerCanvasHeight, SLOPE_STEP);
}

float imageHeight(vec2 p) {
  vec2 uv = imageUv(p);
  vec3 rgb = texture2D(u_textureImage, vec2(uv.x, 1.0 - uv.y)).rgb;
  return dot(rgb, vec3(0.299, 0.587, 0.114));
}

float heightAt(vec2 p) {
  return u_source == 1 ? imageHeight(p) : proceduralHeight(p);
}

// Grain direction in canvas space.
vec2 grainDirection(vec2 p) {
  bool radial = u_source == 0 && (u_preset == 1 || u_preset == 2);
  if (radial) {
    vec2 d = p - centerP();
    float len = length(d);
    if (len < 0.0001) return vec2(1.0, 0.0);
    return vec2(-d.y, d.x) / len;
  }
  return vec2(cos(u_rotation), sin(u_rotation));
}

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(TAU * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec2 sourceUv = gl_FragCoord.xy / max(u_resolution, vec2(1.0));
  vec4 source = texture2D(u_sourceTex, sourceUv);
  vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
  vec2 p = globalCoord / max(u_fullResolution.y, 1.0);

  float slopeStep = u_source == 1 ? imageStep() : SLOPE_STEP;
  float h0 = heightAt(p);
  float hx = heightAt(p + vec2(slopeStep, 0.0));
  float hy = heightAt(p + vec2(0.0, slopeStep));
  vec2 slope = vec2(hx - h0, hy - h0);
  // Image relief scales with the height difference across ~1.5 texels;
  // procedural relief with the slope per canvas unit (CD grooves are shallow).
  vec2 tilt = u_source == 1
    ? slope * IMAGE_SLOPE_GAIN
    : slope / SLOPE_STEP * PROCEDURAL_SLOPE_GAIN * (u_preset == 2 ? 0.35 : 1.0);
  vec3 n = normalize(vec3(-tilt * u_bump, 1.0));

  float lightAngle = u_lightAngle;
  vec2 lightCenter = vec2(0.5 * aspectRatio(), 0.5);
  vec3 lightPos = vec3(lightCenter + LIGHT_RADIUS * vec2(cos(lightAngle), sin(lightAngle)), u_lightHeight);
  vec3 l = normalize(lightPos - vec3(p, 0.0));
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 hv = normalize(l + v);

  vec2 grain = grainDirection(p);
  vec3 t3 = vec3(grain, 0.0);
  t3 = normalize(t3 - n * dot(t3, n));
  vec3 b3 = cross(n, t3);

  float nh = max(dot(n, hv), 0.05);
  float hT = dot(hv, t3) / nh;
  float hB = dot(hv, b3) / nh;
  // Grooves are smooth along the grain and rough across it.
  float alphaT = max(u_roughness * (1.0 - 0.85 * u_anisotropy), 0.02);
  float alphaB = max(u_roughness * (1.0 + 0.6 * u_anisotropy), 0.02);
  float lobe = exp(-(hT * hT / (alphaT * alphaT) + hB * hB / (alphaB * alphaB)));
  float nl = max(dot(n, l), 0.0);
  float spec = lobe * nl * u_specular;

  vec3 base = source.rgb;
  float peak = max(max(base.r, base.g), max(base.b, 0.05));
  vec3 specTint = mix(vec3(1.0), base / peak, u_metallic);
  float relief = dot(n, l) - l.z;
  vec3 lit = base * (1.0 + relief * 1.6 * (1.0 - 0.5 * u_metallic));
  lit *= 1.0 - 0.25 * u_metallic;
  lit += specTint * spec * 0.9;

  if (u_diffraction > 0.0) {
    // Grating equation: the colour follows the light component across the
    // grooves, so it swirls around a CD and shifts as the light sweeps.
    float across = dot(l.xy, vec2(-grain.y, grain.x));
    float phase = across * u_diffractionSpread * 1.6 + (h0 - 0.5) * 0.25;
    float order = 0.2 + 0.8 * smoothstep(0.0, 0.6, abs(across));
    float wide = exp(-(hT * hT / (alphaT * alphaT * 6.0) + hB * hB / (alphaB * alphaB * 6.0)));
    lit += spectrum(phase) * u_diffraction * order * (0.4 + 0.6 * wide) * 0.7;
  }

  gl_FragColor = vec4(mix(base, lit, u_strength), source.a);
}
