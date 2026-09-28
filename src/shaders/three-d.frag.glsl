precision highp float;

// Compiled as GLSL ES 3.00 behind aliases for texture2D and gl_FragColor
// (see createThreeDSource), so explicit-LOD textureLod is available.

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
uniform int u_threeDProjection;
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
uniform float u_cameraDolly;
uniform float u_fisheyeHalfAngle;
uniform float u_lensDistortion;
uniform float u_torusAim;

uniform float u_coneCameraDistance;
uniform float u_coneDepth;
uniform float u_coneApertureRadius;
uniform vec2 u_coneApexOffset;

uniform float u_torusMajorRadius;
uniform float u_ringRepeat;
uniform float u_torusTwistTurns;

uniform int u_latticeType;
uniform float u_latticeScale;
uniform float u_latticeThickness;

uniform float u_terrainHeight;
uniform float u_terrainAltitude;

uniform float u_extrudeCells;
uniform float u_extrudeHeight;
uniform float u_extrudeGap;

uniform float u_ribbonHalfTwists;
uniform float u_ribbonWidth;

uniform int u_ringsPattern;
uniform int u_ringsMapping;
uniform float u_ringsPerTile;
uniform float u_ringsSpacing;
uniform float u_ringsThickness;
uniform float u_ringsDepth;
uniform float u_ringsTwist;
uniform float u_ringsSpin;
uniform float u_ringsPulse;
uniform float u_ringsPulsePhase;
uniform float u_ringsAmount;

uniform int u_fieldGeometry;
uniform int u_fieldRender;
uniform float u_fieldLoopCells;
uniform float u_fieldDensity;
uniform float u_fieldSize;
uniform float u_fieldClearance;
uniform float u_fieldSpread;
uniform float u_fieldArms;
uniform float u_fieldTwist;
uniform float u_fieldArmWidth;
// Loaded .glb model: slice atlas of distance grids (see src/lib/meshSdf.ts).
uniform sampler2D u_fieldModelTex;
uniform float u_fieldModelReady;
// Voxels per axis, then atlas tiles in x and y.
uniform vec3 u_fieldModelGrid;
uniform float u_fieldWire;
uniform float u_fieldSpin;
uniform float u_fieldVariation;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

const int SHAPE_CONE = 0;
const int SHAPE_TORUS = 1;
const int SHAPE_LATTICE = 2;
const int SHAPE_TERRAIN = 3;
const int SHAPE_EXTRUSION = 4;
const int SHAPE_RIBBON = 5;
const int SHAPE_RINGS = 6;
const int SHAPE_FIELD = 7;

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

// Perspective uses the camera's vertical field of view with an optional
// radial lens distortion (positive is barrel). Fisheye is an equidistant
// projection inscribed in the shorter side covering Fisheye Angle, with the
// view direction at its center; 180 degrees is a dome master, and pixels
// outside the circle stay black. Equirect covers the full sphere: longitude
// across x and latitude across y.
vec3 threeDProjectedRay(vec2 globalUv, out bool valid) {
  valid = true;
  float aspect = u_fullResolution.x / max(u_fullResolution.y, 1.0);
  vec2 ndc = globalUv * 2.0 - 1.0;
  if (u_threeDProjection == 1) {
    vec2 circle = aspect >= 1.0 ? vec2(ndc.x * aspect, ndc.y) : vec2(ndc.x, ndc.y / aspect);
    float radius = length(circle);
    if (radius > 1.0) {
      valid = false;
      return vec3(0.0, 0.0, -1.0);
    }
    float theta = radius * u_fisheyeHalfAngle;
    vec2 direction = radius > 0.000001 ? circle / radius : vec2(0.0);
    return vec3(direction * sin(theta), -cos(theta));
  }
  if (u_threeDProjection == 2) {
    float longitude = (globalUv.x - 0.5) * TAU;
    float latitude = (globalUv.y - 0.5) * PI;
    return vec3(cos(latitude) * sin(longitude), sin(latitude), -cos(latitude) * cos(longitude));
  }
  vec2 screen = vec2(ndc.x * aspect, ndc.y);
  // Distortion grows with the squared radius normalized to the frame corner.
  float cornerRadius = dot(screen, screen) / (aspect * aspect + 1.0);
  screen *= 1.0 + u_lensDistortion * cornerRadius;
  return normalize(vec3(screen * u_coneTangentHalfFov, -1.0));
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
  // The uv already includes Texture Repeat on both axes.
  bool uvTiled;
  // The shape resolved its own color (Extrusion cells and floor).
  bool hasColor;
  vec4 color;
  float distance;
  vec3 rayDirection;
  // Triplanar texture tiles per world unit.
  float mapScale;
  // Brightness left after the shape's own fade-out at its drawing limit.
  float fade;
};

