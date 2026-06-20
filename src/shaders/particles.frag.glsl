#version 300 es
precision highp float;

uniform sampler2D u_sourceTex;
uniform sampler2D u_gradientRamp;
uniform float u_feather;
uniform float u_core;
uniform float u_brightness;
uniform float u_colorOverLife;
uniform int u_colorOverLifeMode;

in vec2 v_corner;
in vec2 v_sourceUv;
in float v_alpha;
in float v_spark;
in float v_depth;
in float v_colorJitter;
in float v_life;

out vec4 fragColor;

vec3 hueRotate(vec3 color, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  mat3 m = mat3(
    0.213 + c * 0.787 - s * 0.213,
    0.715 - c * 0.715 - s * 0.715,
    0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143,
    0.715 + c * 0.285 + s * 0.140,
    0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787,
    0.715 - c * 0.715 + s * 0.715,
    0.072 + c * 0.928 + s * 0.072
  );
  return clamp(m * color, 0.0, 1.0);
}

void main() {
  float d = length(v_corner);
  float feather = clamp(u_feather, 0.001, 1.0);
  float coreRadius = clamp(u_core, 0.0, 0.98);
  float core = smoothstep(1.0, coreRadius, d);
  float soft = smoothstep(1.0, max(coreRadius * 0.35, 0.02), d);
  float alpha = pow(core, mix(5.0, 0.75, feather)) * v_alpha;
  if (alpha <= 0.002) discard;

  vec4 source = texture(u_sourceTex, v_sourceUv);
  vec3 color = source.rgb;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = clamp(color + vec3(v_colorJitter, v_colorJitter * 0.35, -v_colorJitter * 0.45), 0.0, 1.0);
  float colorLife = clamp(u_colorOverLife, 0.0, 1.0);
  bool useRampLife = u_colorOverLifeMode == 1 && colorLife > 0.0;
  if (useRampLife) {
    float rampT = clamp(v_life, 0.0, 1.0);
    color = texture(u_gradientRamp, vec2(rampT, 0.5)).rgb;
  } else {
    color = hueRotate(color, (v_life - 0.5) * colorLife * 6.28318530718);
  }
  if (!useRampLife) {
    color = mix(color, color * color * 1.65, 0.35 + v_depth * 0.35);
  }
  color *= u_brightness;
  float glint = pow(max(1.0 - d, 0.0), 7.0) * (0.25 + 0.75 * v_spark);
  if (!useRampLife) {
    color = mix(color, vec3(1.0), glint * 0.38);
  }
  alpha *= source.a * (0.72 + luma * 0.55);
  fragColor = vec4(color * (0.65 + soft * 0.85), alpha);
}
