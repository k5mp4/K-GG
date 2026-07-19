import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultEffectStack, updateEffectStackLayer } from '../lib/effectPipeline';
import { optimizeNoiseDistortion, type RenderOptimization } from '../lib/gpuDiagnostics';
import { useGradientStore } from './gradientStore';

function layerEnabled(kind: 'diffuse' | 'noise' | 'slit'): boolean {
  return useGradientStore.getState().effectPipeline.effectStack
    .find(layer => layer.kind === kind)?.enabled ?? false;
}

describe('Gradient store Effect Pipeline V2 synchronization', () => {
  beforeEach(() => {
    useGradientStore.setState(useGradientStore.getInitialState(), true);
  });

  it('synchronizes V2 stack changes into the Diffuse, Noise, and Slit configs', () => {
    let effectStack = createDefaultEffectStack();
    effectStack = updateEffectStackLayer(effectStack, 'diffuse', { enabled: false });
    effectStack = updateEffectStackLayer(effectStack, 'noise', { enabled: true });
    effectStack = updateEffectStackLayer(effectStack, 'slit', { enabled: true });

    useGradientStore.getState().setEffectPipeline({ effectStack });

    const state = useGradientStore.getState();
    expect(state.effectPipeline.version).toBe('stack-v2');
    expect(state.diffuse.enabled).toBe(false);
    expect(state.noiseDistortion.enabled).toBe(true);
    expect(state.slitScan.enabled).toBe(true);
  });

  it('synchronizes Diffuse, Noise, and Slit config toggles back into the V2 stack', () => {
    const store = useGradientStore.getState();
    store.setDiffuse({ enabled: false });
    store.setNoiseDistortion({ enabled: true });
    store.setSlitScan({ enabled: true });

    expect(layerEnabled('diffuse')).toBe(false);
    expect(layerEnabled('noise')).toBe(true);
    expect(layerEnabled('slit')).toBe(true);
  });

  it('keeps Diffuse panel parameters as the V2 source instead of legacy postprocess values', () => {
    const store = useGradientStore.getState();
    store.setPostprocess({
      diffuseEnabled: false,
      diffuseMode: 'block',
      diffuseScatter: 4,
      diffuseGrain: 1,
      diffuseSeed: 2,
      diffuseDitherThreshold: 0.1,
    });
    store.setDiffuse({
      enabled: true,
      mode: 'smooth',
      scatter: 187,
      grain: 3.75,
      seed: 42,
      ditherThreshold: 0.73,
    });

    useGradientStore.getState().setEffectPipeline({
      version: 'stack-v2',
      effectStack: updateEffectStackLayer(
        useGradientStore.getState().effectPipeline.effectStack,
        'diffuse',
        { enabled: true },
      ),
    });

    const state = useGradientStore.getState();
    expect(state.diffuse).toMatchObject({
      enabled: true,
      mode: 'smooth',
      scatter: 187,
      grain: 3.75,
      seed: 42,
      ditherThreshold: 0.73,
    });
    expect(state.postprocess).toMatchObject({
      diffuseEnabled: false,
      diffuseMode: 'block',
      diffuseScatter: 4,
      diffuseGrain: 1,
      diffuseSeed: 2,
      diffuseDitherThreshold: 0.1,
    });
  });

  it('keeps Legacy config toggles independent from the stored V2 layer flags', () => {
    useGradientStore.getState().setEffectPipeline({ version: 'legacy-v1' });

    const store = useGradientStore.getState();
    store.setDiffuse({ enabled: false });
    store.setNoiseDistortion({ enabled: true });
    store.setSlitScan({ enabled: true });

    const state = useGradientStore.getState();
    expect(state.effectPipeline.version).toBe('legacy-v1');
    expect(state.diffuse.enabled).toBe(false);
    expect(state.noiseDistortion.enabled).toBe(true);
    expect(state.slitScan.enabled).toBe(true);
    expect(layerEnabled('diffuse')).toBe(true);
    expect(layerEnabled('noise')).toBe(false);
    expect(layerEnabled('slit')).toBe(false);
  });

  it('keeps Legacy Curl and applies the lightweight Fast Curl preset independently', () => {
    const store = useGradientStore.getState();
    store.setNoiseDistortion({ type: 'curl' });
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      type: 'curl', curlSteps: 4, curlEps: 0.01,
    });

    store.setNoiseDistortion({ type: 'fast_curl' });
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      type: 'fast_curl', amount: 0.30, scale: 0.5, octaves: 3, curlSteps: 2, curlSpeed: 0.5,
    });

    store.setNoiseDistortion({ type: 'curl' });
    expect(useGradientStore.getState().noiseDistortion.type).toBe('curl');
  });

  it('applies GPU-tier octave and step limits to Fast Curl', () => {
    const medium: RenderOptimization = {
      tier: 'medium', reasons: [], maxNoiseOctaves: 6, maxCurlSteps: 5,
      maxBlurRadius: 48, maxPrismRays: 64, maxKaleidoscopeSlices: 48,
      maxGlassComplexity: 4, maxStretchGlowRadius: 48,
    };
    const optimized = optimizeNoiseDistortion({
      ...useGradientStore.getState().noiseDistortion,
      type: 'fast_curl', octaves: 8, curlSteps: 8,
    }, medium);
    expect(optimized).toMatchObject({ type: 'fast_curl', octaves: 6, curlSteps: 5 });
  });
});
