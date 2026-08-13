import { describe, expect, it } from 'vitest';
import { MAX_SCENARIO_COMMANDS, MAX_SCENARIO_TOTAL_WAIT_MS, validateScenario } from './scenarios.js';

describe('K-GG scenario validation', () => {
  it('accepts allowlisted command-shaped input', () => {
    expect(validateScenario([
      { type: 'setParameter', path: 'gradient.angle', value: 90 },
      { type: 'enableEffect', kind: 'noise', enabled: true },
    ]).ok).toBe(true);
  });

  it('bounds command count and waits', () => {
    expect(validateScenario(Array.from({ length: MAX_SCENARIO_COMMANDS + 1 }, () => ({ type: 'wait', milliseconds: 0 }))))
      .toMatchObject({ ok: false });
    expect(validateScenario([{ type: 'wait', milliseconds: 5_001 }])).toMatchObject({ ok: false });
  });

  it('only accepts scenario-safe semantic controls', () => {
    expect(validateScenario([
      { type: 'control', operationId: 'set_gradient_stops', input: { stops: [] } },
    ]).ok).toBe(true);
    expect(validateScenario([
      { type: 'control', operationId: 'delete_preset', input: { presetId: 'x', confirm: true } },
    ])).toMatchObject({ ok: false });
  });

  it('rejects unknown commands, malformed shapes, and excessive aggregate waits', () => {
    expect(validateScenario([{ type: 'not-a-command' }])).toMatchObject({ ok: false });
    expect(validateScenario([{ type: 'setParameter', path: 'gradient.angle', value: 90, extra: true }])).toMatchObject({ ok: false });
    expect(validateScenario([
      { type: 'wait', milliseconds: MAX_SCENARIO_TOTAL_WAIT_MS },
      { type: 'wait', milliseconds: 1 },
    ])).toMatchObject({ ok: false });
  });
});
