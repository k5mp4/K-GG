import type {
  BenchmarkResult,
  EffectPerformanceSnapshot,
  PerformanceSnapshot,
  ResourcePerformanceSnapshot,
} from '../types/webglPerformance';
import { renderBridge } from './renderBridge';

type TimerQueryExtension = {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
};

type ValidationExtension = {
  disable?: () => void;
  setConfiguration?: (settings: Record<string, unknown>) => void;
};

type MemoryExtension = {
  getMemoryInfo?: () => unknown;
};

type StatsLike = {
  dom?: HTMLElement;
  init: (target: HTMLCanvasElement | WebGL2RenderingContext) => void | Promise<void>;
  begin: () => void;
  end: () => void;
  update: () => void;
  dispose?: () => void;
};

type StatsConstructor = new (options: Record<string, unknown>) => StatsLike;

export type DevelopmentTools = {
  statsModule: unknown | null;
  memoryLoaded: boolean;
  lintLoaded: boolean;
};

type QueryRecord = {
  query: WebGLQuery;
  label: string;
  frameId: number;
};

type EffectAccumulator = {
  samples: number[];
  currentMs: number | null;
  peakMs: number;
  drawCalls: number;
  renderPasses: number;
};

type BenchmarkRun = {
  startedAt: string;
  startFrameId: number;
  cpuFrameMs: number[];
  drawCalls: number[];
  renderPasses: number[];
  gpuFrameMs: number[];
  effectGpuMs: Record<string, number[]>;
  frameTarget: number;
  renderedFrames: number;
  endFrameId: number | null;
  drainFrames: number;
  rafId: number | null;
  validationBefore: boolean;
};

type SpectorLike = {
  displayUI: () => void;
  captureCanvas: (canvas: HTMLCanvasElement) => void;
  onError?: SpectorEvent;
  captureMenu?: {
    hide?: () => void;
  };
  pause?: () => void;
  timeSpy?: {
    changeSpeedRatio?: (ratio: number) => void;
  };
  noFrameTimeout?: number | ReturnType<typeof setTimeout>;
  captureNextFrames?: number;
  captureNextCommands?: number;
  capturingContext?: {
    stopCapture?: () => unknown;
  };
  stopCapture?: () => unknown;
};

type SpectorEvent = {
  add: (listener: (...args: unknown[]) => void, context?: unknown) => void;
};

type SpectorConstructor = new () => SpectorLike;

const WEBGL_VALIDATION_CONFIG = {
  throwOnError: false,
  failUnsetUniforms: true,
  // Effect Stack programs intentionally expose different subsets of the
  // shared upload contract. webgl-lint must not treat those absent locations
  // as a fatal runtime error while the active program is being switched.
  failUndefinedUniforms: false,
  warnUndefinedUniforms: false,
  maxDrawCalls: 0,
};

/**
 * Spector.js is published as a UMD/CommonJS bundle. Depending on the Vite
 * optimizer and WebView runtime, the namespace can be exposed as the module
 * itself, `default`, `SPECTOR`, or a bounded combination of those wrappers.
 * Keep the unwrapping explicit so an unavailable capture never affects the
 * regular WebGL render path.
 */
export function resolveSpectorConstructor(module: unknown): SpectorConstructor | null {
  const candidates: unknown[] = [module];
  const visited = new Set<unknown>();

  for (let index = 0; index < candidates.length && index < 6; index += 1) {
    const candidate = candidates[index];
    if (!candidate || typeof candidate !== 'object' || visited.has(candidate)) continue;
    visited.add(candidate);

    const record = candidate as Record<string, unknown>;
    if (typeof record.Spector === 'function') return record.Spector as SpectorConstructor;

    for (const key of ['default', 'SPECTOR']) {
      const nested = record[key];
      if (nested && typeof nested === 'object' && !visited.has(nested)) candidates.push(nested);
    }
  }

  return null;
}

let developmentToolsPromise: Promise<DevelopmentTools> | null = null;

