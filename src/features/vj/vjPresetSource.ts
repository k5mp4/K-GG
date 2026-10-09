import { getFolderPreviewPresets, getPresetsInFolder, type PresetLibrary } from '../../lib/presetLibrary';
import type { Preset } from '../../lib/presetModel';
import type { VjSettings } from './vjSettings';

export function getVjPerformanceIds(settings: VjSettings, presets: readonly Preset[], library: PresetLibrary): string[] {
  if (settings.source === 'playlist') {
    const available = new Set(presets.map(preset => preset.id));
    return settings.presetIds.filter(id => available.has(id));
  }
  if (settings.folderId !== null && !library.folders.some(folder => folder.id === settings.folderId)) return [];
  return (settings.includeSubfolders
    ? getFolderPreviewPresets(library, settings.folderId, Number.MAX_SAFE_INTEGER)
    : getPresetsInFolder(library, settings.folderId)).map(preset => preset.id);
}
