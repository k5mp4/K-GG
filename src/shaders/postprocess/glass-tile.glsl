// GlassTile is the screen-space port of the KG_Glass tile surface model.
// Coordinates are evaluated in full-resolution pixels so tiled export keeps
// the same cell phase as the preview.
const float GLASS_TILE_TAU = 6.283185307179586;
const float GLASS_TILE_HEX_ROW_HEIGHT = 0.8660254037844386;

struct GlassTileCoordinate {
  vec2 local;
  vec2 cell;
  float edge;
};

float glassTileFloat(float value, float fallback, float minimum, float maximum) {
  return clamp(finiteFloat(value, fallback), minimum, maximum);
}

vec2 glassTileResolution() {
  return max(vec2(
    finiteFloat(u_fullResolution.x, 1.0),
    finiteFloat(u_fullResolution.y, 1.0)
  ), vec2(1.0));
}

vec2 glassTileSourceResolution() {
  return max(vec2(
    finiteFloat(u_tileResolution.x, 1.0),
    finiteFloat(u_tileResolution.y, 1.0)
  ), vec2(1.0));
}

vec2 glassTileGlobalCoord(vec2 globalUv) {
  return globalUv * glassTileResolution();
}

vec2 glassTileRotatePosition(vec2 position, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(
    position.x * c - position.y * s,
    position.x * s + position.y * c
  );
}

float glassTileFract01(float value) {
  return value - floor(value);
}

float glassTileParity(float value) {
  return mod(mod(value, 2.0) + 2.0, 2.0);
}

float glassTileShapeEdge(vec2 local, vec2 cell, int pattern) {
  if (pattern == 0 || pattern == 4) {
    return min(0.5 - abs(local.x), 0.5 - abs(local.y));
  }
  if (pattern == 1) {
    return 0.5 - abs(local.x) - abs(local.y);
  }
  if (pattern == 2) {
    return min(
      0.5 - abs(local.y),
      0.57735026 - abs(local.x) - abs(local.y) * 0.57735026
    );
  }

  vec2 uv = local + vec2(0.5);
  bool even = glassTileParity(cell.x + cell.y) < 0.5;
  float edge = even
    ? min(uv.x, uv.y)
    : min(1.0 - uv.x, 1.0 - uv.y);
  float diagonal = even
    ? 1.0 - uv.x - uv.y
    : uv.x + uv.y - 1.0;
  return 0.5 * min(edge, diagonal);
}

GlassTileCoordinate glassTileCoordinate(vec2 position) {
  float tileSize = max(glassTileFloat(u_glassTileSize, 96.0, 4.0, 4096.0), 0.01);
  int pattern = int(clamp(floor(finiteFloat(float(u_glassTilePattern), 0.0) + 0.5), 0.0, 4.0));
  vec2 scaled = glassTileRotatePosition(position, glassTileFloat(
    u_glassTileRotation,
    0.0,
    -3.141592653589793,
    3.141592653589793
  )) / tileSize;

  if (pattern == 2) {
    float row = scaled.y / GLASS_TILE_HEX_ROW_HEIGHT;
    float cellY = floor(row);
    float offset = glassTileParity(cellY) > 0.5 ? 0.5 : 0.0;
    float column = scaled.x - offset;
    float cellX = floor(column);
    vec2 local = vec2(
      glassTileFract01(column) - 0.5,
      glassTileFract01(row) - 0.5
    );
    return GlassTileCoordinate(
      local,
      vec2(cellX, cellY),
      glassTileShapeEdge(local, vec2(cellX, cellY), pattern)
    );
  }

  float cellY = floor(scaled.y);
  float offset = pattern == 4 && glassTileParity(cellY) > 0.5 ? 0.5 : 0.0;
  float column = scaled.x - offset;
  float cellX = floor(column);
  vec2 local = vec2(
    glassTileFract01(column) - 0.5,
    glassTileFract01(scaled.y) - 0.5
  );
  return GlassTileCoordinate(
    local,
    vec2(cellX, cellY),
    glassTileShapeEdge(local, vec2(cellX, cellY), pattern)
  );
}

// This is a float-only equivalent of the deterministic integer mixer used by
// the Rust CPU/wgpu implementation. It remains stable across WebGL1-style
// shader compilation, where uint bit operations are not available.
float glassTileHash01(vec2 cell) {
  float seed = glassTileFloat(u_glassTileSeed, 17.0, 0.0, 1000000.0);
  float value = dot(cell, vec2(0.1031, 0.11369)) + seed * 0.01731;
  value += sin(dot(cell, vec2(12.9898, 78.233)) + seed * 37.719) * 17.0;
  return fract(sin(value) * 43758.5453123);
}

