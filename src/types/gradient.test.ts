import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MESH_GRADIENT,
  normalizeMeshGradientConfig,
  type MeshGradientConfig,
} from './gradient';

describe('MeshGradientConfig', () => {
  it('provides a straight unit-square 2x2 patch by default', () => {
    expect(DEFAULT_MESH_GRADIENT.rows).toBe(2);
    expect(DEFAULT_MESH_GRADIENT.columns).toBe(2);
    expect(DEFAULT_MESH_GRADIENT.corners).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
    expect(Object.values(DEFAULT_MESH_GRADIENT.handles)).toHaveLength(4);
    expect(Object.values(DEFAULT_MESH_GRADIENT.handles).every(edge => edge.length === 2 && edge.every(point => point.length === 2))).toBe(true);
    expect(DEFAULT_MESH_GRADIENT.colorPositions).toHaveLength(4);
  });

  it('completes invalid persisted fields without coercing strings or mutating input', () => {
    const input = {
      rows: 9,
      corners: [[0.2, 0.3], ['0.4', Number.NaN], [Number.POSITIVE_INFINITY, 0.7]],
      handles: { bottom: [[-10, 8]], right: [['1', 0.5]] },
      colorPositions: [-1, 0.5, Number.NaN, 2],
      extra: 'ignored',
    };
    const before = JSON.stringify(input);
    const normalized: MeshGradientConfig = normalizeMeshGradientConfig(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(normalized.rows).toBe(2);
    expect(normalized.corners[0]).toEqual([0.2, 0.3]);
    expect(normalized.corners[1]).toEqual(DEFAULT_MESH_GRADIENT.corners[1]);
    expect(normalized.corners[2]).toEqual(DEFAULT_MESH_GRADIENT.corners[2]);
    expect(normalized.handles.bottom[0]).toEqual([-4, 5]);
    expect(normalized.handles.bottom[1]).toEqual(DEFAULT_MESH_GRADIENT.handles.bottom[1]);
    expect(normalized.handles.right[0]).toEqual(DEFAULT_MESH_GRADIENT.handles.right[0]);
    expect(normalized.colorPositions).toEqual([0, 0.5, 2 / 3, 1]);
    expect(normalizeMeshGradientConfig(undefined)).toEqual(DEFAULT_MESH_GRADIENT);
    expect(normalizeMeshGradientConfig(null)).toEqual(DEFAULT_MESH_GRADIENT);
  });
});
