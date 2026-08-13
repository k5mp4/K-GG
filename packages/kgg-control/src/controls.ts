import type { JsonValue } from './types.js';

export type ControlGroup =
  | 'gradient'
  | 'noiseDistortion'
  | 'diffuse'
  | 'imageGradient'
  | 'slitScan'
  | 'stretch'
  | 'animation'
  | 'normalMap'
  | 'clothGradient'
  | 'coneView'
  | 'seamless'
  | 'flowGradient'
  | 'radon'
  | 'iridescence'
  | 'manualDistort'
  | 'postprocess'
  | 'effectPipeline'
  | 'matcap'
  | 'histogram'
  | 'keyframeTracks'
  | 'ui';

export type ControlSchema = {
  type: string;
  title?: string;
  description?: string;
  properties?: Record<string, ControlSchema>;
  items?: ControlSchema;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  additionalProperties?: boolean | ControlSchema;
};

export type ControlGroupDefinition = {
  id: ControlGroup;
  title: string;
  description: string;
  source: 'store' | 'ui';
};

export type ControlOperationDefinition = {
  id: string;
  title: string;
  description: string;
  group: ControlGroup | 'control' | 'project' | 'palette' | 'viewport';
  kind: 'read' | 'mutation';
  inputSchema: ControlSchema;
  scenarioSafe: boolean;
  requiresApproval: boolean;
  requiresNativeCapability: boolean;
};

const objectSchema = (properties: Record<string, ControlSchema>, required: string[] = []): ControlSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const stringSchema = (description?: string): ControlSchema => ({ type: 'string', ...(description ? { description } : {}) });
const numberSchema = (minimum?: number, maximum?: number): ControlSchema => ({
  type: 'number',
  ...(minimum === undefined ? {} : { minimum }),
  ...(maximum === undefined ? {} : { maximum }),
});
const booleanSchema: ControlSchema = { type: 'boolean' };
const recordSchema: ControlSchema = { type: 'object', additionalProperties: true };
const vectorSchema: ControlSchema = { type: 'array', items: numberSchema(), minItems: 2, maxItems: 2 };

export const CONTROL_GROUP_DEFINITIONS: readonly ControlGroupDefinition[] = [
  ['gradient', 'Gradient', 'Gradient type, ramp, stops, anchors, Bezier controls, and mesh data.'],
  ['noiseDistortion', 'Noise', 'Noise algorithm, distortion, evolution, and noise-specific controls.'],
  ['diffuse', 'Diffuse', 'Diffuse, dither, halftone, ASCII, and adaptive grain controls.'],
  ['imageGradient', 'Image Gradient', 'Image-derived gradient and anchor influence controls.'],
  ['slitScan', 'Slit Scan', 'Slit scan mode, angle, phase, source, and displacement controls.'],
  ['stretch', 'Stretch', 'Stretch band, glow, and scan controls.'],
  ['animation', 'Animation', 'Animation duration, fps, speed, easing, loop, and affected modules.'],
  ['normalMap', 'Normal Map', 'Normal-map lighting and material controls.'],
  ['clothGradient', 'Cloth', 'Cloth material, weave, and lighting controls.'],
  ['coneView', 'Cone', 'Cone projection, camera, and apex controls.'],
  ['seamless', 'Seamless', 'Seamless tiling controls.'],
  ['flowGradient', 'Flow', 'Flow simulation, particles, ribbons, and vector-field controls.'],
  ['radon', 'Radon', 'Radon transform controls.'],
  ['iridescence', 'Iridescence', 'Iridescence material and motion controls.'],
  ['manualDistort', 'Manual Distort', 'Manual displacement map, brush, and mask controls.'],
  ['postprocess', 'Postprocess', 'Postprocess effect stack, distortion, glass, particles, and color controls.'],
  ['effectPipeline', 'Effect Pipeline', 'Unified effect stack order and layer settings.'],
  ['matcap', 'Matcap', 'Matcap material and lighting controls.'],
  ['histogram', 'Histogram', 'Histogram display and color-analysis controls.'],
  ['keyframeTracks', 'Keyframes', 'Animation property tracks and keyframes.'],
  ['ui', 'UI', 'Canvas, panels, timeline, view mode, overlay, and viewport state.'],
].map(([id, title, description]) => ({
  id: id as ControlGroup,
  title: String(title),
  description: String(description),
  source: id === 'ui' ? 'ui' : 'store',
}));

const stopSchema = objectSchema({
  stopId: stringSchema('Optional stable stop identifier'),
  position: numberSchema(0, 1),
  color: stringSchema('Hex color such as #0066FF'),
}, ['position', 'color']);

const opacityStopSchema = objectSchema({
  stopId: stringSchema('Optional stable stop identifier'),
  position: numberSchema(0, 1),
  opacity: numberSchema(0, 1),
}, ['position', 'opacity']);