ThreeDHit threeDMiss() {
  ThreeDHit result;
  result.hit = false;
  result.position = vec3(0.0);
  result.normal = vec3(0.0, 0.0, 1.0);
  result.uv = vec2(0.0);
  result.hasUv = false;
  result.uvTiled = false;
  result.hasColor = false;
  result.color = vec4(0.0, 0.0, 0.0, 1.0);
  result.distance = 0.0;
  result.rayDirection = vec3(0.0, 0.0, -1.0);
  result.mapScale = 1.0;
  result.fade = 1.0;
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
  float aim = acos(clamp(1.0 - 0.5 / majorRadius, -1.0, 1.0)) * cos(u_cameraYaw) * clamp(u_torusAim, 0.0, 1.0);
  vec3 forward = vec3(-sin(aim), 0.0, -cos(aim));
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  // The camera moves inside the tube cross-section at its ring position, so
  // the offset follows the roll but not the look direction.
  vec3 rayOrigin = vec3(threeDRollMatrix() * u_cameraOffset, 0.0);
  // Dolly stays short so the camera remains inside the tube.
  rayOrigin += g_cameraForward * u_cameraDolly * 0.6;
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
// Lattice: a triply periodic minimal surface thickened into walls. Straight
// channels run along x: the gyroid field is exactly 1 on (x, P/4, 0) and the
// Schwarz P field is at least 1 on (x, 0, 0), so a camera moving along x never
// touches a wall. Travel is measured in lattice periods, so integer Flow
// Cycles return the camera to an identical view.

float latticeField(vec3 position, float period) {
  vec3 q = position * (TAU / period);
  if (u_latticeType == 1) return cos(q.x) + cos(q.y) + cos(q.z);
  return dot(sin(q), cos(q.yzx));
}

float latticeDistance(vec3 position, float period) {
  // The field gradient is bounded by about 1.8 in phase units, so scaling by
  // 0.5 * period / TAU keeps the sphere-tracing step conservative.
  return (abs(latticeField(position, period)) - u_latticeThickness) * period / TAU * 0.5;
}

ThreeDHit latticeHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  float period = max(u_latticeScale, 0.1);
  vec3 forward = vec3(1.0, 0.0, 0.0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  vec3 right = normalize(cross(forward, up));
  vec2 offset = threeDRollMatrix() * u_cameraOffset * period * 0.15;
  vec3 rayOrigin = vec3(u_threeDTravel * period, u_latticeType == 1 ? 0.0 : period * 0.25, 0.0)
    + right * offset.x + up * offset.y
    + g_cameraForward * u_cameraDolly * period * 0.5;
  float maxDistance = period * 12.0;
  float distance = 0.0;
  bool hit = false;
  for (int i = 0; i < 160; i++) {
    float wallDistance = latticeDistance(rayOrigin + rayDirection * distance, period);
    if (wallDistance < 0.0008 * period) {
      hit = true;
      break;
    }
    distance += wallDistance;
    if (distance > maxDistance) break;
  }
  result.rayDirection = rayDirection;
  if (!hit) return result;
  vec3 position = rayOrigin + rayDirection * distance;
  float epsilon = 0.002 * period;
  vec3 gradient = vec3(
    latticeDistance(position + vec3(epsilon, 0.0, 0.0), period) - latticeDistance(position - vec3(epsilon, 0.0, 0.0), period),
    latticeDistance(position + vec3(0.0, epsilon, 0.0), period) - latticeDistance(position - vec3(0.0, epsilon, 0.0), period),
    latticeDistance(position + vec3(0.0, 0.0, epsilon), period) - latticeDistance(position - vec3(0.0, 0.0, epsilon), period)
  );
  result.hit = true;
  result.position = position;
  result.normal = normalize(gradient);
  result.distance = distance;
  result.mapScale = 1.0 / period;
  return result;
}

// ---------------------------------------------------------------------------
// Terrain: the canvas luminance lifts a heightfield that repeats every tile
// (4 / Texture Repeat world units). The camera glides forward at Altitude and
// Flow advances it by whole tiles, so integer Flow Cycles loop seamlessly.

float threeDLuminance(vec3 color) {
  return dot(clamp(color, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
}

// Heights follow the color seams: Mirror Repeat blends the same way the
// color does, the other modes wrap with fract to keep the march cheap.
float terrainHeightAt(vec2 xz) {
  vec2 uv = xz * 0.25 * max(u_coneTextureRepeat, 1.0);
  vec3 color = u_coneSeamMode == 0
    ? coneMirrorRepeatSample(uv, u_coneSeamBlend).rgb
    : coneTextureLookup(fract(uv)).rgb;
  return max(u_terrainHeight, 0.0) * threeDLuminance(color);
}

ThreeDHit terrainHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  vec3 forward = normalize(vec3(0.0, -0.3, -1.0));
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  vec3 right = normalize(cross(forward, up));
  vec2 offset = threeDRollMatrix() * u_cameraOffset;
  float tileLength = 4.0 / max(u_coneTextureRepeat, 1.0);
  vec3 rayOrigin = vec3(0.0, max(u_terrainAltitude, 0.05), -u_threeDTravel * tileLength)
    + right * offset.x + up * offset.y
    + g_cameraForward * u_cameraDolly * 1.5;
  float maxHeight = max(u_terrainHeight, 0.0);
  result.rayDirection = rayDirection;
  float previous = 0.0;
  float distance = 0.02;
  bool hit = false;
  for (int i = 0; i < 200; i++) {
    vec3 position = rayOrigin + rayDirection * distance;
    float gap = position.y - terrainHeightAt(position.xz);
    if (gap < 0.001 + 0.002 * distance) {
      hit = true;
      break;
    }
    // Rays above the highest peak that climb never come back down.
    if (position.y > maxHeight && rayDirection.y >= 0.0) break;
    previous = distance;
    distance += max(gap * 0.4, 0.01 + 0.004 * distance);
    if (distance > 40.0) break;
  }
  if (!hit) return result;
  // Refine the crossing between the last point above and the first below.
  float low = previous;
  float high = distance;
  for (int i = 0; i < 6; i++) {
    float middle = 0.5 * (low + high);
    vec3 position = rayOrigin + rayDirection * middle;
    if (position.y - terrainHeightAt(position.xz) > 0.0) low = middle;
    else high = middle;
  }
  distance = high;
  vec3 position = rayOrigin + rayDirection * distance;
  float epsilon = 0.02 * tileLength;
  vec3 normal = normalize(vec3(
    terrainHeightAt(position.xz - vec2(epsilon, 0.0)) - terrainHeightAt(position.xz + vec2(epsilon, 0.0)),
    2.0 * epsilon,
    terrainHeightAt(position.xz - vec2(0.0, epsilon)) - terrainHeightAt(position.xz + vec2(0.0, epsilon))
  ));
  result.hit = true;
  result.position = position;
  result.normal = normal;
  result.uv = position.xz * 0.25 * max(u_coneTextureRepeat, 1.0);
  result.hasUv = true;
  result.uvTiled = true;
  result.distance = distance;
  result.mapScale = 0.25;
  return result;
}

// ---------------------------------------------------------------------------
// Extrusion: the canvas is split into Cells x Cells columns over [-1, 1]^2,
// each raised by its cell color's luminance. A 2D DDA walks the cells along
// the ray and tests each column box, so the first box hit is the nearest.
// The camera orbits the city once per Flow Cycle.

ThreeDHit extrusionHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  float cells = max(floor(u_extrudeCells + 0.5), 1.0);
  float cellSize = 2.0 / cells;
  float maxHeight = max(u_extrudeHeight, 0.001);
  float orbit = u_threeDTravel * TAU;
  float elevation = 0.55;
  // Frame the unit city tighter than the sphere at the same Distance.
  float cameraDistance = max(u_threeDDistance * 0.7, 1.5);
  vec3 cameraPosition = vec3(sin(orbit) * cos(elevation), sin(elevation), cos(orbit) * cos(elevation)) * cameraDistance;
  vec3 forward = normalize(vec3(0.0, maxHeight * 0.15, 0.0) - cameraPosition);
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  vec3 right = normalize(cross(forward, up));
  vec2 offset = threeDRollMatrix() * u_cameraOffset * cameraDistance * 0.3;
  vec3 rayOrigin = cameraPosition + right * offset.x + cross(right, forward) * offset.y
    + g_cameraForward * u_cameraDolly * cameraDistance * 0.5;
  result.rayDirection = rayDirection;

  vec3 safeDirection = rayDirection + vec3(
    abs(rayDirection.x) < 0.000001 ? 0.000001 : 0.0,
    abs(rayDirection.y) < 0.000001 ? 0.000001 : 0.0,
    abs(rayDirection.z) < 0.000001 ? 0.000001 : 0.0
  );
  vec3 inverse = 1.0 / safeDirection;
  vec3 boxNear = (vec3(-1.0, 0.0, -1.0) - rayOrigin) * inverse;
  vec3 boxFar = (vec3(1.0, maxHeight, 1.0) - rayOrigin) * inverse;
  vec3 entry = min(boxNear, boxFar);
  vec3 exit = max(boxNear, boxFar);
  float enter = max(max(entry.x, entry.y), max(entry.z, 0.0));
  float leave = min(min(exit.x, exit.y), exit.z);
  bool found = false;
  if (leave > enter) {
    float distance = enter + 0.00001;
    vec3 position = rayOrigin + rayDirection * distance;
    vec2 cell = clamp(floor((position.xz + 1.0) / cellSize), vec2(0.0), vec2(cells - 1.0));
    vec2 stepDirection = vec2(safeDirection.x >= 0.0 ? 1.0 : -1.0, safeDirection.z >= 0.0 ? 1.0 : -1.0);
    vec2 boundary = (cell + max(stepDirection, vec2(0.0))) * cellSize - 1.0;
    vec2 crossing = distance + (boundary - position.xz) * inverse.xz;
    vec2 delta = cellSize * abs(inverse.xz);
    float halfSize = 0.5 * cellSize * (1.0 - clamp(u_extrudeGap, 0.0, 0.95));
    for (int i = 0; i < 280; i++) {
      if (cell.x < 0.0 || cell.y < 0.0 || cell.x > cells - 1.0 || cell.y > cells - 1.0) break;
      vec2 cellUv = (cell + 0.5) / cells;
      vec4 cellColor = coneTextureLookup(cellUv);
      float height = maxHeight * threeDLuminance(cellColor.rgb);
      if (height > 0.0005) {
        vec2 center = -1.0 + (cell + 0.5) * cellSize;
        vec3 columnNear = (vec3(center.x - halfSize, 0.0, center.y - halfSize) - rayOrigin) * inverse;
        vec3 columnFar = (vec3(center.x + halfSize, height, center.y + halfSize) - rayOrigin) * inverse;
        vec3 columnEntry = min(columnNear, columnFar);
        vec3 columnExit = max(columnNear, columnFar);
        float columnEnter = max(max(columnEntry.x, columnEntry.y), columnEntry.z);
        float columnLeave = min(min(columnExit.x, columnExit.y), columnExit.z);
        if (columnLeave >= max(columnEnter, 0.0)) {
          vec3 normal = columnEntry.x >= columnEntry.y && columnEntry.x >= columnEntry.z
            ? vec3(-stepDirection.x, 0.0, 0.0)
            : columnEntry.y >= columnEntry.z
              ? vec3(0.0, safeDirection.y >= 0.0 ? -1.0 : 1.0, 0.0)
              : vec3(0.0, 0.0, -stepDirection.y);
          result.hit = true;
          result.position = rayOrigin + rayDirection * columnEnter;
          result.normal = normal;
          result.uv = cellUv;
          result.hasColor = true;
          result.color = cellColor;
          result.distance = columnEnter;
          found = true;
          break;
        }
      }
      if (crossing.x < crossing.y) {
        cell.x += stepDirection.x;
        crossing.x += delta.x;
      } else {
        cell.y += stepDirection.y;
        crossing.y += delta.y;
      }
    }
  }
  if (!found && rayDirection.y < 0.0) {
    // The floor between the columns shows the canvas dimmed.
    float floorDistance = -rayOrigin.y / rayDirection.y;
    vec3 position = rayOrigin + rayDirection * floorDistance;
    if (abs(position.x) <= 1.0 && abs(position.z) <= 1.0) {
      result.hit = true;
      result.position = position;
      result.normal = vec3(0.0, 1.0, 0.0);
      result.uv = (position.xz + 1.0) * 0.5;
      result.hasColor = true;
      result.color = vec4(coneTextureLookup(result.uv).rgb * 0.25, 1.0);
      result.distance = floorDistance;
    }
  }
  result.mapScale = 0.5;
  return result;
}

// ---------------------------------------------------------------------------
// Rotation about the vertical axis, used to turn whole scenes.

vec3 rotateAboutY(vec3 value, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec3(value.x * c + value.z * s, value.y, -value.x * s + value.z * c);
}

// ---------------------------------------------------------------------------
// Ribbon: a flat band swept around a unit circle in the XZ plane. Its cross
// section turns by Half Twists / 2 turns per revolution, so an odd count
// makes a Mobius band; the rectangle's symmetry keeps the surface continuous
// where the ring angle wraps. The texture runs along the band in Ring Repeat
// tiles and slides with Flow; Spin turns the whole band per loop.

float ribbonDistance(vec3 position, out vec2 bandUv) {
  float ringAngle = atan(position.z, position.x);
  vec2 section = vec2(length(position.xz) - 1.0, position.y);
  float twist = u_ribbonHalfTwists * 0.5 * ringAngle;
  float c = cos(twist);
  float s = sin(twist);
  section = vec2(c * section.x + s * section.y, -s * section.x + c * section.y);
  float halfWidth = max(u_ribbonWidth, 0.01);
  bandUv = vec2(ringAngle / TAU * max(u_ringRepeat, 1.0), section.x / (2.0 * halfWidth) + 0.5);
  vec2 d = abs(section) - vec2(halfWidth, 0.012);
  // The twist stretches distances away from the ring, so step conservatively.
  return (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) * 0.5;
}

ThreeDHit ribbonHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  float elevation = 0.45;
  float cameraDistance = max(u_threeDDistance * 0.8, 1.6);
  vec3 cameraPosition = vec3(0.0, sin(elevation), cos(elevation)) * cameraDistance;
  vec3 forward = normalize(-cameraPosition);
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  float angle = -u_threeDTravel * TAU;
  vec3 right = normalize(cross(forward, up));
  vec2 offset = threeDRollMatrix() * u_cameraOffset * cameraDistance * 0.3;
  vec3 rayDirection = rotateAboutY(threeDWorldDirection(localRay, forward, up), angle);
  vec3 rayOrigin = rotateAboutY(cameraPosition + right * offset.x + cross(right, forward) * offset.y, angle);
  g_cameraRight = rotateAboutY(g_cameraRight, angle);
  g_cameraUp = rotateAboutY(g_cameraUp, angle);
  g_cameraForward = rotateAboutY(g_cameraForward, angle);
  rayOrigin += g_cameraForward * u_cameraDolly * cameraDistance * 0.5;
  result.rayDirection = rayDirection;
  float distance = 0.0;
  bool hit = false;
  vec2 bandUv = vec2(0.0);
  for (int i = 0; i < 180; i++) {
    float surfaceDistance = ribbonDistance(rayOrigin + rayDirection * distance, bandUv);
    if (surfaceDistance < 0.0004) {
      hit = true;
      break;
    }
    distance += surfaceDistance;
    if (distance > cameraDistance + 3.0) break;
  }
  if (!hit) return result;
  vec3 position = rayOrigin + rayDirection * distance;
  vec2 unusedUv;
  float epsilon = 0.001;
  vec3 gradient = vec3(
    ribbonDistance(position + vec3(epsilon, 0.0, 0.0), unusedUv) - ribbonDistance(position - vec3(epsilon, 0.0, 0.0), unusedUv),
    ribbonDistance(position + vec3(0.0, epsilon, 0.0), unusedUv) - ribbonDistance(position - vec3(0.0, epsilon, 0.0), unusedUv),
    ribbonDistance(position + vec3(0.0, 0.0, epsilon), unusedUv) - ribbonDistance(position - vec3(0.0, 0.0, epsilon), unusedUv)
  );
  result.hit = true;
  result.position = position;
  result.normal = normalize(gradient);
  result.uv = bandUv;
  result.hasUv = true;
  result.uvTiled = true;
  result.distance = distance;
  result.mapScale = 0.5;
  return result;
}

