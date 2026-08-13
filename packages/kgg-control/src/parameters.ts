import { PARAMETER_LIMITS, type ParameterLimitKey } from './parameterLimits.js';
import type { ParameterDefinition, ParameterValue } from './types.js';

const numberParameter = (
  path: string,
  target: string,
  property: string,
  min: number,
  max: number,
  step: number,
  description: string,
  options: Pick<ParameterDefinition, 'integer' | 'angleUnit' | 'wrapAngle'> = {},
): ParameterDefinition => ({
  path,
  target,
  property,
  type: 'number',
  writable: true,
  min,
  max,
  step,
  description,
  ...options,
});

const booleanParameter = (
  path: string,
  target: string,
  property: string,
  description: string,
): ParameterDefinition => ({ path, target, property, type: 'boolean', writable: true, description });

const enumParameter = (
  path: string,
  target: string,
  property: string,
  enumValues: readonly string[],
  description: string,
): ParameterDefinition => ({ path, target, property, type: 'enum', writable: true, enumValues, description });

const degrees = { angleUnit: 'degrees' as const, wrapAngle: true };
const radians = { angleUnit: 'radians' as const, wrapAngle: true };

/**
 * Stable developer-facing paths. The app-side adapter maps these paths to its
 * existing normalizers and setters; this list is intentionally not a mirror of
 * every internal UI field.
 */
