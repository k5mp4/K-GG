// Ice: the previous texture seen through a thin full-screen ice sheet.
// The structure comes from the shared Material Field (material-field.glsl is
// prepended). Every reference into the source stays inside the KTD5 radii
// (refraction + dispersion + roughness), which the tile padding reserves.
// Optics are composed in linear light: the 8-bit input is decoded as sRGB,
// and the output alpha is always the input alpha at this pixel.

uniform sampler2D u_sourceTex;
uniform vec2 u_resolution;      // Viewport of this pass (a tile during tiled export).
uniform vec2 u_fullResolution;  // Final output size.
uniform vec2 u_tileOffset;
uniform float u_mix;
uniform float u_refractionPx;   // Maximum refracted displacement in output pixels.
uniform float u_dispersionPx;   // Maximum extra per-channel displacement.
uniform float u_roughnessPx;    // Maximum blur radius.
uniform float u_roughness;
uniform float u_reflection;
uniform float u_ior;
uniform float u_absorption;
uniform float u_scattering;
uniform vec3 u_absorptionColor; // Linear.
uniform vec3 u_scatterColor;    // Linear.
uniform float u_lightAngle;     // 2*pi*(lightCycles*time + lightPhase).

const float ICE_PI = 3.14159265359;
const float ICE_TAU = 6.28318530718;
const float NORMAL_STEP = 0.001;   // Screen heights; matches KTD2.
const float SLOPE_GAIN = 0.25;

vec3 srgbToLinear(vec3 c) {
  vec3 low = c / 12.92;
  vec3 high = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(high, low, vec3(lessThanEqual(c, vec3(0.04045))));
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  vec3 low = c * 12.92;
  vec3 high = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(high, low, vec3(lessThanEqual(c, vec3(0.0031308))));
}

// Screen borders mirror in full-output space; tile edges never mirror.
float mirrorAxis(float x, float size) {
  float m = abs(x);
  return size - abs(size - m);
}

vec4 fetchTexel(vec2 index) {
  vec2 clamped = clamp(index, vec2(0.0), max(u_resolution - 1.0, vec2(0.0)));
  return texture2D(u_sourceTex, (clamped + 0.5) / max(u_resolution, vec2(1.0)));
}

