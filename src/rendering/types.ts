export type RenderBackendKind = 'webgl2';

export interface RenderBackend {
  kind: RenderBackendKind;
  init(canvas: HTMLCanvasElement): Promise<void>;
  dispose(): void;
}
