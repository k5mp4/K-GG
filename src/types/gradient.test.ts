import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MESH_GRADIENT,
  normalizeMeshGradientConfig,
  type MeshGradientConfig,
} from './gradient';

describe('MeshGradientConfig', () => {
  it('provides a straight unit-square 2x2 grid in ramp color mode by default', () => {
    expect(DEFAULT_MESH_GRADIENT.rows).toBe(2);
    expect(DEFAULT_MESH_GRADIENT.columns).toBe(2);
    expect(DEFAULT_MESH_GRADIENT.corners).toEqual([[0, 0], [1, 0], [0, 1], [1, 1]]);
    expect(Object.values(DEFAULT_MESH_GRADIENT.handles)).toHaveLength(4);
    expect(Object.values(DEFAULT_MESH_GRADIENT.handles).every(edge => edge.length === 2 && edge.every(point => point.length === 2))).toBe(true);
    expect(DEFAULT_MESH_GRADIENT.colorMode).toBe('ramp');
    expect(DEFAULT_MESH_GRADIENT.points).toHaveLength(4);
  });

  it('completes legacy single-Coons fields without coercing strings or mutating input', () => {
    const input = {
      rows: 9,
      corners: [[0.2, 0.3], ['0.4', Number.NaN], [Number.POSITIVE_INFINITY, 0.7]],
      handles: { bottom: [[-10, 8]], right: [['1', 0.5]] },
      extra: 'ignored',
    };
    const before = JSON.stringify(input);
    const normalized: MeshGradientConfig = normalizeMeshGradientConfig(input);

    expect(JSON.stringify(input)).toBe(before);
    // Legacy data without grid fields always normalizes to the 2x2 grid.
    expect(normalized.rows).toBe(2);
    expect(normalized.columns).toBe(2);
    expect(normalized.points[0]).toEqual([0.2, 0.3]);
    expect(normalized.colorMode).toBe('ramp');
    expect(normalizeMeshGradientConfig(undefined)).toEqual(DEFAULT_MESH_GRADIENT);
    expect(normalizeMeshGradientConfig(null)).toEqual(DEFAULT_MESH_GRADIENT);
  });

  it('treats legacy corner data without grid rows/columns as a 2x2 grid', () => {
    const input = {
      corners: [[0.2, 0.3], [1, 0], [0, 1], [1, 1]],
      handles: {
        bottom: [[0.5, 0], [0.8, 0]],
        right: [[1, 0.3], [1, 0.6]],
        top: [[0.7, 1], [0.4, 1]],
        left: [[0, 0.6], [0, 0.3]],
      },
    };
    const normalized = normalizeMeshGradientConfig(input);
    expect(normalized.rows).toBe(2);
    expect(normalized.columns).toBe(2);
    expect(normalized.points).toHaveLength(4);
    expect(normalized.points[0]).toEqual([0.2, 0.3]);
    // Legacy bottom handle (BL->BR) is preserved as the grid's horizontal row 0.
    expect(normalized.edgeHandles.horizontal[0][0]).toEqual([[0.5, 0], [0.8, 0]]);
    // Legacy corners remain derived from the grid points.
    expect(normalized.corners[0]).toEqual([0.2, 0.3]);
  });

  it('keeps explicit grid points and edge handles in ramp color mode', () => {
    const input = {
      rows: 3,
      columns: 3,
      points: [[0, 0], [0.4, 0], [1, 0], [0, 0.5], [0.6, 0.5], [1, 0.5], [0, 1], [0.3, 1], [1, 1]],
      edgeHandles: {
        horizontal: [
          [[[0.1, 0], [0.2, 0]], [[0.6, 0], [0.8, 0]]],
          [[[0.1, 0.5], [0.2, 0.5]], [[0.7, 0.5], [0.9, 0.5]]],
          [[[0.1, 1], [0.2, 1]], [[0.7, 1], [0.8, 1]]],
        ],
        vertical: [
          [[[0, 0.1], [0, 0.2]], [[0.4, 0.1], [0.4, 0.2]], [[1, 0.1], [1, 0.2]]],
          [[[0, 0.6], [0, 0.7]], [[0.6, 0.6], [0.6, 0.7]], [[1, 0.6], [1, 0.7]]],
        ],
      },
    };
    const normalized = normalizeMeshGradientConfig(input);
    expect(normalized.rows).toBe(3);
    expect(normalized.columns).toBe(3);
    expect(normalized.points).toHaveLength(9);
    expect(normalized.points[4]).toEqual([0.6, 0.5]);
    expect(normalized.edgeHandles.horizontal).toHaveLength(3);
    expect(normalized.edgeHandles.vertical).toHaveLength(2);
    // Default color mode is ramp (ramp-driven).
    expect(normalized.colorMode).toBe('ramp');
    expect('pointColors' in normalized).toBe(false);
  });

  it('keeps point colors and direct mode when stored pointColors exist', () => {
    const input = {
      rows: 2,
      columns: 2,
      points: [[0, 0], [1, 0], [0, 1], [1, 1]],
      pointColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
    };
    const normalized = normalizeMeshGradientConfig(input);
    expect(normalized.colorMode).toBe('direct');
    expect(normalized.pointColors).toEqual(['#FF0000', '#00FF00', '#0000FF', '#FFFF00']);
  });

  it('respects an explicit ramp color mode and drops point colors', () => {
    const input = {
      rows: 2,
      columns: 2,
      colorMode: 'ramp',
      pointColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
    };
    const normalized = normalizeMeshGradientConfig(input);
    expect(normalized.colorMode).toBe('ramp');
    expect('pointColors' in normalized).toBe(false);
  });
});
