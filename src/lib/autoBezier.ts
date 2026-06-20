import type { Keyframe } from '../types/keyframe';

/**
 * Catmull-Rom スプラインに基づく自動ベジェハンドルを全キーフレームに計算する。
 * 各キーフレームの inHandle / outHandle を (dt, dv) 相対オフセットとして返す。
 */
export function computeAutoHandles(keyframes: Keyframe<number>[]): Keyframe<number>[] {
  if (keyframes.length === 0) return [];
  if (keyframes.length === 1) {
    return [{ ...keyframes[0], inHandle: [0, 0], outHandle: [0, 0] }];
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const n = sorted.length;

  return sorted.map((kf, i) => {
    const prev = i > 0 ? sorted[i - 1] : null;
    const next = i < n - 1 ? sorted[i + 1] : null;

    // Catmull-Rom スロープ: 前後のキーフレーム間の傾き
    let slope = 0;
    if (prev && next) {
      const dt = next.time - prev.time;
      slope = dt > 1e-10 ? (next.value - prev.value) / dt : 0;
    } else if (next) {
      const dt = next.time - kf.time;
      slope = dt > 1e-10 ? (next.value - kf.value) / dt : 0;
    } else if (prev) {
      const dt = kf.time - prev.time;
      slope = dt > 1e-10 ? (kf.value - prev.value) / dt : 0;
    }

    // 入力ハンドル: dt <= 0 (時間軸で左方向)
    const inHandle: [number, number] = prev
      ? [-(kf.time - prev.time) / 3, -slope * (kf.time - prev.time) / 3]
      : [0, 0];

    // 出力ハンドル: dt >= 0 (時間軸で右方向)
    const outHandle: [number, number] = next
      ? [(next.time - kf.time) / 3, slope * (next.time - kf.time) / 3]
      : [0, 0];

    return { ...kf, inHandle, outHandle };
  });
}

/**
 * 1 つのキーフレームのみハンドルを再計算し、隣接キーフレームの
 * 隣接ハンドルも更新して返す（既存ハンドルの手動調整を最小限に壊す）。
 */
export function recomputeHandlesAround(
  keyframes: Keyframe<number>[],
  targetId: string,
): Keyframe<number>[] {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const idx = sorted.findIndex(k => k.id === targetId);
  if (idx < 0) return keyframes;

  // 影響するインデックス: idx-1, idx, idx+1
  const affected = new Set([idx - 1, idx, idx + 1].filter(i => i >= 0 && i < sorted.length));
  const updated = computeAutoHandles(sorted);

  return sorted.map((kf, i) =>
    affected.has(i) ? updated[i] : kf
  );
}
