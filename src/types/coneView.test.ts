import { beforeEach, describe, expect, it } from 'vitest';
import { makePreset } from '../lib/presetModel';
import { useGradientStore } from '../store/gradientStore';
import {
  CONE_APEX_LIMIT,
  CONE_SEAM_MODE_INDEX,
  CONE_SEAM_MODE_OPTIONS,
  DEFAULT_CONE_SEAM_MODE,
  DEFAULT_CONE_VIEW,
  normalizeConeViewConfig,
} from './coneView';

describe('cone view configuration', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('uses defaults for missing and non-finite legacy values', () => {
    expect(normalizeConeViewConfig(undefined)).toEqual(DEFAULT_CONE_VIEW);
    expect(normalizeConeViewConfig({
      depth: Number.NaN,
      rotation: 'invalid',
      textureRepeat: null,
      flowCycles: undefined,
    })).toEqual(DEFAULT_CONE_VIEW);
  });

  it('clamps ranges and rounds discrete texture controls', () => {
    expect(normalizeConeViewConfig({
      depth: 99,
      flowCycles: 99,
      rotation: -999,
      textureRepeat: 3.6,
      apexX: 99,
      apexY: -99,
      seamBlend: 2,
      torusBend: 5,
      ringRepeat: 7.4,
    })).toEqual({
      shape: 'cone',
      depth: 30,
      rotation: 81,
      textureRepeat: 4,
      flowCycles: 30,
      apexX: CONE_APEX_LIMIT,
      apexY: -CONE_APEX_LIMIT,
      seamBlend: 0.5,
      seamMode: 'mirror',
      mappingMode: 'flow',
      surfaceMapping: 'uv',
      projection: 'perspective',
      fog: 0,
      shade: 0,
      torusBend: 0.9,
      ringRepeat: 7,
      torusTwist: 0,
      spin: 0,
      coneTwist: 0,
      coneCameraMode: 'classic',
      cameraX: 0,
      cameraY: 0,
      cameraYaw: 0,
      cameraPitch: 0,
      cameraFov: 60,
      fisheyeAngle: 180,
      lensDistortion: 0,
      cameraDolly: 0,
      torusAim: 1,
      wigglePreset: 'off',
      wiggleAmount: 1,
      wiggleSpeed: 1,
      latticeType: 'gyroid',
      latticeScale: 2,
      latticeThickness: 0.25,
      terrainHeight: 0.6,
      terrainAltitude: 1,
      ribbonCount: 6,
      ribbonRadius: 0.7,
      ribbonStagger: 0.5,
      ribbonTwist: 1,
      ribbonLength: 16,
      ribbonHalfTwists: 1,
      ribbonWidth: 0.15,
      ringsPattern: 'corridor',
      ringsMapping: 'wrap',
      ringsPerTile: 8,
      ringsSpacing: 1,
      ringsThickness: 0.12,
      ringsDepth: 0.06,
      ringsTwist: 0,
      ringsPulse: 0,
      ringsBeats: 4,
      ringsAmount: 0.5,
      fieldGeometry: 'mix',
      fieldRender: 'solid',
      fieldLoopCells: 16,
      fieldDensity: 0.3,
      fieldSize: 0.75,
      fieldClearance: 1.5,
      fieldSpread: 5,
      fieldArms: 0,
      fieldTwist: 1,
      fieldArmWidth: 0.35,
      fieldWire: 0.03,
      fieldVariation: 1,
      discsForm: 'rings',
      discsCount: 12,
      discsGap: 0.2,
      discsThickness: 0.06,
      discsSpread: 0.5,
      discsWaves: 1,
      discsScatter: 0,
      discsSpinPattern: 'stagger',
      discsSpin: 1,
      discsTwist: 0,
      discsOffset: 0.3,
      discsTilt: 12,
      discsTiltTurns: 1,
      discsView: 35,
      discsOrbit: 1,
      crystalLayout: 'fill',
      crystalMaterial: 'refract',
      crystalFaceOpacity: 1,
      crystalForm: 'quartz',
      crystalCount: 12,
      crystalSize: 1.2,
      crystalLength: 2.6,
      crystalSpread: 1,
      crystalSeed: 0,
      crystalIor: 1.6,
      crystalDispersion: 0.08,
      crystalDispersionSteps: 3,
      crystalReflection: 0.35,
      crystalBackdrop: 1,
      crystalSpin: 1,
      crystalRevolve: 0,
    });
  });

  it('normalizes the Discs settings', () => {
    expect(normalizeConeViewConfig({ shape: 'discs' }).shape).toBe('discs');
    expect(normalizeConeViewConfig({
      discsCount: 99.4,
      discsGap: 2,
      discsThickness: 0,
      discsSpread: -1,
      discsWaves: 9,
      discsScatter: 3,
      discsSpinPattern: 'alternate',
      discsSpin: 2.6,
      discsTwist: 99,
      discsOffset: -1,
      discsTilt: 120,
      discsTiltTurns: -9.2,
      discsView: 99,
      discsOrbit: 1.4,
    })).toMatchObject({
      discsCount: 48,
      discsGap: 0.9,
      discsThickness: 0.01,
      discsSpread: 0,
      discsWaves: 4,
      discsScatter: 1,
      discsSpinPattern: 'alternate',
      discsSpin: 3,
      discsTwist: 45,
      discsOffset: 0,
      discsTilt: 75,
      discsTiltTurns: -4,
      discsView: 85,
      discsOrbit: 1,
    });
    expect(normalizeConeViewConfig({ discsSpinPattern: 'wobble' }).discsSpinPattern).toBe('stagger');
    expect(normalizeConeViewConfig({ discsForm: 'discs' }).discsForm).toBe('discs');
    expect(normalizeConeViewConfig({ discsForm: 'cubes' }).discsForm).toBe('rings');
  });

  it('normalizes the Crystals settings', () => {
    expect(normalizeConeViewConfig({ shape: 'crystal' }).shape).toBe('crystal');
    expect(normalizeConeViewConfig({
      crystalFaceOpacity: 3,
      crystalDispersionSteps: 14.2,
      crystalCount: 40,
      crystalSize: 0,
      crystalLength: 9,
      crystalSpread: -1,
      crystalSeed: 12.6,
      crystalIor: 0.5,
      crystalDispersion: 1,
      crystalReflection: 2,
      crystalBackdrop: 0,
      crystalSpin: -2.4,
      crystalRevolve: 7,
    })).toMatchObject({
      crystalFaceOpacity: 1,
      crystalDispersionSteps: 10,
      crystalCount: 24,
      crystalSize: 0.3,
      crystalLength: 5,
      crystalSpread: 0.2,
      crystalSeed: 13,
      crystalIor: 1,
      crystalDispersion: 0.3,
      crystalReflection: 1,
      crystalBackdrop: 0.1,
      crystalSpin: -2,
      crystalRevolve: 4,
    });
    expect(normalizeConeViewConfig({ crystalForm: 'mix' }).crystalForm).toBe('mix');
    expect(normalizeConeViewConfig({ crystalForm: 'cube' }).crystalForm).toBe('quartz');
    expect(normalizeConeViewConfig({ crystalLayout: 'cluster', crystalMaterial: 'faces' })).toMatchObject({ crystalLayout: 'cluster', crystalMaterial: 'faces' });
    expect(normalizeConeViewConfig({ crystalLayout: 'grid', crystalMaterial: 'metal' })).toMatchObject({ crystalLayout: 'fill', crystalMaterial: 'refract' });
    expect(normalizeConeViewConfig({ crystalDispersionSteps: 0 }).crystalDispersionSteps).toBe(1);
  });

  it('keeps presets without a shape on the cone and normalizes the torus shape', () => {
    expect(DEFAULT_CONE_VIEW.shape).toBe('cone');
    expect(normalizeConeViewConfig({ depth: 8 }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ shape: 'torus' }).shape).toBe('torus');
    expect(normalizeConeViewConfig({ shape: 'pyramid' }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ surfaceMapping: 'matcap', fog: 3, shade: -1 })).toMatchObject({
      surfaceMapping: 'matcap',
      fog: 1,
      shade: 0,
    });
    expect(normalizeConeViewConfig({ surfaceMapping: 'cubemap' }).surfaceMapping).toBe('uv');
    expect(normalizeConeViewConfig({ torusBend: 0 }).torusBend).toBe(0.05);
    expect(normalizeConeViewConfig({ ringRepeat: 0 }).ringRepeat).toBe(1);
  });

  it('clamps Twist and rounds Spin to whole turns', () => {
    expect(normalizeConeViewConfig({ torusTwist: 9, spin: 2.4 })).toMatchObject({ torusTwist: 4, spin: 2 });
    expect(normalizeConeViewConfig({ torusTwist: -9, spin: -99 })).toMatchObject({ torusTwist: -4, spin: -8 });
  });

  it('normalizes the lattice settings', () => {
    expect(normalizeConeViewConfig({ shape: 'lattice', latticeType: 'schwarzP', latticeScale: 99, latticeThickness: 0 })).toMatchObject({
      shape: 'lattice',
      latticeType: 'schwarzP',
      latticeScale: 8,
      latticeThickness: 0.02,
    });
    expect(normalizeConeViewConfig({ latticeType: 'diamond' }).latticeType).toBe('gyroid');
  });

  it('normalizes the projection and treats removed shapes as the Cone', () => {
    expect(normalizeConeViewConfig({ projection: 'equirect' }).projection).toBe('equirect');
    expect(normalizeConeViewConfig({ projection: 'orthographic' }).projection).toBe('perspective');
    expect(normalizeConeViewConfig({ shape: 'sphere' }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ shape: 'mirrorRoom' }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ shape: 'extrusion' }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ shape: 'extrusion', extrudeCells: 12 })).not.toHaveProperty('extrudeCells');
  });

  it('clamps the terrain settings', () => {
    expect(normalizeConeViewConfig({
      shape: 'terrain',
      terrainHeight: 9,
      terrainAltitude: 0,
    })).toMatchObject({
      shape: 'terrain',
      terrainHeight: 2,
      terrainAltitude: 0.1,
    });
  });

  it('keeps presets without a Cone camera mode on the classic camera', () => {
    expect(normalizeConeViewConfig({}).coneCameraMode).toBe('classic');
    expect(normalizeConeViewConfig({ coneCameraMode: 'free' }).coneCameraMode).toBe('free');
    expect(normalizeConeViewConfig({ coneCameraMode: 'orbit' }).coneCameraMode).toBe('classic');
  });

  it('clamps the Cone twist', () => {
    expect(normalizeConeViewConfig({ coneTwist: 9 }).coneTwist).toBe(4);
    expect(normalizeConeViewConfig({ coneTwist: -1.25 }).coneTwist).toBe(-1.25);
  });

  it('rounds the ribbon counts and twists and clamps the ribbon ranges', () => {
    expect(normalizeConeViewConfig({
      shape: 'ribbon',
      ribbonCount: 40.2,
      ribbonRadius: 0,
      ribbonStagger: 3,
      ribbonTwist: 2.6,
      ribbonLength: 1,
      ribbonHalfTwists: 2.6,
      ribbonWidth: 3,
    })).toMatchObject({
      shape: 'ribbon',
      ribbonCount: 12,
      ribbonRadius: 0.2,
      ribbonStagger: 1,
      ribbonTwist: 3,
      ribbonLength: 4,
      ribbonHalfTwists: 3,
      ribbonWidth: 0.6,
    });
    expect(normalizeConeViewConfig({ ribbonTwist: -99, ribbonCount: 0 })).toMatchObject({ ribbonTwist: -8, ribbonCount: 1 });
  });

  it('normalizes the square ring settings', () => {
    expect(normalizeConeViewConfig({
      shape: 'rings',
      ringsPattern: 'tumble',
      ringsMapping: 'picture',
      ringsPerTile: 6.6,
      ringsSpacing: 99,
      ringsThickness: 0,
      ringsDepth: 5,
      ringsTwist: -90,
      ringsPulse: 2,
      ringsBeats: 3.4,
      ringsAmount: -1,
    })).toMatchObject({
      shape: 'rings',
      ringsPattern: 'tumble',
      ringsMapping: 'picture',
      ringsPerTile: 7,
      ringsSpacing: 4,
      ringsThickness: 0.02,
      ringsDepth: 1,
      ringsTwist: -45,
      ringsPulse: 1,
      ringsBeats: 3,
      ringsAmount: 0,
    });
    expect(normalizeConeViewConfig({ ringsPattern: 'spiral', ringsMapping: 'cube' })).toMatchObject({
      ringsPattern: 'corridor',
      ringsMapping: 'wrap',
    });
  });

  it('normalizes the geometry field settings', () => {
    expect(normalizeConeViewConfig({
      shape: 'field',
      fieldGeometry: 'prism',
      fieldRender: 'wire',
      fieldLoopCells: 99.4,
      fieldDensity: 0,
      fieldSize: 3,
      fieldClearance: 0,
      fieldSpread: 40,
      fieldWire: 1,
      fieldVariation: -2,
    })).toMatchObject({
      shape: 'field',
      fieldGeometry: 'prism',
      fieldRender: 'wire',
      fieldLoopCells: 64,
      fieldDensity: 0.05,
      fieldSize: 1,
      fieldClearance: 1,
      fieldSpread: 12,
      fieldWire: 0.12,
      fieldVariation: 0,
    });
    expect(normalizeConeViewConfig({ fieldGeometry: 'teapot', fieldRender: 'points' })).toMatchObject({
      fieldGeometry: 'mix',
      fieldRender: 'solid',
    });
    expect(normalizeConeViewConfig({ fieldGeometry: 'model' }).fieldGeometry).toBe('model');
  });

  it('rounds the spiral arms and twist to whole numbers', () => {
    expect(normalizeConeViewConfig({ fieldArms: 2.6, fieldTwist: -2.4, fieldArmWidth: 3 })).toMatchObject({
      fieldArms: 3,
      fieldTwist: -2,
      fieldArmWidth: 1,
    });
    expect(normalizeConeViewConfig({ fieldArms: 20, fieldTwist: 20 })).toMatchObject({ fieldArms: 8, fieldTwist: 8 });
  });

  it('clamps the camera lens settings', () => {
    expect(normalizeConeViewConfig({
      cameraFov: 500,
      fisheyeAngle: 10,
      lensDistortion: 2,
      cameraDolly: -5,
      torusAim: 3,
    })).toMatchObject({
      cameraFov: 150,
      fisheyeAngle: 90,
      lensDistortion: 0.5,
      cameraDolly: -1,
      torusAim: 1,
    });
  });

  it('normalizes the torus wiggle settings', () => {
    expect(normalizeConeViewConfig({ wigglePreset: 'handheld' }).wigglePreset).toBe('handheld');
    expect(normalizeConeViewConfig({ wigglePreset: 'earthquake' }).wigglePreset).toBe('off');
    expect(normalizeConeViewConfig({ wiggleAmount: 9, wiggleSpeed: 2.6 })).toMatchObject({
      wiggleAmount: 2,
      wiggleSpeed: 3,
    });
  });

  it('wraps rotation-like angles and clamps the torus camera offset', () => {
    expect(normalizeConeViewConfig({ rotation: -90 }).rotation).toBe(270);
    expect(normalizeConeViewConfig({ cameraYaw: 390, cameraPitch: -30 })).toMatchObject({
      cameraYaw: 30,
      cameraPitch: 330,
    });
    expect(normalizeConeViewConfig({ cameraX: 2, cameraY: -2 })).toMatchObject({
      cameraX: 0.8,
      cameraY: -0.8,
    });
  });

  it('normalizes all seam modes and falls back for legacy values', () => {
    expect(CONE_SEAM_MODE_OPTIONS.map(({ value }) => value)).toEqual(['mirror', 'weld', 'reapply']);
    expect(CONE_SEAM_MODE_OPTIONS.map(({ label }) => label)).toEqual(['Mirror Repeat', 'Edge Weld', 'Gradient Reapply']);
    expect(DEFAULT_CONE_SEAM_MODE).toBe('mirror');
    expect(CONE_SEAM_MODE_INDEX).toEqual({ mirror: 0, weld: 1, reapply: 2 });
    expect(normalizeConeViewConfig({ seamMode: 'mirror' }).seamMode).toBe('mirror');
    expect(normalizeConeViewConfig({ seamMode: 'weld' }).seamMode).toBe('weld');
    expect(normalizeConeViewConfig({ seamMode: 'reapply' }).seamMode).toBe('reapply');
    expect(normalizeConeViewConfig({ seamMode: 'smooth' } as unknown).seamMode).toBe('mirror');
    expect(normalizeConeViewConfig({ seamMode: 'unknown' }).seamMode).toBe('mirror');
    expect(normalizeConeViewConfig({}).seamMode).toBe('mirror');
  });

  it('normalizes store updates and persists settings without a render mode', () => {
    useGradientStore.getState().setConeView({ depth: 27.5, textureRepeat: 4, flowCycles: -22 });
    const coneView = useGradientStore.getState().coneView;
    expect(coneView).toMatchObject({ depth: 27.5, textureRepeat: 4, flowCycles: -22, seamMode: 'mirror' });

    const preset = makePreset('Cone', useGradientStore.getState());
    expect(preset.state.coneView).toEqual(coneView);
    expect('renderViewMode' in preset.state).toBe(false);
  });
});
