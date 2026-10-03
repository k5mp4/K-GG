import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyPresetLibrary, type PresetLibrary } from './presetLibrary';
import { IDENTITY_DIFFUSE_BEZIER } from './diffuseCurve';
import { makePreset, type StoreSnapshot } from './presetModel';

const loadPresetLibrary = vi.fn<() => Promise<PresetLibrary>>();
vi.mock('./presets', () => ({ loadPresetLibrary: () => loadPresetLibrary() }));

import {
  builtinPresetLibrary,
  ensurePresetLibraryLoaded,
  getPresetLibrarySnapshot,
  isBuiltinPresetId,
  refreshPresetLibrary,
  resetPresetLibraryCacheForTest,
  subscribePresetLibrary,
} from './presetLibraryCache';

function libraryWith(...names: string[]): PresetLibrary {
  return {
    ...createEmptyPresetLibrary(),
    presets: names.map((name, order) => makePreset(name, { diffuse: { luminanceBezier: [...IDENTITY_DIFFUSE_BEZIER] } } as unknown as StoreSnapshot, { order })),
  };
}

describe('presetLibraryCache', () => {
  beforeEach(() => {
    resetPresetLibraryCacheForTest();
    loadPresetLibrary.mockReset();
  });

  it('loads the library once even when requested repeatedly', async () => {
    loadPresetLibrary.mockResolvedValue(libraryWith('A'));
    await Promise.all([ensurePresetLibraryLoaded(), ensurePresetLibraryLoaded()]);
    await ensurePresetLibraryLoaded();

    expect(loadPresetLibrary).toHaveBeenCalledTimes(1);
    expect(getPresetLibrarySnapshot().status).toBe('ready');
    expect(getPresetLibrarySnapshot().library.presets.map(preset => preset.name)).toEqual(['A']);
  });

  it('notifies subscribers and re-reads storage only on refresh', async () => {
    loadPresetLibrary.mockResolvedValueOnce(libraryWith('A')).mockResolvedValueOnce(libraryWith('A', 'B'));
    const listener = vi.fn();
    const unsubscribe = subscribePresetLibrary(listener);

    await ensurePresetLibraryLoaded();
    await refreshPresetLibrary();
    unsubscribe();

    expect(loadPresetLibrary).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalled();
    expect(getPresetLibrarySnapshot().library.presets.map(preset => preset.name)).toEqual(['A', 'B']);
  });

  it('keeps the previous library and reports an error when loading fails', async () => {
    loadPresetLibrary.mockResolvedValueOnce(libraryWith('A')).mockRejectedValueOnce(new Error('boom'));
    await ensurePresetLibraryLoaded();
    await refreshPresetLibrary();

    expect(getPresetLibrarySnapshot().status).toBe('error');
    expect(getPresetLibrarySnapshot().library.presets).toHaveLength(1);
  });

  it('identifies built-in presets without touching storage', () => {
    expect(builtinPresetLibrary.presets.length).toBeGreaterThan(0);
    expect(isBuiltinPresetId(builtinPresetLibrary.presets[0].id)).toBe(true);
    expect(isBuiltinPresetId('missing')).toBe(false);
    expect(loadPresetLibrary).not.toHaveBeenCalled();
  });
});
