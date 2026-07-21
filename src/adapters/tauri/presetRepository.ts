import { invoke } from '@tauri-apps/api/core';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { makePreset } from '../../lib/presetModel';
import type { Preset, StoreSnapshot } from '../../lib/presetModel';
import {
  createEmptyPresetLibrary,
  createFolder as createLibraryFolder,
  decodePresetPackage,
  deleteFolder as deleteLibraryFolder,
  encodePresetExport,
  mergePresetLibrary,
  moveFolder as moveLibraryFolder,
  movePreset as moveLibraryPreset,
  normalizePresetLibrary,
  renameFolder as renameLibraryFolder,
  type PresetExportScope,
  type PresetFolder,
  type PresetLibrary,
} from '../../lib/presetLibrary';
import type { PresetRepository } from '../types';

async function readLibrary(): Promise<PresetLibrary> {
  const raw = await invoke<unknown>('load_presets_file');
  return normalizePresetLibrary(raw);
}

async function loadPresetLibrary(): Promise<PresetLibrary> {
  try {
    return await readLibrary();
  } catch (error) {
    console.error('Failed to load presets:', error);
    return createEmptyPresetLibrary();
  }
}

async function writeLibrary(library: PresetLibrary): Promise<void> {
  await invoke('save_presets_file', { presets: library });
}

function nextPresetOrder(library: PresetLibrary, folderId: string | null): number {
  return Math.max(-1, ...library.presets.filter(preset => (preset.folderId ?? null) === folderId).map(preset => preset.order ?? 0)) + 1;
}

async function savePreset(name: string, state: StoreSnapshot, folderId: string | null, thumbnail?: string): Promise<Preset> {
  const library = await loadPresetLibrary();
  const preset = makePreset(name, state, { folderId, order: nextPresetOrder(library, folderId), thumbnail });
  await writeLibrary({ ...library, presets: [...library.presets, preset] });
  return preset;
}

async function deletePreset(id: string): Promise<void> {
  const library = await loadPresetLibrary();
  await writeLibrary({ ...library, presets: library.presets.filter(preset => preset.id !== id) });
}

async function movePreset(id: string, folderId: string | null): Promise<void> {
  await writeLibrary(moveLibraryPreset(await loadPresetLibrary(), id, folderId));
}

async function createFolder(name: string, parentId: string | null): Promise<PresetFolder> {
  const result = createLibraryFolder(await loadPresetLibrary(), name, parentId);
  await writeLibrary(result.library);
  return result.folder;
}

async function renameFolder(id: string, name: string): Promise<void> {
  await writeLibrary(renameLibraryFolder(await loadPresetLibrary(), id, name));
}

async function moveFolder(id: string, parentId: string | null): Promise<void> {
  await writeLibrary(moveLibraryFolder(await loadPresetLibrary(), id, parentId));
}

async function deleteFolder(id: string): Promise<void> {
  await writeLibrary(deleteLibraryFolder(await loadPresetLibrary(), id));
}

async function exportPresetPackage(scope: PresetExportScope): Promise<void> {
  const exported = encodePresetExport(await loadPresetLibrary(), scope);
  const extension = exported.mimeType === 'application/zip' ? 'zip' : 'json';
  const target = await saveDialog({
    title: 'プリセットを書き出し',
    defaultPath: exported.filename,
    filters: [{ name: extension === 'zip' ? 'K-GG Presets' : 'JSON', extensions: [extension] }],
    canCreateDirectories: true,
  });
  if (!target) return;
  await writeFile(target, exported.bytes);
}

async function importPresetPackage(file: File, targetFolderId: string | null): Promise<void> {
  const imported = decodePresetPackage(new Uint8Array(await file.arrayBuffer()), file.name);
  await writeLibrary(mergePresetLibrary(await loadPresetLibrary(), imported, targetFolderId));
}

export const tauriPresetRepository: PresetRepository = {
  loadPresetLibrary,
  savePreset,
  deletePreset,
  movePreset,
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  exportPresetPackage,
  importPresetPackage,
};