// ---------------------------------------------------------------------------
// Square Rings: square frames (outer half size 1, bar width Thickness, depth
// Depth, all times the frame's pulse scale) placed one Spacing apart along a
// path. Frame k sits at path position k and the camera at path position
// travel, which Flow advances by Rings per Tile frames per Flow Cycle. Every
// per-frame variation depends on k - travel, on k modulo Rings per Tile, or on
// whole turns per loop, so integer Flow Cycles show the same view at both ends
// of the loop. Frames are intersected analytically; the loop keeps the
// nearest hit among RINGS_COUNT frames around the camera.

const int RINGS_PATTERN_SERPENT = 1;
const int RINGS_PATTERN_TUMBLE = 2;
const int RINGS_MAPPING_PICTURE = 1;
const int RINGS_BEHIND = 12;
const int RINGS_COUNT = 64;

float ringsPeriod() {
  return max(floor(u_ringsPerTile + 0.5), 1.0);
}

// Center line of the frames. The Serpent swings x once and y twice per tile,
// so the path repeats every tile. Its amplitude keeps the curvature below 0.4
// and the slope below 0.8 whatever the tile length.
vec3 ringsPath(float w) {
  float spacing = max(u_ringsSpacing, 0.05);
  vec3 center = vec3(0.0, 0.0, -w * spacing);
  if (u_ringsPattern != RINGS_PATTERN_SERPENT) return center;
  float tileRadius = ringsPeriod() * spacing / TAU;
  float amplitude = clamp(u_ringsAmount, 0.0, 1.0) * tileRadius * min(0.4 * tileRadius, 0.8);
  // fract keeps the phase exact after whole tiles, so the loop ends match.
  float phase = TAU * fract(w / ringsPeriod());
  center.x = amplitude * sin(phase);
  center.y = 0.25 * amplitude * cos(2.0 * phase);
  return center;
}

