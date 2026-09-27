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
      torusRingRepeat: 7.4,
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
      torusBend: 0.9,
      torusRingRepeat: 7,
      torusCameraX: 0,
      torusCameraY: 0,
      torusCameraYaw: 0,
      torusCameraPitch: 0,
    });
  });

  it('keeps presets without a shape on the cone and normalizes the torus shape', () => {
    expect(DEFAULT_CONE_VIEW.shape).toBe('cone');
    expect(normalizeConeViewConfig({ depth: 8 }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ shape: 'torus' }).shape).toBe('torus');
    expect(normalizeConeViewConfig({ shape: 'sphere' }).shape).toBe('cone');
    expect(normalizeConeViewConfig({ torusBend: 0 }).torusBend).toBe(0.05);
    expect(normalizeConeViewConfig({ torusRingRepeat: 0 }).torusRingRepeat).toBe(1);
  });

  it('wraps rotation-like angles and clamps the torus camera offset', () => {
    expect(normalizeConeViewConfig({ rotation: -90 }).rotation).toBe(270);
    expect(normalizeConeViewConfig({ torusCameraYaw: 390, torusCameraPitch: -30 })).toMatchObject({
      torusCameraYaw: 30,
      torusCameraPitch: 330,
    });
    expect(normalizeConeViewConfig({ torusCameraX: 2, torusCameraY: -2 })).toMatchObject({
      torusCameraX: 0.8,
      torusCameraY: -0.8,
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
