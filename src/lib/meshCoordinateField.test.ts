import { describe, expect, it } from 'vitest';
import { DEFAULT_MESH_GRADIENT, normalizeMeshGradientConfig } from '../types/gradient';
import { buildMeshCoordinateField, buildMeshGradientField, meshCoordinateFieldSignature } from './meshGradientField';

const curvedMesh = normalizeMeshGradientConfig({
  ...DEFAULT_MESH_GRADIENT,
  edgeHandles: {
    horizontal: [[[[-2, 2], [3, -1]]], [[[3, 4], [-2, 3]]]],
    vertical: [[[[2, 3], [-1, 2]], [[-1, -2], [2, -1]]]],
  },
});

describe('Mesh logical-v lookup for field-driven ramps', () => {
  it('follows the logical v axis of an undeformed mesh', () => {
    const field = buildMeshCoordinateField(normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT), { width: 9, height: 9, subdivisions: 32 });
    expect(field).toHaveLength(81);
    for (let y = 0; y < 9; y += 1) {
      // Pixel centers sit at (y + 0.5) / 9 in the bottom-left-origin field.
      expect(field[y * 9 + 4]).toBeCloseTo((y + 0.5) / 9, 2);
    }
  });

  it('stays finite and inside [0, 1] for folded patches', () => {
    const folded = buildMeshCoordinateField(curvedMesh, { width: 48, height: 32, subdivisions: 16 });
    expect(Array.from(folded).every(value => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
  });

  it('agrees with the baked ramp colors, so influence 0 and 1 share the same v', () => {
    const rampWidth = 256;
    const ramp = new Uint8Array(rampWidth * 4).map((_, index) => (index % 4 === 3 ? 255 : Math.floor(index / 4)));
    const size = { width: 32, height: 24, subdivisions: 24 };
    const colors = buildMeshGradientField(curvedMesh, ramp, rampWidth, size);
    const coordinates = buildMeshCoordinateField(curvedMesh, size);
    let maxDifference = 0;
    for (let pixel = 0; pixel < coordinates.length; pixel += 1) {
      maxDifference = Math.max(maxDifference, Math.abs(colors[pixel * 4] - coordinates[pixel] * 255));
    }
    expect(maxDifference).toBeLessThanOrEqual(2);
  });

  it('keys the lookup on geometry and size, never on colors', () => {
    const base = normalizeMeshGradientConfig(DEFAULT_MESH_GRADIENT);
    const recolored = normalizeMeshGradientConfig({ ...base, colorMode: 'direct', pointColors: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'] });
    expect(meshCoordinateFieldSignature(recolored, 512, 64)).toBe(meshCoordinateFieldSignature(base, 512, 64));
    expect(meshCoordinateFieldSignature(curvedMesh, 512, 64)).not.toBe(meshCoordinateFieldSignature(base, 512, 64));
    expect(meshCoordinateFieldSignature(base, 256, 64)).not.toBe(meshCoordinateFieldSignature(base, 512, 64));
  });
});
