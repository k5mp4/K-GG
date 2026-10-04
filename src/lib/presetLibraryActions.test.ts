import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyPresetLibrary, createFolder, type PresetLibrary } from './presetLibrary';
import { IDENTITY_DIFFUSE_BEZIER } from './diffuseCurve';
import { makePreset, type StoreSnapshot } from './presetModel';

let stored: PresetLibrary = createEmptyPresetLibrary();
vi.mock('./presets', () => ({
  loadPresetLibrary: async () => stored,
  updatePresetLibrary: async (update: (library: PresetLibrary) => PresetLibrary) => { stored = update(stored); },
}));

import { canRedo, canUndo, redo, resetHistoryForTest, undo } from './history';
import { deletePresetsWithHistory, movePresetsWithHistory } from './presetLibraryActions';
import { ensurePresetLibraryLoaded, getPresetLibrarySnapshot, resetPresetLibraryCacheForTest } from './presetLibraryCache';

function item(name: string, folderId: string | null, order: number) {
  return makePreset(name, { diffuse: { luminanceBezier: [...IDENTITY_DIFFUSE_BEZIER] } } as unknown as StoreSnapshot, { folderId, order });
}

/** Undo/redo run commands through a promise queue, so wait for it to drain. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const names = (folderId: string | null) => stored.presets.filter(preset => (preset.folderId ?? null) === folderId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(preset => preset.name);

describe('presetLibraryActions', () => {
  let folderId: string;
  let ids: Record<string, string>;

  beforeEach(async () => {
    const withFolder = createFolder(createEmptyPresetLibrary(), 'Motion', null);
    folderId = withFolder.folder.id;
    const presets = [item('A', null, 0), item('B', null, 1), item('C', null, 2), item('X', folderId, 0)];
    ids = Object.fromEntries(presets.map(preset => [preset.name, preset.id]));
    stored = { ...withFolder.library, presets };
    resetPresetLibraryCacheForTest();
    resetHistoryForTest();
    await ensurePresetLibraryLoaded();
  });

  it('deletes several presets and restores them in place with undo, then deletes again with redo', async () => {
    await deletePresetsWithHistory([ids.A, ids.C]);
    expect(names(null)).toEqual(['B']);
    expect(getPresetLibrarySnapshot().library.presets.map(preset => preset.name).sort()).toEqual(['B', 'X']);

    undo();
    await settle();
    expect(names(null)).toEqual(['A', 'B', 'C']);

    redo();
    await settle();
    expect(names(null)).toEqual(['B']);
    expect(canRedo()).toBe(false);
  });

  it('moves several presets together and undoes them to their old folder and order', async () => {
    await movePresetsWithHistory([ids.C, ids.A], folderId);
    expect(names(null)).toEqual(['B']);
    expect(names(folderId)).toEqual(['X', 'A', 'C']);

    undo();
    await settle();
    expect(names(null)).toEqual(['A', 'B', 'C']);
    expect(names(folderId)).toEqual(['X']);

    redo();
    await settle();
    expect(names(folderId)).toEqual(['X', 'A', 'C']);
  });

  it('puts a restored preset at the root when its folder was deleted in the meantime', async () => {
    await deletePresetsWithHistory([ids.X]);
    stored = { ...stored, folders: [] };

    undo();
    await settle();
    expect(names(null)).toContain('X');
  });

  it('records nothing for built-in or unknown ids and for moves that change nothing', async () => {
    await deletePresetsWithHistory(['builtin-only-id']);
    await movePresetsWithHistory([ids.A], null);
    expect(canUndo()).toBe(false);
  });

  it('drops the redo stack when a new operation is recorded', async () => {
    await deletePresetsWithHistory([ids.A]);
    undo();
    await settle();
    expect(canRedo()).toBe(true);

    await deletePresetsWithHistory([ids.B]);
    expect(canRedo()).toBe(false);
  });
});