vec3 ringsHash(float n) {
  vec3 p = fract(vec3(n + 0.37) * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yzx + 33.33);
  return fract((p.xxy + p.yzz) * p.zyx);
}

vec3 rotateAboutAxis(vec3 value, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return value * c + cross(axis, value) * s + axis * dot(axis, value) * (1.0 - c);
}

struct RingsFrame {
  vec3 center;
  // Local x and y span the square; local z runs along the path.
  vec3 axisX;
  vec3 axisY;
  vec3 axisZ;
  float scale;
};

RingsFrame ringsFrameAt(float k) {
  RingsFrame frame;
  float period = ringsPeriod();
  float relative = k - u_threeDTravel;
  frame.center = ringsPath(k);
  vec3 forward = vec3(0.0, 0.0, -1.0);
  if (u_ringsPattern == RINGS_PATTERN_SERPENT) {
    forward = normalize(ringsPath(k + 0.05) - ringsPath(k - 0.05));
  }
  vec3 axisX = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 axisY = cross(axisX, forward);
  vec3 axisZ = forward;
  if (u_ringsPattern == RINGS_PATTERN_TUMBLE) {
    // Frames near the camera line up so it flies through their holes; farther
    // frames drift aside and turn about a per-slot random axis.
    float scatter = clamp(u_ringsAmount, 0.0, 1.0) * smoothstep(1.5, 7.5, abs(relative));
    float slot = mod(k, period);
    vec3 random = ringsHash(slot);
    vec3 axis = normalize(ringsHash(slot + 17.0) * 2.0 - 1.0 + vec3(0.0, 0.0, 0.001));
    float angle = scatter * PI * (0.6 + 0.4 * random.z);
    frame.center.xy += (random.xy * 2.0 - 1.0) * 2.5 * scatter;
    axisX = rotateAboutAxis(axisX, axis, angle);
    axisY = rotateAboutAxis(axisY, axis, angle);
    axisZ = rotateAboutAxis(axisZ, axis, angle);
  }
  // Twist turns each frame relative to the camera, so the spiral turns as the
  // camera flies through it; Spin rolls every frame by whole turns per loop.
  float roll = relative * u_ringsTwist + u_ringsSpin;
  float c = cos(roll);
  float s = sin(roll);
  frame.axisX = c * axisX + s * axisY;
  frame.axisY = -s * axisX + c * axisY;
  frame.axisZ = axisZ;
  frame.scale = 1.0 + 0.5 * clamp(u_ringsPulse, 0.0, 1.0) * sin(TAU * (k / period - u_ringsPulsePhase));
  return frame;
}

// Ray against one frame in its local space: the box |x|, |y| <= 1,
// |z| <= halfDepth minus the hole |x|, |y| < inner running through it.
// Returns the hit distance, or -1, and the local normal of the face hit.
float ringsFrameIntersect(vec3 origin, vec3 direction, float inner, float halfDepth, out vec3 normal) {
  normal = vec3(0.0, 0.0, 1.0);
  vec3 safeDirection = direction + vec3(
    abs(direction.x) < 0.000001 ? 0.000001 : 0.0,
    abs(direction.y) < 0.000001 ? 0.000001 : 0.0,
    abs(direction.z) < 0.000001 ? 0.000001 : 0.0
  );
  vec3 inverse = 1.0 / safeDirection;
  vec3 stepSign = sign(safeDirection);
  vec3 boxNear = (vec3(-1.0, -1.0, -halfDepth) - origin) * inverse;
  vec3 boxFar = (vec3(1.0, 1.0, halfDepth) - origin) * inverse;
  vec3 entry = min(boxNear, boxFar);
  vec3 exit = max(boxNear, boxFar);
  float enter = max(max(entry.x, entry.y), entry.z);
  float leave = min(min(exit.x, exit.y), exit.z);
  if (leave < max(enter, 0.0)) return -1.0;
  vec2 holeNear = (vec2(-inner) - origin.xy) * inverse.xy;
  vec2 holeFar = (vec2(inner) - origin.xy) * inverse.xy;
  vec2 holeEntry = min(holeNear, holeFar);
  vec2 holeExit = max(holeNear, holeFar);
  float holeEnter = max(holeEntry.x, holeEntry.y);
  float holeLeave = min(holeExit.x, holeExit.y);
  bool crossesHole = holeLeave > holeEnter;
  if (enter > 0.0 && (!crossesHole || enter < holeEnter || enter > holeLeave)) {
    // Entering through the front, back, or outer face.
    normal = entry.x >= entry.y && entry.x >= entry.z
      ? vec3(-stepSign.x, 0.0, 0.0)
      : entry.y >= entry.z
        ? vec3(0.0, -stepSign.y, 0.0)
        : vec3(0.0, 0.0, -stepSign.z);
    return enter;
  }
  // Inside the hole where the ray reaches the frame: it meets the inner wall
  // where it leaves the hole, unless it leaves the frame first.
  if (crossesHole && holeLeave > max(enter, 0.0) && holeLeave < leave) {
    normal = holeExit.x <= holeExit.y ? vec3(-stepSign.x, 0.0, 0.0) : vec3(0.0, -stepSign.y, 0.0);
    return holeLeave;
  }
  return -1.0;
}

// Position around a square outline in [0, 1), clockwise from the top-left
// corner with a quarter per side.
float ringsPerimeter(vec2 p) {
  vec2 q = p / max(max(abs(p.x), abs(p.y)), 0.000001);
  if (q.y >= abs(q.x)) return 0.125 * (q.x + 1.0);
  if (q.x >= abs(q.y)) return 0.25 + 0.125 * (1.0 - q.y);
  if (-q.y >= abs(q.x)) return 0.5 + 0.125 * (1.0 - q.x);
  return 0.75 + 0.125 * (q.y + 1.0);
}

