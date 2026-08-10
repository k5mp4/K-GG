import { afterEach, describe, expect, it } from 'vitest';
import {
  getProcessedCanvasFrame,
  publishProcessedCanvasFrame,
  subscribeProcessedCanvasFrame,
} from './processedCanvasClock';

describe('processed canvas frame clock', () => {
  afterEach(() => {
    publishProcessedCanvasFrame(0);
  });

  it('notifies subscribers only after a processed frame is published', () => {
    const received: number[] = [];
    const unsubscribe = subscribeProcessedCanvasFrame((normalizedTime) => received.push(normalizedTime));

    expect(received).toEqual([]);
    publishProcessedCanvasFrame(0.25);
    publishProcessedCanvasFrame(0.5);

    expect(received).toEqual([0.25, 0.5]);
    expect(getProcessedCanvasFrame()).toEqual({ serial: 2, normalizedTime: 0.5 });
    unsubscribe();
  });

  it('stops notifying an unsubscribed cone renderer', () => {
    const listener = () => undefined;
    const unsubscribe = subscribeProcessedCanvasFrame(listener);

    unsubscribe();
    publishProcessedCanvasFrame(0.75);

    expect(getProcessedCanvasFrame().normalizedTime).toBe(0.75);
  });
});
