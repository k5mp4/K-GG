import type { EffectStackKind } from '../types/distortion';
import type { LatestState } from '../types/latestState';
import { updateEffectStackLayer } from './effectPipeline';
import { renderBridge } from './renderBridge';
import { getRequiredSceneProgramKeys } from './sceneRenderPlan';
import type { ShaderWarmupHost } from './shaderWarmup';
import {
  canWarmLazyProgramsInBackground,
  requestLazyProgramCompile,
  settleLazyProgram,
  type WebGLContext,
} from './webgl';

/** Binds warmup to the preview WebGL context and its latest scene snapshot. */
export function createPreviewShaderWarmupHost(
  ctx: WebGLContext,
  getLatestState: () => LatestState | null,
): ShaderWarmupHost {
  return {
    settle: (key, priority) => settleLazyProgram(ctx, key, priority),
    request: (key, priority) => {
      requestLazyProgramCompile(ctx, key, priority);
    },
    canWarmInBackground: () => canWarmLazyProgramsInBackground(ctx),
    isBusy: () => renderBridge.isExportSessionActive(),
    getRequiredKeys: () => {
      const latest = getLatestState();
      return latest ? getRequiredSceneProgramKeys(latest) : null;
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
      });
    },
  };
}
