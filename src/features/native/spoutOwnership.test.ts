import { describe, expect, it } from 'vitest';
import { createSpoutOwnership } from './spoutOwnership';

function setup() {
  const queue: Array<() => void> = [];
  let releases = 0;
  const ownership = createSpoutOwnership(() => { releases += 1; }, callback => { queue.push(callback); });
  return { ownership, flush: () => queue.splice(0).forEach(callback => callback()), releases: () => releases };
}

describe('createSpoutOwnership', () => {
  it('releases once the last owner is gone', () => {
    const { ownership, flush, releases } = setup();
    const release = ownership.acquire();
    release();
    flush();
    expect(releases()).toBe(1);
  });

  it('keeps the sender when a new owner mounts in the same commit', () => {
    const { ownership, flush, releases } = setup();
    const panel = ownership.acquire();
    panel();
    const deck = ownership.acquire();
    flush();
    expect(releases()).toBe(0);
    deck();
    flush();
    expect(releases()).toBe(1);
  });

  it('keeps the sender while another owner remains and ignores repeated releases', () => {
    const { ownership, flush, releases } = setup();
    const first = ownership.acquire();
    const second = ownership.acquire();
    first();
    first();
    flush();
    expect(releases()).toBe(0);
    second();
    flush();
    expect(releases()).toBe(1);
  });
});
