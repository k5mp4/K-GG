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
      fog: 0,
      shade: 0,
      torusBend: 0.9,
      ringRepeat: 7,
      torusTwist: 0,
      spin: 0,
      cameraX: 0,
      cameraY: 0,
      cameraYaw: 0,
      cameraPitch: 0,
      wigglePreset: 'off',
      wiggleAmount: 1,
      wiggleSpeed: 1,
      latticeType: 'gyroid',
      latticeScale: 2,
      latticeThickness: 0.25,
      roomShape: 'cube',
      roomBounces: 6,
      roomReflectivity: 0.65,
      roomCanvasFaces: 'alternate',
    });
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

  it('normalizes the lattice and mirror room settings', () => {
    expect(normalizeConeViewConfig({ shape: 'lattice', latticeType: 'schwarzP', latticeScale: 99, latticeThickness: 0 })).toMatchObject({
      shape: 'lattice',
      latticeType: 'schwarzP',
      latticeScale: 8,
      latticeThickness: 0.02,
    });
    expect(normalizeConeViewConfig({ latticeType: 'diamond', roomShape: 'sphere', roomCanvasFaces: 'none' })).toMatchObject({
      latticeType: 'gyroid',
      roomShape: 'cube',
      roomCanvasFaces: 'alternate',
    });
    expect(normalizeConeViewConfig({ shape: 'mirrorRoom', roomBounces: 4.6, roomReflectivity: 2 })).toMatchObject({
      shape: 'mirrorRoom',
      roomBounces: 5,
      roomReflectivity: 0.95,
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
