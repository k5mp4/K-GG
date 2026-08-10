import { beforeEach, describe, expect, it } from 'vitest';
import { makePreset } from '../lib/presetModel';
import { useGradientStore } from '../store/gradientStore';
import { CONE_APEX_LIMIT, DEFAULT_CONE_VIEW, normalizeConeViewConfig } from './coneView';

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
    })).toEqual({
      depth: 30,
      rotation: -180,
      textureRepeat: 4,
      flowCycles: 30,
      apexX: CONE_APEX_LIMIT,
      apexY: -CONE_APEX_LIMIT,
      seamBlend: 0.5,
      seamMode: 'weld',
      mappingMode: 'flow',
    });
  });

  it('normalizes the two seam modes and falls back for legacy values', () => {
    expect(normalizeConeViewConfig({ seamMode: 'mirror' }).seamMode).toBe('mirror');
    expect(normalizeConeViewConfig({ seamMode: 'smooth' } as unknown).seamMode).toBe('weld');
    expect(normalizeConeViewConfig({ seamMode: 'unknown' }).seamMode).toBe('weld');
    expect(normalizeConeViewConfig({}).seamMode).toBe('weld');
  });

  it('normalizes store updates and persists settings without a render mode', () => {
    useGradientStore.getState().setConeView({ depth: 27.5, textureRepeat: 4, flowCycles: -22 });
    const coneView = useGradientStore.getState().coneView;
    expect(coneView).toMatchObject({ depth: 27.5, textureRepeat: 4, flowCycles: -22, seamMode: 'weld' });

    const preset = makePreset('Cone', useGradientStore.getState());
    expect(preset.state.coneView).toEqual(coneView);
    expect('renderViewMode' in preset.state).toBe(false);
  });
});
