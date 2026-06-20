#version 300 es
precision highp float;

layout(location = 0) in vec2 a_corner;
layout(location = 1) in vec4 a_seed0;
layout(location = 2) in vec4 a_seed1;

uniform vec2 u_resolution;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform vec2 u_gradAnchor0;
uniform vec2 u_gradAnchor1;
uniform vec2 u_emitterPoint;
uniform int u_emitterType;
uniform float u_time;
uniform float u_size;
uniform float u_sizeRandomness;
uniform float u_lifeCycle;
uniform float u_lifeRandom;
uniform float u_sizeOverLife;
uniform float u_speed;
uniform float u_spread;
uniform float u_turbulence;
uniform float u_opacity;
uniform float u_colorVariance;
uniform float u_direction;
uniform float u_edgeFade;
uniform float u_curlScale;
uniform float u_curlStrength;
uniform float u_curlSpeed;
uniform float u_curlEvolution;
uniform float u_radialForce;
uniform float u_radialFalloff;
uniform float u_depth;

out vec2 v_corner;
out vec2 v_sourceUv;
out float v_alpha;
out float v_spark;
out float v_depth;
out float v_colorJitter;
out float v_life;

const float PI = 3.141592653589793;

float wrap01(float v) {
  return fract(v + 1000.0);
}

vec2 wrap01(vec2 v) {
  return fract(v + vec2(1000.0));
}

float hash31(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

vec3 valueNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  vec3 n000 = vec3(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(17.0, 0.0, 0.0)), hash31(i + vec3(29.0, 0.0, 0.0)));
  vec3 n100 = vec3(hash31(i + vec3(1.0, 0.0, 0.0)), hash31(i + vec3(18.0, 0.0, 0.0)), hash31(i + vec3(30.0, 0.0, 0.0)));
  vec3 n010 = vec3(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(17.0, 1.0, 0.0)), hash31(i + vec3(29.0, 1.0, 0.0)));
  vec3 n110 = vec3(hash31(i + vec3(1.0, 1.0, 0.0)), hash31(i + vec3(18.0, 1.0, 0.0)), hash31(i + vec3(30.0, 1.0, 0.0)));
  vec3 n001 = vec3(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(17.0, 0.0, 1.0)), hash31(i + vec3(29.0, 0.0, 1.0)));
  vec3 n101 = vec3(hash31(i + vec3(1.0, 0.0, 1.0)), hash31(i + vec3(18.0, 0.0, 1.0)), hash31(i + vec3(30.0, 0.0, 1.0)));
  vec3 n011 = vec3(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(17.0, 1.0, 1.0)), hash31(i + vec3(29.0, 1.0, 1.0)));
  vec3 n111 = vec3(hash31(i + vec3(1.0, 1.0, 1.0)), hash31(i + vec3(18.0, 1.0, 1.0)), hash31(i + vec3(30.0, 1.0, 1.0)));
  vec3 x00 = mix(n000, n100, f.x);
  vec3 x10 = mix(n010, n110, f.x);
  vec3 x01 = mix(n001, n101, f.x);
  vec3 x11 = mix(n011, n111, f.x);
  return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z) * 2.0 - 1.0;
}

vec3 curlField(vec3 p) {
  float e = 0.075;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = valueNoise3(p - dx);
  vec3 px1 = valueNoise3(p + dx);
  vec3 py0 = valueNoise3(p - dy);
  vec3 py1 = valueNoise3(p + dy);
  vec3 pz0 = valueNoise3(p - dz);
  vec3 pz1 = valueNoise3(p + dz);
  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;
  return normalize(vec3(x, y, z) + vec3(0.0001));
}

