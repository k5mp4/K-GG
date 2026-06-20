precision mediump float;

uniform sampler2D u_sourceTex;
uniform vec2 u_resolution;
uniform float u_bandHeight;
uniform float u_bandHeightVariance;
uniform float u_scan;
uniform float u_variation;
uniform float u_seed;
uniform int u_glowEnabled;
uniform float u_glowIntensity;
uniform float u_glowRadius;
uniform float u_glowThreshold;
uniform vec3 u_glowTint;

float hashWithSeed(float n, float seed) {
  return fract(sin(n * 41.17 + seed * 19.91) * 9173.137);
}

float hash1(float n) {
  float seedBase = floor(u_seed);
  float seedBlend = smoothstep(0.0, 1.0, fract(u_seed));
  return mix(hashWithSeed(n, seedBase), hashWithSeed(n, seedBase + 1.0), seedBlend);
}

vec4 sampleStretch(vec2 fragCoord) {
  vec2 uv = clamp(fragCoord / u_resolution, 0.0, 1.0);
  float bandH = max(u_bandHeight, 1.0);
  float baseRowPos = fragCoord.y / bandH;
  float warpRow = floor(baseRowPos);
  float warpLocal = fract(baseRowPos);
  float heightVar = clamp(u_bandHeightVariance, 0.0, 1.0);
  float heightWarp0 = hash1(warpRow + 113.7) - 0.5;
  float heightWarp1 = hash1(warpRow + 114.7) - 0.5;
  float heightWarp = mix(heightWarp0, heightWarp1, smoothstep(0.0, 1.0, warpLocal));
  float rowPos = baseRowPos + heightWarp * heightVar * 1.8;
  float row = floor(rowPos);
  float rowLocal = fract(rowPos);

  float h0 = hash1(row);
  float h1 = hash1(row + 1.0);
  float scan0 = clamp(u_scan + (h0 - 0.5) * u_variation, 0.0, 1.0);
  float scan1 = clamp(u_scan + (h1 - 0.5) * u_variation, 0.0, 1.0);
  float crossFade = smoothstep(0.82, 1.0, rowLocal) * 0.18;
  float sourceX = mix(scan0, scan1, crossFade);

  return texture2D(u_sourceTex, vec2(sourceX, uv.y));
}

vec3 glowSample(vec2 fragCoord) {
  vec3 c = sampleStretch(fragCoord).rgb;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float threshold = clamp(u_glowThreshold, 0.01, 0.99);
  float mask = smoothstep(threshold, 1.0, luma);
  vec3 source = mix(c, u_glowTint, 0.65);
  return source * mask * max(luma, 0.15);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec4 stretched = sampleStretch(fragCoord);

  if (u_glowEnabled > 0 && u_glowIntensity > 0.001) {
    float r = max(u_glowRadius, 1.0);
    vec3 glow = vec3(0.0);
    glow += glowSample(fragCoord + vec2(-r, 0.0)) * 0.08;
    glow += glowSample(fragCoord + vec2( r, 0.0)) * 0.08;
    glow += glowSample(fragCoord + vec2(0.0, -r)) * 0.08;
    glow += glowSample(fragCoord + vec2(0.0,  r)) * 0.08;
    glow += glowSample(fragCoord + vec2(-r * 0.7, -r * 0.7)) * 0.07;
    glow += glowSample(fragCoord + vec2( r * 0.7, -r * 0.7)) * 0.07;
    glow += glowSample(fragCoord + vec2(-r * 0.7,  r * 0.7)) * 0.07;
    glow += glowSample(fragCoord + vec2( r * 0.7,  r * 0.7)) * 0.07;
    glow += glowSample(fragCoord + vec2(-r * 0.42, 0.0)) * 0.10;
    glow += glowSample(fragCoord + vec2( r * 0.42, 0.0)) * 0.10;
    glow += glowSample(fragCoord + vec2(0.0, -r * 0.42)) * 0.10;
    glow += glowSample(fragCoord + vec2(0.0,  r * 0.42)) * 0.10;
    glow += glowSample(fragCoord) * 0.10;
    stretched.rgb += glow * u_glowIntensity;
  }

  gl_FragColor = vec4(clamp(stretched.rgb, 0.0, 1.0), stretched.a);
}
