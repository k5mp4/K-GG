import { applicationCommands } from '../application/commands';
import type { KggControlRuntime } from './kggControlRuntime';
import { renderBridge } from './renderBridge';
import type { WebGLContext } from './webgl';
import { REPRESENTATIVE_RENDER_GOLDEN } from './renderGolden';
import type {
  KggE2EBridge,
  KggE2ECapture,
  KggE2EContextLifecycleResult,
  KggE2EDiagnostics,
  KggE2EExportState,
  KggE2ERenderContract,
  KggE2ERgbaCapture,
  KggE2EResourceLifecycleResult,
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.byteLength)));
  }
  return window.btoa(binary);
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

function captureCanvasRgba(
  canvas: HTMLCanvasElement,
  getWebGLContext: () => WebGLContext | null,
): KggE2ERgbaCapture {
  const context = getWebGLContext();
  if (!context || context.disposed || context.gl.isContextLost()) {
    throw new Error('E2E WebGL context is not ready for RGBA capture');
  }
  const { gl } = context;
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (width < 1 || height < 1 || canvas.width !== width || canvas.height !== height) {
    throw new Error(`E2E WebGL drawing buffer ${width}×${height} does not match Canvas ${canvas.width}×${canvas.height}`);
  }
  const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  if (framebuffer !== null) throw new Error('E2E RGBA capture requires the default framebuffer to be bound');

  const bottomToTop = new Uint8Array(width * height * 4);
  gl.finish();
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bottomToTop);
  const error = gl.getError();
  if (error !== gl.NO_ERROR) throw new Error(`E2E RGBA readPixels failed with WebGL error ${error}`);

  const topToBottom = new Uint8Array(bottomToTop.byteLength);
  const rowBytes = width * 4;
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = (height - row - 1) * rowBytes;
    topToBottom.set(bottomToTop.subarray(sourceOffset, sourceOffset + rowBytes), row * rowBytes);
  }
  return {
    format: 'rgba8',
    source: 'webgl-readPixels',
    rowOrder: 'top-to-bottom',
    mimeType: 'application/octet-stream',
    dataBase64: bytesToBase64(topToBottom),
    width,
    height,
    byteLength: topToBottom.byteLength,
  };
}

function renderContract(): KggE2ERenderContract {
  return {
    schemaVersion: 1,
    id: REPRESENTATIVE_RENDER_GOLDEN.id,
    preset: REPRESENTATIVE_RENDER_GOLDEN.preset,
    resolution: { ...REPRESENTATIVE_RENDER_GOLDEN.resolution },
    times: [...REPRESENTATIVE_RENDER_GOLDEN.times],
    seeds: { ...REPRESENTATIVE_RENDER_GOLDEN.seeds },
    paths: [...REPRESENTATIVE_RENDER_GOLDEN.paths],
  };
}

