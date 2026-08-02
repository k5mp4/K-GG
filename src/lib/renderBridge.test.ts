import { beforeEach, describe, expect, it } from 'vitest';
import { renderBridge } from './renderBridge';

describe('renderBridge export suspension', () => {
  let startCalls = 0;
  let pauseCalls = 0;
  let resumeCalls = 0;
  let previewRenderCalls = 0;
  let exportRenderCalls = 0;
  let finishCalls = 0;
  let restoreCalls = 0;

  beforeEach(() => {
    startCalls = 0;
    pauseCalls = 0;
    resumeCalls = 0;
    previewRenderCalls = 0;
    exportRenderCalls = 0;
    finishCalls = 0;
    restoreCalls = 0;
    renderBridge.register(() => { previewRenderCalls += 1; }, () => undefined, () => { startCalls += 1; });
    renderBridge.registerExportRenderer(async () => ({
      renderAtTime: () => { exportRenderCalls += 1; },
      finishGpu: () => { finishCalls += 1; },
      restorePreview: () => { restoreCalls += 1; },
      tilePadding: 12.8,
    }));
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

  it('keeps an initial play request until the animation loop exists', () => {
    renderBridge.requestPlay();

    expect(startCalls).toBe(1);
    expect(renderBridge.consumePlayRequest()).toBe(true);
    expect(renderBridge.consumePlayRequest()).toBe(false);
  });

  it('allows only tokenized export renders while a session is active', async () => {
    const session = await renderBridge.beginExportSession();

    expect(renderBridge.renderAtTime(1, 0.5)).toBe(false);
    expect(previewRenderCalls).toBe(0);
    const sequence = renderBridge.renderExportFrame(session, 1, 0.5);
    renderBridge.finishExportFrame(session, sequence);
    renderBridge.assertExportFrameCurrent(session, sequence);

    expect(exportRenderCalls).toBe(1);
    expect(finishCalls).toBe(1);
    expect(renderBridge.getExportTilePadding(session)).toBe(12);

    renderBridge.endExportSession(session);
    expect(restoreCalls).toBe(1);
  });

  it('rejects nested sessions and stale tokens without corrupting the active session', async () => {
    const session = await renderBridge.beginExportSession();

    await expect(renderBridge.beginExportSession()).rejects.toThrow('already active');
    expect(() => renderBridge.renderExportFrame({ id: session.id }, 0, 0)).toThrow('Invalid or inactive');

    const sequence = renderBridge.renderExportFrame(session, 0, 0);
    expect(() => renderBridge.finishExportFrame(session, sequence + 1)).toThrow('sequence changed');
    renderBridge.finishExportFrame(session, sequence);
    renderBridge.endExportSession(session);
    expect(() => renderBridge.endExportSession(session)).toThrow('Invalid or inactive');
    expect(renderBridge.isExportSessionActive()).toBe(false);
  });

  it('blocks preview while program readiness is pending', async () => {
    let releasePreparation: (() => void) | undefined;
    renderBridge.registerExportRenderer(async () => {
      await new Promise<void>(resolve => { releasePreparation = resolve; });
      return {
        renderAtTime: () => { exportRenderCalls += 1; },
        finishGpu: () => { finishCalls += 1; },
        restorePreview: () => { restoreCalls += 1; },
        tilePadding: 0,
      };
    });

    const starting = renderBridge.beginExportSession();
    await Promise.resolve();
    expect(renderBridge.isExportSessionActive()).toBe(true);
    expect(renderBridge.renderAtTime(0, 0)).toBe(false);
    releasePreparation?.();
    const session = await starting;
    renderBridge.endExportSession(session);

    expect(previewRenderCalls).toBe(0);
    expect(restoreCalls).toBe(1);
  });

  it('fails before the first export frame when preparation fails', async () => {
    renderBridge.registerExportRenderer(async () => {
      throw new Error('glass compile failed');
    });

    await expect(renderBridge.beginExportSession()).rejects.toThrow('glass compile failed');
    expect(exportRenderCalls).toBe(0);
    expect(renderBridge.isExportSessionActive()).toBe(false);
    expect(previewRenderCalls).toBe(1);
  });
});
