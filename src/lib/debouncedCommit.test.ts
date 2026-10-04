import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebouncedCommit } from './debouncedCommit';

describe('createDebouncedCommit', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('commits only the last value once input has paused', () => {
    const commit = vi.fn();
    const debounced = createDebouncedCommit<number>(150, commit);
    debounced.schedule(1);
    vi.advanceTimersByTime(100);
    debounced.schedule(2);
    vi.advanceTimersByTime(100);
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(2);
    expect(debounced.hasPending()).toBe(false);
  });

  it('never commits while input keeps arriving faster than the delay', () => {
    const commit = vi.fn();
    const debounced = createDebouncedCommit<number>(150, commit);
    for (let i = 0; i < 20; i++) {
      debounced.schedule(i);
      vi.advanceTimersByTime(16);
    }
    expect(commit).not.toHaveBeenCalled();
    debounced.flush();
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(19);
  });

  it('flush commits immediately and does not commit again later', () => {
    const commit = vi.fn();
    const debounced = createDebouncedCommit<string>(150, commit);
    debounced.schedule('a');
    debounced.flush();
    vi.advanceTimersByTime(1000);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('flush without a pending value does nothing, and cancel drops the value', () => {
    const commit = vi.fn();
    const debounced = createDebouncedCommit<number>(150, commit);
    debounced.flush();
    debounced.schedule(1);
    debounced.cancel();
    vi.advanceTimersByTime(1000);
    debounced.flush();
    expect(commit).not.toHaveBeenCalled();
    expect(debounced.hasPending()).toBe(false);
  });

  it('commits a falsy value such as 0', () => {
    const commit = vi.fn();
    const debounced = createDebouncedCommit<number>(150, commit);
    debounced.schedule(0);
    debounced.flush();
    expect(commit).toHaveBeenCalledWith(0);
  });
});
