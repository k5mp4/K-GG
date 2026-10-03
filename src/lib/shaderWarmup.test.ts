import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getShaderWarmupSnapshot,
  prefetchEffectStackLayer,
  resetShaderWarmupForTests,
  setPresetWarmupTargets,
  startShaderWarmup,
  subscribeShaderWarmup,
  type IdleScheduler,
  type ShaderWarmupHost,
} from './shaderWarmup';
import type { LazyCompilePriority, LazyProgramSettleResult } from './webgl';
import type { LazyProgramKey } from './webglShaderSources';

type Call = { key: LazyProgramKey; priority: LazyCompilePriority };

function createHost(overrides: Partial<ShaderWarmupHost> = {}) {
  const settled: Call[] = [];
  const requested: Call[] = [];
  const host: ShaderWarmupHost = {
    settle: async (key, priority) => {
      settled.push({ key, priority });
      return 'ready' satisfies LazyProgramSettleResult;
    },
    request: (key, priority) => {
      requested.push({ key, priority });
    },
    canWarmInBackground: () => true,
    isBusy: () => false,
    getRequiredKeys: () => ['generator', 'stackCore'],
    getRequiredKeysWithLayer: () => ['stackCore', 'glassV2'],
    ...overrides,
  };
  return { host, settled, requested };
}

/** Runs idle callbacks only when the test flushes them. */
function createManualIdle() {
  const queue: Array<() => void> = [];
  const schedule: IdleScheduler = (callback) => {
    queue.push(callback);
    return () => {
      const index = queue.indexOf(callback);
      if (index >= 0) queue.splice(index, 1);
    };
  };
  const flush = async () => {
    for (let round = 0; round < 50; round++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const next = queue.shift();
      if (!next) return;
      next();
    }
  };
  return { schedule, flush, pending: () => queue.length };
}

