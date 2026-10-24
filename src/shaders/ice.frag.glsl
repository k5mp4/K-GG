// Ice: the previous texture seen through a full-screen ice surface.
// A procedural surface noise texture drives two maps: a bump map (partial,
// bevelled uplifts plus fine grain over everything) and a roughness map
// (glossy and frosted patches). The inner structure (thickness, cracks,
// frost, bubbles) comes from the shared Material Field, prepended as
// material-field.glsl. Every reference into the source stays inside the KTD5
// radii (refraction + dispersion + roughness), which the tile padding
// reserves. Optics are composed in linear light: the 8-bit input is decoded
// as sRGB, and the output alpha is always the input alpha at this pixel.

uniform sampler2D u_sourceTex;
uniform vec2 u_resolution;      // Viewport of this pass (a tile during tiled export).
uniform vec2 u_fullResolution;  // Final output size.
uniform vec2 u_tileOffset;
uniform float u_mix;
uniform float u_refractionPx;   // Maximum refracted displacement in output pixels.
uniform float u_dispersionPx;   // Maximum extra per-channel displacement.
uniform float u_roughnessPx;    // Maximum blur radius.
uniform float u_roughness;      // Mean roughness.
uniform float u_roughnessVariation;
uniform float u_noiseScale;     // Surface noise cells per screen height.
uniform float u_bump;
uniform float u_bumpCoverage;
uniform float u_bevel;
uniform float u_microBump;
uniform float u_highlight;
uniform float u_backlight;
uniform float u_reflection;
uniform float u_ior;
uniform float u_absorption;
uniform float u_scattering;
uniform vec3 u_absorptionColor; // Linear.
uniform vec3 u_scatterColor;    // Linear.
uniform float u_lightAngle;     // 2*pi*(lightCycles*time + lightPhase).

const float ICE_PI = 3.14159265359;
const float ICE_TAU = 6.28318530718;
const float MACRO_HEIGHT = 0.12;   // Uplift height in screen heights at Bump 1.
const float MICRO_HEIGHT = 0.002;  // Grain height in screen heights at Micro Bump 1.
const float MICRO_FREQUENCY = 14.0;

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

// Surface noise domain: the shared Seed, warp, and periodic morph, rescaled
// to the Ice noise scale so the bump map follows the same loop as the field.
vec2 surfaceDomain(vec2 p) {
  vec2 q = mfDomain(p);
  return (q - u_mfSeedOffset) * (u_noiseScale / max(u_mfScale, 1.0e-3)) + u_mfSeedOffset * 0.37;
}

// Raised share of the surface in [0, 1]: thresholded noise plateaus whose
// rims are rounded by the bevel width, so only some areas lift. A smooth
// low-frequency noise with a little detail gives rounded patches rather
// than a labyrinth.
float upliftMask(vec2 s) {
  float t = 0.5 + 0.5 * (0.8 * mfGradientNoise(s * 0.5 + vec2(41.0, 3.0), 151.0) + 0.2 * mfGradientNoise(s * 1.4 + vec2(7.0, 13.0), 153.0));
  float threshold = 1.0 - u_bumpCoverage;
  float bevelWidth = mix(0.01, 0.25, u_bevel);
  return smoothstep(threshold - bevelWidth, threshold + bevelWidth, t);
}

// Height in screen heights: bevelled uplifts with shallow melt dimples, plus
// fine grain over the whole sheet. The grain fades out where its cells would
// be smaller than a few output pixels, which would only alias.
float surfaceHeight(vec2 s, float microFade) {
  float uplift = upliftMask(s);
  float melt = smoothstep(0.35, 0.8, 0.5 + 0.5 * mfGradientNoise(s * 1.7 + vec2(9.0, 27.0), 157.0));
  float macro = u_bump * MACRO_HEIGHT * (uplift * (0.85 + 0.15 * mfGradientNoise(s * 2.3, 159.0)) - 0.3 * melt * (1.0 - uplift));
  float micro = u_microBump * MICRO_HEIGHT * microFade * mfFbm(s * MICRO_FREQUENCY + vec2(5.0, 61.0), 167.0);
  return macro + micro;
}

