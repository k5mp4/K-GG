/**
 * Converts a triangle soup into the distance grids the Geometry Field shader
 * samples for a loaded model: a signed distance to the surface and an
 * unsigned distance to the mesh edges (for wireframe). Pure and synchronous,
 * so it runs the same in a worker and in tests.
 */

/** Voxels per axis. */
export const MESH_SDF_RESOLUTION = 48;
/** The grid covers [-extent, extent]^3 around the unit sphere the mesh is fitted into. */
export const MESH_SDF_EXTENT = 1.05;
/** Distances are exact within this many voxels of a triangle or edge. */
export const MESH_SDF_BAND_VOXELS = 3;
/**
 * Beyond the band, distances come from chamfer propagation, which can exceed
 * the Euclidean distance by a few percent; scaling keeps them lower bounds.
 */
export const MESH_SDF_FAR_SCALE = 0.88;
/** Edges between faces bending less than this (cosine of the angle) are flat-face diagonals and not drawn. */
const FLAT_EDGE_COSINE = Math.cos(Math.PI / 180);

export type MeshSdf = {
  resolution: number;
  /** Slices per atlas row and column; slice z sits at (z % tilesX, floor(z / tilesX)). */
  tilesX: number;
  tilesY: number;
  /**
   * Two floats per atlas texel, width resolution * tilesX: the signed surface
   * distance and the edge distance, in object units. Uploaded as RG16F.
   */
  data: Float32Array;
  triangleCount: number;
  edgeCount: number;
};

const CHAMFER_OFFSETS: Array<[number, number, number]> = [];
for (let dz = -1; dz <= 1; dz++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // The 13 neighbors visited before a voxel in z, y, x order.
      if (dz < 0 || (dz === 0 && (dy < 0 || (dy === 0 && dx < 0)))) CHAMFER_OFFSETS.push([dx, dy, dz]);
    }
  }
}

/**
 * Fills distances beyond the band by chamfer sweeps over the 26 neighbors
 * (weights 1, √2, √3 voxels), then scales the filled values by
 * MESH_SDF_FAR_SCALE so they stay below the Euclidean distance.
 */
function propagateDistances(distance: Float32Array, n: number, voxel: number, band: number): void {
  const weights = CHAMFER_OFFSETS.map(([dx, dy, dz]) => Math.hypot(dx, dy, dz) * voxel);
  const sweep = (direction: 1 | -1) => {
    const start = direction === 1 ? 0 : n - 1;
    for (let zi = 0; zi < n; zi++) {
      const z = start + direction * zi;
      for (let yi = 0; yi < n; yi++) {
        const y = start + direction * yi;
        for (let xi = 0; xi < n; xi++) {
          const x = start + direction * xi;
          const index = (z * n + y) * n + x;
          let best = distance[index];
          for (let k = 0; k < CHAMFER_OFFSETS.length; k++) {
            const nx = x + direction * CHAMFER_OFFSETS[k][0];
            const ny = y + direction * CHAMFER_OFFSETS[k][1];
            const nz = z + direction * CHAMFER_OFFSETS[k][2];
            if (nx < 0 || ny < 0 || nz < 0 || nx >= n || ny >= n || nz >= n) continue;
            const candidate = distance[(nz * n + ny) * n + nx] + weights[k];
            if (candidate < best) best = candidate;
          }
          distance[index] = best;
        }
      }
    }
  };
  // A second round reaches around concave parts the first could not.
  for (let round = 0; round < 2; round++) {
    sweep(1);
    sweep(-1);
  }
  for (let index = 0; index < distance.length; index++) {
    if (distance[index] > band) distance[index] = Number.isFinite(distance[index]) ? distance[index] * MESH_SDF_FAR_SCALE : 4;
  }
}

/**
 * Centers the triangles on their bounding box and scales them so every
 * vertex lies within the unit sphere. Returns a new array.
 */
export function normalizeTriangles(positions: Float32Array): Float32Array {
  const result = new Float32Array(positions.length);
  if (positions.length < 9) return result;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }
  const center = [0, 1, 2].map((axis) => (min[axis] + max[axis]) / 2);
  let radius = 0;
  for (let i = 0; i < positions.length; i += 3) {
    radius = Math.max(radius, Math.hypot(positions[i] - center[0], positions[i + 1] - center[1], positions[i + 2] - center[2]));
  }
  const scale = radius > 0 ? 1 / radius : 1;
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) result[i + axis] = (positions[i + axis] - center[axis]) * scale;
  }
  return result;
}

