import { describe, expect, it } from 'vitest';
import {
  getFlowConfigSignature,
  getFlowFrameKey,
  getFlowLoopPhase,
  getFlowResetPhases,
  getTrailRetention,
} from './flowSimulation';
import { FLOW_GRADIENT_DEFAULTS, normalizeFlowGradientConfig } from '../types/flowGradient';

describe('flow simulation contracts', () => {
  it('wraps loop phase at the normalized boundary and clamps non-looping time', () => {
    expect(getFlowLoopPhase(0.25, true)).toBeCloseTo(0.25);
    expect(getFlowLoopPhase(1, true)).toBe(0);
    expect(getFlowLoopPhase(-0.25, true)).toBeCloseTo(0.75);
    expect(getFlowLoopPhase(1.25, false)).toBe(1);
    expect(getFlowLoopPhase(-0.25, false)).toBe(0);
  });

  it('rebuilds a wrapped loop from a full prewarm before catching up', () => {
    const initial = getFlowResetPhases({
      phase: 0,
      previousPhase: 0,
      loopEnabled: true,
    });
    expect(initial).toHaveLength(24);
    expect(initial[0]).toBeCloseTo(1 / 24);
    expect(initial[23]).toBe(1);

    const wrapped = getFlowResetPhases({
      phase: 0.04,
      previousPhase: 0.95,
      loopEnabled: true,
    });
    expect(wrapped).toHaveLength(25);
    expect(wrapped[23]).toBe(1);
    expect(wrapped[24]).toBeCloseTo(1.04);

    const forwardSeek = getFlowResetPhases({
      phase: 0.5,
      previousPhase: 0.2,
      loopEnabled: true,
    });
    expect(forwardSeek).toHaveLength(12);
    expect(forwardSeek[11]).toBeCloseTo(0.5);

    expect(getFlowResetPhases({
      phase: 0.5,
      previousPhase: 0.4,
      loopEnabled: true,
      reset: false,
    })).toEqual([]);
  });

  it('normalizes missing and invalid flow parameters to bounded defaults', () => {
    const normalized = normalizeFlowGradientConfig({
      seed: Number.NaN,
      particleCount: 999999,
      curlScale: -1,
      ribbonWidth: 999,
      trail: 2,
      contrast: Number.POSITIVE_INFINITY,
      flowOpacity: -1,
      particleOpacity: 2,
      particleSize: 9,
    });

    expect(normalized.seed).toBe(FLOW_GRADIENT_DEFAULTS.seed);
    expect(normalized.particleCount).toBe(500000);
    expect(normalized.curlScale).toBe(0.1);
    expect(normalized.ribbonWidth).toBe(128);
    expect(normalized.trail).toBe(1);
    expect(normalized.contrast).toBe(FLOW_GRADIENT_DEFAULTS.contrast);
    expect(normalized).toMatchObject({
      flowOpacity: 0,
      particleOpacity: 1,
      particleSize: 2,
    });
  });

  it('creates stable signatures and distinct logical frame keys', () => {
    const config = normalizeFlowGradientConfig({ seed: 7, particleCount: 20000 });
    expect(getFlowConfigSignature(config)).toBe(getFlowConfigSignature({ ...config }));
    expect(getFlowFrameKey({
      sessionId: 'preview',
      phase: 0.5,
      config,
      region: 'full:320x200',
    })).toBe(getFlowFrameKey({
      sessionId: 'preview',
      phase: 0.5,
      config,
      region: 'full:320x200',
    }));
    expect(getFlowFrameKey({
      sessionId: 'preview',
      phase: 0.5,
      config,
      region: 'tile:0,0:160x100',
    })).not.toBe(getFlowFrameKey({
      sessionId: 'preview',
      phase: 0.5,
      config,
      region: 'tile:1,0:160x100',
    }));
    const lowerOpacity = normalizeFlowGradientConfig({ ...config, flowOpacity: 0.25 });
    expect(getFlowConfigSignature(lowerOpacity)).not.toBe(getFlowConfigSignature(config));
  });

  it('maps trail control to a monotonic, bounded retention value', () => {
    expect(getTrailRetention(0)).toBe(0);
    expect(getTrailRetention(1)).toBeLessThan(1);
    expect(getTrailRetention(0.8)).toBeGreaterThan(getTrailRetention(0.4));
    expect(getTrailRetention(Number.NaN)).toBe(getTrailRetention(FLOW_GRADIENT_DEFAULTS.trail));
  });
});
