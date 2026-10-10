import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORE_DEFAULTS, useGradientStore } from '../../store/gradientStore';
import { createDocumentState } from '../../store/documentSlice';
import { markShaderWarmupUnavailable, resetShaderWarmupForTests, startShaderWarmup, type ShaderWarmupHost } from '../../lib/shaderWarmup';
import type { Preset } from '../../lib/presetModel';
import * as loader from '../../lib/applyPreset';
import { VjPresetCache } from './vjPresetCache';
import { prepareBoundedVjPreset } from './vjDocument';
import { NOISE_TYPE_MAP } from '../../lib/webglShaderSources';

const savedState = useGradientStore.getState();
const preset = (id: string): Preset => ({ id, name: id, createdAt: 1, state: structuredClone(createDocumentState(STORE_DEFAULTS)) });
const schedule = (callback: () => void) => { queueMicrotask(callback); return () => {}; };
function host(settle: ShaderWarmupHost['settle'] = async () => 'ready'): ShaderWarmupHost {
  return { settle, request: () => {}, getRequiredKeys: () => [], getRequiredKeysWithLayer: () => [],
    isBusy: () => false, canWarmInBackground: () => false, retain: vi.fn() };
}
afterEach(() => { resetShaderWarmupForTests(); useGradientStore.setState(savedState); vi.restoreAllMocks(); });
describe('VJ preparation cache', () => {
  it('waits for a randomized Noise variant before publishing the automatic cue', async () => {
    let release: (value: 'ready') => void = () => {};
    const pendingVariant = new Promise<'ready'>(resolve => { release = resolve; });
    const settle = vi.fn<ShaderWarmupHost['settle']>((_key, _priority, variant) =>
      variant === NOISE_TYPE_MAP.perlin ? pendingVariant : Promise.resolve('ready'));
    startShaderWarmup(host(settle), { plan: [] });
    const cue = preset('variant');
    cue.state.noiseDistortion!.type = 'simplex';
    cue.state.effectPipeline!.effectStack = [{ kind: 'noise', enabled: true }];
    const base = new VjPresetCache(schedule);
    const automatic = new VjPresetCache(schedule);
    await base.sync([cue]);
    const before = useGradientStore.getState();
    const prepare = () => prepareBoundedVjPreset(base.getPrepared(cue.id)!, {
      'noiseDistortion.type': { values: ['perlin'] },
      'noiseDistortion.amount': { min: 0.35, max: 0.35 },
    });
    const pending = automatic.sync([cue], prepare);
    await vi.waitFor(() => expect(settle.mock.calls.some(call => call[2] === NOISE_TYPE_MAP.perlin)).toBe(true));
    expect(automatic.isReady(cue.id)).toBe(false);
    expect(automatic.apply(cue.id)).toBe(false);
    expect(useGradientStore.getState()).toBe(before);
    release('ready');
    await pending;
    const compiled = settle.mock.calls.length;
    const observed: string[] = [];
    const unsubscribe = useGradientStore.subscribe(state => observed.push(state.noiseDistortion.type));
    expect(automatic.apply(cue.id)).toBe(true);
    expect(observed).toEqual(['perlin']);
    expect(useGradientStore.getState().noiseDistortion.amount).toBe(0.35);
    expect(settle).toHaveBeenCalledTimes(compiled);
    unsubscribe();
    automatic.clear();
    base.clear();
  });
  it('prepares a new bounded cue when its rules change and only publishes the randomized document', async () => {
    startShaderWarmup(host(), { plan: [] });
    const cue = preset('a');
    cue.state.effectPipeline!.effectStack = [{ kind: 'noise', enabled: true }];
    const cache = new VjPresetCache(schedule);
    const before = useGradientStore.getState();
    const prepare = (amount: number) => (preset: Preset) => prepareBoundedVjPreset(loader.preparePresetToDocument(preset), {
      'noiseDistortion.amount': { min: amount, max: amount },
    });
    await cache.sync([cue], prepare(0.31));
    expect(useGradientStore.getState()).toBe(before);
    const observed: number[] = [];
    const unsubscribe = useGradientStore.subscribe(state => observed.push(state.noiseDistortion.amount));
    expect(cache.apply('a')).toBe(true);
    expect(observed).toEqual([0.31]);
    await cache.sync([cue], prepare(0.42));
    expect(cache.apply('a')).toBe(true);
    expect(observed).toEqual([0.31, 0.42]);
    unsubscribe();
    cache.clear();
  });
  it('distinguishes a starting GPU from an unavailable GPU and recovers when a host returns', async () => {
    const cache = new VjPresetCache(schedule);
    const cues = [preset('a')];
    await cache.sync(cues);
    expect(cache.getSnapshot()).toEqual({ total: 1, ready: 0, error: null });
    markShaderWarmupUnavailable();
    await cache.sync(cues);
    expect(cache.getSnapshot()).toEqual({ total: 1, ready: 0, error: 'prepare' });
    startShaderWarmup(host(), { plan: [] });
    await cache.sync(cues);
    expect(cache.getSnapshot()).toEqual({ total: 1, ready: 1, error: null });
    cache.clear();
  });
  it('prepares each document once and switches repeatedly without asynchronous preparation', async () => {
    const gpu = host(vi.fn(async () => 'ready' as const));
    startShaderWarmup(gpu, { plan: [] });
    const prepare = vi.spyOn(loader, 'preparePresetToDocument');
    const cache = new VjPresetCache(schedule);
    const cues = [preset('a'), preset('b')];
    const before = useGradientStore.getState();
    await cache.sync(cues);
    expect(useGradientStore.getState()).toBe(before);
    expect(cache.getSnapshot()).toEqual({ ready: 2, total: 2, error: null });
    const compiles = vi.mocked(gpu.settle).mock.calls.length;
    for (let index = 0; index < 20; index++) {
      expect(cache.apply(cues[index % 2].id)).toBe(true);
      expect(useGradientStore.getState().presetName).toBe(cues[index % 2].name);
    }
    await cache.sync(cues);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(gpu.settle).toHaveBeenCalledTimes(compiles);
    cache.clear();
  });
  it('invalidates readiness across context changes and releases performance resources on exit', async () => {
    const first = host();
    const stop = startShaderWarmup(first, { plan: [] });
    const cache = new VjPresetCache(schedule);
    const cues = [preset('a')];
    await cache.sync(cues);
    stop();
    expect(cache.apply('a')).toBe(false);
    const second = host();
    startShaderWarmup(second, { plan: [] });
    await cache.sync(cues);
    expect(cache.isReady('a')).toBe(true);
    cache.clear();
    expect(second.retain).toHaveBeenLastCalledWith([]);
    expect(cache.apply('a')).toBe(false);
  });
  it('never applies a failed or cancelled preparation to the live document', async () => {
    let release: (value: 'ready') => void = () => {};
    const gpu = host(() => new Promise(resolve => { release = resolve; }));
    startShaderWarmup(gpu, { plan: [] });
    const cache = new VjPresetCache(schedule);
    const before = useGradientStore.getState();
    const pending = cache.sync([preset('a')]);
    for (let index = 0; index < 6; index++) await Promise.resolve();
    cache.clear();
    release('ready');
    await pending;
    expect(cache.apply('a')).toBe(false);
    expect(useGradientStore.getState()).toBe(before);
    startShaderWarmup(host(async () => 'failed'), { plan: [] });
    await cache.sync([preset('b')]);
    expect(cache.getSnapshot()).toMatchObject({ ready: 0, error: 'prepare' });
    expect(cache.apply('b')).toBe(false);
    expect(useGradientStore.getState()).toBe(before);
    cache.clear();
  });
  it('reprepares inherited live Noise modes before applying a legacy partial cue', async () => {
    const gpu = host();
    startShaderWarmup(gpu, { plan: [] });
    const cue = preset('partial');
    Reflect.deleteProperty(cue.state, 'noiseDistortion');
    cue.state.effectPipeline = { ...STORE_DEFAULTS.effectPipeline, version: 'stack-v2', effectStack: [{ kind: 'noise', enabled: true }], selectedKind: 'noise' };
    useGradientStore.setState({ noiseDistortion: { ...savedState.noiseDistortion, type: 'simplex', enabled: true } });
    const cache = new VjPresetCache(schedule);
    await cache.sync([cue]);
    useGradientStore.setState({ noiseDistortion: { ...useGradientStore.getState().noiseDistortion, type: 'perlin' } });
    const before = useGradientStore.getState();
    expect(cache.apply('partial')).toBe(false);
    expect(useGradientStore.getState()).toBe(before);
    await cache.sync([cue]);
    expect(cache.apply('partial')).toBe(true);
    expect(useGradientStore.getState().noiseDistortion.type).toBe('perlin');
    cache.clear();
  });
});
