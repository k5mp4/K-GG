import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { ClothGradientRenderer } from '../lib/clothGradientRenderer';
import { renderBridge } from '../lib/renderBridge';
import type { VideoExportFrameRenderer } from '../adapters/types';
import type { ClothGradientConfig } from '../types/clothGradient';
import { isWebGL2UnavailableError } from '../lib/webglCapability';

type Props = {
  sourceCanvasRef: RefObject<HTMLCanvasElement | null>;
  clothGradient: ClothGradientConfig;
  width: number;
  height: number;
  onReady: () => void;
  onUnavailable: () => void;
  outputCanvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  exportFrameRendererRef?: MutableRefObject<VideoExportFrameRenderer | null>;
};

export function ClothCanvas({
  sourceCanvasRef,
  clothGradient,
  width,
  height,
  onReady,
  onUnavailable,
  outputCanvasRef,
  exportFrameRendererRef,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({ onReady, onUnavailable });
  const clothGradientRef = useRef(clothGradient);
  const sizeRef = useRef({ width, height });
  const [hasFrame, setHasFrame] = useState(false);
  callbacksRef.current = { onReady, onUnavailable };
  clothGradientRef.current = clothGradient;
  sizeRef.current = { width, height };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: ClothGradientRenderer | null = null;
    let animationFrame = 0;
    let disposed = false;
    let notifiedUnavailable = false;
    let frameReady = false;

    const fail = (error?: unknown) => {
      if (disposed || notifiedUnavailable) return;
      notifiedUnavailable = true;
      if (outputCanvasRef) outputCanvasRef.current = null;
      if (exportFrameRendererRef) exportFrameRendererRef.current = null;
      if (error && !isWebGL2UnavailableError(error)) console.warn('[Cloth view] Texture-mapped renderer unavailable:', error);
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
        renderer = new ClothGradientRenderer();
        const outputCanvas = renderer.getCanvas();
        outputCanvas.setAttribute('aria-label', '3D cloth preview');
        outputCanvas.style.display = 'block';
        outputCanvas.style.width = '100%';
        outputCanvas.style.height = '100%';
        container.appendChild(outputCanvas);
        if (outputCanvasRef) outputCanvasRef.current = outputCanvas;
        if (exportFrameRendererRef) {
          exportFrameRendererRef.current = ({ session, time, normalizedTime }) => {
            const currentSourceCanvas = sourceCanvasRef.current;
            if (!currentSourceCanvas || !renderer) {
              throw new Error('3D cloth export renderer is not ready');
            }

            // Generate the exact processed 2D frame used by the normal
            // export session, then map that frame onto the same cloth mesh
            // used by the preview before the output canvas is captured.
            const sequence = renderBridge.renderExportFrame(session, time, normalizedTime);
            renderBridge.finishExportFrame(session, sequence);
            renderer.renderMappedTexture(
              currentSourceCanvas,
              clothGradientRef.current,
              time,
              Math.max(1, sizeRef.current.width),
              Math.max(1, sizeRef.current.height),
            );
            return sequence;
          };
        }

        const animate = (timestamp: number) => {
          if (disposed || !renderer) return;
          if (renderBridge.isExportSessionActive()) {
            animationFrame = requestAnimationFrame(animate);
            return;
          }
          try {
            const currentSourceCanvas = sourceCanvasRef.current;
            if (!currentSourceCanvas) {
              animationFrame = requestAnimationFrame(animate);
              return;
            }

            renderer.renderMappedTexture(
              currentSourceCanvas,
              clothGradientRef.current,
              timestamp * 0.001,
              Math.max(1, sizeRef.current.width),
              Math.max(1, sizeRef.current.height),
            );

            if (!frameReady) {
              frameReady = true;
              setHasFrame(true);
              callbacksRef.current.onReady();
            }
            animationFrame = requestAnimationFrame(animate);
          } catch (error) {
            fail(error);
          }
        };

        animationFrame = requestAnimationFrame(animate);
      } catch (error) {
        fail(error);
      }
    };

    setup();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      if (outputCanvasRef) outputCanvasRef.current = null;
      if (exportFrameRendererRef) exportFrameRendererRef.current = null;
      renderer?.dispose();
      renderer?.getCanvas().remove();
    };
  }, [exportFrameRendererRef, outputCanvasRef, sourceCanvasRef]);

  return (
    <div
      ref={containerRef}
      data-render-view="cloth"
      data-texture-source="processed-canvas"
      aria-label="3D cloth preview mapped from processed canvas"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: hasFrame
          ? 'radial-gradient(circle at 50% 42%, rgba(52, 45, 60, 0.54), rgba(10, 11, 18, 0.94) 72%)'
          : 'transparent',
      }}
    >
      {hasFrame && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            padding: '6px 9px',
            border: '1px solid rgba(240,234,217,0.2)',
            background: 'rgba(11, 13, 21, 0.68)',
            color: '#f0ead9',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          }}
        >
          3D CLOTH · CANVAS TEXTURE
        </div>
      )}
    </div>
  );
}
