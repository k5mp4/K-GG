import type { EffectStackKind } from '../types/distortion';
import type { LatestState } from '../types/latestState';
import { updateEffectStackLayer } from './effectPipeline';
import { renderBridge } from './renderBridge';
import { getRequiredSceneProgramKeys, getSceneNoiseProgramVariants } from './sceneRenderPlan';
import type { ShaderWarmupHost } from './shaderWarmup';
import {
  canWarmLazyProgramsInBackground,
  requestLazyProgramCompile,
  settleLazyProgram,
  type WebGLContext,
} from './webgl';
import { isNoiseVariantProgramKey, type LazyProgramKey } from './webglShaderSources';

/** Binds warmup to the preview WebGL context and its latest scene snapshot. */
export function createPreviewShaderWarmupHost(
  ctx: WebGLContext,
  getLatestState: () => LatestState | null,
): ShaderWarmupHost {
  // Noise-dependent programs are prepared for the current Noise type. The
  // Generator resolves to its analytic Noise variant only when the scene
  // folds Noise into it, and to the ready bootstrap program otherwise.
  const noiseVariantFor = (key: LazyProgramKey): number | undefined => {
    if (!isNoiseVariantProgramKey(key)) return undefined;
    const latest = getLatestState();
    return latest ? getSceneNoiseProgramVariants(latest)[key] : undefined;
  };
  return {
    settle: (key, priority) => settleLazyProgram(ctx, key, priority, noiseVariantFor(key)),
    request: (key, priority) => {
      requestLazyProgramCompile(ctx, key, priority, noiseVariantFor(key));
    },
    canWarmInBackground: () => canWarmLazyProgramsInBackground(ctx),
    isBusy: () => renderBridge.isExportSessionActive(),
    // The preview shows Noise through its stack pass while the analytic
    // Generator variant compiles, so startup and prefetch wait only for that
    // faster set. The Generator variant is prepared by background warmup.
    getRequiredKeys: () => {
      const latest = getLatestState();
      return latest ? getRequiredSceneProgramKeys(latest, { analyticNoisePending: true }) : null;
    },
    getRequiredKeysWithLayer: (kind: EffectStackKind) => {
      const latest = getLatestState();
      if (!latest || latest.effectPipeline.version !== 'stack-v2') return [];
      return getRequiredSceneProgramKeys({
        ...latest,
        effectPipeline: {
          ...latest.effectPipeline,
          effectStack: updateEffectStackLayer(latest.effectPipeline.effectStack, kind, { enabled: true }),
        },
      }, { analyticNoisePending: true });
    },
  };
}
