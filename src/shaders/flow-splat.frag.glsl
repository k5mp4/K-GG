#version 300 es
precision highp float;

uniform float u_density;
uniform float u_particleOpacity;

in vec2 v_corner;
in float v_alpha;
in float v_depth;

out vec4 fragColor;

// Keep the peak contribution above one RGBA8 quantization step. Temporal
// accumulation is normalized separately in the Trail EMA.
const float PARTICLE_DENSITY_WEIGHT = 0.008;
const float RIBBON_EDGE_SHARPNESS = 3.5;
const float CAPSULE_LONGITUDINAL_FEATHER = 0.82;

void main() {
  // a_corner.x is the velocity direction and a_corner.y is the narrow
  // cross-section. Treating both axes as one radius turns every instance
  // into a round dot, so the projected streamlines dissolve into fog. A
  // capsule keeps the whole velocity-oriented segment while feathering its
  // two ends and the lateral edge into a continuous ribbon field.
  float longitudinal = 1.0 - smoothstep(
    CAPSULE_LONGITUDINAL_FEATHER,
    1.0,
    abs(v_corner.x)
  );
  float lateral = exp(-v_corner.y * v_corner.y * RIBBON_EDGE_SHARPNESS);
  float feather = 1.0 - smoothstep(0.82, 1.0, abs(v_corner.y));
  float depthWeight = mix(1.18, 0.58, clamp(v_depth, 0.0, 1.0));
  float ribbon = longitudinal * lateral * feather * v_alpha * depthWeight;
  if (ribbon <= 0.001) discard;
  float density = ribbon
    * max(u_density, 0.0)
    * clamp(u_particleOpacity, 0.0, 1.0)
    * PARTICLE_DENSITY_WEIGHT;
  fragColor = vec4(density, 0.0, 0.0, density);
}