float glassTileSurfaceHeight(vec2 position) {
  GlassTileCoordinate tile = glassTileCoordinate(position);
  float bevel = glassTileFloat(u_glassTileBevel, 0.18, 0.01, 0.5);
  float feather = 0.02;
  float mask = smoothstep(-feather, feather, tile.edge);
  float edgeProfile = smoothstep(0.0, 1.0, clamp(tile.edge / bevel, 0.0, 1.0));
  int pattern = int(clamp(floor(finiteFloat(float(u_glassTilePattern), 0.0) + 0.5), 0.0, 4.0));
  float centerEdge = pattern == 3 ? 1.0 / 6.0 : 0.5;
  float dome = smoothstep(0.0, 1.0, clamp(tile.edge / centerEdge, 0.0, 1.0));
  float curvature = glassTileFloat(u_glassTileCurvature, 0.75, 0.0, 1.0);
  float curvatureProfile = 1.0 + (dome - 1.0) * curvature;
  float phase = glassTileHash01(tile.cell) * GLASS_TILE_TAU;
  float detailScale = glassTileFloat(u_glassTileDetailScale, 2.0, 0.1, 16.0);
  float roughness = glassTileFloat(u_glassTileRoughness, 0.12, 0.0, 1.0);
  float u = (tile.local.x + 0.5) * detailScale * GLASS_TILE_TAU + phase;
  float v = (tile.local.y + 0.5) * detailScale * GLASS_TILE_TAU - phase * 0.71;
  float detail = sin(u) * sin(v) * roughness * 0.18;
  float surfaceHeight = glassTileFloat(u_glassTileSurfaceHeight, 0.45, 0.0, 1.0);
  return max(surfaceHeight * 5.0 * edgeProfile * curvatureProfile * mask * (1.0 + detail), 0.0);
}

vec3 glassTileSurfaceNormal(vec2 position) {
  float tileSize = glassTileFloat(u_glassTileSize, 96.0, 4.0, 4096.0);
  float epsilon = clamp(tileSize * 0.002, 0.25, 4.0);
  float dx = glassTileSurfaceHeight(position + vec2(epsilon, 0.0))
    - glassTileSurfaceHeight(position - vec2(epsilon, 0.0));
  float dy = glassTileSurfaceHeight(position + vec2(0.0, epsilon))
    - glassTileSurfaceHeight(position - vec2(0.0, epsilon));
  vec3 candidate = vec3(-dx, -dy, 2.0 * epsilon);
  float lengthSquared = dot(candidate, candidate);
  if (!(lengthSquared > 0.000001) || lengthSquared >= 1000000000.0) {
    return vec3(0.0, 0.0, 1.0);
  }
  return candidate * inversesqrt(lengthSquared);
}

vec2 glassTileRefractionOffset(vec2 position) {
  vec3 normal = glassTileSurfaceNormal(position);
  float refraction = glassTileFloat(u_glassTileRefraction, 28.0, 0.0, 256.0);
  return normal.xy * refraction;
}

vec2 glassTileResolveUv(vec2 globalCoord) {
  vec2 localUv = (globalCoord - vec2(
    finiteFloat(u_tileOffset.x, 0.0),
    finiteFloat(u_tileOffset.y, 0.0)
  )) / glassTileSourceResolution();
  int edgeMode = int(clamp(floor(finiteFloat(float(u_glassTileEdgeMode), 1.0) + 0.5), 0.0, 3.0));
  if (edgeMode == 0) return clamp(localUv, 0.0, 1.0);
  if (edgeMode == 1) return fract(localUv);
  if (edgeMode == 2) return mirrorRepeatUv(localUv);
  return localUv;
}

vec4 sampleGlassTileSource(vec2 globalCoord) {
  vec2 uv = glassTileResolveUv(globalCoord);
  int edgeMode = int(clamp(floor(finiteFloat(float(u_glassTileEdgeMode), 1.0) + 0.5), 0.0, 3.0));
  if (edgeMode == 3 && (
    uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0
  )) {
    return vec4(0.0);
  }
  return texture2D(u_sourceTex, clamp(uv, 0.0, 1.0));
}

bool glassTileIsIdentity() {
  return glassTileFloat(u_glassTileMix, 1.0, 0.0, 1.0) <= 0.0001
    || glassTileFloat(u_glassTileSurfaceHeight, 0.45, 0.0, 1.0) <= 0.0001
    || glassTileFloat(u_glassTileRefraction, 28.0, 0.0, 256.0) <= 0.0001;
}

vec4 glassTile(vec2 globalUv, vec2 globalCoord) {
  vec2 position = glassTileGlobalCoord(globalUv);
  vec2 offset = glassTileRefractionOffset(position);
  float dispersion = glassTileFloat(u_glassTileDispersion, 0.06, 0.0, 1.0);
  vec4 original = sampleGlassTileSource(position);
  vec4 red = sampleGlassTileSource(position + offset * (1.0 + dispersion));
  vec4 green = sampleGlassTileSource(position + offset);
  vec4 blue = sampleGlassTileSource(position + offset * (1.0 - dispersion));
  vec4 refracted = vec4(red.r, green.g, blue.b, green.a);
  float amount = glassTileFloat(u_glassTileMix, 1.0, 0.0, 1.0);
  return applyDiffuseDither(mix(original, refracted, amount), globalCoord);
}
