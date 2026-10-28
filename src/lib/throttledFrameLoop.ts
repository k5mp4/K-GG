export type FrameScheduler = {
  request: (callback: () => void) => number;
  cancel: (id: number) => void;
  now: () => number;
};

const browserFrameScheduler: FrameScheduler = {
  request: callback => requestAnimationFrame(callback),
  cancel: id => cancelAnimationFrame(id),
  now: () => performance.now(),
};

/**
 * requestAnimationFrameに合わせてcallbackを呼び、処理できた回の間隔を`intervalMs`以上に保つ。
 * callbackが`false`を返したフレーム（入力が未準備など）は間隔の起点にせず、次のフレームで再試行する。
 * 戻り値で停止する。
 */
export function startThrottledFrameLoop(
  callback: () => boolean,
  intervalMs: number,
  scheduler: FrameScheduler = browserFrameScheduler,
): () => void {
  let lastRunAt = Number.NEGATIVE_INFINITY;
  let frameId = 0;
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const now = scheduler.now();
    if (now - lastRunAt >= intervalMs && callback()) lastRunAt = now;
    if (!stopped) frameId = scheduler.request(tick);
  };
  frameId = scheduler.request(tick);
  return () => {
    stopped = true;
    scheduler.cancel(frameId);
  };
}
