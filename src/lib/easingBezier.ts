/**
 * CSS cubic-bezier と同等のイージング評価関数
 * P0=(0,0), P3=(1,1) 固定、P1=(p1x,p1y), P2=(p2x,p2y) を制御点とする
 */

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 10;

function calcBezier(t: number, a1: number, a2: number): number {
  return ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
}

function getSlope(t: number, a1: number, a2: number): number {
  return 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
}

function binarySubdivide(x: number, a: number, b: number, p1x: number, p2x: number): number {
  let currentX: number, currentT: number, i = 0;
  do {
    currentT = a + (b - a) / 2;
    currentX = calcBezier(currentT, p1x, p2x) - x;
    if (currentX > 0) b = currentT;
    else a = currentT;
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphson(x: number, t: number, p1x: number, p2x: number): number {
  for (let i = 0; i < NEWTON_ITERATIONS; i++) {
    const slope = getSlope(t, p1x, p2x);
    if (slope === 0) return t;
    t -= (calcBezier(t, p1x, p2x) - x) / slope;
  }
  return t;
}

/**
 * CSS cubic-bezier(p1x, p1y, p2x, p2y) を評価する
 * @param x - 入力値 0.0〜1.0
 * @returns 出力値 0.0〜1.0
 */
export function evaluateCubicBezier(x: number, p1x: number, p1y: number, p2x: number, p2y: number): number {
  // linear の高速パス
  if (p1x === p1y && p2x === p2y) return x;
  if (x === 0) return 0;
  if (x === 1) return 1;

  // x に対応する t を求める
  let t = x;
  const initialSlope = getSlope(t, p1x, p2x);
  if (initialSlope >= NEWTON_MIN_SLOPE) {
    t = newtonRaphson(x, t, p1x, p2x);
  } else if (initialSlope === 0) {
    t = x;
  } else {
    t = binarySubdivide(x, 0, 1, p1x, p2x);
  }

  return calcBezier(t, p1y, p2y);
}

// ─────────── 2D ベジェ補間ユーティリティ ───────────

/** 三次ベジェ曲線の1成分を u (0-1) で評価する */
export function evalCubic(u: number, p0: number, p1: number, p2: number, p3: number): number {
  const t1 = 1 - u;
  return t1*t1*t1*p0 + 3*t1*t1*u*p1 + 3*t1*u*u*p2 + u*u*u*p3;
}

/** 三次ベジェ X 成分の微分 */
/**
 * 4点 P0, P1, P2, P3 で定義される三次ベジェ曲線をパラメータ u (0-1) で2つに分割する
 * 返り値: [[p0, p1, p2, p3], [q0, q1, q2, q3]] (各点は [x, y])
 */
export function splitBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  u: number
): [[number, number][], [number, number][]] {
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];

  const q1 = lerp(p0, p1, u);
  const q2 = lerp(p1, p2, u);
  const q3 = lerp(p2, p3, u);

  const r1 = lerp(q1, q2, u);
  const r2 = lerp(q2, q3, u);

  const s1 = lerp(r1, r2, u);

  return [
    [p0, q1, r1, s1], // 前半
    [s1, r2, q3, p3]  // 後半
  ];
}

/**
 * 2D 三次ベジェ: B_x(u) = targetX となる u を Newton-Raphson で求める
 * x0, x1, x2, x3 は制御点の X 座標
 */
export function solveBezierU(targetX: number, x0: number, x1: number, x2: number, x3: number): number {
  if (targetX <= x0) return 0;
  if (targetX >= x3) return 1;
  // 初期推定: 線形補間
  let u = (x3 - x0 < 1e-10) ? 0.5 : (targetX - x0) / (x3 - x0);
  for (let i = 0; i < 16; i++) {
    const bx = evalCubic(u, x0, x1, x2, x3) - targetX;
    if (Math.abs(bx) < 1e-9) break;
    const dbx = 3*(1-u)*(1-u)*(x1-x0) + 6*(1-u)*u*(x2-x1) + 3*u*u*(x3-x2); // dCubicX inline
    if (Math.abs(dbx) < 1e-10) break;
    u = Math.max(0, Math.min(1, u - bx / dbx));
  }
  return u;
}

/** イージングプリセット定義 */
export type EasingPreset = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export const EASING_PRESETS: Record<EasingPreset, { p1: [number, number]; p2: [number, number] }> = {
  'linear':      { p1: [0.0, 0.0], p2: [1.0, 1.0] },
  'ease-in':     { p1: [0.42, 0.0], p2: [1.0, 1.0] },
  'ease-out':    { p1: [0.0, 0.0], p2: [0.58, 1.0] },
  'ease-in-out': { p1: [0.42, 0.0], p2: [0.58, 1.0] },
};
