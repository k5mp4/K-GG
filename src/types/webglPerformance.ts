export type PerformanceTab = 'performance' | 'gpu' | 'resources' | 'validation' | 'capture' | 'benchmark';

export type EffectPerformanceSnapshot = {
  currentMs: number | null;
  averageMs: number | null;
  peakMs: number;
  ratio: number | null;
  drawCalls: number;
  renderPasses: number;
};

export type ResourcePerformanceSnapshot = {
  textures: number | null;
  buffers: number | null;
  renderbuffers: number | null;
  framebuffers: number | null;
  shaders: number | null;
  programs: number | null;
  vertexArrays: number | null;
  memoryBytes: number | null;
};

export type BenchmarkStatus = 'idle' | 'running' | 'complete';

export type BenchmarkResult = {
  frameCount: number;
  averageFps: number | null;
  averageCpuFrameMs: number | null;
  averageGpuFrameMs: number | null;
  peakFrameMs: number | null;
  onePercentLowFrameMs: number | null;
  averageDrawCalls: number | null;
  averageRenderPasses: number | null;
  effectAverageGpuMs: Record<string, number>;
  resources: ResourcePerformanceSnapshot;
  startedAt: string;
  completedAt: string;
};

export type PerformanceSnapshot = {
  fps: number | null;
  cpuFrameMs: number | null;
  gpuFrameMs: number | null;
  drawCalls: number;
  renderPasses: number;
  effects: Record<string, EffectPerformanceSnapshot>;
  resources: ResourcePerformanceSnapshot;
  timerQuerySupported: boolean;
  validationAvailable: boolean;
  validationEnabled: boolean;
  validationError: string | null;
  benchmarkStatus: BenchmarkStatus;
  benchmark: BenchmarkResult | null;
};
