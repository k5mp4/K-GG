import { beforeEach, describe, expect, it } from 'vitest';
import { applicationCommands } from '../application/commands';
import { selectDocumentState } from './selectors';
import { STORE_DEFAULTS, useGradientStore } from './gradientStore';
import { DEFAULT_DISTORT_CHROMA } from '../types/distortChroma';

describe('Distort Chroma document state', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('starts disabled with the documented defaults', () => {
    expect(useGradientStore.getState().distortChroma).toEqual(DEFAULT_DISTORT_CHROMA);
    expect(STORE_DEFAULTS.distortChroma).toEqual(DEFAULT_DISTORT_CHROMA);
    expect(selectDocumentState(useGradientStore.getState()).distortChroma)
      .toBe(useGradientStore.getState().distortChroma);
  });

  it('merges partial updates through the command boundary and clamps them', () => {
    applicationCommands.setDistortChroma({ enabled: true, steps: 100, amountX: 12 });

    expect(useGradientStore.getState().distortChroma).toMatchObject({
      enabled: true,
      steps: 32,
      amountX: 12,
      amountY: DEFAULT_DISTORT_CHROMA.amountY,
    });
  });

  it('keeps the layer and the config flag in step in both directions', () => {
    const layerEnabled = () => useGradientStore.getState().effectPipeline.effectStack
      .find(layer => layer.kind === 'distortChroma')?.enabled;

    expect(layerEnabled()).toBe(false);
    applicationCommands.setDistortChroma({ enabled: true });
    expect(layerEnabled()).toBe(true);

    const { effectPipeline } = useGradientStore.getState();
    applicationCommands.setEffectPipeline({
      effectStack: effectPipeline.effectStack.map(layer => (
        layer.kind === 'distortChroma' ? { ...layer, enabled: false } : layer
      )),
    });
    expect(useGradientStore.getState().distortChroma.enabled).toBe(false);
  });

  it('adds a disabled layer to a document saved before the layer existed', () => {
    applicationCommands.setEffectPipeline({ effectStack: [{ kind: 'diffuse', enabled: true }] });

    const layer = useGradientStore.getState().effectPipeline.effectStack.find(item => item.kind === 'distortChroma');
    expect(layer).toEqual({ kind: 'distortChroma', enabled: false });
  });

  it('does not share the default object between stores', () => {
    applicationCommands.setDistortChroma({ bump: 50 });

    expect(STORE_DEFAULTS.distortChroma.bump).toBe(DEFAULT_DISTORT_CHROMA.bump);
    expect(useGradientStore.getInitialState().distortChroma.bump).toBe(DEFAULT_DISTORT_CHROMA.bump);
  });
});
