import { describe, expect, it, vi } from 'vitest';
import { INITIAL_SHADER_WARMUP_SNAPSHOT, type ShaderWarmupSnapshot } from '../../lib/shaderWarmup';
import { getStartupProgress, isStartupReady, nextSplashCheckMs, shouldExitSplash } from './splashPolicy';
import { mountSplashVisual, type SplashVisualAdapter, type SplashVisualHandle } from './splashVisual';

const timing = { minDisplayMs: 600, maxDisplayMs: 4000 };

function warmup(patch: Partial<ShaderWarmupSnapshot>): ShaderWarmupSnapshot {
  return { ...INITIAL_SHADER_WARMUP_SNAPSHOT, ...patch };
}

describe('splash policy', () => {
  it('is ready once the current scene is settled, not when background warmup ends', () => {
    expect(isStartupReady(warmup({ status: 'waiting' }))).toBe(false);
    expect(isStartupReady(warmup({ status: 'critical' }))).toBe(false);
    expect(isStartupReady(warmup({ status: 'background' }))).toBe(true);
    expect(isStartupReady(warmup({ status: 'done' }))).toBe(true);
    expect(isStartupReady(warmup({ status: 'unavailable' }))).toBe(true);
  });

  it('reports monotonic progress from WebGL init through critical programs', () => {
    const values = [
      getStartupProgress(warmup({ status: 'waiting' })),
      getStartupProgress(warmup({ status: 'critical', criticalTotal: 4, criticalSettled: 0 })),
      getStartupProgress(warmup({ status: 'critical', criticalTotal: 4, criticalSettled: 2 })),
      getStartupProgress(warmup({ status: 'background' })),
    ];
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[3]).toBe(1);
  });

  it('keeps the minimum display time, honors skip, and always exits at the maximum', () => {
    expect(shouldExitSplash({ elapsedMs: 100, ready: true, skipped: false, timing })).toBe(false);
    expect(shouldExitSplash({ elapsedMs: 600, ready: true, skipped: false, timing })).toBe(true);
    expect(shouldExitSplash({ elapsedMs: 100, ready: false, skipped: true, timing })).toBe(true);
    expect(shouldExitSplash({ elapsedMs: 3999, ready: false, skipped: false, timing })).toBe(false);
    expect(shouldExitSplash({ elapsedMs: 4000, ready: false, skipped: false, timing })).toBe(true);
    expect(nextSplashCheckMs(100, true, timing)).toBe(500);
    expect(nextSplashCheckMs(100, false, timing)).toBe(3900);
  });
});

describe('splash visual adapters', () => {
  const context = { brandName: 'KAGARIBI Grad', reducedMotion: false, signal: new AbortController().signal };
  const handle = (): SplashVisualHandle => ({
    setProgress: vi.fn(),
    playExit: () => Promise.resolve(),
    dispose: vi.fn(),
  });
  const host = () => ({ replaceChildren: vi.fn() }) as unknown as HTMLElement;

  it('falls back to the poster when no Lottie/Rive adapter is registered', async () => {
    const poster = handle();
    const fallback = vi.fn<SplashVisualAdapter<{ kind: 'static' }>>(async () => poster);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const mounted = await mountSplashVisual(host(), { kind: 'rive', src: '/brand/splash.riv' }, context, {
      fallback,
      registry: {},
      loadTimeoutMs: 100,
    });

    expect(mounted).toBe(poster);
    expect(fallback).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('uses a registered adapter and forwards its definition', async () => {
    const lottie = handle();
    const adapter = vi.fn(async () => lottie);
    const fallback = vi.fn(async () => handle());

    const mounted = await mountSplashVisual(
      host(),
      { kind: 'lottie', src: '/brand/splash.json', loopSegment: [0, 60] },
      context,
      { fallback, registry: { lottie: async () => adapter }, loadTimeoutMs: 100 },
    );

    expect(mounted).toBe(lottie);
    expect(adapter).toHaveBeenCalledWith(expect.anything(), { kind: 'lottie', src: '/brand/splash.json', loopSegment: [0, 60] }, context);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back when the runtime fails or is too slow, and disposes a late visual', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const poster = handle();
    const fallback = vi.fn(async () => poster);

    const failed = await mountSplashVisual(host(), { kind: 'lottie', src: '/x.json' }, context, {
      fallback,
      registry: { lottie: () => Promise.reject(new Error('chunk load failed')) },
      loadTimeoutMs: 100,
    });
    expect(failed).toBe(poster);

    const late = handle();
    let finishMount: (value: SplashVisualHandle) => void = () => undefined;
    const slow = await mountSplashVisual(host(), { kind: 'rive', src: '/x.riv' }, context, {
      fallback,
      registry: { rive: async () => () => new Promise<SplashVisualHandle>((resolve) => { finishMount = resolve; }) },
      loadTimeoutMs: 10,
    });
    expect(slow).toBe(poster);
    finishMount(late);
    await Promise.resolve();
    await Promise.resolve();
    expect(late.dispose).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