ThreeDHit ringsHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  float period = ringsPeriod();
  float spacing = max(u_ringsSpacing, 0.05);
  float pulse = clamp(u_ringsPulse, 0.0, 1.0);
  float inner = clamp(1.0 - u_ringsThickness, 0.05, 0.98);
  float halfDepth = clamp(0.5 * u_ringsDepth, 0.002, 0.45 * spacing);
  float travel = u_threeDTravel;
  vec3 cameraPosition = ringsPath(travel);
  vec3 forward = vec3(0.0, 0.0, -1.0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  if (u_ringsPattern == RINGS_PATTERN_SERPENT) {
    // Aim one frame ahead and bank into the curve like a coaster.
    forward = normalize(ringsPath(travel + 1.0) - cameraPosition);
    vec3 pathRight = normalize(cross(forward, up));
    vec3 behind = ringsPath(travel - 0.25);
    vec3 ahead = ringsPath(travel + 0.25);
    vec3 velocity = ahead - behind;
    float curvature = 4.0 * dot(ahead - 2.0 * cameraPosition + behind, pathRight) / max(dot(velocity, velocity), 0.000001);
    float bank = clamp(curvature * 1.5, -0.6, 0.6);
    up = normalize(cos(bank) * cross(pathRight, forward) + sin(bank) * pathRight);
  }
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  vec3 right = normalize(cross(forward, up));
  vec3 cameraUp = cross(right, forward);
  // The offset stays inside the smallest hole of the pulse.
  vec2 offset = threeDRollMatrix() * u_cameraOffset * inner * (1.0 - 0.5 * pulse);
  vec3 rayOrigin = cameraPosition + right * offset.x + cameraUp * offset.y
    + g_cameraForward * u_cameraDolly * spacing;
  result.rayDirection = rayDirection;

  float first = floor(travel) - float(RINGS_BEHIND);
  float best = 1.0e9;
  float bestK = 0.0;
  vec3 bestNormal = vec3(0.0, 0.0, 1.0);
  vec2 bestLocal = vec2(0.0);
  // A sphere around the path point that holds the frame at any pulse, turn,
  // and Tumble drift, so frames can be culled before they are built.
  bool tumble = u_ringsPattern == RINGS_PATTERN_TUMBLE;
  float boundRadius = (1.0 + 0.5 * pulse) * sqrt(2.0 + halfDepth * halfDepth)
    + (tumble ? 2.5 * clamp(u_ringsAmount, 0.0, 1.0) * 1.4143 : 0.0);
  // Straight layouts line the frames up along -z, so a forward ray that has
  // hit a frame cannot hit a closer one further along.
  bool ordered = u_ringsPattern != RINGS_PATTERN_SERPENT && rayDirection.z < -0.0001;
  for (int i = 0; i < RINGS_COUNT; i++) {
    float k = first + float(i);
    vec3 toPath = rayOrigin - ringsPath(k);
    if (ordered && (toPath.z - boundRadius) / -rayDirection.z > best) break;
    float b = dot(toPath, rayDirection);
    float discriminant = b * b - dot(toPath, toPath) + boundRadius * boundRadius;
    if (discriminant < 0.0) continue;
    float root = sqrt(discriminant);
    if (-b + root < 0.0 || -b - root > best) continue;
    RingsFrame frame = ringsFrameAt(k);
    vec3 toFrame = rayOrigin - frame.center;
    vec3 localOrigin = vec3(dot(toFrame, frame.axisX), dot(toFrame, frame.axisY), dot(toFrame, frame.axisZ)) / frame.scale;
    vec3 localDirection = vec3(dot(rayDirection, frame.axisX), dot(rayDirection, frame.axisY), dot(rayDirection, frame.axisZ)) / frame.scale;
    vec3 localNormal;
    float distance = ringsFrameIntersect(localOrigin, localDirection, inner, halfDepth, localNormal);
    if (distance > 0.0 && distance < best) {
      best = distance;
      bestK = k;
      bestNormal = localNormal.x * frame.axisX + localNormal.y * frame.axisY + localNormal.z * frame.axisZ;
      bestLocal = (localOrigin + localDirection * distance).xy;
    }
  }
  if (best > 1.0e8) return result;
  result.hit = true;
  result.position = rayOrigin + rayDirection * best;
  result.normal = normalize(bestNormal);
  result.distance = best;
  float repeat = max(u_coneTextureRepeat, 1.0);
  if (u_ringsMapping == RINGS_MAPPING_PICTURE) {
    result.uv = (bestLocal * 0.5 + 0.5) * repeat;
  } else {
    // U runs around the frame and V across the bar, continuing into the next
    // frame, so one tile of frames shows the canvas once along the path.
    float across = clamp((max(abs(bestLocal.x), abs(bestLocal.y)) - inner) / max(1.0 - inner, 0.0001), 0.0, 1.0);
    result.uv = vec2(ringsPerimeter(bestLocal) * repeat, (bestK + across) / period);
  }
  result.hasUv = true;
  result.uvTiled = true;
  result.mapScale = 0.5;
  // Frames fade out before they leave the drawn range, so none pops in or out.
  float relative = bestK - travel;
  float ahead = float(RINGS_COUNT - RINGS_BEHIND);
  result.fade = (1.0 - smoothstep(ahead - 14.0, ahead - 2.0, relative))
    * (1.0 - smoothstep(float(RINGS_BEHIND) - 5.0, float(RINGS_BEHIND) - 1.0, -relative));
  return result;
}

// ---------------------------------------------------------------------------
// Geometry Field: space is split into unit slices along z, and each slice
// into unit cells whose grid is shifted by a per-slice random offset so the
// objects do not line up into lanes. A cell may hold one primitive whose
// bounding sphere stays inside the cell, so the march only looks at the cell
// it is in and never steps past the cell's far side. Objects fill the ring
// between Clearance and Spread around the z axis, along which the camera
// travels toward -z. The layout hashes the slice modulo Loop Length and the
// camera moves Loop Length cells per Flow Cycle; objects spin by whole turns
// per loop, so integer Flow Cycles loop seamlessly.

const int FIELD_SPHERE = 0;
const int FIELD_CUBE = 1;
const int FIELD_PRISM = 2;
const int FIELD_OCTAHEDRON = 3;
const int FIELD_MODEL = 5;
// Half size of the model grid around the unit sphere (MESH_SDF_EXTENT).
const float FIELD_MODEL_EXTENT = 1.05;
const int FIELD_RENDER_WIRE = 1;
const int FIELD_RENDER_MIXED = 2;
const float FIELD_VIEW_CELLS = 26.0;
const float FIELD_CUBE_HALF = 0.57;
const float FIELD_TORUS_RING = 0.7;
const float FIELD_TORUS_TUBE = 0.28;

vec3 fieldHash(vec3 p) {
  vec3 q = fract(p * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.xxy + q.yxx) * q.zyx);
}

mat3 axisAngleMatrix(vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  float t = 1.0 - c;
  return mat3(
    t * axis.x * axis.x + c, t * axis.x * axis.y + s * axis.z, t * axis.x * axis.z - s * axis.y,
    t * axis.x * axis.y - s * axis.z, t * axis.y * axis.y + c, t * axis.y * axis.z + s * axis.x,
    t * axis.x * axis.z + s * axis.y, t * axis.y * axis.z - s * axis.x, t * axis.z * axis.z + c
  );
}

struct FieldObject {
  bool present;
  int type;
  bool wire;
  vec3 center;
  mat3 rotation;
  float radius;
  vec2 uvOffset;
};

