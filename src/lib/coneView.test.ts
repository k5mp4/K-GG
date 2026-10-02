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
  getRibbonLaps,
  getDiscsFrameDistance,
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
    // Only the wiggle rolls the Cone camera; Rotation stays the texture offset.
    const swaying = { ...DEFAULT_CONE_VIEW, rotation: 90, wigglePreset: 'sway' as const };
    expect(getThreeDRenderParams(swaying, 0.25, 1).camera.rollRadians).toBeCloseTo(14 * Math.PI / 180, 10);

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

  it.each(['lattice', 'terrain'] as const)('moves the %s geometry with Flow instead of the texture', (shape) => {
    const config = { ...DEFAULT_CONE_VIEW, shape, flowCycles: 3 };
    const middle = getThreeDRenderParams(config, 0.5, 1);
    expect(middle.travel).toBeCloseTo(1.5, 10);
    expect(middle.textureOffset).toEqual([0, 0]);
    expect(getThreeDRenderParams(config, 1, 1).travel).toBe(3);
    expect(getThreeDRenderParams({ ...config, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
  });

  it('passes the projection and half the depth as the camera distance', () => {
    const params = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, shape: 'ribbon', depth: 8, projection: 'fisheye' }, 0, 1);
    expect(params.distance).toBe(4);
    expect(params.projection).toBe(1);
  });

  it('passes the terrain settings through', () => {
    const params = getThreeDRenderParams({
      ...DEFAULT_CONE_VIEW,
      shape: 'terrain',
      terrainHeight: 1.1,
      terrainAltitude: 0.4,
    }, 0, 1);
    expect(params.shape).toBe(3);
    expect(params.terrain).toEqual({ height: 1.1, altitude: 0.4 });
    expect(params).not.toHaveProperty('extrusion');
  });

  it('rides the torus camera around the ring with Flow while Spin turns the texture', () => {
    const torus = { ...DEFAULT_CONE_VIEW, shape: 'torus' as const, flowCycles: 2, spin: 1 };
    const quarter = getThreeDRenderParams(torus, 0.25, 1);
    expect(quarter.travel).toBeCloseTo(0.5, 10);
    expect(quarter.textureOffset).toEqual([0.25, 0]);
    expect(getThreeDRenderParams(torus, 1, 1).travel).toBe(2);
    expect(getThreeDRenderParams({ ...torus, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
  });

  it('passes the ribbon settings through', () => {
    const ribbon = getThreeDRenderParams({
      ...DEFAULT_CONE_VIEW,
      shape: 'ribbon',
      ribbonCount: 4,
      ribbonRadius: 0.9,
      ribbonStagger: 0.3,
      ribbonTwist: -2,
      ribbonLength: 20,
      ribbonHalfTwists: 5,
      ribbonWidth: 0.2,
      spin: 1,
    }, 0.25, 1);
    expect(ribbon.shape).toBe(4);
    expect(ribbon.ribbon).toEqual({
      count: 4,
      radius: 0.9,
      stagger: 0.3,
      twistTurns: -2,
      loopLength: 20,
      halfTwists: 5,
      width: 0.2,
      laps: 2,
      spinRadians: Math.PI / 2,
    });
  });

  it('passes the Discs settings through in shader units', () => {
    const discs = getThreeDRenderParams({
      ...DEFAULT_CONE_VIEW,
      shape: 'discs',
      discsForm: 'discs',
      discsCount: 16,
      discsGap: 0.3,
      discsThickness: 0.1,
      discsSpread: 0.8,
      discsWaves: 1.5,
      discsScatter: 0.4,
      discsSpinPattern: 'alternate',
      discsSpin: -2,
      discsTwist: 9,
      discsOffset: 0.5,
      discsTilt: 30,
      discsTiltTurns: 2,
      discsView: 45,
      discsOrbit: 1,
    }, 0.25, 16 / 9);
    expect(discs.shape).toBe(7);
    expect(discs.textureOffset).toEqual([0, 0]);
    expect(discs.discs).toMatchObject({
      form: 1,
      count: 16,
      gap: 0.3,
      thickness: 0.1,
      spread: 0.8,
      waves: 1.5,
      scatter: 0.4,
      spinPattern: 1,
      spin: -2,
      offset: 0.5,
      tiltTurns: 2,
      time: 0.25,
    });
    expect(discs.discs.twistRadians).toBeCloseTo(Math.PI / 20, 10);
    expect(discs.discs.tiltRadians).toBeCloseTo(Math.PI / 6, 10);
    expect(discs.discs.viewRadians).toBeCloseTo(Math.PI / 4, 10);
    expect(discs.discs.orbitRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(discs.discs.outerRadius).toBeCloseTo(Math.hypot(16 / 9, 1), 10);
  });

  it('moves the Discs depth wave with Flow and closes Orbit on the loop', () => {
    const discs = { ...DEFAULT_CONE_VIEW, shape: 'discs' as const, flowCycles: 2, discsOrbit: 3 };
    expect(getThreeDRenderParams(discs, 0.5, 1).travel).toBe(1);
    expect(getThreeDRenderParams(discs, 1, 1).travel).toBe(2);
    expect(getThreeDRenderParams(discs, 0, 1).discs.orbitRadians).toBe(0);
    expect(getThreeDRenderParams(discs, 1, 1).discs.orbitRadians).toBe(0);
    expect(getThreeDRenderParams({ ...discs, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
  });

  it('frames the canvas half height with the base FOV for the head-on Discs', () => {
    const headOn = { ...DEFAULT_CONE_VIEW, discsView: 0, discsOrbit: 0 };
    expect(getDiscsFrameDistance({ ...headOn, cameraFov: 90 })).toBeCloseTo(1, 10);
    expect(getDiscsFrameDistance(headOn)).toBeCloseTo(Math.sqrt(3), 10);
    // A zoom wiggle changes the lens, not the framing distance.
    const zooming = { ...headOn, shape: 'discs' as const, wigglePreset: 'zoomPulse' as const };
    expect(getThreeDRenderParams(zooming, 0.1, 1).discs.frameDistance).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('pulls the Discs camera back as it leans and keeps the side-view distance while orbiting', () => {
    const still = { ...DEFAULT_CONE_VIEW, discsOrbit: 0 };
    const sideView = Math.sqrt(3) * 1.5 * Math.hypot(2, 1);
    const leaning = getDiscsFrameDistance({ ...still, discsView: 30 }, 2);
    expect(leaning).toBeGreaterThan(Math.sqrt(3));
    expect(leaning).toBeLessThan(sideView);
    // An orbit passes the side of the stack, so it uses the side-view distance
    // for the whole loop whatever the View Angle is.
    expect(getDiscsFrameDistance({ ...still, discsOrbit: 1, discsView: 0 }, 2)).toBeCloseTo(sideView, 10);
    expect(getDiscsFrameDistance({ ...still, discsOrbit: -2, discsView: 60 }, 2)).toBeCloseTo(sideView, 10);
  });

  it('travels the ribbons one loop length per Flow Cycle, two with odd half twists', () => {
    const even = { ...DEFAULT_CONE_VIEW, shape: 'ribbon' as const, flowCycles: 3, ribbonHalfTwists: 2 };
    expect(getRibbonLaps(even)).toBe(1);
    expect(getThreeDRenderParams(even, 0.5, 1).travel).toBeCloseTo(1.5, 10);
    expect(getThreeDRenderParams(even, 0.5, 1).textureOffset).toEqual([0, 0]);
    expect(getThreeDRenderParams(even, 1, 1).travel).toBe(3);
    const odd = { ...even, ribbonHalfTwists: 3 };
    expect(getRibbonLaps(odd)).toBe(2);
    expect(getThreeDRenderParams(odd, 1, 1).travel).toBe(6);
    expect(getRibbonLaps({ ...odd, ribbonHalfTwists: 0 })).toBe(1);
    expect(getThreeDRenderParams({ ...odd, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
    // Spin closes the loop with whole turns.
    const spinning = { ...even, spin: 2 };
    expect(getThreeDRenderParams(spinning, 0, 1).ribbon.spinRadians).toBe(0);
    expect(getThreeDRenderParams(spinning, 1, 1).ribbon.spinRadians).toBe(0);
  });

  it('flies through one tile of square rings per Flow Cycle', () => {
    const rings = { ...DEFAULT_CONE_VIEW, shape: 'rings' as const, flowCycles: 2, ringsPerTile: 6 };
    const quarter = getThreeDRenderParams(rings, 0.25, 1);
    expect(quarter.shape).toBe(5);
    expect(quarter.travel).toBeCloseTo(3, 10);
    expect(quarter.textureOffset).toEqual([0, 0]);
    expect(getThreeDRenderParams(rings, 1, 1).travel).toBe(12);
    expect(getThreeDRenderParams({ ...rings, mappingMode: 'projection' }, 0.5, 1).travel).toBe(0);
  });

  it('passes the square ring settings and loops their Spin and Beats', () => {
    const rings = {
      ...DEFAULT_CONE_VIEW,
      shape: 'rings' as const,
      ringsPattern: 'serpent' as const,
      ringsMapping: 'picture' as const,
      ringsTwist: 90,
      spin: 2,
      ringsBeats: 3,
      ringsPulse: 0.4,
      ringsAmount: 0.7,
    };
    const params = getThreeDRenderParams(rings, 0.25, 1);
    expect(params.rings).toMatchObject({
      pattern: 1,
      mapping: 1,
      perTile: 8,
      spacing: 1,
      thickness: 0.12,
      depth: 0.06,
      pulse: 0.4,
      amount: 0.7,
    });
    expect(params.rings.twistRadians).toBeCloseTo(Math.PI / 2, 10);
    expect(params.rings.spinRadians).toBeCloseTo(Math.PI, 10);
    expect(params.rings.pulsePhase).toBeCloseTo(0.75, 10);
    const start = getThreeDRenderParams(rings, 0, 1).rings;
    const end = getThreeDRenderParams(rings, 1, 1).rings;
    expect(end.spinRadians).toBeCloseTo(start.spinRadians, 10);
    expect(end.pulsePhase).toBeCloseTo(start.pulsePhase, 10);
    expect(getThreeDRenderParams({ ...rings, ringsPattern: 'tumble' }, 0, 1).rings.pattern).toBe(2);
  });

  it('flies through one repeat of the geometry field per Flow Cycle', () => {
    const field = { ...DEFAULT_CONE_VIEW, shape: 'field' as const, flowCycles: 3, fieldLoopCells: 10 };
    const middle = getThreeDRenderParams(field, 0.5, 1);
    expect(middle.shape).toBe(6);
    expect(middle.travel).toBeCloseTo(15, 10);
    expect(middle.textureOffset).toEqual([0, 0]);
    expect(getThreeDRenderParams(field, 1, 1).travel).toBe(30);
  });

  it('passes the geometry field settings and loops its Spin', () => {
    const field = {
      ...DEFAULT_CONE_VIEW,
      shape: 'field' as const,
      fieldGeometry: 'octahedron' as const,
      fieldRender: 'mixed' as const,
      fieldDensity: 0.6,
      fieldSpread: 8,
      spin: 3,
    };
    const params = getThreeDRenderParams(field, 0.25, 1);
    expect(params.field).toMatchObject({
      geometry: 4,
      render: 2,
      loopCells: 16,
      density: 0.6,
      size: 0.75,
      clearance: 1.5,
      spread: 8,
      wire: 0.03,
      variation: 1,
    });
    expect(params.field.spinRadians).toBeCloseTo(1.5 * Math.PI, 10);
    expect(params.field.arms).toBe(0);
    expect(getThreeDRenderParams(field, 1, 1).field.spinRadians).toBeCloseTo(getThreeDRenderParams(field, 0, 1).field.spinRadians, 10);
  });

  it('turns the spiral arms by whole turns per Loop Length', () => {
    const spiral = { ...DEFAULT_CONE_VIEW, shape: 'field' as const, fieldArms: 3, fieldTwist: 2, fieldLoopCells: 8, fieldArmWidth: 0.2 };
    const params = getThreeDRenderParams(spiral, 0, 1);
    expect(params.field.arms).toBe(3);
    expect(params.field.armWidth).toBe(0.2);
    // Over one Loop Length the arms turn exactly Twist whole turns.
    expect(params.field.twistPerCell * 8).toBeCloseTo(2 * 2 * Math.PI, 10);
  });

  it('maps the lattice type to its shader index', () => {
    expect(getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, latticeType: 'schwarzP' }, 0, 1).lattice.type).toBe(1);
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

  it('uses the camera FOV for every shape, the Cone included', () => {
    const wide = getThreeDRenderParams({ ...torus, cameraFov: 90 }, 0, 1);
    expect(wide.tangentHalfFov).toBeCloseTo(1, 10);
    const cone = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, cameraFov: 90 }, 0, 1);
    expect(cone.tangentHalfFov).toBeCloseTo(1, 10);
    // The default FOV keeps the original 60 degree Cone camera.
    expect(getThreeDRenderParams(DEFAULT_CONE_VIEW, 0, 1).tangentHalfFov).toBeCloseTo(Math.tan(Math.PI / 6), 10);
  });

  it('keeps the Cone opening fixed while its FOV and zoom wiggle change', () => {
    const base = getThreeDRenderParams(DEFAULT_CONE_VIEW, 0, 16 / 9);
    const zoomed = getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, cameraFov: 100, wigglePreset: 'zoomPulse' }, 0.1, 16 / 9);
    expect(zoomed.cone.apertureRadius).toBe(base.cone.apertureRadius);
    expect(zoomed.tangentHalfFov).not.toBeCloseTo(base.tangentHalfFov, 3);
  });

  it('places the Cone apex at its screen point through the base FOV', () => {
    const config = { ...DEFAULT_CONE_VIEW, cameraFov: 90, apexX: 0.5, apexY: -0.25 };
    const params = getThreeDRenderParams(config, 0, 2);
    const apexDistance = CONE_CAMERA_DISTANCE + config.depth;
    // Projected through tan(45°) = 1 the apex lands on the requested point.
    expect(params.cone.apexOffset[0] / (apexDistance * 2)).toBeCloseTo(0.5, 10);
    expect(params.cone.apexOffset[1] / apexDistance).toBeCloseTo(-0.25, 10);
  });

  it('passes the Cone twist through', () => {
    expect(getThreeDRenderParams({ ...DEFAULT_CONE_VIEW, coneTwist: -1.5 }, 0, 1).coneTwist).toBe(-1.5);
    expect(getThreeDRenderParams(DEFAULT_CONE_VIEW, 0, 1).coneTwist).toBe(0);
  });

  it('converts the fisheye angle, lens, dolly, and aim settings', () => {
    const params = getThreeDRenderParams({
      ...torus,
      fisheyeAngle: 270,
      lensDistortion: -0.3,
      cameraDolly: 0.4,
      torusAim: 0.25,
    }, 0, 1);
    expect(params.fisheyeHalfAngle).toBeCloseTo(0.75 * Math.PI, 10);
    expect(params.lensDistortion).toBe(-0.3);
    expect(params.camera.dolly).toBe(0.4);
    expect(params.torusAim).toBe(0.25);
  });

  it('pulses the field of view with Zoom Pulse', () => {
    const pulse = { ...torus, wigglePreset: 'zoomPulse' as const };
    expect(getThreeDCamera(pulse, 0.125).fovDegrees).toBeGreaterThan(60);
    expect(getThreeDCamera(pulse, 0.375).fovDegrees).toBeLessThan(60);
    expect(getThreeDCamera(pulse, 0.125).dolly).toBe(0);
  });

  it('keeps a unit-distance subject the same size during Vertigo', () => {
    const vertigo = { ...torus, wigglePreset: 'vertigo' as const };
    const base = Math.tan(Math.PI / 6);
    for (const time of [0.1, 0.25, 0.6, 0.8]) {
      const camera = getThreeDCamera(vertigo, time);
      const distance = 1 - camera.dolly;
      expect(distance * Math.tan(camera.fovDegrees * Math.PI / 360)).toBeCloseTo(base, 9);
    }
    expect(getThreeDCamera(vertigo, 0.25).fovDegrees).toBeCloseTo(85, 9);
  });

  it('adds the base roll to the torus camera', () => {
    expect(getThreeDCamera({ ...torus, rotation: 45 }).rollRadians).toBeCloseTo(Math.PI / 4, 10);
  });

  it('keeps the camera still when wiggle is off or its amount is zero', () => {
    const still = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, fov: 0, dolly: 0 };
    expect(getCameraWiggle(torus, 0.37)).toEqual(still);
    expect(getCameraWiggle({ ...torus, wigglePreset: 'handheld', wiggleAmount: 0 }, 0.37)).toEqual(still);
  });

  it.each(CAMERA_WIGGLE_PRESETS.filter(preset => preset !== 'off'))('moves the camera with %s and closes the loop', (preset) => {
    for (const wiggleSpeed of [1, 3]) {
      const config = { ...torus, wigglePreset: preset, wiggleSpeed };
      const start = getThreeDCamera(config, 0);
      const end = getThreeDCamera(config, 1);
      for (const key of ['offsetX', 'offsetY', 'fovDegrees', 'dolly'] as const) {
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