export async function loadDevelopmentWebGLTools(): Promise<DevelopmentTools> {
  if (!import.meta.env.DEV) {
    return { statsModule: null, memoryLoaded: false, lintLoaded: false };
  }
  if (!developmentToolsPromise) {
    developmentToolsPromise = Promise.allSettled([
      import('stats-gl'),
      // These modules patch WebGL context discovery and must be imported before
      // getContext() is called. They remain development-only dynamic imports.
      import('webgl-memory'),
      import('webgl-lint'),
    ]).then(([stats, memory, lint]) => ({
      statsModule: stats.status === 'fulfilled' ? stats.value : null,
      memoryLoaded: memory.status === 'fulfilled',
      lintLoaded: lint.status === 'fulfilled',
    }));
  }
  return developmentToolsPromise;
}

function getStatsConstructor(module: unknown): StatsConstructor | null {
  if (!module || typeof module !== 'object') return null;
  const candidate = (module as { default?: unknown }).default;
  return typeof candidate === 'function' ? candidate as StatsConstructor : null;
}

export function configureStatsOverlay(dom: HTMLElement): void {
  Object.assign(dom.style, {
    position: 'fixed',
    top: 'auto',
    left: 'auto',
    right: '12px',
    bottom: '12px',
    zIndex: '80',
    display: 'none',
    // stats-gl's minimal mode makes the whole root clickable. The profiler
    // panel owns the controls, so the external overlay must not block Canvas
    // and editor input underneath it.
    pointerEvents: 'none',
  });
}

export function getStatsGLOptions(passTimerQuerySupported: boolean): Record<string, unknown> {
  return {
    trackFPS: true,
    // stats-gl and K-GG both use TIME_ELAPSED_EXT. Keep only one owner of
    // the query target so WebGL does not reject nested beginQuery calls.
    trackGPU: !passTimerQuerySupported,
    trackHz: false,
    logsPerSecond: 4,
    graphsPerSecond: 30,
    samplesLog: 60,
    samplesGraph: 30,
    minimal: true,
    horizontal: true,
  };
}

function readNumeric(value: unknown, keys: string[], depth = 0): number | null {
  if (depth > 2 || value === null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  }
  for (const child of Object.values(record)) {
    const nested = readNumeric(child, keys, depth + 1);
    if (nested !== null) return nested;
  }
  return null;
}

function emptyResources(): ResourcePerformanceSnapshot {
  return {
    textures: null,
    buffers: null,
    renderbuffers: null,
    framebuffers: null,
    shaders: null,
    programs: null,
    vertexArrays: null,
    memoryBytes: null,
  };
}

