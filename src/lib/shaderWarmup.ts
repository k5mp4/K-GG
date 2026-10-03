import type { EffectStackKind } from '../types/distortion';
import type { LazyCompilePriority, LazyProgramSettleResult } from './webgl';
import type { LazyProgramKey } from './webglShaderSources';

/**
 * Idle warmup order after the current scene is ready. Cheap, commonly used
 * Effect Stack programs come first. The Glass family and the Generator's
 * analytic Noise variant have the longest driver compiles and go last, so a
 * running compile (which cannot be interrupted) rarely delays a user toggle.
 * Noise-dependent programs are warmed only for the current Noise type.
 * Programs that need an external input (Video Motion, Flow) or belong to
 * other panels are compiled on demand or by hover prefetch instead.
 */
export const SHADER_WARMUP_PLAN: readonly LazyProgramKey[] = [
  'stackCore',
  'noiseStack',
  'stretch',
  'noiseDiffuseStack',
  'blur',
  'normalMap',
  'glassTile',
  'glassV2',
  'generator',
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
  /** `noiseVariant` overrides the variant of the current scene, for programs a Preset needs. */
  settle(key: LazyProgramKey, priority: LazyCompilePriority, noiseVariant?: number): Promise<LazyProgramSettleResult>;
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

/** A program (and the Noise variant) that a Preset needs, compiled ahead of its first use. */
export type ShaderWarmupTarget = { key: LazyProgramKey; noiseVariant?: number };

type PresetWarmupContext = { host: ShaderWarmupHost; scheduleIdle: IdleScheduler; signal: AbortSignal };

let presetTargets: readonly ShaderWarmupTarget[] = [];
const presetWarmed = new Set<string>();
let presetContext: PresetWarmupContext | null = null;
let presetLoopActive = false;

function targetId(target: ShaderWarmupTarget): string {
  return `${target.key}:${target.noiseVariant ?? ''}`;
}

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
  presetTargets = [];
  presetWarmed.clear();
  presetContext = null;
  presetLoopActive = false;
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
  presetContext = null;
  presetWarmed.clear();

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
    // The current scene and the Effect Stack are ready; now prepare what saved Presets need.
    presetContext = { host, scheduleIdle, signal };
    void runPresetWarmup(presetContext);
  };

  void run().catch((error) => {
    if (signal.aborted) return;
    console.warn('[WebGL shader] warmup stopped', error);
    publish({ status: 'done' });
  });

  return () => {
    controller.abort();
    if (activeHost === host) activeHost = null;
    if (presetContext?.host === host) presetContext = null;
  };
}

/**
 * Compiles, one program per idle period at warmup priority, the programs the
 * Presets need, so applying a Preset for the first time does not wait for a
 * cold compile. Runs only after the base warmup finished and never ahead of a
 * user request, which keeps its higher priority.
 */
async function runPresetWarmup(context: PresetWarmupContext): Promise<void> {
  if (presetLoopActive) return;
  presetLoopActive = true;
  try {
    for (;;) {
      const next = presetTargets.find(target => !presetWarmed.has(targetId(target)));
      if (!next) return;
      do {
        await waitForIdle(context.scheduleIdle, context.signal);
        if (context.signal.aborted) return;
      } while (context.host.isBusy());
      presetWarmed.add(targetId(next));
      const result = await context.host.settle(next.key, 'warmup', next.noiseVariant);
      if (context.signal.aborted || result === 'disposed') return;
    }
  } catch (error) {
    if (!context.signal.aborted) console.warn('[WebGL shader] Preset warmup stopped', error);
  } finally {
    presetLoopActive = false;
  }
}

/**
 * Registers the programs the Presets need. Compilation starts once the base
 * warmup is done; programs already compiled in this context are not compiled twice.
 */
export function setPresetWarmupTargets(targets: readonly ShaderWarmupTarget[]): void {
  presetTargets = targets;
  if (presetContext) void runPresetWarmup(presetContext);
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
