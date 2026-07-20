import type { EffectPipelineConfig, PostprocessConfig } from '../types/distortion';
import { getActivePostprocessStackLayers } from './postprocessStack';
import { isEffectStackLayerEnabled } from './effectPipeline';

/**
 * Postprocessが共有時間トラックによる描画更新を必要とするか判定する。
 *
 * この判定は、自動トラックの生成、再生ループ、シーン評価で共有する。
 * 新しい時間依存エフェクトを追加する場合は、この関数とテーブルテストを更新する。
 */
export function isPostprocessTimeAnimationActive(
  postprocess: PostprocessConfig,
  effectPipeline?: EffectPipelineConfig | null,
): boolean {
  if (effectPipeline?.version === 'stack-v2') {
    if (effectPipeline.particlesEnabled || effectPipeline.prismEnabled) return true;
    return (isEffectStackLayerEnabled(effectPipeline, 'glass')
      || isEffectStackLayerEnabled(effectPipeline, 'glassV2'))
      && Number.isFinite(postprocess.glassMotion)
      && postprocess.glassMotion > 0;
  }

  if (!postprocess.enabled) return false;
  if (postprocess.effectMode === 'particles') return true;

  for (const layer of getActivePostprocessStackLayers(postprocess)) {
    if (layer.kind === 'prism') return true;
    if (layer.kind === 'glass' || layer.kind === 'glassV2') return postprocess.glassMotion > 0;
  }
  return false;
}