float fieldPeriod() {
  return max(floor(u_fieldLoopCells + 0.5), 1.0);
}

// Grid offset of one z slice, repeating every Loop Length slices.
vec2 fieldSliceShift(float slice) {
  return fieldHash(vec3(mod(slice, fieldPeriod()) + 0.37, 5.1, 9.7)).xy;
}

float fieldSpread() {
  return max(u_fieldSpread, u_fieldClearance + 1.0);
}

// Shape, render mode, spin, and texture offset of an object from its cell
// key; the layouts set its presence, center, and radius.
void fieldDecorate(inout FieldObject object, vec3 key) {
  vec3 pick = fieldHash(key);
  vec3 place = fieldHash(key + 19.1);
  vec3 turn = fieldHash(key + 47.3);
  vec3 extra = fieldHash(key + 113.7);
  // Mix includes the model once one is loaded; without one it is a sphere.
  float kinds = u_fieldModelReady > 0.5 ? 6.0 : 5.0;
  object.type = u_fieldGeometry == 0 ? int(min(floor(pick.y * kinds), kinds - 1.0)) : u_fieldGeometry - 1;
  if (object.type == FIELD_MODEL && u_fieldModelReady < 0.5) object.type = FIELD_SPHERE;
  object.wire = u_fieldRender == FIELD_RENDER_WIRE || (u_fieldRender == FIELD_RENDER_MIXED && pick.z < 0.5);
  vec3 axis = normalize(turn * 2.0 - 1.0 + vec3(0.0, 0.001, 0.0));
  // Once or twice per Spin, either way round: whole turns per loop.
  float rate = (place.y < 0.5 ? -1.0 : 1.0) * (place.z < 0.5 ? 1.0 : 2.0);
  object.rotation = axisAngleMatrix(axis, extra.z * TAU + rate * u_fieldSpin);
  object.uvOffset = extra.xy * clamp(u_fieldVariation, 0.0, 1.0);
}

// `cell` holds the grid indices in x and y and the slice in z; `base` is the
// cell center after the slice shift.
FieldObject fieldObjectAt(vec3 cell, vec3 base) {
  FieldObject object;
  vec3 key = vec3(cell.xy, mod(cell.z, fieldPeriod())) + 0.37;
  vec3 pick = fieldHash(key);
  vec3 place = fieldHash(key + 19.1);
  float axisDistance = length(base.xy);
  object.present = axisDistance >= u_fieldClearance && axisDistance <= fieldSpread() && pick.x < u_fieldDensity;
  object.radius = 0.5 * clamp(u_fieldSize, 0.05, 1.0) * (0.55 + 0.45 * place.x);
  // Each axis moves at most as far as keeps the bounding sphere in the cell.
  object.center = base + (fieldHash(key + 83.9) * 2.0 - 1.0) * (0.5 - object.radius);
  fieldDecorate(object, key);
  return object;
}

// Spiral layout: each slice is split into Arms angular sectors, turned by
// Twist per slice, and unit-wide rings from Clearance outward. `cell` holds
// the arm, ring, and slice. The object sits on its arm's center line, spread
// across the sector by Arm Width, and its bounding sphere stays inside the
// sector, ring, and slice.
FieldObject fieldSpiralObjectAt(vec3 cell) {
  FieldObject object;
  vec3 key = vec3(cell.xy, mod(cell.z, fieldPeriod())) + 211.37;
  vec3 pick = fieldHash(key);
  vec3 place = fieldHash(key + 19.1);
  vec3 jitter = fieldHash(key + 83.9);
  float arms = max(floor(u_fieldArms + 0.5), 1.0);
  float innerRadius = u_fieldClearance + cell.y;
  object.present = cell.y >= 0.0 && innerRadius < fieldSpread() && pick.x < u_fieldDensity;
  // Half the chord of the sector at its inner edge bounds the size.
  float room = arms >= 2.0 ? min(0.5, innerRadius * sin(PI / arms)) : 0.5;
  object.radius = room * clamp(u_fieldSize, 0.05, 1.0) * (0.55 + 0.45 * place.x);
  float centerRadius = innerRadius + 0.5 + (jitter.x * 2.0 - 1.0) * (0.5 - object.radius);
  // The angle from the arm keeps the sphere clear of the sector planes.
  float angleRoom = arms >= 2.0 ? max(PI / arms - asin(min(object.radius / centerRadius, 1.0)), 0.0) : PI;
  float angle = u_fieldTwist * cell.z + cell.x * TAU / arms
    + (jitter.y * 2.0 - 1.0) * angleRoom * clamp(u_fieldArmWidth, 0.0, 1.0);
  object.center = vec3(centerRadius * cos(angle), centerRadius * sin(angle),
    cell.z + (jitter.z * 2.0 - 1.0) * (0.5 - object.radius));
  fieldDecorate(object, key);
  return object;
}

// Nearest positive distance along a ray (in xy) to the cylinder of `radius`
// around the z axis, or a large value.
float fieldCylinderExit(vec2 origin, vec2 direction, float radius) {
  float a = dot(direction, direction);
  if (a < 1.0e-8 || radius <= 0.0) return 1.0e9;
  float b = dot(origin, direction);
  float discriminant = b * b - a * (dot(origin, origin) - radius * radius);
  if (discriminant < 0.0) return 1.0e9;
  float root = sqrt(discriminant);
  float near = (-b - root) / a;
  float far = (-b + root) / a;
  return near > 1.0e-5 ? near : far > 1.0e-5 ? far : 1.0e9;
}

// Distance along a ray (in xy) to the plane through the z axis at `angle`.
float fieldAxialPlaneExit(vec2 origin, vec2 direction, float angle) {
  vec2 normal = vec2(-sin(angle), cos(angle));
  float approach = dot(direction, normal);
  if (abs(approach) < 1.0e-8) return 1.0e9;
  float t = -dot(origin, normal) / approach;
  return t > 1.0e-5 ? t : 1.0e9;
}

float fieldSegment(vec3 p, vec3 a, vec3 b) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

// Surface (x) and edge (y) distances of the loaded model at an object-space
// point: bilinear within the two nearest slices of the atlas, then linear
// between them. The model lies inside the unit sphere, so the distance to it
// is also a lower bound and takes over outside the sphere without a lookup.
vec2 fieldModelDistances(vec3 p) {
  float sphereBound = length(p) - 1.0;
  if (sphereBound > 0.1) return vec2(sphereBound);
  float n = u_fieldModelGrid.x;
  vec2 atlasSize = n * u_fieldModelGrid.yz;
  vec3 g = clamp((p + FIELD_MODEL_EXTENT) / (2.0 * FIELD_MODEL_EXTENT) * n - 0.5, 0.0, n - 1.0);
  float z0 = floor(g.z);
  float z1 = min(z0 + 1.0, n - 1.0);
  // Offset the division by half a slice: 7.0 / 7.0 may round below 1.0.
  float row0 = floor((z0 + 0.5) / u_fieldModelGrid.y);
  float row1 = floor((z1 + 0.5) / u_fieldModelGrid.y);
  vec2 tile0 = vec2(z0 - row0 * u_fieldModelGrid.y, row0) * n;
  vec2 tile1 = vec2(z1 - row1 * u_fieldModelGrid.y, row1) * n;
  // Explicit LOD: this runs inside the march loop (see createThreeDSource).
  vec2 grid = mix(
    textureLod(u_fieldModelTex, (tile0 + g.xy + 0.5) / atlasSize, 0.0).rg,
    textureLod(u_fieldModelTex, (tile1 + g.xy + 0.5) / atlasSize, 0.0).rg,
    g.z - z0
  );
  return max(grid, vec2(sphereBound));
}

