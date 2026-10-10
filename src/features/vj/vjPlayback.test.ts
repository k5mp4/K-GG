import { describe, expect, it } from 'vitest';
import { advanceVjQueue, createVjQueue, VjBeatClock } from './vjPlayback';

describe('VJ four-beat clock', () => {
  it('advances once at the fourth beat and stays independent of animation timing', () => {
    const clock = new VjBeatClock();
    clock.start(100, 120);
    expect(clock.poll(600)).toEqual({ beat: 1, progress: 0.25, bar: 0, shouldAdvance: false });
    expect(clock.poll(2099).shouldAdvance).toBe(false);
    expect(clock.poll(2100)).toEqual({ beat: 0, progress: 0, bar: 1, shouldAdvance: true });
    expect(clock.poll(2100).shouldAdvance).toBe(false);
  });

  it('preserves the beat phase on tempo changes', () => {
    const clock = new VjBeatClock();
    clock.start(0, 120);
    clock.setBpm(1000, 60);
    expect(clock.poll(1000).progress).toBe(0.5);
    expect(clock.poll(2999).shouldAdvance).toBe(false);
    expect(clock.poll(3000).shouldAdvance).toBe(true);
  });

  it('collapses missed bars into one advance after a delayed poll', () => {
    const clock = new VjBeatClock();
    clock.start(0, 120);
    expect(clock.poll(11500)).toEqual({ beat: 3, progress: 0.75, bar: 5, shouldAdvance: true });
    expect(clock.poll(11500).shouldAdvance).toBe(false);
    expect(clock.poll(12000).shouldAdvance).toBe(true);
  });

  it('stops the clock and starts a new first beat only on restart', () => {
    const clock = new VjBeatClock();
    clock.start(0, 120);
    clock.poll(1000);
    clock.stop();
    expect(clock.poll(10000)).toEqual({ beat: 2, progress: 0.5, bar: 0, shouldAdvance: false });
    clock.start(10000, 120);
    expect(clock.poll(10000)).toEqual({ beat: 0, progress: 0, bar: 0, shouldAdvance: false });
  });

  it('does not lose a pending bar advance when BPM changes at a boundary', () => {
    const clock = new VjBeatClock();
    clock.start(0, 120);
    clock.setBpm(2000, 60);
    expect(clock.poll(2000).shouldAdvance).toBe(true);
    expect(clock.poll(2000).shouldAdvance).toBe(false);
  });
});

describe('VJ preset queue', () => {
  it('starts after the current preset and preserves the previewed next candidate', () => {
    const ids = ['a', 'b', 'c'];
    const queue = createVjQueue(ids, 'b', false);
    expect(queue).toEqual(['c', 'a', 'b']);
    expect(advanceVjQueue(queue, ids, 'c', false)).toEqual(['a', 'b']);
    expect(advanceVjQueue(['b'], ids, 'b', false)).toEqual(['c', 'a', 'b']);
  });

  it('does not repeat in a shuffle cycle or across its boundary', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const queue = createVjQueue(ids, 'a', true, () => 0.5);
    expect(new Set(queue)).toEqual(new Set(ids));
    expect(queue[0]).not.toBe('a');
    const last = queue.at(-1)!;
    const nextCycle = advanceVjQueue([last], ids, last, true, () => 0.5);
    expect(new Set(nextCycle)).toEqual(new Set(ids));
    expect(nextCycle[0]).not.toBe(last);
  });

  it('handles an empty list and loops a single preset', () => {
    expect(createVjQueue([], null, true)).toEqual([]);
    expect(createVjQueue(['a'], 'a', true)).toEqual(['a']);
    expect(advanceVjQueue(['a'], ['a'], 'a', true)).toEqual(['a']);
  });

  it('deduplicates IDs and drops removed presets from the remaining queue', () => {
    expect(createVjQueue(['a', 'a', 'b'], null, false)).toEqual(['a', 'b']);
    expect(advanceVjQueue(['a', 'b', 'c'], ['a', 'c'], 'a', false)).toEqual(['c', 'a', 'c']);
  });

  it('commits After Next across a cycle boundary before either candidate is loaded', () => {
    for (const shuffle of [false, true]) {
      for (const ids of [['a', 'b'], ['a', 'b', 'c']]) {
        let current: string | null = null;
        let queue = createVjQueue(ids, current, shuffle, () => 0.5);
        for (let index = 0; index < 12; index++) {
          const [next, afterNext] = queue;
          expect(next).not.toBe(current);
          expect(afterNext).toBeDefined();
          queue = advanceVjQueue(queue, ids, next, shuffle, () => index / 12);
          expect(queue[0]).toBe(afterNext);
          current = next;
        }
      }
    }
  });
});
