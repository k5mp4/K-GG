import { describe, expect, it } from 'vitest';
import {
  createSerialAsyncQueue,
  selectShaderCompileExtension,
  selectShaderCompileExtensionForSnapshot,
} from './webgl';

describe('WebGL lazy compile policy', () => {
  it('disables parallel linking only while validation is enabled', () => {
    const extension = { COMPLETION_STATUS_KHR: 0x91b1 };

    expect(selectShaderCompileExtension(extension, true)).toBeNull();
    expect(selectShaderCompileExtension(extension, false)).toBe(extension);
  });

  it('keeps parallel linking when validation is available but disabled', () => {
    const extension = { COMPLETION_STATUS_KHR: 0x91b1 };

    expect(selectShaderCompileExtensionForSnapshot(extension, {
      validationAvailable: true,
      validationEnabled: false,
    })).toBe(extension);
    expect(selectShaderCompileExtensionForSnapshot(extension, {
      validationAvailable: true,
      validationEnabled: true,
    })).toBeNull();
    expect(selectShaderCompileExtensionForSnapshot(extension, undefined)).toBe(extension);
  });

  it('serializes lazy shader compilation requests on one WebGL context', async () => {
    const queue = createSerialAsyncQueue();
    let active = 0;
    let maximumActive = 0;
    let releaseFirst: () => void = () => {
      throw new Error('first task did not start');
    };
    let firstStartedResolve: (() => void) | null = null;
    const firstStarted = new Promise<void>((resolve) => {
      firstStartedResolve = resolve;
    });

    const first = queue.enqueue(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      firstStartedResolve?.();
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      active -= 1;
    });
    const second = queue.enqueue(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      active -= 1;
    });

    await firstStarted;
    expect(active).toBe(1);
    expect(maximumActive).toBe(1);

    releaseFirst();
    await Promise.all([first, second]);
    expect(maximumActive).toBe(1);
  });

  it('starts waiting demand compiles before idle warmup, FIFO within a priority', async () => {
    const queue = createSerialAsyncQueue();
    const order: string[] = [];
    let releaseFirst: () => void = () => undefined;
    const first = queue.enqueue(() => new Promise<void>((resolve) => {
      order.push('running-warmup');
      releaseFirst = resolve;
    }), { priority: 'warmup', id: 'running-warmup' });
    await Promise.resolve();

    const task = (name: string) => async () => {
      order.push(name);
    };
    const queued = [
      queue.enqueue(task('warmup-a'), { priority: 'warmup', id: 'warmup-a' }),
      queue.enqueue(task('warmup-b'), { priority: 'warmup', id: 'warmup-b' }),
      queue.enqueue(task('prefetch'), { priority: 'prefetch', id: 'prefetch' }),
      queue.enqueue(task('demand-1'), { priority: 'demand', id: 'demand-1' }),
      queue.enqueue(task('demand-2')),
    ];
    // A user request for a program already waiting as warmup jumps ahead.
    queue.promote('warmup-b', 'demand');
    // Promotion never lowers a priority.
    queue.promote('demand-1', 'warmup');

    releaseFirst();
    await Promise.all([first, ...queued]);
    expect(order).toEqual(['running-warmup', 'demand-1', 'demand-2', 'warmup-b', 'prefetch', 'warmup-a']);
  });

  it('keeps running later tasks after a failed compile', async () => {
    const queue = createSerialAsyncQueue();
    const failed = queue.enqueue(async () => {
      throw new Error('link failed');
    });
    const next = queue.enqueue(async () => 'ok');

    await expect(failed).rejects.toThrow('link failed');
    await expect(next).resolves.toBe('ok');
  });
});
