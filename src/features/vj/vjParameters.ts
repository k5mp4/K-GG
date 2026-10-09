import type { GradientStore } from '../../store/gradientStore';
import { STORE_DEFAULTS } from '../../store/gradientStore';
import type { EffectStackKind } from '../../types/distortion';
import {
  ENUM_PARAMETER_LIMITS, PARAMETER_LIMITS, getDiffuseGrainParameterLimitKey,
  type ParameterLimitKey,
} from '../../lib/parameterLimits';
import { DATAMOSH_MIX_MODES, DATAMOSH_MOTION_SOURCES, DATAMOSH_RANGES } from '../../types/datamosh';
import { getNoiseSeedField } from '../../lib/noiseSeed';
import {
  ABSTRACT_FORMS, ABSTRACT_MATERIALS, ABSTRACT_VIEWS, CAMERA_WIGGLE_PRESETS,
  CONE_CAMERA_MODES, CONE_SEAM_MODES, CONE_SHAPES, CRYSTAL_FORMS, CRYSTAL_MATERIALS,
  DISCS_FORMS, DISCS_SPIN_PATTERNS, FIELD_GEOMETRIES, FIELD_RENDERS, LATTICE_TYPES,
  RINGS_MAPPINGS, RINGS_PATTERNS, THREE_D_ANTIALIAS_MODES, THREE_D_PROJECTIONS,
  THREE_D_SURFACE_MAPPINGS,
} from '../../types/coneView';

export type VjParameterRule = {
  locked?: boolean;
  min?: number;
  max?: number;
  values?: Array<string | boolean>;
  colors?: string[];
};

export type VjParameter = {
  id: string;
  group: string;
  field: string;
  label: string;
  type: 'number' | 'enum' | 'boolean' | 'color';
  min?: number;
  max?: number;
  step?: number;
  values?: Array<string | boolean>;
};

type Scalar = number | string | boolean;
const GROUPS: Record<EffectStackKind, string> = {
  noise: 'noiseDistortion', diffuse: 'diffuse', slit: 'slitScan', stretch: 'stretch',
  distort: 'postprocess', mirror: 'postprocess', kaleidoscope: 'postprocess',
  voronoi: 'postprocess', glass: 'postprocess', glassTile: 'postprocess',
  datamosh: 'datamosh', cone: 'coneView', texture: 'texture', distortChroma: 'distortChroma',
};

