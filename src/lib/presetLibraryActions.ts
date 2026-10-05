import { recordHistoryCommand } from './history';
import { deletePresets, getPresetPlacements, movePresets, placePresets, restorePresets, type PresetLibrary } from './presetLibrary';
import { enqueuePresetLibraryWrite, ensurePresetLibraryLoaded, getPresetLibrarySnapshot, refreshPresetLibrary, updatePresetLibraryCache, whenPresetLibraryIdle } from './presetLibraryCache';
import { updatePresetLibrary } from './presets';

type PersistErrorHandler = (error: unknown) => void;

/**
 * 変換を一覧のキャッシュへ即座に反映し、保存先への書き込みは裏で順番に行う。
 * 戻り値は、画面へ反映した時点で解決する。`persisted`は書き込みの完了を表す。
 * 書き込みに失敗したら保存先から読み直して画面を戻し、`onError`へ知らせる。
 */
async function applyOptimistically(update: (library: PresetLibrary) => PresetLibrary, onError?: PersistErrorHandler): Promise<{ persisted: Promise<void> }> {
  await ensurePresetLibraryLoaded();
  await whenPresetLibraryIdle();
  updatePresetLibraryCache(update);
  const persisted = enqueuePresetLibraryWrite(() => updatePresetLibrary(update));
  persisted.catch(async error => {
    await refreshPresetLibrary();
    onError?.(error);
  });
  return { persisted };
}

/**
 * 保存済みPresetをまとめて削除し、Undo/Redoの履歴へ積む。
 * 内蔵Presetはライブラリに含まれないため、渡されても対象にならない。
 */
export async function deletePresetsWithHistory(ids: Iterable<string>, onPersistError?: PersistErrorHandler): Promise<void> {
  const wanted = new Set(ids);
  const removed = getPresetLibrarySnapshot().library.presets.filter(preset => wanted.has(preset.id));
  if (removed.length === 0) return;
  const removedIds = removed.map(preset => preset.id);
  await applyOptimistically(library => deletePresets(library, removedIds), onPersistError);
  recordHistoryCommand({
    undo: async () => (await applyOptimistically(library => restorePresets(library, removed))).persisted,
    redo: async () => (await applyOptimistically(library => deletePresets(library, removedIds))).persisted,
  });
}

/** 保存済みPresetをまとめて別フォルダーへ移動し、Undo/Redoの履歴へ積む。すでにそのフォルダーにあるPresetは対象にしない。 */
export async function movePresetsWithHistory(ids: Iterable<string>, folderId: string | null, onPersistError?: PersistErrorHandler): Promise<void> {
  const wanted = new Set(ids);
  const library = getPresetLibrarySnapshot().library;
  const moving = library.presets.filter(preset => wanted.has(preset.id) && (preset.folderId ?? null) !== folderId);
  if (moving.length === 0) return;
  const movingIds = moving.map(preset => preset.id);
  const before = getPresetPlacements(library, movingIds);
  await applyOptimistically(current => movePresets(current, movingIds, folderId), onPersistError);
  recordHistoryCommand({
    undo: async () => (await applyOptimistically(current => placePresets(current, before))).persisted,
    redo: async () => (await applyOptimistically(current => movePresets(current, movingIds, folderId))).persisted,
  });
}
