#version 300 es
precision highp float;
precision highp int;

layout(location = 0) in vec2 a_corner;

uniform vec2 u_resolution;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform float u_phase;
uniform float u_seed;
uniform float u_curlScale;
uniform float u_curlStrength;
uniform float u_speed;
uniform float u_ribbonWidth;
uniform float u_stretch;
uniform float u_particleSize;

out vec2 v_corner;
out float v_alpha;
out float v_depth;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
// Fixed camera contract: the Flow stage has no camera UI, so every render
// path (preview, still, sequence, video and tiles) uses this same projection.
const float CAMERA_Z = 32.0;
const float FOCAL_LENGTH = 1.85;
const float DEPTH_NEAR = 0.55;
const float DEPTH_FAR = 64.0;
const float SPHERE_TRAVEL_SCALE = 9.6;
const uint STREAMLINE_PARTICLES = 64u;
const float RADIAL_EMITTER_BIAS = 0.62;
const float CURL_SAMPLE_OFFSET = 0.72;
const vec2 FIELD_SPREAD = vec2(1.8, 1.35);
const float SCREEN_FIELD_SCALE = 3.2;
const float FIBONACCI_SPHERE_COUNT = 2048.0;

uint hashUint(uint value) {
  value ^= value >> 16;
  value *= 0x7feb352du;
  value ^= value >> 15;
  value *= 0x846ca68bu;
  value ^= value >> 16;
  return value;
}

float hashParticle(uint particle, uint salt) {
  return min(float(hashUint(particle ^ salt)) * (1.0 / 4294967295.0), 0.99999994);
}

// Deterministic uniform sphere emission from one point at the origin. Using
// z as the equal-area sample and seedB as the azimuth fills the whole screen
// after projection instead of collapsing all paths into a camera-side lane.
vec3 sphericalEmitterDirection(float seedA, float seedB) {
  float z = seedA * 2.0 - 1.0;
  float radial = sqrt(max(0.0, 1.0 - z * z));
  float azimuth = seedB * TAU;
  return normalize(vec3(
    radial * cos(azimuth),
    radial * sin(azimuth),
    z
  ) + vec3(0.0001));
}

// Curl of a time-varying analytic vector potential. The field is divergence
// free, deterministic and periodic in phase, so the same particle paths meet
// exactly at the loop boundary instead of merely fading into a new pattern.
vec3 curlField3D(vec3 point, float phase) {
  vec3 q = point * max(u_curlScale, 0.001) * PI;
  float time = phase * TAU;
  vec3 curl = vec3(
    -0.61 * sin(q.y * 0.61 - time * 0.90) - 0.79 * cos(q.z * 0.79 - time * 0.70),
    -0.91 * sin(q.z * 0.91 - time * 0.60) - 0.83 * cos(q.x * 0.83 + time * 0.50),
    -0.67 * sin(q.x * 0.67 + time * 0.80) - 0.73 * cos(q.y * 0.73 + time * 0.90)
  );
  return normalize(curl + vec3(0.0001));
}

vec3 flowDirection3D(vec3 point, vec3 emitterDirection, float phase) {
  // Keep the source ray attached to its spherical emission direction while
  // Curl bends it laterally. Using the displaced point as the radial axis
  // lets a strong curl turn every ray into the same camera-side lane.
  vec3 radial = normalize(emitterDirection + vec3(0.0001));
  // Avoid sampling the same curl vector at the common origin for every ray.
  // The offset is only a field lookup bias; the particle still starts at the
  // shared emitter point and remains on the same deterministic 3D path.
  vec3 curl = curlField3D(point + emitterDirection * CURL_SAMPLE_OFFSET, phase);
  // Remove the component parallel to the source ray. Curl should fold a ray
  // sideways around the emitter, not merely accelerate it toward the camera;
  // the perpendicular component is what produces overlapping fabric-like
  // arcs while the spherical emitter keeps the field screen-wide.
  curl = normalize(curl - emitterDirection * dot(curl, emitterDirection) + vec3(0.0001));
  // Curl is a lateral force that bends neighbouring rays into long,
  // overlapping strands. Keep only a small outward bias so the streamlines
  // do not collapse into a straight radial spray.
  float curlAmount = clamp(0.42 + u_curlStrength * 0.85, 0.35, 1.45);
  return normalize(radial * RADIAL_EMITTER_BIAS + curl * curlAmount + vec3(0.0001));
}

vec3 integrateEmitterParticle(vec3 emitterDirection, float phase, float age) {
  float travel = age * (0.80 + u_speed * SPHERE_TRAVEL_SCALE + u_stretch * 0.32);
  vec3 current = emitterDirection * 0.035;
  float stepDistance = travel / 7.0;
  for (int step = 0; step < 7; step += 1) {
    float stepPhase = phase + (float(step) + 0.5) * 0.032 + age * 0.21;
    current += flowDirection3D(current, emitterDirection, stepPhase) * stepDistance;
  }
  return current;
}