// Solid primitives in object space, each inside the unit sphere.
float fieldSolidDistance(int type, vec3 p) {
  if (type == FIELD_SPHERE) return length(p) - 1.0;
  // Interpolated grid distances can slightly overshoot, so step 90%.
  if (type == FIELD_MODEL) return fieldModelDistances(p).x * 0.9;
  if (type == FIELD_CUBE) {
    vec3 q = abs(p) - vec3(FIELD_CUBE_HALF - 0.05);
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.05;
  }
  if (type == FIELD_PRISM) {
    // Triangle with inradius 0.375 (apex at y = 0.75), 1.2 long along z.
    vec3 q = abs(p);
    return max(q.z - 0.6, max(q.x * 0.866025 + p.y * 0.5, -p.y) - 0.375);
  }
  if (type == FIELD_OCTAHEDRON) {
    vec3 q = abs(p);
    return (q.x + q.y + q.z - 1.0) * 0.57735027;
  }
  return length(vec2(length(p.xz) - FIELD_TORUS_RING, p.y) ) - FIELD_TORUS_TUBE;
}

// Edges of the same primitives as tubes of radius `width`. Mirror folds and
// angle snapping reduce each edge set to the few edges nearest the point.
float fieldWireDistance(int type, vec3 p, float width) {
  float edge;
  if (type == FIELD_MODEL) {
    // Lines thinner than a voxel break up between grid samples.
    float voxel = 2.0 * FIELD_MODEL_EXTENT / max(u_fieldModelGrid.x, 1.0);
    return (fieldModelDistances(p).y - max(width, 0.8 * voxel)) * 0.9;
  } else if (type == FIELD_SPHERE) {
    // Four great circles through the poles and parallels at 0 and ±45°.
    float angleStep = PI / 4.0;
    float meridian = floor(atan(p.z, p.x) / angleStep + 0.5) * angleStep;
    vec3 normal = vec3(-sin(meridian), 0.0, cos(meridian));
    float h = dot(p, normal);
    float meridianEdge = length(vec2(h, length(p - h * normal) - 1.0));
    float latitude = asin(clamp(p.y / max(length(p), 0.0001), -1.0, 1.0));
    float parallel = clamp(floor(latitude / angleStep + 0.5), -1.0, 1.0) * angleStep;
    float parallelEdge = length(vec2(length(p.xz) - cos(parallel), p.y - sin(parallel)));
    edge = min(meridianEdge, parallelEdge);
  } else if (type == FIELD_CUBE) {
    vec3 q = abs(p);
    vec3 corner = vec3(FIELD_CUBE_HALF);
    edge = min(
      fieldSegment(q, vec3(0.0, corner.yz), corner),
      min(fieldSegment(q, vec3(corner.x, 0.0, corner.z), corner), fieldSegment(q, vec3(corner.xy, 0.0), corner))
    );
  } else if (type == FIELD_PRISM) {
    vec3 q = vec3(abs(p.x), p.y, abs(p.z));
    vec3 apex = vec3(0.0, 0.75, 0.6);
    vec3 base = vec3(0.649519, -0.375, 0.6);
    edge = min(
      min(fieldSegment(q, apex, base), fieldSegment(q, vec3(0.0, -0.375, 0.6), base)),
      min(fieldSegment(q, vec3(apex.xy, 0.0), apex), fieldSegment(q, vec3(base.xy, 0.0), base))
    );
  } else if (type == FIELD_OCTAHEDRON) {
    vec3 q = abs(p);
    edge = min(
      fieldSegment(q, vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0)),
      min(fieldSegment(q, vec3(0.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0)), fieldSegment(q, vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0)))
    );
  } else {
    // Twelve tube circles around the ring and four circles along it.
    float ringStep = TAU / 12.0;
    float ringAngle = floor(atan(p.z, p.x) / ringStep + 0.5) * ringStep;
    vec3 radial = vec3(cos(ringAngle), 0.0, sin(ringAngle));
    vec3 tangent = vec3(-radial.z, 0.0, radial.x);
    vec3 q = p - radial * FIELD_TORUS_RING;
    float h = dot(q, tangent);
    float meridianEdge = length(vec2(h, length(q - h * tangent) - FIELD_TORUS_TUBE));
    float tubeStep = TAU / 4.0;
    float tubeAngle = floor(atan(p.y, length(p.xz) - FIELD_TORUS_RING) / tubeStep + 0.5) * tubeStep;
    float parallelEdge = length(vec2(
      length(p.xz) - (FIELD_TORUS_RING + FIELD_TORUS_TUBE * cos(tubeAngle)),
      p.y - FIELD_TORUS_TUBE * sin(tubeAngle)
    ));
    edge = min(meridianEdge, parallelEdge);
  }
  return edge - width;
}

float fieldObjectDistance(FieldObject object, vec3 position, float width) {
  // Row-vector product: the inverse rotation into object space.
  vec3 local = (position - object.center) * object.rotation / object.radius;
  float surface = object.wire ? fieldWireDistance(object.type, local, width) : fieldSolidDistance(object.type, local);
  return surface * object.radius;
}