const operationDefinitions: readonly ControlOperationDefinition[] = [
  {
    id: 'set_group',
    title: 'Set Control Group',
    description: 'Apply a JSON partial patch to one allowlisted UI/store control group through its existing normalizer.',
    group: 'control',
    kind: 'mutation',
    inputSchema: objectSchema({
      group: stringSchema('Control group id from kgg_list_controls'),
      patch: recordSchema,
    }, ['group', 'patch']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_gradient_stops',
    title: 'Set Gradient Stops',
    description: 'Replace the color stops used by the Gradient Ramp.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ stops: { type: 'array', items: stopSchema, minItems: 2, maxItems: 64 } }, ['stops']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_opacity_stops',
    title: 'Set Opacity Stops',
    description: 'Replace the opacity stops used by the Gradient Ramp.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ stops: { type: 'array', items: opacityStopSchema, minItems: 2, maxItems: 64 } }, ['stops']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_gradient_anchor',
    title: 'Set Gradient Anchor',
    description: 'Move one semantic gradient anchor in UV space.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ index: numberSchema(0, 3), position: vectorSchema }, ['index', 'position']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_mesh_corner',
    title: 'Set Mesh Corner',
    description: 'Move one of the four Mesh Gradient corners.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ index: numberSchema(0, 3), position: vectorSchema }, ['index', 'position']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_mesh_handle',
    title: 'Set Mesh Handle',
    description: 'Move one edge handle of the Mesh Gradient Coons patch.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({
      edge: { type: 'string', enum: ['bottom', 'right', 'top', 'left'] },
      index: numberSchema(0, 1),
      position: vectorSchema,
    }, ['edge', 'index', 'position']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_mesh_color_position',
    title: 'Set Mesh Color Position',
    description: 'Set one of the four Mesh Gradient ramp positions.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ index: numberSchema(0, 3), value: numberSchema(0, 1) }, ['index', 'value']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'reset_mesh_gradient',
    title: 'Reset Mesh Gradient',
    description: 'Restore the Mesh Gradient geometry and color positions to defaults.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({}),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'straighten_mesh_handles',
    title: 'Straighten Mesh Handles',
    description: 'Align Mesh Gradient edge handles to their corner edges.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({}),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_selected_stops',
    title: 'Set Selected Stops',
    description: 'Set Gradient Ramp color-stop selection by index.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ indices: { type: 'array', items: numberSchema(0, 63), maxItems: 64 } }, ['indices']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_selected_gradient_anchors',
    title: 'Set Selected Gradient Anchors',
    description: 'Set semantic gradient or mesh anchor selection by index.',
    group: 'gradient',
    kind: 'mutation',
    inputSchema: objectSchema({ indices: { type: 'array', items: numberSchema(0, 3), maxItems: 4 } }, ['indices']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_slit_overlay',
    title: 'Set Slit Overlay',
    description: 'Set the Slit Scan adjustment overlay and adjusting state.',
    group: 'slitScan',
    kind: 'mutation',
    inputSchema: objectSchema({ enabled: booleanSchema, adjusting: booleanSchema }),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_animation_transport',
    title: 'Control Animation Transport',
    description: 'Play, pause, toggle, or seek the same AnimationLoop used by the timeline UI.',
    group: 'animation',
    kind: 'mutation',
    inputSchema: objectSchema({
      action: { type: 'string', enum: ['play', 'pause', 'toggle', 'seek'] },
      normalizedTime: numberSchema(0, 1),
    }, ['action']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_track_mode',
    title: 'Set Keyframe Track Mode',
    description: 'Set a property track to static, auto, or keyframe mode.',
    group: 'keyframeTracks',
    kind: 'mutation',
    inputSchema: objectSchema({
      trackId: stringSchema(),
      mode: { type: 'string', enum: ['static', 'auto', 'keys'] },
      label: stringSchema(),
      value: numberSchema(),
      time: numberSchema(0, 1),
    }, ['trackId', 'mode']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'add_keyframe',
    title: 'Add Keyframe',
    description: 'Add a keyframe to an existing allowlisted property track.',
    group: 'keyframeTracks',
    kind: 'mutation',
    inputSchema: objectSchema({
      trackId: stringSchema(),
      time: numberSchema(0, 1),
      value: numberSchema(),
      interpolation: { type: 'string', enum: ['linear', 'hold', 'bezier'] },
      cp1: vectorSchema,
      cp2: vectorSchema,
      inHandle: vectorSchema,
      outHandle: vectorSchema,
      preserveHandles: booleanSchema,
    }, ['trackId', 'time', 'value', 'interpolation']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_keyframe',
    title: 'Set Keyframe',
    description: 'Update an existing keyframe through the store normalizer.',
    group: 'keyframeTracks',
    kind: 'mutation',
    inputSchema: objectSchema({
      trackId: stringSchema(),
      id: stringSchema(),
      time: numberSchema(0, 1),
      value: numberSchema(),
      interpolation: { type: 'string', enum: ['linear', 'hold', 'bezier'] },
      cp1: vectorSchema,
      cp2: vectorSchema,
      inHandle: vectorSchema,
      outHandle: vectorSchema,
    }, ['trackId', 'id']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'remove_keyframe',
    title: 'Remove Keyframe',
    description: 'Remove one keyframe from an existing property track.',
    group: 'keyframeTracks',
    kind: 'mutation',
    inputSchema: objectSchema({ trackId: stringSchema(), id: stringSchema() }, ['trackId', 'id']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_preset_name',
    title: 'Set Preset Name',
    description: 'Set the current preset/document name used by the UI.',
    group: 'ui',
    kind: 'mutation',
    inputSchema: objectSchema({ name: stringSchema() }, ['name']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'set_ui_state',
    title: 'Set UI State',
    description: 'Change allowlisted UI state such as canvas size, panel visibility, view mode, timeline, and overlay settings.',
    group: 'ui',
    kind: 'mutation',
    inputSchema: objectSchema({ patch: recordSchema }, ['patch']),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'reset_viewport',
    title: 'Reset Viewport',
    description: 'Reset the canvas viewport zoom and pan to the same default used by the UI reset action.',
    group: 'viewport',
    kind: 'mutation',
    inputSchema: objectSchema({}),
    scenarioSafe: true,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'list_presets',
    title: 'List Presets',
    description: 'Read the connected user preset library without opening a file dialog.',
    group: 'project',
    kind: 'read',
    inputSchema: objectSchema({}),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'apply_preset',
    title: 'Apply Preset',
    description: 'Apply one connected user preset through the app store normalizers.',
    group: 'project',
    kind: 'mutation',
    inputSchema: objectSchema({ presetId: stringSchema() }, ['presetId']),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'save_preset',
    title: 'Save Preset',
    description: 'Save the current serializable document into the connected preset repository.',
    group: 'project',
    kind: 'mutation',
    inputSchema: objectSchema({ name: stringSchema(), folderId: stringSchema(), includePreview: booleanSchema }, ['name']),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'delete_preset',
    title: 'Delete Preset',
    description: 'Delete a user preset. Explicit confirmation is required.',
    group: 'project',
    kind: 'mutation',
    inputSchema: objectSchema({ presetId: stringSchema(), confirm: booleanSchema }, ['presetId', 'confirm']),
    scenarioSafe: false,
    requiresApproval: true,
    requiresNativeCapability: false,
  },
  {
    id: 'export_preset_package',
    title: 'Export Preset Package',
    description: 'Ask the connected app adapter to export a preset package through its explicit save boundary.',
    group: 'project',
    kind: 'mutation',
    inputSchema: objectSchema({ scope: { type: 'string', enum: ['preset', 'folder', 'library'] }, id: stringSchema(), confirm: booleanSchema }, ['scope', 'confirm']),
    scenarioSafe: false,
    requiresApproval: true,
    requiresNativeCapability: true,
  },
  {
    id: 'list_palettes',
    title: 'List Color Palettes',
    description: 'Read user-saved color palettes from the connected app repository.',
    group: 'palette',
    kind: 'read',
    inputSchema: objectSchema({}),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'apply_palette',
    title: 'Apply Color Palette',
    description: 'Apply a saved palette to the Gradient Ramp.',
    group: 'palette',
    kind: 'mutation',
    inputSchema: objectSchema({ paletteId: stringSchema() }, ['paletteId']),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'save_palette',
    title: 'Save Color Palette',
    description: 'Save the current Gradient Ramp colors as a user palette.',
    group: 'palette',
    kind: 'mutation',
    inputSchema: objectSchema({ name: stringSchema() }, ['name']),
    scenarioSafe: false,
    requiresApproval: false,
    requiresNativeCapability: false,
  },
  {
    id: 'delete_palette',
    title: 'Delete Color Palette',
    description: 'Delete a saved color palette. Explicit confirmation is required.',
    group: 'palette',
    kind: 'mutation',
    inputSchema: objectSchema({ paletteId: stringSchema(), confirm: booleanSchema }, ['paletteId', 'confirm']),
    scenarioSafe: false,
    requiresApproval: true,
    requiresNativeCapability: false,
  },
];

// The shared package is intentionally JSON-shaped. Keep this cast local so
// consumers receive immutable metadata while MCP/HTTP serializers see plain
// data rather than app or DOM references.
export const CONTROL_OPERATION_DEFINITIONS: readonly ControlOperationDefinition[] = operationDefinitions;

const definitionsById = new Map(CONTROL_OPERATION_DEFINITIONS.map(definition => [definition.id, definition]));

export function getControlOperationDefinition(id: string): ControlOperationDefinition | null {
  return definitionsById.get(id) ?? null;
}

export function listControlOperationDefinitions(): ControlOperationDefinition[] {
  return CONTROL_OPERATION_DEFINITIONS.map(definition => ({
    ...definition,
    inputSchema: JSON.parse(JSON.stringify(definition.inputSchema)) as ControlSchema,
  }));
}

export function isControlGroup(value: unknown): value is ControlGroup {
  return typeof value === 'string' && CONTROL_GROUP_DEFINITIONS.some(definition => definition.id === value);
}

export function isJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > 12) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(item => isJsonValue(item, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value).every(([key, item]) => (
      key !== '__proto__' && key !== 'constructor' && key !== 'prototype' && isJsonValue(item, depth + 1)
    ));
  }
  return false;
}