const ENUMS: Record<string, readonly string[]> = {
  'noiseDistortion.type': ['fast_curl', 'curl', 'simplex', 'perlin', 'ridged_fbm', 'ae_fractal', 'domain_warp_anim', 'seamless', 'voronoi', 'caustics', 'phasor', 'chladni'],
  'noiseDistortion.seamlessType': ['simplex', 'fbm', 'curl'],
  'noiseDistortion.seamlessAnimation': ['drift', 'radial'],
  'noiseDistortion.aeFractalType': ['basic', 'turbulent'],
  'noiseDistortion.noiseLoopMode': ['legacy', 'seamless'],
  'noiseDistortion.phasorDirectionMode': ['directional', 'radial', 'swirl'],
  'diffuse.mode': ['block', 'smooth', 'dither', 'halftone', 'ascii', 'legacy'],
  'diffuse.applyMode': ['noiseLinked', 'uniform'],
  'diffuse.halftoneShape': ['circle', 'square'],
  'diffuse.adaptiveChannel': ['luminance', 'hue', 'saturation'],
  'slitScan.mode': ['linear', 'circular', 'polygon', 'wave'],
  'slitScan.waveType': ['sine', 'sawtooth', 'semicircle'],
  'slitScan.animMode': ['off', 'unidirectional', 'pingpong'],
  'postprocess.mode': ['warp', 'swirl', 'spiky'],
  'postprocess.mirrorMode': ['horizontal', 'vertical', 'quad'],
  'postprocess.kaleidoscopeType': ['unfold', 'flower', 'starlish'],
  'postprocess.glassTilePattern': ['square', 'diamond', 'hexagon', 'triangle', 'brick', 'faceted'],
  'datamosh.motionSource': DATAMOSH_MOTION_SOURCES,
  'datamosh.mixMode': DATAMOSH_MIX_MODES,
  'coneView.shape': CONE_SHAPES,
  'coneView.mappingMode': ['flow', 'projection'],
  'coneView.seamMode': CONE_SEAM_MODES,
  'coneView.surfaceMapping': THREE_D_SURFACE_MAPPINGS,
  'coneView.projection': THREE_D_PROJECTIONS,
  'coneView.antialias': THREE_D_ANTIALIAS_MODES,
  'coneView.coneCameraMode': CONE_CAMERA_MODES,
  'coneView.wigglePreset': CAMERA_WIGGLE_PRESETS,
  'coneView.latticeType': LATTICE_TYPES,
  'coneView.ringsPattern': RINGS_PATTERNS,
  'coneView.ringsMapping': RINGS_MAPPINGS,
  'coneView.fieldGeometry': FIELD_GEOMETRIES,
  'coneView.fieldRender': FIELD_RENDERS,
  'coneView.discsForm': DISCS_FORMS,
  'coneView.discsSpinPattern': DISCS_SPIN_PATTERNS,
  'coneView.crystalForm': CRYSTAL_FORMS,
  'coneView.crystalMaterial': CRYSTAL_MATERIALS,
  'coneView.abstractForm': ABSTRACT_FORMS,
  'coneView.abstractMaterial': ABSTRACT_MATERIALS,
  'coneView.abstractView': ABSTRACT_VIEWS,
};

const COLOR_FIELDS = new Set([
  'diffuse.backgroundColor', 'stretch.glowTint', 'postprocess.glassV2TransmissionTint',
  'postprocess.glassV2HighlightTint', 'distortChroma.color1', 'distortChroma.color2', 'distortChroma.color3',
]);
const BOOLEAN_FIELDS = new Set([
  'diffuse.seedAnimEnabled', 'diffuse.adaptiveEnabled', 'diffuse.grainAdaptiveEnabled',
  'slitScan.pixelPerfect', 'slitScan.animEnabled', 'stretch.glowEnabled',
  'datamosh.freeze', 'datamosh.useColorDrift', 'distortChroma.whiteBalance',
]);

const prefixes: Record<string, string> = {
  noiseDistortion: 'noise', slitScan: 'slit', coneView: 'cone',
};
function groupValues(state: GradientStore, group: string): Record<string, unknown> {
  return (state as unknown as Record<string, Record<string, unknown>>)[group] ?? {};
}

function limitKey(group: string, field: string, state: GradientStore): string {
  if (group === 'noiseDistortion') {
    if (field === 'noiseSeed' || field === 'curlSeed') return 'noise.seed';
    if (field === 'scale' && state.noiseDistortion.type === 'caustics') return 'noise.causticsScale';
  }
  if (group === 'diffuse' && field === 'grain') return getDiffuseGrainParameterLimitKey(state.diffuse.mode);
  if (group === 'postprocess' && ['brushSize', 'strength', 'falloff', 'maxDisplacement'].includes(field)) {
    return `manualDistort.${field}`;
  }
  return `${prefixes[group] ?? group}.${field}`;
}

const BUILTIN_CHOICES: Record<string, readonly string[]> = {
  'texture.source': ['procedural'],
  'distortChroma.lensSource': ['source'],
  'datamosh.motionSource': DATAMOSH_MOTION_SOURCES.filter(value => value !== 'video'),
  'coneView.fieldGeometry': FIELD_GEOMETRIES.filter(value => value !== 'model'),
};

