precision highp float;

// Dedicated program for the orderable 3D layer (layer kind `cone`). It maps
// the preceding stack texture onto a camera-rendered surface. Every shape
// returns a hit position, normal, and optional surface UV; the shared mapping,
// shading, and fog stages turn that hit into a color. Keeping the ray-marched
// shapes out of the common stack programs means their compile cost is paid
// only when the 3D layer is used.

uniform sampler2D u_sourceTex;
uniform vec2 u_fullResolution;
uniform vec2 u_tileOffset;
uniform vec2 u_tileResolution;

uniform int u_threeDShape;
uniform int u_threeDMapping;
uniform float u_threeDFog;
uniform float u_threeDShade;
uniform float u_threeDTravel;
uniform float u_threeDDistance;

uniform float u_coneTangentHalfFov;
uniform float u_coneTextureRepeat;
uniform vec2 u_coneTextureOffset;
uniform float u_coneSeamBlend;
uniform int u_coneSeamMode;

uniform float u_cameraRoll;
uniform float u_cameraYaw;
uniform float u_cameraPitch;
uniform vec2 u_cameraOffset;

uniform float u_coneCameraDistance;
uniform float u_coneDepth;
uniform float u_coneApertureRadius;
uniform vec2 u_coneApexOffset;

uniform float u_torusMajorRadius;
uniform float u_ringRepeat;
uniform float u_torusTwistTurns;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

const int SHAPE_CONE = 0;
const int SHAPE_TORUS = 1;

const int MAPPING_UV = 0;
const int MAPPING_TRIPLANAR = 1;
const int MAPPING_MATCAP = 2;

vec2 sourceUvFromGlobal(vec2 globalUv) {
  return clamp((globalUv * u_fullResolution - u_tileOffset) / u_tileResolution, 0.0, 1.0);
}

// ---------------------------------------------------------------------------
// Texture lookup with the Cone seam modes. `unwrapped` may exceed [0, 1]; the
// seam mode decides how neighboring tiles meet.

vec4 coneTextureLookup(vec2 uv) {
  return texture2D(u_sourceTex, sourceUvFromGlobal(uv));
}

float coneSeamWeight(float coordinate, float blendWidth) {
  float distanceToSeam = min(coordinate, 1.0 - coordinate);
  return 1.0 - smoothstep(0.0, max(blendWidth, 0.00001), distanceToSeam);
}

vec2 coneMirrorRepeatUv(vec2 uv) {
  return abs(fract(uv) * 2.0 - 1.0);
}

vec4 coneMirrorRepeatSample(vec2 uv, float blendWidth) {
  vec2 tiledUv = fract(uv);
  float seamWeight = max(coneSeamWeight(tiledUv.x, blendWidth), coneSeamWeight(tiledUv.y, blendWidth));
  vec4 normal = coneTextureLookup(tiledUv);
  if (seamWeight <= 0.0) return normal;
  vec4 mirrored = coneTextureLookup(coneMirrorRepeatUv(uv));
  return mix(normal, mirrored, seamWeight);
}

vec4 coneEdgeWeldSample(vec2 uv, float blendWidth) {
  float seamX = coneSeamWeight(uv.x, blendWidth);
  float seamY = coneSeamWeight(uv.y, blendWidth);
  vec4 center = coneTextureLookup(uv);
  vec4 welded = center;
  if (seamX > 0.0) {
    vec4 edgeX = 0.5 * (
      coneTextureLookup(vec2(0.0, uv.y)) +
      coneTextureLookup(vec2(1.0, uv.y))
    );
    welded = mix(welded, edgeX, seamX);
  }
  if (seamY > 0.0) {
    vec4 edgeY = 0.5 * (
      coneTextureLookup(vec2(uv.x, 0.0)) +
      coneTextureLookup(vec2(uv.x, 1.0))
    );
    welded = mix(welded, edgeY, seamY);
  }
  if (seamX > 0.0 && seamY > 0.0) {
    vec4 corners = 0.25 * (
      coneTextureLookup(vec2(0.0, 0.0)) +
      coneTextureLookup(vec2(1.0, 0.0)) +
      coneTextureLookup(vec2(0.0, 1.0)) +
      coneTextureLookup(vec2(1.0, 1.0))
    );
    welded = mix(welded, corners, seamX * seamY);
  }
  return welded;
}

// KGG_CONE_GRADIENT_REAPPLY_SHADER

