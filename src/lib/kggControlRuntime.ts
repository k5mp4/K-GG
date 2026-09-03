import {
  CONTROL_GROUP_DEFINITIONS,
  getControlOperationDefinition,
  getParameterDefinition,
  isControlGroup,
  isJsonValue,
  listControlOperationDefinitions,
  listParameterDefinitions,
  validateScenario,
  validateParameterValue,
  type ControlSnapshot,
  type ControlGroup,
  type EffectState,
  type ParameterDefinition,
  type ParameterValue,
  type PreviewCapture,
  type RuntimeError,
  type RuntimeResult,
  type RuntimeState,
  type ScenarioCommand,
} from '../../packages/kgg-control/src/index';
import { GRADIENT_ANCHOR_DEFAULTS } from '../store/documentModel';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import {
  createDefaultEffectPipeline,
  isEffectStackKind,
  moveEffectStackLayer,
  normalizeEffectStack,
  updateEffectStackLayer,
} from './effectPipeline';
import type { WebGLContext } from './webgl';
import { renderBridge } from './renderBridge';
import { getShaderErrors } from './shaderDiagnostics';
import type { ColorStop, GradientConfig, MeshEdge, OpacityStop, Vec2Tuple } from '../types/gradient';
import type { AnimationMode, InterpolationType, Keyframe } from '../types/keyframe';

type StoreState = ReturnType<typeof useGradientStore.getState>;
type OptionalFlowStoreState = StoreState & {
  flowGradient?: Record<string, unknown>;
  setFlowGradient?: (value: Record<string, unknown>) => void;
};

export type KggControlRuntimeOptions = {
  canvas: HTMLCanvasElement;
  getWebGLContext: () => WebGLContext | null;
  ui?: KggControlUiAdapter;
  project?: KggControlProjectAdapter;
};

export type KggControlUiAdapter = {
  getState: () => Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
  resetViewport?: () => void;
  requestApproval?: (request: {
    operationId: string;
    input: Record<string, unknown>;
  }) => boolean | Promise<boolean>;
};

export type KggControlProjectAdapter = {
  listPresets?: () => unknown | Promise<unknown>;
  getPreset?: (presetId: string) => unknown | Promise<unknown>;
  savePreset?: (name: string, state: Record<string, unknown>, folderId: string | null, thumbnail?: string) => unknown | Promise<unknown>;
  deletePreset?: (presetId: string) => unknown | Promise<unknown>;
  exportPresetPackage?: (scope: { kind: 'preset' | 'folder' | 'library'; id?: string }) => unknown | Promise<unknown>;
  listPalettes?: () => unknown | Promise<unknown>;
  getPalette?: (paletteId: string) => unknown | Promise<unknown>;
  savePalette?: (name: string, stops: ColorStop[]) => unknown | Promise<unknown>;
  deletePalette?: (paletteId: string) => unknown | Promise<unknown>;
};

type SerializableStore = ControlSnapshot['store'];

function cloneSerializable<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function error(code: string, message: string): RuntimeResult<never> {
  const runtimeError: RuntimeError = { code, message };
  return { ok: false, error: runtimeError };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

const CONTROL_PAYLOAD_MAX_BYTES = 4 * 1024 * 1024;
const MCP_MAX_CANVAS_DIMENSION = 4_096;
const MCP_MAX_PREVIEW_PIXELS = 16_777_216;
const MCP_MAX_PREVIEW_DATA_URL_CHARS = 12 * 1024 * 1024;
const UI_CONTROL_KEYS = new Set([
  'canvasW', 'canvasH', 'lockAspect', 'renderViewMode', 'leftTab',
  'tabHoverSwitchEnabled', 'isHoverLocked', 'showTimeline', 'showTimeRemap',
  'timelineHeight', 'leftPanelOpen', 'rightPanelOpen', 'showLeftSidebar',
  'showRightSidebar', 'showGradientRamp', 'showOverlaySettings',
  'showImageGradientSource', 'showGradientAnchors', 'overlayImageMode',
  'overlayOpacity', 'zoom', 'pan', 'leftPanelW', 'rightPanelW',
  'showHelp', 'showFeedback', 'showPropertyModulesSettings',
]);

function isSafeControlPayload(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value) || !isJsonValue(value)) return false;
  try {
    return JSON.stringify(value).length <= CONTROL_PAYLOAD_MAX_BYTES;
  } catch {
    return false;
  }
}

const MAX_CONTROL_STRING_LENGTH = 4_096;
const MAX_CONTROL_ARRAY_ITEMS = 4_096;
const MAX_MANUAL_DISTORT_RESOLUTION = 512;
const MAX_MANUAL_DISTORT_ARRAY_ITEMS = MAX_MANUAL_DISTORT_RESOLUTION * MAX_MANUAL_DISTORT_RESOLUTION * 2;

function validateNestedControlValue(value: unknown, path: string, depth = 0, arrayLimit = MAX_CONTROL_ARRAY_ITEMS): string | null {
  if (depth > 12) return `${path} is nested too deeply`;
  if (value === null || typeof value === 'boolean') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? null : `${path} must contain finite numbers`;
  if (typeof value === 'string') return value.length <= MAX_CONTROL_STRING_LENGTH ? null : `${path} contains an overly long string`;
  if (Array.isArray(value)) {
    if (value.length > arrayLimit) return `${path} contains too many items`;
    for (const [index, item] of value.entries()) {
      const issue = validateNestedControlValue(item, `${path}[${index}]`, depth + 1, arrayLimit);
      if (issue) return issue;
    }
    return null;
  }
  if (!isRecord(value)) return `${path} must be JSON-shaped`;
  if (Object.keys(value).length > 256) return `${path} contains too many fields`;
  for (const [key, item] of Object.entries(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return `${path} contains a reserved object key`;
    const issue = validateNestedControlValue(item, `${path}.${key}`, depth + 1, arrayLimit);
    if (issue) return issue;
  }
  return null;
}

function validateManualDistortField(
  group: ControlGroup,
  field: string,
  value: unknown,
  patch: Record<string, unknown>,
  current: Record<string, unknown>,
): string | null {
  if (field === 'mapResolution') {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_MANUAL_DISTORT_RESOLUTION) {
      return `${group}.mapResolution must be an integer between 1 and ${MAX_MANUAL_DISTORT_RESOLUTION}`;
    }
    return null;
  }
  if (field !== 'displacement' && field !== 'smoothMask') return null;
  const resolutionValue = patch.mapResolution ?? current.mapResolution;
  if (typeof resolutionValue !== 'number' || !Number.isInteger(resolutionValue) || resolutionValue < 1 || resolutionValue > MAX_MANUAL_DISTORT_RESOLUTION) {
    return `${group}.mapResolution must be an integer between 1 and ${MAX_MANUAL_DISTORT_RESOLUTION}`;
  }
  const expectedLength = field === 'displacement' ? resolutionValue * resolutionValue * 2 : resolutionValue * resolutionValue;
  if (!Array.isArray(value) || value.length !== expectedLength || value.length > MAX_MANUAL_DISTORT_ARRAY_ITEMS) {
    return `${group}.${field} must contain exactly ${expectedLength} finite values`;
  }
  const issue = validateNestedControlValue(value, `${group}.${field}`, 0, MAX_MANUAL_DISTORT_ARRAY_ITEMS);
  if (issue) return issue;
  if (value.some(item => typeof item !== 'number' || !Number.isFinite(item))) return `${group}.${field} must contain finite numbers`;
  if (field === 'smoothMask' && value.some(item => (item as number) < 0 || (item as number) > 8)) {
    return `${group}.smoothMask values must be between 0 and 8`;
  }
  return null;
}

