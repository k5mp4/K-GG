import {
  getEnumParameterDefault,
  getEnumParameterLimit,
  getParameterLimit,
  type ParameterLimitKey,
} from './parameterLimits.js';
import type { ParameterDefinition, ParameterValue } from './types.js';

const numberParameter = (
  path: ParameterLimitKey,
  target: string,
  property: string,
  description: string,
): ParameterDefinition => ({
  path,
  target,
  property,
  type: 'number',
  writable: true,
  ...getParameterLimit(path),
  description,
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
  options: Pick<ParameterDefinition, 'defaultValue'> = {},
): ParameterDefinition => ({ path, target, property, type: 'enum', writable: true, enumValues, description, ...options });

/**
 * Stable developer-facing paths. The app-side adapter maps these paths to its
 * existing normalizers and setters; this list is intentionally not a mirror of
 * every internal UI field.
 */
const RAW_CONTROL_PARAMETER_DEFINITIONS: readonly ParameterDefinition[] = [
  numberParameter('gradient.angle', 'gradient', 'angle', 'Gradient direction in degrees'),
  numberParameter('gradient.rampRepeat', 'gradient', 'rampRepeat', 'Number of gradient ramp repetitions'),

  booleanParameter('noise.enabled', 'noiseDistortion', 'enabled', 'Enable the noise field'),
  enumParameter('noise.type', 'noiseDistortion', 'type', ['simplex', 'fbm', 'voronoi', 'curl', 'fast_curl', 'domain_warp_anim', 'seamless', 'ridged_fbm', 'ae_fractal', 'caustics', 'phasor'], 'Noise algorithm'),
  numberParameter('noise.amount', 'noiseDistortion', 'amount', 'Noise displacement amount'),
  numberParameter('noise.scale', 'noiseDistortion', 'scale', 'Noise scale'),
  numberParameter('noise.octaves', 'noiseDistortion', 'octaves', 'Noise octave count'),
  numberParameter('noise.speed', 'noiseDistortion', 'speed', 'Noise animation speed'),
  numberParameter('noise.dwRotAngle1', 'noiseDistortion', 'dwRotAngle1', 'Domain warp rotation angle 1'),
  numberParameter('noise.dwRotAngle2', 'noiseDistortion', 'dwRotAngle2', 'Domain warp rotation angle 2'),
  numberParameter('noise.dwDriftAngle', 'noiseDistortion', 'dwDriftAngle', 'Domain warp drift angle'),
  numberParameter('noise.aeSubRotation', 'noiseDistortion', 'aeSubRotation', 'AE fractal sub rotation'),
  numberParameter('noise.causticsDepth', 'noiseDistortion', 'causticsDepth', 'Caustics depth'),
  numberParameter('noise.causticsRefraction', 'noiseDistortion', 'causticsRefraction', 'Caustics refraction'),
  numberParameter('noise.causticsSharpness', 'noiseDistortion', 'causticsSharpness', 'Caustics sharpness'),
  numberParameter('noise.causticsComplexity', 'noiseDistortion', 'causticsComplexity', 'Caustics wave complexity'),
  numberParameter('noise.causticsWaveSpread', 'noiseDistortion', 'causticsWaveSpread', 'Caustics wave spread'),
  numberParameter('noise.causticsBoundaryWidth', 'noiseDistortion', 'causticsBoundaryWidth', 'Caustics boundary width'),
  numberParameter('noise.phasorFrequency', 'noiseDistortion', 'phasorFrequency', 'Phasor line frequency'),
  numberParameter('noise.phasorBandwidth', 'noiseDistortion', 'phasorBandwidth', 'Phasor bandwidth'),
  numberParameter('noise.phasorDirection', 'noiseDistortion', 'phasorDirection', 'Phasor direction'),
  numberParameter('noise.phasorDirectionSpread', 'noiseDistortion', 'phasorDirectionSpread', 'Phasor direction spread'),
  numberParameter('noise.phasorSharpness', 'noiseDistortion', 'phasorSharpness', 'Phasor sharpness'),
  numberParameter('noise.phasorWarpStrength', 'noiseDistortion', 'phasorWarpStrength', 'Phasor warp strength'),
  numberParameter('noise.phasorTangentMix', 'noiseDistortion', 'phasorTangentMix', 'Phasor tangent mix'),
  numberParameter('noise.phasorKernelDensity', 'noiseDistortion', 'phasorKernelDensity', 'Phasor kernel density'),

  booleanParameter('diffuse.enabled', 'diffuse', 'enabled', 'Enable diffuse/stipple rendering'),
  enumParameter('diffuse.mode', 'diffuse', 'mode', ['block', 'smooth', 'dither', 'halftone', 'ascii', 'legacy'], 'Diffuse rendering mode'),
  numberParameter('diffuse.scatter', 'diffuse', 'scatter', 'Diffuse scatter distance'),
  numberParameter('diffuse.grain', 'diffuse', 'grain', 'Diffuse grain size'),
  numberParameter('diffuse.ditherGrain', 'diffuse', 'ditherGrain', 'Dither grain size'),
  numberParameter('diffuse.halftoneGrain', 'diffuse', 'halftoneGrain', 'Halftone grain size'),
  numberParameter('diffuse.asciiGrain', 'diffuse', 'asciiGrain', 'ASCII grain size'),
  numberParameter('diffuse.seed', 'diffuse', 'seed', 'Diffuse hash seed'),
  numberParameter('diffuse.ditherThreshold', 'diffuse', 'ditherThreshold', 'Dither threshold'),
  numberParameter('diffuse.halftoneSize', 'diffuse', 'halftoneSize', 'Halftone cell fill size'),
  numberParameter('diffuse.grainAdaptiveAmount', 'diffuse', 'grainAdaptiveAmount', 'Adaptive grain amount'),
  numberParameter('diffuse.asciiFontSize', 'diffuse', 'asciiFontSize', 'ASCII font size'),
  numberParameter('diffuse.asciiRotation', 'diffuse', 'asciiRotation', 'ASCII glyph rotation'),

  numberParameter('flow.seed', 'flowGradient', 'seed', 'Flow field seed'),
  numberParameter('flow.particleCount', 'flowGradient', 'particleCount', 'Flow particle count'),
  numberParameter('flow.curlScale', 'flowGradient', 'curlScale', 'Flow curl scale'),
  numberParameter('flow.curlStrength', 'flowGradient', 'curlStrength', 'Flow curl strength'),
  numberParameter('flow.speed', 'flowGradient', 'speed', 'Flow speed'),
  numberParameter('flow.ribbonWidth', 'flowGradient', 'ribbonWidth', 'Flow ribbon width'),
  numberParameter('flow.stretch', 'flowGradient', 'stretch', 'Flow stretch'),
  numberParameter('flow.density', 'flowGradient', 'density', 'Flow density'),
  numberParameter('flow.trail', 'flowGradient', 'trail', 'Flow trail retention'),
  numberParameter('flow.contrast', 'flowGradient', 'contrast', 'Flow contrast'),
  numberParameter('flow.flowOpacity', 'flowGradient', 'flowOpacity', 'Flow composite opacity'),
  numberParameter('flow.particleOpacity', 'flowGradient', 'particleOpacity', 'Flow particle opacity'),
  numberParameter('flow.particleSize', 'flowGradient', 'particleSize', 'Flow particle size'),


  booleanParameter('slit.enabled', 'slitScan', 'enabled', 'Enable slit-scan distortion'),
  enumParameter('slit.mode', 'slitScan', 'mode', ['linear', 'circular', 'polygon', 'wave'], 'Slit-scan mode'),
  numberParameter('slit.angle', 'slitScan', 'angle', 'Slit direction'),
  numberParameter('slit.offsetAngle', 'slitScan', 'offsetAngle', 'Slit offset direction'),
  numberParameter('slit.slitWidth', 'slitScan', 'slitWidth', 'Slit width'),
  numberParameter('slit.offset', 'slitScan', 'offset', 'Slit displacement'),
  numberParameter('slit.variance', 'slitScan', 'variance', 'Slit width variance'),

  booleanParameter('stretch.enabled', 'stretch', 'enabled', 'Enable stretch distortion'),
  numberParameter('stretch.bandHeight', 'stretch', 'bandHeight', 'Stretch band height'),
  numberParameter('stretch.variation', 'stretch', 'variation', 'Stretch line variation'),
  numberParameter('stretch.glowIntensity', 'stretch', 'glowIntensity', 'Stretch glow intensity'),
  numberParameter('stretch.glowRadius', 'stretch', 'glowRadius', 'Stretch glow radius'),

  numberParameter('normalMap.angle', 'normalMap', 'angle', 'Normal-map light direction'),
  numberParameter('radon.angle', 'radon', 'angle', 'Radon direction'),
  numberParameter('iridescence.angle', 'iridescence', 'angle', 'Iridescence direction'),
  numberParameter('postprocess.kaleidoscopeRotation', 'postprocess', 'kaleidoscopeRotation', 'Kaleidoscope rotation'),
  enumParameter('postprocess.voronoiDistMetric', 'postprocess', 'voronoiDistMetric', getEnumParameterLimit('postprocess.voronoiDistMetric').values, 'Postprocess Voronoi distance metric', { defaultValue: getEnumParameterDefault('postprocess.voronoiDistMetric') }),
  numberParameter('postprocess.voronoiMinkowskiExp', 'postprocess', 'voronoiMinkowskiExp', 'Postprocess Voronoi Minkowski exponent'),
  enumParameter('postprocess.voronoiFeature', 'postprocess', 'voronoiFeature', getEnumParameterLimit('postprocess.voronoiFeature').values, 'Postprocess Voronoi feature', { defaultValue: getEnumParameterDefault('postprocess.voronoiFeature') }),
  numberParameter('postprocess.voronoiAngle', 'postprocess', 'voronoiAngle', 'Voronoi direction'),
  numberParameter('postprocess.glassRotation', 'postprocess', 'glassRotation', 'Glass direction'),
  enumParameter('postprocess.glassTilePattern', 'postprocess', 'glassTilePattern', ['square', 'diamond', 'hexagon', 'triangle', 'brick'], 'GlassTile surface pattern'),
  numberParameter('postprocess.glassTileSize', 'postprocess', 'glassTileSize', 'GlassTile size in pixels'),
  numberParameter('postprocess.glassTileBevel', 'postprocess', 'glassTileBevel', 'GlassTile bevel fraction'),
  numberParameter('postprocess.glassTileSurfaceHeight', 'postprocess', 'glassTileSurfaceHeight', 'GlassTile surface height'),
  numberParameter('postprocess.glassTileCurvature', 'postprocess', 'glassTileCurvature', 'GlassTile curvature'),
  numberParameter('postprocess.glassTileRefraction', 'postprocess', 'glassTileRefraction', 'GlassTile refraction in pixels'),
  numberParameter('postprocess.glassTileDispersion', 'postprocess', 'glassTileDispersion', 'GlassTile chromatic dispersion'),
  numberParameter('postprocess.glassTileRoughness', 'postprocess', 'glassTileRoughness', 'GlassTile surface detail roughness'),
  numberParameter('postprocess.glassTileDetailScale', 'postprocess', 'glassTileDetailScale', 'GlassTile detail scale'),
  numberParameter('postprocess.glassTileRotation', 'postprocess', 'glassTileRotation', 'GlassTile rotation in degrees'),
  numberParameter('postprocess.glassTileMix', 'postprocess', 'glassTileMix', 'GlassTile effect mix'),
  enumParameter(
    'postprocess.glassTileEdgeMode',
    'postprocess',
    'glassTileEdgeMode',
    getEnumParameterLimit('postprocess.glassTileEdgeMode').values,
    'GlassTile source edge mode',
    { defaultValue: getEnumParameterDefault('postprocess.glassTileEdgeMode') },
  ),
  numberParameter('postprocess.glassTileSeed', 'postprocess', 'glassTileSeed', 'GlassTile surface seed'),
  numberParameter('postprocess.particleDirection', 'postprocess', 'particleDirection', 'Particle direction'),
  numberParameter('animation.direction', 'animation', 'direction', 'Animation direction'),
  numberParameter('animation.speed', 'animation', 'speed', 'Animation speed'),
] as const;

export const CONTROL_PARAMETER_DEFINITIONS: readonly ParameterDefinition[] = RAW_CONTROL_PARAMETER_DEFINITIONS;

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