ThreeDHit fieldHit(vec3 localRay) {
  ThreeDHit result = threeDMiss();
  vec3 forward = vec3(0.0, 0.0, -1.0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  threeDSetCameraBasis(forward, up);
  vec3 rayDirection = threeDWorldDirection(localRay, forward, up);
  // Kept cells lie at least Clearance - sqrt(0.5) from the axis, so the
  // camera offset stays inside that. Dolly moves along the path, not the look.
  vec2 offset = threeDRollMatrix() * u_cameraOffset * max(u_fieldClearance - 0.7072, 0.0);
  // The layout repeats every Loop Length cells, so wrapping the travel keeps
  // coordinates small and makes both loop ends compute the same view exactly.
  vec3 rayOrigin = vec3(offset, -mod(u_threeDTravel, fieldPeriod()) - u_cameraDolly);
  result.rayDirection = rayDirection;
  // Angle of one pixel, used to keep distant wires at least a pixel wide.
  float pixelAngle = u_threeDProjection == 0
    ? 2.0 * u_coneTangentHalfFov / max(u_fullResolution.y, 1.0)
    : u_threeDProjection == 1
      ? 2.0 * u_fisheyeHalfAngle / max(min(u_fullResolution.x, u_fullResolution.y), 1.0)
      : PI / max(u_fullResolution.y, 1.0);

  vec3 safeDirection = rayDirection + vec3(
    abs(rayDirection.x) < 0.000001 ? 0.000001 : 0.0,
    abs(rayDirection.y) < 0.000001 ? 0.000001 : 0.0,
    abs(rayDirection.z) < 0.000001 ? 0.000001 : 0.0
  );
  vec3 inverse = 1.0 / safeDirection;
  vec3 exitSide = 0.5 * sign(safeDirection);
  float spread = fieldSpread();
  bool spiral = u_fieldArms > 0.5;
  float arms = max(floor(u_fieldArms + 0.5), 1.0);
  float armAngle = TAU / arms;
  vec3 cell = vec3(1.0e6);
  vec3 base = vec3(0.0);
  FieldObject object;
  object.present = false;
  float distance = 0.0;
  float width = u_fieldWire;
  bool hit = false;
  for (int i = 0; i < 192; i++) {
    vec3 position = rayOrigin + rayDirection * distance;
    // A ray outside the swarm that moves away from the axis meets nothing more.
    if (length(position.xy) > spread + 1.0 && dot(position.xy, rayDirection.xy) > 0.0) break;
    float slice = floor(position.z + 0.5);
    // Never step past the cell's far side: the next cell may hold an object.
    float advance = (slice + exitSide.z - position.z) * inverse.z;
    if (spiral) {
      float ring = floor(length(position.xy) - u_fieldClearance);
      float armStart = u_fieldTwist * slice;
      float arm = floor((atan(position.y, position.x) - armStart) / armAngle + 0.5);
      vec3 current = vec3(mod(arm, arms), ring, slice);
      if (any(notEqual(current, cell))) {
        cell = current;
        object = fieldSpiralObjectAt(cell);
      }
      float innerRadius = u_fieldClearance + ring;
      advance = min(advance, fieldCylinderExit(position.xy, rayDirection.xy, innerRadius));
      advance = min(advance, fieldCylinderExit(position.xy, rayDirection.xy, innerRadius + 1.0));
      if (arms >= 2.0) {
        advance = min(advance, fieldAxialPlaneExit(position.xy, rayDirection.xy, armStart + (arm - 0.5) * armAngle));
        advance = min(advance, fieldAxialPlaneExit(position.xy, rayDirection.xy, armStart + (arm + 0.5) * armAngle));
      }
    } else {
      vec2 shift = fieldSliceShift(slice);
      vec3 current = vec3(floor(position.xy - shift + 0.5), slice);
      if (any(notEqual(current, cell))) {
        cell = current;
        base = vec3(cell.xy + shift, slice);
        object = fieldObjectAt(cell, base);
      }
      vec2 planes = (base.xy + exitSide.xy - position.xy) * inverse.xy;
      advance = min(advance, min(planes.x, planes.y));
    }
    advance += 0.001;
    if (object.present) {
      width = max(u_fieldWire, 0.75 * pixelAngle * distance / object.radius);
      float surface = fieldObjectDistance(object, position, width);
      if (surface < 0.0004 * (1.0 + distance)) {
        hit = true;
        break;
      }
      advance = min(surface, advance);
    }
    distance += advance;
    if (distance > FIELD_VIEW_CELLS) break;
  }
  if (!hit) return result;
  vec3 position = rayOrigin + rayDirection * distance;
  float epsilon = 0.0003 + 0.3 * pixelAngle * distance;
  // Grid-sampled models need half a voxel, or the normal follows the
  // interpolation cells and the 8-bit steps instead of the surface.
  if (object.type == FIELD_MODEL) {
    epsilon = max(epsilon, FIELD_MODEL_EXTENT / max(u_fieldModelGrid.x, 1.0) * object.radius);
  }
  vec2 k = vec2(1.0, -1.0);
  vec3 normal = normalize(
    k.xyy * fieldObjectDistance(object, position + k.xyy * epsilon, width)
    + k.yyx * fieldObjectDistance(object, position + k.yyx * epsilon, width)
    + k.yxy * fieldObjectDistance(object, position + k.yxy * epsilon, width)
    + k.xxx * fieldObjectDistance(object, position + k.xxx * epsilon, width)
  );
  result.hit = true;
  result.position = position;
  result.normal = normal;
  result.distance = distance;
  // Surface UV in object space, so the canvas turns with each object and
  // Variation shifts every object to a different part of the canvas.
  vec3 local = (position - object.center) * object.rotation / object.radius;
  vec2 uv;
  if (object.type == FIELD_SPHERE) {
    uv = vec2(atan(local.z, local.x) / TAU + 0.5, acos(clamp(-local.y / max(length(local), 0.0001), -1.0, 1.0)) / PI);
  } else if (object.type == FIELD_CUBE || object.type == FIELD_PRISM || object.type == FIELD_OCTAHEDRON) {
    // Planar mapping on each flat face, from a basis built on its normal.
    vec3 faceNormal = normalize(normal * object.rotation);
    vec3 tangentU = normalize(cross(abs(faceNormal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0), faceNormal));
    uv = vec2(dot(local, tangentU), dot(local, cross(faceNormal, tangentU))) * 0.5 + 0.5;
  } else if (object.type == FIELD_MODEL) {
    // Arbitrary models blend three object-space projections by the normal,
    // so the canvas follows the object without seams from a single axis.
    vec3 weights = pow(abs(normalize(normal * object.rotation)), vec3(4.0));
    weights /= max(weights.x + weights.y + weights.z, 0.0001);
    float repeat = max(u_coneTextureRepeat, 1.0);
    result.hasColor = true;
    result.color = threeDSampleUnwrapped((local.zy * 0.5 + 0.5) * repeat + object.uvOffset) * weights.x
      + threeDSampleUnwrapped((local.xz * 0.5 + 0.5) * repeat + object.uvOffset) * weights.y
      + threeDSampleUnwrapped((local.xy * 0.5 + 0.5) * repeat + object.uvOffset) * weights.z;
    uv = local.xy * 0.5 + 0.5;
  } else {
    uv = vec2(atan(local.z, local.x) / TAU + 0.5, atan(local.y, length(local.xz) - FIELD_TORUS_RING) / TAU + 0.5);
  }
  result.uv = uv * max(u_coneTextureRepeat, 1.0) + object.uvOffset;
  result.hasUv = true;
  result.uvTiled = true;
  result.mapScale = 1.0;
  // Objects fade out before the view limit, so none pops in.
  result.fade = 1.0 - smoothstep(FIELD_VIEW_CELLS - 12.0, FIELD_VIEW_CELLS, distance);
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
  } else if (hit.hasColor) {
    color = hit.color;
  } else if (hit.uvTiled) {
    color = threeDSampleUnwrapped(hit.uv + u_coneTextureOffset);
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

  ThreeDHit hit;
  float fogScale = 0.25;
  if (u_threeDShape == SHAPE_LATTICE) {
    hit = latticeHit(localRay);
    fogScale = 1.0 / max(u_latticeScale, 0.1);
  } else if (u_threeDShape == SHAPE_TERRAIN) {
    hit = terrainHit(localRay);
    fogScale = 0.15;
  } else if (u_threeDShape == SHAPE_EXTRUSION) {
    hit = extrusionHit(localRay);
    fogScale = 0.3;
  } else if (u_threeDShape == SHAPE_RIBBON) {
    hit = ribbonHit(localRay);
    fogScale = 0.3;
  } else if (u_threeDShape == SHAPE_RINGS) {
    hit = ringsHit(localRay);
    fogScale = 0.25 / max(u_ringsSpacing, 0.05);
  } else if (u_threeDShape == SHAPE_FIELD) {
    hit = fieldHit(localRay);
    fogScale = 0.12;
  } else {
    hit = torusHit(localRay);
  }
  if (!hit.hit) {
    gl_FragColor = background;
    return;
  }
  vec4 color = threeDSurfaceColor(hit);
  color.rgb *= hit.fade;
  gl_FragColor = threeDApplyFog(color, hit.distance, fogScale);
}