describe('shader warmup', () => {
  afterEach(() => {
    resetShaderWarmupForTests();
  });

  it('settles the current scene at demand priority before idle warmup of the rest', async () => {
    const idle = createManualIdle();
    const { host, settled } = createHost();
    const stop = startShaderWarmup(host, {
      plan: ['generator', 'stackCore', 'noiseStack', 'glassV2'],
      scheduleIdle: idle.schedule,
    });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(settled).toEqual([
      { key: 'generator', priority: 'demand' },
      { key: 'stackCore', priority: 'demand' },
    ]);
    expect(getShaderWarmupSnapshot()).toMatchObject({
      status: 'background',
      criticalTotal: 2,
      criticalSettled: 2,
      backgroundTotal: 2,
    });

    await idle.flush();
    expect(settled.slice(2)).toEqual([
      { key: 'noiseStack', priority: 'warmup' },
      { key: 'glassV2', priority: 'warmup' },
    ]);
    expect(getShaderWarmupSnapshot()).toMatchObject({ status: 'done', backgroundSettled: 2 });
    stop();
  });

  it('skips background warmup when compiling would block the main thread', async () => {
    const idle = createManualIdle();
    const { host, settled } = createHost({ canWarmInBackground: () => false });
    startShaderWarmup(host, { plan: ['generator', 'stackCore', 'noiseStack'], scheduleIdle: idle.schedule });

    await idle.flush();
    expect(settled.map(call => call.key)).toEqual(['generator', 'stackCore']);
    expect(getShaderWarmupSnapshot()).toMatchObject({ status: 'done', backgroundSkipped: true });
  });

  it('treats a failed critical program as settled so startup is not blocked', async () => {
    const { host } = createHost({
      settle: async key => (key === 'stackCore' ? 'failed' : 'ready'),
      canWarmInBackground: () => false,
    });
    startShaderWarmup(host, { plan: [] });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getShaderWarmupSnapshot()).toMatchObject({ status: 'done', criticalSettled: 2 });
  });

  it('waits while an export owns the GPU and stops when disposed', async () => {
    const idle = createManualIdle();
    let busy = true;
    const { host, settled } = createHost({ isBusy: () => busy, getRequiredKeys: () => [] });
    const stop = startShaderWarmup(host, { plan: ['noiseStack', 'glassV2'], scheduleIdle: idle.schedule });

    await idle.flush();
    // flush() gives up after a bounded number of idle rounds while the host stays busy.
    expect(settled).toEqual([]);

    busy = false;
    stop();
    await idle.flush();
    expect(settled).toEqual([]);
    expect(idle.pending()).toBe(0);
  });

  it('waits for the first scene snapshot before choosing critical programs', async () => {
    const idle = createManualIdle();
    let required: LazyProgramKey[] | null = null;
    const { host, settled } = createHost({
      getRequiredKeys: () => required,
      canWarmInBackground: () => false,
    });
    startShaderWarmup(host, { plan: [], scheduleIdle: idle.schedule });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(getShaderWarmupSnapshot().status).toBe('waiting');
    required = ['noiseStack'];
    await idle.flush();
    expect(settled).toEqual([{ key: 'noiseStack', priority: 'demand' }]);
  });

  it('prefetches the programs an Effect Stack layer would need through the active host', () => {
    const { host, requested } = createHost({ getRequiredKeys: () => null });
    prefetchEffectStackLayer('glass');
    expect(requested).toEqual([]);

    const stop = startShaderWarmup(host, { plan: [], scheduleIdle: () => () => undefined });
    prefetchEffectStackLayer('glass');
    expect(requested).toEqual([
      { key: 'stackCore', priority: 'prefetch' },
      { key: 'glassV2', priority: 'prefetch' },
    ]);

    stop();
    prefetchEffectStackLayer('glass');
    expect(requested).toHaveLength(2);
  });

  it('compiles the programs Presets need after the base warmup, once each, at warmup priority', async () => {
    const idle = createManualIdle();
    const settled: Array<Call & { noiseVariant?: number }> = [];
    const { host } = createHost({
      settle: async (key, priority, noiseVariant) => {
        settled.push({ key, priority, noiseVariant });
        return 'ready' satisfies LazyProgramSettleResult;
      },
    });
    setPresetWarmupTargets([{ key: 'datamosh' }, { key: 'noiseStack', noiseVariant: 3 }]);
    const stop = startShaderWarmup(host, { plan: ['blur'], scheduleIdle: idle.schedule });

    await idle.flush();
    const presetCalls = settled.filter(call => call.priority === 'warmup' && call.key !== 'blur');
    expect(presetCalls).toEqual([
      { key: 'datamosh', priority: 'warmup', noiseVariant: undefined },
      { key: 'noiseStack', priority: 'warmup', noiseVariant: 3 },
    ]);
    // The base plan finishes before the Preset programs start.
    expect(settled.findIndex(call => call.key === 'blur')).toBeLessThan(settled.findIndex(call => call.key === 'datamosh'));

    setPresetWarmupTargets([{ key: 'datamosh' }, { key: 'noiseStack', noiseVariant: 3 }, { key: 'texture' }]);
    await idle.flush();
    expect(settled.filter(call => call.key === 'datamosh')).toHaveLength(1);
    expect(settled.filter(call => call.key === 'texture')).toHaveLength(1);
    stop();
  });

  it('does not compile Preset programs while an export owns the GPU', async () => {
    const idle = createManualIdle();
    let busy = true;
    const { host, settled } = createHost({ isBusy: () => busy });
    const stop = startShaderWarmup(host, { plan: [], scheduleIdle: idle.schedule });
    await idle.flush();

    setPresetWarmupTargets([{ key: 'texture' }]);
    await idle.flush();
    expect(settled.some(call => call.key === 'texture')).toBe(false);

    busy = false;
    await idle.flush();
    expect(settled.some(call => call.key === 'texture')).toBe(true);
    stop();
  });

  it('notifies subscribers on progress', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeShaderWarmup(listener);
    const { host } = createHost({ canWarmInBackground: () => false });
    startShaderWarmup(host, { plan: [] });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
