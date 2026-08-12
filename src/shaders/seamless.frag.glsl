precision highp float;

uniform sampler2D u_sourceTex;
uniform vec2 u_resolution;
uniform float u_blendWidth;
uniform int u_axis;

float edgeBlend(float distanceToEdge, float width) {
  float t = clamp(distanceToEdge / max(width, 0.000001), 0.0, 1.0);
  return 0.25 * (1.0 + cos(3.14159265359 * t));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 oppositeUv = uv;
  float axisCoordinate = uv.x;
  if (u_axis == 1) {
    axisCoordinate = uv.y;
    oppositeUv.y = 1.0 - uv.y;
  } else {
    oppositeUv.x = 1.0 - uv.x;
  }

  float halfPixel = 0.5 / (u_axis == 1 ? u_resolution.y : u_resolution.x);
  float distanceToEdge = max(min(axisCoordinate, 1.0 - axisCoordinate) - halfPixel, 0.0);
  float amount = edgeBlend(distanceToEdge, u_blendWidth);
  gl_FragColor = mix(
    texture2D(u_sourceTex, uv),
    texture2D(u_sourceTex, oppositeUv),
    amount
  );
}
