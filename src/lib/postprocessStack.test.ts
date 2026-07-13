import { describe, expect, it } from 'vitest';
import {
  createDefaultPostprocessStack,
  movePostprocessStackLayer,
  normalizePostprocessEffectStack,
  updatePostprocessStackLayer,
} from './postprocessStack';

describe('postprocessStack', () => {
  it('creates a default stack with the selected legacy mode enabled', () => {
    expect(createDefaultPostprocessStack('glass')).toEqual([
      { kind: 'distort', enabled: false },
      { kind: 'mirror', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'glass', enabled: true },
    ]);
  });

  it('normalizes invalid, duplicate, and missing layers', () => {
    expect(normalizePostprocessEffectStack([
      { kind: 'glass', enabled: true },
      { kind: 'future', enabled: true },
      { kind: 'mirror', enabled: 1 },
      { kind: 'glass', enabled: false },
    ])).toEqual([
      { kind: 'glass', enabled: true },
      { kind: 'mirror', enabled: true },
      { kind: 'distort', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
    ]);
  });

  it('moves a layer to the requested index', () => {
    const stack = createDefaultPostprocessStack('distort');
    expect(movePostprocessStackLayer(stack, 'glass', 1).map(layer => layer.kind)).toEqual([
      'distort',
      'glass',
      'mirror',
      'kaleidoscope',
      'prism',
      'voronoi',
    ]);
  });

  it('updates one layer without changing order', () => {
    const stack = createDefaultPostprocessStack('distort');
    expect(updatePostprocessStackLayer(stack, 'glass', { enabled: true })).toEqual([
      { kind: 'distort', enabled: true },
      { kind: 'mirror', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'glass', enabled: true },
    ]);
  });
});
