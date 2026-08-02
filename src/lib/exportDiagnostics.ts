export type ExportPlanDiagnostics = {
  effectStack: string[];
  requiredPrograms: string[];
  readyPrograms: string[];
  glassFallback: boolean;
  glassV2Fallback: boolean;
  canvasSize: [number, number];
  tilePadding: number;
};

type DiagnosticGlobal = typeof globalThis & {
  __KGG_EXPORT_DIAGNOSTICS__?: boolean;
};

let activeSessionId: number | null = null;
let activeFrameIndex: number | null = null;
let activeSequence: number | null = null;
let nextObjectId = 1;
const objectIds = new WeakMap<object, number>();

export function exportDiagnosticsEnabled(): boolean {
  return import.meta.env.DEV
    && (globalThis as DiagnosticGlobal).__KGG_EXPORT_DIAGNOSTICS__ === true;
}

function objectId(value: object | null): number | null {
  if (!value) return null;
  const existing = objectIds.get(value);
  if (existing) return existing;
  const id = nextObjectId++;
  objectIds.set(value, id);
  return id;
}

function log(event: string, detail: Record<string, unknown>): void {
  if (!exportDiagnosticsEnabled()) return;
  console.debug('[K-GG export diagnostics]', {
    event,
    sessionId: activeSessionId,
    frameIndex: activeFrameIndex,
    renderSequence: activeSequence,
    at: performance.now(),
    ...detail,
  });
}

export function beginExportDiagnostics(sessionId: number, plan?: ExportPlanDiagnostics): void {
  activeSessionId = sessionId;
  activeFrameIndex = null;
  activeSequence = null;
  log('session-begin', { plan });
}

export function beginExportFrameDiagnostics(
  frameIndex: number,
  normalizedTime: number,
  renderTime: number,
): void {
  activeFrameIndex = frameIndex;
  activeSequence = null;
  log('frame-begin', { normalizedTime, renderTime });
}

export function setExportRenderSequenceDiagnostics(sequence: number): void {
  activeSequence = sequence;
  log('render-complete', {});
}

export function recordExportCaptureDiagnostics(phase: 'begin' | 'end'): void {
  log(`capture-${phase}`, {});
}

export function recordGlassPassDiagnostics(options: {
  effectMode: 'glass' | 'glassV2';
  program: WebGLProgram | null;
  sourceTexture: WebGLTexture;
  destinationFramebuffer: WebGLFramebuffer | null;
  destinationTexture: WebGLTexture | null;
  viewport: [number, number];
  activeTexture: number;
  sourceSamplerUnit: number;
  framebufferStatus: number | null;
  glError: number;
  fallback: boolean;
}): void {
  log('glass-pass', {
    effectMode: options.effectMode,
    programId: objectId(options.program),
    sourceTextureId: objectId(options.sourceTexture),
    destinationFramebufferId: objectId(options.destinationFramebuffer),
    destinationTextureId: objectId(options.destinationTexture),
    viewport: options.viewport,
    activeTexture: options.activeTexture,
    sourceSamplerUnit: options.sourceSamplerUnit,
    framebufferStatus: options.framebufferStatus,
    glError: options.glError,
    fallback: options.fallback,
  });
}

export function endExportDiagnostics(): void {
  log('session-end', {});
  activeSessionId = null;
  activeFrameIndex = null;
  activeSequence = null;
}
