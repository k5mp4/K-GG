export type SharedWebGLInitRequest<TCanvas, TResult> = {
  canvas: TCanvas;
  shaderVersion: number;
  promise: Promise<TResult>;
  activeConsumers: number;
};

export function acquireSharedWebGLInitRequest<TCanvas, TResult>(
  current: SharedWebGLInitRequest<TCanvas, TResult> | null,
  canvas: TCanvas,
  shaderVersion: number,
  initialize: () => Promise<TResult>,
): { request: SharedWebGLInitRequest<TCanvas, TResult>; reused: boolean } {
  if (current && current.canvas === canvas && current.shaderVersion === shaderVersion) {
    current.activeConsumers += 1;
    return { request: current, reused: true };
  }

  const waitForPrevious = current
    ? current.promise.then(() => undefined, () => undefined)
    : Promise.resolve();
  const request: SharedWebGLInitRequest<TCanvas, TResult> = {
    canvas,
    shaderVersion,
    promise: waitForPrevious.then(initialize),
    activeConsumers: 1,
  };
  return { request, reused: false };
}

export function releaseSharedWebGLInitRequest<TCanvas, TResult>(
  request: SharedWebGLInitRequest<TCanvas, TResult>,
): number {
  request.activeConsumers = Math.max(0, request.activeConsumers - 1);
  return request.activeConsumers;
}

export function shouldDisposeResolvedWebGLRequest<TCanvas, TResult>(
  request: SharedWebGLInitRequest<TCanvas, TResult>,
  consumerDisposed: boolean,
): boolean {
  return consumerDisposed && request.activeConsumers === 0;
}

type ContextLossLedger = {
  markContextLost(): void;
  markContextRestored(): void;
};

type ContextLossOwnedContext<TLedger extends ContextLossLedger> = {
  gl: { canvas: unknown };
  resourceLedger: TLedger | null;
};

export type WebGLContextLossHandlers<
  TLedger extends ContextLossLedger,
  TContext extends ContextLossOwnedContext<TLedger>,
> = {
  getContext: () => TContext | null;
  clearContext: () => void;
  disposeContext: (context: TContext) => void;
  recordEvent: (event: 'context-lost' | 'context-restored', ledger: TLedger) => void;
  /** Called on loss: the renderer is no longer usable until reinitialized. */
  onLost: () => void;
  /** Called on restore: the owner must run its WebGL initialization again. */
  onRestored: () => void;
};

/**
 * Binds the Preview's context loss/restore handling to a canvas and returns
 * an unbind function. A restored context has no programs or textures, so the
 * owner must reinitialize; the ledger of the lost context is carried over so
 * the restore is recorded against the same resource history.
 */
export function bindWebGLContextLossHandlers<
  TLedger extends ContextLossLedger,
  TContext extends ContextLossOwnedContext<TLedger>,
>(
  canvas: EventTarget,
  handlers: WebGLContextLossHandlers<TLedger, TContext>,
): () => void {
  let lostLedger: TLedger | null = null;
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    const current = handlers.getContext();
    handlers.clearContext();
    if (current && current.gl.canvas === canvas) {
      const ledger = current.resourceLedger;
      if (ledger) {
        ledger.markContextLost();
        lostLedger = ledger;
        handlers.recordEvent('context-lost', ledger);
      }
      handlers.disposeContext(current);
    }
    handlers.onLost();
  };
  const handleContextRestored = () => {
    if (lostLedger) {
      lostLedger.markContextRestored();
      handlers.recordEvent('context-restored', lostLedger);
      lostLedger = null;
    }
    handlers.onRestored();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    lostLedger = null;
  };
}