type Vec3 = [number, number, number];

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Closest point on triangle abc to p (Ericson, Real-Time Collision Detection 5.1.5). */
export function closestPointOnTriangle(p: Vec3, a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(p, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v];
  }
  const cp = sub(p, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w];
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    return [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w];
  }
  const denominator = 1 / (va + vb + vc);
  const v = vb * denominator;
  const w = vc * denominator;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}

function segmentDistance(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const lengthSquared = dot(ab, ab);
  const t = lengthSquared > 0 ? Math.max(0, Math.min(1, dot(ap, ab) / lengthSquared)) : 0;
  return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t);
}

function vertex(positions: Float32Array, index: number): Vec3 {
  return [positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]];
}

/**
 * Edges drawn by the wireframe: every edge except those between two faces
 * that are nearly coplanar (the diagonals that split flat quads). Vertices are
 * welded by position, since glTF meshes often split them at UV seams.
 */
export function collectFeatureEdges(positions: Float32Array): Array<[Vec3, Vec3]> {
  const weld = new Map<string, number>();
  const welded: Vec3[] = [];
  const weldIndex = (point: Vec3) => {
    const key = point.map((value) => Math.round(value * 1e5)).join(',');
    let index = weld.get(key);
    if (index === undefined) {
      index = welded.length;
      weld.set(key, index);
      welded.push(point);
    }
    return index;
  };
  const edges = new Map<string, { a: number; b: number; normals: Vec3[] }>();
  const triangleCount = Math.floor(positions.length / 9);
  for (let t = 0; t < triangleCount; t++) {
    const corners = [vertex(positions, t * 3), vertex(positions, t * 3 + 1), vertex(positions, t * 3 + 2)];
    const normal = cross(sub(corners[1], corners[0]), sub(corners[2], corners[0]));
    const length = Math.hypot(...normal);
    if (length < 1e-12) continue;
    const unit: Vec3 = [normal[0] / length, normal[1] / length, normal[2] / length];
    const indices = corners.map(weldIndex);
    for (let k = 0; k < 3; k++) {
      const a = Math.min(indices[k], indices[(k + 1) % 3]);
      const b = Math.max(indices[k], indices[(k + 1) % 3]);
      if (a === b) continue;
      const key = `${a}:${b}`;
      const edge = edges.get(key) ?? { a, b, normals: [] };
      edge.normals.push(unit);
      edges.set(key, edge);
    }
  }
  const result: Array<[Vec3, Vec3]> = [];
  for (const edge of edges.values()) {
    const flat = edge.normals.length === 2 && Math.abs(dot(edge.normals[0], edge.normals[1])) >= FLAT_EDGE_COSINE;
    if (!flat) result.push([welded[edge.a], welded[edge.b]]);
  }
  return result;
}

/**
 * Builds the distance grids of triangles already fitted into the unit sphere
 * (see normalizeTriangles). Distances are exact within the band around each
 * triangle and propagated conservatively beyond (see propagateDistances), so
 * every value is a lower bound that is safe for sphere tracing. Inside and
 * outside come from a flood fill from the grid boundary through voxels away
 * from the surface, which tolerates small holes; surfaces the flood reaches
 * on both sides (open sheets or leaky meshes) become thin shells.
 */
