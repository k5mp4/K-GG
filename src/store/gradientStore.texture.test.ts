import { beforeEach, describe, expect, it } from 'vitest';
import { applicationCommands } from '../application/commands';
import { selectDocumentState } from './selectors';
import { STORE_DEFAULTS, useGradientStore } from './gradientStore';
import { DEFAULT_TEXTURE, getTexturePresetPatch } from '../types/texture';

describe('Texture document state', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('starts disabled with the documented defaults', () => {
    expect(useGradientStore.getState().texture).toEqual(DEFAULT_TEXTURE);
    expect(STORE_DEFAULTS.texture).toEqual(DEFAULT_TEXTURE);
    expect(selectDocumentState(useGradientStore.getState()).texture).toBe(useGradientStore.getState().texture);
  });

  it('merges partial updates through the command boundary and clamps them', () => {
    applicationCommands.setTexture({ enabled: true, roughness: 5, lightAngle: 400 });

    expect(useGradientStore.getState().texture).toMatchObject({
      enabled: true,
      roughness: 1,
      lightAngle: 40,
      anisotropy: DEFAULT_TEXTURE.anisotropy,
    });
  });

  it('applies a preset look while keeping the stage enabled', () => {
    applicationCommands.setTexture({ enabled: true });
    applicationCommands.setTexture(getTexturePresetPatch('paper'));

    expect(useGradientStore.getState().texture).toMatchObject({ enabled: true, preset: 'paper', metallic: 0, anisotropy: 0 });
  });

  it('keeps the Texture layer and the config flag in step in both directions', () => {
    const layerEnabled = () => useGradientStore.getState().effectPipeline.effectStack
      .find(layer => layer.kind === 'texture')?.enabled;

    expect(layerEnabled()).toBe(false);
    applicationCommands.setTexture({ enabled: true });
    expect(layerEnabled()).toBe(true);

    const { effectPipeline } = useGradientStore.getState();
    applicationCommands.setEffectPipeline({
      effectStack: effectPipeline.effectStack.map(layer => (
        layer.kind === 'texture' ? { ...layer, enabled: false } : layer
      )),
    });
    expect(useGradientStore.getState().texture.enabled).toBe(false);
  });

  it('enables the layer for a document that only carries the enabled config', () => {
    applicationCommands.setEffectPipeline({ effectStack: [{ kind: 'diffuse', enabled: true }] });
    useGradientStore.setState({ texture: { ...useGradientStore.getState().texture, enabled: true } });
    applicationCommands.setEffectPipeline({ effectStack: [{ kind: 'diffuse', enabled: true }] });

    expect(useGradientStore.getState().effectPipeline.effectStack.find(layer => layer.kind === 'texture')?.enabled).toBe(true);
  });

  it('does not share the default object between stores', () => {
    applicationCommands.setTexture({ scale: 3 });

    expect(STORE_DEFAULTS.texture.scale).toBe(DEFAULT_TEXTURE.scale);
    expect(useGradientStore.getInitialState().texture.scale).toBe(DEFAULT_TEXTURE.scale);
  });
});
