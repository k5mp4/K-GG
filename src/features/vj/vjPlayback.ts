import { normalizeBeatSyncBpm } from '../../lib/animationConfig';

export type VjBeatPosition = { beat: number; progress: number; bar: number; shouldAdvance: boolean };

/** Four-beat performance clock. `now` uses monotonic milliseconds, like performance.now(). */
export class VjBeatClock {
  private running = false;
  private bpm = 120;
  private lastNow = 0;
  private bars = 0;
  private deliveredBar = 0;

  start(now: number, bpm: number): void {
    this.running = true;
    this.bpm = normalizeBeatSyncBpm(bpm);
    this.lastNow = now;
    this.bars = 0;
    this.deliveredBar = 0;
  }

  stop(): void {
    this.running = false;
  }

  setBpm(now: number, bpm: number): void {
    this.tick(now);
    this.bpm = normalizeBeatSyncBpm(bpm);
  }

  poll(now: number): VjBeatPosition {
    this.tick(now);
    const bar = Math.floor(this.bars);
    const progress = this.bars - bar;
    const shouldAdvance = this.running && bar > this.deliveredBar;
    // A suspended tab can miss many bars. Consume them together without replaying old changes.
    this.deliveredBar = bar;
    return { beat: Math.min(3, Math.floor(progress * 4)), progress, bar, shouldAdvance };
  }

  private tick(now: number): void {
    if (!this.running) return;
    this.bars += Math.max(0, now - this.lastNow) * this.bpm / 240000;
    this.lastNow = Math.max(this.lastNow, now);
  }
}

/** The first entry is the next preset; each cycle contains every selected ID once. */
export function createVjQueue(
  ids: readonly string[], currentId: string | null, shuffle: boolean, rng: () => number = Math.random,
): string[] {
  const queue = [...new Set(ids)];
  if (!shuffle) {
    const current = currentId === null ? -1 : queue.indexOf(currentId);
    return current < 0 ? queue : [...queue.slice(current + 1), ...queue.slice(0, current + 1)];
  }
  for (let i = queue.length - 1; i > 0; i--) {
    const next = Math.min(i, Math.max(0, Math.floor(rng() * (i + 1))));
    [queue[i], queue[next]] = [queue[next], queue[i]];
  }
  if (queue.length > 1 && queue[0] === currentId) {
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  return queue;
}

/** Consume the displayed candidate and prepare the next cycle in time to preview two cues. */
export function advanceVjQueue(
  queue: readonly string[], ids: readonly string[], currentId: string | null,
  shuffle: boolean, rng: () => number = Math.random,
): string[] {
  const available = new Set(ids);
  const remaining = queue.slice(1).filter(id => available.has(id));
  const next = remaining.length ? remaining : createVjQueue(ids, currentId, shuffle, rng);
  // Commit the next cycle before exposing After Next, including at the current cycle's tail.
  return next.length === 1 && available.size > 1
    ? [...next, ...createVjQueue(ids, next[0], shuffle, rng)] : next;
}
