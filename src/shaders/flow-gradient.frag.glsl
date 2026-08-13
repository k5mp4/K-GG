precision highp float;

uniform sampler2D u_sourceTex;
uniform sampler2D u_trailTex;
uniform sampler2D u_gradientRamp;
uniform vec2 u_resolution;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform float u_contrast;
uniform float u_flowOpacity;

const float DENSITY_RESPONSE = 6.0;
// Every splat represents the same cool-white particle material. Density is
// accumulated before this stage, so the screen-equivalent response below
// turns many overlapping particles toward white without tinting each sprite.
const vec3 PARTICLE_TINT = vec3(0.74, 0.84, 1.0);
const float PARTICLE_SCREEN_RESPONSE = 24.0;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 trailUv = (gl_FragCoord.xy + u_tileOffset) / u_fullResolution;
  vec4 source = texture2D(u_sourceTex, uv);
  float trail = clamp(texture2D(u_trailTex, trailUv).r, 0.0, 1.0);
  // Preserve the monotonic result of additive particle overlap while keeping
  // the RGBA8 density field below a binary 0/1 threshold.
  float density = 1.0 - exp(-trail * DENSITY_RESPONSE);
  float mask = pow(density, max(0.15, 1.0 / max(u_contrast, 0.15)));
  vec4 flowColor = texture2D(u_gradientRamp, vec2(mask, 0.5));
  // Keep low-density capsules visible as fine translucent strands while the
  // exponential response still drives genuinely overlapping regions to white.
  // Keep the faint outer streamlines visible; overlap still controls the
  // brighter core through the monotonic density response above.
  // Suppress sub-texel tails from isolated splats. The overlap response is
  // still evaluated above, while this softer gate keeps only a continuous
  // field instead of exposing the individual particle footprint at the edge.
  float densityMask = smoothstep(0.004, 0.025, density);
  float intensity = mix(0.28, 1.0, density);
  vec3 screenParticle = vec3(1.0) - exp(-PARTICLE_TINT * trail * PARTICLE_SCREEN_RESPONSE);
  // Let the assigned Ramp remain visible through the low/mid-density field.
  // Only genuinely overlapping particles should wash the Ramp toward white.
  float particleColorMix = 0.10 + 0.55 * smoothstep(0.18, 0.72, density);
  vec3 finalColor = mix(flowColor.rgb * intensity, screenParticle, particleColorMix);
  // Flow is a scalar color field, not a highlight over the Base gradient.
  // The source contributes coverage only; density selects the Ramp color and
  // the monochrome particle response, removing the flat background.
  float flowOpacity = clamp(u_flowOpacity, 0.0, 1.0);
  gl_FragColor = vec4(
    finalColor * densityMask * flowOpacity,
    flowColor.a * densityMask * flowOpacity
  );
}
