import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEV_USER_TIMING_CLEANUP_INTERVAL_MS, installDevUserTimingCleanup } from './devUserTimingCleanup';

describe('installDevUserTimingCleanup', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears accumulated measures on each interval until disposed', () => {
    vi.useFakeTimers();
    const clearMeasures = vi.fn();
    const dispose = installDevUserTimingCleanup({ clearMeasures });

    vi.advanceTimersByTime(DEV_USER_TIMING_CLEANUP_INTERVAL_MS - 1);
    expect(clearMeasures).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(clearMeasures).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(DEV_USER_TIMING_CLEANUP_INTERVAL_MS * 2);
    expect(clearMeasures).toHaveBeenCalledTimes(3);

    dispose();
    vi.advanceTimersByTime(DEV_USER_TIMING_CLEANUP_INTERVAL_MS * 4);
    expect(clearMeasures).toHaveBeenCalledTimes(3);
  });

  it('does nothing without a User Timing buffer', () => {
    expect(() => installDevUserTimingCleanup(undefined)()).not.toThrow();
  });
});
