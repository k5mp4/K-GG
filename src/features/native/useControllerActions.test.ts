import { describe, expect, it } from 'vitest';
import { CONTROLLER_APPLY_INTERVAL_MS, ControllerApplyScheduler } from './useControllerActions';

function setup() {
  let time = 1000;
  let callback: (() => void) | null = null;
  const parameters: [string, number][] = [];
  const scrubs: number[] = [];
  const bpms: number[] = [];
  const scheduler = new ControllerApplyScheduler({
    now: () => time,
    schedule: next => { callback = next; return 1; },
    cancel: () => { callback = null; },
    applyParameter: (target, value) => { parameters.push([target, value]); },
    applyScrub: delta => { scrubs.push(delta); },
    applyBpm: bpm => { bpms.push(bpm); },
  });
  const frame = (advance: number) => {
    time += advance;
    const run = callback;
    callback = null;
    run?.();
  };
  return { scheduler, parameters, scrubs, bpms, frame, pending: () => callback !== null };
}

describe('ControllerApplyScheduler', () => {
  it('applies only the latest value per target in one flush', () => {
    const { scheduler, parameters, frame } = setup();
    scheduler.setParameter('noise.amount', 0.1);
    scheduler.setParameter('noise.amount', 0.5);
    scheduler.setParameter('noise.amount', 1);
    frame(100);
    expect(parameters).toEqual([['noise.amount', 1]]);
  });

  it('carries input over to a later frame until the apply interval has passed', () => {
    const { scheduler, parameters, frame, pending } = setup();
    scheduler.setParameter('noise.amount', 0.5);
    frame(100);
    scheduler.setParameter('noise.amount', 0.8);
    frame(CONTROLLER_APPLY_INTERVAL_MS - 10);
    expect(parameters).toHaveLength(1);
    expect(pending()).toBe(true);
    frame(20);
    expect(parameters).toEqual([['noise.amount', 0.5], ['noise.amount', 0.8]]);
  });

  it('skips a value that rounds to the one already applied', () => {
    const { scheduler, parameters, frame } = setup();
    scheduler.setParameter('noise.amount', 0.5);
    frame(100);
    scheduler.setParameter('noise.amount', 0.5004); // 刻み幅0.01に丸めると同じ値
    frame(100);
    expect(parameters).toHaveLength(1);
  });

  it('sums scrub deltas into one seek', () => {
    const { scheduler, scrubs, frame } = setup();
    scheduler.scrub(0.01);
    scheduler.scrub(0.02);
    frame(100);
    expect(scrubs[0]).toBeCloseTo(0.03);
    expect(scrubs).toHaveLength(1);
  });

  it('applies only the latest BPM, rounded to 0.01', () => {
    const { scheduler, bpms, frame } = setup();
    scheduler.setBpm(120);
    scheduler.setBpm(127.456);
    frame(100);
    expect(bpms).toEqual([127.46]);
  });

  it('drops pending input on dispose', () => {
    const { scheduler, parameters, frame } = setup();
    scheduler.setParameter('noise.amount', 0.5);
    scheduler.dispose();
    frame(100);
    expect(parameters).toEqual([]);
  });
});
