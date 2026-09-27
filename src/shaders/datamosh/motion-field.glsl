// Motion Field contract:
//   vec2 datamoshMotionField(vec2 uv)
// returns the per-frame displacement in UV units at strength 1. Content moves
// along the vector, so the history is sampled at `uv - displacement`.
// Replace this chunk to plug in another source (codec vectors, optical flow).

float dmHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 dmHash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float dmHash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

// Value noise with its analytic xy gradient: vec3(value, d/dx, d/dy).
vec3 dmValueNoiseGrad(vec3 p) {
  vec3 cell = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f.xy * (1.0 - f.xy);
  float a = dmHash13(cell);
  float b = dmHash13(cell + vec3(1.0, 0.0, 0.0));
  float c = dmHash13(cell + vec3(0.0, 1.0, 0.0));
  float d = dmHash13(cell + vec3(1.0, 1.0, 0.0));
  float e = dmHash13(cell + vec3(0.0, 0.0, 1.0));
  float g = dmHash13(cell + vec3(1.0, 0.0, 1.0));
  float h = dmHash13(cell + vec3(0.0, 1.0, 1.0));
  float k = dmHash13(cell + vec3(1.0, 1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k3 = e - a;
  float k4 = a - b - c + d;
  float k5 = a - c - e + h;
  float k6 = a - b - e + g;
  float k7 = -a + b + c - d + e - g - h + k;
  float value = a + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y
    + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z;
  vec2 gradient = du * vec2(
    k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z,
    k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x
  );
  return vec3(value, gradient);
}

// xy gradient of a 3-octave fbm. One noise evaluation per octave keeps the
// per-pixel cost low; the result is constant within a macroblock anyway.
vec2 dmFbmGradient(vec3 p) {
  vec2 gradient = vec2(0.0);
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int octave = 0; octave < 3; octave++) {
    gradient += dmValueNoiseGrad(p).yz * amplitude * frequency;
    p = vec3(p.xy * 2.03 + vec2(17.1, 9.2), p.z * 1.31);
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return gradient;
}

// Curl of an fbm stream function plus a low-frequency drift so large areas
// slide coherently, like camera motion in a P-frame sequence.
vec2 dmProceduralMotion(vec2 uv) {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec3 p = vec3(uv * vec2(aspect, 1.0) * u_motionScale, u_time * u_motionSpeed);
  vec2 streamGradient = dmFbmGradient(p);
  vec2 curl = vec2(streamGradient.y, -streamGradient.x);
  float driftAngle = dmValueNoiseGrad(vec3(p.xy * 0.35, p.z * 0.5 + 7.3)).x * 6.2831853;
  vec2 drift = vec2(cos(driftAngle), sin(driftAngle));
  vec2 motion = curl * 0.6 + drift * 0.5;
  float magnitude = length(motion);
  if (magnitude > 1.5) motion *= 1.5 / magnitude;
  // Roughly 1.2% of the frame height per frame at strength 1, isotropic.
  return motion * 0.012 * vec2(1.0 / aspect, 1.0);
}

vec2 dmVideoMotion(vec2 uv) {
  vec4 field = texture2D(u_motionField, uv);
  return (field.rg * 2.0 - 1.0) * field.b * 0.15;
}

vec2 datamoshMotionField(vec2 uv) {
  if (u_motionSource == 1) return dmVideoMotion(uv);
  return dmProceduralMotion(uv);
}
