import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAeStatusController, type AeDisplayStatus } from './aeStatusController';

describe('createAeStatusController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores a stale completion and idle timer after a newer request starts', () => {
    vi.useFakeTimers();
    const statuses: AeDisplayStatus[] = [];
    const controller = createAeStatusController(status => statuses.push(status));

    const firstRequest = controller.begin();
    controller.complete(firstRequest, 'ok');
    const secondRequest = controller.begin();

    controller.complete(firstRequest, 'error');
    vi.advanceTimersByTime(4000);

    expect(statuses).toEqual(['sending', 'ok', 'sending']);
    expect(controller.isCurrent(secondRequest)).toBe(true);

    controller.complete(secondRequest, 'jsx-failed');
    vi.advanceTimersByTime(4000);
    expect(statuses).toEqual(['sending', 'ok', 'sending', 'jsx-failed', 'idle']);
  });

  it('invalidates pending callbacks when disposed', () => {
    vi.useFakeTimers();
    const statuses: AeDisplayStatus[] = [];
    const controller = createAeStatusController(status => statuses.push(status));

    const request = controller.begin();
    controller.complete(request, 'ok');
    controller.dispose();
    vi.advanceTimersByTime(4000);

    expect(statuses).toEqual(['sending', 'ok']);
    expect(controller.isCurrent(request)).toBe(false);
  });
});
