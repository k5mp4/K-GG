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
export function collectPresetWarmupTargets(presets: readonly Preset[]): ShaderWarmupTarget[] {
  const targets = new Map<string, ShaderWarmupTarget>();
  for (const preset of presets) {
    try {
      const state = createPresetThumbnailState({
        ...preset.state,
        animation: preset.state.animation ?? STORE_DEFAULTS.animation,
      });
      // Like the preview, show Noise through the Stack pass while the analytic Generator
      // variant (the longest compile) is pending, so applying a Preset never waits for it.
      const variants = getSceneNoiseProgramVariants(state, { analyticNoisePending: true });
      for (const key of getRequiredSceneProgramKeys(state, { analyticNoisePending: true })) {
        const noiseVariant = isNoiseVariantProgramKey(key) ? variants[key] : undefined;
        const id = `${key}:${noiseVariant ?? ''}`;
        if (!targets.has(id)) targets.set(id, { key, noiseVariant });
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
