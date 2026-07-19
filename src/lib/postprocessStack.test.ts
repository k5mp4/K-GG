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
      { kind: 'glassV2', enabled: false },
    ]);
  });

  it('creates Glass V2 as an independent selected legacy layer', () => {
    const stack = createDefaultPostprocessStack('glassV2');

    expect(stack.find(layer => layer.kind === 'glass')).toEqual({ kind: 'glass', enabled: false });
    expect(stack.find(layer => layer.kind === 'glassV2')).toEqual({ kind: 'glassV2', enabled: true });
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
      { kind: 'glassV2', enabled: false },
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
      'glassV2',
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
      { kind: 'glassV2', enabled: false },
    ]);
  });
});
