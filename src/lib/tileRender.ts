/**
 * 高解像度書き出し用のタイルレンダリング。
 *
 * ブラウザ/ドライバが drawingBuffer サイズをクランプしてしまう環境では、
 * canvas.width を最終出力サイズに設定すると一部が描画されず黒になる。
 * このため、書き出し時のみ canvas を「タイルサイズ」に縮め、
 * シェーダーには u_tileOffset でグローバル座標を伝えてタイル単位で描画し、
 * 結果を別の 2D canvas に貼り合わせて最終高解像度画像を得る。
 */

import { renderBridge } from './renderBridge';

const DEFAULT_TILE_SIZE = 4096;
const TILE_SIZE_FLOOR = 1024;

/** 安全なタイルサイズを WebGL 制限から決定する */
export function pickTileSize(canvas: HTMLCanvasElement, requested = DEFAULT_TILE_SIZE): number {
  const gl = canvas.getContext('webgl2');
  if (!gl) return requested;
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
  const maxVp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  // 余裕を持たせて 0.5x（drawingBuffer の実用上限が公称値より小さいケースに対応）
  const cap = Math.floor(Math.min(maxTex, maxRb, maxVp[0], maxVp[1]) * 0.5);
  return Math.max(TILE_SIZE_FLOOR, Math.min(requested, cap));
}

/** タイル分割が必要か（要求サイズ > drawingBuffer 限界）を判定 */
export function needsTiledRender(canvas: HTMLCanvasElement, fullW: number, fullH: number): boolean {
  const gl = canvas.getContext('webgl2');
  if (!gl) return false;
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
  const maxVp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  const limit = Math.min(maxTex, maxRb, maxVp[0], maxVp[1]);
  const tileSize = pickTileSize(canvas);
  const drawingBufferClamped =
    canvas.width === fullW &&
    canvas.height === fullH &&
    (gl.drawingBufferWidth !== fullW || gl.drawingBufferHeight !== fullH);

  return fullW > limit || fullH > limit || fullW > tileSize || fullH > tileSize || drawingBufferClamped;
}

export type TiledRenderOptions = {
  /** WebGL の表示用キャンバス（書き出し中、一時的にタイルサイズへリサイズされる） */
  canvas: HTMLCanvasElement;
  /** 最終出力幅（px） */
  fullWidth: number;
  /** 最終出力高さ（px） */
  fullHeight: number;
  /** 描画する time 値（静止画は 0、動画はフレームごとの t） */
  time?: number;
  /** 正規化時間（キーフレーム補間用） */
  normalizedTime?: number;
  /** タイル一辺サイズ（未指定なら自動） */
  tileSize?: number;
  /** 1 タイル描画ごとに呼ばれる進捗コールバック（0..1） */
  onProgress?: (p: number) => void;
  /** タイル描画後に GPU→CPU 転送を待つ rAF 数（既定 1） */
  syncFrames?: number;
  /** キャンセル用シグナル */
  signal?: AbortSignal;
};

/**
 * タイル分割で描画した結果を 2D canvas に合成して返す。
 * 呼び出し側は `out.toBlob('image/png')` 等で書き出す。
 */
export async function renderTiledToCanvas2D(
  opts: TiledRenderOptions,
): Promise<HTMLCanvasElement> {
  const { canvas, fullWidth, fullHeight, time = 0, normalizedTime, onProgress, signal } = opts;
  const tileSize = opts.tileSize ?? pickTileSize(canvas);
  const syncFrames = opts.syncFrames ?? 1;

  const out = document.createElement('canvas');
  out.width = fullWidth;
  out.height = fullHeight;
  const out2d = out.getContext('2d');
  if (!out2d) throw new Error('Failed to create 2D context for tile compositor');

  const cols = Math.ceil(fullWidth / tileSize);
  const rows = Math.ceil(fullHeight / tileSize);
  const totalTiles = cols * rows;

  const origW = canvas.width;
  const origH = canvas.height;

  // アニメーションを停止して描画タイミングを制御
  renderBridge.stopAnimation();

  console.log(
    `[tileRender] start ${fullWidth}×${fullHeight} → ${cols}×${rows} tiles (${tileSize}px)`,
  );

  let tileIndex = 0;
  try {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (signal?.aborted) throw new DOMException('Tile render cancelled', 'AbortError');

        // 2D-canvas（top-down）座標でのタイル位置
        const dx = col * tileSize;
        const dy = row * tileSize;
        const tw = Math.min(tileSize, fullWidth - dx);
        const th = Math.min(tileSize, fullHeight - dy);

        // canvas を タイルサイズに合わせる（drawingBuffer も同サイズに）
        if (canvas.width !== tw) canvas.width = tw;
        if (canvas.height !== th) canvas.height = th;

        // u_tileOffset は gl_FragCoord（bottom-up）空間で指定する。
        // 2D-canvas 上の (dx, dy, tw, th) は WebGL 上では Y 反転して
        // (dx, fullHeight - dy - th, tw, th) に対応する。
        const offsetX = dx;
        const offsetY = fullHeight - dy - th;

        renderBridge.renderAtTime(time, normalizedTime, {
          viewport: [tw, th],
          offset: [offsetX, offsetY],
        });

        // GPU→CPU 同期。drawImage は内部的に同期するが、念のため rAF で待機。
        for (let i = 0; i < syncFrames; i++) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }

        // 2D canvas へコピー（drawImage は WebGL canvas の bottom-up を自動で正立に変換）
        out2d.drawImage(canvas, dx, dy, tw, th);

        tileIndex++;
        onProgress?.(tileIndex / totalTiles);
      }
    }
  } finally {
    // canvas のサイズを復元（プレビュー側の整合性のため）。
    // drawingBuffer がクリアされるので、プレビューを 1 回再描画して表示を戻す。
    canvas.width = origW;
    canvas.height = origH;
    try {
      renderBridge.renderAtTime(time, normalizedTime);
    } catch (e) {
      console.warn('[tileRender] preview re-render failed:', e);
    }
    renderBridge.startAnimation();
  }

  console.log(`[tileRender] done`);
  return out;
}

/** 2D canvas を PNG Blob に変換 */
export async function canvas2dToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

/** 2D canvas を JPEG Blob に変換 */
export async function canvas2dToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      quality,
    );
  });
}

/** 2D canvas を WebP Blob に変換 */
export async function canvas2dToWebpBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/webp',
      quality,
    );
  });
}