/** Keep an existing resource-backed mode visible without offering unloaded sources. */
function enumValues(id: string, state: GradientStore): string[] | undefined {
  const [group, field] = id.split('.');
  const key = limitKey(group, field, state);
  const registry = ENUM_PARAMETER_LIMITS[key as keyof typeof ENUM_PARAMETER_LIMITS];
  const values = ENUMS[id] ?? registry?.values;
  if (!values) return undefined;
  const builtin = BUILTIN_CHOICES[id];
  if (!builtin) return [...values];
  const current = groupValues(state, group)[field];
  return typeof current === 'string' && values.includes(current)
    ? [...new Set([...builtin, current])] : [...builtin];
}

function noiseFieldActive(field: string, state: GradientStore): boolean {
  const noise = state.noiseDistortion;
  const type = noise.type;
  if (field === 'type' || field === 'amount' || field === 'scale') return true;
  if (field === 'curlSeed' || field === 'noiseSeed') {
    return field === getNoiseSeedField(type);
  }
  if (field.startsWith('curl')) return type === 'curl' || (type === 'fast_curl' && field !== 'curlEps');
  if (field.startsWith('dw')) return type === 'domain_warp_anim';
  if (field.startsWith('seamless')) return type === 'seamless';
  if (field.startsWith('voronoi')) {
    return type === 'voronoi' && (field !== 'voronoiMinkowskiExp' || noise.voronoiDistMetric === 'minkowski');
  }
  if (field.startsWith('ridge')) return type === 'ridged_fbm';
  if (field.startsWith('ae')) return type === 'ae_fractal';
  if (field.startsWith('perlin')) return type === 'perlin' && (field !== 'perlinLoopWobble' || noise.perlinDimension === '4d');
  if (field.startsWith('caustics')) return type === 'caustics' && field !== 'causticsRefraction';
  if (field.startsWith('phasor')) return type === 'phasor';
  if (field.startsWith('chladni')) {
    if (type !== 'chladni') return false;
    if (['chladniMapAngle', 'chladniMapProfile'].includes(field)) return noise.chladniMode === 'map';
    if (['chladniLineWidth', 'chladniSharpness'].includes(field)) return noise.chladniMode !== 'map';
    return true;
  }
  if (field === 'speed' || field === 'noiseLoopMode') return type === 'caustics' || type === 'phasor';
  if (field === 'noiseLoopBlend') return (type === 'caustics' || type === 'phasor') && noise.noiseLoopMode === 'seamless';
  if (field === 'evolution') return type !== 'domain_warp_anim';
  if (field === 'octaves') return !['simplex', 'voronoi', 'chladni'].includes(type)
    && (type !== 'seamless' || noise.seamlessType !== 'simplex');
  return false;
}

