vec4 sampleGlassSource(vec2 globalUv) {
  vec2 resolution = glassResolution();
  vec2 tileOffset = vec2(
    finiteFloat(u_tileOffset.x, 0.0),
    finiteFloat(u_tileOffset.y, 0.0)
  );
  vec2 mirrored = mirrorRepeatUv(glassFiniteUv(globalUv));
  vec2 sampleGlobalCoord = mirrored * resolution;
  vec2 sampleUv = (sampleGlobalCoord - tileOffset) / glassTileSize();
  return texture2D(u_sourceTex, clamp(sampleUv, 0.0, 1.0));
}

#if !defined(KGG_GLASS_V2_ONLY)
vec2 glassSurfaceGradient(vec2 globalUv, vec2 resolution, float radiusPx) {
  vec2 stepUv = radiusPx / resolution;
  float hLeft = glassSurfaceHeight(globalUv - vec2(stepUv.x, 0.0));
  float hRight = glassSurfaceHeight(globalUv + vec2(stepUv.x, 0.0));
  float hDown = glassSurfaceHeight(globalUv - vec2(0.0, stepUv.y));
  float hUp = glassSurfaceHeight(globalUv + vec2(0.0, stepUv.y));
  return vec2(hRight - hLeft, hUp - hDown) / (radiusPx * 2.0) * min(resolution.x, resolution.y);
}
#endif

vec2 glassBoundedGradient(vec2 gradient) {
  gradient = vec2(finiteFloat(gradient.x, 0.0), finiteFloat(gradient.y, 0.0));
  float gradientLength = length(gradient);
  if (!(gradientLength > 0.000001) || gradientLength >= 1000000000.0) return vec2(0.0);
  // Preserve small slopes at approximately unit gain. Only large gradients
  // are compressed by the rational denominator, avoiding the refactor
  // regression that reduced every displacement to 8.5% of its intended size.
  return gradient / (1.0 + gradientLength * 0.085);
}

float glassCauchyIor(float wavelengthMicrometers, float chromaticAberration) {
  // Two-term Cauchy dispersion. The existing Chromatic Aberration control is
  // mapped to an effective Abbe-like spread while n_d remains fixed at 1.5.
  // At zero every wavelength has exactly the same IOR.
  const float nD = 1.5;
  const float lambdaD = 0.5876;
  const float lambdaF = 0.4861;
  const float lambdaC = 0.6563;
  float amount = clamp(chromaticAberration / 40.0, 0.0, 1.0);
  float deltaFC = (nD - 1.0) * amount / 8.0;
  float inverseF = 1.0 / (lambdaF * lambdaF);
  float inverseC = 1.0 / (lambdaC * lambdaC);
  float cauchyB = deltaFC / max(inverseF - inverseC, 0.000001);
  float cauchyA = nD - cauchyB / (lambdaD * lambdaD);
  float wavelength = clamp(wavelengthMicrometers, 0.4, 0.7);
  return cauchyA + cauchyB / (wavelength * wavelength);
}

#if !defined(KGG_GLASS_V2_ONLY)
vec2 glassStableDirection(vec2 boundedGradient) {
  boundedGradient = vec2(
    finiteFloat(boundedGradient.x, 0.0),
    finiteFloat(boundedGradient.y, 0.0)
  );
  float slope = length(boundedGradient);
  // Keep the optical direction and its strength in one continuous vector.
  // This removes the direction flip that occurs when a finite difference
  // crosses zero while a gradient anchor or Glass parameter is dragged.
  const float directionSoftness = 0.02;
  return boundedGradient / (slope + directionSoftness);
}

vec2 glassStableDisplacement(vec2 boundedGradient) {
  boundedGradient = vec2(
    finiteFloat(boundedGradient.x, 0.0),
    finiteFloat(boundedGradient.y, 0.0)
  );
  float slope = length(boundedGradient);
  if (!(slope > 0.000001) || slope >= 1000000000.0) return vec2(0.0);

  // Refraction is expressed in pixels by the UI and by tile padding. Keep
  // the procedural slope as a continuous strength factor in [0, 1), so a
  // strong normal cannot multiply a 120px control into a multi-canvas jump.
  return boundedGradient / (1.0 + slope);
}

