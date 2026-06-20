/**
 * 関数 fn をラップして、最後の呼び出しから ms ミリ秒経過後に実行する。
 * 返された関数を呼び出すと直前のタイマーがキャンセルされる。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timer !== null) { clearTimeout(timer); timer = null; }
  };

  return debounced;
}