function validateControlGroupPatch(
  group: ControlGroup,
  patch: Record<string, unknown>,
  current: Record<string, unknown>,
): RuntimeResult<Record<string, unknown>> {
  for (const [field, value] of Object.entries(patch)) {
    const manualIssue = (group === 'manualDistort' || group === 'postprocess')
      ? validateManualDistortField(group, field, value, patch, current)
      : null;
    if (manualIssue) return error('invalid_control_input', manualIssue);
    const definition = listParameterDefinitions().find(item => item.target === group && item.property === field);
    if (definition) {
      const validated = validateParameterValue(definition, value as ParameterValue);
      if (!validated.ok) return error('invalid_control_input', validated.message);
      continue;
    }
    const currentValue = current[field];
    if (typeof currentValue === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      return error('invalid_control_input', `${group}.${field} must be a finite number`);
    }
    if (typeof currentValue === 'boolean' && typeof value !== 'boolean') {
      return error('invalid_control_input', `${group}.${field} must be a boolean`);
    }
    if (typeof currentValue === 'string' && (typeof value !== 'string' || value.length > MAX_CONTROL_STRING_LENGTH)) {
      return error('invalid_control_input', `${group}.${field} must be a bounded string`);
    }
    const arrayLimit = (field === 'stops' || field === 'opacityStops' || field === 'effectStack') ? 64 : MAX_CONTROL_ARRAY_ITEMS;
    const issue = validateNestedControlValue(value, `${group}.${field}`, 0, arrayLimit);
    if (issue) return error('invalid_control_input', issue);
  }
  return { ok: true, value: patch };
}

function tuple2(value: unknown): Vec2Tuple | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  if (!value.every(item => typeof item === 'number' && Number.isFinite(item))) return null;
  return [value[0] as number, value[1] as number];
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(value);
}

function normalizedIndex(value: unknown, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : null;
}

function requiredString(value: unknown, field: string, maxLength = 256): RuntimeResult<string> {
  const containsControlCharacter = typeof value === 'string' && [...value].some(character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength || containsControlCharacter) {
    return error('invalid_control_input', `${field} must be a non-empty safe string of at most ${maxLength} characters`);
  }
  return { ok: true, value };
}

function cloneResultValue(value: unknown): RuntimeResult<unknown> {
  try {
    return { ok: true, value: cloneSerializable(value) };
  } catch {
    return error('non_serializable_result', 'The connected adapter returned a non-serializable value');
  }
}

function serializeStore(state: StoreState): SerializableStore {
  const optionalState = state as unknown as OptionalFlowStoreState;
  return cloneSerializable({
    gradient: state.gradient,
    noiseDistortion: state.noiseDistortion,
    diffuse: state.diffuse,
    ...(optionalState.flowGradient === undefined ? {} : { flowGradient: optionalState.flowGradient }),
    imageGradient: state.imageGradient,
    slitScan: state.slitScan,
    stretch: state.stretch,
    animation: state.animation,
    normalMap: state.normalMap,
    clothGradient: state.clothGradient,
    coneView: state.coneView,
    seamless: state.seamless,
    radon: state.radon,
    iridescence: state.iridescence,
    manualDistort: state.manualDistort,
    postprocess: state.postprocess,
    effectPipeline: state.effectPipeline,
    matcap: state.matcap,
    histogram: state.histogram,
    keyframeTracks: state.keyframeTracks,
    selectedStops: state.selectedStops,
    selectedGradientAnchors: state.selectedGradientAnchors,
    slitOverlayEnabled: state.slitOverlayEnabled,
    isSlitAdjusting: state.isSlitAdjusting,
    isGradientAnchorDragging: state.isGradientAnchorDragging,
  });
}

function makeSnapshot(state: StoreState): ControlSnapshot {
  return {
    store: serializeStore(state),
    currentTime: finiteNumber(state.currentTime, 0),
    presetName: state.presetName,
  };
}

function getStoreValue(store: SerializableStore, definition: ParameterDefinition): ParameterValue | undefined {
  const target = store[definition.target];
  return isRecord(target) ? target[definition.property] as ParameterValue : undefined;
}

function effectStates(state: StoreState): EffectState[] {
  return normalizeEffectStack(state.effectPipeline.effectStack).map((layer, index) => ({
    kind: layer.kind,
    enabled: layer.enabled,
    index,
  }));
}