void main() {
  vec2 ab = u_gradAnchor1 - u_gradAnchor0;
  float abLen = max(length(ab), 0.001);
  vec2 axis = ab / abLen;
  vec2 normal = vec2(-axis.y, axis.x);
  vec2 emitterCenter = (u_gradAnchor0 + u_gradAnchor1) * 0.5;
  float dirJitter = (a_seed1.y - 0.5) * u_spread * PI * 2.0;
  float angle = u_direction + dirJitter;
  float speed = u_speed * mix(0.18, 1.35, a_seed1.x);
  float phase = a_seed0.z * PI * 2.0;
  float randomizedLifeCycle = max(u_lifeCycle, 0.001) * mix(1.0, mix(0.35, 2.35, a_seed1.w), clamp(u_lifeRandom, 0.0, 1.0));
  float ageSeconds = mod(u_time + a_seed0.z * randomizedLifeCycle, randomizedLifeCycle);
  float life = clamp(ageSeconds / randomizedLifeCycle, 0.0, 1.0);
  float lineT = a_seed0.x;
  float lineOffset = (a_seed0.y - 0.5) * u_spread;
  vec2 burstDir = vec2(cos(phase), sin(phase));
  float burstRadius = sqrt(a_seed0.x) * mix(0.015, 0.28, clamp(u_spread, 0.0, 1.0));
  vec2 lineUv = mix(u_gradAnchor0, u_gradAnchor1, lineT) + normal * lineOffset * 0.22;
  vec2 burstUv = emitterCenter + burstDir * burstRadius;
  vec2 pointUv = u_emitterPoint;
  vec2 sourceUv = a_seed0.xy;
  if (u_emitterType == 1) {
    sourceUv = lineUv;
  } else if (u_emitterType == 2) {
    sourceUv = burstUv;
  } else if (u_emitterType == 3) {
    sourceUv = pointUv;
  }
  sourceUv = clamp(sourceUv, vec2(0.0), vec2(1.0));
  vec2 centered = sourceUv - vec2(0.5);
  float radial = length(centered);
  vec2 fieldFlowDir = vec2(cos(angle), sin(angle));
  vec2 pointFlowDir = normalize(mix(fieldFlowDir, burstDir, clamp(u_spread, 0.0, 1.0)) + vec2(0.0001));
  vec2 flowDir = u_emitterType == 1 ? axis : u_emitterType == 3 ? pointFlowDir : fieldFlowDir;

  vec3 p = vec3(centered * max(u_curlScale, 0.001), a_seed1.w * 2.0 - 1.0);
  float curlTime = ageSeconds * u_curlSpeed + u_curlEvolution;
  vec3 curl = curlField(p + vec3(curlTime * 0.09 * speed, -curlTime * 0.07 * speed, curlTime * 0.11 * speed + phase));
  float burst = (1.0 - exp(-ageSeconds * 0.45 * max(u_speed, 0.001))) * u_spread;
  vec3 world = vec3(centered, 0.0);
  float radialWeight = pow(clamp(1.0 - radial * 1.41421356, 0.0, 1.0), max(u_radialFalloff, 0.001));
  vec2 radialDir = radial > 0.0001 ? centered / radial : vec2(cos(phase), sin(phase));
  world += curl * burst * u_curlStrength * (0.18 + u_turbulence * 0.62) * mix(0.25, 1.4, a_seed1.x);
  world.xy += radialDir * u_radialForce * burst * mix(0.25, 1.35, radialWeight + a_seed1.y * 0.35);
  world.xy += flowDir * ageSeconds * speed * 0.055;
  world.xy += centered * burst * mix(0.15, 1.15, radial + a_seed1.z);
  if (u_emitterType == 2) {
    world.xy += radialDir * life * speed * u_spread * 0.18;
  } else if (u_emitterType == 3) {
    world.xy += pointFlowDir * ageSeconds * speed * 0.16;
    world.xy += burstDir * life * speed * u_spread * 0.08;
    world.z += sin(life * PI + phase) * u_depth * 0.25;
  }
  world.z += sin(ageSeconds * mix(0.55, 1.8, a_seed1.z) + phase) * u_turbulence * 0.28 * u_depth;
  world.z += ((a_seed1.w - 0.5) * u_spread * 1.15 + curl.z * burst * 0.8) * u_depth;

  float perspective = 1.0 / max(1.0 + world.z * 0.7, 0.35);
  vec2 uv = world.xy * perspective + vec2(0.5);
  vec2 globalPx = uv * u_fullResolution;

  float twinkle = 0.65 + 0.35 * sin(u_time * mix(1.5, 5.5, a_seed1.z) + phase);
  float sizeJitter = mix(1.0, mix(0.25, 2.25, a_seed0.w), clamp(u_sizeRandomness, 0.0, 1.0));
  float lifeSize = mix(1.0, max(0.0, 1.0 - life), clamp(u_sizeOverLife, 0.0, 1.0));
  float size = u_size * sizeJitter * mix(0.65, 1.25, twinkle) * lifeSize * perspective;
  vec2 localPx = globalPx - u_tileOffset;
  vec2 posPx = localPx + a_corner * size;
  vec2 clip = (posPx / u_resolution) * 2.0 - 1.0;

  gl_Position = vec4(clip, 0.0, 1.0);
  v_corner = a_corner;
  v_sourceUv = sourceUv;
  float edgeMask = mix(1.0, smoothstep(1.35, 0.2, radial), clamp(u_edgeFade, 0.0, 1.0));
  float lifeFade = smoothstep(0.0, 0.06, life) * smoothstep(1.0, 0.86, life);
  v_alpha = u_opacity * mix(0.3, 1.0, a_seed1.x) * twinkle * edgeMask * lifeFade;
  v_spark = a_seed0.z;
  v_depth = clamp(world.z * 0.5 + 0.5, 0.0, 1.0);
  v_colorJitter = (a_seed1.w - 0.5) * u_colorVariance;
  v_life = life;
}
