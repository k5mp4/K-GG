import type { BezierPath } from '../types/distortion';
import { BEZIER_SAMPLES } from './constants';

function cubicBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0],
    mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

function cubicBezierTangent(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    3 * mt ** 2 * (p1[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t ** 2 * (p3[0] - p2[0]),
    3 * mt ** 2 * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t ** 2 * (p3[1] - p2[1]),
  ];
}

/** 3次ベジェの2次導関数 */
function cubicBezierSecondDerivative(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  return [
    6 * (1 - t) * (p2[0] - 2 * p1[0] + p0[0]) + 6 * t * (p3[0] - 2 * p2[0] + p1[0]),
    6 * (1 - t) * (p2[1] - 2 * p1[1] + p0[1]) + 6 * t * (p3[1] - 2 * p2[1] + p1[1]),
  ];
}

/**
 * 曲率 κ = |P' × P''| / |P'|³
 * 戻り値は 0 以上（κ が大きいほど急カーブ）
 */
function cubicBezierCurvature(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): number {
  const [dx, dy] = cubicBezierTangent(p0, p1, p2, p3, t);
  const [ddx, ddy] = cubicBezierSecondDerivative(p0, p1, p2, p3, t);
  const cross = Math.abs(dx * ddy - dy * ddx);
  const speed = Math.hypot(dx, dy);
  if (speed < 1e-8) return 0;
  return cross / (speed ** 3);
}

const SAMPLES = BEZIER_SAMPLES;

/**
 * 分離可能ガウシアンブラーを Float32Array に適用する。
 * ボロノイ境界の角ばりを平滑化するために SDF 正規化後に使用する。
 */
function gaussianBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  // 1D Gaussian kernel を生成
  const sigma = radius / 2.5;
  const kernel: number[] = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(w);
    sum += w;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;

  const tmp = new Float32Array(width * height);
  const dst = new Float32Array(width * height);

  // 水平方向パス
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.max(0, Math.min(width - 1, x + k));
        v += src[y * width + sx] * kernel[k + radius];
      }
      tmp[y * width + x] = v;
    }
  }
  // 垂直方向パス
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.max(0, Math.min(height - 1, y + k));
        v += tmp[sy * width + x] * kernel[k + radius];
      }
      dst[y * width + x] = v;
    }
  }
  return dst;
}

/**
 * 複数のパスからベジェパスの SDF + 曲率テクスチャを生成する。
 * 戻り値は interleaved Float32Array: [dist0, curv0, dist1, curv1, ...]
 * - dist: 最近接パスへの符号付き距離を正規化した値 (0.0–1.0, 曲線上=0.5)
 * - curv: 最近接点の曲率を正規化した値 (0.0–1.0)
 */
export function generateDistanceMap(
  paths: BezierPath[],
  width: number,
  height: number,
  canvasWidth: number = width,
  canvasHeight: number = height,
): Float32Array {
  // pixel 数分の dist/curv を格納 (interleaved: dist, curv)
  const dist = new Float32Array(width * height);
  const curv = new Float32Array(width * height);

  if (paths.length === 0 || paths.every(p => p.anchors.length < 2)) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        dist[y * width + x] = y / (height - 1);
        curv[y * width + x] = 0;
      }
    }
    // interleave して返す
    return interleave(dist, curv, width * height);
  }

  // セグメント構築
  const segments: [[number, number], [number, number], [number, number], [number, number]][] = [];
  for (const path of paths) {
    const anchors = path.anchors;
    if (anchors.length < 2) continue;
    const numSegments = path.closed ? anchors.length : anchors.length - 1;
    for (let i = 0; i < numSegments; i++) {
      const a = anchors[i];
      const b = anchors[(i + 1) % anchors.length];
      segments.push([
        [a.x, a.y],
        [a.cp2[0], a.cp2[1]],
        [b.cp1[0], b.cp1[1]],
        [b.x, b.y],
      ]);
    }
  }

  // 曲率の最大値を事前計算（正規化用）
  let maxCurvature = 0;
  for (const [p0, p1, p2, p3] of segments) {
    for (let i = 0; i <= SAMPLES; i++) {
      const k = cubicBezierCurvature(p0, p1, p2, p3, i / SAMPLES);
      if (k > maxCurvature) maxCurvature = k;
    }
  }
  if (maxCurvature < 1e-8) maxCurvature = 1;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const nx = px / (width - 1);
      const ny = py / (height - 1);

      let minDist = Infinity;
      let closestX = 0;
      let closestY = 0;
      let closestTangentX = 1;
      let closestTangentY = 0;
      let closestCurvature = 0;

      for (const [p0, p1, p2, p3] of segments) {
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          const [bx, by] = cubicBezier(p0, p1, p2, p3, t);
          const d = Math.hypot((nx - bx) * canvasWidth, (ny - by) * canvasHeight);
          if (d < minDist) {
            minDist = d;
            closestX = bx;
            closestY = by;
            const [tx, ty] = cubicBezierTangent(p0, p1, p2, p3, t);
            closestTangentX = tx;
            closestTangentY = ty;
            closestCurvature = cubicBezierCurvature(p0, p1, p2, p3, t);
          }
        }
      }

      // 接線とピクセルへのベクトルの外積で符号を決定
      const toX = nx - closestX;
      const toY = ny - closestY;
      const cross = closestTangentX * toY - closestTangentY * toX;
      const sign = cross >= 0 ? -1 : 1;

      dist[py * width + px] = sign * minDist;
      curv[py * width + px] = closestCurvature / maxCurvature; // 0–1 に正規化
    }
  }

  // SDF にガウシアンブラーを適用して正規化
  const blurred = gaussianBlur(dist, width, height, 4);
  let maxVal = 0;
  for (let i = 0; i < blurred.length; i++) {
    const abs = Math.abs(blurred[i]);
    if (abs > maxVal) maxVal = abs;
  }
  if (maxVal === 0) maxVal = 1;
  for (let i = 0; i < blurred.length; i++) {
    blurred[i] = blurred[i] / maxVal * 0.5 + 0.5;
  }

  // 曲率もブラーで平滑化
  const blurredCurv = gaussianBlur(curv, width, height, 4);

  return interleave(blurred, blurredCurv, width * height);
}

/** 2つの Float32Array を interleave して [a0, b0, a1, b1, ...] に結合 */
function interleave(a: Float32Array, b: Float32Array, n: number): Float32Array {
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    out[i * 2] = a[i];
    out[i * 2 + 1] = b[i];
  }
  return out;
}

/**
 * SDF + 曲率テクスチャを WebGL にアップロードする。
 * RG8 フォーマット: R = SDF, G = 曲率
 */
export function uploadDistanceMap(
  gl: WebGL2RenderingContext,
  data: Float32Array,  // interleaved [dist, curv, dist, curv, ...]
  width: number,
  height: number,
  texture: WebGLTexture,
): void {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Float32 → Uint8 (2ch: L=SDF, A=curvature)
  const uint8 = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    uint8[i] = Math.round(Math.max(0, Math.min(1, data[i])) * 255);
  }

  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RG8,
    width, height, 0,
    gl.RG, gl.UNSIGNED_BYTE, uint8,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