function serializableDiagnostics(ctx: WebGLContext | null, canvas: HTMLCanvasElement) {
  if (!ctx) {
    return {
      rendererReady: false,
      contextLost: false,
      canvas: { width: canvas.width, height: canvas.height },
      gpu: null,
      performance: null,
      uniforms: [],
      renderPasses: [],
    };
  }

  const gl = ctx.gl;
  const uniformMaps = [
    ctx.uniforms,
    ctx.generatorUniforms,
    ctx.normalMapUniforms,
    ctx.blurUniforms,
    ctx.stretchUniforms,
    ctx.seamlessUniforms,
    ctx.postprocessUniforms,
    ctx.stackCoreUniforms,
    ctx.noiseStackUniforms,
    ctx.glassUniforms,
    ctx.glassV2Uniforms,
    ctx.prismUniforms,
    ctx.prismCompositeUniforms,
    ctx.particleUniforms,
  ];
  const uniforms = [...new Set(uniformMaps.flatMap(map => Object.keys(map)))].sort();
  const performance = ctx.performanceProfiler?.getSnapshot() ?? null;
  const renderPasses = performance
    ? Object.entries(performance.effects).map(([name, value]) => ({ name, ...value }))
    : [];

  const safeGetParameter = (parameter: number): number | string | null => {
    try {
      const value = gl.getParameter(parameter);
      return typeof value === 'number' || typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  };

  return {
    rendererReady: true,
    contextLost: gl.isContextLost(),
    canvas: { width: canvas.width, height: canvas.height },
    gpu: cloneSerializable(ctx.gpuDiagnostics),
    performance: cloneSerializable(performance),
    uniforms,
    renderPasses,
    limits: {
      maxTextureSize: safeGetParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderbufferSize: safeGetParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxCombinedTextureImageUnits: safeGetParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxFragmentUniformVectors: safeGetParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: safeGetParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    },
    lazyPrograms: Object.fromEntries(Object.entries(ctx.lazyProgramState).map(([key, state]) => [key, {
      failed: state.failed,
      timedOut: state.timedOut,
      fallback: state.fallback,
    }])),
  };
}

export class KggControlRuntime {
  private readonly canvas: HTMLCanvasElement;
  private readonly getWebGLContext: () => WebGLContext | null;
  private readonly ui: KggControlUiAdapter | null;
  private readonly project: KggControlProjectAdapter | null;
  private readonly snapshots = new Map<string, ControlSnapshot>();
  private snapshotSequence = 0;

  constructor(options: KggControlRuntimeOptions) {
    this.canvas = options.canvas;
    this.getWebGLContext = options.getWebGLContext;
    this.ui = options.ui ?? null;
    this.project = options.project ?? null;
  }

  getState(): RuntimeResult<RuntimeState> {
    const state = useGradientStore.getState();
    const ctx = this.getWebGLContext();
    return {
      ok: true,
      value: {
        snapshot: makeSnapshot(state),
        renderer: {
          ready: ctx ? !ctx.gl.isContextLost() : false,
          width: this.canvas.width,
          height: this.canvas.height,
          contextLost: ctx?.gl.isContextLost() ?? false,
        },
        effects: effectStates(state),
      },
    };
  }

  getGradientState(): RuntimeResult<Record<string, unknown>> {
    const state = useGradientStore.getState();
    const optionalState = state as unknown as OptionalFlowStoreState;
    return {
      ok: true,
      value: cloneSerializable({
        gradient: state.gradient,
        noiseDistortion: state.noiseDistortion,
        diffuse: state.diffuse,
        ...(optionalState.flowGradient === undefined ? {} : { flowGradient: optionalState.flowGradient }),
        imageGradient: state.imageGradient,
        slitScan: state.slitScan,
      }),
    };
  }

  listControls(): RuntimeResult<Record<string, unknown>> {
    const state = serializeStore(useGradientStore.getState());
    const groups = CONTROL_GROUP_DEFINITIONS.map(definition => {
      const value = definition.id === 'ui'
        ? this.ui?.getState() ?? null
        : state[definition.id];
      const fields = isRecord(value) ? Object.keys(value).sort() : [];
      return {
        ...definition,
        available: value !== null && value !== undefined,
        fields,
      };
    });
    return {
      ok: true,
      value: {
        protocolVersion: '0.1.0',
        groups,
        operations: listControlOperationDefinitions(),
        capabilities: {
          ui: this.ui !== null,
          project: this.project !== null,
          nativeFileBoundary: Boolean(this.project?.exportPresetPackage),
          humanApprovalBoundary: Boolean(this.ui?.requestApproval),
        },
        safety: {
          domReplay: false,
          arbitraryCode: false,
          arbitraryFilePath: false,
          maxPayloadBytes: CONTROL_PAYLOAD_MAX_BYTES,
        },
      },
    };
  }

  getControlState(groups?: string[]): RuntimeResult<Record<string, unknown>> {
    const state = serializeStore(useGradientStore.getState());
    const requested = groups && groups.length > 0 ? groups : CONTROL_GROUP_DEFINITIONS.map(definition => definition.id);
    const invalid = requested.find(group => !isControlGroup(group));
    if (invalid) return error('unknown_control_group', `Unknown control group: ${invalid}`);
    const values: Record<string, unknown> = {};
    for (const group of requested as ControlGroup[]) {
      const cloned = group === 'ui'
        ? cloneResultValue(this.ui?.getState() ?? null)
        : cloneResultValue(state[group]);
      if (!cloned.ok) return cloned;
      values[group] = cloned.value;
    }
    const selectedStops = cloneResultValue(useGradientStore.getState().selectedStops);
    if (!selectedStops.ok) return selectedStops;
    const selectedGradientAnchors = cloneResultValue(useGradientStore.getState().selectedGradientAnchors);
    if (!selectedGradientAnchors.ok) return selectedGradientAnchors;
    return {
      ok: true,
      value: {
        groups: values,
        currentTime: finiteNumber(useGradientStore.getState().currentTime, 0),
        presetName: useGradientStore.getState().presetName,
        selection: {
          selectedStops: selectedStops.value,
          selectedGradientAnchors: selectedGradientAnchors.value,
          slitOverlayEnabled: useGradientStore.getState().slitOverlayEnabled,
          isSlitAdjusting: useGradientStore.getState().isSlitAdjusting,
          isGradientAnchorDragging: useGradientStore.getState().isGradientAnchorDragging,
        },
      },
    };
  }

  listParameters(prefix?: string): RuntimeResult<Array<ParameterDefinition & { value: ParameterValue | undefined }>> {
    const snapshot = makeSnapshot(useGradientStore.getState());
    return {
      ok: true,
      value: listParameterDefinitions(prefix).map(definition => ({
        ...definition,
        value: getStoreValue(snapshot.store, definition),
      })),
    };
  }

  getParameter(path: string): RuntimeResult<{ definition: ParameterDefinition; value: ParameterValue | undefined }> {
    const definition = getParameterDefinition(path);
    if (!definition) return error('unknown_parameter', `Unknown parameter path: ${path}`);
    return {
      ok: true,
      value: {
        definition,
        value: getStoreValue(makeSnapshot(useGradientStore.getState()).store, definition),
      },
    };
  }

  setParameter(path: string, rawValue: ParameterValue): RuntimeResult<{ path: string; value: ParameterValue | undefined }> {
    const definition = getParameterDefinition(path);
    if (!definition) return error('unknown_parameter', `Unknown parameter path: ${path}`);
    const validated = validateParameterValue(definition, rawValue);
    if (!validated.ok) return error('invalid_parameter', validated.message);

    const patch = { [definition.property]: validated.value } as never;
    const setter = {
      gradient: applicationCommands.setGradient,
      noiseDistortion: applicationCommands.setNoiseDistortion,
      diffuse: applicationCommands.setDiffuse,
      flowGradient: applicationCommands.setFlowGradient,
      slitScan: applicationCommands.setSlitScan,
      stretch: applicationCommands.setStretch,
      animation: applicationCommands.setAnimation,
      normalMap: applicationCommands.setNormalMap,
      radon: applicationCommands.setRadon,
      iridescence: applicationCommands.setIridescence,
      postprocess: applicationCommands.setPostprocess,
    }[definition.target];
    if (!setter) return error('unsupported_parameter', `Parameter target is not writable: ${definition.target}`);
    setter(patch);
    return {
      ok: true,
      value: {
        path,
        value: getStoreValue(makeSnapshot(useGradientStore.getState()).store, definition),
      },
    };
  }

  setGradientColors(colors: string[]): RuntimeResult<{ colors: string[]; stops: Array<{ position: number; color: string }> }> {
    if (!Array.isArray(colors) || colors.length < 2 || colors.length > 16) {
      return error('invalid_gradient_colors', 'colors must contain between 2 and 16 hex colors');
    }
    if (colors.some(color => typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color))) {
      return error('invalid_gradient_colors', 'colors must be six-digit hex values such as #0066FF');
    }
    const stops = colors.map((color, index) => ({
      position: index / (colors.length - 1),
      color: color.toUpperCase(),
    }));
    applicationCommands.setGradient({ stops });
    return {
      ok: true,
      value: {
        colors: stops.map(stop => stop.color),
        stops,
      },
    };
  }

  private setControlGroup(groupValue: unknown, patchValue: unknown): RuntimeResult<unknown> {
    if (!isControlGroup(groupValue)) return error('unknown_control_group', `Unknown control group: ${String(groupValue)}`);
    if (!isSafeControlPayload(patchValue)) {
      return error('invalid_control_input', 'patch must be a JSON object within the control payload limit');
    }
    const patch = patchValue;
    if (Object.keys(patch).some(key => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
      return error('invalid_control_input', 'patch contains a reserved object key');
    }
    if (groupValue === 'ui') return this.setUiState(patch);
    if (groupValue === 'keyframeTracks') {
      return error('unsupported_control', 'keyframeTracks must be changed with set_track_mode, add_keyframe, set_keyframe, or remove_keyframe');
    }
    const state = useGradientStore.getState() as unknown as StoreState & Record<string, unknown>;
    const current = state[groupValue];
    if (!isRecord(current)) return error('unsupported_control', `Control group is not a patchable record: ${groupValue}`);
    const unknownFields = Object.keys(patch).filter(key => !Object.prototype.hasOwnProperty.call(current, key));
    if (unknownFields.length > 0) {
      return error('unknown_control_field', `Unknown field(s) for ${groupValue}: ${unknownFields.join(', ')}`);
    }
    const validatedPatch = validateControlGroupPatch(groupValue, patch, current);
    if (!validatedPatch.ok) return validatedPatch;
    const setters: Partial<Record<Exclude<ControlGroup, 'ui' | 'keyframeTracks'>, (value: never) => void>> = {
      gradient: applicationCommands.setGradient,
      noiseDistortion: applicationCommands.setNoiseDistortion,
      diffuse: applicationCommands.setDiffuse,
      imageGradient: applicationCommands.setImageGradient,
      slitScan: applicationCommands.setSlitScan,
      stretch: applicationCommands.setStretch,
      animation: applicationCommands.setAnimation,
      normalMap: applicationCommands.setNormalMap,
      clothGradient: applicationCommands.setClothGradient,
      coneView: applicationCommands.setConeView,
      seamless: applicationCommands.setSeamless,
      flowGradient: applicationCommands.setFlowGradient as ((value: never) => void),
      radon: applicationCommands.setRadon,
      iridescence: applicationCommands.setIridescence,
      manualDistort: applicationCommands.setManualDistort,
      postprocess: applicationCommands.setPostprocess,
      effectPipeline: applicationCommands.setEffectPipeline,
      matcap: applicationCommands.setMatcap,
      histogram: applicationCommands.setHistogram,
    };
    const setter = setters[groupValue];
    if (!setter) return error('unsupported_control', `Control group is not writable: ${groupValue}`);
    try {
      setter(validatedPatch.value as never);
    } catch (cause) {
      return error('control_update_failed', cause instanceof Error ? cause.message : 'Unable to update control group');
    }
    return this.getControlState([groupValue]);
  }

  private setGradientStopsInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const rawStops = input.stops;
    if (!Array.isArray(rawStops) || rawStops.length < 2 || rawStops.length > 64) {
      return error('invalid_control_input', 'stops must contain between 2 and 64 items');
    }
    const stops: ColorStop[] = [];
    for (const [index, raw] of rawStops.entries()) {
      if (!isRecord(raw) || typeof raw.position !== 'number' || !Number.isFinite(raw.position) || raw.position < 0 || raw.position > 1 || !isHexColor(raw.color)) {
        return error('invalid_control_input', `stops[${index}] requires a finite position between 0 and 1 and a hex color`);
      }
      if (raw.stopId !== undefined && (typeof raw.stopId !== 'string' || raw.stopId.length > 128)) {
        return error('invalid_control_input', `stops[${index}].stopId must be a short string`);
      }
      stops.push({
        ...(typeof raw.stopId === 'string' ? { stopId: raw.stopId } : {}),
        position: raw.position,
        color: raw.color.toUpperCase(),
      });
    }
    applicationCommands.setGradient({ stops });
    return this.getControlState(['gradient']);
  }

  private setOpacityStopsInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const rawStops = input.stops;
    if (!Array.isArray(rawStops) || rawStops.length < 2 || rawStops.length > 64) {
      return error('invalid_control_input', 'stops must contain between 2 and 64 items');
    }
    const stops: OpacityStop[] = [];
    for (const [index, raw] of rawStops.entries()) {
      if (!isRecord(raw) || typeof raw.position !== 'number' || !Number.isFinite(raw.position) || raw.position < 0 || raw.position > 1 || typeof raw.opacity !== 'number' || !Number.isFinite(raw.opacity) || raw.opacity < 0 || raw.opacity > 1) {
        return error('invalid_control_input', `stops[${index}] requires position and opacity values between 0 and 1`);
      }
      if (raw.stopId !== undefined && (typeof raw.stopId !== 'string' || raw.stopId.length > 128)) {
        return error('invalid_control_input', `stops[${index}].stopId must be a short string`);
      }
      stops.push({
        ...(typeof raw.stopId === 'string' ? { stopId: raw.stopId } : {}),
        position: raw.position,
        opacity: raw.opacity,
      });
    }
    applicationCommands.setGradient({ opacityStops: stops });
    return this.getControlState(['gradient']);
  }

  private setGradientAnchorInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const index = normalizedIndex(input.index, 3);
    const position = tuple2(input.position);
    if (index === null || !position) return error('invalid_control_input', 'index must be 0..3 and position must be a finite [x, y] tuple');
    const state = useGradientStore.getState();
    const anchors = (state.gradient.anchors ?? GRADIENT_ANCHOR_DEFAULTS[state.gradient.gradientType]).map(anchor => [...anchor]) as GradientConfig['anchors'];
    if (!anchors) return error('unsupported_control', 'Gradient anchors are not available');
    anchors[index] = position;
    applicationCommands.setGradient({ anchors });
    return this.getControlState(['gradient']);
  }

  private setMeshCornerInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const index = normalizedIndex(input.index, 3);
    const position = tuple2(input.position);
    if (index === null || !position) return error('invalid_control_input', 'index must be 0..3 and position must be a finite [x, y] tuple');
    applicationCommands.setMeshCorner(index, position);
    return this.getControlState(['gradient']);
  }

  private setMeshHandleInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const edge = input.edge;
    const index = normalizedIndex(input.index, 1);
    const position = tuple2(input.position);
    if (edge !== 'bottom' && edge !== 'right' && edge !== 'top' && edge !== 'left') return error('invalid_control_input', 'edge must be bottom, right, top, or left');
    if (index === null || !position) return error('invalid_control_input', 'index must be 0 or 1 and position must be a finite [x, y] tuple');
    applicationCommands.setMeshHandle(edge as MeshEdge, index as 0 | 1, position);
    return this.getControlState(['gradient']);
  }

  private setMeshColorPositionInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const index = normalizedIndex(input.index, 3);
    if (index === null || typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value < 0 || input.value > 1) {
      return error('invalid_control_input', 'index must be 0..3 and value must be between 0 and 1');
    }
    applicationCommands.setMeshColorPosition(index, input.value);
    return this.getControlState(['gradient']);
  }

  private setSelectedStopsInput(input: Record<string, unknown>, anchors = false): RuntimeResult<unknown> {
    if (!Array.isArray(input.indices) || input.indices.length > (anchors ? 4 : 64)) return error('invalid_control_input', 'indices must be a bounded array');
    const max = anchors ? 3 : 63;
    const indices = input.indices.map(value => normalizedIndex(value, max));
    if (indices.some(value => value === null)) return error('invalid_control_input', `indices must contain integers between 0 and ${max}`);
    const unique = Array.from(new Set(indices as number[]));
    if (anchors) applicationCommands.setSelectedGradientAnchors(unique);
    else applicationCommands.setSelectedStops(unique);
    return this.getControlState(['gradient']);
  }

  private setSlitOverlayInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    if (typeof input.enabled !== 'boolean') return error('invalid_control_input', 'enabled must be a boolean');
    applicationCommands.setSlitOverlayEnabled(input.enabled);
    if (input.adjusting !== undefined) {
      if (typeof input.adjusting !== 'boolean') return error('invalid_control_input', 'adjusting must be a boolean when provided');
      applicationCommands.setIsSlitAdjusting(input.adjusting);
    }
    return this.getControlState(['slitScan']);
  }

  private setAnimationTransportInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    if (input.action !== 'play' && input.action !== 'pause' && input.action !== 'toggle' && input.action !== 'seek') {
      return error('invalid_control_input', 'action must be play, pause, toggle, or seek');
    }
    const state = useGradientStore.getState();
    if (input.action === 'seek') {
      if (typeof input.normalizedTime !== 'number' || !Number.isFinite(input.normalizedTime)) return error('invalid_control_input', 'normalizedTime must be a finite number for seek');
      const normalizedTime = Math.max(0, Math.min(1, input.normalizedTime));
      renderBridge.seekTo(normalizedTime);
      applicationCommands.setCurrentTime(normalizedTime);
    } else if (input.action === 'play') {
      if (!state.animation.enabled) applicationCommands.setAnimation({ enabled: true });
      renderBridge.requestPlay();
    } else if (input.action === 'pause') {
      if (!renderBridge.isPaused()) renderBridge.togglePause();
      applicationCommands.setCurrentTime(renderBridge.getCurrentNormalizedTime());
    } else if (!state.animation.enabled) {
      applicationCommands.setAnimation({ enabled: true });
      renderBridge.requestPlay();
    } else {
      renderBridge.togglePause();
      applicationCommands.setCurrentTime(renderBridge.getCurrentNormalizedTime());
    }
    const nextState = useGradientStore.getState();
    return {
      ok: true,
      value: {
        action: input.action,
        animationEnabled: nextState.animation.enabled,
        paused: renderBridge.isPaused(),
        normalizedTime: renderBridge.getCurrentNormalizedTime(),
      },
    };
  }

  private setTrackModeInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const trackIdResult = requiredString(input.trackId, 'trackId', 160);
    if (!trackIdResult.ok) return trackIdResult;
    if (input.mode !== 'static' && input.mode !== 'auto' && input.mode !== 'keys') return error('invalid_control_input', 'mode must be static, auto, or keys');
    if (input.label !== undefined && typeof input.label !== 'string') return error('invalid_control_input', 'label must be a string when provided');
    if (input.value !== undefined && (typeof input.value !== 'number' || !Number.isFinite(input.value))) return error('invalid_control_input', 'value must be a finite number when provided');
    if (input.time !== undefined && (typeof input.time !== 'number' || !Number.isFinite(input.time) || input.time < 0 || input.time > 1)) return error('invalid_control_input', 'time must be between 0 and 1 when provided');
    applicationCommands.setTrackMode(trackIdResult.value, input.mode as AnimationMode, {
      ...(typeof input.label === 'string' ? { label: input.label } : {}),
      ...(typeof input.value === 'number' ? { value: input.value } : {}),
      ...(typeof input.time === 'number' ? { time: input.time } : {}),
    });
    return this.getControlState(['keyframeTracks']);
  }

  private keyframeTuple(value: unknown): Vec2Tuple | undefined | null {
    if (value === undefined) return undefined;
    const tuple = tuple2(value);
    if (!tuple) return null;
    return tuple;
  }

  private addKeyframeInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const trackIdResult = requiredString(input.trackId, 'trackId', 160);
    if (!trackIdResult.ok) return trackIdResult;
    const state = useGradientStore.getState();
    if (!state.keyframeTracks[trackIdResult.value]) return error('unknown_track', `Unknown keyframe track: ${trackIdResult.value}`);
    if (typeof input.time !== 'number' || !Number.isFinite(input.time) || input.time < 0 || input.time > 1) return error('invalid_control_input', 'time must be between 0 and 1');
    if (typeof input.value !== 'number' || !Number.isFinite(input.value)) return error('invalid_control_input', 'value must be a finite number');
    if (input.interpolation !== 'linear' && input.interpolation !== 'hold' && input.interpolation !== 'bezier') return error('invalid_control_input', 'interpolation must be linear, hold, or bezier');
    const cp1 = this.keyframeTuple(input.cp1);
    const cp2 = this.keyframeTuple(input.cp2);
    const inHandle = this.keyframeTuple(input.inHandle);
    const outHandle = this.keyframeTuple(input.outHandle);
    if (cp1 === null || cp2 === null || inHandle === null || outHandle === null) return error('invalid_control_input', 'keyframe handle values must be finite [x, y] tuples');
    if (input.preserveHandles !== undefined && typeof input.preserveHandles !== 'boolean') return error('invalid_control_input', 'preserveHandles must be boolean when provided');
    applicationCommands.addKeyframe(trackIdResult.value, {
      time: input.time,
      value: input.value,
      interpolation: input.interpolation as InterpolationType,
      ...(cp1 ? { cp1 } : {}),
      ...(cp2 ? { cp2 } : {}),
      ...(inHandle ? { inHandle } : {}),
      ...(outHandle ? { outHandle } : {}),
    }, { preserveHandles: input.preserveHandles === true });
    return this.getControlState(['keyframeTracks']);
  }

  private setKeyframeInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const trackIdResult = requiredString(input.trackId, 'trackId', 160);
    if (!trackIdResult.ok) return trackIdResult;
    const idResult = requiredString(input.id, 'id', 160);
    if (!idResult.ok) return idResult;
    const state = useGradientStore.getState();
    const track = state.keyframeTracks[trackIdResult.value];
    if (!track) return error('unknown_track', `Unknown keyframe track: ${trackIdResult.value}`);
    if (!track.keyframes.some(keyframe => keyframe.id === idResult.value)) return error('unknown_keyframe', `Unknown keyframe: ${idResult.value}`);
    const patch: Partial<Keyframe> & { id: string } = { id: idResult.value };
    if (input.time !== undefined) {
      if (typeof input.time !== 'number' || !Number.isFinite(input.time) || input.time < 0 || input.time > 1) return error('invalid_control_input', 'time must be between 0 and 1 when provided');
      patch.time = input.time;
    }
    if (input.value !== undefined) {
      if (typeof input.value !== 'number' || !Number.isFinite(input.value)) return error('invalid_control_input', 'value must be a finite number when provided');
      patch.value = input.value;
    }
    if (input.interpolation !== undefined) {
      if (input.interpolation !== 'linear' && input.interpolation !== 'hold' && input.interpolation !== 'bezier') return error('invalid_control_input', 'interpolation must be linear, hold, or bezier');
      patch.interpolation = input.interpolation as InterpolationType;
    }
    for (const field of ['cp1', 'cp2', 'inHandle', 'outHandle'] as const) {
      const tuple = this.keyframeTuple(input[field]);
      if (tuple === null) return error('invalid_control_input', `${field} must be a finite [x, y] tuple`);
      if (tuple) patch[field] = tuple;
    }
    applicationCommands.setKeyframe(trackIdResult.value, patch);
    return this.getControlState(['keyframeTracks']);
  }

  private removeKeyframeInput(input: Record<string, unknown>): RuntimeResult<unknown> {
    const trackIdResult = requiredString(input.trackId, 'trackId', 160);
    if (!trackIdResult.ok) return trackIdResult;
    const idResult = requiredString(input.id, 'id', 160);
    if (!idResult.ok) return idResult;
    const track = useGradientStore.getState().keyframeTracks[trackIdResult.value];
    if (!track) return error('unknown_track', `Unknown keyframe track: ${trackIdResult.value}`);
    if (!track.keyframes.some(keyframe => keyframe.id === idResult.value)) return error('unknown_keyframe', `Unknown keyframe: ${idResult.value}`);
    applicationCommands.removeKeyframe(trackIdResult.value, idResult.value);
    return this.getControlState(['keyframeTracks']);
  }

  private setUiState(patch: Record<string, unknown>): RuntimeResult<unknown> {
    if (!this.ui) return error('ui_unavailable', 'The connected renderer did not register a UI control adapter');
    const invalidKey = Object.keys(patch).find(key => !UI_CONTROL_KEYS.has(key));
    if (invalidKey) return error('unknown_ui_control', `Unknown UI control: ${invalidKey}`);
    for (const [key, value] of Object.entries(patch)) {
      if (['canvasW', 'canvasH'].includes(key)) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MCP_MAX_CANVAS_DIMENSION) return error('invalid_ui_control', `${key} must be an integer between 1 and ${MCP_MAX_CANVAS_DIMENSION}`);
      } else if (key === 'lockAspect' || key === 'tabHoverSwitchEnabled' || key === 'isHoverLocked' || key === 'showTimeline' || key === 'showTimeRemap' || key === 'leftPanelOpen' || key === 'rightPanelOpen' || key === 'showLeftSidebar' || key === 'showRightSidebar' || key === 'showGradientRamp' || key === 'showOverlaySettings' || key === 'showImageGradientSource' || key === 'showGradientAnchors') {
        if (typeof value !== 'boolean') return error('invalid_ui_control', `${key} must be a boolean`);
      } else if (key === 'timelineHeight') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 100 || value > 2000) return error('invalid_ui_control', 'timelineHeight must be between 100 and 2000');
      } else if (key === 'leftPanelW' || key === 'rightPanelW') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 240 || value > 600) return error('invalid_ui_control', `${key} must be between 240 and 600`);
      } else if (key === 'showHelp' || key === 'showFeedback' || key === 'showPropertyModulesSettings') {
        if (typeof value !== 'boolean') return error('invalid_ui_control', `${key} must be a boolean`);
      } else if (key === 'renderViewMode' && value !== 'canvas' && value !== 'cloth' && value !== 'cone') {
        return error('invalid_ui_control', 'renderViewMode must be canvas, cloth, or cone');
      } else if (key === 'leftTab' && value !== 'diffuse' && value !== 'noise' && value !== 'slit' && value !== 'postprocess' && value !== 'sandbox' && value !== 'export' && value !== 'preset') {
        return error('invalid_ui_control', 'leftTab is not a registered panel id');
      } else if (key === 'overlayImageMode' && value !== 'overlay' && value !== 'mask' && value !== 'off') {
        return error('invalid_ui_control', 'overlayImageMode must be overlay, mask, or off');
      } else if (key === 'overlayOpacity') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) return error('invalid_ui_control', 'overlayOpacity must be between 0 and 1');
      } else if (key === 'zoom') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.25 || value > 5) return error('invalid_ui_control', 'zoom must be between 0.25 and 5');
      } else if (key === 'pan') {
        const pan = isRecord(value) ? value : null;
        if (!pan || typeof pan.x !== 'number' || !Number.isFinite(pan.x) || typeof pan.y !== 'number' || !Number.isFinite(pan.y)) return error('invalid_ui_control', 'pan must contain finite x and y values');
      }
    }
    try {
      this.ui.setState(cloneSerializable(patch));
    } catch (cause) {
      return error('ui_update_failed', cause instanceof Error ? cause.message : 'Unable to update UI state');
    }
    return this.getControlState(['ui']);
  }

  private async projectListPresets(): Promise<RuntimeResult<unknown>> {
    if (!this.project?.listPresets) return error('project_unavailable', 'The connected renderer did not register a preset repository');
    try {
      return cloneResultValue(await this.project.listPresets());
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to list presets');
    }
  }

  private async applyPresetInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.getPreset) return error('project_unavailable', 'The connected renderer did not register a preset repository');
    const presetIdResult = requiredString(input.presetId, 'presetId', 256);
    if (!presetIdResult.ok) return presetIdResult;
    try {
      const preset = await this.project.getPreset(presetIdResult.value);
      if (!isRecord(preset) || !isRecord(preset.state)) return error('preset_not_found', `Preset not found: ${presetIdResult.value}`);
      this.applySnapshot({
        store: preset.state,
        currentTime: 0,
        presetName: typeof preset.name === 'string' ? preset.name : useGradientStore.getState().presetName,
      });
      return { ok: true, value: { presetId: presetIdResult.value, presetName: useGradientStore.getState().presetName } };
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to apply preset');
    }
  }

  private async savePresetInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.savePreset) return error('project_unavailable', 'The connected renderer did not register a preset repository');
    const nameResult = requiredString(input.name, 'name', 120);
    if (!nameResult.ok) return nameResult;
    const folderId = input.folderId === undefined || input.folderId === null ? null : input.folderId;
    if (typeof folderId !== 'string' && folderId !== null) return error('invalid_control_input', 'folderId must be a string or null');
    if (input.includePreview !== undefined && typeof input.includePreview !== 'boolean') return error('invalid_control_input', 'includePreview must be boolean when provided');
    let thumbnail: string | undefined;
    if (input.includePreview === true) {
      const preview = this.capturePreview('png');
      if (!preview.ok) return preview;
      thumbnail = preview.value.dataUrl;
    }
    try {
      const snapshot = makeSnapshot(useGradientStore.getState());
      const saved = await this.project.savePreset(nameResult.value, snapshot.store, folderId, thumbnail);
      return cloneResultValue(saved);
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to save preset');
    }
  }

  private async deletePresetInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.deletePreset) return error('project_unavailable', 'The connected renderer did not register a preset repository');
    const presetIdResult = requiredString(input.presetId, 'presetId', 256);
    if (!presetIdResult.ok) return presetIdResult;
    if (input.confirm !== true) return error('confirmation_required', 'delete_preset requires confirm: true');
    try {
      await this.project.deletePreset(presetIdResult.value);
      return { ok: true, value: { deleted: true, presetId: presetIdResult.value } };
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to delete preset');
    }
  }

  private async exportPresetPackageInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.exportPresetPackage) return error('native_capability_required', 'The connected renderer has no explicit preset export boundary');
    if (input.confirm !== true) return error('confirmation_required', 'export_preset_package requires confirm: true');
    if (input.scope !== 'preset' && input.scope !== 'folder' && input.scope !== 'library') return error('invalid_control_input', 'scope must be preset, folder, or library');
    const id = input.id === undefined ? undefined : input.id;
    if ((input.scope === 'preset' || input.scope === 'folder') && (typeof id !== 'string' || id.length === 0)) return error('invalid_control_input', 'id is required for preset and folder exports');
    try {
      await this.project.exportPresetPackage({ kind: input.scope, ...(typeof id === 'string' ? { id } : {}) });
      return { ok: true, value: { exported: true, scope: input.scope, ...(typeof id === 'string' ? { id } : {}) } };
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to export preset package');
    }
  }

  private async projectListPalettes(): Promise<RuntimeResult<unknown>> {
    if (!this.project?.listPalettes) return error('palette_unavailable', 'The connected renderer did not register a color-palette repository');
    try {
      return cloneResultValue(await this.project.listPalettes());
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to list palettes');
    }
  }

  private async applyPaletteInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.getPalette) return error('palette_unavailable', 'The connected renderer did not register a color-palette repository');
    const paletteIdResult = requiredString(input.paletteId, 'paletteId', 256);
    if (!paletteIdResult.ok) return paletteIdResult;
    try {
      const palette = await this.project.getPalette(paletteIdResult.value);
      if (!isRecord(palette) || !Array.isArray(palette.stops)) return error('palette_not_found', `Palette not found: ${paletteIdResult.value}`);
      return this.setGradientStopsInput({ stops: palette.stops });
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to apply palette');
    }
  }

  private async savePaletteInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.savePalette) return error('palette_unavailable', 'The connected renderer did not register a color-palette repository');
    const nameResult = requiredString(input.name, 'name', 120);
    if (!nameResult.ok) return nameResult;
    try {
      const saved = await this.project.savePalette(nameResult.value, cloneSerializable(useGradientStore.getState().gradient.stops));
      return cloneResultValue(saved);
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to save palette');
    }
  }

  private async deletePaletteInput(input: Record<string, unknown>): Promise<RuntimeResult<unknown>> {
    if (!this.project?.deletePalette) return error('palette_unavailable', 'The connected renderer did not register a color-palette repository');
    const paletteIdResult = requiredString(input.paletteId, 'paletteId', 256);
    if (!paletteIdResult.ok) return paletteIdResult;
    if (input.confirm !== true) return error('confirmation_required', 'delete_palette requires confirm: true');
    try {
      await this.project.deletePalette(paletteIdResult.value);
      return { ok: true, value: { deleted: true, paletteId: paletteIdResult.value } };
    } catch (cause) {
      return error('project_operation_failed', cause instanceof Error ? cause.message : 'Unable to delete palette');
    }
  }

  private async requireOperationApproval(
    operationId: string,
    requiresApproval: boolean,
    input: Record<string, unknown>,
  ): Promise<RuntimeResult<null> | null> {
    if (!requiresApproval) return null;
    if (input.confirm !== true) return error('confirmation_required', `${operationId} requires confirm: true`);
    const requestApproval = this.ui?.requestApproval;
    if (!requestApproval) return error('approval_required', `${operationId} requires an explicit human approval callback from the connected app`);
    try {
      const approved = await requestApproval({ operationId, input: cloneSerializable(input) });
      return approved
        ? null
        : error('approval_denied', `${operationId} was denied by the connected app`);
    } catch (cause) {
      return error('approval_failed', cause instanceof Error ? cause.message : 'Unable to obtain human approval');
    }
  }

  async executeControl(operationId: string, input: Record<string, unknown> = {}): Promise<RuntimeResult<unknown>> {
    const definition = getControlOperationDefinition(operationId);
    if (!definition) return error('unknown_control_operation', `Unknown control operation: ${operationId}`);
    if (!isSafeControlPayload(input)) return error('invalid_control_input', 'input must be a JSON object within the control payload limit');
    const approval = await this.requireOperationApproval(operationId, definition.requiresApproval, input);
    if (approval) return approval;
    switch (operationId) {
      case 'set_group': return this.setControlGroup(input.group, input.patch);
      case 'set_gradient_stops': return this.setGradientStopsInput(input);
      case 'set_opacity_stops': return this.setOpacityStopsInput(input);
      case 'set_gradient_anchor': return this.setGradientAnchorInput(input);
      case 'set_mesh_corner': return this.setMeshCornerInput(input);
      case 'set_mesh_handle': return this.setMeshHandleInput(input);
      case 'set_mesh_color_position': return this.setMeshColorPositionInput(input);
      case 'reset_mesh_gradient':
        applicationCommands.resetMeshGradient();
        return this.getControlState(['gradient']);
      case 'straighten_mesh_handles':
        applicationCommands.straightenMeshHandles();
        return this.getControlState(['gradient']);
      case 'set_selected_stops': return this.setSelectedStopsInput(input);
      case 'set_selected_gradient_anchors': return this.setSelectedStopsInput(input, true);
      case 'set_slit_overlay': return this.setSlitOverlayInput(input);
      case 'set_animation_transport': return this.setAnimationTransportInput(input);
      case 'set_track_mode': return this.setTrackModeInput(input);
      case 'add_keyframe': return this.addKeyframeInput(input);
      case 'set_keyframe': return this.setKeyframeInput(input);
      case 'remove_keyframe': return this.removeKeyframeInput(input);
      case 'set_preset_name': {
        const nameResult = requiredString(input.name, 'name', 120);
        if (!nameResult.ok) return nameResult;
        applicationCommands.setPresetName(nameResult.value);
        return this.getControlState(['ui']);
      }
      case 'set_ui_state':
        if (!isRecord(input.patch) || !isSafeControlPayload(input.patch)) return error('invalid_control_input', 'patch must be a JSON object within the control payload limit');
        return this.setUiState(input.patch);
      case 'reset_viewport':
        if (!this.ui?.resetViewport) return error('ui_unavailable', 'The connected renderer did not register a viewport adapter');
        this.ui.resetViewport();
        return this.getControlState(['ui']);
      case 'list_presets': return this.projectListPresets();
      case 'apply_preset': return this.applyPresetInput(input);
      case 'save_preset': return this.savePresetInput(input);
      case 'delete_preset': return this.deletePresetInput(input);
      case 'export_preset_package': return this.exportPresetPackageInput(input);
      case 'list_palettes': return this.projectListPalettes();
      case 'apply_palette': return this.applyPaletteInput(input);
      case 'save_palette': return this.savePaletteInput(input);
      case 'delete_palette': return this.deletePaletteInput(input);
      default:
        return error('unsupported_control_operation', `Control operation is registered but not implemented: ${definition.id}`);
    }
  }

  listEffects(): RuntimeResult<EffectState[]> {
    return { ok: true, value: effectStates(useGradientStore.getState()) };
  }

  enableEffect(kind: string, enabled: boolean): RuntimeResult<EffectState[]> {
    if (!isEffectStackKind(kind)) return error('unknown_effect', `Unknown effect kind: ${kind}`);
    const state = useGradientStore.getState();
    applicationCommands.setEffectPipeline({
      effectStack: updateEffectStackLayer(state.effectPipeline.effectStack, kind, { enabled }),
    });
    return this.listEffects();
  }

  reorderEffect(kind: string, targetIndex: number): RuntimeResult<EffectState[]> {
    if (!isEffectStackKind(kind)) return error('unknown_effect', `Unknown effect kind: ${kind}`);
    if (!Number.isFinite(targetIndex)) return error('invalid_index', 'targetIndex must be finite');
    const state = useGradientStore.getState();
    const effectStack = moveEffectStackLayer(state.effectPipeline.effectStack, kind, targetIndex);
    applicationCommands.setEffectPipeline({ effectStack });
    return this.listEffects();
  }

  resetEffect(kind?: string): RuntimeResult<EffectState[]> {
    if (kind !== undefined && !isEffectStackKind(kind)) return error('unknown_effect', `Unknown effect kind: ${kind}`);
    if (kind === undefined) {
      applicationCommands.setEffectPipeline(createDefaultEffectPipeline());
    } else {
      const defaultStack = createDefaultEffectPipeline().effectStack;
      const defaultLayer = defaultStack.find(layer => layer.kind === kind);
      const state = useGradientStore.getState();
      applicationCommands.setEffectPipeline({
        effectStack: updateEffectStackLayer(state.effectPipeline.effectStack, kind, {
          enabled: defaultLayer?.enabled ?? false,
        }),
      });
    }
    return this.listEffects();
  }

  captureSnapshot(): RuntimeResult<{ snapshotId: string; snapshot: ControlSnapshot }> {
    const snapshotId = `snapshot-${Date.now().toString(36)}-${(this.snapshotSequence += 1).toString(36)}`;
    const snapshot = makeSnapshot(useGradientStore.getState());
    this.snapshots.set(snapshotId, snapshot);
    while (this.snapshots.size > 16) {
      const first = this.snapshots.keys().next().value;
      if (!first) break;
      this.snapshots.delete(first);
    }
    return { ok: true, value: { snapshotId, snapshot: cloneSerializable(snapshot) } };
  }

  restoreSnapshot(snapshotId: string): RuntimeResult<{ snapshotId: string }> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return error('snapshot_not_found', `Unknown snapshot id: ${snapshotId}`);
    this.applySnapshot(snapshot);
    return { ok: true, value: { snapshotId } };
  }

  capturePreview(format: 'png' | 'webp' = 'png'): RuntimeResult<PreviewCapture> {
    try {
      const pixels = this.canvas.width * this.canvas.height;
      if (!Number.isSafeInteger(pixels) || pixels < 1 || pixels > MCP_MAX_PREVIEW_PIXELS) {
        return error('preview_too_large', `Preview dimensions may not exceed ${MCP_MAX_PREVIEW_PIXELS} pixels`);
      }
      const requestedMime = format === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = this.canvas.toDataURL(requestedMime);
      if (dataUrl.length > MCP_MAX_PREVIEW_DATA_URL_CHARS) {
        return error('preview_too_large', 'Preview encoded data exceeds the Runtime Bridge output limit');
      }
      const mimeType = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/png';
      return {
        ok: true,
        value: { mimeType, dataUrl, width: this.canvas.width, height: this.canvas.height },
      };
    } catch (cause) {
      return error('preview_failed', cause instanceof Error ? cause.message : 'Unable to capture preview');
    }
  }

  getRenderDiagnostics(): RuntimeResult<Record<string, unknown>> {
    return { ok: true, value: serializableDiagnostics(this.getWebGLContext(), this.canvas) };
  }

  getDevRenderPasses(): RuntimeResult<unknown> {
    const diagnostics = serializableDiagnostics(this.getWebGLContext(), this.canvas);
    return { ok: true, value: diagnostics.renderPasses };
  }

  getDevWebGLState(): RuntimeResult<Record<string, unknown>> {
    const diagnostics = serializableDiagnostics(this.getWebGLContext(), this.canvas);
    return {
      ok: true,
      value: {
        rendererReady: diagnostics.rendererReady,
        contextLost: diagnostics.contextLost,
        canvas: diagnostics.canvas,
        gpu: diagnostics.gpu,
        limits: diagnostics.limits,
        lazyPrograms: diagnostics.lazyPrograms,
      },
    };
  }

  getDevUniforms(): RuntimeResult<unknown> {
    const diagnostics = serializableDiagnostics(this.getWebGLContext(), this.canvas);
    return { ok: true, value: diagnostics.uniforms };
  }

  getDevPerformance(): RuntimeResult<unknown> {
    const diagnostics = serializableDiagnostics(this.getWebGLContext(), this.canvas);
    return { ok: true, value: diagnostics.performance };
  }

  getShaderErrors(): RuntimeResult<ReturnType<typeof getShaderErrors>> {
    return { ok: true, value: getShaderErrors() };
  }

  async runScenario(commands: ScenarioCommand[], rollbackOnFailure = true): Promise<RuntimeResult<Record<string, unknown>>> {
    const before = makeSnapshot(useGradientStore.getState());
    const outputs: unknown[] = [];
    try {
      for (const command of commands) outputs.push(await this.runScenarioCommand(command));
      return { ok: true, value: { completed: commands.length, outputs, rolledBack: false } };
    } catch (cause) {
      if (rollbackOnFailure) this.applySnapshot(before);
      return error(
        'scenario_failed',
        cause instanceof Error ? cause.message : 'Scenario execution failed',
      );
    }
  }

  async handleRequest(method: string, params: Record<string, unknown> = {}): Promise<RuntimeResult<unknown>> {
    switch (method) {
      case 'getState': return this.getState();
      case 'getGradientState': return this.getGradientState();
      case 'listControls': return this.listControls();
      case 'getControlState': return this.getControlState(Array.isArray(params.groups) ? params.groups.map(String) : undefined);
      case 'executeControl': return this.executeControl(String(params.operationId ?? ''), isRecord(params.input) ? params.input : {});
      case 'listParameters': return this.listParameters(typeof params.prefix === 'string' ? params.prefix : undefined);
      case 'getParameter': return this.getParameter(String(params.path ?? ''));
      case 'setParameter': return this.setParameter(String(params.path ?? ''), params.value as ParameterValue);
      case 'setGradientColors': return this.setGradientColors(Array.isArray(params.colors) ? params.colors as string[] : []);
      case 'listEffects': return this.listEffects();
      case 'enableEffect': return this.enableEffect(String(params.kind ?? ''), Boolean(params.enabled));
      case 'reorderEffect': return this.reorderEffect(String(params.kind ?? ''), Number(params.targetIndex));
      case 'resetEffect': return this.resetEffect(typeof params.kind === 'string' ? params.kind : undefined);
      case 'captureSnapshot': return this.captureSnapshot();
      case 'restoreSnapshot': return this.restoreSnapshot(String(params.snapshotId ?? ''));
      case 'capturePreview': return this.capturePreview(params.format === 'webp' ? 'webp' : 'png');
      case 'getRenderDiagnostics': return this.getRenderDiagnostics();
      case 'getDevRenderPasses': return this.getDevRenderPasses();
      case 'getDevWebGLState': return this.getDevWebGLState();
      case 'getDevUniforms': return this.getDevUniforms();
      case 'getDevPerformance': return this.getDevPerformance();
      case 'getShaderErrors': return this.getShaderErrors();
      case 'runScenario': {
        const validation = validateScenario(params.commands);
        if (!validation.ok) return error('invalid_scenario', validation.message);
        return this.runScenario(validation.commands, params.rollbackOnFailure !== false);
      }
      default: return error('unknown_method', `Unknown runtime method: ${method}`);
    }
  }

  private async runScenarioCommand(command: ScenarioCommand): Promise<unknown> {
    switch (command.type) {
      case 'setParameter': return this.requireSuccess(this.setParameter(command.path, command.value));
      case 'enableEffect': return this.requireSuccess(this.enableEffect(command.kind, command.enabled));
      case 'reorderEffect': return this.requireSuccess(this.reorderEffect(command.kind, command.targetIndex));
      case 'resetEffect': return this.requireSuccess(this.resetEffect(command.kind));
      case 'captureSnapshot': return this.requireSuccess(this.captureSnapshot());
      case 'restoreSnapshot': return this.requireSuccess(this.restoreSnapshot(command.snapshotId));
      case 'control': return this.requireSuccess(await this.executeControl(command.operationId, command.input));
      case 'wait':
        await new Promise<void>(resolve => window.setTimeout(resolve, command.milliseconds));
        return { waitedMs: command.milliseconds };
      default: throw new Error('Unsupported scenario command');
    }
  }

  private requireSuccess<T>(result: RuntimeResult<T>): T {
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }

  private applySnapshot(snapshot: ControlSnapshot): void {
    const store = cloneSerializable(snapshot.store) as Record<string, unknown>;
    const partial = (key: string) => (isRecord(store[key]) ? store[key] : undefined);
    const setIfPresent = (key: string, setter: (value: never) => void) => {
      const value = partial(key);
      if (value) setter(value as never);
    };
    setIfPresent('gradient', applicationCommands.setGradient);
    setIfPresent('noiseDistortion', applicationCommands.setNoiseDistortion);
    setIfPresent('diffuse', applicationCommands.setDiffuse);
    setIfPresent('flowGradient', applicationCommands.setFlowGradient);
    setIfPresent('imageGradient', applicationCommands.setImageGradient);
    setIfPresent('slitScan', applicationCommands.setSlitScan);
    setIfPresent('stretch', applicationCommands.setStretch);
    setIfPresent('animation', applicationCommands.setAnimation);
    setIfPresent('normalMap', applicationCommands.setNormalMap);
    setIfPresent('clothGradient', applicationCommands.setClothGradient);
    setIfPresent('coneView', applicationCommands.setConeView);
    setIfPresent('seamless', applicationCommands.setSeamless);
    setIfPresent('radon', applicationCommands.setRadon);
    setIfPresent('iridescence', applicationCommands.setIridescence);
    setIfPresent('manualDistort', applicationCommands.setManualDistort);
    setIfPresent('postprocess', applicationCommands.setPostprocess);
    setIfPresent('effectPipeline', applicationCommands.setEffectPipeline);
    setIfPresent('matcap', applicationCommands.setMatcap);
    setIfPresent('histogram', applicationCommands.setHistogram);
    if (isRecord(store.keyframeTracks)) applicationCommands.setKeyframeTracks(store.keyframeTracks as never);
    if (Array.isArray(store.selectedStops)) applicationCommands.setSelectedStops(store.selectedStops as number[]);
    if (Array.isArray(store.selectedGradientAnchors)) applicationCommands.setSelectedGradientAnchors(store.selectedGradientAnchors as number[]);
    if (typeof store.slitOverlayEnabled === 'boolean') applicationCommands.setSlitOverlayEnabled(store.slitOverlayEnabled);
    if (typeof store.isSlitAdjusting === 'boolean') applicationCommands.setIsSlitAdjusting(store.isSlitAdjusting);
    if (typeof store.isGradientAnchorDragging === 'boolean') applicationCommands.setIsGradientAnchorDragging(store.isGradientAnchorDragging);
    applicationCommands.setCurrentTime(Math.min(1, Math.max(0, finiteNumber(snapshot.currentTime, 0))));
    applicationCommands.setPresetName(snapshot.presetName);
    renderBridge.renderAtTime(renderBridge.getCurrentTime(), renderBridge.getCurrentNormalizedTime());
  }
}

let activeRuntime: KggControlRuntime | null = null;

export function registerKggControlRuntime(options: KggControlRuntimeOptions): KggControlRuntime {
  activeRuntime = new KggControlRuntime(options);
  return activeRuntime;
}

export function getRegisteredKggControlRuntime(): KggControlRuntime | null {
  return activeRuntime;
}

export function unregisterKggControlRuntime(runtime: KggControlRuntime): void {
  if (activeRuntime === runtime) activeRuntime = null;
}
