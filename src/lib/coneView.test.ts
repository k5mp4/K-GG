import { describe, expect, it } from 'vitest';
import { DEFAULT_CONE_VIEW } from '../types/coneView';
import {
  CONE_APERTURE_OVERSCAN,
  CONE_CAMERA_DISTANCE,
  CONE_APEX_LIMIT,
  getConeApertureRadius,
  getConeApexCanvasPoint,
  getConeApexOffset,
  getConeSeamModeIndex,
  getConeTextureTransform,
} from './coneView';

describe('cone view geometry', () => {
  it.each([1, 16 / 9, 9 / 16])('covers every frustum corner for aspect %s', (aspect) => {
    const radius = getConeApertureRadius(CONE_CAMERA_DISTANCE, aspect);
    const halfHeight = CONE_CAMERA_DISTANCE * Math.tan(Math.PI / 6);
    const cornerRadius = Math.hypot(halfHeight * aspect, halfHeight);
    expect(Number.isFinite(radius)).toBe(true);
    expect(radius).toBeCloseTo(cornerRadius * CONE_APERTURE_OVERSCAN, 10);
    expect(radius).toBeGreaterThan(cornerRadius);
  });

  it('returns a safe finite aperture for invalid inputs', () => {
    const radius = getConeApertureRadius(Number.NaN, 0);
    expect(Number.isFinite(radius)).toBe(true);
    expect(radius).toBeGreaterThan(0);
  });

  it('maps the apex position into screen space', () => {
    const centered = getConeApexOffset(CONE_CAMERA_DISTANCE, 6, 16 / 9, 0, 0);
    const shifted = getConeApexOffset(CONE_CAMERA_DISTANCE, 6, 16 / 9, 0.5, -0.25);

    expect(centered).toEqual({ x: 0, y: 0 });
    expect(shifted.x).toBeGreaterThan(0);
    expect(shifted.y).toBeLessThan(0);
  });

  it('clamps apex movement to the outer canvas range', () => {
    const offset = getConeApexOffset(CONE_CAMERA_DISTANCE, 6, 1, 10, -10);
    const limit = getConeApexOffset(CONE_CAMERA_DISTANCE, 6, 1, CONE_APEX_LIMIT, -CONE_APEX_LIMIT);
    expect(offset).toEqual(limit);
  });

  it('maps the normalized apex to the visible canvas coordinate system', () => {
    expect(getConeApexCanvasPoint(800, 400, 0, 0)).toEqual({ x: 400, y: 200 });
    expect(getConeApexCanvasPoint(800, 400, 0.5, -0.25)).toEqual({ x: 600, y: 250 });
    expect(getConeApexCanvasPoint(800, 400, CONE_APEX_LIMIT, -CONE_APEX_LIMIT)).toEqual({ x: 1200, y: 600 });
    expect(getConeApexCanvasPoint(800, 400, 10, -10)).toEqual({ x: 1200, y: 600 });
  });
});

describe('cone texture flow', () => {
  it('maps each seam mode to a stable shader branch', () => {
    expect(getConeSeamModeIndex('mirror')).toBe(0);
    expect(getConeSeamModeIndex('weld')).toBe(1);
  });

  it('maps rotation, repeat, and the shared normalized timeline deterministically', () => {
    expect(getConeTextureTransform({
      ...DEFAULT_CONE_VIEW,
      rotation: -90,
      textureRepeat: 3,
      flowCycles: 2,
    }, 0.25)).toEqual({ repeatU: 3, offsetU: 0.75, offsetV: 0.5, seamBlend: DEFAULT_CONE_VIEW.seamBlend, seamMode: 'weld' });
  });

  it('returns to an integer offset at the loop boundary and supports reverse flow', () => {
    const forwardStart = getConeTextureTransform(DEFAULT_CONE_VIEW, 0);
    const forwardEnd = getConeTextureTransform(DEFAULT_CONE_VIEW, 1);
    const reverseEnd = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, flowCycles: -3 }, 1);
    const still = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, flowCycles: 0 }, 0.8);
    expect(forwardStart.offsetV).toBe(0);
    expect(forwardEnd.offsetV).toBe(1);
    expect(reverseEnd.offsetV).toBe(-3);
    expect(still.offsetV).toBe(0);
  });

  it('keeps direct projection fixed while preserving rotation and repeat', () => {
    const transform = getConeTextureTransform({
      ...DEFAULT_CONE_VIEW,
      mappingMode: 'projection',
      rotation: 90,
      textureRepeat: 3,
      flowCycles: 8,
    }, 0.75);
    expect(transform).toEqual({ repeatU: 3, offsetU: 0.25, offsetV: 0, seamBlend: DEFAULT_CONE_VIEW.seamBlend, seamMode: 'weld' });
  });

  it.each(['mirror', 'weld'] as const)('keeps seam mode stable during flow for %s', (seamMode) => {
    const start = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, seamMode, flowCycles: 4 }, 0);
    const end = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, seamMode, flowCycles: 4 }, 1);
    expect(start.seamMode).toBe(seamMode);
    expect(end.seamMode).toBe(seamMode);
    expect(end.offsetV - start.offsetV).toBe(4);
  });
});
