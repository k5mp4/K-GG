import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { ConeViewRenderer } from '../lib/coneViewRenderer';
import { getProcessedCanvasFrame, subscribeProcessedCanvasFrame } from '../lib/processedCanvasClock';
import { renderBridge } from '../lib/renderBridge';
import { useGradientStore } from '../store/gradientStore';
import type { VideoExportFrameRenderer } from '../adapters/types';
import type { ConeViewConfig } from '../types/coneView';
import { isWebGL2UnavailableError } from '../lib/webglCapability';

type Props = {
  sourceCanvasRef: RefObject<HTMLCanvasElement | null>;
  coneView: ConeViewConfig;
  width: number;
  height: number;
  onReady: () => void;
  onUnavailable: () => void;
  outputCanvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  exportFrameRendererRef?: MutableRefObject<VideoExportFrameRenderer | null>;
};

export function ConeCanvas({
  sourceCanvasRef,
  coneView,
  width,
  height,
  onReady,
  onUnavailable,
  outputCanvasRef,
  exportFrameRendererRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({ onReady, onUnavailable });
  const configRef = useRef(coneView);
  const sizeRef = useRef({ width, height });
  const renderSourceFrameRef = useRef<((normalizedTime: number) => void) | null>(null);
  const [hasFrame, setHasFrame] = useState(false);
  callbacksRef.current = { onReady, onUnavailable };
  configRef.current = coneView;
  sizeRef.current = { width, height };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: ConeViewRenderer | null = null;
    let animationFrame = 0;
    let disposed = false;
    let failed = false;
    let frameReady = false;
    let unsubscribeSourceFrame: (() => void) | null = null;
    let handleContextLost: ((event: Event) => void) | null = null;

    const fail = (error?: unknown) => {
      if (disposed || failed) return;
      failed = true;
      if (renderer) renderer.getCanvas().style.opacity = '0';
      if (outputCanvasRef) outputCanvasRef.current = null;
      if (exportFrameRendererRef) exportFrameRendererRef.current = null;
      if (error && !isWebGL2UnavailableError(error)) console.warn('[Cone view] Texture-mapped renderer unavailable:', error);
      callbacksRef.current.onUnavailable();
    };

    const setup = () => {
      if (disposed) return;
      const sourceCanvas = sourceCanvasRef.current;
      if (!sourceCanvas) {
        animationFrame = requestAnimationFrame(setup);
        return;
      }

      try {
        renderer = new ConeViewRenderer();
        const outputCanvas = renderer.getCanvas();
        outputCanvas.setAttribute('aria-label', '3D cone preview');
        outputCanvas.style.display = 'block';
        outputCanvas.style.width = '100%';
        outputCanvas.style.height = '100%';
        outputCanvas.style.opacity = '0';
        container.appendChild(outputCanvas);
        if (outputCanvasRef) outputCanvasRef.current = outputCanvas;
        handleContextLost = (event: Event) => {
          event.preventDefault();
          // A lost output context can otherwise remain selected while its
          // canvas is blank and no new source frame is published. Fall back
          // immediately so the main preview remains usable.
          fail(new Error('Cone preview WebGL context lost'));
        };
        outputCanvas.addEventListener('webglcontextlost', handleContextLost, false);
        if (exportFrameRendererRef) {
          exportFrameRendererRef.current = ({ session, time, normalizedTime }) => {
            const currentSourceCanvas = sourceCanvasRef.current;
            if (!currentSourceCanvas || !renderer) throw new Error('3D cone export renderer is not ready');
            const sequence = renderBridge.renderExportFrame(session, time, normalizedTime);
            renderBridge.finishExportFrame(session, sequence);
            renderer.renderMappedTexture(
              currentSourceCanvas,
              configRef.current,
              normalizedTime,
              sizeRef.current.width,
              sizeRef.current.height,
            );
            return sequence;
          };
        }

        const renderSourceFrame = (normalizedTime: number) => {
          if (disposed || !renderer || renderBridge.isExportSessionActive()) return;
          try {
            const currentSourceCanvas = sourceCanvasRef.current;
            if (!currentSourceCanvas) return;
            renderer.renderMappedTexture(
              currentSourceCanvas,
              configRef.current,
              normalizedTime,
              sizeRef.current.width,
              sizeRef.current.height,
            );
            if (!frameReady) {
              frameReady = true;
              renderer.getCanvas().style.opacity = '1';
              setHasFrame(true);
              callbacksRef.current.onReady();
            }
          } catch (error) {
            fail(error);
          }
        };

        renderSourceFrameRef.current = renderSourceFrame;
        // The source canvas publishes only after its WebGL render completes.
        // Rendering here avoids the old independent RAF reading the previous
        // source frame and producing a one-frame visual hitch.
        unsubscribeSourceFrame = subscribeProcessedCanvasFrame(renderSourceFrame);
        const state = useGradientStore.getState();
        const processedFrame = getProcessedCanvasFrame();
        renderSourceFrame(processedFrame.serial > 0
          ? processedFrame.normalizedTime
          : (state.animation.enabled ? state.currentTime : 0));
      } catch (error) {
        fail(error);
      }
    };

    setup();
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      unsubscribeSourceFrame?.();
      if (outputCanvasRef) outputCanvasRef.current = null;
      if (exportFrameRendererRef) exportFrameRendererRef.current = null;
      renderSourceFrameRef.current = null;
      if (handleContextLost) renderer?.getCanvas().removeEventListener('webglcontextlost', handleContextLost, false);
      renderer?.dispose();
      renderer?.getCanvas().remove();
    };
  }, [exportFrameRendererRef, outputCanvasRef, sourceCanvasRef]);

  // Mapping-only edits do not create a new processed 2D frame. Re-map the
  // latest completed source immediately so paused and playing animations use
  // the same live configuration without waiting for the next source tick.
  useEffect(() => {
    const renderSourceFrame = renderSourceFrameRef.current;
    if (!renderSourceFrame) return;
    const frame = getProcessedCanvasFrame();
    const state = useGradientStore.getState();
    renderSourceFrame(frame.serial > 0
      ? frame.normalizedTime
      : (state.animation.enabled ? state.currentTime : 0));
  }, [coneView, height, width]);

  return (
    <div
      ref={containerRef}
      data-render-view="cone"
      data-texture-source="processed-canvas"
      aria-label="3D cone preview mapped from processed canvas"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: 'transparent' }}
    >
      {hasFrame && (
        <div
          aria-hidden="true"
          className="absolute right-3 top-3 z-[1] border border-cyan-200/25 bg-k-bg/75 px-2.5 py-1.5 font-display text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
        >
          3D CONE · CANVAS TEXTURE
        </div>
      )}
    </div>
  );
}
