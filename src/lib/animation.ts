type OnFrameCallback = (loopTime: number, normalizedTime: number) => void;

export class AnimationLoop {
  private startTime: number | null = null;
  private pausedAt: number | null = null;   // 一時停止した時刻 (performance.now())
  private accumulatedMs = 0;                // 一時停止前までの累積経過時間 (ms)
  private rafId: number | null = null;
  private readonly duration: number;
  private readonly onFrame: OnFrameCallback;
  private readonly loop: boolean;
  private readonly onEnd?: () => void;
  private readonly totalFrames: number | null;
  private lastEmittedNormalizedTime: number | null = null;

  constructor(
    duration: number,
    onFrame: OnFrameCallback,
    options: { loop?: boolean; onEnd?: () => void; fps?: number } = {},
  ) {
    this.duration = duration;
    this.onFrame = onFrame;
    this.loop = options.loop ?? true;
    this.onEnd = options.onEnd;
    this.totalFrames = Number.isFinite(options.fps) && (options.fps ?? 0) > 0
      ? Math.max(1, Math.ceil(this.duration * (options.fps ?? 1)))
      : null;
  }

  start(options: { paused?: boolean } = {}): void {
    this.accumulatedMs = 0;
    this.startTime = performance.now();
    this.pausedAt = options.paused ? this.startTime : null;
    this.lastEmittedNormalizedTime = null;
    if (this.pausedAt !== null) {
      this.emitFrame(0, true);
    } else {
      this.tick();
    }
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pausedAt = null;
  }

  /** 現在のフレームで停止（位置を保持） */
  pause(): void {
    if (this.pausedAt !== null) return; // already paused
    const now = performance.now();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    // 生の経過時間を保存すると、次のRAFやReactの再描画が量子化後の
    // 次フレームを拾うため、停止位置が1Fずれることがある。停止時点で
    // 表示中のフレームへ先にスナップしてから、ポーズ状態を確定する。
    const elapsedMs = this.accumulatedMs + Math.max(0, now - (this.startTime ?? now));
    // クリック時刻ではなく、最後に実際に描画・表示したフレームを保持する。
    // クリックがフレーム境界の直後に入っても、インジケーターが見ていた
    // フレームから次のフレームへ飛ばないようにする。
    const snappedTime = this.lastEmittedNormalizedTime
      ?? this.quantizeNormalizedTime(this.normalizedTimeFromElapsedMs(elapsedMs));
    this.accumulatedMs = snappedTime * this.duration * 1000;
    this.pausedAt = now;
    this.lastEmittedNormalizedTime = null;
    this.emitFrame(snappedTime, true);
  }

  /** 停止した位置から再開 */
  resume(): void {
    if (this.pausedAt === null) return; // not paused
    this.startTime = performance.now();
    this.pausedAt = null;
    this.tick();
  }

  /** 現在ポーズ中かどうか */
  get isPaused(): boolean {
    return this.pausedAt !== null;
  }

  /** 現在の再生位置（秒）。FPS指定時は表示・描画フレームへ量子化する */
  get currentLoopTime(): number {
    const duration = this.duration || 1;
    return this.quantizeNormalizedTime(this.rawCurrentLoopTime / duration) * duration;
  }

  /** 現在の正規化再生位置（0.0〜1.0）。FPS指定時はフレーム境界上の値を返す */
  get currentNormalizedTime(): number {
    return this.quantizeNormalizedTime(this.rawCurrentLoopTime / (this.duration || 1));
  }

  /**
   * 指定した正規化位置（0.0〜1.0）にシークする
   * 再生中の場合はその位置から再生を継続し、ポーズ中の場合は位置だけ更新する
   */
  seekTo(fraction: number): void {
    const clampedFraction = Math.max(0, Math.min(1, fraction));
    const snappedFraction = this.quantizeNormalizedTime(clampedFraction);
    this.accumulatedMs = snappedFraction * this.duration * 1000;
    // シーク直後に一時停止されても、表示したシーク先を停止位置として
    // 扱えるようにする。次のRAFでは同じ値が重複描画されない。
    this.lastEmittedNormalizedTime = snappedFraction;
    if (this.pausedAt !== null) {
      // ポーズ中: accumulatedMs を更新し pausedAt を現在時刻にリセット
      this.pausedAt = performance.now();
    } else if (this.rafId !== null) {
      // 再生中: startTime をリセットして継続
      this.startTime = performance.now();
    }
  }

  /** ポーズ状態をトグル */
  togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /** 指定位置で強制的に1フレーム描画する（コールバックを実行するのみで内部時刻は進めない） */
  renderFrame(nt: number): void {
    this.emitFrame(nt, true);
  }

  private get rawCurrentLoopTime(): number {
    let ms = this.accumulatedMs;
    if (this.pausedAt === null && this.startTime !== null) {
      ms += performance.now() - this.startTime;
    }
    const duration = this.duration || 1;
    const seconds = ms / 1000;
    if (!this.loop) return Math.min(duration, seconds);
    const loopTime = seconds % duration;
    if (this.pausedAt !== null && seconds > 0 && Math.abs(loopTime) < 1e-6) {
      return duration;
    }
    return loopTime;
  }

  private quantizeNormalizedTime(normalizedTime: number): number {
    const normalized = Math.max(0, Math.min(1, Number.isFinite(normalizedTime) ? normalizedTime : 0));
    if (this.totalFrames === null || normalized >= 1) return normalized;
    return Math.floor(normalized * this.totalFrames) / this.totalFrames;
  }

  private emitFrame(normalizedTime: number, force = false): void {
    const quantizedTime = this.quantizeNormalizedTime(normalizedTime);
    if (!force && this.lastEmittedNormalizedTime === quantizedTime) return;
    this.lastEmittedNormalizedTime = quantizedTime;
    this.onFrame(quantizedTime * this.duration, quantizedTime);
  }

  private tick = (): void => {
    // pause() と同じタイミングですでにキューへ入っていたRAFを無効化する。
    if (this.pausedAt !== null) {
      this.rafId = null;
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
    const now = performance.now();
    const elapsed = (this.accumulatedMs + (now - (this.startTime ?? now))) / 1000;
    if (!this.loop && elapsed >= this.duration) {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      const finalNormalizedTime = this.totalFrames === null
        ? 1
        : Math.max(0, (this.totalFrames - 1) / this.totalFrames);
      this.accumulatedMs = finalNormalizedTime * this.duration * 1000;
      this.startTime = null;
      this.pausedAt = now;
      this.emitFrame(finalNormalizedTime, true);
      this.onEnd?.();
      return;
    }
    const loopTime = elapsed % this.duration;
    const normalizedTime = loopTime / this.duration; // 0.0–1.0

    this.emitFrame(normalizedTime);
  };

  private normalizedTimeFromElapsedMs(elapsedMs: number): number {
    const duration = this.duration || 1;
    const seconds = Math.max(0, elapsedMs) / 1000;
    if (!this.loop) return Math.min(1, seconds / duration);
    const loopTime = seconds % duration;
    if (seconds > 0 && Math.abs(loopTime) < 1e-6) return 1;
    return loopTime / duration;
  }
}
