import { renderBridge, type ExportSessionToken } from './renderBridge';
import { applyTimeRemap } from './timeRemap';
import {
  canvas2dToPngBlob,
  needsTiledRender,
  renderTiledToCanvas2D,
} from './tileRender';
import { useGradientStore, type AnimationEasing } from '../store/gradientStore';
import type { VideoExportFrameRenderer } from '../adapters/types';
import {
  beginExportFrameDiagnostics,
  recordExportCaptureDiagnostics,
} from './exportDiagnostics';

export type ExportFrameResult = {
  blob: Blob;
  normalizedTime: number;
  renderTime: number;
};

export type RenderAndCaptureExportFrameOptions = {
  session: ExportSessionToken;
  canvas: HTMLCanvasElement;
  fullWidth: number;
  fullHeight: number;
  frameIndex: number;
  totalFrames: number;
  speed: number;
  duration: number;
  easing?: AnimationEasing;
  signal?: AbortSignal;
  onTileProgress?: (progress: number) => void;
  renderFrame?: VideoExportFrameRenderer;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

export function calcExportNormalizedTime(frameIndex: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0;
  // Composition samples [0, 1). Preview loop transport must not replace the
  // keyed animation's final interval with frame zero.
  return Math.max(0, Math.min(1, frameIndex / totalFrames));
}

export function calcExportRenderTime(
  normalizedTime: number,
  speed: number,
  duration: number,
  easing?: AnimationEasing,
): number {
  const remappedTime = applyTimeRemap(normalizedTime, duration, easing);
  return remappedTime * speed * duration;
}

export async function withExportSession<T>(
  signal: AbortSignal | undefined,
  work: (session: ExportSessionToken) => Promise<T>,
): Promise<T> {
  const session = await renderBridge.beginExportSession(signal);
  try {
    return await work(session);
  } finally {
    renderBridge.endExportSession(session);
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

/**
 * Browser/Tauri が共有する原子的な1フレーム生成処理。
 * GPU完了からPNG capture完了まで同じrender sequenceを検証する。
 */
export async function renderAndCaptureExportFrame(
  options: RenderAndCaptureExportFrameOptions,
): Promise<ExportFrameResult> {
  const {
    session,
    canvas,
    fullWidth,
    fullHeight,
    frameIndex,
    totalFrames,
    speed,
    duration,
    easing,
    signal,
    onTileProgress,
    renderFrame,
  } = options;
  throwIfAborted(signal);

  const normalizedTime = calcExportNormalizedTime(frameIndex, totalFrames);
  const renderTime = calcExportRenderTime(normalizedTime, speed, duration, easing);
  beginExportFrameDiagnostics(frameIndex, normalizedTime, renderTime);
  let blob: Blob;

  if (renderFrame) {
    // The custom renderer owns the composition step. It first renders the
    // processed 2D frame and then maps that frame to the visible output
    // surface (for example the 3D cloth or cone canvas), so capture never falls back to the
    // source Canvas.
    const sequence = renderFrame({
      session,
      time: renderTime,
      normalizedTime,
    });
    throwIfAborted(signal);
    recordExportCaptureDiagnostics('begin');
    blob = await canvasToPngBlob(canvas);
    renderBridge.assertExportFrameCurrent(session, sequence);
    recordExportCaptureDiagnostics('end');
  } else if (needsTiledRender(canvas, fullWidth, fullHeight)) {
    const outputCanvas = await renderTiledToCanvas2D({
      canvas,
      fullWidth,
      fullHeight,
      time: renderTime,
      normalizedTime,
      signal,
      onProgress: onTileProgress,
      exportSession: session,
      seamless: useGradientStore.getState().seamless,
    });
    throwIfAborted(signal);
    recordExportCaptureDiagnostics('begin');
    blob = await canvas2dToPngBlob(outputCanvas);
    recordExportCaptureDiagnostics('end');
  } else {
    const sequence = renderBridge.renderExportFrame(session, renderTime, normalizedTime);
    renderBridge.finishExportFrame(session, sequence);
    throwIfAborted(signal);
    recordExportCaptureDiagnostics('begin');
    blob = await canvasToPngBlob(canvas);
    renderBridge.assertExportFrameCurrent(session, sequence);
    recordExportCaptureDiagnostics('end');
  }

  throwIfAborted(signal);
  return { blob, normalizedTime, renderTime };
}
