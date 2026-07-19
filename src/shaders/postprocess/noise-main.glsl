float noiseFiniteFloat(float value, float fallback) {
  return value == value && abs(value) < 1000000000.0 ? value : fallback;
}

void main() {
  vec2 safeResolution = max(vec2(
    noiseFiniteFloat(u_fullResolution.x, 1.0),
    noiseFiniteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
  vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
  vec2 globalUv = globalCoord / safeResolution;
  vec2 noiseUv = stackNoiseUv(globalUv);
  vec2 sampleUv = clamp(
    (noiseUv * safeResolution - u_tileOffset) / u_tileResolution,
    0.0,
    1.0
  );
  gl_FragColor = texture2D(u_sourceTex, sampleUv);
}
