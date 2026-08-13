export const KGG_CONTROL_PROTOCOL_VERSION = '0.1.0' as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ParameterValue = JsonValue;

export type ParameterDefinition = {
  path: string;
  target: string;
  property: string;
  type: 'number' | 'boolean' | 'string' | 'enum';
  writable: boolean;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  angleUnit?: 'degrees' | 'radians';
  wrapAngle?: boolean;
  enumValues?: readonly string[];
  description: string;
};

export type EffectKind =
  | 'noise'
  | 'slit'
  | 'stretch'
  | 'distort'
  | 'mirror'
  | 'kaleidoscope'
  | 'voronoi'
  | 'glass'
  | 'diffuse';

export type EffectState = {
  kind: EffectKind;
  enabled: boolean;
  index: number;
};

export type RendererState = {
  ready: boolean;
  width: number;
  height: number;
  contextLost: boolean;
};

/**
 * The app owns the concrete Zustand snapshot type. This boundary deliberately
 * keeps it JSON-shaped so the MCP process never imports React/Tauri/WebGL code.
 */
export type ControlSnapshot = {
  store: Record<string, unknown>;
  currentTime: number;
  presetName: string;
};

export type RuntimeState = {
  snapshot: ControlSnapshot;
  renderer: RendererState;
  effects: EffectState[];
};

export type RuntimeError = {
  code: string;
  message: string;
  details?: JsonValue;
};

export type RuntimeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: RuntimeError };

export type ScenarioCommand =
  | { type: 'setParameter'; path: string; value: ParameterValue }
  | { type: 'enableEffect'; kind: EffectKind; enabled: boolean }
  | { type: 'reorderEffect'; kind: EffectKind; targetIndex: number }
  | { type: 'resetEffect'; kind?: EffectKind }
  | { type: 'captureSnapshot'; snapshotId?: string }
  | { type: 'restoreSnapshot'; snapshotId: string }
  | { type: 'control'; operationId: string; input: Record<string, unknown> }
  | { type: 'wait'; milliseconds: number };

export type RuntimeRequest = {
  requestId: string;
  method: string;
  params?: Record<string, unknown>;
  /** Absolute client-side deadline supplied by the Runtime Bridge. */
  deadlineAt?: number;
};

export type RuntimeResponse = {
  requestId: string;
  result: RuntimeResult<unknown>;
};

export type PreviewCapture = {
  mimeType: 'image/png' | 'image/webp';
  dataUrl: string;
  width: number;
  height: number;
};

export type ShaderError = {
  timestamp: string;
  stage: 'vertex' | 'fragment' | 'link' | 'runtime';
  program: string;
  message: string;
};