vec3 glassSpectralColor(
  vec4 center,
  vec2 centerGlobal,
  vec2 stableDirection,
  float chromaticAberration,
  float roughness,
  vec2 resolution
) {
  vec3 opticalColor = center.rgb;
  if (chromaticAberration > 0.0001) {
    float redIor = glassCauchyIor(0.6563, chromaticAberration);
    float yellowIor = glassCauchyIor(0.5893, chromaticAberration);
    float greenIor = glassCauchyIor(0.5461, chromaticAberration);
    float cyanIor = glassCauchyIor(0.4861, chromaticAberration);
    float blueIor = glassCauchyIor(0.4358, chromaticAberration);
    float iorSpan = max(blueIor - redIor, 0.000001);
    vec2 aberrationUv = stableDirection * chromaticAberration * 2.0 / resolution;
    vec4 redSample = sampleGlassSource(centerGlobal + aberrationUv * ((greenIor - redIor) / iorSpan));
    vec4 yellowSample = sampleGlassSource(centerGlobal + aberrationUv * ((greenIor - yellowIor) / iorSpan));
    vec4 cyanSample = sampleGlassSource(centerGlobal - aberrationUv * ((cyanIor - greenIor) / iorSpan));
    vec4 blueSample = sampleGlassSource(centerGlobal - aberrationUv * ((blueIor - greenIor) / iorSpan));
    opticalColor = vec3(
      redSample.r * 0.72 + yellowSample.r * 0.28,
      yellowSample.g * 0.22 + center.g * 0.56 + cyanSample.g * 0.22,
      cyanSample.b * 0.28 + blueSample.b * 0.72
    );
  }

  if (roughness > 0.0001) {
    vec2 tangent = vec2(-stableDirection.y, stableDirection.x);
    vec2 roughnessUv = tangent * roughness / resolution;
    vec3 roughColor = (
      center.rgb +
      sampleGlassSource(centerGlobal + roughnessUv).rgb +
      sampleGlassSource(centerGlobal - roughnessUv).rgb
    ) / 3.0;
    opticalColor = mix(opticalColor, roughColor, clamp(roughness / 12.0, 0.0, 1.0));
  }
  return opticalColor;
}

vec4 organicGlass(vec2 globalUv, vec2 globalCoord) {
  float glassRefraction = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float glassChromaticAberration = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0);
  float glassRoughness = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float glassHighlight = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float glassMix = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 resolution = glassResolution();
  const float normalRadiusPx = 4.0;
  vec2 gradient = glassSurfaceGradient(globalUv, resolution, normalRadiusPx);
  vec2 boundedGradient = glassBoundedGradient(gradient);
  float slope = length(boundedGradient);
  vec2 stableDirection = glassStableDirection(boundedGradient);
  vec2 refractionPx = glassStableDisplacement(boundedGradient) * glassRefraction;

  vec2 centerGlobal = diffuseGlassGlobalUv(
    globalUv + refractionPx / resolution,
    globalCoord
  );
  vec4 center = sampleGlassSource(centerGlobal);
  vec3 opticalColor = glassSpectralColor(
    center, centerGlobal, stableDirection, glassChromaticAberration, glassRoughness, resolution
  );

  vec3 surfaceNormal = glassSafeNormal(boundedGradient);
  vec3 lightDirection = normalize(vec3(-0.38, 0.48, 0.79));
  // 広いローブにして、パラメータの微小変化でハイライトが点滅しないようにする。
  float specular = pow(max(dot(surfaceNormal, lightDirection), 0.0), 8.0);
  float fresnel = pow(clamp(1.0 - surfaceNormal.z, 0.0, 1.0), 2.0);
  float highlight = clamp((specular * 0.72 + fresnel * 0.48 + slope * 0.08) * glassHighlight, 0.0, 1.0);
  vec3 highlighted = vec3(1.0) - (vec3(1.0) - opticalColor) * (vec3(1.0) - highlight);

  vec4 original = sampleGlassSource(diffuseGlassGlobalUv(globalUv, globalCoord));
  vec4 result = vec4(mix(original.rgb, highlighted, glassMix), original.a);
  return applyDiffuseDither(result, globalCoord);
}
#endif

#if !defined(KGG_LEGACY_GLASS_ONLY)
vec2 glassV2SurfaceGradient(vec2 globalUv, vec2 resolution, float radiusPx) {
  vec2 stepUv = radiusPx / resolution;
  float hLeft = glassV2SurfaceHeight(globalUv - vec2(stepUv.x, 0.0));
  float hRight = glassV2SurfaceHeight(globalUv + vec2(stepUv.x, 0.0));
  float hDown = glassV2SurfaceHeight(globalUv - vec2(0.0, stepUv.y));
  float hUp = glassV2SurfaceHeight(globalUv + vec2(0.0, stepUv.y));
  return vec2(hRight - hLeft, hUp - hDown) / (radiusPx * 2.0) * min(resolution.x, resolution.y);
}

vec2 glassV2RefractDirection(vec3 incident, vec3 normal, float ior) {
  float safeIor = glassFloat(ior, 1.5, 1.0, 2.5);
  vec3 transmitted = refract(incident, normal, 1.0 / safeIor);
  float lengthSquared = dot(transmitted, transmitted);
  // GLSL refract returns zero for total internal reflection. Non-finite or
  // degenerate rays use the center sample as the safe screen-space fallback.
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) return vec2(0.0);
  vec2 direction = vec2(
    finiteFloat(transmitted.x, 0.0),
    finiteFloat(transmitted.y, 0.0)
  );
  float directionLength = length(direction);
  if (!(directionLength >= 0.0) || directionLength >= 1000000000.0) return vec2(0.0);
  return direction / max(1.0, directionLength);
}

