import { applicationCommands } from '../application/commands';
import type { KggControlRuntime } from './kggControlRuntime';
import { renderBridge } from './renderBridge';
import type { WebGLContext } from './webgl';
import type {
  KggE2EBridge,
  KggE2ECapture,
  KggE2EDiagnostics,
  KggE2EExportState,
} from '../types/e2eBridge';

export type KggE2EBridgeOptions = {
  canvas: HTMLCanvasElement;
  getWebGLContext: () => WebGLContext | null;
  runtime: KggControlRuntime;
};

const DEFAULT_TIMEOUT_MS = 30_000;

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => window.requestAnimationFrame(() => resolve()));
}

function normalizedTimeValue(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function captureCanvasPng(canvas: HTMLCanvasElement): KggE2ECapture {
  if (canvas.width < 1 || canvas.height < 1) {
    throw new Error('E2E Canvas has no drawable dimensions');
  }
  const dataUrl = canvas.toDataURL('image/png');
  if (!dataUrl.startsWith('data:image/png;base64,')) {
    throw new Error('E2E Canvas did not produce a PNG data URL');
  }
  return {
    mimeType: 'image/png',
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

function exportState(): KggE2EExportState {
  return {
    active: renderBridge.isExportSessionActive(),
    currentTime: renderBridge.getCurrentTime(),
    currentNormalizedTime: renderBridge.getCurrentNormalizedTime(),
  };
}

function diagnostics(
  canvas: HTMLCanvasElement,
  getWebGLContext: () => WebGLContext | null,
  runtime: KggControlRuntime,
): KggE2EDiagnostics {
  const context = getWebGLContext();
  const render = runtime.getRenderDiagnostics();
  return {
    bridgeVersion: 1,
    canvas: { width: canvas.width, height: canvas.height },
    webgl: {
      rendererReady: context !== null && !context.disposed,
      contextLost: context?.gl.isContextLost() ?? true,
      hasPresentedFrame: context?.hasPresentedFrame ?? false,
      gpu: context?.gpuDiagnostics ?? null,
    },
    render: render.ok ? render.value : { ok: false, error: render.error },
    export: exportState(),
  };
}

export function mountKggE2EBridge({ canvas, getWebGLContext, runtime }: KggE2EBridgeOptions): () => void {
  let paused = false;
  let wasPlaying = false;

  const bridge: KggE2EBridge = {
    version: 1,
    async waitForWebGLReady(options = {}): Promise<KggE2EDiagnostics> {
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const deadline = performance.now() + timeoutMs;
      while (performance.now() < deadline) {
        const context = getWebGLContext();
        if (
          context
          && !context.disposed
          && !context.gl.isContextLost()
          && context.hasPresentedFrame
          && canvas.width > 0
          && canvas.height > 0
        ) {
          return diagnostics(canvas, getWebGLContext, runtime);
        }
        await sleep(16);
      }
      throw new Error(`Timed out waiting for WebGL readiness after ${timeoutMs}ms`);
    },
    pauseAnimation(): { wasPlaying: boolean; paused: boolean } {
      if (!paused) {
        wasPlaying = renderBridge.suspendAnimation();
        paused = true;
      }
      return { wasPlaying, paused: true };
    },
    resumeAnimation(previouslyPlaying = wasPlaying): void {
      if (!paused) return;
      renderBridge.resumeAnimation(previouslyPlaying);
      paused = false;
      wasPlaying = false;
    },
    async setNormalizedTime(value: number): Promise<KggE2ECapture> {
      if (!paused) bridge.pauseAnimation();
      renderBridge.seekTo(normalizedTimeValue(value));
      await nextFrame();
      return captureCanvasPng(canvas);
    },
    captureCanvasPng: () => captureCanvasPng(canvas),
    getDiagnostics: () => diagnostics(canvas, getWebGLContext, runtime),
    getExportState: exportState,
    async waitForExportComplete(options = {}): Promise<KggE2EExportState> {
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const deadline = performance.now() + timeoutMs;
      let inactiveFrames = 0;
      while (performance.now() < deadline) {
        if (renderBridge.isExportSessionActive()) {
          inactiveFrames = 0;
        } else {
          inactiveFrames += 1;
          if (inactiveFrames >= 2) {
            await nextFrame();
            return exportState();
          }
        }
        await sleep(16);
      }
      throw new Error(`Timed out waiting for export completion after ${timeoutMs}ms`);
    },
    prepareZipSmoke: () => {
      applicationCommands.setAnimation({ enabled: true, previewLoop: false, duration: 1, fps: 24 });
      return { duration: 1, fps: 24, frameCount: 24 };
    },
  };

  window.__KGG_E2E__ = bridge;
  return () => {
    if (window.__KGG_E2E__ === bridge) delete window.__KGG_E2E__;
    if (paused) bridge.resumeAnimation(false);
  };
}
