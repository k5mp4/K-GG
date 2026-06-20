precision mediump float;

uniform sampler2D u_baseTex;
uniform sampler2D u_glowTex;
uniform vec2 u_resolution;
uniform vec2 u_prismCenter;
uniform float u_glowIntensity;
uniform float u_chromaticAberration;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 base = texture2D(u_baseTex, uv);

  vec2 dir = uv - u_prismCenter;
  float len = length(dir);
  dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
  vec2 caOffset = dir * max(u_chromaticAberration, 0.0) / max(u_resolution, vec2(1.0));

  vec4 glowCenter = texture2D(u_glowTex, uv);
  vec4 glow = vec4(
    texture2D(u_glowTex, clamp(uv + caOffset, vec2(0.0), vec2(1.0))).r,
    glowCenter.g,
    texture2D(u_glowTex, clamp(uv - caOffset, vec2(0.0), vec2(1.0))).b,
    glowCenter.a
  );

  float glowAmount = max(u_glowIntensity, 0.0);
  float alpha = clamp(max(base.a, glow.a * min(glowAmount, 1.0)), 0.0, 1.0);
  gl_FragColor = vec4(base.rgb + glow.rgb * glowAmount, alpha);
}
