import { describe, expect, it } from 'vitest';
import { createEmptyPresetLibrary, type PresetLibrary } from '../../lib/presetLibrary';
import type { Preset } from '../../lib/presetModel';
import { normalizeVjSettings } from './vjSettings';
import { getVjPerformanceIds } from './vjPresetSource';

const library: PresetLibrary = { ...createEmptyPresetLibrary(), folders: [
  { id: 'set', name: 'Set', parentId: null, order: 0, createdAt: 1 },
  { id: 'child', name: 'Child', parentId: 'set', order: 0, createdAt: 1 },
], presets: [
  { id: 'later', name: 'Later', folderId: 'set', order: 2 },
  { id: 'root', name: 'Root', folderId: null, order: 0 },
  { id: 'first', name: 'First', folderId: 'set', order: 0 },
  { id: 'nested', name: 'Nested', folderId: 'child', order: 1 },
] as Preset[] };
describe('VJ folder performance source', () => {
  it('uses only the selected folder in its saved order', () => {
    expect(getVjPerformanceIds(normalizeVjSettings({ source: 'folder', folderId: 'set' }), library.presets, library)).toEqual(['first', 'later']);
  });
  it('includes descendants only when requested and does not fall back from a missing folder', () => {
    expect(getVjPerformanceIds(normalizeVjSettings({ source: 'folder', folderId: 'set', includeSubfolders: true }), library.presets, library)).toEqual(['first', 'nested', 'later']);
    expect(getVjPerformanceIds(normalizeVjSettings({ source: 'folder', folderId: 'gone' }), library.presets, library)).toEqual([]);
  });
  it('keeps root and custom lists distinct and follows library changes', () => {
    expect(getVjPerformanceIds(normalizeVjSettings({ source: 'folder' }), library.presets, library)).toEqual(['root']);
    expect(getVjPerformanceIds(normalizeVjSettings({ presetIds: ['later', 'missing', 'first'] }), library.presets, library)).toEqual(['later', 'first']);
    const changed = { ...library, presets: library.presets.filter(preset => preset.id !== 'first') };
    expect(getVjPerformanceIds(normalizeVjSettings({ source: 'folder', folderId: 'set' }), changed.presets, changed)).toEqual(['later']);
  });
});