const RAW_CONTROL_PARAMETER_DEFINITIONS: readonly ParameterDefinition[] = [
  numberParameter('gradient.angle', 'gradient', 'angle', 0, 360, 1, 'Gradient direction in degrees', degrees),
  numberParameter('gradient.rampRepeat', 'gradient', 'rampRepeat', 1, 20, 1, 'Number of gradient ramp repetitions', { integer: true }),

  booleanParameter('noise.enabled', 'noiseDistortion', 'enabled', 'Enable the noise field'),
  enumParameter('noise.type', 'noiseDistortion', 'type', ['simplex', 'fbm', 'voronoi', 'curl', 'fast_curl', 'domain_warp_anim', 'seamless', 'ridged_fbm', 'ae_fractal', 'caustics', 'phasor'], 'Noise algorithm'),
  numberParameter('noise.amount', 'noiseDistortion', 'amount', 0, 1, 0.01, 'Noise displacement amount'),
  numberParameter('noise.scale', 'noiseDistortion', 'scale', 0.01, 20, 0.01, 'Noise scale'),
  numberParameter('noise.octaves', 'noiseDistortion', 'octaves', 1, 8, 1, 'Noise octave count', { integer: true }),
  numberParameter('noise.speed', 'noiseDistortion', 'speed', 0, 4, 0.01, 'Noise animation speed'),
  numberParameter('noise.dwRotAngle1', 'noiseDistortion', 'dwRotAngle1', 0, Math.PI * 2, Math.PI / 180, 'Domain warp rotation angle 1', radians),
  numberParameter('noise.dwRotAngle2', 'noiseDistortion', 'dwRotAngle2', 0, Math.PI * 2, Math.PI / 180, 'Domain warp rotation angle 2', radians),
  numberParameter('noise.dwDriftAngle', 'noiseDistortion', 'dwDriftAngle', 0, 360, 1, 'Domain warp drift angle', degrees),
  numberParameter('noise.aeSubRotation', 'noiseDistortion', 'aeSubRotation', 0, 360, 1, 'AE fractal sub rotation', degrees),
  numberParameter('noise.causticsDepth', 'noiseDistortion', 'causticsDepth', 0.05, 3, 0.01, 'Caustics depth'),
  numberParameter('noise.causticsRefraction', 'noiseDistortion', 'causticsRefraction', 0, 1, 0.01, 'Caustics refraction'),
  numberParameter('noise.causticsSharpness', 'noiseDistortion', 'causticsSharpness', 0.5, 8, 0.05, 'Caustics sharpness'),
  numberParameter('noise.causticsComplexity', 'noiseDistortion', 'causticsComplexity', 2, 8, 1, 'Caustics wave complexity', { integer: true }),
  numberParameter('noise.causticsWaveSpread', 'noiseDistortion', 'causticsWaveSpread', 0, 1, 0.01, 'Caustics wave spread'),
  numberParameter('noise.causticsBoundaryWidth', 'noiseDistortion', 'causticsBoundaryWidth', 0.05, 1, 0.01, 'Caustics boundary width'),
  numberParameter('noise.phasorFrequency', 'noiseDistortion', 'phasorFrequency', 0.5, 20, 0.05, 'Phasor line frequency'),
  numberParameter('noise.phasorBandwidth', 'noiseDistortion', 'phasorBandwidth', 0.1, 2, 0.01, 'Phasor bandwidth'),
  numberParameter('noise.phasorDirection', 'noiseDistortion', 'phasorDirection', 0, 360, 1, 'Phasor direction', degrees),
  numberParameter('noise.phasorDirectionSpread', 'noiseDistortion', 'phasorDirectionSpread', 0, 1, 0.01, 'Phasor direction spread'),
  numberParameter('noise.phasorSharpness', 'noiseDistortion', 'phasorSharpness', 0.5, 10, 0.05, 'Phasor sharpness'),
  numberParameter('noise.phasorWarpStrength', 'noiseDistortion', 'phasorWarpStrength', 0, 1, 0.01, 'Phasor warp strength'),
  numberParameter('noise.phasorTangentMix', 'noiseDistortion', 'phasorTangentMix', 0, 1, 0.01, 'Phasor tangent mix'),
  numberParameter('noise.phasorKernelDensity', 'noiseDistortion', 'phasorKernelDensity', 0.25, 2, 0.01, 'Phasor kernel density'),

  booleanParameter('diffuse.enabled', 'diffuse', 'enabled', 'Enable diffuse/stipple rendering'),
  enumParameter('diffuse.mode', 'diffuse', 'mode', ['block', 'smooth', 'dither', 'halftone', 'ascii', 'legacy'], 'Diffuse rendering mode'),
  numberParameter('diffuse.scatter', 'diffuse', 'scatter', 0, 300, 1, 'Diffuse scatter distance'),
  numberParameter('diffuse.grain', 'diffuse', 'grain', 0.01, 5, 0.01, 'Diffuse grain size'),
  numberParameter('diffuse.ditherGrain', 'diffuse', 'ditherGrain', 0.01, 12, 0.01, 'Dither grain size'),
  numberParameter('diffuse.halftoneGrain', 'diffuse', 'halftoneGrain', 2, 64, 1, 'Halftone grain size', { integer: true }),
  numberParameter('diffuse.asciiGrain', 'diffuse', 'asciiGrain', 4, 64, 1, 'ASCII grain size', { integer: true }),
  numberParameter('diffuse.seed', 'diffuse', 'seed', 0, 99, 1, 'Diffuse hash seed', { integer: true }),
  numberParameter('diffuse.ditherThreshold', 'diffuse', 'ditherThreshold', 0, 1, 0.01, 'Dither threshold'),
  numberParameter('diffuse.halftoneSize', 'diffuse', 'halftoneSize', 0.05, 1, 0.01, 'Halftone cell fill size'),
  numberParameter('diffuse.grainAdaptiveAmount', 'diffuse', 'grainAdaptiveAmount', 0, 1, 0.01, 'Adaptive grain amount'),
  numberParameter('diffuse.asciiFontSize', 'diffuse', 'asciiFontSize', 8, 128, 1, 'ASCII font size', { integer: true }),
  numberParameter('diffuse.asciiRotation', 'diffuse', 'asciiRotation', 0, 360, 1, 'ASCII glyph rotation', degrees),


  booleanParameter('slit.enabled', 'slitScan', 'enabled', 'Enable slit-scan distortion'),
  enumParameter('slit.mode', 'slitScan', 'mode', ['linear', 'circular', 'polygon', 'wave'], 'Slit-scan mode'),
  numberParameter('slit.angle', 'slitScan', 'angle', 0, 360, 1, 'Slit direction', degrees),
  numberParameter('slit.offsetAngle', 'slitScan', 'offsetAngle', 0, 360, 1, 'Slit offset direction', degrees),
  numberParameter('slit.slitWidth', 'slitScan', 'slitWidth', 1, 200, 1, 'Slit width'),
  numberParameter('slit.offset', 'slitScan', 'offset', 0, 1, 0.01, 'Slit displacement'),
  numberParameter('slit.variance', 'slitScan', 'variance', 0, 1, 0.01, 'Slit width variance'),

  booleanParameter('stretch.enabled', 'stretch', 'enabled', 'Enable stretch distortion'),
  numberParameter('stretch.bandHeight', 'stretch', 'bandHeight', 1, 600, 1, 'Stretch band height'),
  numberParameter('stretch.variation', 'stretch', 'variation', 0, 1, 0.01, 'Stretch line variation'),
  numberParameter('stretch.glowIntensity', 'stretch', 'glowIntensity', 0, 3, 0.01, 'Stretch glow intensity'),
  numberParameter('stretch.glowRadius', 'stretch', 'glowRadius', 1, 80, 1, 'Stretch glow radius'),

  numberParameter('normalMap.angle', 'normalMap', 'angle', 0, 360, 1, 'Normal-map light direction', degrees),
  numberParameter('radon.angle', 'radon', 'angle', 0, 360, 1, 'Radon direction', degrees),
  numberParameter('iridescence.angle', 'iridescence', 'angle', 0, 360, 1, 'Iridescence direction', degrees),
  numberParameter('postprocess.kaleidoscopeRotation', 'postprocess', 'kaleidoscopeRotation', 0, 360, 1, 'Kaleidoscope rotation', degrees),
  numberParameter('postprocess.voronoiAngle', 'postprocess', 'voronoiAngle', 0, 360, 1, 'Voronoi direction', degrees),
  numberParameter('postprocess.glassRotation', 'postprocess', 'glassRotation', 0, 360, 1, 'Glass direction', degrees),
  numberParameter('postprocess.particleDirection', 'postprocess', 'particleDirection', 0, 360, 1, 'Particle direction', degrees),
  numberParameter('animation.direction', 'animation', 'direction', 0, 360, 1, 'Animation direction', degrees),
  numberParameter('animation.speed', 'animation', 'speed', 0.01, 8, 0.01, 'Animation speed'),
] as const;

