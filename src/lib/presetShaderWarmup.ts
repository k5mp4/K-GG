import { STORE_DEFAULTS } from '../store/gradientStore';
import type { Preset } from './presetModel';
import { builtinPresetLibrary, getPresetLibrarySnapshot, subscribePresetLibrary } from './presetLibraryCache';
import { createPresetThumbnailState } from './presetThumbnail';
import { getRequiredSceneProgramKeys, getSceneNoiseProgramVariants } from './sceneRenderPlan';
import {
  defaultIdleScheduler,
  SHADER_WARMUP_PLAN,
  setPresetWarmupTargets,
  type IdleScheduler,
  type ShaderWarmupTarget,
} from './shaderWarmup';
import { isNoiseVariantProgramKey, type LazyProgramKey } from './webglShaderSources';
import type { LatestState } from '../types/latestState';

/** Programs not in the base plan sort after it, and the Generator goes last. */
function warmupRank(key: LazyProgramKey): number {
  if (key === 'generator') return 1000;
  const index = SHADER_WARMUP_PLAN.indexOf(key);
  return index >= 0 ? index : 100;
}

/**
 * Collects the programs (with Noise variants) that applying each Preset would
 * need, deduplicated and ordered so cheap, common programs compile first.
 */
export function collectSceneWarmupTargets(state: LatestState, includeAnalyticNoise = false): ShaderWarmupTarget[] {
  const targets = new Map<string, ShaderWarmupTarget>();
  for (const analyticNoisePending of includeAnalyticNoise ? [true, false] : [true]) {
    const variants = getSceneNoiseProgramVariants(state, { analyticNoisePending });
    for (const key of getRequiredSceneProgramKeys(state, { analyticNoisePending })) {
      const noiseVariant = isNoiseVariantProgramKey(key) ? variants[key] : undefined;
      const target = { key, noiseVariant };
      targets.set(`${key}:${noiseVariant ?? ''}`, target);
    }
  }
  if (includeAnalyticNoise) {
    const enabled = (kind: string) => state.effectPipeline.version === 'stack-v2'
      && state.effectPipeline.effectStack.some(layer => layer.kind === kind && layer.enabled);
    // Animated or live scalar values can leave an identity state after the cue is loaded.
    // Reserve these programs before performance rather than compiling on that later frame.
    for (const [key, needed] of [
      ['blur', state.normalMap.enabled || state.effectPipeline.prismEnabled || enabled('distortChroma')],
      ['glassV2', enabled('glass')], ['glassTile', enabled('glassTile')],
    ] as const) {
      if (needed) targets.set(`${key}:`, { key });
    }
  }
  return [...targets.values()].sort((a, b) => warmupRank(a.key) - warmupRank(b.key));
}

export function collectPresetWarmupTargets(presets: readonly Preset[], { includeAnalyticNoise = false }: { includeAnalyticNoise?: boolean } = {}): ShaderWarmupTarget[] {
  const targets = new Map<string, ShaderWarmupTarget>();
  for (const preset of presets) {
    try {
      const state = createPresetThumbnailState({
        ...preset.state,
        animation: preset.state.animation ?? STORE_DEFAULTS.animation,
      });
      for (const target of collectSceneWarmupTargets(state, includeAnalyticNoise)) {
        targets.set(`${target.key}:${target.noiseVariant ?? ''}`, target);
      }
    } catch {
      // A Preset that cannot be evaluated is compiled on demand when applied.
    }
  }
  return [...targets.values()].sort((a, b) => warmupRank(a.key) - warmupRank(b.key));
}

/**
 * Keeps the shader warmup informed about every built-in and saved Preset, so
 * Presets apply without waiting for their first shader compile. Returns a disposer.
 */
export function startPresetShaderWarmupSync(scheduleIdle: IdleScheduler = defaultIdleScheduler): () => void {
  let cancelPending: (() => void) | null = null;
  let lastLibrary: unknown = null;

  const sync = () => {
    const { library, status } = getPresetLibrarySnapshot();
    if (status !== 'ready' || library === lastLibrary) return;
    lastLibrary = library;
    cancelPending?.();
    // Evaluating many Presets is cheap but not free; keep it out of the startup path.
    cancelPending = scheduleIdle(() => {
      cancelPending = null;
      setPresetWarmupTargets(collectPresetWarmupTargets([...builtinPresetLibrary.presets, ...library.presets]));
    });
  };

  const unsubscribe = subscribePresetLibrary(sync);
  sync();
  return () => {
    unsubscribe();
    cancelPending?.();
  };
}
