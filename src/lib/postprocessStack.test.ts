import { describe, expect, it } from 'vitest';
import {
  createDefaultPostprocessStack,
  movePostprocessStackLayer,
  normalizePostprocessEffectStack,
  updatePostprocessStackLayer,
} from './postprocessStack';

describe('postprocessStack', () => {
  it('maps the legacy Glass mode to the single Glass V2 layer', () => {
    expect(createDefaultPostprocessStack('glass')).toEqual([
      { kind: 'distort', enabled: false },
      { kind: 'mirror', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'glassV2', enabled: true },
    ]);
  });

  it('creates Glass V2 as the only Glass layer', () => {
    const stack = createDefaultPostprocessStack('glassV2');

    expect(stack.find(layer => layer.kind === 'glassV2')).toEqual({ kind: 'glassV2', enabled: true });
    expect(stack.filter(layer => layer.kind === 'glass' || layer.kind === 'glassV2')).toHaveLength(1);
  });

  it('normalizes invalid, duplicate, and legacy Glass layers', () => {
    expect(normalizePostprocessEffectStack([
      { kind: 'glass', enabled: true },
      { kind: 'future', enabled: true },
      { kind: 'mirror', enabled: 1 },
      { kind: 'glassV2', enabled: false },
      { kind: 'glass', enabled: false },
    ])).toEqual([
      { kind: 'glassV2', enabled: true },
      { kind: 'mirror', enabled: true },
      { kind: 'distort', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
    ]);
  });

  it('moves a legacy Glass alias to the requested index', () => {
    const stack = createDefaultPostprocessStack('distort');
    expect(movePostprocessStackLayer(stack, 'glass', 1).map(layer => layer.kind)).toEqual([
      'distort',
      'glassV2',
      'mirror',
      'kaleidoscope',
      'prism',
      'voronoi',
    ]);
  });

  it('updates the single Glass layer without changing order', () => {
    const stack = createDefaultPostprocessStack('distort');
    expect(updatePostprocessStackLayer(stack, 'glass', { enabled: true })).toEqual([
      { kind: 'distort', enabled: true },
      { kind: 'mirror', enabled: false },
      { kind: 'kaleidoscope', enabled: false },
      { kind: 'prism', enabled: false },
      { kind: 'voronoi', enabled: false },
      { kind: 'glassV2', enabled: true },
    ]);
  });
});
