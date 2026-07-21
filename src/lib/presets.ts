import { adapters } from '../adapters';
export type { Preset, StoreSnapshot } from './presetModel';
import type { Preset, StoreSnapshot } from './presetModel';
export type { PresetExportScope, PresetFolder, PresetLibrary } from './presetLibrary';
import type { PresetExportScope, PresetLibrary, PresetFolder } from './presetLibrary';

export async function loadPresetLibrary(): Promise<PresetLibrary> {
  return await adapters.presetRepository.loadPresetLibrary();
}

export async function savePreset(name: string, state: StoreSnapshot, folderId: string | null, thumbnail?: string): Promise<Preset> {
  return await adapters.presetRepository.savePreset(name, state, folderId, thumbnail);
}

export async function deletePreset(id: string): Promise<void> {
  await adapters.presetRepository.deletePreset(id);
}

export async function movePreset(id: string, folderId: string | null): Promise<void> {
  await adapters.presetRepository.movePreset(id, folderId);
}

export async function createFolder(name: string, parentId: string | null): Promise<PresetFolder> {
  return await adapters.presetRepository.createFolder(name, parentId);
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await adapters.presetRepository.renameFolder(id, name);
}

export async function moveFolder(id: string, parentId: string | null): Promise<void> {
  await adapters.presetRepository.moveFolder(id, parentId);
}

export async function deleteFolder(id: string): Promise<void> {
  await adapters.presetRepository.deleteFolder(id);
}

export async function exportPresetPackage(scope: PresetExportScope): Promise<void> {
  await adapters.presetRepository.exportPresetPackage(scope);
}

export async function importPresetPackage(file: File, targetFolderId: string | null): Promise<void> {
  await adapters.presetRepository.importPresetPackage(file, targetFolderId);
}
