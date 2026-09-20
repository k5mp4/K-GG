precision highp float;

uniform sampler2D u_sourceTex;
uniform sampler2D u_motionField;
uniform sampler2D u_feedbackTex;
uniform sampler2D u_gradientRamp;
uniform vec2 u_resolution;
uniform float u_effectStrength;
uniform float u_blendAmount;
uniform float u_feedbackAmount;
uniform float u_decay;
uniform float u_smearLength;
uniform float u_stabilization;
uniform bool u_feedbackPrimed;

const float MAX_HISTORY_WEIGHT = 0.82;
const int RAMP_SEARCH_STEPS = 32;

vec2 motionAt(vec2 uv) {
  vec4 field = texture2D(u_motionField, uv);
  vec2 vector = field.rg * 2.0 - 1.0;
  return vector * field.b;
}

vec2 clampUv(vec2 uv) {
  return clamp(uv, vec2(0.001), vec2(0.999));
}

vec3 projectToGradientRamp(vec3 color) {
  vec3 closest = texture2D(u_gradientRamp, vec2(0.0, 0.5)).rgb;
  vec3 delta = closest - color;
  float closestDistance = dot(delta, delta);
  for (int index = 1; index < RAMP_SEARCH_STEPS; index++) {
    float position = float(index) / float(RAMP_SEARCH_STEPS - 1);
    vec3 candidate = texture2D(u_gradientRamp, vec2(position, 0.5)).rgb;
    vec3 candidateDelta = candidate - color;
    float candidateDistance = dot(candidateDelta, candidateDelta);
    if (candidateDistance < closestDistance) {
      closest = candidate;
      closestDistance = candidateDistance;
    }
  }
  return closest;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 motion = motionAt(uv);
  float speed = clamp(length(motion), 0.0, 1.0);
  vec4 base = texture2D(u_sourceTex, uv);
  if (!u_feedbackPrimed) {
    gl_FragColor = base;
    return;
  }
  vec2 feedbackUv = clampUv(uv - motion * u_smearLength * 0.15 * u_effectStrength);
  vec4 previous = u_feedbackPrimed ? texture2D(u_feedbackTex, feedbackUv) : base;

  // Keep enough of the newly evaluated stack input in every frame so Noise
  // and other animated upstream layers remain visible through the trail.
  float historyWeight = clamp(
    u_feedbackAmount * u_decay * (1.0 - u_stabilization * speed),
    0.0,
    MAX_HISTORY_WEIGHT
  );
  vec4 feedback = mix(base, previous, historyWeight);
  float amount = clamp(u_blendAmount * u_effectStrength, 0.0, 1.0);
  vec4 composed = mix(base, feedback, amount);

  // Temporal RGB averaging drifts between ramp colors and loses saturation.
  // Snap the composed color back to the nearest point on the active ramp.
  composed.rgb = projectToGradientRamp(composed.rgb);
  gl_FragColor = composed;
}
