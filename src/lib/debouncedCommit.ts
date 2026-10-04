/**
 * 連続する入力のうち最後の値だけを、入力が止まってから反映する。
 * 反映のたびにアプリ全体が再描画される値を、ドラッグ中に流し込まないために使う。
 */
export type DebouncedCommit<T> = {
  /** 値を保留し、delayMs後の反映を予約し直す。 */
  schedule: (value: T) => void;
  /** 保留中の値があれば、待たずに反映する。 */
  flush: () => void;
  /** 保留中の値を捨てる。 */
  cancel: () => void;
  hasPending: () => boolean;
};

export function createDebouncedCommit<T>(delayMs: number, commit: (value: T) => void): DebouncedCommit<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { value: T } | null = null;

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    pending = null;
  };

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    const next = pending;
    pending = null;
    if (next) commit(next.value);
  };

  return {
    schedule: value => {
      pending = { value };
      clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    flush,
    cancel,
    hasPending: () => pending !== null,
  };
}