vec3 glassV2Transmission(
  vec2 baseUv,
  vec2 redOffset,
  vec2 yellowOffset,
  vec2 greenOffset,
  vec2 cyanOffset,
  vec2 blueOffset,
  vec2 roughnessOffset,
  float roughness
) {
  vec3 redCenter = sampleGlassSource(baseUv + redOffset).rgb;
  vec3 yellowCenter = sampleGlassSource(baseUv + yellowOffset).rgb;
  vec3 greenCenter = sampleGlassSource(baseUv + greenOffset).rgb;
  vec3 cyanCenter = sampleGlassSource(baseUv + cyanOffset).rgb;
  vec3 blueCenter = sampleGlassSource(baseUv + blueOffset).rgb;
  vec3 color = vec3(
    redCenter.r * 0.72 + yellowCenter.r * 0.28,
    yellowCenter.g * 0.22 + greenCenter.g * 0.56 + cyanCenter.g * 0.22,
    cyanCenter.b * 0.28 + blueCenter.b * 0.72
  );
  if (roughness <= 0.0001) return color;

  // Fixed symmetric taps approximate a rough dielectric transmission lobe
  // without introducing frame-varying noise.
  vec3 greenRough = (
    greenCenter
    + sampleGlassSource(baseUv + greenOffset + roughnessOffset).rgb
    + sampleGlassSource(baseUv + greenOffset - roughnessOffset).rgb
  ) / 3.0;
  vec3 blurred = greenRough;
  return mix(color, blurred, clamp(roughness / 12.0, 0.0, 1.0));
}

vec4 opticalGlassV2(vec2 globalUv, vec2 globalCoord) {
  float refractionPx = glassFloat(u_glassRefraction, 32.0, 0.0, 120.0);
  float chromaticPx = glassFloat(u_glassChromaticAberration, 4.0, 0.0, 40.0);
  float roughnessPx = glassFloat(u_glassRoughness, 1.5, 0.0, 12.0);
  float highlightAmount = glassFloat(u_glassHighlight, 0.45, 0.0, 2.0);
  float mixAmount = glassFloat(u_glassMix, 1.0, 0.0, 1.0);
  vec2 resolution = glassResolution();
  vec2 gradient = glassV2SurfaceGradient(globalUv, resolution, 2.0);
  vec2 boundedGradient = glassBoundedGradient(gradient);
  vec3 normal = glassSafeNormal(boundedGradient);
  vec3 incident = vec3(0.0, 0.0, -1.0);

  float redIor = glassCauchyIor(0.6563, chromaticPx);
  float yellowIor = glassCauchyIor(0.5893, chromaticPx);
  float greenIor = glassCauchyIor(0.5461, chromaticPx);
  float cyanIor = glassCauchyIor(0.4861, chromaticPx);
  float blueIor = glassCauchyIor(0.4358, chromaticPx);
  vec2 redDirection = glassV2RefractDirection(incident, normal, redIor);
  vec2 yellowDirection = glassV2RefractDirection(incident, normal, yellowIor);
  vec2 greenDirection = glassV2RefractDirection(incident, normal, greenIor);
  vec2 cyanDirection = glassV2RefractDirection(incident, normal, cyanIor);
  vec2 blueDirection = glassV2RefractDirection(incident, normal, blueIor);
  float chromaticTravelPx = chromaticPx;
  vec2 redOffset = redDirection * (refractionPx + chromaticTravelPx) / resolution;
  vec2 yellowOffset = yellowDirection * (refractionPx + chromaticTravelPx) / resolution;
  vec2 greenOffset = greenDirection * refractionPx / resolution;
  vec2 cyanOffset = cyanDirection * (refractionPx + chromaticTravelPx) / resolution;
  vec2 blueOffset = blueDirection * (refractionPx + chromaticTravelPx) / resolution;

  vec2 tangent = glassSafeDirection(vec2(-boundedGradient.y, boundedGradient.x));
  if (length(tangent) <= 0.0001) tangent = vec2(1.0, 0.0);
  vec2 roughnessOffset = tangent * roughnessPx / resolution;
  vec2 baseUv = diffuseGlassGlobalUv(globalUv, globalCoord);
  vec3 transmission = glassV2Transmission(
    baseUv, redOffset, yellowOffset, greenOffset, cyanOffset, blueOffset, roughnessOffset, roughnessPx
  );

  float f0 = pow((greenIor - 1.0) / (greenIor + 1.0), 2.0);
  float cosTheta = clamp(dot(-incident, normal), 0.0, 1.0);
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
  vec3 lightDirection = normalize(vec3(-0.38, 0.48, 0.79));
  vec3 halfVector = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
  float broadSpecular = pow(max(dot(normal, halfVector), 0.0), 8.0);
  float highlight = clamp((fresnel * 0.72 + broadSpecular * 0.58) * highlightAmount, 0.0, 1.0);
  vec3 highlighted = vec3(1.0) - (vec3(1.0) - transmission) * (vec3(1.0) - highlight);
  vec4 original = sampleGlassSource(baseUv);
  vec4 result = vec4(mix(original.rgb, highlighted, mixAmount), original.a);
  return applyDiffuseDither(result, globalCoord);
}
#endif
#endif