const SHARED_LIMIT_KEYS: Partial<Record<string, ParameterLimitKey>> = {
  'gradient.angle': 'gradient.angle',
  'noise.dwRotAngle1': 'noise.dwRotAngle1',
  'noise.dwRotAngle2': 'noise.dwRotAngle2',
  'noise.dwDriftAngle': 'noise.dwDriftAngle',
  'noise.aeSubRotation': 'noise.aeSubRotation',
  'noise.causticsDepth': 'noise.causticsDepth',
  'noise.causticsRefraction': 'noise.causticsRefraction',
  'noise.causticsSharpness': 'noise.causticsSharpness',
  'noise.causticsComplexity': 'noise.causticsComplexity',
  'noise.causticsWaveSpread': 'noise.causticsWaveSpread',
  'noise.causticsBoundaryWidth': 'noise.causticsBoundaryWidth',
  'noise.phasorFrequency': 'noise.phasorFrequency',
  'noise.phasorBandwidth': 'noise.phasorBandwidth',
  'noise.phasorDirection': 'noise.phasorDirection',
  'noise.phasorDirectionSpread': 'noise.phasorDirectionSpread',
  'noise.phasorSharpness': 'noise.phasorSharpness',
  'noise.phasorWarpStrength': 'noise.phasorWarpStrength',
  'noise.phasorTangentMix': 'noise.phasorTangentMix',
  'noise.phasorKernelDensity': 'noise.phasorKernelDensity',
  'slit.angle': 'slit.angle',
  'slit.offsetAngle': 'slit.offsetAngle',
  'diffuse.scatter': 'diffuse.scatter',
  'diffuse.grain': 'diffuse.grain',
  'diffuse.ditherGrain': 'diffuse.ditherGrain',
  'diffuse.halftoneGrain': 'diffuse.halftoneGrain',
  'diffuse.asciiGrain': 'diffuse.asciiGrain',
  'diffuse.seed': 'diffuse.seed',
  'diffuse.ditherThreshold': 'diffuse.ditherThreshold',
  'diffuse.halftoneSize': 'diffuse.halftoneSize',
  'diffuse.grainAdaptiveAmount': 'diffuse.grainAdaptiveAmount',
  'diffuse.asciiFontSize': 'diffuse.asciiFontSize',
  'diffuse.asciiRotation': 'diffuse.asciiRotation',
  'flow.seed': 'flow.seed',
  'flow.particleCount': 'flow.particleCount',
  'flow.curlScale': 'flow.curlScale',
  'flow.curlStrength': 'flow.curlStrength',
  'flow.speed': 'flow.speed',
  'flow.ribbonWidth': 'flow.ribbonWidth',
  'flow.stretch': 'flow.stretch',
  'flow.density': 'flow.density',
  'flow.trail': 'flow.trail',
  'flow.contrast': 'flow.contrast',
  'normalMap.angle': 'normalMap.angle',
  'radon.angle': 'radon.angle',
  'iridescence.angle': 'iridescence.angle',
  'postprocess.kaleidoscopeRotation': 'postprocess.kaleidoscopeRotation',
  'postprocess.voronoiAngle': 'postprocess.voronoiAngle',
  'postprocess.glassRotation': 'postprocess.glassRotation',
  'postprocess.particleDirection': 'postprocess.particleDirection',
  'animation.direction': 'animation.direction',
  'animation.speed': 'animation.speed',
};

