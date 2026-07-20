import { describe, expect, it } from 'vitest';
import { moveStopsProportionally } from './proportionalRampEdit';

describe('moveStopsProportionally', () => {
  const stops = [0, 0.25, 0.5, 0.75, 1].map(position => ({ position }));

  it('moves the selected stop fully and attenuates movement by distance', () => {
    const moved = moveStopsProportionally(stops, new Set([2]), 2, 0.2, 1);

    expect(moved.map(stop => stop.position)).toEqual([0.05, 0.3625, 0.7, 0.8625, 1]);
  });

  it('keeps every stop in the ramp when the active stop reaches an endpoint', () => {
    const moved = moveStopsProportionally(stops, new Set([2]), 2, 1, 1);

    expect(moved.map(stop => stop.position)).toEqual([0.125, 0.53125, 1, 1, 1]);
    expect(moved).toHaveLength(stops.length);
  });

  it('moves every member of a multiple selection fully', () => {
    const moved = moveStopsProportionally(stops, new Set([1, 3]), 1, -0.1, 1);

    expect(moved.map(stop => stop.position)).toEqual([0, 0.15, 0.44375, 0.65, 0.94375]);
  });
});
