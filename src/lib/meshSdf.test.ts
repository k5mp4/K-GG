import { describe, expect, it } from 'vitest';
import {
  MESH_SDF_EXTENT,
  buildMeshSdf,
  closestPointOnTriangle,
  collectFeatureEdges,
  normalizeTriangles,
  type MeshSdf,
} from './meshSdf';

/** A cube of half size `half` as 12 triangles with outward winding. */
export function cubeTriangles(half: number): Float32Array {
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ].map((corner) => corner.map((value) => value * half));
  const faces = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
    [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3],
  ];
  const positions: number[] = [];
  for (const [a, b, c, d] of faces) {
    positions.push(...corners[a], ...corners[b], ...corners[c], ...corners[a], ...corners[c], ...corners[d]);
  }
  return new Float32Array(positions);
}

/** Signed surface distance and edge distance at a voxel, read like the shader. */
function sample(sdf: MeshSdf, x: number, y: number, z: number): { surface: number; edge: number } {
  const n = sdf.resolution;
  const width = n * sdf.tilesX;
  const texel = ((Math.floor(z / sdf.tilesX) * n + y) * width + (z % sdf.tilesX) * n + x) * 2;
  return { surface: sdf.data[texel], edge: sdf.data[texel + 1] };
}

/** Object-space coordinate of a voxel center. */
function voxelCenter(sdf: MeshSdf, index: number): number {
  return -MESH_SDF_EXTENT + (index + 0.5) * (2 * MESH_SDF_EXTENT / sdf.resolution);
}

/** Voxel index nearest an object-space coordinate. */
function voxelAt(sdf: MeshSdf, value: number): number {
  return Math.round((value + MESH_SDF_EXTENT) / (2 * MESH_SDF_EXTENT) * sdf.resolution - 0.5);
}

describe('mesh distance grids', () => {
  it('centers the triangles and fits them into the unit sphere', () => {
    const shifted = cubeTriangles(3).map((value, index) => value + (index % 3 === 0 ? 10 : 0));
    const normalized = normalizeTriangles(shifted);
    let farthest = 0;
    let sumX = 0;
    for (let i = 0; i < normalized.length; i += 3) {
      farthest = Math.max(farthest, Math.hypot(normalized[i], normalized[i + 1], normalized[i + 2]));
      sumX += normalized[i];
    }
    expect(farthest).toBeCloseTo(1, 5);
    expect(sumX / (normalized.length / 3)).toBeCloseTo(0, 5);
  });

  it('finds the closest point on a triangle face, edge, and corner', () => {
    const a: [number, number, number] = [0, 0, 0];
    const b: [number, number, number] = [1, 0, 0];
    const c: [number, number, number] = [0, 1, 0];
    const expectPoint = (actual: number[], expected: number[]) => {
      expected.forEach((value, axis) => expect(actual[axis]).toBeCloseTo(value, 10));
    };
    expectPoint(closestPointOnTriangle([0.2, 0.2, 5], a, b, c), [0.2, 0.2, 0]);
    expectPoint(closestPointOnTriangle([0.5, -2, 0], a, b, c), [0.5, 0, 0]);
    expectPoint(closestPointOnTriangle([-1, -1, 0], a, b, c), [0, 0, 0]);
  });

  it('keeps the cube edges and drops the diagonals of its flat faces', () => {
    expect(collectFeatureEdges(cubeTriangles(0.5))).toHaveLength(12);
  });

  it('is negative inside a closed mesh, zero on it, and positive outside', () => {
    const sdf = buildMeshSdf(cubeTriangles(0.5), 24);
    expect(sdf.triangleCount).toBe(12);
    expect(sdf.edgeCount).toBe(12);
    expect(sdf.data).toHaveLength(sdf.resolution * sdf.tilesX * sdf.resolution * sdf.tilesY * 2);
    const middle = voxelAt(sdf, 0);
    expect(sample(sdf, middle, middle, middle).surface).toBeLessThan(0);
    const outside = voxelAt(sdf, 0.95);
    expect(sample(sdf, outside, outside, outside).surface).toBeGreaterThan(0);
    // Half a voxel off the +x face the distance is about half a voxel.
    const onFace = sample(sdf, voxelAt(sdf, 0.5), middle, middle).surface;
    expect(Math.abs(onFace)).toBeLessThan(2 * MESH_SDF_EXTENT / sdf.resolution);
    // The middle of a face is half a side from every edge, a cube corner is on three.
    expect(sample(sdf, voxelAt(sdf, 0.5), middle, middle).edge).toBeGreaterThan(0.3);
    const corner = voxelAt(sdf, 0.5);
    expect(sample(sdf, corner, corner, corner).edge).toBeLessThan(0.1);
  });

  it('keeps every distance a lower bound of the true distance, and a useful one', () => {
    const half = 0.5;
    const sdf = buildMeshSdf(cubeTriangles(half), 24);
    const outsideDistance = (x: number, y: number, z: number) => Math.hypot(
      Math.max(Math.abs(x) - half, 0), Math.max(Math.abs(y) - half, 0), Math.max(Math.abs(z) - half, 0),
    );
    let checked = 0;
    for (let z = 0; z < sdf.resolution; z += 3) {
      for (let y = 0; y < sdf.resolution; y += 3) {
        for (let x = 0; x < sdf.resolution; x += 3) {
          const truth = outsideDistance(voxelCenter(sdf, x), voxelCenter(sdf, y), voxelCenter(sdf, z));
          if (truth < 0.2) continue;
          const stored = sample(sdf, x, y, z).surface;
          // Sphere tracing must never step past the surface, and far values
          // should still allow long steps.
          expect(stored).toBeLessThanOrEqual(truth + 1e-6);
          expect(stored).toBeGreaterThan(truth * 0.75);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  it('draws an open sheet as a thin shell instead of dropping it', () => {
    const sheet = new Float32Array([
      -0.6, -0.6, 0, 0.6, -0.6, 0, 0.6, 0.6, 0,
      -0.6, -0.6, 0, 0.6, 0.6, 0, -0.6, 0.6, 0,
    ]);
    const sdf = buildMeshSdf(sheet, 24);
    const middle = voxelAt(sdf, 0);
    const onSheet = Math.min(
      sample(sdf, middle, middle, voxelAt(sdf, -0.01)).surface,
      sample(sdf, middle, middle, voxelAt(sdf, 0.01)).surface,
    );
    expect(onSheet).toBeLessThan(0);
    expect(sample(sdf, middle, middle, voxelAt(sdf, 0.5)).surface).toBeGreaterThan(0);
    expect(sample(sdf, middle, middle, voxelAt(sdf, -0.5)).surface).toBeGreaterThan(0);
  });
});
