import type { FlowGradientConfig } from '../types/flowGradient';

export function getFlowLoopPhase(normalizedTime: number, loopEnabled: boolean): number {
  const value = Number.isFinite(normalizedTime) ? normalizedTime : 0;
  if (!loopEnabled) return Math.max(0, Math.min(1, value));
  return ((value % 1) + 1) % 1;
}

const FLOW_RESET_STEP_COUNT = 24;
const FLOW_PHASE_EPSILON = 0.000001;

export function getFlowResetPhases(options: {
  phase: number;
  previousPhase: number;
  loopEnabled: boolean;
  reset?: boolean;
}): number[] {
  if (options.reset === false) return [];

  const phase = Math.max(0, Math.min(1, Number.isFinite(options.phase) ? options.phase : 0));
  const previousPhase = Math.max(
    0,
    Math.min(1, Number.isFinite(options.previousPhase) ? options.previousPhase : 0),
  );
  const phaseRewound = phase + FLOW_PHASE_EPSILON < previousPhase;
  const boundaryPrewarm = options.loopEnabled && (
    phase <= FLOW_PHASE_EPSILON || phaseRewound
  );

  if (!boundaryPrewarm) {
    const steps = Math.max(1, Math.min(FLOW_RESET_STEP_COUNT, Math.ceil(phase * FLOW_RESET_STEP_COUNT)));
    return Array.from({ length: steps }, (_, index) => phase * ((index + 1) / steps));
  }

  const phases = Array.from(
    { length: FLOW_RESET_STEP_COUNT },
    (_, index) => (index + 1) / FLOW_RESET_STEP_COUNT,
  );
  const catchUpSteps = Math.min(FLOW_RESET_STEP_COUNT, Math.ceil(phase * FLOW_RESET_STEP_COUNT));
  for (let index = 0; index < catchUpSteps; index += 1) {
    phases.push(1 + phase * ((index + 1) / catchUpSteps));
  }
  return phases;
}

export function getTrailRetention(trail: number): number {
  const value = Number.isFinite(trail) ? Math.max(0, Math.min(1, trail)) : 0.85;
  // The UI value expresses how much motion history to expose, but retaining
  // nearly the entire previous density field turns a 3D ribbon bundle into a
  // featureless fog after a few frames. Keep the control monotonic while
  // reserving most of the signal for the current capsule field.
  return value * 0.42;
}

export function getFlowConfigSignature(config: FlowGradientConfig): string {
  return [
    config.seed,
    config.particleCount,
    config.curlScale,
    config.curlStrength,
    config.speed,
    config.ribbonWidth,
    config.stretch,
    config.density,
    config.trail,
    config.contrast,
    config.flowOpacity,
    config.particleOpacity,
    config.particleSize,
  ].join(':');
}

export function getFlowFrameKey(options: {
  sessionId: string;
  phase: number;
  config: FlowGradientConfig;
  region: string;
}): string {
  return [
    options.sessionId,
    Number.isFinite(options.phase) ? options.phase.toFixed(8) : '0',
    getFlowConfigSignature(options.config),
    options.region,
  ].join('|');
}
