export type KggE2ECapture = {
  mimeType: 'image/png';
  dataUrl: string;
  width: number;
  height: number;
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
};

export type KggE2EBridge = {
  version: 1;
  waitForWebGLReady(options?: { timeoutMs?: number }): Promise<KggE2EDiagnostics>;
  pauseAnimation(): { wasPlaying: boolean; paused: boolean };
  resumeAnimation(wasPlaying?: boolean): void;
  setNormalizedTime(normalizedTime: number): Promise<KggE2ECapture>;
  captureCanvasPng(): KggE2ECapture;
  getDiagnostics(): KggE2EDiagnostics;
  getExportState(): KggE2EExportState;
  waitForExportComplete(options?: { timeoutMs?: number }): Promise<KggE2EExportState>;
  prepareZipSmoke(): { duration: 1; fps: 24; frameCount: 24 };
};

declare global {
  interface Window {
    __KGG_E2E__?: KggE2EBridge;
  }
}
