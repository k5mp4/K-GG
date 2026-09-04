float noiseDiffuseFiniteFloat(float value, float fallback) {
  return value == value && abs(value) < 1000000000.0 ? value : fallback;
}

vec2 noiseDiffuseSourceUv(vec2 globalUv, vec2 safeResolution, vec2 safeTileResolution) {
  return clamp(
    (globalUv * safeResolution - u_tileOffset) / safeTileResolution,
    0.0,
    1.0
  );
}

void main() {
  vec2 safeResolution = max(vec2(
    noiseDiffuseFiniteFloat(u_fullResolution.x, 1.0),
    noiseDiffuseFiniteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
  vec2 safeTileResolution = max(u_tileResolution, vec2(1.0));
  vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
  vec2 globalUv = globalCoord / safeResolution;
  vec2 noiseUv = stackNoiseUv(globalUv);
  vec2 sampleGlobalCoord = noiseUv * safeResolution;

  // This is the stack equivalent of the legacy Generator's
  // Noise -> Diffuse order: Noise changes the sample coordinate first, then
  // Diffuse adds its global-coordinate displacement to that coordinate.
  // Sampling the source texture for the adaptive factor at noiseUv preserves
  // the same pre-Diffuse color domain without creating an intermediate FBO.
  float diffuseScatter = clamp(u_diffuseScatter, 0.0, 300.0);
  if (u_diffuseEnabled && u_diffuseMode <= 1 && diffuseScatter > 0.0) {
    vec2 noiseSampleUv = noiseDiffuseSourceUv(noiseUv, safeResolution, safeTileResolution);
    vec3 noiseColor = texture2D(u_sourceTex, noiseSampleUv).rgb;
    float adaptiveFactor = u_diffuseAdaptiveEnabled
      ? diffuseCurveValue(diffuseAdaptiveInput(noiseColor), false)
      : 1.0;
    sampleGlobalCoord += diffusePanelDisplacement(globalCoord)
      * diffuseScatter
      * adaptiveFactor;
  }

  vec2 sampleUv = noiseDiffuseSourceUv(
    sampleGlobalCoord / safeResolution,
    safeResolution,
    safeTileResolution
  );
  gl_FragColor = texture2D(u_sourceTex, sampleUv);
}
