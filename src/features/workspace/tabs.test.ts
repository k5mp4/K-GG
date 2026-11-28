import { describe, expect, it } from 'vitest';
import { getLayerTab, LEFT_TABS, resolveEditingLayer, TOP_BAR_TABS } from './tabs';

describe('workspace tabs', () => {
  it('shows only the modes in the TOP bar and keeps every property module', () => {
    expect(TOP_BAR_TABS.map(tab => tab.value)).toEqual(['sandbox', 'export', 'preset']);
    // Module ids stay addressable by the control runtime.
    expect(LEFT_TABS.map(tab => tab.value)).toEqual(['diffuse', 'noise', 'slit', 'postprocess', 'sandbox', 'export', 'preset']);
  });

  it('maps every Effect Stack layer to the module that edits it', () => {
    expect(getLayerTab('diffuse')).toBe('diffuse');
    expect(getLayerTab('noise')).toBe('noise');
    expect(getLayerTab('slit')).toBe('slit');
    for (const kind of ['stretch', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'glass', 'glassTile', 'datamosh', 'cone', 'texture', 'distortChroma', 'ice'] as const) {
      expect(getLayerTab(kind)).toBe('postprocess');
    }
  });

  it('names the selected layer as being edited, also from the modes', () => {
    expect(resolveEditingLayer('postprocess', 'glass')).toEqual({ kind: 'glass', tab: 'postprocess', label: 'Glass' });
    expect(resolveEditingLayer('export', 'distortChroma')).toEqual({ kind: 'distortChroma', tab: 'postprocess', label: 'Distort Chroma' });
    expect(resolveEditingLayer('sandbox', 'diffuse')).toEqual({ kind: 'diffuse', tab: 'diffuse', label: 'Diffuse' });
  });

  it('follows the open module when it edits another layer than the selection', () => {
    expect(resolveEditingLayer('noise', 'glass')).toEqual({ kind: 'noise', tab: 'noise', label: 'Noise' });
  });
});