// Roughness map in [0, 1]: Variation blends the uniform mean towards a
// two-state map of glossy and frosted patches. Frost always roughens, and
// melted uplifts stay a little glossier.
float roughnessMap(vec2 s, float frost, float uplift) {
  float patches = smoothstep(0.42, 0.58, 0.5 + 0.5 * mfFbm(s * 0.45 + vec2(71.0, 23.0), 163.0));
  float rough = mix(u_roughness, mix(u_roughness * 0.25, min(1.0, u_roughness * 1.6 + 0.35), patches), u_roughnessVariation);
  rough = mix(rough, rough * 0.6, 0.5 * uplift);
  return clamp(rough + 0.6 * frost, 0.0, 1.0);
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

  // Inner structure from the shared field.
  vec2 q = mfDomain(p);
  float thickness = mfThicknessDistance(q);
  float crack = mfCrackDensity(q, pixelCells);
  float frost = mfFrostDensity(q);
  float bubble = mfBubbleDensity(q, pixelCells);

  // Bump map: one-pixel central differences in full-output space.
  float pixelsPerMicroCell = height / max(u_noiseScale * MICRO_FREQUENCY, 1.0e-3);
  float microFade = smoothstep(1.5, 4.0, pixelsPerMicroCell);
  float e = 1.0 / height;
  vec2 s0 = surfaceDomain(p);
  float hx = surfaceHeight(surfaceDomain(p + vec2(e, 0.0)), microFade) - surfaceHeight(surfaceDomain(p - vec2(e, 0.0)), microFade);
  float hy = surfaceHeight(surfaceDomain(p + vec2(0.0, e)), microFade) - surfaceHeight(surfaceDomain(p - vec2(0.0, e)), microFade);
  vec2 slope = vec2(hx, hy) / (2.0 * e);
  float uplift = upliftMask(s0);
  // A small periodic tilt from the light phase keeps the refracted image
  // drifting inside the fixed relief.
  vec2 tiltPhase = vec2(
    mfGradientNoise(s0 * 0.17 + vec2(2.3, 8.1), 101.0),
    mfGradientNoise(s0 * 0.17 + vec2(6.7, 3.9), 103.0)
  ) * ICE_PI;
  vec2 tilt = 0.05 * u_bump * vec2(sin(u_lightAngle + tiltPhase.x), cos(u_lightAngle + tiltPhase.y));
  vec3 n = normalize(vec3(-(slope + tilt), 1.0));
  float slopeAmount = clamp(1.0 - n.z, 0.0, 1.0);
  float rough = roughnessMap(s0, frost, uplift);

  // Refraction (IOR, about 1.31 for ice), softly bounded so the offset never
  // exceeds the reserved radius (no tan blow-up near grazing angles).
  vec3 r = refract(vec3(0.0, 0.0, -1.0), n, 1.0 / max(u_ior, 1.0));
  vec2 lateral = r.xy / max(-r.z, 0.2);
  vec2 rawBend = lateral * (0.5 + 0.5 * thickness) * 14.0;
  vec2 bend = rawBend / (1.0 + length(rawBend));
  vec2 offset = bend * u_refractionPx;
  vec2 dispersion = bend * u_dispersionPx;

  vec3 sharp = vec3(
    sampleOr(globalPx + offset + dispersion, originLinear).r,
    sampleOr(globalPx + offset, originLinear).g,
    sampleOr(globalPx + offset - dispersion, originLinear).b
  );
  // Rough patches blur what is seen through them; glossy patches stay sharp.
  vec3 refracted = sharp;
  if (rough > 0.0 && u_roughnessPx > 0.0) {
    float radius = u_roughnessPx * rough;
    vec3 blurred = sampleOr(globalPx + offset + vec2(radius, 0.0), sharp)
      + sampleOr(globalPx + offset + vec2(-radius, 0.0), sharp)
      + sampleOr(globalPx + offset + vec2(0.0, radius), sharp)
      + sampleOr(globalPx + offset + vec2(0.0, -radius), sharp);
    refracted = mix(sharp, blurred * 0.25, rough);
  }

  // Absorption (a faint blue body) and single scattering from the inner
  // structure share one extinction. With both coefficients at zero the sheet
  // transmits everything and scatters nothing; removing absorption keeps the
  // white of cracks, frost, and bubbles.
  vec3 sigmaA = u_absorption * (vec3(1.0) - u_absorptionColor);
  float sigmaS = u_scattering * (0.45 * crack + 1.0 * frost + 0.6 * bubble);
  vec3 extinction = sigmaA + vec3(sigmaS);
  // Raised areas are thicker ice, so they hold a little more colour and white.
  float pathLength = thickness + 1.2 * u_bump * uplift;
  vec3 transmittance = exp(-extinction * pathLength);
  vec3 scatterFraction = vec3(sigmaS) / max(extinction, vec3(1.0e-4)) * (vec3(1.0) - transmittance);

  vec3 sky = vec3(0.7, 0.75, 0.82);
  vec3 incident = 0.5 * sky + 0.5 * refracted;
  vec3 scattered = scatterFraction * u_scatterColor * incident;
  // Frosted patches cloud the surface itself, independent of the thickness.
  float haze = (1.0 - exp(-1.5 * rough * rough * u_scattering)) * 0.45;
  vec3 body = mix(transmittance * refracted + scattered, u_scatterColor * incident, haze);

  // Backlight: light behind the sheet leaks through slopes, bevelled rims,
  // and cracks, strongest on the side facing the light.
  vec2 lightDir = vec2(cos(u_lightAngle), sin(u_lightAngle));
  float facing = 0.5 + 0.5 * dot(normalize(n.xy + vec2(1.0e-5)), -lightDir);
  float rim = smoothstep(0.02, 0.2, slopeAmount);
  vec3 backColor = mix(vec3(0.85, 0.93, 1.0), u_absorptionColor, 0.35);
  vec3 backGlow = u_backlight * backColor * (rim * facing * facing * 0.45 + crack * 0.12 + bubble * 0.1) * (1.0 - 0.5 * rough);

  // Fresnel from the IOR, exaggerated by Reflection but never above 0.85, so
  // reflection takes its share from transmission instead of adding on top.
  // Rough patches see a blurred, flatter environment.
  float cosTheta = clamp(n.z, 0.0, 1.0);
  float f0 = pow((u_ior - 1.0) / (u_ior + 1.0), 2.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
  float reflectance = clamp(fresnel * u_reflection * 8.0, 0.0, 0.85);
  vec3 reflectDir = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 env = mix(environment(reflectDir, p), sky, rough * 0.7);

  // Sharp specular highlight from a front light that turns with the light
  // phase. Its lobe widens and dims on rough patches (GGX distribution).
  vec3 light = normalize(vec3(-lightDir * 0.55, 0.65));
  vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
  float alpha = mix(0.03, 0.45, rough);
  float a2 = alpha * alpha;
  float nh = clamp(dot(n, halfVector), 0.0, 1.0);
  float denom = nh * nh * (a2 - 1.0) + 1.0;
  float ggx = a2 / (ICE_PI * denom * denom);
  float specular = u_highlight * min(ggx * (f0 + (1.0 - f0) * pow(1.0 - clamp(dot(halfVector, light), 0.0, 1.0), 5.0)) * 0.6, 4.0);

  vec3 iceLinear = (1.0 - reflectance) * body + reflectance * env + backGlow + vec3(specular);
  vec3 result = mix(originLinear, iceLinear, u_mix);
  gl_FragColor = vec4(linearToSrgb(result), origin.a);
}
