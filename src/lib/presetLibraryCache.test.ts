import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyPresetLibrary, type PresetLibrary } from './presetLibrary';
import { IDENTITY_DIFFUSE_BEZIER } from './diffuseCurve';
import { makePreset, type StoreSnapshot } from './presetModel';

const loadPresetLibrary = vi.fn<() => Promise<PresetLibrary>>();
vi.mock('./presets', () => ({ loadPresetLibrary: () => loadPresetLibrary() }));

import {
  builtinPresetLibrary,
  enqueuePresetLibraryWrite,
  ensurePresetLibraryLoaded,
  getPresetLibrarySnapshot,
  isBuiltinPresetId,
  refreshPresetLibrary,
  resetPresetLibraryCacheForTest,
  subscribePresetLibrary,
  updatePresetLibraryCache,
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

  it('keeps the previous preset objects on reload when nothing about them changed', async () => {
    const first = libraryWith('A', 'B');
    loadPresetLibrary.mockResolvedValueOnce(first);
    await ensurePresetLibraryLoaded();
    const before = getPresetLibrarySnapshot().library.presets;

    const reloaded = JSON.parse(JSON.stringify(first)) as PresetLibrary;
    reloaded.presets[1] = { ...reloaded.presets[1], name: 'B renamed' };
    loadPresetLibrary.mockResolvedValueOnce(reloaded);
    await refreshPresetLibrary();
    const after = getPresetLibrarySnapshot().library.presets;

    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    expect(after[1].name).toBe('B renamed');
  });

  it('publishes a cache update to subscribers without reading storage', async () => {
    loadPresetLibrary.mockResolvedValueOnce(libraryWith('A', 'B'));
    await ensurePresetLibraryLoaded();
    const listener = vi.fn();
    subscribePresetLibrary(listener);

    updatePresetLibraryCache(library => ({ ...library, presets: library.presets.slice(1) }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getPresetLibrarySnapshot().library.presets.map(preset => preset.name)).toEqual(['B']);
    expect(loadPresetLibrary).toHaveBeenCalledTimes(1);
  });

  it('waits for queued writes before re-reading storage, and runs writes in order', async () => {
    const order: string[] = [];
    loadPresetLibrary.mockImplementation(async () => { order.push('load'); return libraryWith('A'); });
    await ensurePresetLibraryLoaded();
    order.length = 0;

    void enqueuePresetLibraryWrite(async () => { order.push('write 1'); });
    void enqueuePresetLibraryWrite(async () => { order.push('write 2'); });
    await refreshPresetLibrary();

    expect(order).toEqual(['write 1', 'write 2', 'load']);
  });
});
