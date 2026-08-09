import { describe, expect, it } from 'vitest';
import { getClothVertexOffset } from './clothView';

describe('cloth view deformation', () => {
  it('returns finite bounded displacements', () => {
    const values = [
      getClothVertexOffset(-1, -1, 2, 2, 0),
      getClothVertexOffset(0, 0, 2, 2, 1.5),
      getClothVertexOffset(1, 1, 2, 2, 9),
    ];
    expect(values.every(Number.isFinite)).toBe(true);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.4);
  });

  it('keeps the hanging edge more expressive than the top edge', () => {
    const top = getClothVertexOffset(0, 1, 2, 2, 2);
    const bottom = getClothVertexOffset(0, -1, 2, 2, 2);
    expect(Math.abs(bottom)).toBeGreaterThanOrEqual(Math.abs(top));
  });
});
