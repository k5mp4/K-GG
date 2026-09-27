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
  getConeShapeIndex,
  getConeTextureTransform,
  getTorusCamera,
  getTorusMajorRadius,
  getTorusWiggle,
  TORUS_CAMERA_MAX_OFFSET,
} from './coneView';
import { TORUS_WIGGLE_PRESETS } from '../types/coneView';

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
    expect(getConeSeamModeIndex('reapply')).toBe(2);
  });

  it('maps rotation, repeat, and the shared normalized timeline deterministically', () => {
    expect(getConeTextureTransform({
      ...DEFAULT_CONE_VIEW,
      rotation: -90,
      textureRepeat: 3,
      flowCycles: 2,
    }, 0.25)).toEqual({ repeatU: 3, offsetU: 0.75, offsetV: 0.5, seamBlend: DEFAULT_CONE_VIEW.seamBlend, seamMode: 'mirror' });
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
    expect(transform).toEqual({ repeatU: 3, offsetU: 0.25, offsetV: 0, seamBlend: DEFAULT_CONE_VIEW.seamBlend, seamMode: 'mirror' });
  });

  it.each(['mirror', 'weld', 'reapply'] as const)('keeps seam mode stable during flow for %s', (seamMode) => {
    const start = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, seamMode, flowCycles: 4 }, 0);
    const end = getConeTextureTransform({ ...DEFAULT_CONE_VIEW, seamMode, flowCycles: 4 }, 1);
    expect(start.seamMode).toBe(seamMode);
    expect(end.seamMode).toBe(seamMode);
    expect(end.offsetV - start.offsetV).toBe(4);
  });
});

describe('torus tunnel', () => {
  const torus = { ...DEFAULT_CONE_VIEW, shape: 'torus' as const };

  it('selects the torus shader branch and keeps the cone as the default branch', () => {
    expect(getConeShapeIndex(DEFAULT_CONE_VIEW)).toBe(0);
    expect(getConeShapeIndex(torus)).toBe(1);
  });

  it('uses Rotation as a camera roll instead of a texture offset', () => {
    const rotated = { ...torus, rotation: 90 };
    expect(getTorusCamera(rotated).rollRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(getConeTextureTransform(rotated, 0).offsetU).toBe(0);
    expect(getConeTextureTransform({ ...DEFAULT_CONE_VIEW, rotation: 90 }, 0).offsetU).toBeCloseTo(0.25, 10);
  });

  it('derives the ring radius from Bend with a unit tube radius', () => {
    expect(getTorusMajorRadius({ ...torus, torusBend: 0.25 })).toBeCloseTo(4, 10);
    expect(getTorusMajorRadius({ ...torus, torusBend: Number.NaN })).toBeCloseTo(1 / 0.3, 10);
    expect(getTorusMajorRadius({ ...torus, torusBend: 5 })).toBeGreaterThan(1);
  });

  it('converts the camera look angles and keeps the offset inside the tube', () => {
    const camera = getTorusCamera({ ...torus, torusCameraYaw: 90, torusCameraPitch: 180, torusCameraX: 0.3, torusCameraY: -0.4 });
    expect(camera.yawRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(camera.pitchRadians).toBeCloseTo(Math.PI, 10);
    expect(camera.offsetX).toBeCloseTo(0.3, 10);
    expect(camera.offsetY).toBeCloseTo(-0.4, 10);

    const corner = getTorusCamera({ ...torus, torusCameraX: 0.8, torusCameraY: 0.8 });
    expect(Math.hypot(corner.offsetX, corner.offsetY)).toBeCloseTo(TORUS_CAMERA_MAX_OFFSET, 10);
    expect(corner.offsetX).toBeCloseTo(corner.offsetY, 10);
  });

  it('adds the base roll to the torus camera', () => {
    expect(getTorusCamera({ ...torus, rotation: 45 }).rollRadians).toBeCloseTo(Math.PI / 4, 10);
  });

  it('keeps the camera still when wiggle is off or its amount is zero', () => {
    const still = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0 };
    expect(getTorusWiggle(torus, 0.37)).toEqual(still);
    expect(getTorusWiggle({ ...torus, torusWigglePreset: 'handheld', torusWiggleAmount: 0 }, 0.37)).toEqual(still);
  });

  it.each(TORUS_WIGGLE_PRESETS.filter(preset => preset !== 'off'))('moves the camera with %s and closes the loop', (preset) => {
    for (const torusWiggleSpeed of [1, 3]) {
      const config = { ...torus, torusWigglePreset: preset, torusWiggleSpeed };
      const start = getTorusCamera(config, 0);
      const end = getTorusCamera(config, 1);
      for (const key of ['offsetX', 'offsetY'] as const) {
        expect(end[key]).toBeCloseTo(start[key], 9);
      }
      for (const key of ['yawRadians', 'pitchRadians', 'rollRadians'] as const) {
        // Angles close the loop modulo a full turn.
        expect(Math.cos(end[key])).toBeCloseTo(Math.cos(start[key]), 9);
        expect(Math.sin(end[key])).toBeCloseTo(Math.sin(start[key]), 9);
      }
      const middle = getTorusWiggle(config, 0.3);
      expect(Object.values(middle).some(value => Math.abs(value) > 1e-6)).toBe(true);
    }
  });

  it('turns the yaw a full circle per loop for Look Around, independent of Amount', () => {
    const config = { ...torus, torusWigglePreset: 'lookAround' as const };
    expect(getTorusWiggle(config, 0.25).yaw).toBeCloseTo(90, 9);
    expect(getTorusWiggle({ ...config, torusWiggleAmount: 0 }, 0.5).yaw).toBeCloseTo(180, 9);
    expect(getTorusWiggle({ ...config, torusWiggleAmount: 0 }, 0.5).pitch).toBe(0);
    expect(getTorusWiggle({ ...config, torusWiggleSpeed: 2 }, 0.25).yaw).toBeCloseTo(180, 9);
  });

  it('scales the wiggle linearly with Amount and keeps the camera inside the tube', () => {
    const base = { ...torus, torusWigglePreset: 'orbit' as const };
    const single = getTorusWiggle(base, 0.2);
    const double = getTorusWiggle({ ...base, torusWiggleAmount: 2 }, 0.2);
    expect(double.x).toBeCloseTo(single.x * 2, 10);
    const pushed = getTorusCamera({ ...base, torusWiggleAmount: 2, torusCameraX: 0.8 }, 0);
    expect(Math.hypot(pushed.offsetX, pushed.offsetY)).toBeLessThanOrEqual(TORUS_CAMERA_MAX_OFFSET + 1e-12);
  });

  it('advances whole ring tiles over one loop so integer Flow Cycles loop seamlessly', () => {
    const flowing = { ...torus, flowCycles: 3 };
    expect(getConeTextureTransform(flowing, 0).offsetV).toBe(0);
    expect(getConeTextureTransform(flowing, 1).offsetV).toBe(3);
    expect(getConeTextureTransform({ ...flowing, mappingMode: 'projection' }, 0.5).offsetV).toBe(0);
  });
});
