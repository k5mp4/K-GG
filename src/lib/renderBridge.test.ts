import { beforeEach, describe, expect, it } from 'vitest';
import { renderBridge } from './renderBridge';

describe('renderBridge export suspension', () => {
  let startCalls = 0;
  let pauseCalls = 0;
  let resumeCalls = 0;

  beforeEach(() => {
    startCalls = 0;
    pauseCalls = 0;
    resumeCalls = 0;
    renderBridge.register(() => undefined, () => undefined, () => { startCalls += 1; });
    renderBridge.registerPause(
      () => undefined,
      () => false,
      () => 0,
      undefined,
      undefined,
      () => {
        pauseCalls += 1;
        return true;
      },
      () => {
        resumeCalls += 1;
      },
    );
    renderBridge.resumeAnimation(false);
  });

  it('blocks animation starts while an export is suspended', () => {
    expect(renderBridge.suspendAnimation()).toBe(true);
    expect(renderBridge.isAnimationSuspended()).toBe(true);
    renderBridge.startAnimation();

    expect(pauseCalls).toBe(1);
    expect(startCalls).toBe(0);
  });

  it('resumes only when the preview was playing before export', () => {
    const wasPlaying = renderBridge.suspendAnimation();
    renderBridge.resumeAnimation(wasPlaying);

    expect(resumeCalls).toBe(1);
    expect(renderBridge.isAnimationSuspended()).toBe(false);
  });
});