vec4 threeDSampleUnwrapped(vec2 unwrappedUv) {
  if (u_coneSeamMode == 0) return coneMirrorRepeatSample(unwrappedUv, u_coneSeamBlend);
  vec2 sampleUv = fract(unwrappedUv);
  if (u_coneSeamMode == 1) return coneEdgeWeldSample(sampleUv, u_coneSeamBlend);
  return coneGradientReapplySample(sampleUv, u_coneSeamBlend);
}

// ---------------------------------------------------------------------------
// Camera. Camera-local rays use x = right, y = up, and -z = forward.

vec3 threeDProjectedRay(vec2 globalUv, out bool valid) {
  valid = true;
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 ndc = globalUv * 2.0 - 1.0;
  return normalize(vec3(ndc.x * aspect * u_coneTangentHalfFov, ndc.y * u_coneTangentHalfFov, -1.0));
}

mat2 threeDRollMatrix() {
  float rollCos = cos(u_cameraRoll);
  float rollSin = sin(u_cameraRoll);
  return mat2(rollCos, rollSin, -rollSin, rollCos);
}

// User pitch and yaw in the camera frame, then roll around the forward axis.
// Applying the look first keeps yaw horizontal and pitch vertical on screen
// whatever the roll is.
vec3 threeDLookRay(vec3 ray) {
  float pitchCos = cos(u_cameraPitch);
  float pitchSin = sin(u_cameraPitch);
  ray = vec3(ray.x, ray.y * pitchCos - ray.z * pitchSin, ray.y * pitchSin + ray.z * pitchCos);
  float yawCos = cos(u_cameraYaw);
  float yawSin = sin(u_cameraYaw);
  ray = vec3(ray.x * yawCos + ray.z * yawSin, ray.y, -ray.x * yawSin + ray.z * yawCos);
  ray.xy = threeDRollMatrix() * ray.xy;
  return ray;
}

// Places a camera-local ray into a shape's base frame.
vec3 threeDWorldDirection(vec3 localRay, vec3 forward, vec3 up) {
  vec3 right = normalize(cross(forward, up));
  vec3 cameraUp = cross(right, forward);
  return normalize(right * localRay.x + cameraUp * localRay.y - forward * localRay.z);
}

// ---------------------------------------------------------------------------
// Surface hit shared by every shape.

struct ThreeDHit {
  bool hit;
  vec3 position;
  vec3 normal;
  vec2 uv;
  bool hasUv;
  float distance;
  vec3 rayDirection;
  // Triplanar texture tiles per world unit.
  float mapScale;
};

ThreeDHit threeDMiss() {
  ThreeDHit result;
  result.hit = false;
  result.position = vec3(0.0);
  result.normal = vec3(0.0, 0.0, 1.0);
  result.uv = vec2(0.0);
  result.hasUv = false;
  result.distance = 0.0;
  result.rayDirection = vec3(0.0, 0.0, -1.0);
  result.mapScale = 1.0;
  return result;
}

// Camera basis in world space, used by Matcap and the head light.
vec3 g_cameraRight = vec3(1.0, 0.0, 0.0);
vec3 g_cameraUp = vec3(0.0, 1.0, 0.0);
vec3 g_cameraForward = vec3(0.0, 0.0, -1.0);

void threeDSetCameraBasis(vec3 forward, vec3 up) {
  vec3 right = normalize(cross(forward, up));
  vec3 cameraUp = cross(right, forward);
  vec3 localForward = threeDLookRay(vec3(0.0, 0.0, -1.0));
  vec3 localUp = threeDLookRay(vec3(0.0, 1.0, 0.0));
  vec3 localRight = threeDLookRay(vec3(1.0, 0.0, 0.0));
  g_cameraForward = normalize(right * localForward.x + cameraUp * localForward.y - forward * localForward.z);
  g_cameraUp = normalize(right * localUp.x + cameraUp * localUp.y - forward * localUp.z);
  g_cameraRight = normalize(right * localRight.x + cameraUp * localRight.y - forward * localRight.z);
}

// ---------------------------------------------------------------------------
// Cone: the ray/cone intersection of the original Cone layer.