export class WebGLPerformanceProfiler {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly timerExtension: TimerQueryExtension | null;
  private validationExtension: ValidationExtension | null;
  private readonly memoryExtension: MemoryExtension | null;
  private readonly stats: StatsLike | null;
  private readonly listeners = new Set<() => void>();
  private readonly pendingQueries: QueryRecord[] = [];
  private readonly freeQueries: WebGLQuery[] = [];
  private readonly effects = new Map<string, EffectAccumulator>();
  private activeQuery: QueryRecord | null = null;
  private frameStartMs: number | null = null;
  private frameId = 0;
  private frameDrawCalls = 0;
  private frameRenderPasses = 0;
  private frameEffectCounters = new Map<string, { drawCalls: number; renderPasses: number }>();
  private frameGpuById = new Map<number, number>();
  private resourcePollCounter = 0;
  private resources: ResourcePerformanceSnapshot = emptyResources();
  private validationError: string | null = null;
  private validationEnabled = false;
  private benchmarkRun: BenchmarkRun | null = null;
  private benchmarkResult: BenchmarkResult | null = null;
  private readonly benchmarkGpuFramesSeen = new Set<number>();
  private snapshot: PerformanceSnapshot;
  private statsRuntimeDisabled = false;
  private validationDisabled = false;
  private externalCaptureActive = false;
  private validationBeforeExternalCapture = false;

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, tools: DevelopmentTools) {
    this.gl = gl;
    this.canvas = canvas;
    this.timerExtension = gl.getExtension('EXT_disjoint_timer_query_webgl2') as TimerQueryExtension | null;
    this.validationExtension = gl.getExtension('GMAN_debug_helper') as ValidationExtension | null;
    this.memoryExtension = gl.getExtension('GMAN_webgl_memory') as MemoryExtension | null;

    const Stats = getStatsConstructor(tools.statsModule);
    let stats: StatsLike | null = null;
    if (Stats) {
      try {
        stats = new Stats(getStatsGLOptions(this.timerExtension !== null));
        // Pass the existing context so stats-gl does not call canvas.getContext()
        // asynchronously and re-enable webgl-lint after it was disabled.
        stats.init(gl);
        if (stats.dom) {
          configureStatsOverlay(stats.dom);
        }
      } catch (error) {
        console.warn('[WebGL profiler] stats-gl initialization failed', error);
        stats = null;
      }
    }
    // Keep webgl-lint disabled during normal rendering. Validation is opt-in
    // from the profiler panel and re-enables the wrapper explicitly.
    this.disableValidationChecks();
    this.stats = stats;
    this.snapshot = {
      fps: null,
      cpuFrameMs: null,
      gpuFrameMs: null,
      drawCalls: 0,
      renderPasses: 0,
      effects: {},
      resources: this.resources,
      timerQuerySupported: this.timerExtension !== null,
      validationAvailable: this.validationExtension !== null,
      validationEnabled: false,
      validationError: null,
      benchmarkStatus: 'idle',
      benchmark: null,
    };
  }

  getSnapshot(): PerformanceSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setStatsVisible(visible: boolean): void {
    if (this.stats?.dom) this.stats.dom.style.display = visible ? 'block' : 'none';
  }

  hasStatsOverlay(): boolean {
    return this.stats?.dom !== undefined;
  }

  mountStatsOverlay(target: HTMLElement | null): boolean {
    const dom = this.stats?.dom;
    if (!dom) return false;
    if (!target) {
      dom.remove();
      configureStatsOverlay(dom);
      return false;
    }
    target.appendChild(dom);
    Object.assign(dom.style, {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      zIndex: 'auto',
      width: '100%',
      display: 'block',
      pointerEvents: 'none',
    });
    return true;
  }

  private runStats(action: (stats: StatsLike) => void): void {
    if (!this.stats || this.statsRuntimeDisabled) return;
    try {
      action(this.stats);
    } catch (error) {
      this.statsRuntimeDisabled = true;
      this.stats.dispose?.();
      console.warn('[WebGL profiler] stats-gl disabled after a runtime error', error);
    }
  }

  setValidationEnabled(enabled: boolean): void {
    if (enabled) {
      // webgl-lint's disable() removes the context wrappers. Asking the
      // canvas for its existing context re-applies them when validation is
      // explicitly enabled again.
      this.canvas.getContext('webgl2');
      this.validationExtension = this.gl.getExtension('GMAN_debug_helper') as ValidationExtension | null;
      this.validationDisabled = false;
    }
    if (!this.validationExtension) return;
    this.validationEnabled = enabled;
    if (enabled) {
      this.validationExtension.setConfiguration?.(WEBGL_VALIDATION_CONFIG);
    } else {
      this.disableValidationChecks();
    }
    this.snapshot = { ...this.snapshot, validationEnabled: this.validationEnabled };
    this.publish();
  }

  /**
   * Spector.js temporarily hooks the same WebGL context used by the preview.
   * Stop K-GG's timer queries and validation wrapper while that hook is active
   * so neither tool observes the other's transient program/uniform state.
   */
  setExternalCaptureActive(active: boolean): void {
    if (active === this.externalCaptureActive) return;

    if (active) {
      this.validationBeforeExternalCapture = this.validationEnabled;
      this.externalCaptureActive = true;
      this.finishActiveQuery();
      this.frameStartMs = null;
      this.setValidationEnabled(false);
      return;
    }

    this.externalCaptureActive = false;
    const restoreValidation = this.validationBeforeExternalCapture;
    this.validationBeforeExternalCapture = false;
    if (restoreValidation) {
      this.setValidationEnabled(true);
    } else {
      this.snapshot = { ...this.snapshot, validationEnabled: false };
      this.publish();
    }
  }

  isExternalCaptureActive(): boolean {
    return this.externalCaptureActive;
  }

  private finishActiveQuery(): void {
    if (!this.activeQuery || !this.timerExtension) return;
    try {
      this.gl.endQuery(this.timerExtension.TIME_ELAPSED_EXT);
      this.pendingQueries.push(this.activeQuery);
    } catch {
      this.freeQueries.push(this.activeQuery.query);
    }
    this.activeQuery = null;
  }

  private disableValidationChecks(): void {
    const activeExtension = this.gl.getExtension('GMAN_debug_helper') as ValidationExtension | null;
    const extension = activeExtension ?? this.validationExtension;
    if (!extension || this.validationDisabled) return;
    this.validationExtension = extension;
    extension.disable?.();
    this.validationDisabled = true;
  }

  reportValidationError(error: unknown): void {
    this.validationError = error instanceof Error ? error.message : String(error);
    this.snapshot = { ...this.snapshot, validationError: this.validationError };
    this.publish();
  }

  beginFrame(): void {
    if (this.externalCaptureActive) return;
    if (this.frameStartMs !== null) return;
    this.pollQueries();
    this.frameId += 1;
    this.frameStartMs = performance.now();
    this.frameDrawCalls = 0;
    this.frameRenderPasses = 0;
    this.frameEffectCounters = new Map();
    this.runStats(stats => stats.begin());
  }

  endFrame(): void {
    if (this.frameStartMs === null) return;
    const cpuFrameMs = Math.max(0, performance.now() - this.frameStartMs);
    this.frameStartMs = null;
    if (this.frameGpuById.size > 240) this.frameGpuById.delete(this.frameId - 240);
    if (this.benchmarkRun) {
      this.benchmarkRun.cpuFrameMs.push(cpuFrameMs);
      this.benchmarkRun.drawCalls.push(this.frameDrawCalls);
      this.benchmarkRun.renderPasses.push(this.frameRenderPasses);
      this.benchmarkRun.renderedFrames += 1;
      if (this.benchmarkRun.renderedFrames >= this.benchmarkRun.frameTarget) {
        this.benchmarkRun.endFrameId = this.frameId;
      }
    }
    this.runStats(stats => stats.end());
    this.runStats(stats => stats.update());
    this.refreshSnapshot(cpuFrameMs);
  }

  beginPass(label: string): void {
    if (this.externalCaptureActive) return;
    this.frameRenderPasses += 1;
    const effect = this.frameEffectCounters.get(label) ?? { drawCalls: 0, renderPasses: 0 };
    effect.renderPasses += 1;
    this.frameEffectCounters.set(label, effect);
    if (!this.timerExtension || this.activeQuery) return;
    const query = this.freeQueries.pop() ?? this.gl.createQuery();
    if (!query) return;
    try {
      this.gl.beginQuery(this.timerExtension.TIME_ELAPSED_EXT, query);
      this.activeQuery = { query, label, frameId: this.frameId };
    } catch (error) {
      this.freeQueries.push(query);
      this.reportValidationError(error);
    }
  }

  recordDraw(label: string): void {
    if (this.externalCaptureActive) return;
    this.frameDrawCalls += 1;
    const effect = this.frameEffectCounters.get(label) ?? { drawCalls: 0, renderPasses: 0 };
    effect.drawCalls += 1;
    this.frameEffectCounters.set(label, effect);
  }

  endPass(): void {
    if (this.externalCaptureActive) return;
    if (!this.activeQuery || !this.timerExtension) return;
    try {
      this.gl.endQuery(this.timerExtension.TIME_ELAPSED_EXT);
      this.pendingQueries.push(this.activeQuery);
      this.activeQuery = null;
      if (this.pendingQueries.length > 64) {
        const stale = this.pendingQueries.shift();
        if (stale) this.gl.deleteQuery(stale.query);
      }
    } catch (error) {
      this.reportValidationError(error);
      this.activeQuery = null;
    }
  }

  refreshResources(): void {
    if (this.externalCaptureActive) return;
    if (!this.memoryExtension?.getMemoryInfo) return;
    try {
      const info = this.memoryExtension.getMemoryInfo();
      const record = info && typeof info === 'object' ? info as Record<string, unknown> : {};
      const resourceInfo = record.resources ?? info;
      const memoryInfo = record.memory ?? info;
      this.resources = {
        textures: readNumeric(resourceInfo, ['texture', 'numTextures', 'textureCount', 'textures']),
        buffers: readNumeric(resourceInfo, ['buffer', 'numBuffers', 'bufferCount', 'buffers']),
        renderbuffers: readNumeric(resourceInfo, ['renderbuffer', 'numRenderbuffers', 'renderbufferCount', 'renderbuffers']),
        framebuffers: readNumeric(resourceInfo, ['framebuffer', 'numFramebuffers', 'framebufferCount', 'framebuffers']),
        shaders: readNumeric(resourceInfo, ['shader', 'numShaders', 'shaderCount', 'shaders']),
        programs: readNumeric(resourceInfo, ['program', 'numPrograms', 'programCount', 'programs']),
        vertexArrays: readNumeric(resourceInfo, ['vertexArray', 'numVertexArrays', 'vertexArrayCount', 'vertexArrays']),
        memoryBytes: readNumeric(memoryInfo, ['total', 'memoryBytes', 'totalBytes', 'bytes']),
      };
      this.snapshot = { ...this.snapshot, resources: { ...this.resources } };
      this.publish();
    } catch (error) {
      this.reportValidationError(error);
    }
  }

  startBenchmark(renderFrame: () => void, frameTarget = 300): void {
    if (this.benchmarkRun || frameTarget <= 0) return;
    const validationBefore = this.validationEnabled;
    this.setValidationEnabled(false);
    this.benchmarkResult = null;
    this.benchmarkGpuFramesSeen.clear();
    this.benchmarkRun = {
      startedAt: new Date().toISOString(),
      startFrameId: this.frameId + 1,
      cpuFrameMs: [],
      drawCalls: [],
      renderPasses: [],
      gpuFrameMs: [],
      effectGpuMs: {},
      frameTarget,
      renderedFrames: 0,
      endFrameId: null,
      drainFrames: 0,
      rafId: null,
      validationBefore,
    };
    this.snapshot = {
      ...this.snapshot,
      validationEnabled: this.validationEnabled,
      benchmarkStatus: 'running',
      benchmark: null,
    };
    this.publish();
    const tick = () => {
      const run = this.benchmarkRun;
      if (!run) return;
      if (run.renderedFrames >= run.frameTarget) {
        run.endFrameId = run.endFrameId ?? this.frameId;
        this.scheduleBenchmarkDrain();
        return;
      }
      try {
        renderFrame();
      } catch (error) {
        this.reportValidationError(error);
        this.finishBenchmark();
        return;
      }
      if (run.endFrameId !== null) {
        run.rafId = null;
        this.scheduleBenchmarkDrain();
      } else {
        run.rafId = requestAnimationFrame(tick);
      }
    };
    this.benchmarkRun.rafId = requestAnimationFrame(tick);
  }

  cancelBenchmark(): void {
    const run = this.benchmarkRun;
    if (!run) return;
    if (run.rafId !== null) cancelAnimationFrame(run.rafId);
    this.benchmarkRun = null;
    this.validationEnabled = run.validationBefore;
    if (this.validationEnabled) {
      this.validationExtension?.setConfiguration?.(WEBGL_VALIDATION_CONFIG);
    } else {
      this.validationExtension?.disable?.();
    }
    this.snapshot = {
      ...this.snapshot,
      validationEnabled: this.validationEnabled,
      benchmarkStatus: this.benchmarkResult ? 'complete' : 'idle',
      benchmark: this.benchmarkResult,
    };
    this.publish();
  }

  dispose(): void {
    this.cancelBenchmark();
    for (const record of this.pendingQueries) this.gl.deleteQuery(record.query);
    for (const query of this.freeQueries) this.gl.deleteQuery(query);
    this.pendingQueries.length = 0;
    this.freeQueries.length = 0;
    this.stats?.dispose?.();
    this.stats?.dom?.remove();
    this.listeners.clear();
  }

  private scheduleBenchmarkDrain(): void {
    const run = this.benchmarkRun;
    if (!run || run.rafId !== null) return;
    run.rafId = requestAnimationFrame(() => {
      run.rafId = null;
      this.pollQueries();
      run.drainFrames += 1;
      if (this.pendingQueries.length === 0 || run.drainFrames >= 60) {
        this.finishBenchmark();
      } else {
        this.scheduleBenchmarkDrain();
      }
    });
  }

  private finishBenchmark(): void {
    const run = this.benchmarkRun;
    if (!run) return;
    if (run.rafId !== null) cancelAnimationFrame(run.rafId);
    const averageCpu = averageNumbers(run.cpuFrameMs);
    const averageGpu = averageNumbers(run.gpuFrameMs);
    const result: BenchmarkResult = {
      frameCount: run.renderedFrames,
      averageFps: averageCpu === null || averageCpu <= 0 ? null : 1000 / averageCpu,
      averageCpuFrameMs: averageCpu,
      averageGpuFrameMs: averageGpu,
      peakFrameMs: run.cpuFrameMs.length > 0 ? Math.max(...run.cpuFrameMs) : null,
      onePercentLowFrameMs: onePercentLowFrameMs(run.cpuFrameMs),
      averageDrawCalls: averageNumbers(run.drawCalls),
      averageRenderPasses: averageNumbers(run.renderPasses),
      effectAverageGpuMs: Object.fromEntries(Object.entries(run.effectGpuMs).map(([label, values]) => [label, averageNumbers(values) ?? 0])),
      resources: { ...this.resources },
      startedAt: run.startedAt,
      completedAt: new Date().toISOString(),
    };
    this.benchmarkResult = result;
    this.validationEnabled = run.validationBefore;
    if (this.validationEnabled) {
      this.validationExtension?.setConfiguration?.({ throwOnError: false, failUnsetUniforms: true, maxDrawCalls: 0 });
    }
    this.benchmarkRun = null;
    this.snapshot = {
      ...this.snapshot,
      validationEnabled: this.validationEnabled,
      benchmarkStatus: 'complete',
      benchmark: this.benchmarkResult,
    };
    this.publish();
  }

  private pollQueries(): void {
    if (!this.timerExtension) return;
    if (this.gl.getParameter(this.timerExtension.GPU_DISJOINT_EXT)) {
      while (this.pendingQueries.length > 0) {
        const record = this.pendingQueries.shift();
        if (record) this.freeQueries.push(record.query);
      }
      return;
    }
    for (let i = this.pendingQueries.length - 1; i >= 0; i -= 1) {
      const record = this.pendingQueries[i];
      if (!record) continue;
      let available = false;
      try {
        available = Boolean(this.gl.getQueryParameter(record.query, this.gl.QUERY_RESULT_AVAILABLE));
      } catch {
        available = false;
      }
      if (!available) continue;
      this.pendingQueries.splice(i, 1);
      try {
        const nanoseconds = Number(this.gl.getQueryParameter(record.query, this.gl.QUERY_RESULT));
        const durationMs = nanoseconds / 1_000_000;
        if (Number.isFinite(durationMs) && durationMs >= 0) this.recordGpuResult(record, durationMs);
      } catch (error) {
        this.reportValidationError(error);
      }
      this.freeQueries.push(record.query);
    }
    const run = this.benchmarkRun;
    if (run) {
      for (const [frameId, durationMs] of this.frameGpuById) {
        if (frameId < run.startFrameId || frameId > (run.endFrameId ?? Number.POSITIVE_INFINITY) || this.benchmarkGpuFramesSeen.has(frameId)) continue;
        this.benchmarkGpuFramesSeen.add(frameId);
        run.gpuFrameMs.push(durationMs);
      }
    }
  }

  private recordGpuResult(record: QueryRecord, durationMs: number): void {
    const effect = this.effects.get(record.label) ?? { samples: [], currentMs: null, peakMs: 0, drawCalls: 0, renderPasses: 0 };
    effect.samples.push(durationMs);
    if (effect.samples.length > 60) effect.samples.shift();
    effect.currentMs = durationMs;
    effect.peakMs = Math.max(effect.peakMs, durationMs);
    const frameCounter = this.frameEffectCounters.get(record.label);
    effect.drawCalls = frameCounter?.drawCalls ?? effect.drawCalls;
    effect.renderPasses = frameCounter?.renderPasses ?? effect.renderPasses;
    this.effects.set(record.label, effect);
    this.frameGpuById.set(record.frameId, (this.frameGpuById.get(record.frameId) ?? 0) + durationMs);
    const run = this.benchmarkRun;
    if (run && record.frameId >= run.startFrameId && (run.endFrameId === null || record.frameId <= run.endFrameId)) {
      const samples = run.effectGpuMs[record.label] ?? [];
      samples.push(durationMs);
      run.effectGpuMs[record.label] = samples;
    }
      this.publish();
    }

  private refreshSnapshot(cpuFrameMs: number): void {
    this.resourcePollCounter += 1;
    if (this.resourcePollCounter >= 15) {
      this.resourcePollCounter = 0;
      this.refreshResources();
    }
    const effects: Record<string, EffectPerformanceSnapshot> = Object.fromEntries([...this.effects.entries()].map(([label, value]) => [label, {
      currentMs: value.currentMs,
      averageMs: averageNumbers(value.samples),
      peakMs: value.peakMs,
      ratio: null,
      drawCalls: value.drawCalls,
      renderPasses: value.renderPasses,
    } satisfies EffectPerformanceSnapshot]));
    const totalAverage = Object.values(effects).reduce((sum, item) => sum + (item.averageMs ?? 0), 0);
    for (const item of Object.values(effects)) item.ratio = totalAverage > 0 && item.averageMs !== null ? item.averageMs / totalAverage : null;
    const gpuSamples = [...this.frameGpuById.values()].slice(-60);
    const cpuSamples = gpuSamples.length > 0 ? gpuSamples : [cpuFrameMs];
    this.snapshot = {
      fps: cpuFrameMs > 0 ? 1000 / cpuFrameMs : null,
      cpuFrameMs,
    gpuFrameMs: averageNumbers(cpuSamples),
      drawCalls: this.frameDrawCalls,
      renderPasses: this.frameRenderPasses,
      effects,
      resources: { ...this.resources },
      timerQuerySupported: this.timerExtension !== null,
      validationAvailable: this.validationExtension !== null,
      validationEnabled: this.validationEnabled,
      validationError: this.validationError,
      benchmarkStatus: this.benchmarkRun ? 'running' : this.benchmarkResult ? 'complete' : 'idle',
      benchmark: this.benchmarkResult,
    };
    this.publish();
  }

  private publish(): void {
    for (const listener of this.listeners) listener();
  }
}

