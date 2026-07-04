import type { PostprocessConfig } from '../types/distortion';

/**
 * Postprocessが共有時間トラックによる描画更新を必要とするか判定する。
 *
 * この判定は、自動トラックの生成、再生ループ、シーン評価で共有する。
 * 新しい時間依存エフェクトを追加する場合は、この関数とテーブルテストを更新する。
 */
export function isPostprocessTimeAnimationActive(
  postprocess: PostprocessConfig,
): boolean {
  if (!postprocess.enabled) return false;

  switch (postprocess.effectMode) {
    case 'prism':
    case 'particles':
      return true;
    case 'glass':
      return postprocess.glassMotion > 0;
    default:
      return false;
  }
}
