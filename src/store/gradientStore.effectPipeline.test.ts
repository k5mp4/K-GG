import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultEffectStack, updateEffectStackLayer } from '../lib/effectPipeline';
import { optimizeNoiseDistortion, type RenderOptimization } from '../lib/gpuDiagnostics';
import { normalizeNoiseDistortionConfig, STORE_DEFAULTS, useGradientStore } from './gradientStore';

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

  it('adds Caustics with deterministic defaults and restores missing values from defaults', () => {
    const store = useGradientStore.getState();
    store.setNoiseDistortion({ type: 'caustics' });

    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      type: 'caustics',
      causticsDepth: 0.65,
      causticsRefraction: 1.0,
      causticsSharpness: 2.5,
      causticsComplexity: 4,
      causticsWaveSpread: 0.75,
      causticsBoundaryWidth: 0.75,
    });

    store.setNoiseDistortion({
      scale: 9,
      causticsDepth: Number.NaN,
      causticsRefraction: Number.POSITIVE_INFINITY,
      causticsSharpness: -10,
      causticsComplexity: 100,
      causticsWaveSpread: -1,
      causticsBoundaryWidth: 9,
    });
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      scale: 3,
      causticsDepth: STORE_DEFAULTS.noiseDistortion.causticsDepth,
      causticsRefraction: 1.0,
      causticsSharpness: 0.5,
      causticsComplexity: 8,
      causticsWaveSpread: 0,
      causticsBoundaryWidth: 1,
    });

    const legacyNoise = normalizeNoiseDistortionConfig({
      enabled: true,
      type: 'simplex',
      amount: 0.15,
      scale: 3,
      octaves: 3,
      evolution: 0,
      speed: 0.5,
    });
    expect(legacyNoise.causticsDepth).toBe(STORE_DEFAULTS.noiseDistortion.causticsDepth);
    expect(legacyNoise.causticsComplexity).toBe(STORE_DEFAULTS.noiseDistortion.causticsComplexity);
    expect(legacyNoise.causticsBoundaryWidth).toBe(STORE_DEFAULTS.noiseDistortion.causticsBoundaryWidth);
  });

  it('adds Phasor Lines defaults and restores missing or invalid values safely', () => {
    const store = useGradientStore.getState();
    store.setNoiseDistortion({ type: 'phasor' });

    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      type: 'phasor',
      phasorFrequency: 5,
      phasorBandwidth: 0.8,
      phasorDirection: 28,
      phasorDirectionSpread: 0.35,
      phasorSharpness: 3,
      phasorWarpStrength: 0.18,
      phasorTangentMix: 0.65,
      phasorKernelDensity: 1,
      phasorDirectionMode: 'directional',
    });

    store.setNoiseDistortion({
      phasorFrequency: Number.NaN,
      phasorBandwidth: 99,
      phasorDirection: -45,
      phasorDirectionSpread: -1,
      phasorSharpness: 99,
      phasorWarpStrength: -1,
      phasorTangentMix: 2,
      phasorKernelDensity: 0,
      phasorDirectionMode: 'invalid' as never,
    });
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({
      phasorFrequency: 5,
      phasorBandwidth: 2,
      phasorDirection: 315,
      phasorDirectionSpread: 0,
      phasorSharpness: 10,
      phasorWarpStrength: 0,
      phasorTangentMix: 1,
      phasorKernelDensity: 0.25,
      phasorDirectionMode: 'directional',
    });

    const legacyNoise = normalizeNoiseDistortionConfig({ type: 'simplex' });
    expect(legacyNoise.phasorFrequency).toBe(STORE_DEFAULTS.noiseDistortion.phasorFrequency);
    expect(legacyNoise.phasorDirectionMode).toBe('directional');
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

  it('limits Caustics complexity and sharpness only on lower GPU tiers', () => {
    const medium: RenderOptimization = {
      tier: 'medium', reasons: [], maxNoiseOctaves: 6, maxCurlSteps: 5,
      maxBlurRadius: 48, maxPrismRays: 64, maxKaleidoscopeSlices: 48,
      maxGlassComplexity: 4, maxStretchGlowRadius: 48,
    };
    const optimized = optimizeNoiseDistortion({
      ...useGradientStore.getState().noiseDistortion,
      type: 'caustics', octaves: 8, causticsComplexity: 8, causticsSharpness: 8,
    }, medium);
    expect(optimized).toMatchObject({ type: 'caustics', octaves: 6, causticsComplexity: 8, causticsSharpness: 6.5 });
  });

  it('limits Phasor density and direction spread on lower GPU tiers without changing saved state', () => {
    const low: RenderOptimization = {
      tier: 'low', reasons: [], maxNoiseOctaves: 4, maxCurlSteps: 3,
      maxBlurRadius: 18, maxPrismRays: 32, maxKaleidoscopeSlices: 24,
      maxGlassComplexity: 3, maxStretchGlowRadius: 24,
    };
    const optimized = optimizeNoiseDistortion({
      ...useGradientStore.getState().noiseDistortion,
      type: 'phasor', octaves: 8, phasorKernelDensity: 2, phasorDirectionSpread: 1,
    }, low);
    expect(optimized).toMatchObject({ type: 'phasor', octaves: 4, phasorKernelDensity: 0.75, phasorDirectionSpread: 0.6 });
  });
});
