#if !defined(KGG_LIGHTWEIGHT) && !defined(KGG_GLASS_ONLY)
float angleDistance(float a, float b) {
  float d = abs(mod(a - b + PI, 2.0 * PI) - PI);
  return d;
}

vec3 prismRamp(float t, float hueShift) {
  vec3 centerColor = texture2D(u_gradientRamp, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
  vec3 splitColor = vec3(
    texture2D(u_gradientRamp, vec2(clamp(t + hueShift, 0.0, 1.0), 0.5)).r,
    texture2D(u_gradientRamp, vec2(clamp(t, 0.0, 1.0), 0.5)).g,
    texture2D(u_gradientRamp, vec2(clamp(t - hueShift, 0.0, 1.0), 0.5)).b
  );
  vec3 warmShift = texture2D(u_gradientRamp, vec2(clamp(t + hueShift * 2.0, 0.0, 1.0), 0.5)).rgb;
  vec3 coolShift = texture2D(u_gradientRamp, vec2(clamp(t - hueShift * 2.0, 0.0, 1.0), 0.5)).rgb;
  return max(mix(centerColor, splitColor, 0.7), max(warmShift, coolShift) * 0.45);
}

float prismGradientT(vec2 uv, float local, float rayHash) {
  float t = local + (rayHash - 0.5) * 0.08 * u_prismRandomness;

  if (u_noiseEnabled) {
    float loopAngle = prismPeriodicPhase() * 2.0 * PI;
    float driftAmount = mix(0.28, 1.25, clamp(u_prismSpeed / 3.0, 0.0, 1.0));
    vec2 drift = vec2(cos(loopAngle + u_noiseEvolution), sin(loopAngle + u_noiseEvolution * 0.73));
    float n = colorFbm(uv * max(u_noiseScale, 0.001) + drift * driftAmount + u_noiseEvolution * 0.12);
    t += (n - 0.5) * u_noiseAmount * 0.45;
  }

  return clamp(t, 0.0, 1.0);
}

vec4 prismRays(vec2 uv) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 p = uv - u_prismCenter;
  p.x *= aspect;

  float radius = length(p);
  float angle = atan(p.y, p.x);
  float rays = clamp(floor(u_prismRayCount + 0.5), 1.0, 96.0);
  float sector = (2.0 * PI) / rays;
  float baseIndex = floor((angle + PI) / sector);

  vec3 color = vec3(0.0);
  float alpha = 0.0;
  for (int i = -1; i <= 1; i++) {
    float rayIndex = baseIndex + float(i);
    float h0 = animatedHash11(rayIndex + 1.0, 0.0);
    float h1 = animatedHash11(rayIndex + 17.0, 1.0);
    float h2 = animatedHash11(rayIndex + 43.0, 2.0);
    float h3 = animatedHash11(rayIndex + 89.0, 3.0);
    float h4 = animatedHash11(rayIndex + 131.0, 4.0);

    float rayAngle = (rayIndex + 0.5) * sector - PI;
    rayAngle += (h0 - 0.5) * sector * 0.9 * u_prismRandomness;

    float inner = max(u_prismInnerRadius * (0.55 + h4 * 0.9 * u_prismRandomness), 0.0);
    float lengthJitter = mix(1.0, 0.45 + h1 * 1.1, clamp(u_prismLengthRandomness, 0.0, 1.0));
    float rayLength = max(inner + 0.02, u_prismLength * lengthJitter);
    float local = clamp((radius - inner) / max(rayLength - inner, 0.001), 0.0, 1.0);
    float width = max(u_prismWidth * (0.55 + h2 * 1.25 * u_prismRandomness), 0.0005);
    float taperedWidth = width * mix(0.35, 1.35, pow(local, 0.85));
    float feather = max(width * mix(0.6, 4.0, clamp(u_prismBlur, 0.0, 1.0)), 0.0008);

    float angular = 1.0 - smoothstep(taperedWidth, taperedWidth + feather, angleDistance(angle, rayAngle));
    float radialHead = smoothstep(inner, inner + feather * 6.0, radius);
    float radialTail = 1.0 - smoothstep(rayLength - feather * 8.0, rayLength + feather * 8.0, radius);
    float core = pow(max(1.0 - abs(local - (0.42 + h3 * 0.32)) * 1.6, 0.0), 1.5);
    float mask = angular * radialHead * radialTail * mix(0.45, 1.0, core);

    float rampT = prismGradientT(uv, local, h0);
    vec3 rayColor = prismRamp(rampT, 0.035 + h2 * 0.055);
    float brightness = 0.45 + h1 * 0.95;
    float whiteCore = pow(angular, 7.0) * radialHead * radialTail * (0.25 + core * 0.75);
    float rayAlpha = clamp(mask * brightness + whiteCore * 0.35, 0.0, 1.0);
    color += rayColor * mask * brightness * (1.0 + whiteCore * 0.8);
    alpha = max(alpha, rayAlpha);
  }

  float vignette = 1.0 - smoothstep(u_prismLength * 0.95, u_prismLength * 1.35, radius);
  return vec4(color * vignette, clamp(alpha * vignette, 0.0, 1.0));
}
#endif

