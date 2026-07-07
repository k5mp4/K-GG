import { adapters } from '../adapters';
export type { Preset, StoreSnapshot } from './presetModel';
import type { Preset, StoreSnapshot } from './presetModel';

export async function loadPresets(): Promise<Preset[]> {
  return await adapters.presetRepository.loadPresets();
}

export async function savePreset(name: string, state: StoreSnapshot): Promise<Preset> {
  return await adapters.presetRepository.savePreset(name, state);
}

export async function deletePreset(id: string): Promise<void> {
  await adapters.presetRepository.deletePreset(id);
}

export async function exportPresetsJSON(stem?: string): Promise<void> {
  await adapters.presetRepository.exportPresetsJSON(stem);
}

export async function importPresetsJSON(file: File, merge: boolean): Promise<void> {
  await adapters.presetRepository.importPresetsJSON(file, merge);
}