function resourceEvents(): unknown[] {
  const events = window.__KGG_WEBGL_RESOURCE_EVENTS__;
  return Array.isArray(events) ? events.slice() : [];
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
    resourceEvents: resourceEvents(),
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
    captureCanvasRgba: () => captureCanvasRgba(canvas, getWebGLContext),
    getRenderContract: renderContract,
    getRenderCondition: () => {
      const state = runtime.getState();
      if (!state.ok) throw new Error(state.error.message);
      return {
        snapshot: state.value.snapshot,
        renderer: state.value.renderer,
        effects: state.value.effects,
      };
    },
    async prepareRenderContract(): Promise<KggE2EDiagnostics> {
      const contract = renderContract();
      const resetEffects = runtime.resetEffect();
      if (!resetEffects.ok) throw new Error(resetEffects.error.message);
      const result = await runtime.runScenario([
        {
          type: 'control',
          operationId: 'set_group',
          input: { group: 'noiseDistortion', patch: { noiseSeed: contract.seeds.noise } },
        },
        {
          type: 'control',
          operationId: 'set_group',
          input: { group: 'diffuse', patch: { seed: contract.seeds.diffuse } },
        },
        {
          type: 'control',
          operationId: 'set_group',
          input: { group: 'stretch', patch: { seed: contract.seeds.stretch } },
        },
        {
          type: 'control',
          operationId: 'set_group',
          input: { group: 'flowGradient', patch: { seed: contract.seeds.flow } },
        },
        {
          type: 'control',
          operationId: 'set_group',
          input: { group: 'animation', patch: { enabled: false } },
        },
        {
          type: 'control',
          operationId: 'set_ui_state',
          input: { patch: { canvasW: contract.resolution.width, canvasH: contract.resolution.height } },
        },
      ], false);
      if (!result.ok) throw new Error(result.error.message);
      applicationCommands.setPresetName(contract.preset);
      renderBridge.seekTo(0);
      await nextFrame();
      const deadline = performance.now() + DEFAULT_TIMEOUT_MS;
      while (performance.now() < deadline) {
        const context = getWebGLContext();
        if (
          context
          && !context.disposed
          && !context.gl.isContextLost()
          && context.hasPresentedFrame
          && canvas.width === contract.resolution.width
          && canvas.height === contract.resolution.height
        ) return diagnostics(canvas, getWebGLContext, runtime);
        await sleep(16);
      }
      throw new Error(`Timed out preparing representative render contract ${contract.resolution.width}×${contract.resolution.height}`);
    },
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
    async exerciseResourceLifecycle(): Promise<KggE2EResourceLifecycleResult> {
      const snapshotResult = runtime.captureSnapshot();
      if (!snapshotResult.ok) throw new Error(snapshotResult.error.message);
      const originalCanvas = { width: canvas.width, height: canvas.height };
      const iterations: KggE2EResourceLifecycleResult['iterations'] = [];
      const waitForCanvas = async (width: number, height: number): Promise<void> => {
        const deadline = performance.now() + DEFAULT_TIMEOUT_MS;
        while (performance.now() < deadline) {
          const context = getWebGLContext();
          if (
            context
            && !context.disposed
            && !context.gl.isContextLost()
            && context.hasPresentedFrame
            && canvas.width === width
            && canvas.height === height
          ) return;
          await sleep(16);
        }
        throw new Error(`Timed out waiting for lifecycle Canvas ${width}×${height}`);
      };
      let lifecycleError: unknown = null;
      try {
        for (const [index, size] of [[640, 480], [800, 800], [640, 480]].entries()) {
          const result = await runtime.runScenario([
            {
              type: 'control',
              operationId: 'set_group',
              input: { group: 'noiseDistortion', patch: { enabled: index % 2 === 0 } },
            },
            {
              type: 'control',
              operationId: 'set_group',
              input: { group: 'diffuse', patch: { enabled: index % 2 === 1 } },
            },
            {
              type: 'control',
              operationId: 'set_ui_state',
              input: { patch: { canvasW: size[0], canvasH: size[1] } },
            },
          ], false);
          if (!result.ok) throw new Error(result.error.message);
          await waitForCanvas(size[0], size[1]);
          const current = diagnostics(canvas, getWebGLContext, runtime);
          iterations.push({
            index,
            canvas: { width: canvas.width, height: canvas.height },
            resources: (current.render as { resources?: unknown }).resources ?? null,
          });
        }
      } catch (error) {
        lifecycleError = error;
      }

      let restoreError: unknown = null;
      try {
        const restoreResult = runtime.restoreSnapshot(snapshotResult.value.snapshotId);
        if (!restoreResult.ok) throw new Error(restoreResult.error.message);
        const restoreCanvasResult = await runtime.runScenario([{
          type: 'control',
          operationId: 'set_ui_state',
          input: { patch: { canvasW: originalCanvas.width, canvasH: originalCanvas.height } },
        }], false);
        if (!restoreCanvasResult.ok) throw new Error(restoreCanvasResult.error.message);
        await waitForCanvas(originalCanvas.width, originalCanvas.height);
      } catch (error) {
        restoreError = error;
      }

      if (lifecycleError && restoreError) {
        throw new AggregateError([lifecycleError, restoreError], 'Resource lifecycle exercise and snapshot restoration both failed');
      }
      if (lifecycleError) {
        throw lifecycleError;
      }
      if (restoreError) {
        throw restoreError;
      }
      return {
        iterations,
        restoredCanvas: { width: canvas.width, height: canvas.height },
        disposeEvents: resourceEvents().filter(event => (
          typeof event === 'object' && event !== null && (event as { event?: unknown }).event === 'dispose'
        )),
      };
    },
    async loseAndRestoreContext(options = {}): Promise<KggE2EContextLifecycleResult> {
      const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const context = getWebGLContext();
      const extension = context?.gl.getExtension('WEBGL_lose_context') as {
        loseContext: () => void;
        restoreContext: () => void;
      } | null;
      if (!context || !extension) throw new Error('WEBGL_lose_context is unavailable; context lifecycle is not testable');
      const lostPromise = new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          canvas.removeEventListener('webglcontextlost', onLost);
          reject(new Error(`Timed out waiting for webglcontextlost after ${timeoutMs}ms`));
        }, timeoutMs);
        const onLost = () => {
          window.clearTimeout(timeout);
          canvas.removeEventListener('webglcontextlost', onLost);
          resolve();
        };
        canvas.addEventListener('webglcontextlost', onLost, { once: true });
      });
      extension.loseContext();
      await lostPromise;
      // Chromium may dispatch contextlost before its internal context state
      // has completed the transition. Give the browser one frame before
      // asking WEBGL_lose_context to restore the context.
      await nextFrame();
      const restoredPromise = new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          canvas.removeEventListener('webglcontextrestored', onRestored);
          reject(new Error(`Timed out waiting for webglcontextrestored after ${timeoutMs}ms`));
        }, timeoutMs);
        const onRestored = () => {
          window.clearTimeout(timeout);
          canvas.removeEventListener('webglcontextrestored', onRestored);
          resolve();
        };
        canvas.addEventListener('webglcontextrestored', onRestored, { once: true });
      });
      extension.restoreContext();
      await restoredPromise;

      const deadline = performance.now() + timeoutMs;
      while (performance.now() < deadline) {
        const current = window.__KGG_E2E__;
        if (current) {
          try {
            const ready = await current.waitForWebGLReady({ timeoutMs: Math.max(100, Math.min(1_000, deadline - performance.now())) });
            return { lost: true, restored: true, diagnostics: ready };
          } catch {
            // The new renderer may still be compiling after the restore event.
          }
        }
        await sleep(16);
      }
      throw new Error(`Timed out waiting for K-GG WebGL reinitialization after context restore (${timeoutMs}ms)`);
    },
  };

  window.__KGG_E2E__ = bridge;
  return () => {
    if (window.__KGG_E2E__ === bridge) delete window.__KGG_E2E__;
    if (paused) bridge.resumeAnimation(false);
  };
}
