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
  getThreeDCamera,
  getThreeDRenderParams,
  getTorusMajorRadius,
  getTorusTwistTurns,
  getCameraWiggle,
  CAMERA_MAX_OFFSET,
} from './coneView';
import { CAMERA_WIGGLE_PRESETS } from '../types/coneView';

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

describe('3D render parameters', () => {
  it('keeps the Cone unrolled and unshaded while other shapes use the shared surface stages', () => {
    const cone = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, rotation: 90, shade: 1 }, 0, 16 / 9);
    expect(cone.shape).toBe(0);
    expect(cone.camera.rollRadians).toBe(0);
    expect(cone.textureOffset[0]).toBeCloseTo(0.25, 10);

    const torus = getThreeDRenderParams({
      ...DEFAULT_CONE_VIEW,
      shape: 'torus',
      rotation: 90,
      surfaceMapping: 'matcap',
      fog: 0.4,
      shade: 0.7,
    }, 0, 16 / 9);
    expect(torus.shape).toBe(1);
    expect(torus.surfaceMapping).toBe(2);
    expect(torus.fog).toBe(0.4);
    expect(torus.shade).toBe(0.7);
    expect(torus.camera.rollRadians).toBeCloseTo(Math.PI / 2, 10);
  });

  it.each(['lattice', 'mirrorRoom'] as const)('moves the %s geometry with Flow instead of the texture', (shape) => {
    const config = { ...DEFAULT_CONE_VIEW, shape, flowCycles: 3 };
    const middle = getThreeDRenderParams(config, 0.5, 1);
    expect(middle.travel).toBeCloseTo(1.5, 10);
    expect(middle.textureOffset).toEqual([0, 0]);
    expect(getThreeDRenderParams(config, 1, 1).travel).toBe(3);
    expect(getThreeDRenderParams({ ...config, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
  });

  it('maps the lattice and room options to shader indices', () => {
    const params = getThreeDRenderParams({
      ...DEFAULT_CONE_VIEW,
      latticeType: 'schwarzP',
      roomShape: 'dodecahedron',
      roomCanvasFaces: 'front',
      roomBounces: 9,
    }, 0, 1);
    expect(params.lattice.type).toBe(1);
    expect(params.room).toMatchObject({ shape: 2, canvasFaces: 2, bounces: 9 });
  });

  it('derives the Cone aperture and apex from the canvas aspect', () => {
    const wide = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, apexX: 1 }, 0, 2);
    const square = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, apexX: 1 }, 0, 1);
    expect(wide.cone.apertureRadius).toBeGreaterThan(square.cone.apertureRadius);
    expect(wide.cone.apexOffset[0]).toBeCloseTo(square.cone.apexOffset[0] * 2, 10);
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
    expect(getThreeDCamera(rotated).rollRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(getConeTextureTransform(rotated, 0).offsetU).toBe(0);
    expect(getConeTextureTransform({ ...DEFAULT_CONE_VIEW, rotation: 90 }, 0).offsetU).toBeCloseTo(0.25, 10);
  });

  it('derives the ring radius from Bend with a unit tube radius', () => {
    expect(getTorusMajorRadius({ ...torus, torusBend: 0.25 })).toBeCloseTo(4, 10);
    expect(getTorusMajorRadius({ ...torus, torusBend: Number.NaN })).toBeCloseTo(1 / 0.3, 10);
    expect(getTorusMajorRadius({ ...torus, torusBend: 5 })).toBeGreaterThan(1);
  });

  it('converts the camera look angles and keeps the offset inside the tube', () => {
    const camera = getThreeDCamera({ ...torus, cameraYaw: 90, cameraPitch: 180, cameraX: 0.3, cameraY: -0.4 });
    expect(camera.yawRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(camera.pitchRadians).toBeCloseTo(Math.PI, 10);
    expect(camera.offsetX).toBeCloseTo(0.3, 10);
    expect(camera.offsetY).toBeCloseTo(-0.4, 10);

    const corner = getThreeDCamera({ ...torus, cameraX: 0.8, cameraY: 0.8 });
    expect(Math.hypot(corner.offsetX, corner.offsetY)).toBeCloseTo(CAMERA_MAX_OFFSET, 10);
    expect(corner.offsetX).toBeCloseTo(corner.offsetY, 10);
  });

  it('rounds Twist to whole texture turns over the ring', () => {
    expect(getTorusTwistTurns({ ...torus, torusTwist: 0.5, ringRepeat: 12 })).toBe(6);
    expect(getTorusTwistTurns({ ...torus, torusTwist: 0.3, ringRepeat: 5 })).toBe(2);
    expect(getTorusTwistTurns({ ...torus, torusTwist: -1, ringRepeat: 12 })).toBe(-12);
    expect(getTorusTwistTurns(torus)).toBe(0);
  });

  it('spins the torus texture by whole turns per loop', () => {
    const spinning = { ...torus, spin: 2 };
    expect(getConeTextureTransform(spinning, 0).offsetU).toBe(0);
    expect(getConeTextureTransform(spinning, 0.25).offsetU).toBeCloseTo(0.5, 10);
    expect(getConeTextureTransform(spinning, 1).offsetU).toBe(0);
    expect(getConeTextureTransform({ ...torus, spin: -1 }, 0.25).offsetU).toBeCloseTo(0.75, 10);
  });

  it('adds the base roll to the torus camera', () => {
    expect(getThreeDCamera({ ...torus, rotation: 45 }).rollRadians).toBeCloseTo(Math.PI / 4, 10);
  });

  it('keeps the camera still when wiggle is off or its amount is zero', () => {
    const still = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0 };
    expect(getCameraWiggle(torus, 0.37)).toEqual(still);
    expect(getCameraWiggle({ ...torus, wigglePreset: 'handheld', wiggleAmount: 0 }, 0.37)).toEqual(still);
  });

  it.each(CAMERA_WIGGLE_PRESETS.filter(preset => preset !== 'off'))('moves the camera with %s and closes the loop', (preset) => {
    for (const wiggleSpeed of [1, 3]) {
      const config = { ...torus, wigglePreset: preset, wiggleSpeed };
      const start = getThreeDCamera(config, 0);
      const end = getThreeDCamera(config, 1);
      for (const key of ['offsetX', 'offsetY'] as const) {
        expect(end[key]).toBeCloseTo(start[key], 9);
      }
      for (const key of ['yawRadians', 'pitchRadians', 'rollRadians'] as const) {
        // Angles close the loop modulo a full turn.
        expect(Math.cos(end[key])).toBeCloseTo(Math.cos(start[key]), 9);
        expect(Math.sin(end[key])).toBeCloseTo(Math.sin(start[key]), 9);
      }
      const middle = getCameraWiggle(config, 0.3);
      expect(Object.values(middle).some(value => Math.abs(value) > 1e-6)).toBe(true);
    }
  });

  it('turns the yaw a full circle per loop for Look Around, independent of Amount', () => {
    const config = { ...torus, wigglePreset: 'lookAround' as const };
    expect(getCameraWiggle(config, 0.25).yaw).toBeCloseTo(90, 9);
    expect(getCameraWiggle({ ...config, wiggleAmount: 0 }, 0.5).yaw).toBeCloseTo(180, 9);
    expect(getCameraWiggle({ ...config, wiggleAmount: 0 }, 0.5).pitch).toBe(0);
    expect(getCameraWiggle({ ...config, wiggleSpeed: 2 }, 0.25).yaw).toBeCloseTo(180, 9);
  });

  it('scales the wiggle linearly with Amount and keeps the camera inside the tube', () => {
    const base = { ...torus, wigglePreset: 'orbit' as const };
    const single = getCameraWiggle(base, 0.2);
    const double = getCameraWiggle({ ...base, wiggleAmount: 2 }, 0.2);
    expect(double.x).toBeCloseTo(single.x * 2, 10);
    const pushed = getThreeDCamera({ ...base, wiggleAmount: 2, cameraX: 0.8 }, 0);
    expect(Math.hypot(pushed.offsetX, pushed.offsetY)).toBeLessThanOrEqual(CAMERA_MAX_OFFSET + 1e-12);
  });

  it('advances whole ring tiles over one loop so integer Flow Cycles loop seamlessly', () => {
    const flowing = { ...torus, flowCycles: 3 };
    expect(getConeTextureTransform(flowing, 0).offsetV).toBe(0);
    expect(getConeTextureTransform(flowing, 1).offsetV).toBe(3);
    expect(getConeTextureTransform({ ...flowing, mappingMode: 'projection' }, 0.5).offsetV).toBe(0);
  });
});
