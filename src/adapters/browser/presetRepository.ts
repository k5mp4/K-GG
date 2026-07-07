import { isPreset, makePreset } from '../../lib/presetModel';
import type { Preset, StoreSnapshot } from '../../lib/presetModel';
import type { PresetRepository } from '../types';

const STORAGE_KEY = 'kagaribi15_presets';

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Preset[]) : [];
  } catch {
    return [];
  }
}

function saveAll(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function savePreset(name: string, state: StoreSnapshot): Preset {
  const preset = makePreset(name, state);
  const presets = loadPresets();
  saveAll([...presets, preset]);
  return preset;
}

function deletePreset(id: string): void {
  saveAll(loadPresets().filter((p) => p.id !== id));
}

function exportPresetsJSON(stem?: string): void {
  const presets = loadPresets();
  const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = stem ? `gradPreset_${stem}.json` : 'gradPreset.json';
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function importPresetsJSON(file: File, merge: boolean): Promise<void> {
  const text = await file.text();
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every(isPreset)) throw new Error('Invalid preset file');
  const imported = parsed;
  const existing = merge ? loadPresets() : [];
  // マージ時は id 衝突を避けるため重複を除外
  const existingIds = new Set(existing.map((p) => p.id));
  const toAdd = imported.filter((p) => !existingIds.has(p.id));
  saveAll([...existing, ...toAdd]);
}

export const browserPresetRepository: PresetRepository = {
  loadPresets,
  savePreset,
  deletePreset,
  exportPresetsJSON,
  importPresetsJSON,
};
