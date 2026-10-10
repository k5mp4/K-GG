import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getVjSettings, normalizeVjSettings, resetVjSettingsForTest, subscribeVjSettings, updateVjSettings,
} from './vjSettings';

describe('VJ application settings', () => {
  const saved = new Map<string, string>();
  beforeEach(() => {
    saved.clear();
    vi.stubGlobal('window', { localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    } });
    resetVjSettingsForTest();
  });
  afterEach(() => { resetVjSettingsForTest(); vi.unstubAllGlobals(); });

  it('defaults to the editor without starting automatic playback', () => {
    expect(getVjSettings()).toEqual({ layoutMode: 'editor', bpm: 120, shuffle: false, presetIds: [],
      source: 'playlist', folderId: null, includeSubfolders: false, rules: {} });
  });

  it('persists layout, playlist, and rules separately from presets', () => {
    updateVjSettings({ layoutMode: 'vj', bpm: 128, presetIds: ['a', 'b'], rules: { 'noise.amount': { min: 0.1, max: 0.4 } } });
    resetVjSettingsForTest();
    expect(getVjSettings()).toMatchObject({ layoutMode: 'vj', bpm: 128, presetIds: ['a', 'b'], rules: { 'noise.amount': { min: 0.1, max: 0.4 } } });
    expect([...saved.keys()]).toEqual(['kgg_vj_settings']);
  });

  it('notifies subscribers and keeps runtime changes when storage is unavailable', () => {
    vi.stubGlobal('window', { get localStorage() { throw new Error('Storage disabled'); } });
    const listener = vi.fn();
    const unsubscribe = subscribeVjSettings(listener);
    updateVjSettings({ shuffle: true, layoutMode: 'vj' });
    expect(getVjSettings().shuffle).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    updateVjSettings({ shuffle: false });
    expect(listener).toHaveBeenCalledOnce();
  });

  it('recovers corrupt storage and filters invalid fields', () => {
    saved.set('kgg_vj_settings', '{broken');
    expect(getVjSettings().layoutMode).toBe('editor');
    expect(normalizeVjSettings({ layoutMode: 'unknown', bpm: Infinity, presetIds: ['a', 2, '', 'a'], autoRunning: true,
      rules: { 'noise.amount': { locked: true, min: NaN, max: 0.5 }, 'diffuse.mode': { values: ['ascii', true, 42] }, bad: null },
    })).toEqual({ layoutMode: 'editor', bpm: 120, shuffle: false, presetIds: ['a'], source: 'playlist', folderId: null, includeSubfolders: false,
      rules: { 'noise.amount': { locked: true, max: 0.5 }, 'diffuse.mode': { values: ['ascii', true] } },
    });
  });
  it('persists a folder source without changing the custom playlist', () => {
    updateVjSettings({ presetIds: ['a'], source: 'folder', folderId: 'set', includeSubfolders: true });
    resetVjSettingsForTest();
    expect(getVjSettings()).toMatchObject({ presetIds: ['a'], source: 'folder', folderId: 'set', includeSubfolders: true });
  });
});
