void main() {
  vec2 safeTileOffset = vec2(
    finiteFloat(u_tileOffset.x, 0.0),
    finiteFloat(u_tileOffset.y, 0.0)
  );
  vec2 safeFullResolution = max(vec2(
    finiteFloat(u_fullResolution.x, 1.0),
    finiteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
  vec2 globalCoord = gl_FragCoord.xy + safeTileOffset;
  vec2 globalUv = globalCoord / safeFullResolution;
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  if (u_effectEnabled && u_effectMode == 6) {
    // Diffuse panel parity: pattern dither quantizes the sampled image into
    // grain-sized cells before applying its palette threshold pattern.
    vec2 diffuseSampleCoord = u_diffuseMode == 2
      ? ditherCellCenter(globalCoord)
      : globalCoord;
    vec2 diffuseUv = diffuseGlobalUv(diffuseSampleCoord / u_fullResolution, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sourceUvFromGlobal(diffuseUv)), globalCoord);
    return;
  }
#if !defined(KGG_STACK_CORE_NO_NOISE)
  if (u_effectEnabled && u_effectMode == 7) {
    vec2 noiseUv = stackNoiseUv(globalUv);
    gl_FragColor = texture2D(u_sourceTex, sourceUvFromGlobal(noiseUv));
    return;
  }
#endif
  if (u_effectEnabled && u_effectMode == 8) {
    vec2 slitUv = stackSlitUv(globalUv, globalCoord);
    vec2 sampleUv = u_stackSlitDiffuseAfter
      ? diffuseGlobalUv(slitUv, globalCoord)
      : slitUv;
    vec4 slitColor = texture2D(u_sourceTex, sourceUvFromGlobal(sampleUv));
    gl_FragColor = u_stackSlitDiffuseAfter
      ? applyDiffuseDither(slitColor, globalCoord)
      : slitColor;
    return;
  }
  if (u_effectEnabled && u_effectMode == 1) {
    vec2 sampleGlobalCoord = mirroredUv(globalUv) * u_fullResolution;
    vec2 sampleUv = clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
    sampleUv = diffuseSampleUv(sampleUv, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
    return;
  }
  if (u_effectEnabled && u_effectMode == 2) {
    vec2 sampleGlobalCoord = kaleidoscopeUv(globalUv) * u_fullResolution;
    vec2 sampleUv = mirrorRepeatUv((sampleGlobalCoord - u_tileOffset) / u_tileResolution);
    sampleUv = diffuseSampleUvMirrorRepeat(sampleUv, globalCoord);
    gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
  if (u_effectEnabled && u_effectMode == 3) {
    gl_FragColor = applyDiffuseDither(prismRays(globalUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  if (u_effectEnabled && u_effectMode == 4) {
    vec2 voronoiUv = diffuseGlobalUv(globalUv, globalCoord);
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
    voronoiUv = legacyPostNoiseWarpUv(voronoiUv);
#endif
    gl_FragColor = applyDiffuseDither(voronoiGradient(voronoiUv), globalCoord);
    return;
  }
#endif
#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_PRISM_ONLY)
#if defined(KGG_LEGACY_GLASS_ONLY)
  if (u_effectEnabled && u_effectMode == 5) {
#elif defined(KGG_GLASS_V2_ONLY)
  if (u_effectEnabled && u_effectMode == 9) {
#else
  if (u_effectEnabled && (u_effectMode == 5 || u_effectMode == 9)) {
#endif
    // Glass is an identity operation when its mix or all optical terms are
    // disabled. Avoid evaluating the four-point height field in that case;
    // this is common while editing the stack and prevents needless unstable
    // normal calculations at zero strength.
    if (glassFloat(u_glassMix, 1.0, 0.0, 1.0) <= 0.0001 || (
      glassFloat(u_glassRefraction, 32.0, 0.0, 120.0) <= 0.0001 &&
      glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0) <= 0.0001 &&
      glassFloat(u_glassRoughness, 1.5, 0.0, 12.0) <= 0.0001 &&
      glassFloat(u_glassHighlight, 0.45, 0.0, 2.0) <= 0.0001
    )) {
      // The Glass specialization owns the source-coordinate conversion. Keep
      // this path on the same helper as the optical path so the specialized
      // program does not depend on legacy postprocess helpers being compiled.
      gl_FragColor = sampleGlassSource(globalUv);
      return;
    }
#if defined(KGG_LEGACY_GLASS_ONLY)
    gl_FragColor = organicGlass(globalUv, globalCoord);
#elif defined(KGG_GLASS_V2_ONLY)
    gl_FragColor = opticalGlassV2(globalUv, globalCoord);
#else
    gl_FragColor = u_effectMode == 9
      ? opticalGlassV2(globalUv, globalCoord)
      : organicGlass(globalUv, globalCoord);
#endif
    return;
  }
#endif
#if !defined(KGG_GLASS_ONLY) && !defined(KGG_PRISM_ONLY)
  vec2 uv = globalUv;
  if (u_effectEnabled) {
    vec4 mapSample = texture2D(u_distortMap, vec2(globalUv.x, 1.0 - globalUv.y));
    vec2 offset = (mapSample.rg * 2.0 - 1.0) * u_maxDisplacement;
    uv += offset;
  }
  vec2 sampleGlobalCoord = uv * u_fullResolution;
  vec2 sampleUv = clamp((sampleGlobalCoord - u_tileOffset) / u_tileResolution, 0.0, 1.0);
  sampleUv = diffuseSampleUv(sampleUv, globalCoord);
  gl_FragColor = applyDiffuseDither(texture2D(u_sourceTex, sampleUv), globalCoord);
#endif
}
