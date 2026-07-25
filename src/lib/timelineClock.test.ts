import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTimelineTime,
  setTimelineTime,
  subscribeTimelineTime,
} from './timelineClock';

describe('timelineClock', () => {
  beforeEach(() => {
    setTimelineTime(0);
  });

  it('notifies subscribers when the current time changes, including zero', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTimelineTime(listener);

    setTimelineTime(0.25);
    setTimelineTime(0);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getTimelineTime(0.8)).toBe(0);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTimelineTime(listener);
    unsubscribe();

    setTimelineTime(0.5);

    expect(listener).not.toHaveBeenCalled();
  });
});
