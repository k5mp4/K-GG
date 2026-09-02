/**
 * GradientCanvas のレンダリング関数をエクスポート処理から呼び出すためのシングルトン。
 * 通常描画と export 描画を同じ WebGL canvas へ同時投入しないため、export session
 * は専用 token と render sequence を使って排他制御する。
 */

import type { TileRenderOptions } from './webgl';
import {
  beginExportDiagnostics,
  endExportDiagnostics,
  setExportRenderSequenceDiagnostics,
  type ExportPlanDiagnostics,
} from './exportDiagnostics';

type RenderAtTimeFn = (time: number, normalizedTime?: number, tile?: TileRenderOptions) => void;
type VoidFn = () => void;
type BoolFn = () => boolean;
type NumberFn = () => number;
type TilePaddingFn = () => number;
type PauseAnimationFn = () => boolean;
type ResumeAnimationFn = () => void;

export type ExportSessionToken = Readonly<{ id: number }>;

export type PreparedExportRenderer = {
  renderAtTime: RenderAtTimeFn;
  finishGpu: VoidFn;
  restorePreview: VoidFn;
  tilePadding: number;
  diagnostics?: ExportPlanDiagnostics;
};

type PrepareExportRendererFn = (signal?: AbortSignal) => Promise<PreparedExportRenderer>;

type ActiveExportSession = {
  token: ExportSessionToken;
  renderer: PreparedExportRenderer;
  lastRenderSequence: number;
};

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
let _prepareExportRenderer: PrepareExportRendererFn | null = null;
let _animationSuspended = false;
let _playOnNextLoop = false;
let _nextExportSessionId = 1;
let _nextRenderSequence = 1;
let _preparingExportSession = false;
let _activeExportSession: ActiveExportSession | null = null;

function assertActiveExportSession(token: ExportSessionToken): ActiveExportSession {
  const active = _activeExportSession;
  if (!active || active.token !== token) {
    throw new Error('Invalid or inactive export session');
  }
  return active;
}

function renderCurrentPreview(): void {
  _renderAtTime?.(_getCurrentTime?.() ?? 0, _getCurrentNormalizedTime?.() ?? 0);
}

