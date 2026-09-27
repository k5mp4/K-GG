import { describe, expect, it, vi } from 'vitest';
import { captureEffectStackEnabledState, normalizeEffectStack, soloEffectStackLayer } from '../../lib/effectPipeline';
import { STORE_DEFAULTS } from '../../store/documentModel';
import type { EffectPipelineConfig } from '../../types/distortion';
import { buildEffectStackView, type EffectStackViewInput } from './effectStackView';
import { createRemoteEffectStackActions, parseEffectStackIntent, runEffectStackIntent } from './effectStackIntents';

function input(overrides: Partial<EffectStackViewInput> = {}): EffectStackViewInput {
  return {
    effectPipeline: STORE_DEFAULTS.effectPipeline,
    normalMapEnabled: false,
    imageGradientEnabled: false,
    programStatus: {},
    soloSnapshot: null,
    randomizing: false,
    previousOrder: [],
    ...overrides,
  };
}

function withEnabled(pipeline: EffectPipelineConfig, kind: string): EffectPipelineConfig {
  return {
    ...pipeline,
    effectStack: normalizeEffectStack(pipeline.effectStack).map(layer => layer.kind === kind ? { ...layer, enabled: true } : layer),
  };
}

describe('Effect Stack view', () => {
  it('lists every layer in stack order with a serializable status', () => {
    const view = buildEffectStackView(input());
    expect(view.layers.map(layer => layer.kind)).toEqual(
      normalizeEffectStack(STORE_DEFAULTS.effectPipeline.effectStack).map(layer => layer.kind),
    );
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
    const disabled = view.layers.find(layer => !layer.enabled);
    expect(disabled?.status.labelKey).toBe('stack.status.off');
  });

  it('reports lazy program state, image-gradient protection and solo STAY', () => {
    const pipeline = withEnabled(withEnabled(STORE_DEFAULTS.effectPipeline, 'glass'), 'mirror');
    const status = (kind: string, overrides: Partial<EffectStackViewInput>) =>
      buildEffectStackView(input({ effectPipeline: pipeline, ...overrides })).layers.find(layer => layer.kind === kind)?.status.labelKey;

    expect(status('glass', {})).toBe('stack.status.preparing');
    expect(status('glass', { programStatus: { glassV2: 'ready' } })).toBe('stack.status.applied');
    expect(status('glass', { programStatus: { glassV2: 'failed' } })).toBe('stack.status.unavailable');
    expect(status('mirror', { imageGradientEnabled: true })).toBe('stack.status.protected');

    const soloed = { ...pipeline, effectStack: soloEffectStackLayer(pipeline.effectStack, 'glass') };
    const soloSnapshot = { targetKind: 'glass' as const, enabledState: captureEffectStackEnabledState(pipeline.effectStack) };
    expect(status('mirror', { effectPipeline: soloed, soloSnapshot })).toBe('stack.status.stay');
  });
});

describe('Effect Stack window intents', () => {
  it('accepts well-formed intents only', () => {
    expect(parseEffectStackIntent({ type: 'select', kind: 'glass', solo: true })).toEqual({ type: 'select', kind: 'glass', solo: true });
    expect(parseEffectStackIntent({ type: 'move', kind: 'noise', targetIndex: 3 })).toEqual({ type: 'move', kind: 'noise', targetIndex: 3 });
    expect(parseEffectStackIntent({ type: 'randomize', extra: 1 })).toEqual({ type: 'randomize' });

    expect(parseEffectStackIntent({ type: 'select', kind: 'bogus', solo: true })).toBeNull();
    expect(parseEffectStackIntent({ type: 'toggle', kind: 'glass', enabled: 'yes' })).toBeNull();
    expect(parseEffectStackIntent({ type: 'move', kind: 'noise', targetIndex: -1 })).toBeNull();
    expect(parseEffectStackIntent({ type: 'move', kind: 'noise', targetIndex: 1.5 })).toBeNull();
    expect(parseEffectStackIntent({ type: 'eval' })).toBeNull();
    expect(parseEffectStackIntent('randomize')).toBeNull();
  });

  it('round-trips remote actions into the local actions', () => {
    const local = { select: vi.fn(), toggle: vi.fn(), move: vi.fn(), randomize: vi.fn(), prefetch: vi.fn() };
    const remote = createRemoteEffectStackActions(intent => {
      const parsed = parseEffectStackIntent(JSON.parse(JSON.stringify(intent)));
      if (parsed) runEffectStackIntent(parsed, local);
    });

    remote.select('glass', true);
    remote.toggle('noise', false);
    remote.move('slit', 2);
    remote.randomize();
    remote.prefetch('cone');

    expect(local.select).toHaveBeenCalledWith('glass', true);
    expect(local.toggle).toHaveBeenCalledWith('noise', false);
    expect(local.move).toHaveBeenCalledWith('slit', 2);
    expect(local.randomize).toHaveBeenCalledOnce();
    expect(local.prefetch).toHaveBeenCalledWith('cone');
  });
});