export function buildMeshSdf(positions: Float32Array, resolution = MESH_SDF_RESOLUTION): MeshSdf {
  const n = Math.max(4, Math.round(resolution));
  const voxel = (2 * MESH_SDF_EXTENT) / n;
  const band = MESH_SDF_BAND_VOXELS * voxel;
  const total = n * n * n;
  const surfaceDistance = new Float32Array(total).fill(Infinity);
  const surfaceSide = new Int8Array(total);
  const edgeDistance = new Float32Array(total).fill(Infinity);
  const center = (index: number) => -MESH_SDF_EXTENT + (index + 0.5) * voxel;
  const toIndex = (value: number) => (value + MESH_SDF_EXTENT) / voxel - 0.5;
  const voxelRange = (low: number, high: number): [number, number] => [
    Math.max(0, Math.floor(toIndex(low - band))),
    Math.min(n - 1, Math.ceil(toIndex(high + band))),
  ];

  const triangleCount = Math.floor(positions.length / 9);
  for (let t = 0; t < triangleCount; t++) {
    const a = vertex(positions, t * 3);
    const b = vertex(positions, t * 3 + 1);
    const c = vertex(positions, t * 3 + 2);
    const normal = cross(sub(b, a), sub(c, a));
    const [x0, x1] = voxelRange(Math.min(a[0], b[0], c[0]), Math.max(a[0], b[0], c[0]));
    const [y0, y1] = voxelRange(Math.min(a[1], b[1], c[1]), Math.max(a[1], b[1], c[1]));
    const [z0, z1] = voxelRange(Math.min(a[2], b[2], c[2]), Math.max(a[2], b[2], c[2]));
    for (let z = z0; z <= z1; z++) {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const p: Vec3 = [center(x), center(y), center(z)];
          const closest = closestPointOnTriangle(p, a, b, c);
          const offset = sub(p, closest);
          const distance = Math.hypot(...offset);
          const index = (z * n + y) * n + x;
          if (distance < surfaceDistance[index] && distance <= band) {
            surfaceDistance[index] = distance;
            surfaceSide[index] = dot(offset, normal) >= 0 ? 1 : -1;
          }
        }
      }
    }
  }

  const edges = collectFeatureEdges(positions);
  for (const [a, b] of edges) {
    const [x0, x1] = voxelRange(Math.min(a[0], b[0]), Math.max(a[0], b[0]));
    const [y0, y1] = voxelRange(Math.min(a[1], b[1]), Math.max(a[1], b[1]));
    const [z0, z1] = voxelRange(Math.min(a[2], b[2]), Math.max(a[2], b[2]));
    for (let z = z0; z <= z1; z++) {
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const index = (z * n + y) * n + x;
          const distance = segmentDistance([center(x), center(y), center(z)], a, b);
          if (distance <= band) edgeDistance[index] = Math.min(edgeDistance[index], distance);
        }
      }
    }
  }
  propagateDistances(surfaceDistance, n, voxel, band);
  propagateDistances(edgeDistance, n, voxel, band);

  // Flood the outside from the grid boundary through voxels clear of the
  // surface (farther than half a voxel diagonal from every triangle).
  const surfaceLimit = voxel * 0.87;
  const outside = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const visit = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= n || y >= n || z >= n) return;
    const index = (z * n + y) * n + x;
    if (outside[index] || surfaceDistance[index] < surfaceLimit) return;
    outside[index] = 1;
    queue[tail++] = index;
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      visit(0, i, j); visit(n - 1, i, j);
      visit(i, 0, j); visit(i, n - 1, j);
      visit(i, j, 0); visit(i, j, n - 1);
    }
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % n;
    const y = Math.floor(index / n) % n;
    const z = Math.floor(index / (n * n));
    visit(x + 1, y, z); visit(x - 1, y, z);
    visit(x, y + 1, z); visit(x, y - 1, z);
    visit(x, y, z + 1); visit(x, y, z - 1);
  }
  const isInside = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= n || y >= n || z >= n) return false;
    const index = (z * n + y) * n + x;
    return !outside[index] && surfaceDistance[index] >= surfaceLimit;
  };

  const tilesX = Math.ceil(Math.sqrt(n));
  const tilesY = Math.ceil(n / tilesX);
  const width = n * tilesX;
  const data = new Float32Array(width * n * tilesY * 2);
  for (let z = 0; z < n; z++) {
    const tileX = (z % tilesX) * n;
    const tileY = Math.floor(z / tilesX) * n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const index = (z * n + y) * n + x;
        const distance = surfaceDistance[index];
        let signed: number;
        if (distance >= surfaceLimit) {
          signed = outside[index] ? distance : -distance;
        } else if (
          isInside(x + 1, y, z) || isInside(x - 1, y, z) || isInside(x, y + 1, z)
          || isInside(x, y - 1, z) || isInside(x, y, z + 1) || isInside(x, y, z - 1)
        ) {
          // Next to the enclosed interior: the face normal decides the side.
          signed = surfaceSide[index] * distance;
        } else {
          // Only open space around: draw the surface as a thin shell.
          signed = distance - voxel * 0.5;
        }
        const texel = ((tileY + y) * width + tileX + x) * 2;
        data[texel] = signed;
        data[texel + 1] = edgeDistance[index];
      }
    }
  }
  return { resolution: n, tilesX, tilesY, data, triangleCount, edgeCount: edges.length };
}
