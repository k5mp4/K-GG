import { describe, expect, it } from 'vitest';
import {
  acquireSharedWebGLInitRequest,
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
