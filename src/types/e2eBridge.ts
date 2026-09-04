export type KggE2ECapture = {
  mimeType: 'image/png';
  dataUrl: string;
  width: number;
  height: number;
};

export type KggE2ERgbaCapture = {
  format: 'rgba8';
  source: 'webgl-readPixels';
  rowOrder: 'top-to-bottom';
  mimeType: 'application/octet-stream';
  dataBase64: string;
  width: number;
  height: number;
  byteLength: number;
};

export type KggE2ERenderContract = {
  schemaVersion: 1;
  id: string;
  preset: string;
  resolution: { width: number; height: number };
  times: number[];
  seeds: { noise: number; diffuse: number; stretch: number; flow: number };
  paths: string[];
};

export type KggE2EResourceLifecycleResult = {
  iterations: Array<{
    index: number;
    canvas: { width: number; height: number };
    resources: unknown;
  }>;
  restoredCanvas: { width: number; height: number };
  disposeEvents: unknown[];
};

export type KggE2EContextLifecycleResult = {
  lost: true;
  restored: true;
  diagnostics: KggE2EDiagnostics;
};

export type KggE2EExportState = {
  active: boolean;
  currentTime: number;
  currentNormalizedTime: number;
};

export type KggE2EDiagnostics = {
  bridgeVersion: 1;
  canvas: { width: number; height: number };
  webgl: {
    rendererReady: boolean;
    contextLost: boolean;
    hasPresentedFrame: boolean;
    gpu: unknown;
  };
  render: unknown;
  export: KggE2EExportState;
  resourceEvents: unknown[];
};

export type KggE2EBridge = {
  version: 1;
  waitForWebGLReady(options?: { timeoutMs?: number }): Promise<KggE2EDiagnostics>;
  pauseAnimation(): { wasPlaying: boolean; paused: boolean };
  resumeAnimation(wasPlaying?: boolean): void;
  setNormalizedTime(normalizedTime: number): Promise<KggE2ECapture>;
  captureCanvasPng(): KggE2ECapture;
  captureCanvasRgba(): KggE2ERgbaCapture;
  getRenderContract(): KggE2ERenderContract;
  getRenderCondition(): unknown;
  prepareRenderContract(): Promise<KggE2EDiagnostics>;
  getDiagnostics(): KggE2EDiagnostics;
  getExportState(): KggE2EExportState;
  waitForExportComplete(options?: { timeoutMs?: number }): Promise<KggE2EExportState>;
  prepareZipSmoke(): { duration: 1; fps: 24; frameCount: 24 };
  exerciseResourceLifecycle(): Promise<KggE2EResourceLifecycleResult>;
  loseAndRestoreContext(options?: { timeoutMs?: number }): Promise<KggE2EContextLifecycleResult>;
};

declare global {
  interface Window {
    __KGG_E2E__?: KggE2EBridge;
    __KGG_WEBGL_RESOURCE_EVENTS__?: unknown[];
  }
}
