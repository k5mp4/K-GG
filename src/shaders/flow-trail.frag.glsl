precision highp float;

uniform sampler2D u_densityTex;
uniform sampler2D u_previousTrailTex;
uniform vec2 u_resolution;
uniform float u_retention;

float sampleSmoothDensity(vec2 uv) {
  vec2 texel = 1.5 / u_resolution;
  vec2 outer = texel * 2.0;
  float value = texture2D(u_densityTex, uv).r * 36.0;
  value += texture2D(u_densityTex, uv + vec2(texel.x, 0.0)).r * 24.0;
  value += texture2D(u_densityTex, uv - vec2(texel.x, 0.0)).r * 24.0;
  value += texture2D(u_densityTex, uv + vec2(0.0, texel.y)).r * 24.0;
  value += texture2D(u_densityTex, uv - vec2(0.0, texel.y)).r * 24.0;
  value += texture2D(u_densityTex, uv + texel).r * 16.0;
  value += texture2D(u_densityTex, uv - texel).r * 16.0;
  value += texture2D(u_densityTex, uv + vec2(texel.x, -texel.y)).r * 16.0;
  value += texture2D(u_densityTex, uv + vec2(-texel.x, texel.y)).r * 16.0;
  value += texture2D(u_densityTex, uv + vec2(outer.x, 0.0)).r * 6.0;
  value += texture2D(u_densityTex, uv - vec2(outer.x, 0.0)).r * 6.0;
  value += texture2D(u_densityTex, uv + vec2(0.0, outer.y)).r * 6.0;
  value += texture2D(u_densityTex, uv - vec2(0.0, outer.y)).r * 6.0;
  value += texture2D(u_densityTex, uv + vec2(outer.x, texel.y)).r * 4.0;
  value += texture2D(u_densityTex, uv + vec2(outer.x, -texel.y)).r * 4.0;
  value += texture2D(u_densityTex, uv - vec2(outer.x, texel.y)).r * 4.0;
  value += texture2D(u_densityTex, uv - vec2(outer.x, -texel.y)).r * 4.0;
  value += texture2D(u_densityTex, uv + vec2(texel.x, outer.y)).r * 4.0;
  value += texture2D(u_densityTex, uv + vec2(-texel.x, outer.y)).r * 4.0;
  value += texture2D(u_densityTex, uv - vec2(texel.x, outer.y)).r * 4.0;
  value += texture2D(u_densityTex, uv - vec2(-texel.x, outer.y)).r * 4.0;
  value += texture2D(u_densityTex, uv + outer).r;
  value += texture2D(u_densityTex, uv - outer).r;
  value += texture2D(u_densityTex, uv + vec2(outer.x, -outer.y)).r;
  value += texture2D(u_densityTex, uv + vec2(-outer.x, outer.y)).r;
  return value / 256.0;
}

float sampleSmoothTrail(vec2 uv) {
  vec2 texel = 1.5 / u_resolution;
  float value = texture2D(u_previousTrailTex, uv).r * 0.50;
  value += texture2D(u_previousTrailTex, uv + vec2(texel.x, 0.0)).r * 0.10;
  value += texture2D(u_previousTrailTex, uv - vec2(texel.x, 0.0)).r * 0.10;
  value += texture2D(u_previousTrailTex, uv + vec2(0.0, texel.y)).r * 0.10;
  value += texture2D(u_previousTrailTex, uv - vec2(0.0, texel.y)).r * 0.10;
  value += texture2D(u_previousTrailTex, uv + texel).r * 0.025;
  value += texture2D(u_previousTrailTex, uv - texel).r * 0.025;
  value += texture2D(u_previousTrailTex, uv + vec2(texel.x, -texel.y)).r * 0.025;
  value += texture2D(u_previousTrailTex, uv + vec2(-texel.x, texel.y)).r * 0.025;
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float density = sampleSmoothDensity(uv);
  float previous = sampleSmoothTrail(uv);
  float retention = clamp(u_retention, 0.0, 0.999);
  // Temporal Trail is an exponential moving average of the density field.
  // It keeps motion history without repeatedly adding into RGBA8 saturation.
  float trail = mix(density, previous, retention);
  gl_FragColor = vec4(trail, trail, trail, trail);
}
