import { describe, expect, it } from 'vitest';
import { getPaddedTileRegion } from './tileRender';

describe('getPaddedTileRegion', () => {
  it('preserves the original tile geometry without padding', () => {
    expect(getPaddedTileRegion(1, 1, 256, 700, 600, 0)).toEqual({
      coreX: 256,
      coreY: 256,
      coreWidth: 256,
      coreHeight: 256,
      renderX: 256,
      renderY: 256,
      renderWidth: 256,
      renderHeight: 256,
      sourceX: 0,
      sourceY: 0,
    });
  });

  it('expands an interior tile on every side and crops back to its core', () => {
    expect(getPaddedTileRegion(1, 1, 256, 900, 900, 40)).toEqual({
      coreX: 256,
      coreY: 256,
      coreWidth: 256,
      coreHeight: 256,
      renderX: 216,
      renderY: 216,
      renderWidth: 336,
      renderHeight: 336,
      sourceX: 40,
      sourceY: 40,
    });
  });

  it('clips padding at image edges while retaining the partial core tile', () => {
    expect(getPaddedTileRegion(2, 2, 256, 700, 600, 40)).toEqual({
      coreX: 512,
      coreY: 512,
      coreWidth: 188,
      coreHeight: 88,
      renderX: 472,
      renderY: 472,
      renderWidth: 228,
      renderHeight: 128,
      sourceX: 40,
      sourceY: 40,
    });
  });
});