vec2 coneMappedUv(vec2 globalUv, out bool hitCone) {
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 ndc = globalUv * 2.0 - 1.0;
  vec3 rayDirection = vec3(
    ndc.x * aspect * u_coneTangentHalfFov,
    ndc.y * u_coneTangentHalfFov,
    -1.0
  );
  float depth = max(u_coneDepth, 0.001);
  float cameraDistance = max(u_coneCameraDistance, 0.001);
  vec2 apexOffset = u_coneApexOffset;
  vec2 rayFromBase = rayDirection.xy - apexOffset / depth;
  vec2 baseOffset = apexOffset * cameraDistance / depth;
  float radiusSlope = u_coneApertureRadius / depth;
  float radiusIntercept = u_coneApertureRadius * (cameraDistance + depth) / depth;
  float qa = dot(rayFromBase, rayFromBase) - radiusSlope * radiusSlope;
  float qb = 2.0 * dot(rayFromBase, baseOffset) + 2.0 * radiusSlope * radiusIntercept;
  float qc = dot(baseOffset, baseOffset) - radiusIntercept * radiusIntercept;
  hitCone = false;
  float minDistance = cameraDistance;
  float maxDistance = cameraDistance + depth;
  float distance = maxDistance + 1.0;
  if (abs(qa) < 0.000001) {
    if (abs(qb) < 0.000001) return vec2(0.0);
    float linearDistance = -qc / qb;
    if (linearDistance >= minDistance && linearDistance <= maxDistance) distance = linearDistance;
  } else {
    float discriminant = qb * qb - 4.0 * qa * qc;
    if (discriminant < 0.0) return vec2(0.0);
    float root = sqrt(max(discriminant, 0.0));
    float firstDistance = (-qb - root) / (2.0 * qa);
    float secondDistance = (-qb + root) / (2.0 * qa);
    if (firstDistance >= minDistance && firstDistance <= maxDistance) distance = firstDistance;
    if (secondDistance >= minDistance && secondDistance <= maxDistance) distance = min(distance, secondDistance);
  }
  if (distance < minDistance || distance > maxDistance) return vec2(0.0);
  vec2 surfacePoint = rayDirection.xy * distance;
  float depthFraction = (distance - cameraDistance) / depth;
  vec2 radialPoint = surfacePoint - apexOffset * depthFraction;
  float u = fract(atan(radialPoint.x, radialPoint.y) / TAU);
  float v = clamp((distance - cameraDistance) / depth, 0.0, 1.0);
  hitCone = true;
  return vec2(u, v);
}

// ---------------------------------------------------------------------------
// Torus tunnel: the camera sits on the ring's center line inside a tube of
// radius 1 and looks along the ring tangent. The ring lies in the XZ plane
// with its center at (-R, 0, 0), so the tube bends toward -X. The camera aims
// into the bend so the screen center looks at the farthest center-line point
// whose line of sight still clears the wall by half the radius:
// sagitta R * (1 - cos(aim)) = 0.5. Looking backward, the tunnel behind bends
// the same way, so the aim flips; looking sideways needs none. Scaling by
// cos(yaw) keeps the far end in view while the yaw turns a full circle.

float torusInteriorDistance(vec3 p, float majorRadius) {
  vec3 q = p + vec3(majorRadius, 0.0, 0.0);
  return 1.0 - length(vec2(length(q.xz) - majorRadius, q.y));
}

ThreeDHit torusHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  float majorRadius = max(u_torusMajorRadius, 1.05);
  float aim = acos(clamp(1.0 - 0.5 / majorRadius, -1.0, 1.0)) * cos(u_cameraYaw);
  vec3 forward = vec3(-sin(aim), 0.0, -cos(aim));
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  // The camera moves inside the tube cross-section at its ring position, so
  // the offset follows the roll but not the look direction.
  vec3 rayOrigin = vec3(threeDRollMatrix() * u_cameraOffset, 0.0);
  // Sphere tracing from inside the tube: the interior distance is the exact
  // distance to the wall, so each step stays inside and converges on the hit.
  float distance = 0.0;
  for (int i = 0; i < 96; i++) {
    float wallDistance = torusInteriorDistance(rayOrigin + rayDirection * distance, majorRadius);
    if (wallDistance < 0.0005 * (1.0 + distance)) break;
    distance += wallDistance;
  }
  // A ray that starts inside the closed tube always meets the wall. Grazing
  // rays near the vanishing point may run out of steps; their last point is
  // already close to the wall, so keep it instead of drawing a hole.
  vec3 position = rayOrigin + rayDirection * distance;
  vec3 q = position + vec3(majorRadius, 0.0, 0.0);
  vec2 ringPoint = normalize(q.xz) * majorRadius;
  // The forward (-Z) direction is the positive ring angle.
  float ringTurns = atan(-q.z, q.x) / TAU;
  float tubeAngle = atan(q.y, length(q.xz) - majorRadius);
  // Twist turns the texture around the tube along the ring. Combined with the
  // Flow offset on v, the pattern spirals toward the camera like a vortex.
  result.hit = true;
  result.position = position;
  result.normal = normalize(vec3(ringPoint.x, 0.0, ringPoint.y) - q);
  result.uv = vec2(
    fract(tubeAngle / TAU + 0.25 + u_torusTwistTurns * ringTurns),
    ringTurns * max(u_ringRepeat, 1.0)
  );
  result.hasUv = true;
  result.distance = distance;
  result.rayDirection = rayDirection;
  result.mapScale = 1.0 / TAU;
  return result;
}

