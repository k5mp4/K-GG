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

const STORAGE_KEY = 'kagaribi15_presets';

function loadPresetLibrary(): PresetLibrary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizePresetLibrary(JSON.parse(raw) as unknown) : createEmptyPresetLibrary();
  } catch {
    return createEmptyPresetLibrary();
  }
}

function savePresetLibrary(library: PresetLibrary): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function nextPresetOrder(library: PresetLibrary, folderId: string | null): number {
  return Math.max(-1, ...library.presets.filter(preset => (preset.folderId ?? null) === folderId).map(preset => preset.order ?? 0)) + 1;
}

function downloadExport(bytes: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function savePreset(name: string, state: StoreSnapshot, folderId: string | null, thumbnail?: string): Promise<Preset> {
  const library = loadPresetLibrary();
  const preset = makePreset(name, state, { folderId, order: nextPresetOrder(library, folderId), thumbnail });
  savePresetLibrary({ ...library, presets: [...library.presets, preset] });
  return preset;
}

function deletePreset(id: string): void {
  const library = loadPresetLibrary();
  savePresetLibrary({ ...library, presets: library.presets.filter(preset => preset.id !== id) });
}

function movePreset(id: string, folderId: string | null): void {
  savePresetLibrary(moveLibraryPreset(loadPresetLibrary(), id, folderId));
}

function createFolder(name: string, parentId: string | null): PresetFolder {
  const result = createLibraryFolder(loadPresetLibrary(), name, parentId);
  savePresetLibrary(result.library);
  return result.folder;
}

function renameFolder(id: string, name: string): void {
  savePresetLibrary(renameLibraryFolder(loadPresetLibrary(), id, name));
}

function moveFolder(id: string, parentId: string | null): void {
  savePresetLibrary(moveLibraryFolder(loadPresetLibrary(), id, parentId));
}

function deleteFolder(id: string): void {
  savePresetLibrary(deleteLibraryFolder(loadPresetLibrary(), id));
}

function exportPresetPackage(scope: PresetExportScope): void {
  const exported = encodePresetExport(loadPresetLibrary(), scope);
  downloadExport(exported.bytes, exported.filename, exported.mimeType);
}

async function importPresetPackage(file: File, targetFolderId: string | null): Promise<void> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const imported = decodePresetPackage(bytes, file.name);
  savePresetLibrary(mergePresetLibrary(loadPresetLibrary(), imported, targetFolderId));
}

export const browserPresetRepository: PresetRepository = {
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
