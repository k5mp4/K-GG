import { describe, expect, it } from 'vitest';
import { makePreset } from './presetModel';
import {
  createEmptyPresetLibrary,
  createFolder,
  decodePresetPackage,
  deleteFolder,
  encodePresetExport,
  getFolderPreviewPresets,
  mergePresetLibrary,
  movePreset,
  normalizePresetLibrary,
  type PresetLibrary,
} from './presetLibrary';
import type { StoreSnapshot } from './presetModel';

function preset(name: string, order = 0) {
  return makePreset(name, {} as StoreSnapshot, { order });
}

describe('presetLibrary', () => {
  it('normalizes legacy flat arrays into the root folder', () => {
    const legacy = [preset('Legacy A'), preset('Legacy B')].map(({ folderId: _folderId, order: _order, ...item }) => item);
    const library = normalizePresetLibrary(legacy);

    expect(library.version).toBe(2);
    expect(library.folders).toHaveLength(0);
    expect(library.presets.map(item => item.folderId)).toEqual([null, null]);
    expect(library.presets.map(item => item.order)).toEqual([0, 1]);
  });

  it('keeps nested children and moves contents to the parent when a folder is deleted', () => {
    const root = createEmptyPresetLibrary();
    const parentResult = createFolder(root, 'Motion', null);
    const childResult = createFolder(parentResult.library, 'Slow', parentResult.folder.id);
    const saved: PresetLibrary = {
      ...childResult.library,
      presets: [{ ...preset('Loop', 0), folderId: parentResult.folder.id }],
    };

    const trimmed = deleteFolder(saved, parentResult.folder.id);

    expect(trimmed.folders).toHaveLength(1);
    expect(trimmed.folders[0]?.name).toBe('Slow');
    expect(trimmed.folders[0]?.parentId).toBe(null);
    expect(trimmed.presets[0]?.folderId).toBe(null);
  });

  it('selects at most five descendant previews in display order', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Texture', null);
    const library: PresetLibrary = {
      ...folderResult.library,
      presets: Array.from({ length: 6 }, (_, index) => ({ ...preset(`Preset ${index}`, index), folderId: folderResult.folder.id })),
    };

    expect(getFolderPreviewPresets(library, folderResult.folder.id).map(item => item.name)).toEqual([
      'Preset 0', 'Preset 1', 'Preset 2', 'Preset 3', 'Preset 4',
    ]);
  });

  it('round-trips folder exports and remaps IDs on import', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Collection', null);
    const source: PresetLibrary = {
      ...folderResult.library,
      presets: [{ ...preset('Shared', 0), folderId: folderResult.folder.id }],
    };
    const exported = encodePresetExport(source, { kind: 'folder', folderId: folderResult.folder.id });
    const decoded = decodePresetPackage(exported.bytes, exported.filename);
    const imported = mergePresetLibrary(createEmptyPresetLibrary(), decoded, null);

    expect(exported.filename).toMatch(/\.zip$/);
    expect(imported.folders[0]?.name).toBe('Collection');
    expect(imported.presets[0]?.name).toBe('Shared');
    expect(imported.folders[0]?.id).not.toBe(folderResult.folder.id);
    expect(imported.presets[0]?.id).not.toBe(source.presets[0]?.id);
    expect(imported.presets[0]?.folderId).toBe(imported.folders[0]?.id);
  });

  it('moves a saved preset into a newly created folder and keeps its thumbnail', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Effects', null);
    const saved = { ...preset('Rendered', 0), thumbnail: 'data:image/png;base64,preview' };
    const library: PresetLibrary = { ...folderResult.library, presets: [saved] };
    const moved = movePreset(library, saved.id, folderResult.folder.id);
    const exported = encodePresetExport(moved, { kind: 'folder', folderId: folderResult.folder.id });
    const decoded = decodePresetPackage(exported.bytes, exported.filename);

    expect(decoded.presets[0]?.folderId).toBe(folderResult.folder.id);
    expect(decoded.presets[0]?.thumbnail).toBe(saved.thumbnail);
  });

  it('rejects unsupported packages without producing a library', () => {
    expect(() => normalizePresetLibrary({ format: 'other', version: 2, folders: [], presets: [] })).toThrow(/Unsupported/);
    expect(() => decodePresetPackage(new TextEncoder().encode('{"broken":true}'))).toThrow(/Invalid preset package/);
  });
});
