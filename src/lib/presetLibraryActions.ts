import { recordHistoryCommand } from './history';
import { deletePresets, getPresetPlacements, movePresets, placePresets, restorePresets, type PresetLibrary } from './presetLibrary';
import { getPresetLibrarySnapshot, refreshPresetLibrary } from './presetLibraryCache';
import { updatePresetLibrary } from './presets';

/** 保存先へ変換を適用し、一覧のキャッシュを読み直す。 */
async function apply(update: (library: PresetLibrary) => PresetLibrary): Promise<void> {
  await updatePresetLibrary(update);
  await refreshPresetLibrary();
}

/**
 * 保存済みPresetをまとめて削除し、Undo/Redoの履歴へ積む。
 * 内蔵Presetはライブラリに含まれないため、渡されても対象にならない。
 */
export async function deletePresetsWithHistory(ids: Iterable<string>): Promise<void> {
  const wanted = new Set(ids);
  const removed = getPresetLibrarySnapshot().library.presets.filter(preset => wanted.has(preset.id));
  if (removed.length === 0) return;
  const removedIds = removed.map(preset => preset.id);
  await apply(library => deletePresets(library, removedIds));
  recordHistoryCommand({
    undo: () => apply(library => restorePresets(library, removed)),
    redo: () => apply(library => deletePresets(library, removedIds)),
  });
}

/** 保存済みPresetをまとめて別フォルダーへ移動し、Undo/Redoの履歴へ積む。すでにそのフォルダーにあるPresetは対象にしない。 */
export async function movePresetsWithHistory(ids: Iterable<string>, folderId: string | null): Promise<void> {
  const wanted = new Set(ids);
  const library = getPresetLibrarySnapshot().library;
  const moving = library.presets.filter(preset => wanted.has(preset.id) && (preset.folderId ?? null) !== folderId);
  if (moving.length === 0) return;
  const movingIds = moving.map(preset => preset.id);
  const before = getPresetPlacements(library, movingIds);
  await apply(current => movePresets(current, movingIds, folderId));
  recordHistoryCommand({
    undo: () => apply(current => placePresets(current, before)),
    redo: () => apply(current => movePresets(current, movingIds, folderId)),
  });
}
