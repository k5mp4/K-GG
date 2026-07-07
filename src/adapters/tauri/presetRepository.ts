import { invoke } from '@tauri-apps/api/core';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { isPreset, makePreset } from '../../lib/presetModel';
import type { Preset, StoreSnapshot } from '../../lib/presetModel';
import type { PresetRepository } from '../types';

async function readAll(): Promise<Preset[]> {
  const presets = await invoke<unknown>('load_presets_file');
  if (!Array.isArray(presets) || !presets.every(isPreset)) {
    throw new Error('Invalid preset file');
  }
  return presets;
}

async function writeAll(presets: Preset[]): Promise<void> {
  await invoke('save_presets_file', { presets });
}

async function loadPresets(): Promise<Preset[]> {
  try {
    return await readAll();
  } catch (e) {
    console.error('Failed to load presets:', e);
    return [];
  }
}

async function savePreset(name: string, state: StoreSnapshot): Promise<Preset> {
  const preset = makePreset(name, state);
  const presets = await loadPresets();
  await writeAll([...presets, preset]);
  return preset;
}

async function deletePreset(id: string): Promise<void> {
  const presets = await loadPresets();
  await writeAll(presets.filter((p) => p.id !== id));
}

async function exportPresetsJSON(stem?: string): Promise<void> {
  const presets = await loadPresets();
  const filename = stem ? `gradPreset_${stem}.json` : 'gradPreset.json';
  const target = await saveDialog({
    title: 'プリセットを書き出し',
    defaultPath: filename,
    filters: [{ name: 'JSON', extensions: ['json'] }],
    canCreateDirectories: true,
  });
  if (!target) return;
  await writeTextFile(target, JSON.stringify(presets, null, 2));
}

async function importPresetsJSON(file: File, merge: boolean): Promise<void> {
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every(isPreset)) throw new Error('Invalid preset file');

  const existing = merge ? await loadPresets() : [];
  const existingIds = new Set(existing.map((p) => p.id));
  const toAdd = parsed.filter((p) => !existingIds.has(p.id));
  await writeAll([...existing, ...toAdd]);
}

export const tauriPresetRepository: PresetRepository = {
  loadPresets,
  savePreset,
  deletePreset,
  exportPresetsJSON,
  importPresetsJSON,
};
