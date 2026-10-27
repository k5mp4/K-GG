/**
 * React 19.2の開発ビルドは、DevToolsのPerformance Tracks用にコンポーネントの再レンダーごとに
 * `performance.measure()`を記録し、変更されたpropsの差分を`detail`へ複製する。
 * ブラウザのUser Timingバッファには上限がなく、React自身は消去しないため、開発中は
 * 編集・再生のたびにrenderer processのメモリが増え続ける（本番ビルドには含まれない）。
 *
 * DevToolsのPerformanceパネルは記録時にトレースとして受け取るため、記録済みのmeasureを
 * バッファから消しても表示は失われない。K-GGはUser Timingのmeasureを自前では使わない。
 */
export const DEV_USER_TIMING_CLEANUP_INTERVAL_MS = 2_000;

type MeasureBuffer = Pick<Performance, 'clearMeasures'>;

export function installDevUserTimingCleanup(
  buffer: MeasureBuffer | undefined = globalThis.performance,
  intervalMs = DEV_USER_TIMING_CLEANUP_INTERVAL_MS,
): () => void {
  if (typeof buffer?.clearMeasures !== 'function') return () => {};
  const timer = setInterval(() => buffer.clearMeasures(), intervalMs);
  return () => clearInterval(timer);
}
