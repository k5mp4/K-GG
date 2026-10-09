precision highp float;

// Distort Chroma: refracts the previous layers' result along the luminance
// gradient of a Lens image, and disperses colour by sampling several spectrum
// positions with different displacement amounts.
//
// The algorithm (Lens slope displacement over several spectrum positions) follows
// I_DistortChroma by panko200 (MIT, https://github.com/panko200/I_DistortChroma);
// this is an independent GLSL re-implementation for K-GG.
//
// Cost per pixel: 12 Lens taps (gradient) + u_steps Source taps. Everything is
// evaluated from global pixel coordinates, so tiled export matches the full
// frame as long as the tile padding covers the displacement.

uniform sampler2D u_sourceTex;
uniform sampler2D u_lensTex;
uniform vec2 u_resolution;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform vec2 u_amount;       // displacement in pixels, x / y
uniform float u_warpRed;     // displacement multiplier at the red end
uniform float u_warpBlue;    // displacement multiplier at the blue end
uniform int u_steps;         // 3..32 spectrum samples
uniform float u_bump;        // sensitivity to the Lens slope
uniform float u_rotate;      // radians, counter-clockwise on screen
uniform float u_tap;         // gradient tap width in pixels
uniform vec3 u_color1;       // spectrum colours (already white balanced)
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform int u_wrap;          // 0 clamp, 1 repeat, 2 mirror

const int MAX_STEPS = 32;
const vec3 LUMA_WEIGHT = vec3(0.2126, 0.7152, 0.0722);

float lensLuma(vec2 uv) {
  return dot(texture2D(u_lensTex, uv).rgb, LUMA_WEIGHT);
}

// Maps a global pixel position back into the canvas according to the wrap mode.
vec2 wrapPixel(vec2 p) {
  vec2 size = max(u_fullResolution, vec2(1.0));
  if (u_wrap == 1) return mod(p, size);
  if (u_wrap == 2) {
    vec2 period = size * 2.0;
    vec2 t = mod(p, period);
    return min(t, period - t);
  }
  return clamp(p, vec2(0.0), size);
}

// Triangular weights of Color1 / Color2 / Color3 along the spectrum t in [0, 1].
vec3 spectrumWeights(float t) {
  return vec3(
    max(1.0 - 2.0 * t, 0.0),
    1.0 - abs(2.0 * t - 1.0),
    max(2.0 * t - 1.0, 0.0)
  );
}

void main() {
  vec2 px = 1.0 / max(u_resolution, vec2(1.0));
  vec2 uv = gl_FragCoord.xy * px;
  vec2 globalPixel = gl_FragCoord.xy + u_tileOffset;

  // --- Lens slope -----------------------------------------------------------
  // Central differences of the luminance over +-tap, averaged over three
  // parallel stencils spaced by tap to suppress single-pixel noise.
  float tap = max(u_tap, 1.0);
  vec2 ldx = vec2(tap * px.x, 0.0);
  vec2 ldy = vec2(0.0, tap * px.y);
  float gx = 0.0;
  float gy = 0.0;
  for (int k = -1; k <= 1; k++) {
    float fk = float(k);
    vec2 offY = ldy * fk;
    vec2 offX = ldx * fk;
    gx += lensLuma(uv + ldx + offY) - lensLuma(uv - ldx + offY);
    gy += lensLuma(uv + ldy + offX) - lensLuma(uv - ldy + offX);
  }
  // Luminance change per pixel.
  vec2 grad = vec2(gx, gy) * (0.5 / (3.0 * tap));
  float gmag = length(grad);

  // Subtract the 8-bit quantisation floor, then saturate softly so a steep
  // edge cannot throw samples arbitrarily far.
  float floorNoise = 0.75 / (255.0 * tap);
  float soft = max(gmag - floorNoise, 0.0) * max(u_bump, 0.0);
  float slope = soft / (1.0 + soft);
  vec2 warpDir = gmag > 1e-6 ? -(grad / gmag) * slope : vec2(0.0);

  float cs = cos(u_rotate);
  float sn = sin(u_rotate);
  vec2 dispField = vec2(
    warpDir.x * cs - warpDir.y * sn,
    warpDir.x * sn + warpDir.y * cs
  );

  // --- Spectrum accumulation ----------------------------------------------
  int steps = int(clamp(float(u_steps), 3.0, float(MAX_STEPS)));
  float invSpan = 1.0 / float(steps - 1);

  // Each colour's weight is normalised by its total over all steps, so an
  // undisplaced pixel accumulates exactly Color1 + Color2 + Color3.
  vec3 totals = vec3(0.0);
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= steps) break;
    totals += spectrumWeights(float(i) * invSpan);
  }
  totals = max(totals, vec3(1e-4));

  vec3 accum = vec3(0.0);
  float alphaSum = 0.0;
  float alphaNorm = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= steps) break;
    float t = float(i) * invSpan;
    vec3 hw = spectrumWeights(t) / totals;
    vec3 col = u_color1 * hw.x + u_color2 * hw.y + u_color3 * hw.z;
    float warp = mix(u_warpRed, u_warpBlue, t);

    vec2 sampled = wrapPixel(globalPixel + dispField * u_amount * warp);
    vec4 s = texture2D(u_sourceTex, (sampled - u_tileOffset) * px);

    accum += col * s.rgb;
    float scalarWeight = (col.r + col.g + col.b) * (1.0 / 3.0);
    alphaSum += scalarWeight * s.a;
    alphaNorm += scalarWeight;
  }

  float alpha = alphaNorm > 1e-5 ? clamp(alphaSum / alphaNorm, 0.0, 1.0) : texture2D(u_sourceTex, uv).a;
  gl_FragColor = vec4(clamp(accum, 0.0, 1.0), alpha);
}
