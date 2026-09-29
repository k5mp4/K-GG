import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HISTORY_DEBOUNCE_MS } from '../lib/constants';
import { redo, undo } from '../lib/history';
import type { StoreSnapshot } from '../lib/presetModel';
import { isPreset, makePreset } from '../lib/presetModel';
import { normalizeNoiseDistortionConfig, STORE_DEFAULTS, useGradientStore } from './gradientStore';

const CUSTOM_CHLADNI = {
  type: 'chladni' as const,
  chladniPatternCount: 4,
  chladniComplexity: 6,
  chladniLineWidth: 0.24,
  chladniSharpness: 3.5,
  chladniWarpStrength: 0.55,
  chladniRotation: 135,
  chladniMode: 'map' as const,
  chladniMapProfile: 'folded' as const,
  chladniMapAngle: 45,
  chladniModeMix: -0.4,
  chladniEdge: 0.7,
  chladniDetune: 0.25,
};

describe('Chladni Noise document lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGradientStore.setState(useGradientStore.getInitialState(), true);
    // Flush the reset into history so each test starts a fresh undo batch.
    vi.advanceTimersByTime(HISTORY_DEBOUNCE_MS * 2);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets Chladni settings back to the Noise defaults', () => {
    const store = useGradientStore.getState();
    store.setNoiseDistortion({ enabled: true, ...CUSTOM_CHLADNI });
    expect(useGradientStore.getState().noiseDistortion).toMatchObject(CUSTOM_CHLADNI);

    // The panel Reset button writes the defaults while keeping enabled.
    store.setNoiseDistortion({ ...STORE_DEFAULTS.noiseDistortion, enabled: true });
    expect(useGradientStore.getState().noiseDistortion)
      .toEqual(normalizeNoiseDistortionConfig({ ...STORE_DEFAULTS.noiseDistortion, enabled: true }));
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      type: STORE_DEFAULTS.noiseDistortion.type,
      chladniPatternCount: STORE_DEFAULTS.noiseDistortion.chladniPatternCount,
      chladniComplexity: STORE_DEFAULTS.noiseDistortion.chladniComplexity,
      chladniLineWidth: STORE_DEFAULTS.noiseDistortion.chladniLineWidth,
      chladniSharpness: STORE_DEFAULTS.noiseDistortion.chladniSharpness,
      chladniWarpStrength: STORE_DEFAULTS.noiseDistortion.chladniWarpStrength,
      chladniRotation: STORE_DEFAULTS.noiseDistortion.chladniRotation,
    });
  });

  it('restores Chladni settings through Undo and Redo', () => {
    const store = useGradientStore.getState();
    store.setNoiseDistortion({ type: 'chladni' });
    store.setNoiseDistortion(CUSTOM_CHLADNI);
    const edited = useGradientStore.getState().noiseDistortion;
    expect(edited).toMatchObject(CUSTOM_CHLADNI);

    undo();
    expect(useGradientStore.getState().noiseDistortion.type).toBe(STORE_DEFAULTS.noiseDistortion.type);
    expect(useGradientStore.getState().noiseDistortion.chladniComplexity).toBe(STORE_DEFAULTS.noiseDistortion.chladniComplexity);

    redo();
    expect(useGradientStore.getState().noiseDistortion).toEqual(edited);
  });

  it('round-trips Chladni settings through a JSON preset', () => {
    const noiseDistortion = normalizeNoiseDistortionConfig({ ...STORE_DEFAULTS.noiseDistortion, enabled: true, noiseSeed: 42.5, ...CUSTOM_CHLADNI });
    const saved = makePreset('Chladni', { diffuse: STORE_DEFAULTS.diffuse, noiseDistortion } as unknown as StoreSnapshot);
    const reloaded: unknown = JSON.parse(JSON.stringify(saved));

    expect(isPreset(reloaded)).toBe(true);
    if (!isPreset(reloaded)) throw new Error('Expected the serialized preset to reload');
    // Same path as PresetPanel: normalize, then hand the result to the store.
    useGradientStore.getState().setNoiseDistortion(normalizeNoiseDistortionConfig(reloaded.state.noiseDistortion));
    expect(useGradientStore.getState().noiseDistortion).toEqual(noiseDistortion);
  });
});