function fieldActive(kind: EffectStackKind, field: string, state: GradientStore): boolean {
  switch (kind) {
    case 'noise': return noiseFieldActive(field, state);
    case 'diffuse': {
      const config = state.diffuse;
      if (field === 'mode' || field === 'grain' || field === 'seed' || field === 'seedAnimEnabled') return true;
      if (field === 'applyMode' || field === 'scatter') return ['block', 'smooth', 'legacy'].includes(config.mode);
      if (field.startsWith('halftone')) return config.mode === 'halftone';
      if (field.startsWith('ascii')) return config.mode === 'ascii';
      if (field === 'backgroundColor') return ['halftone', 'ascii'].includes(config.mode);
      if (field === 'ditherThreshold') return config.mode === 'dither';
      if (field === 'grainAdaptiveAmount') return config.grainAdaptiveEnabled === true;
      if (field === 'adaptiveChannel') return config.adaptiveEnabled === true;
      return ['adaptiveEnabled', 'grainAdaptiveEnabled'].includes(field);
    }
    case 'slit': {
      const slit = state.slitScan;
      if (field.startsWith('wave')) return slit.mode === 'wave';
      if (field === 'polygonSides') return slit.mode === 'polygon';
      if (field.startsWith('edge')) return slit.mode === 'linear' && (field === 'edgeSide' || slit.edgeSide !== 'none');
      if (field === 'offsetSpeed') return slit.animEnabled && slit.animMode !== 'off';
      if (field === 'animMode') return slit.animEnabled;
      return true;
    }
    case 'stretch': return !field.startsWith('glow') || field === 'glowEnabled' || state.stretch.glowEnabled;
    case 'distort': return ['mode', 'brushSize', 'strength', 'falloff', 'maxDisplacement'].includes(field);
    case 'mirror': return field === 'mirrorMode';
    case 'kaleidoscope': return field.startsWith('kaleidoscope');
    case 'voronoi': return field.startsWith('voronoi')
      && (field !== 'voronoiMinkowskiExp' || state.postprocess.voronoiDistMetric === 'minkowski');
    case 'glass':
      if (!field.startsWith('glass') || field.startsWith('glassTile')) return false;
      return !field.startsWith('glassRipple') || state.postprocess.glassSurfaceType === 'ripple';
    case 'glassTile': return field.startsWith('glassTile')
      && (!field.startsWith('glassTileFacet') || state.postprocess.glassTilePattern === 'faceted');
    case 'datamosh':
      if (field.startsWith('video')) return state.datamosh.motionSource === 'video';
      if (field.startsWith('pixelStretch')) return state.datamosh.motionSource === 'pixelStretch';
      if (field === 'motionScale' || field === 'motionSpeed') return state.datamosh.motionSource === 'procedural';
      return true;
    case 'texture': {
      const texture = state.texture;
      if (field === 'preset') return texture.source === 'procedural';
      if (field === 'imageFit') return texture.source === 'image';
      const radial = texture.source === 'procedural' && ['spunMetal', 'cdGroove'].includes(texture.preset);
      if (field === 'centerX' || field === 'centerY') return radial;
      if (field === 'rotation') return !radial;
      return true;
    }
    case 'cone': {
      const cone = state.coneView;
      const shapeFields = ['lattice', 'terrain', 'ribbon', 'rings', 'field', 'discs', 'crystal', 'abstract', 'torus', 'cone'];
      const prefix = shapeFields.find(prefix => field.startsWith(prefix));
      if (prefix) return cone.shape === prefix;
      if (['ringRadius', 'tubeRadius', 'ringRepeat', 'spin'].includes(field)) return cone.shape === 'torus';
      if (field.startsWith('wiggle') && field !== 'wigglePreset') return cone.wigglePreset !== 'off';
      if (field === 'fisheyeAngle') return cone.projection === 'fisheye';
      if (field === 'cameraFov' || field === 'lensDistortion') return cone.projection === 'perspective';
      return true;
    }
    case 'distortChroma': return true;
  }
}

function labelFor(field: string, kind: EffectStackKind): string {
  const shortField = ['kaleidoscope', 'voronoi', 'glass', 'glassTile'].includes(kind)
    ? field.replace(new RegExp(`^${kind}`), '') : field;
  return shortField.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, value => value.toUpperCase());
}

