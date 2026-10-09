import { beforeEach, describe, expect, it } from 'vitest';
import { STORE_DEFAULTS, useGradientStore } from '../../store/gradientStore';
import { createDocumentState } from '../../store/documentSlice';
import { applicationCommands } from '../../application/commands';
import { evaluateSceneAtTime } from '../../lib/sceneEvaluation';
import { createVjRandomValues, getVjParameters } from './vjParameters';
import { applyVjValues, captureVjDocument, prepareBoundedVjPreset, restoreVjAnimation, restoreVjDocument } from './vjDocument';
import { preparePresetToDocument, applyPreparedPresetToDocument } from '../../lib/applyPreset';
import type { Preset } from '../../lib/presetModel';

describe('VJ live parameter control', () => {
  beforeEach(() => useGradientStore.setState(useGradientStore.getInitialState(), true));

  it('prepares bounded values without publishing the original preset or changing disabled effects and locks', () => {
    const cue: Preset = { id: 'auto', name: 'Auto', createdAt: 1, state: {
      ...structuredClone(createDocumentState(STORE_DEFAULTS)),
      noiseDistortion: { ...useGradientStore.getState().noiseDistortion, amount: 0.1, noiseSeed: 21 },
      stretch: { ...useGradientStore.getState().stretch, variation: 0.45 },
      effectPipeline: { ...useGradientStore.getState().effectPipeline, effectStack: [{ kind: 'noise', enabled: true }, { kind: 'stretch', enabled: false }] },
      keyframeTracks: { 'noiseDistortion.amount': { propertyId: 'noiseDistortion.amount', label: 'Amount', mode: 'keys', enabled: true,
        keyframes: [{ id: 'key', time: 0, value: 0.1, interpolation: 'linear' }] } },
    } };
    const prepared = preparePresetToDocument(cue);
    const before = useGradientStore.getState();
    const randomized = prepareBoundedVjPreset(prepared, {
      'noiseDistortion.amount': { min: 0.33, max: 0.33 }, 'noiseDistortion.noiseSeed': { locked: true },
      'stretch.variation': { min: 0.9, max: 0.9 },
    }, () => 0.5);

    expect(useGradientStore.getState()).toBe(before);
    expect(prepared.patch.noiseDistortion!.amount).toBe(0.1);
    expect(cue.state.noiseDistortion!.amount).toBe(0.1);
    applyPreparedPresetToDocument(randomized);
    const state = useGradientStore.getState();
    expect(state.noiseDistortion).toMatchObject({ amount: 0.33, noiseSeed: 21 });
    expect(state.stretch.variation).toBe(0.45);
    expect(state.keyframeTracks['noiseDistortion.amount']).toMatchObject({ mode: 'static', enabled: false, keyframes: cue.state.keyframeTracks!['noiseDistortion.amount'].keyframes });
    expect(state.effectPipeline.effectStack).toEqual(prepared.patch.effectPipeline!.effectStack);
  });

  it('takes over only the edited keyframe track and restores the original animation', () => {
    applicationCommands.setNoiseDistortion({ enabled: true });
    applicationCommands.setKeyframeTracks({
      'noiseDistortion.amount': { propertyId: 'noiseDistortion.amount', label: 'Amount', mode: 'keys', enabled: true,
        keyframes: [{ id: 'a', time: 0, value: 0.1, interpolation: 'linear' }, { id: 'b', time: 1, value: 0.9, interpolation: 'linear' }] },
      'noiseDistortion.scale': { propertyId: 'noiseDistortion.scale', label: 'Scale', mode: 'keys', enabled: true,
        keyframes: [{ id: 's', time: 0, value: 2, interpolation: 'hold' }] },
    });
    const baseline = captureVjDocument();
    const amount = getVjParameters('noise', useGradientStore.getState()).find(parameter => parameter.field === 'amount')!;
    applyVjValues([amount], { [amount.id]: 0.3 });
    const state = useGradientStore.getState();
    const scene = evaluateSceneAtTime({ ...state, width: 1920, height: 1080, animDirection: 0 }, 0.5);
    expect(scene.noiseDistortion.amount).toBe(0.3);
    expect(scene.noiseDistortion.scale).toBe(2);
    expect(state.keyframeTracks['noiseDistortion.scale']).toEqual(baseline.keyframeTracks['noiseDistortion.scale']);
    expect(baseline.keyframeTracks['noiseDistortion.amount'].mode).toBe('keys');
    restoreVjAnimation(baseline);
    expect(useGradientStore.getState().keyframeTracks['noiseDistortion.amount'].mode).toBe('keys');
  });

  it('keeps prepared Stretch maps and randomized values when resolving a cue for publication', () => {
    const cue: Preset = { id: 'stretch', name: 'Stretch', createdAt: 1, state: structuredClone(createDocumentState(STORE_DEFAULTS)) };
    cue.state.effectPipeline!.effectStack = [{ kind: 'stretch', enabled: true }];
    const prepared = preparePresetToDocument(cue);
    const random = prepareBoundedVjPreset(prepared, { 'stretch.variation': { min: 0.65, max: 0.65 } });
    applyPreparedPresetToDocument(random);
    expect(useGradientStore.getState().stretch.variation).toBe(0.65);
    expect(useGradientStore.getState().manualDistort.displacement).toBe(prepared.patch.manualDistort!.displacement);
    expect(useGradientStore.getState().keyframeTracks['stretch.variation'].mode).toBe('static');
  });

  it('restores values while preserving independent stack toggles and order', () => {
    const baseline = captureVjDocument();
    const parameter = getVjParameters('stretch', useGradientStore.getState()).find(parameter => parameter.field === 'variation')!;
    applyVjValues([parameter], { [parameter.id]: 0.7 });
    const pipeline = useGradientStore.getState().effectPipeline;
    applicationCommands.setEffectPipeline({ effectStack: [...pipeline.effectStack].reverse().map(layer => ({ ...layer, enabled: layer.kind === 'stretch' })) });
    const stack = useGradientStore.getState().effectPipeline.effectStack;
    restoreVjDocument(baseline);
    expect(useGradientStore.getState().stretch.variation).toBe(baseline.stretch.variation);
    expect(useGradientStore.getState().stretch.enabled).toBe(true);
    expect(useGradientStore.getState().effectPipeline.effectStack).toEqual(stack);
  });

  it('rejects nonfinite and invalid enumeration values without taking over tracks', () => {
    const parameters = getVjParameters('noise', useGradientStore.getState());
    const before = captureVjDocument();
    applyVjValues(parameters, { 'noiseDistortion.amount': Number.NaN, 'noiseDistortion.type': 'unknown', 'animation.duration': 1 });
    expect(captureVjDocument()).toEqual(before);
  });

  it('keeps locked and skipped values when a randomized Noise type has its own defaults', () => {
    applicationCommands.setNoiseDistortion({ type: 'simplex', amount: 0.42, scale: 4.5 });
    const state = useGradientStore.getState();
    const parameters = getVjParameters('noise', state);
    const values = createVjRandomValues(parameters, state, {
      'noiseDistortion.type': { values: ['perlin'] },
      'noiseDistortion.amount': { locked: true },
      'noiseDistortion.scale': { min: 999, max: 1000 },
    }, 'bounded', () => 0.5);
    const nextState = { ...state, noiseDistortion: { ...state.noiseDistortion, type: 'perlin' as const } };
    applyVjValues([...parameters, ...getVjParameters('noise', nextState)], values);
    expect(useGradientStore.getState().noiseDistortion).toMatchObject({ type: 'perlin', amount: 0.42, scale: 4.5 });
    expect(useGradientStore.getState().keyframeTracks).not.toHaveProperty('noiseDistortion.amount');
    expect(useGradientStore.getState().keyframeTracks).not.toHaveProperty('noiseDistortion.scale');
  });
});