export function createWebGLPerformanceProfiler(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  tools: DevelopmentTools,
): WebGLPerformanceProfiler | null {
  if (!import.meta.env.DEV) return null;
  return new WebGLPerformanceProfiler(gl, canvas, tools);
}

let activeSpector: SpectorLike | null = null;
let activeCaptureProfiler: WebGLPerformanceProfiler | null = null;
let activeCaptureProfilerRequest = 0;
let spectorCaptureRequest = 0;
let pendingSpectorKickoffFrame: number | null = null;

export const WEBGL_SPECTOR_CAPTURE_STATE_EVENT = 'kgg:webgl-spector-capture-state';

function publishSpectorCaptureState(active: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WEBGL_SPECTOR_CAPTURE_STATE_EVENT, {
    detail: { active },
  }));
}

export function isWebGLFrameCaptureActive(): boolean {
  return Boolean(activeSpector || activeCaptureProfiler || activeCaptureProfilerRequest !== 0);
}

/**
 * Spector.js 0.9.x has stopCapture(), but an empty capture makes that method
 * schedule another frame instead of cancelling. Clear that retry state and
 * ask the capture menu to hide so the application's Effect Stack remains
 * usable; the K-GG Profiler dock remains available even when Spector rebuilds
 * its menu DOM.
 * The fields are part of Spector's runtime object because the package does
 * not expose a public cancel API.
 */