/** Scalar effect controls only; excludes stack state, output, files and editable maps. */
export function getVjParameters(kind: EffectStackKind, state: GradientStore): VjParameter[] {
  const group = GROUPS[kind];
  const defaults = (STORE_DEFAULTS as unknown as Record<string, Record<string, unknown>>)[group] ?? {};
  const fields = new Set([...Object.keys(defaults), ...Object.keys(groupValues(state, group))]);
  const result: VjParameter[] = [];
  for (const field of fields) {
    if (!fieldActive(kind, field, state)) continue;
    const id = `${group}.${field}`;
    const base = { id, group, field, label: labelFor(field, kind) };
    const values = enumValues(id, state);
    if (values) result.push({ ...base, type: 'enum', values });
    else if (BOOLEAN_FIELDS.has(id)) result.push({ ...base, type: 'boolean', values: [false, true] });
    else if (COLOR_FIELDS.has(id)) result.push({ ...base, type: 'color' });
    else {
      const key = limitKey(group, field, state);
      const limit = PARAMETER_LIMITS[key as ParameterLimitKey]
        ?? (group === 'datamosh' ? DATAMOSH_RANGES[field as keyof typeof DATAMOSH_RANGES] : undefined);
      if (limit) result.push({
        ...base, type: 'number', min: limit.min, max: limit.max,
        step: 'integer' in limit && limit.integer ? Math.max(1, limit.step) : limit.step,
      });
    }
  }
  // Mode selectors precede dependent controls; the first four are usable compact controls.
  const priority = ['type', 'mode', 'shape', 'motionSource', 'source', 'lensSource', 'preset'];
  return result.sort((left, right) => {
    const a = priority.indexOf(left.field);
    const b = priority.indexOf(right.field);
    return (a < 0 ? priority.length : a) - (b < 0 ? priority.length : b);
  });
}

export function getVjParameterValue(state: GradientStore, param: VjParameter): Scalar {
  const value = groupValues(state, param.group)[param.field]
    ?? (STORE_DEFAULTS as unknown as Record<string, Record<string, unknown>>)[param.group]?.[param.field];
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  return param.type === 'boolean' ? false : param.type === 'number' ? param.min ?? 0 : param.values?.[0] ?? '#000000';
}

function kindFor(param: VjParameter): EffectStackKind | undefined {
  if (param.group === 'postprocess') {
    if (param.field.startsWith('glassTile')) return 'glassTile';
    for (const kind of ['glass', 'kaleidoscope', 'voronoi', 'mirror'] as const) {
      if (param.field.startsWith(kind)) return kind;
    }
    return 'distort';
  }
  return (Object.entries(GROUPS).find(([, group]) => group === param.group)?.[0]) as EffectStackKind | undefined;
}

function randomUnit(rng: () => number): number {
  const value = rng();
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0.5;
}

function pickValue(param: VjParameter, rule: VjParameterRule, bounded: boolean, rng: () => number): Scalar | undefined {
  if (rule.locked) return undefined;
  if (param.type === 'number') {
    const lower = Math.max(param.min ?? 0, bounded ? rule.min ?? param.min ?? 0 : param.min ?? 0);
    const upper = Math.min(param.max ?? 1, bounded ? rule.max ?? param.max ?? 1 : param.max ?? 1);
    const step = param.step ?? 0.01;
    const origin = param.min ?? 0;
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || !Number.isFinite(step) || step <= 0 || lower > upper) return undefined;
    const first = Math.ceil((lower - origin) / step - 1e-9);
    const last = Math.floor((upper - origin) / step + 1e-9);
    if (first > last) return undefined;
    const index = first + Math.min(last - first, Math.floor(randomUnit(rng) * (last - first + 1)));
    return Number((origin + index * step).toFixed(10));
  }
  if (param.type === 'color') {
    if (bounded && rule.colors) {
      const colors = rule.colors.filter(color => /^#[0-9a-f]{6}$/i.test(color));
      return colors.length ? colors[Math.floor(randomUnit(rng) * colors.length)] : undefined;
    }
    return `#${Math.floor(randomUnit(rng) * 0x1000000).toString(16).padStart(6, '0')}`;
  }
  const allValues = param.values ?? (param.type === 'boolean' ? [false, true] : []);
  const values = bounded && rule.values ? allValues.filter(value => rule.values?.includes(value)) : allValues;
  return values.length ? values[Math.floor(randomUnit(rng) * values.length)] : undefined;
}