function restorePreviewSafely(renderer: PreparedExportRenderer): void {
  try {
    renderer.restorePreview();
  } catch (error) {
    // Preview restoration is cleanup. A transient WebGL/Three.js state error
    // must not leave the export bridge active or propagate into the React
    // commit that clears the progress UI. Retry the main renderer once after
    // the export owner has already been released.
    console.error('[Export] Preview restore failed; retrying the main renderer.', error);
    try {
      renderCurrentPreview();
    } catch (fallbackError) {
      console.error('[Export] Main preview retry failed after export.', fallbackError);
    }
  }
}

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
  registerExportRenderer(prepareExportRenderer: PrepareExportRendererFn): void {
    _prepareExportRenderer = prepareExportRenderer;
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
  /** 通常描画。export の準備開始から終了までは最新要求だけを記録して拒否する。 */
  renderAtTime(t: number, nt?: number, tile?: TileRenderOptions): boolean {
    return this.renderPreview(() => _renderAtTime?.(t, nt, tile));
  },
  /** React scheduler / AnimationLoop の直接描画を export session から隔離する。 */
  renderPreview(renderPreview: VoidFn): boolean {
    if (_preparingExportSession || _activeExportSession) {
      return false;
    }
    renderPreview();
    return true;
  },
  async beginExportSession(signal?: AbortSignal): Promise<ExportSessionToken> {
    if (_preparingExportSession || _activeExportSession) {
      throw new Error('An export session is already active');
    }
    if (!_prepareExportRenderer) {
      throw new Error('Export renderer is not registered');
    }

    _preparingExportSession = true;
    try {
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      const renderer = await _prepareExportRenderer(signal);
      if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
      const token = Object.freeze({ id: _nextExportSessionId++ });
      _activeExportSession = { token, renderer, lastRenderSequence: 0 };
      beginExportDiagnostics(token.id, renderer.diagnostics);
      return token;
    } catch (error) {
      try {
        renderCurrentPreview();
      } catch (restoreError) {
        console.error('[Export] Preview restore failed after export preparation.', restoreError);
      }
      throw error;
    } finally {
      _preparingExportSession = false;
    }
  },
  renderExportFrame(
    token: ExportSessionToken,
    time: number,
    normalizedTime?: number,
    tile?: TileRenderOptions,
  ): number {
    const active = assertActiveExportSession(token);
    const sequence = _nextRenderSequence++;
    active.renderer.renderAtTime(time, normalizedTime, tile);
    active.lastRenderSequence = sequence;
    setExportRenderSequenceDiagnostics(sequence);
    return sequence;
  },
  finishExportFrame(token: ExportSessionToken, sequence: number): void {
    const active = assertActiveExportSession(token);
    if (sequence !== active.lastRenderSequence) {
      throw new Error(`Export render sequence changed before capture: expected ${sequence}, got ${active.lastRenderSequence}`);
    }
    active.renderer.finishGpu();
    if (sequence !== active.lastRenderSequence) {
      throw new Error(`Export render sequence changed during GPU completion: expected ${sequence}, got ${active.lastRenderSequence}`);
    }
  },
  assertExportFrameCurrent(token: ExportSessionToken, sequence: number): void {
    const active = assertActiveExportSession(token);
    if (sequence !== active.lastRenderSequence) {
      throw new Error(`Export render sequence changed before capture completed: expected ${sequence}, got ${active.lastRenderSequence}`);
    }
  },
  getExportTilePadding(token: ExportSessionToken): number {
    const active = assertActiveExportSession(token);
    return Math.max(0, Math.floor(active.renderer.tilePadding));
  },
  endExportSession(token: ExportSessionToken): void {
    const active = assertActiveExportSession(token);
    _activeExportSession = null;
    endExportDiagnostics();
    // Export preparation can change programs, framebuffer bindings, or the
    // drawing buffer before the first frame gets a sequence number. Always
    // restore the preview when an active session ends, including that failure
    // path, otherwise the canvas can remain blank while the UI says the export
    // has already finished.
    restorePreviewSafely(active.renderer);
  },
  isExportSessionActive(): boolean {
    return _preparingExportSession || _activeExportSession !== null;
  },
  stopAnimation(): void {
    _stopAnim?.();
  },
  startAnimation(): void {
    if (_animationSuspended || _preparingExportSession || _activeExportSession) return;
    _startAnim?.();
  },
  /** AnimationLoopがまだ生成されていない状態からの再生要求を保持する。 */
  requestPlay(): void {
    if (_animationSuspended || _preparingExportSession || _activeExportSession) return;
    _playOnNextLoop = true;
    _startAnim?.();
  },
  consumePlayRequest(): boolean {
    const requested = _playOnNextLoop;
    _playOnNextLoop = false;
    return requested;
  },
  /** Export中のプレビュー再生を止め、開始前に再生中だったかを返す。 */
  suspendAnimation(): boolean {
    if (_animationSuspended) return false;
    _animationSuspended = true;
    try {
      return _pauseAnimation?.() ?? false;
    } catch (error) {
      // AnimationLoop.pause() renders the snapped frame synchronously. If
      // that preview render fails, do not leave the bridge permanently
      // suspended and make every later export look frozen.
      _animationSuspended = false;
      throw error;
    }
  },
  /** Export終了後に、開始前に再生中だった場合だけ再開する。 */
  resumeAnimation(wasPlaying: boolean): void {
    _animationSuspended = false;
    if (!wasPlaying || _preparingExportSession || _activeExportSession) return;
    try {
      _resumeAnimation?.();
    } catch (error) {
      // AnimationLoop.resume() emits one frame synchronously. Treat a failure
      // in that cleanup frame as recoverable: cancel the loop so a broken
      // callback cannot keep throwing on every RAF, then make one best-effort
      // preview render after the export owner has been released.
      console.error('[Export] Preview resume failed after export.', error);
      try {
        _stopAnim?.();
      } catch (stopError) {
        console.error('[Export] Failed to stop the preview after resume failure.', stopError);
      }
      try {
        renderCurrentPreview();
      } catch (restoreError) {
        console.error('[Export] Preview retry failed after resume failure.', restoreError);
      }
    }
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
    if (_preparingExportSession || _activeExportSession) {
      return;
    }
    _seekTo?.(Math.max(0, Math.min(1, normalizedTime)));
  },
};
