import { describe, expect, it, vi } from 'vitest';
import {
  effectStackWindowUrl,
  EFFECT_STACK_WINDOW_QUERY,
  waitForEffectStackWindowCreation,
  waitForEffectStackWindowPresence,
} from './effectStackWindow';

describe('effectStackWindow', () => {
  it('adds the detached-window query without dropping the current URL', () => {
    vi.stubGlobal('window', {
      location: { href: 'https://kgg.test/workspace?preset=demo' },
    });
    expect(effectStackWindowUrl()).toContain(`${EFFECT_STACK_WINDOW_QUERY}=1`);
    expect(effectStackWindowUrl()).toContain('preset=demo');
    vi.unstubAllGlobals();
  });

  it('rejects when the native window does not report creation before timeout', async () => {
    vi.useFakeTimers();
    const handlers = new Map<string, (event?: unknown) => void>();
    const unlisten = vi.fn();
    const source = {
      once: async <T>(event: string, handler: (event: T) => void) => {
        handlers.set(event, handler as (event?: unknown) => void);
        return unlisten;
      },
    };

    const pending = waitForEffectStackWindowCreation(source, 25);
    const expectation = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(25);
    await expectation;
    expect(unlisten).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('preserves the native creation error payload in the rejection', async () => {
    const handlers = new Map<string, (event?: unknown) => void>();
    const source = {
      once: async <T>(event: string, handler: (event: T) => void) => {
        handlers.set(event, handler as (event?: unknown) => void);
        return () => undefined;
      },
    };

    const pending = waitForEffectStackWindowCreation(source, 1000);
    handlers.get('tauri://error')?.({ payload: { reason: 'permission denied' } });
    await expect(pending).rejects.toThrow('permission denied');
  });

  it('falls back to label presence when the local creation event was missed', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const source = {
      getByLabel: async () => {
        calls += 1;
        if (calls === 1) throw new Error('get-all-windows unavailable');
        return {} as never;
      },
    };
    const pending = waitForEffectStackWindowPresence(source, 100);
    await vi.advanceTimersByTimeAsync(50);
    await expect(pending).resolves.toBeUndefined();
    expect(calls).toBe(2);
    vi.useRealTimers();
  });
});
