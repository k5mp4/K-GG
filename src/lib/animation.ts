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

  constructor(
    duration: number,
    onFrame: OnFrameCallback,
    options: { loop?: boolean; onEnd?: () => void } = {},
  ) {
    this.duration = duration;
    this.onFrame = onFrame;
    this.loop = options.loop ?? true;
    this.onEnd = options.onEnd;
  }

  start(): void {
    this.accumulatedMs = 0;
    this.startTime = performance.now();
    this.pausedAt = null;
    this.tick();
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
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pausedAt = performance.now();
    // 停止時点までの累積時間を保存
    this.accumulatedMs += this.pausedAt - (this.startTime ?? this.pausedAt);
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

  /** 現在の再生位置（秒）。再生中は経過時間を含み、ポーズ中は停止時点の値を返す */
  get currentLoopTime(): number {
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

  /** 現在の正規化再生位置（0.0〜1.0）。再生中も正確な値を返す */
  get currentNormalizedTime(): number {
    return this.currentLoopTime / (this.duration || 1);
  }

  /**
   * 指定した正規化位置（0.0〜1.0）にシークする
   * 再生中の場合はその位置から再生を継続し、ポーズ中の場合は位置だけ更新する
   */
  seekTo(fraction: number): void {
    const clampedFraction = Math.max(0, Math.min(1, fraction));
    this.accumulatedMs = clampedFraction * this.duration * 1000;
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
    const loopTime = nt * this.duration;
    this.onFrame(loopTime, nt);
  }

  private tick = (): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const now = performance.now();
    const elapsed = (this.accumulatedMs + (now - (this.startTime ?? now))) / 1000;
    if (!this.loop && elapsed >= this.duration) {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.accumulatedMs = this.duration * 1000;
      this.startTime = null;
      this.pausedAt = now;
      this.onFrame(this.duration, 1);
      this.onEnd?.();
      return;
    }
    const loopTime = elapsed % this.duration;
    const normalizedTime = loopTime / this.duration; // 0.0–1.0

    this.onFrame(loopTime, normalizedTime);
  };
}