// ---------------------------------------------------------------------------
// Mapping, shading, and fog.

vec4 threeDTriplanarSample(vec3 position, vec3 normal, float mapScale) {
  vec3 weights = pow(abs(normal), vec3(4.0));
  weights /= max(weights.x + weights.y + weights.z, 0.0001);
  float scale = mapScale * max(u_coneTextureRepeat, 1.0);
  vec4 x = threeDSampleUnwrapped(position.zy * scale + u_coneTextureOffset);
  vec4 y = threeDSampleUnwrapped(position.xz * scale + u_coneTextureOffset);
  vec4 z = threeDSampleUnwrapped(position.xy * scale + u_coneTextureOffset);
  return x * weights.x + y * weights.y + z * weights.z;
}

vec4 threeDMatcapSample(vec3 normal) {
  // View-space normal: facing the camera maps to the canvas center, and the
  // rim reaches the canvas edge, so the gradient reads as a material.
  vec2 matcapUv = vec2(dot(normal, g_cameraRight), dot(normal, g_cameraUp)) * 0.5 + 0.5;
  return coneTextureLookup(clamp(matcapUv, 0.0, 1.0));
}

vec4 threeDSurfaceColor(ThreeDHit hit) {
  vec3 normal = dot(hit.normal, hit.rayDirection) > 0.0 ? -hit.normal : hit.normal;
  vec4 color;
  if (u_threeDMapping == MAPPING_MATCAP) {
    color = threeDMatcapSample(normal);
  } else if (u_threeDMapping == MAPPING_TRIPLANAR || !hit.hasUv) {
    color = threeDTriplanarSample(hit.position, normal, hit.mapScale);
  } else {
    color = threeDSampleUnwrapped(hit.uv * vec2(u_coneTextureRepeat, 1.0) + u_coneTextureOffset);
  }
  // A head light from the camera's upper left. Shade 0 keeps the layer unlit.
  vec3 light = normalize(-g_cameraForward + g_cameraUp * 0.6 - g_cameraRight * 0.4);
  float lambert = 0.3 + 0.7 * max(dot(normal, light), 0.0);
  color.rgb *= mix(1.0, lambert, clamp(u_threeDShade, 0.0, 1.0));
  return color;
}

vec4 threeDApplyFog(vec4 color, float distance, float fogScale) {
  float fog = 1.0 - exp(-max(u_threeDFog, 0.0) * distance * fogScale);
  return vec4(mix(color.rgb, vec3(0.0), clamp(fog, 0.0, 1.0)), color.a);
}

// ---------------------------------------------------------------------------

void main() {
  vec2 globalUv = (gl_FragCoord.xy + u_tileOffset) / max(u_fullResolution, vec2(1.0));
  vec4 background = vec4(0.0, 0.0, 0.0, 1.0);

  if (u_threeDShape == SHAPE_CONE) {
    bool hitCone;
    vec2 mappedUv = coneMappedUv(globalUv, hitCone);
    if (!hitCone) {
      gl_FragColor = background;
      return;
    }
    gl_FragColor = threeDSampleUnwrapped(mappedUv * vec2(u_coneTextureRepeat, 1.0) + u_coneTextureOffset);
    return;
  }

  bool validRay;
  vec3 localRay = threeDLookRay(threeDProjectedRay(globalUv, validRay));
  if (!validRay) {
    gl_FragColor = background;
    return;
  }

  ThreeDHit hit = torusHit(localRay);
  float fogScale = 0.25;
  if (!hit.hit) {
    gl_FragColor = background;
    return;
  }
  vec4 color = threeDSurfaceColor(hit);
  gl_FragColor = threeDApplyFog(color, hit.distance, fogScale);
}
