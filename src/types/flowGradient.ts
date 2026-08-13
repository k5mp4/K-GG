import { clampParameter, getParameterLimit } from '../lib/parameterLimits';

export type FlowGradientConfig = {
  seed: number;
  particleCount: number;
  curlScale: number;
  curlStrength: number;
  speed: number;
  ribbonWidth: number;
  stretch: number;
  density: number;
  trail: number;
  contrast: number;
  flowOpacity: number;
  particleOpacity: number;
  particleSize: number;
};

export const FLOW_GRADIENT_DEFAULTS: FlowGradientConfig = {
  seed: 42,
  particleCount: 100000,
  curlScale: 2.5,
  curlStrength: 1,
  speed: 0.6,
  ribbonWidth: 8,
  stretch: 1.5,
  density: 1,
  trail: 0.85,
  contrast: 1.2,
  flowOpacity: 1,
  particleOpacity: 0.82,
  particleSize: 1,
};

export function normalizeFlowGradientConfig(value: unknown): FlowGradientConfig {
  const source = typeof value === 'object' && value !== null
    ? value as Partial<FlowGradientConfig>
    : {};

  return {
    seed: clampParameter(source.seed, FLOW_GRADIENT_DEFAULTS.seed, getParameterLimit('flow.seed')),
    particleCount: clampParameter(source.particleCount, FLOW_GRADIENT_DEFAULTS.particleCount, getParameterLimit('flow.particleCount')),
    curlScale: clampParameter(source.curlScale, FLOW_GRADIENT_DEFAULTS.curlScale, getParameterLimit('flow.curlScale')),
    curlStrength: clampParameter(source.curlStrength, FLOW_GRADIENT_DEFAULTS.curlStrength, getParameterLimit('flow.curlStrength')),
    speed: clampParameter(source.speed, FLOW_GRADIENT_DEFAULTS.speed, getParameterLimit('flow.speed')),
    ribbonWidth: clampParameter(source.ribbonWidth, FLOW_GRADIENT_DEFAULTS.ribbonWidth, getParameterLimit('flow.ribbonWidth')),
    stretch: clampParameter(source.stretch, FLOW_GRADIENT_DEFAULTS.stretch, getParameterLimit('flow.stretch')),
    density: clampParameter(source.density, FLOW_GRADIENT_DEFAULTS.density, getParameterLimit('flow.density')),
    trail: clampParameter(source.trail, FLOW_GRADIENT_DEFAULTS.trail, getParameterLimit('flow.trail')),
    contrast: clampParameter(source.contrast, FLOW_GRADIENT_DEFAULTS.contrast, getParameterLimit('flow.contrast')),
    flowOpacity: clampParameter(source.flowOpacity, FLOW_GRADIENT_DEFAULTS.flowOpacity, getParameterLimit('flow.flowOpacity')),
    particleOpacity: clampParameter(source.particleOpacity, FLOW_GRADIENT_DEFAULTS.particleOpacity, getParameterLimit('flow.particleOpacity')),
    particleSize: clampParameter(source.particleSize, FLOW_GRADIENT_DEFAULTS.particleSize, getParameterLimit('flow.particleSize')),
  };
}