export function createVjRandomValues(
  params: VjParameter[], state: GradientStore, rules: Record<string, VjParameterRule>,
  mode: 'full' | 'bounded', rng: () => number = Math.random,
): Record<string, Scalar> {
  const result: Record<string, Scalar> = {};
  const kinds = [...new Set(params.map(kindFor).filter((kind): kind is EffectStackKind => kind !== undefined))];
  let working = state;
  const currentParameters = () => kinds.length ? kinds.flatMap(kind => getVjParameters(kind, working)) : params;
  const effectiveRules = { ...rules };
  const ruleFor = (parameter: VjParameter): VjParameterRule => {
    // Missing rules are centered defaults; an explicit empty rule means the user cleared the range.
    effectiveRules[parameter.id] ??= makeVjCenteredRules([parameter], working)[parameter.id] ?? {};
    return effectiveRules[parameter.id];
  };
  const visited = new Set<string>();
  const preservesHeldValues = (selector: VjParameter, value: string | boolean) => {
    const kind = kindFor(selector);
    if (!kind) return true;
    const candidate = { ...working, [selector.group]: { ...groupValues(working, selector.group), [selector.field]: value } };
    return getVjParameters(kind, candidate).every(parameter => {
      if (parameter.type !== 'number') return true;
      const rule = effectiveRules[parameter.id] ?? {};
      const held = rule.locked || (mode === 'bounded' && pickValue(parameter, rule, true, () => 0) === undefined);
      if (!held) return true;
      const current = getVjParameterValue(working, parameter);
      return typeof current === 'number' && current >= (parameter.min ?? 0) && current <= (parameter.max ?? 1);
    });
  };
  // Resolve selectors before dependent values, including newly revealed selectors.
  // Re-read after each selector because e.g. Type -> Chladni Mode -> Map Profile has dependencies.
  const generateEnums = () => {
    while (true) {
      const param = currentParameters().find(param => param.type === 'enum' && !visited.has(param.id));
      if (!param) break;
      visited.add(param.id);
      const builtin = BUILTIN_CHOICES[param.id];
      const randomParam = { ...param, values: param.values?.filter(value =>
        (!builtin || (typeof value === 'string' && builtin.includes(value))) && preservesHeldValues(param, value)) };
      const value = pickValue(randomParam, ruleFor(param), mode === 'bounded', rng);
      if (value === undefined) continue;
      result[param.id] = value;
      working = {
        ...working,
        [param.group]: { ...groupValues(working, param.group), [param.field]: value },
      };
    }
  };
  generateEnums();
  // Boolean switches can reveal numeric and color controls (e.g. Stretch Glow).
  for (const param of currentParameters().filter(param => param.type === 'boolean')) {
    const value = pickValue(param, ruleFor(param), mode === 'bounded', rng);
    if (value === undefined) continue;
    result[param.id] = value;
    working = { ...working, [param.group]: { ...groupValues(working, param.group), [param.field]: value } };
  }
  generateEnums();
  for (const param of currentParameters().filter(param => param.type === 'number' || param.type === 'color')) {
    const value = pickValue(param, ruleFor(param), mode === 'bounded', rng);
    if (value !== undefined) result[param.id] = value;
  }
  return result;
}

export function makeVjCenteredRules(
  params: VjParameter[], state: GradientStore, fraction = 0.2,
): Record<string, VjParameterRule> {
  const rules: Record<string, VjParameterRule> = {};
  const width = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0.2;
  for (const param of params) {
    const value = getVjParameterValue(state, param);
    if (param.type === 'number' && typeof value === 'number' && Number.isFinite(value)) {
      const min = param.min ?? 0;
      const max = param.max ?? 1;
      const center = Math.max(min, Math.min(max, value));
      const radius = (max - min) * width;
      rules[param.id] = { min: Math.max(min, center - radius), max: Math.min(max, center + radius) };
    } else if (param.type === 'color' && typeof value === 'string') {
      rules[param.id] = { colors: [value] };
    } else if (param.type === 'enum' || param.type === 'boolean') {
      rules[param.id] = { values: [value as string | boolean] };
    }
  }
  return rules;
}
