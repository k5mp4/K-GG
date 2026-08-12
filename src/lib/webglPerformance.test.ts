import { describe, expect, it, vi } from 'vitest';
import {
  averageNumbers,
  benchmarkResultJson,
  cancelSpectorCaptureRuntime,
  cancelWebGLFrame,
  configureStatsOverlay,
  getStatsGLOptions,
  isWebGLFrameCaptureActive,
  onePercentLowFrameMs,
  resolveSpectorConstructor,
  scheduleSpectorCaptureKickoff,
  WebGLPerformanceProfiler,
} from './webglPerformance';

describe('webglPerformance aggregates', () => {
  it('resolves Spector.js from the supported UMD/Vite export shapes', () => {
    class FakeSpector {}

    expect(resolveSpectorConstructor({ Spector: FakeSpector })).toBe(FakeSpector);
    expect(resolveSpectorConstructor({ default: { Spector: FakeSpector } })).toBe(FakeSpector);
    expect(resolveSpectorConstructor({ default: { default: { Spector: FakeSpector } } })).toBe(FakeSpector);
    expect(resolveSpectorConstructor({ SPECTOR: { Spector: FakeSpector } })).toBe(FakeSpector);
    expect(resolveSpectorConstructor({ default: { SPECTOR: { Spector: FakeSpector } } })).toBe(FakeSpector);
    expect(resolveSpectorConstructor({ default: {} })).toBeNull();
  });

  it('cancels Spector retry state and hides its capture menu', () => {
    let stopped = 0;
    let paused = 0;
    let speed = -1;
    let hidden = 0;
    const timeout = setTimeout(() => undefined, 60_000);
    const runtime = {
      displayUI: () => undefined,
      captureCanvas: () => undefined,
      pause: () => { paused += 1; },
      timeSpy: { changeSpeedRatio: (ratio: number) => { speed = ratio; } },
      noFrameTimeout: timeout,
      captureNextFrames: 1,
      captureNextCommands: 2,
      capturingContext: { stopCapture: () => { stopped += 1; } },
      captureMenu: { hide: () => { hidden += 1; } },
    };

    cancelSpectorCaptureRuntime(runtime);

    expect(paused).toBe(1);
    expect(stopped).toBe(1);
    expect(runtime.noFrameTimeout).toBe(-1);
    expect(runtime.captureNextFrames).toBe(0);
    expect(runtime.captureNextCommands).toBe(0);
    expect(runtime.capturingContext).toBeUndefined();
    expect(speed).toBe(1);
    expect(hidden).toBe(1);
  });

  it('kicks a static preview once so Spector can observe a GL command', () => {
    let frameCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });
    let renderCount = 0;

    scheduleSpectorCaptureKickoff(1, {}, () => true, () => {
      renderCount += 1;
    });

    expect(renderCount).toBe(0);
    const invokeFrameCallback = frameCallback as unknown as (timestamp: number) => void;
    invokeFrameCallback(performance.now());
    expect(renderCount).toBe(1);
    vi.unstubAllGlobals();
  });

  it('averages only the supplied valid GPU samples', () => {
    expect(averageNumbers([0.2, 0.8, 1.0])).toBeCloseTo(0.6667, 3);
    expect(averageNumbers([])).toBeNull();
  });

  it('calculates the 1% low equivalent from the slowest frame bucket', () => {
    const frames = Array.from({ length: 100 }, (_, index) => index < 99 ? 8 : 42);
    expect(onePercentLowFrameMs(frames)).toBe(42);
    expect(onePercentLowFrameMs([])).toBeNull();
  });

  it('serializes benchmark results as a portable JSON artifact', () => {
    const json = benchmarkResultJson({
      frameCount: 300,
      averageFps: 60,
      averageCpuFrameMs: 2,
      averageGpuFrameMs: 3,
      peakFrameMs: 6,
      onePercentLowFrameMs: 5,
      averageDrawCalls: 12,
      averageRenderPasses: 8,
      effectAverageGpuMs: { Glass: 1.2 },
      resources: { textures: 4, buffers: 2, renderbuffers: 1, framebuffers: 3, shaders: 5, programs: 6, vertexArrays: 1, memoryBytes: 1024 },
      startedAt: '2026-08-12T00:00:00.000Z',
      completedAt: '2026-08-12T00:01:00.000Z',
    });
    expect(JSON.parse(json)).toMatchObject({ tool: 'K-GG WebGL Performance Profiler', frameCount: 300, effectAverageGpuMs: { Glass: 1.2 } });
  });

  it('does not enable stats-gl GPU queries while K-GG pass queries are active', () => {
    expect(getStatsGLOptions(true)).toMatchObject({ trackFPS: true, trackGPU: false });
    expect(getStatsGLOptions(false)).toMatchObject({ trackFPS: true, trackGPU: true });
  });

  it('does not disable the same validation extension twice during initialization', () => {
    let disableCalls = 0;
    const validationExtension = {
      disable: () => {
        disableCalls += 1;
        if (disableCalls > 1) throw new Error('webgl-lint disable called twice');
      },
    };
    const gl = {
      getExtension: (name: string) => name === 'GMAN_debug_helper' ? validationExtension : null,
    } as unknown as WebGL2RenderingContext;

    const profiler = new WebGLPerformanceProfiler(
      gl,
      {} as HTMLCanvasElement,
      { statsModule: null, memoryLoaded: false, lintLoaded: true },
    );
    expect(() => profiler.setValidationEnabled(false)).not.toThrow();
    expect(disableCalls).toBe(1);
  });

  it('isolates Spector capture from validation and profiler measurements, then restores validation', () => {
    const configurations: Array<Record<string, unknown>> = [];
    const validationExtension = {
      disable: () => undefined,
      setConfiguration: (settings: Record<string, unknown>) => configurations.push(settings),
    };
    const gl = {
      getExtension: (name: string) => name === 'GMAN_debug_helper' ? validationExtension : null,
    } as unknown as WebGL2RenderingContext;
    const canvas = { getContext: () => gl } as unknown as HTMLCanvasElement;
    const profiler = new WebGLPerformanceProfiler(
      gl,
      canvas,
      { statsModule: null, memoryLoaded: false, lintLoaded: true },
    );

    profiler.setValidationEnabled(true);
    expect(profiler.getSnapshot().validationEnabled).toBe(true);
    profiler.setExternalCaptureActive(true);
    expect(profiler.isExternalCaptureActive()).toBe(true);
    expect(profiler.getSnapshot().validationEnabled).toBe(false);
    profiler.setExternalCaptureActive(false);

    expect(profiler.isExternalCaptureActive()).toBe(false);
    expect(profiler.getSnapshot().validationEnabled).toBe(true);
    expect(configurations.at(-1)).toMatchObject({
      failUndefinedUniforms: false,
      warnUndefinedUniforms: false,
    });
  });

  it('reports no active capture after the Spector runtime has been cancelled', () => {
    expect(cancelWebGLFrame()).toBe(false);
    expect(isWebGLFrameCaptureActive()).toBe(false);
  });

  it('initializes stats-gl with the existing WebGL context instead of reacquiring the canvas context', () => {
    let statsTarget: unknown = null;
    function FakeStats(this: { dom?: HTMLElement; init: (target: HTMLCanvasElement | WebGL2RenderingContext) => void }, _options: Record<string, unknown>) {
      this.dom = undefined;
      this.init = target => { statsTarget = target; };
    }
    const gl = {
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext;

    const profiler = new WebGLPerformanceProfiler(
      gl,
      {} as HTMLCanvasElement,
      { statsModule: { default: FakeStats }, memoryLoaded: false, lintLoaded: false },
    );

    expect(Reflect.get(profiler, 'stats')).not.toBeNull();
    expect(statsTarget).toBe(gl);
  });

  it('mounts stats-gl inside the profiler dock instead of the document body', () => {
    let appended: unknown = null;
    let removed = 0;
    const dom = {
      style: {},
      remove: () => { removed += 1; },
    } as unknown as HTMLElement;
    function FakeStats(this: { dom: HTMLElement; init: (target: HTMLCanvasElement | WebGL2RenderingContext) => void }, _options: Record<string, unknown>) {
      this.dom = dom;
      this.init = () => undefined;
    }
    const gl = { getExtension: () => null } as unknown as WebGL2RenderingContext;
    const profiler = new WebGLPerformanceProfiler(
      gl,
      {} as HTMLCanvasElement,
      { statsModule: { default: FakeStats }, memoryLoaded: false, lintLoaded: false },
    );
    const host = { appendChild: (element: unknown) => { appended = element; } } as unknown as HTMLElement;

    expect(profiler.mountStatsOverlay(host)).toBe(true);
    expect(appended).toBe(dom);
    expect((dom.style as CSSStyleDeclaration).position).toBe('relative');
    expect(profiler.mountStatsOverlay(null)).toBe(false);
    expect(removed).toBe(1);
  });

  it('keeps the stats overlay from covering the application and intercepting pointer input', () => {
    const style = {} as CSSStyleDeclaration;

    configureStatsOverlay({ style } as HTMLElement);

    expect(style.position).toBe('fixed');
    expect(style.top).toBe('auto');
    expect(style.left).toBe('auto');
    expect(style.right).toBe('12px');
    expect(style.bottom).toBe('12px');
    expect(style.pointerEvents).toBe('none');
  });
});