// Perspective projection in a full-resolution coordinate system. The tile
// offset is subtracted only after projection, so a tile is a crop of the same
// 3D scene rather than a separately generated 2D composition.
vec3 projectFlowPoint(vec3 point) {
  float depth = CAMERA_Z - point.z;
  float aspect = max(u_fullResolution.x / max(u_fullResolution.y, 1.0), 0.001);
  return vec3(
    point.x / max(depth, 0.001) * FOCAL_LENGTH / aspect * SCREEN_FIELD_SCALE,
    point.y / max(depth, 0.001) * FOCAL_LENGTH * SCREEN_FIELD_SCALE,
    depth
  );
}

void main() {
  uint particle = uint(gl_InstanceID);
  // Reuse one emitter direction for a short strip of samples along its path.
  // This turns the spherical particle cloud into many connected streamlines;
  // neighbouring particles then overlap as a mesh instead of averaging into
  // a featureless radial fog.
  uint streamline = particle / STREAMLINE_PARTICLES;
  uint pathIndex = particle - streamline * STREAMLINE_PARTICLES;
  uint seedKey = uint(floor(abs(u_seed) * 4096.0)) + 1u;
  float seedA = hashParticle(streamline, seedKey * 0x9e3779b9u);
  float seedB = hashParticle(streamline, seedKey * 0x85ebca6bu + 0xc2b2ae35u);
  float seedC = hashParticle(streamline, seedKey * 0x27d4eb2fu + 0x165667b1u);
  float pathSample = (float(pathIndex) + 0.5) / float(STREAMLINE_PARTICLES);
  float pathJitter = (hashParticle(particle, seedKey * 0x94d049bbu + 0x7f4a7c15u) - 0.5) * 0.045;
  float age = fract(pathSample + pathJitter + u_phase);
  float sphereIndex = mod(float(streamline), FIBONACCI_SPHERE_COUNT);
  float sphereSeedA = (sphereIndex + 0.5) / FIBONACCI_SPHERE_COUNT;
  float sphereSeedB = fract(sphereIndex * 0.61803398875 + fract(abs(u_seed) * 0.037));
  vec3 emitterDirection = sphericalEmitterDirection(sphereSeedA, sphereSeedB);
  float localPhase = u_phase + seedC * 0.37;
  vec3 flowPoint = integrateEmitterParticle(emitterDirection, localPhase, age);
  flowPoint.xy *= FIELD_SPREAD;
  vec3 velocity = flowDirection3D(flowPoint, emitterDirection, localPhase + age * 0.23);
  vec3 projected = projectFlowPoint(flowPoint);
  float depth = projected.z;

  v_corner = a_corner;
  v_depth = clamp((depth - DEPTH_NEAR) / (DEPTH_FAR - DEPTH_NEAR), 0.0, 1.0);
  if (depth <= DEPTH_NEAR || depth >= DEPTH_FAR) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    v_alpha = 0.0;
    return;
  }

  vec3 projectedAhead = projectFlowPoint(flowPoint + velocity * 0.045);
  vec2 screenTangent = normalize(projectedAhead.xy - projected.xy + vec2(0.00001));
  vec2 screenNormal = vec2(-screenTangent.y, screenTangent.x);
  float depthScale = clamp(CAMERA_Z / max(depth, 0.001), 0.32, 1.8);
  float particleScale = clamp(u_particleSize, 0.25, 2.0);
  float lengthPixels = max(
    1.2,
    u_ribbonWidth * (1.00 + u_stretch * 1.60) * mix(0.82, 1.24, seedA) * depthScale * particleScale
  );
  float widthPixels = max(0.75, u_ribbonWidth * mix(0.48, 0.76, seedB) * depthScale * particleScale);
  vec2 globalPixels = (projected.xy * 0.5 + vec2(0.5)) * u_fullResolution;
  vec2 localPixels = globalPixels - u_tileOffset;
  vec2 offset = screenTangent * a_corner.x * lengthPixels + screenNormal * a_corner.y * widthPixels;
  vec2 position = localPixels + offset;
  vec2 clip = position / u_resolution * 2.0 - 1.0;

  gl_Position = vec4(clip, 0.0, 1.0);
  float depthFade = (1.0 - smoothstep(0.94, 1.0, v_depth))
    * smoothstep(0.0, 0.02, v_depth);
  // Every particle uses the same base material response. Particle Opacity is
  // applied in the splat fragment stage, so overlap count remains the source
  // of the smooth density gradient and white saturated core.
  // The 64 samples already cover the complete streamline. Do not fade the
  // first/last sample as a synthetic lifetime: that creates a dotted seam
  // wherever the cyclic path wraps and makes a continuous ribbon look like
  // independent particles.
  v_alpha = depthFade;
}