export function cancelSpectorCaptureRuntime(spector: SpectorLike): void {
  if (pendingSpectorKickoffFrame !== null) {
    cancelAnimationFrame(pendingSpectorKickoffFrame);
    pendingSpectorKickoffFrame = null;
  }
  const runtime = spector as SpectorLike;
  try {
    runtime.pause?.();
  } catch {
    // Cancellation is best-effort; cleanup below still restores the preview.
  }

  if (runtime.noFrameTimeout != null && runtime.noFrameTimeout !== -1) {
    clearTimeout(runtime.noFrameTimeout as ReturnType<typeof setTimeout>);
    runtime.noFrameTimeout = -1;
  }

  try {
    runtime.capturingContext?.stopCapture?.();
  } catch {
    // A context spy can already be detached when the timeout fired.
  }
  runtime.capturingContext = undefined;
  runtime.captureNextFrames = 0;
  runtime.captureNextCommands = 0;
  runtime.timeSpy?.changeSpeedRatio?.(1);
  runtime.captureMenu?.hide?.();
  // Keep the cleanup working across Spector builds that keep the menu object
  // private or render a second menu root after displayUI().
  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLElement>('.captureMenuComponent, .captureMenuLogComponent').forEach(element => element.remove());
  }
}

export function scheduleSpectorCaptureKickoff(
  requestId: number,
  spector: unknown,
  isCurrentCapture: () => boolean = () => requestId === spectorCaptureRequest && activeSpector === spector,
  renderCaptureKickoff: () => void = () => {
    renderBridge.renderAtTime(
      renderBridge.getCurrentTime(),
      renderBridge.getCurrentNormalizedTime(),
    );
  },
): void {
  if (typeof requestAnimationFrame !== 'function') return;
  pendingSpectorKickoffFrame = requestAnimationFrame(() => {
    pendingSpectorKickoffFrame = null;
    if (!isCurrentCapture()) return;

    // Spector starts recording at the beginning of an intercepted RAF. K-GG
    // intentionally does not run a RAF while a static preview is unchanged,
    // so issue one normal preview render inside this capture-start frame.
    renderCaptureKickoff();
  });
}