// Alpha-weighted bilinear sample at a full-output position, in linear light.
// Transparent texels never contribute their hidden RGB. `.a` is the coverage
// of the four texels; 0 means there was nothing visible to sample.
vec4 sampleSource(vec2 globalPx) {
  vec2 g = vec2(mirrorAxis(globalPx.x, u_fullResolution.x), mirrorAxis(globalPx.y, u_fullResolution.y));
  vec2 st = g - u_tileOffset - 0.5;
  vec2 base = floor(st);
  vec2 f = st - base;
  vec4 t00 = fetchTexel(base);
  vec4 t10 = fetchTexel(base + vec2(1.0, 0.0));
  vec4 t01 = fetchTexel(base + vec2(0.0, 1.0));
  vec4 t11 = fetchTexel(base + vec2(1.0, 1.0));
  vec4 w = vec4((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  vec4 aw = w * vec4(t00.a, t10.a, t01.a, t11.a);
  float coverage = aw.x + aw.y + aw.z + aw.w;
  if (coverage <= 1.0e-5) return vec4(0.0);
  vec3 rgb = srgbToLinear(t00.rgb) * aw.x + srgbToLinear(t10.rgb) * aw.y
    + srgbToLinear(t01.rgb) * aw.z + srgbToLinear(t11.rgb) * aw.w;
  return vec4(rgb / coverage, coverage);
}

vec3 sampleOr(vec2 globalPx, vec3 fallback) {
  vec4 s = sampleSource(globalPx);
  return s.a > 0.0 ? s.rgb : fallback;
}

// Procedural environment: broad sky light plus a sharp band, both moving
// with whole turns of the light angle so the loop closes.
vec3 environment(vec3 r, vec2 p) {
  float broad = 0.5 + 0.5 * cos(ICE_TAU * (p.y * 0.35 + r.y * 0.8) - u_lightAngle);
  // The reflected direction only nudges the bands; tying them strongly to
  // the normal would draw contour lines of the relief.
  float s = dot(p, vec2(0.8, 0.6)) * 1.1 + r.x * 0.35 + r.y * 0.25;
  float band = pow(0.5 + 0.5 * cos(ICE_TAU * s - u_lightAngle), 6.0);
  return vec3(0.62, 0.70, 0.80) * (0.5 + 0.5 * broad) + vec3(1.0, 0.98, 0.95) * band * 0.9;
}

void main() {
  vec4 origin = texture2D(u_sourceTex, gl_FragCoord.xy / max(u_resolution, vec2(1.0)));
  vec3 originLinear = srgbToLinear(origin.rgb);
  vec2 globalPx = gl_FragCoord.xy + u_tileOffset;
  float height = max(u_fullResolution.y, 1.0);
  vec2 p = globalPx / height;
  float pixelCells = u_mfScale / height;

  vec2 q = mfDomain(p);
  float thickness = mfThicknessDistance(q);
  float crack = mfCrackDensity(q, pixelCells);
  float frost = mfFrostDensity(q);
  float bubble = mfBubbleDensity(q, pixelCells);

  // Surface normal from the relief, plus a small periodic tilt driven by the
  // light phase so the refracted image drifts inside the fixed structure.
  float stepCells = u_mfScale * NORMAL_STEP;
  float h0 = mfSurfaceHeight(q);
  vec2 slope = vec2(mfSurfaceHeight(q + vec2(stepCells, 0.0)) - h0, mfSurfaceHeight(q + vec2(0.0, stepCells)) - h0) / NORMAL_STEP;
  vec2 tiltPhase = vec2(
    mfGradientNoise(q * 0.17 + vec2(2.3, 8.1), 101.0),
    mfGradientNoise(q * 0.17 + vec2(6.7, 3.9), 103.0)
  ) * ICE_PI;
  vec2 tilt = 0.12 * u_mfSurface * vec2(sin(u_lightAngle + tiltPhase.x), cos(u_lightAngle + tiltPhase.y));
  vec3 n = normalize(vec3(-(slope * SLOPE_GAIN + tilt), 1.0));

  // Refraction through the sheet, softly bounded so the offset can never
  // exceed the reserved radius (no tan blow-up near grazing angles).
  vec3 r = refract(vec3(0.0, 0.0, -1.0), n, 1.0 / max(u_ior, 1.0));
  vec2 lateral = r.xy / max(-r.z, 0.2);
  vec2 rawBend = lateral * (0.5 + 0.5 * thickness) * 16.0;
  vec2 bend = rawBend / (1.0 + length(rawBend));
  vec2 offset = bend * u_refractionPx;
  vec2 dispersion = bend * u_dispersionPx;

  vec3 sharp = vec3(
    sampleOr(globalPx + offset + dispersion, originLinear).r,
    sampleOr(globalPx + offset, originLinear).g,
    sampleOr(globalPx + offset - dispersion, originLinear).b
  );
  float blurWeight = clamp(u_roughness + 0.7 * frost, 0.0, 1.0);
  vec3 refracted = sharp;
  if (blurWeight > 0.0 && u_roughnessPx > 0.0) {
    float radius = u_roughnessPx * blurWeight;
    vec3 blurred = sampleOr(globalPx + offset + vec2(radius, 0.0), sharp)
      + sampleOr(globalPx + offset + vec2(-radius, 0.0), sharp)
      + sampleOr(globalPx + offset + vec2(0.0, radius), sharp)
      + sampleOr(globalPx + offset + vec2(0.0, -radius), sharp);
    refracted = mix(sharp, blurred * 0.25, blurWeight);
  }

  // Absorption and single scattering share one extinction. With both
  // coefficients at zero the sheet transmits everything and scatters nothing;
  // removing absorption keeps the white of cracks, frost, and bubbles.
  vec3 sigmaA = u_absorption * (vec3(1.0) - u_absorptionColor);
  float sigmaS = u_scattering * (3.0 * crack + 1.0 * frost + 0.9 * bubble);
  vec3 extinction = sigmaA + vec3(sigmaS);
  vec3 transmittance = exp(-extinction * thickness);
  vec3 scatterFraction = vec3(sigmaS) / max(extinction, vec3(1.0e-4)) * (vec3(1.0) - transmittance);

  vec3 reflectDir = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 env = environment(reflectDir, p);
  vec3 incident = 0.5 * vec3(0.7, 0.75, 0.82) + 0.5 * refracted;
  vec3 scattered = scatterFraction * u_scatterColor * incident;

  // Fresnel from the IOR, exaggerated by Reflection but never above 0.85, so
  // reflection takes its share from transmission instead of adding on top.
  float cosTheta = clamp(n.z, 0.0, 1.0);
  float f0 = pow((u_ior - 1.0) / (u_ior + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
  float reflectance = clamp(fresnel * u_reflection * 8.0, 0.0, 0.85);

  vec3 iceLinear = (1.0 - reflectance) * (transmittance * refracted + scattered) + reflectance * env;
  vec3 result = mix(originLinear, iceLinear, u_mix);
  gl_FragColor = vec4(linearToSrgb(result), origin.a);
}
