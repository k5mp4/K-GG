import type { EffectStackKind } from '../types/distortion';
import type { LazyCompilePriority, LazyProgramSettleResult } from './webgl';
import type { LazyProgramKey } from './webglShaderSources';

/**
 * Idle warmup order after the current scene is ready. Cheap, commonly used
 * Effect Stack programs come first; the Glass family has the longest driver
 * compile and goes last so it never delays the cheaper rows. Programs that
 * need an external input (Video Motion, Flow) or belong to other panels are
 * compiled on demand or by hover prefetch instead.
 */
export const SHADER_WARMUP_PLAN: readonly LazyProgramKey[] = [
  'generator',
  'stackCore',
  'noiseStack',
  'stretch',
  'noiseDiffuseStack',
  'blur',
  'normalMap',
  'glassTile',
  'glassV2',
];

/** How many idle attempts to wait for the first scene snapshot before giving up on critical keys. */
const CRITICAL_SCENE_WAIT_ATTEMPTS = 20;

export type ShaderWarmupStatus =
  /** WebGL is still initializing. */
  | 'waiting'
  /** Programs required by the current scene are compiling. */
  | 'critical'
  /** The scene is ready; remaining programs compile in idle time. */
  | 'background'
  | 'done'
  /** WebGL is unavailable or failed; the CPU preview is shown instead. */
  | 'unavailable';

export type ShaderWarmupSnapshot = {
  status: ShaderWarmupStatus;
  criticalTotal: number;
  criticalSettled: number;
  backgroundTotal: number;
  backgroundSettled: number;
  /** True when background warmup was skipped because it could block the main thread. */
  backgroundSkipped: boolean;
};

/** The WebGL-facing operations warmup needs. Implemented by `shaderWarmupHost.ts`. */
export type ShaderWarmupHost = {
  settle(key: LazyProgramKey, priority: LazyCompilePriority): Promise<LazyProgramSettleResult>;
  request(key: LazyProgramKey, priority: LazyCompilePriority): void;
  canWarmInBackground(): boolean;
  /** Pauses background warmup, for example while an export owns the GPU. */
  isBusy(): boolean;
  /** Programs the current scene needs, or null while no scene snapshot exists yet. */
  getRequiredKeys(): LazyProgramKey[] | null;
  /** Programs the current scene would need with `kind` enabled. */
  getRequiredKeysWithLayer(kind: EffectStackKind): LazyProgramKey[];
};

export type IdleScheduler = (callback: () => void) => () => void;

export const INITIAL_SHADER_WARMUP_SNAPSHOT: ShaderWarmupSnapshot = {
  status: 'waiting',
  criticalTotal: 0,
  criticalSettled: 0,
  backgroundTotal: 0,
  backgroundSettled: 0,
  backgroundSkipped: false,
};

let snapshot: ShaderWarmupSnapshot = INITIAL_SHADER_WARMUP_SNAPSHOT;
const listeners = new Set<() => void>();
let activeHost: ShaderWarmupHost | null = null;

function publish(next: Partial<ShaderWarmupSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener();
}

export function getShaderWarmupSnapshot(): ShaderWarmupSnapshot {
  return snapshot;
}

export function subscribeShaderWarmup(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Marks the preview as running without WebGL so startup UI does not wait for shaders. */
export function markShaderWarmupUnavailable(): void {
  publish({ status: 'unavailable' });
}

/** Test helper: returns the module to its initial state. */
export function resetShaderWarmupForTests(): void {
  snapshot = INITIAL_SHADER_WARMUP_SNAPSHOT;
  listeners.clear();
  activeHost = null;
}

export const defaultIdleScheduler: IdleScheduler = (callback) => {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(() => callback(), { timeout: 1000 });
    return () => window.cancelIdleCallback(handle);
  }
  // WKWebView has no requestIdleCallback; yield a short task instead.
  const handle = setTimeout(callback, 50);
  return () => clearTimeout(handle);
};

function waitForIdle(schedule: IdleScheduler, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const cancel = schedule(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    });
    const onAbort = () => {
      cancel();
      resolve();
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Prepares shaders for the preview context in two phases:
 * 1. critical: programs the current scene needs, at demand priority;
 * 2. background: the rest of `plan`, one program per idle period at warmup
 *    priority, so a user request always runs before the next warmup compile.
 * Failures settle a program instead of stopping warmup. Returns a disposer.
 */
export function startShaderWarmup(
  host: ShaderWarmupHost,
  options: { plan?: readonly LazyProgramKey[]; scheduleIdle?: IdleScheduler } = {},
): () => void {
  const plan = options.plan ?? SHADER_WARMUP_PLAN;
  const scheduleIdle = options.scheduleIdle ?? defaultIdleScheduler;
  const controller = new AbortController();
  const { signal } = controller;
  activeHost = host;

  const run = async () => {
    let critical = host.getRequiredKeys();
    for (let attempt = 0; critical === null && attempt < CRITICAL_SCENE_WAIT_ATTEMPTS; attempt++) {
      await waitForIdle(scheduleIdle, signal);
      if (signal.aborted) return;
      critical = host.getRequiredKeys();
    }
    const criticalKeys = critical ?? [];
    publish({
      status: 'critical',
      criticalTotal: criticalKeys.length,
      criticalSettled: 0,
      backgroundTotal: 0,
      backgroundSettled: 0,
      backgroundSkipped: false,
    });
    let criticalSettled = 0;
    await Promise.all(criticalKeys.map(async (key) => {
      await host.settle(key, 'demand');
      if (signal.aborted) return;
      criticalSettled += 1;
      publish({ criticalSettled });
    }));
    if (signal.aborted) return;

    if (!host.canWarmInBackground()) {
      publish({ status: 'done', backgroundSkipped: true });
      return;
    }
    const backgroundKeys = plan.filter(key => !criticalKeys.includes(key));
    publish({ status: 'background', backgroundTotal: backgroundKeys.length, backgroundSettled: 0 });
    let backgroundSettled = 0;
    for (const key of backgroundKeys) {
      do {
        await waitForIdle(scheduleIdle, signal);
        if (signal.aborted) return;
      } while (host.isBusy());
      const result = await host.settle(key, 'warmup');
      if (signal.aborted || result === 'disposed') return;
      backgroundSettled += 1;
      publish({ backgroundSettled });
    }
    publish({ status: 'done' });
  };

  void run().catch((error) => {
    if (signal.aborted) return;
    console.warn('[WebGL shader] warmup stopped', error);
    publish({ status: 'done' });
  });

  return () => {
    controller.abort();
    if (activeHost === host) activeHost = null;
  };
}

/**
 * Starts compiling the programs an Effect Stack layer would need, so a
 * following toggle does not wait for a cold compile. Safe to call often:
 * ready or in-flight programs are not compiled twice.
 */
export function prefetchEffectStackLayer(kind: EffectStackKind): void {
  const host = activeHost;
  if (!host) return;
  try {
    for (const key of host.getRequiredKeysWithLayer(kind)) host.request(key, 'prefetch');
  } catch (error) {
    console.warn('[WebGL shader] prefetch skipped', error);
  }
}
