import type { Keyframe } from '../types/keyframe';
import { evaluateCubicBezier, evalCubic, solveBezierU } from './easingBezier';

/**
 * 指定した正規化時刻（0-1）における補間値を計算する
 */
export function interpolateKeyframes(time: number, keyframes: Keyframe<number>[]): number {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  let leftIdx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time < sorted[i + 1].time) {
      leftIdx = i;
      break;
    }
  }

  const kf0 = sorted[leftIdx];
  const kf1 = sorted[leftIdx + 1];
  const t = (time - kf0.time) / (kf1.time - kf0.time);

  switch (kf0.interpolation) {
    case 'hold':
      return kf0.value;

    case 'bezier': {
      // 2D ベジェハンドルがある場合: 値空間でのベジェ補間
      if (kf0.outHandle && kf1.inHandle) {
        const p0x = kf0.time,                          p0y = kf0.value;
        const p1x = kf0.time + kf0.outHandle[0],       p1y = kf0.value + kf0.outHandle[1];
        const p2x = kf1.time + kf1.inHandle[0],        p2y = kf1.value + kf1.inHandle[1];
        const p3x = kf1.time,                          p3y = kf1.value;
        const u = solveBezierU(time, p0x, p1x, p2x, p3x);
        return evalCubic(u, p0y, p1y, p2y, p3y);
      }
      // レガシー: CSS cubic-bezier (時間軸のみイージング)
      if (kf0.cp1 && kf0.cp2) {
        const easedT = evaluateCubicBezier(t, kf0.cp1[0], kf0.cp1[1], kf0.cp2[0], kf0.cp2[1]);
        return kf0.value + (kf1.value - kf0.value) * easedT;
      }
      return kf0.value + (kf1.value - kf0.value) * t;
    }

    case 'linear':
    default:
      return kf0.value + (kf1.value - kf0.value) * t;
  }
}