function releaseExternalCaptureProfiler(): void {
  const profiler = activeCaptureProfiler;
  activeCaptureProfiler = null;
  activeCaptureProfilerRequest = 0;
  profiler?.setExternalCaptureActive(false);
}

export function cancelWebGLFrame(): boolean {
  spectorCaptureRequest += 1;
  const spector = activeSpector;
  const hadCapture = Boolean(spector || activeCaptureProfiler || activeCaptureProfilerRequest !== 0);
  if (!spector) {
    releaseExternalCaptureProfiler();
    if (hadCapture) publishSpectorCaptureState(false);
    return hadCapture;
  }
  activeSpector = null;
  cancelSpectorCaptureRuntime(spector);
  releaseExternalCaptureProfiler();
  publishSpectorCaptureState(false);
  return hadCapture;
}

export async function captureWebGLFrame(
  canvas: HTMLCanvasElement,
  profiler: WebGLPerformanceProfiler | null = null,
): Promise<boolean> {
  if (!import.meta.env.DEV) return false;
  // Repeated clicks should not leave an old context spy running in parallel.
  cancelWebGLFrame();
  const requestId = ++spectorCaptureRequest;
  profiler?.setExternalCaptureActive(true);
  activeCaptureProfiler = profiler;
  activeCaptureProfilerRequest = requestId;
  publishSpectorCaptureState(true);
  try {
    const module = await import('spectorjs') as unknown;
    if (requestId !== spectorCaptureRequest) {
      if (activeCaptureProfilerRequest === requestId) {
        releaseExternalCaptureProfiler();
        publishSpectorCaptureState(false);
      }
      return false;
    }
    const Constructor = resolveSpectorConstructor(module);
    if (!Constructor) {
      console.error('[WebGL profiler] Spector.js module did not expose SPECTOR.Spector');
      if (activeCaptureProfilerRequest === requestId) {
        releaseExternalCaptureProfiler();
        publishSpectorCaptureState(false);
      }
      return false;
    }
    const spector = new Constructor();
    spector.displayUI();
    if (requestId !== spectorCaptureRequest) {
      cancelSpectorCaptureRuntime(spector);
      if (activeCaptureProfilerRequest === requestId) {
        releaseExternalCaptureProfiler();
        publishSpectorCaptureState(false);
      }
      return false;
    }
    activeSpector = spector;
    // Keep the profiler isolated for the whole Spector session. Spector can
    // emit onError when its own capture has no frame or when the chooser
    // switches contexts; that must not release K-GG's explicit cancel action
    // before the developer has a chance to stop the Spector UI.
    spector.captureCanvas(canvas);
    scheduleSpectorCaptureKickoff(requestId, spector);
    return true;
  } catch (error) {
    console.error('[WebGL profiler] Spector.js capture failed', error);
    if (requestId === spectorCaptureRequest) {
      cancelWebGLFrame();
    } else if (activeCaptureProfilerRequest === requestId) {
      releaseExternalCaptureProfiler();
      publishSpectorCaptureState(isWebGLFrameCaptureActive());
    }
    return false;
  }
}

export function benchmarkResultJson(result: BenchmarkResult): string {
  return JSON.stringify({
    tool: 'K-GG WebGL Performance Profiler',
    version: 1,
    ...result,
  }, null, 2);
}

export function averageNumbers(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function onePercentLowFrameMs(values: number[]): number | null {
  if (values.length === 0) return null;
  const slowCount = Math.max(1, Math.ceil(values.length * 0.01));
  return averageNumbers([...values].sort((a, b) => b - a).slice(0, slowCount));
}
