export type ProcessedCanvasFrame = {
  serial: number;
  normalizedTime: number;
};

let currentFrame: ProcessedCanvasFrame = { serial: 0, normalizedTime: 0 };
const listeners = new Set<(normalizedTime: number) => void>();

function clampNormalizedTime(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

/**
 * Publishes after the processed WebGL canvas has been rendered. Cone/Cloth
 * adapters can consume this synchronously, so they never sample a half-step
 * between the timeline clock and the source canvas.
 */
export function publishProcessedCanvasFrame(normalizedTime: number): void {
  currentFrame = {
    serial: currentFrame.serial + 1,
    normalizedTime: clampNormalizedTime(normalizedTime),
  };
  listeners.forEach(listener => {
    try {
      listener(currentFrame.normalizedTime);
    } catch {
      // A display adapter must not interrupt the source canvas render.
    }
  });
}

export function getProcessedCanvasFrame(): ProcessedCanvasFrame {
  return currentFrame;
}

export function subscribeProcessedCanvasFrame(listener: (normalizedTime: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