function applySharedLimit(definition: ParameterDefinition): ParameterDefinition {
  if (definition.type !== 'number') return definition;
  const limitKey = SHARED_LIMIT_KEYS[definition.path];
  const limit = limitKey ? PARAMETER_LIMITS[limitKey] : undefined;
  return limit ? { ...definition, ...limit } : definition;
}

export const CONTROL_PARAMETER_DEFINITIONS: readonly ParameterDefinition[] = RAW_CONTROL_PARAMETER_DEFINITIONS.map(applySharedLimit);

const definitionsByPath = new Map(CONTROL_PARAMETER_DEFINITIONS.map(definition => [definition.path, definition]));

export function getParameterDefinition(path: string): ParameterDefinition | null {
  return definitionsByPath.get(path) ?? null;
}

export function listParameterDefinitions(prefix?: string): ParameterDefinition[] {
  const normalizedPrefix = prefix?.trim();
  return CONTROL_PARAMETER_DEFINITIONS.filter(definition => (
    !normalizedPrefix || definition.path === normalizedPrefix || definition.path.startsWith(`${normalizedPrefix}.`)
  ));
}

export function normalizeParameterValue(definition: ParameterDefinition, value: ParameterValue): ParameterValue {
  if (definition.type !== 'number') return value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  if (definition.wrapAngle) {
    const fullTurn = definition.angleUnit === 'radians' ? Math.PI * 2 : 360;
    const wrapped = ((value % fullTurn) + fullTurn) % fullTurn;
    return definition.integer ? Math.round(wrapped) : wrapped;
  }
  const clamped = Math.min(definition.max ?? value, Math.max(definition.min ?? value, value));
  return definition.integer ? Math.round(clamped) : clamped;
}

export function validateParameterValue(
  definition: ParameterDefinition,
  value: ParameterValue,
): { ok: true; value: ParameterValue } | { ok: false; message: string } {
  if (definition.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    return { ok: false, message: `${definition.path} requires a finite number` };
  }
  if (definition.type === 'number' && typeof value === 'number' && !definition.wrapAngle) {
    if (definition.min !== undefined && value < definition.min || definition.max !== undefined && value > definition.max) {
      return { ok: false, message: `${definition.path} must be between ${definition.min} and ${definition.max}` };
    }
    if (definition.integer && !Number.isInteger(value)) {
      return { ok: false, message: `${definition.path} requires an integer` };
    }
  }
  if (definition.type === 'boolean' && typeof value !== 'boolean') {
    return { ok: false, message: `${definition.path} requires a boolean` };
  }
  if ((definition.type === 'string' || definition.type === 'enum') && typeof value !== 'string') {
    return { ok: false, message: `${definition.path} requires a string` };
  }
  if (definition.type === 'enum' && definition.enumValues && !definition.enumValues.includes(value as string)) {
    return { ok: false, message: `${definition.path} must be one of: ${definition.enumValues.join(', ')}` };
  }
  return { ok: true, value: normalizeParameterValue(definition, value) };
}
