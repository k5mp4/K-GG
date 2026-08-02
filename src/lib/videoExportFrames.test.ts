import { beforeEach, describe, expect, it } from 'vitest';
import { renderBridge } from './renderBridge';
import {
  calcExportNormalizedTime,
  calcExportRenderTime,
  renderAndCaptureExportFrame,
  withExportSession,
} from './videoExportFrames';

function createCanvas(onCapture: () => void, captureValue: () => string = () => 'png'): HTMLCanvasElement {
  return {
    width: 400,
    height: 400,
    getContext: () => null,
    toBlob: (callback: BlobCallback) => {
      setTimeout(() => {
        onCapture();
        callback(new Blob([captureValue()], { type: 'image/png' }));
      }, 0);
    },
  } as unknown as HTMLCanvasElement;
}

describe('video export frame generation', () => {
  let renderedTimes: Array<[number, number | undefined]>;
  let gpuFinished: boolean;
  let previewRenderCalls: number;
  let restoreCalls: number;
  let canvasFrameId: string;

  beforeEach(() => {
    renderedTimes = [];
    gpuFinished = false;
    previewRenderCalls = 0;
    restoreCalls = 0;
    canvasFrameId = 'preview:initial';
    renderBridge.register(
      () => {
        previewRenderCalls += 1;
        canvasFrameId = 'preview:overwrite';
      },
      () => undefined,
      () => undefined,
    );
    renderBridge.registerExportRenderer(async () => ({
      renderAtTime: (time, normalizedTime) => {
        gpuFinished = false;
        renderedTimes.push([time, normalizedTime]);
        canvasFrameId = `export:${normalizedTime}`;
      },
      finishGpu: () => { gpuFinished = true; },
      restorePreview: () => { restoreCalls += 1; },
      tilePadding: 0,
    }));
  });

  it('derives time only from frame index and easing inputs', () => {
    expect(calcExportNormalizedTime(0, 72)).toBe(0);
    expect(calcExportNormalizedTime(71, 72)).toBeCloseTo(71 / 72);
    expect(calcExportNormalizedTime(0, 1)).toBe(0);
    expect(calcExportRenderTime(0.5, 2, 3)).toBe(3);
  });

  it('finishes the exact export render before capture and blocks preview overwrite', async () => {
    const canvas = createCanvas(() => {
      expect(gpuFinished).toBe(true);
      expect(renderBridge.renderAtTime(99, 0.99)).toBe(false);
    }, () => canvasFrameId);

    const result = await withExportSession(undefined, async session => (
      renderAndCaptureExportFrame({
        session,
        canvas,
        fullWidth: 400,
        fullHeight: 400,
        frameIndex: 6,
        totalFrames: 72,
        speed: 1,
        duration: 3,
      })
    ));

    expect(result.normalizedTime).toBeCloseTo(6 / 72);
    expect(renderedTimes).toEqual([[result.renderTime, result.normalizedTime]]);
    expect(await result.blob.text()).toBe(`export:${result.normalizedTime}`);
    expect(previewRenderCalls).toBe(0);
    expect(restoreCalls).toBe(1);
  });

  it('keeps 100 repeated captures stable across event-loop yields', async () => {
    const hashes = await withExportSession(undefined, async session => {
      const values: string[] = [];
      for (let index = 0; index < 100; index++) {
        const canvas = createCanvas(
          () => { renderBridge.renderAtTime(index, 0.8); },
          () => canvasFrameId,
        );
        const result = await renderAndCaptureExportFrame({
          session,
          canvas,
          fullWidth: 400,
          fullHeight: 400,
          frameIndex: 8,
          totalFrames: 10,
          speed: 1,
          duration: 3,
        });
        values.push(await result.blob.text());
      }
      return values;
    });

    expect(new Set(hashes)).toEqual(new Set(['export:0.8']));
    expect(previewRenderCalls).toBe(0);
    expect(restoreCalls).toBe(1);
  });

  it('keeps all 72 frame identities when every fifth frame yields to preview work', async () => {
    const captured = await withExportSession(undefined, async session => {
      const values: string[] = [];
      for (let frameIndex = 0; frameIndex < 72; frameIndex++) {
        const canvas = createCanvas(
          () => { renderBridge.renderAtTime(99, 0.99); },
          () => canvasFrameId,
        );
        const result = await renderAndCaptureExportFrame({
          session,
          canvas,
          fullWidth: 400,
          fullHeight: 400,
          frameIndex,
          totalFrames: 72,
          speed: 1,
          duration: 3,
        });
        values.push(await result.blob.text());

        if (frameIndex % 5 === 0) {
          await new Promise<void>(resolve => { setTimeout(resolve, 0); });
          expect(renderBridge.renderAtTime(99, 0.99)).toBe(false);
        }
      }
      return values;
    });

    expect(captured).toEqual(Array.from(
      { length: 72 },
      (_, frameIndex) => `export:${frameIndex / 72}`,
    ));
    expect(previewRenderCalls).toBe(0);
    expect(restoreCalls).toBe(1);
  });

  it('restores the preview when cancellation interrupts a session', async () => {
    const controller = new AbortController();
    const canvas = createCanvas(() => controller.abort());

    await expect(withExportSession(controller.signal, async session => (
      renderAndCaptureExportFrame({
        session,
        canvas,
        fullWidth: 400,
        fullHeight: 400,
        frameIndex: 0,
        totalFrames: 72,
        speed: 1,
        duration: 3,
        signal: controller.signal,
      })
    ))).rejects.toMatchObject({ name: 'AbortError' });

    expect(restoreCalls).toBe(1);
    expect(renderBridge.isExportSessionActive()).toBe(false);
  });
});
