type RequestFrame = (callback: FrameRequestCallback) => number;
type CancelFrame = (handle: number) => void;

/**
 * 同一フレーム内の描画要求を最新の1件へ集約する。
 * 重いWebGLパスへPointerイベント頻度のまま描画を投入しないために使う。
 */
export class LatestFrameScheduler {
  private frameHandle: number | null = null;
  private latestCallback: (() => void) | null = null;
  private readonly requestFrame: RequestFrame;
  private readonly cancelFrame: CancelFrame;

  constructor(
    requestFrame: RequestFrame = (callback) => window.requestAnimationFrame(callback),
    cancelFrame: CancelFrame = (handle) => window.cancelAnimationFrame(handle),
  ) {
    this.requestFrame = requestFrame;
    this.cancelFrame = cancelFrame;
  }

  schedule(callback: () => void): void {
    this.latestCallback = callback;
    if (this.frameHandle !== null) return;

    this.frameHandle = this.requestFrame(() => {
      this.frameHandle = null;
      const run = this.latestCallback;
      this.latestCallback = null;
      run?.();
    });
  }

  cancel(): void {
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.latestCallback = null;
  }
}
