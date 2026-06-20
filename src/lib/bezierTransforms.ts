import type { BezierAnchor } from '../types/distortion';

/** 3次ベジェ曲線上の点を計算 */
export function cubicBezierPt(
  p0: [number, number], p1: [number, number],
  p2: [number, number], p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0],
    mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

/** 2点間の線形補間 */
export function lerp2(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** ベジェ曲線を t の位置で分割し、両端のコントロールポイントと分割点を返す */
export function splitBezier(
  p0: [number, number], p1: [number, number],
  p2: [number, number], p3: [number, number],
  t: number,
) {
  const p01 = lerp2(p0, p1, t);
  const p12 = lerp2(p1, p2, t);
  const p23 = lerp2(p2, p3, t);
  const p012 = lerp2(p01, p12, t);
  const p123 = lerp2(p12, p23, t);
  const p0123 = lerp2(p012, p123, t);
  return { leftCp2: p01, mid: p0123, midCp1: p012, midCp2: p123, rightCp1: p23 };
}

/** 選択アンカーの重心を計算 */
export function calcCentroid(anchors: BezierAnchor[], indices: Set<number>): [number, number] {
  let sx = 0, sy = 0, n = 0;
  for (const i of indices) {
    sx += anchors[i].x;
    sy += anchors[i].y;
    n++;
  }
  return n > 0 ? [sx / n, sy / n] : [0.5, 0.5];
}

/** 指定角度（ラジアン）だけ回転した新しいアンカー配列を返す（ピクセル空間で回転し真円軌跡を保証） */
export function applyRotate(
  snapshot: BezierAnchor[],
  indices: Set<number>,
  center: [number, number],
  angle: number,
  w: number,
  h: number,
  targetCp: 'cp1' | 'cp2' | null = null,
): BezierAnchor[] {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rot = (px: number, py: number): [number, number] => {
    const dx = (px - center[0]) * w;
    const dy = (py - center[1]) * h;
    return [center[0] + (dx * cos - dy * sin) / w, center[1] + (dx * sin + dy * cos) / h];
  };
  return snapshot.map((a, i): BezierAnchor => {
    if (!indices.has(i)) return a;
    if (targetCp === 'cp1') return { ...a, cp1: rot(a.cp1[0], a.cp1[1]) };
    if (targetCp === 'cp2') return { ...a, cp2: rot(a.cp2[0], a.cp2[1]) };
    return { x: rot(a.x, a.y)[0], y: rot(a.x, a.y)[1], cp1: rot(a.cp1[0], a.cp1[1]), cp2: rot(a.cp2[0], a.cp2[1]) };
  });
}

/** 重心を中心に拡縮した新しいアンカー配列を返す */
export function applyScale(
  snapshot: BezierAnchor[],
  indices: Set<number>,
  center: [number, number],
  scale: number,
  targetCp: 'cp1' | 'cp2' | null = null,
): BezierAnchor[] {
  return snapshot.map((a, i): BezierAnchor => {
    if (!indices.has(i)) return a;
    const sp = (px: number, py: number): [number, number] => [
      center[0] + (px - center[0]) * scale,
      center[1] + (py - center[1]) * scale,
    ];
    if (targetCp === 'cp1') return { ...a, cp1: sp(a.cp1[0], a.cp1[1]) };
    if (targetCp === 'cp2') return { ...a, cp2: sp(a.cp2[0], a.cp2[1]) };
    return { x: sp(a.x, a.y)[0], y: sp(a.x, a.y)[1], cp1: sp(a.cp1[0], a.cp1[1]), cp2: sp(a.cp2[0], a.cp2[1]) };
  });
}

/** dx/dy だけ平行移動した新しいアンカー配列を返す */
export function applyGrab(
  snapshot: BezierAnchor[],
  indices: Set<number>,
  dx: number,
  dy: number,
  targetCp: 'cp1' | 'cp2' | null = null,
): BezierAnchor[] {
  return snapshot.map((a, i): BezierAnchor => {
    if (!indices.has(i)) return a;
    if (targetCp === 'cp1') return { ...a, cp1: [a.cp1[0] + dx, a.cp1[1] + dy] };
    if (targetCp === 'cp2') return { ...a, cp2: [a.cp2[0] + dx, a.cp2[1] + dy] };
    return { x: a.x + dx, y: a.y + dy, cp1: [a.cp1[0] + dx, a.cp1[1] + dy], cp2: [a.cp2[0] + dx, a.cp2[1] + dy] };
  });
}
