/**
 * GradientCanvas のレンダリング関数をエクスポート処理から呼び出すためのシングルトン。
 * エクスポート関数はここ経由で任意の time 値でフレームを描画し、アニメーションを停止/再開できる。
 */

import type { TileRenderOptions } from './webgl';

type RenderAtTimeFn = (time: number, normalizedTime?: number, tile?: TileRenderOptions) => void;
type VoidFn = () => void;
type BoolFn = () => boolean;
type NumberFn = () => number;
type TilePaddingFn = () => number;
type PauseAnimationFn = () => boolean;
type ResumeAnimationFn = () => void;

let _renderAtTime: RenderAtTimeFn | null = null;
let _stopAnim: VoidFn | null = null;
let _startAnim: VoidFn | null = null;
let _togglePause: VoidFn | null = null;
let _isPaused: BoolFn | null = null;
let _getCurrentTime: NumberFn | null = null;
let _getCurrentNormalizedTime: NumberFn | null = null;
let _seekTo: ((normalizedTime: number) => void) | null = null;
let _getTilePadding: TilePaddingFn | null = null;
let _pauseAnimation: PauseAnimationFn | null = null;
let _resumeAnimation: ResumeAnimationFn | null = null;
let _animationSuspended = false;

export const renderBridge = {
  register(
    renderAtTime: RenderAtTimeFn,
    stopAnim: VoidFn,
    startAnim: VoidFn,
    getTilePadding?: TilePaddingFn,
  ): void {
    _renderAtTime = renderAtTime;
    _stopAnim = stopAnim;
    _startAnim = startAnim;
    _getTilePadding = getTilePadding ?? null;
  },
  registerPause(
    togglePause: VoidFn,
    isPaused: BoolFn,
    getCurrentTime: NumberFn,
    seekTo?: (normalizedTime: number) => void,
    getCurrentNormalizedTime?: NumberFn,
    pauseAnimation?: PauseAnimationFn,
    resumeAnimation?: ResumeAnimationFn,
  ): void {
    _togglePause = togglePause;
    _isPaused = isPaused;
    _getCurrentTime = getCurrentTime;
    _getCurrentNormalizedTime = getCurrentNormalizedTime ?? null;
    _seekTo = seekTo ?? null;
    _pauseAnimation = pauseAnimation ?? null;
    _resumeAnimation = resumeAnimation ?? null;
  },
  renderAtTime(t: number, nt?: number, tile?: TileRenderOptions): void {
    _renderAtTime?.(t, nt, tile);
  },
  stopAnimation(): void {
    _stopAnim?.();
  },
  startAnimation(): void {
    if (_animationSuspended) return;
    _startAnim?.();
  },
  /** Export中のプレビュー再生を止め、開始前に再生中だったかを返す。 */
  suspendAnimation(): boolean {
    if (_animationSuspended) return false;
    _animationSuspended = true;
    return _pauseAnimation?.() ?? false;
  },
  /** Export終了後に、開始前に再生中だった場合だけ再開する。 */
  resumeAnimation(wasPlaying: boolean): void {
    _animationSuspended = false;
    if (wasPlaying) _resumeAnimation?.();
  },
  isAnimationSuspended(): boolean {
    return _animationSuspended;
  },
  /** アニメーションが再生中のときだけ一時停止/再開トグルを行う。未登録時は何もしない */
  togglePause(): void {
    _togglePause?.();
  },
  isPaused(): boolean {
    return _isPaused?.() ?? false;
  },
  /** 現在の再生位置（秒）を返す。ポーズ中でも停止時点の値を返す */
  getCurrentTime(): number {
    return _getCurrentTime?.() ?? 0;
  },
  getCurrentNormalizedTime(): number {
    return _getCurrentNormalizedTime?.() ?? 0;
  },
  getTilePadding(): number {
    return Math.max(0, Math.floor(_getTilePadding?.() ?? 0));
  },
  seekTo(normalizedTime: number): void {
    _seekTo?.(Math.max(0, Math.min(1, normalizedTime)));
  },
};
