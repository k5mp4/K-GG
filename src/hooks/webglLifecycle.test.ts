import { describe, expect, it, vi } from 'vitest';
import {
  acquireSharedWebGLInitRequest,
  bindWebGLContextLossHandlers,
  releaseSharedWebGLInitRequest,
  shouldDisposeResolvedWebGLRequest,
} from './webglLifecycle';

describe('shared WebGL initialization lifecycle', () => {
  it('shares one request across StrictMode-style setup and cleanup', async () => {
    const canvas = {};
    let initializeCount = 0;
    const initialize = async () => {
      initializeCount += 1;
      return { id: initializeCount };
    };

    const first = acquireSharedWebGLInitRequest(null, canvas, 1, initialize);
    expect(first.reused).toBe(false);
    expect(first.request.activeConsumers).toBe(1);

    expect(releaseSharedWebGLInitRequest(first.request)).toBe(0);
    const second = acquireSharedWebGLInitRequest(first.request, canvas, 1, initialize);
    expect(second.reused).toBe(true);
    expect(second.request).toBe(first.request);
    expect(second.request.activeConsumers).toBe(1);

    await expect(second.request.promise).resolves.toEqual({ id: 1 });
    expect(initializeCount).toBe(1);
    expect(shouldDisposeResolvedWebGLRequest(second.request, true)).toBe(false);
  });

  it('disposes a resolved result when its only consumer unmounts before resolve', async () => {
    let resolve: ((value: object) => void) | undefined;
    const promise = new Promise<object>(res => { resolve = res; });
    const request = {
      canvas: {},
      shaderVersion: 1,
      promise,
      activeConsumers: 1,
    };

    expect(releaseSharedWebGLInitRequest(request)).toBe(0);
    expect(shouldDisposeResolvedWebGLRequest(request, true)).toBe(true);
    resolve?.({ id: 'context' });
    await expect(request.promise).resolves.toEqual({ id: 'context' });
  });

  it('serializes a new shader version behind the previous request', async () => {
    let releaseFirst: (() => void) | undefined;
    const firstPromise = new Promise<object>(resolve => { releaseFirst = () => resolve({ version: 1 }); });
    const first = { canvas: {}, shaderVersion: 1, promise: firstPromise, activeConsumers: 0 };
    let initialized = false;
    const next = acquireSharedWebGLInitRequest(first, first.canvas, 2, async () => {
      initialized = true;
      return { version: 2 };
    });

    expect(initialized).toBe(false);
    releaseFirst?.();
    await expect(next.request.promise).resolves.toEqual({ version: 2 });
    expect(initialized).toBe(true);
  });

  it('starts the next request after a rejected previous initialization', async () => {
    let rejectFirst: ((reason?: unknown) => void) | undefined;
    const firstPromise = new Promise<object>((_resolve, reject) => { rejectFirst = reject; });
    const first = { canvas: {}, shaderVersion: 1, promise: firstPromise, activeConsumers: 0 };
    let initialized = false;
    const next = acquireSharedWebGLInitRequest(first, first.canvas, 2, async () => {
      initialized = true;
      return { version: 2 };
    });

    expect(initialized).toBe(false);
    rejectFirst?.(new Error('initialization failed'));
    await expect(next.request.promise).resolves.toEqual({ version: 2 });
    expect(initialized).toBe(true);
  });
});

describe('WebGL context loss and restore', () => {
  function setup(options: { contextCanvas?: EventTarget; withLedger?: boolean } = {}) {
    const canvas = new EventTarget();
    const ledger = { markContextLost: vi.fn(), markContextRestored: vi.fn() };
    let current: { gl: { canvas: unknown }; resourceLedger: typeof ledger | null } | null = {
      gl: { canvas: options.contextCanvas ?? canvas },
      resourceLedger: options.withLedger === false ? null : ledger,
    };
    const context = current;
    const calls: string[] = [];
    const handlers = {
      getContext: () => current,
      clearContext: vi.fn(() => { current = null; }),
      disposeContext: vi.fn(() => { calls.push('dispose'); }),
      recordEvent: vi.fn((event: string) => { calls.push(event); }),
      onLost: vi.fn(() => { calls.push('lost'); }),
      onRestored: vi.fn(() => { calls.push('restored'); }),
    };
    const unbind = bindWebGLContextLossHandlers(canvas, handlers);
    return { canvas, ledger, context, calls, handlers, unbind, getCurrent: () => current };
  }

  function loseContext(canvas: EventTarget): Event {
    const event = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(event);
    return event;
  }

  it('disposes the lost context and requests reinitialization when the context is restored', () => {
    const { canvas, ledger, context, calls, handlers, getCurrent } = setup();

    const lost = loseContext(canvas);
    // Without preventDefault the browser never dispatches webglcontextrestored.
    expect(lost.defaultPrevented).toBe(true);
    expect(getCurrent()).toBeNull();
    expect(handlers.disposeContext).toHaveBeenCalledWith(context);
    expect(ledger.markContextLost).toHaveBeenCalledTimes(1);
    expect(handlers.onRestored).not.toHaveBeenCalled();

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(ledger.markContextRestored).toHaveBeenCalledTimes(1);
    expect(handlers.recordEvent).toHaveBeenLastCalledWith('context-restored', ledger);
    expect(calls).toEqual(['context-lost', 'dispose', 'lost', 'context-restored', 'restored']);
  });

  it('reinitializes after every restore, including repeated loss cycles', () => {
    const { canvas, handlers } = setup();

    loseContext(canvas);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    loseContext(canvas);
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(handlers.onLost).toHaveBeenCalledTimes(2);
    expect(handlers.onRestored).toHaveBeenCalledTimes(2);
  });

  it('marks the renderer unusable without disposing a context owned by another canvas', () => {
    const { canvas, ledger, handlers, getCurrent } = setup({ contextCanvas: new EventTarget() });

    loseContext(canvas);
    expect(getCurrent()).toBeNull();
    expect(handlers.disposeContext).not.toHaveBeenCalled();
    expect(ledger.markContextLost).not.toHaveBeenCalled();
    expect(handlers.onLost).toHaveBeenCalledTimes(1);

    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(ledger.markContextRestored).not.toHaveBeenCalled();
    expect(handlers.onRestored).toHaveBeenCalledTimes(1);
  });

  it('handles loss and restore without a resource ledger', () => {
    const { canvas, handlers } = setup({ withLedger: false });

    loseContext(canvas);
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(handlers.disposeContext).toHaveBeenCalledTimes(1);
    expect(handlers.recordEvent).not.toHaveBeenCalled();
    expect(handlers.onRestored).toHaveBeenCalledTimes(1);
  });

  it('stops handling canvas events after unbinding', () => {
    const { canvas, handlers, unbind } = setup();

    unbind();
    loseContext(canvas);
    canvas.dispatchEvent(new Event('webglcontextrestored'));

    expect(handlers.clearContext).not.toHaveBeenCalled();
    expect(handlers.onLost).not.toHaveBeenCalled();
    expect(handlers.onRestored).not.toHaveBeenCalled();
  });
});
