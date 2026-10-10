import { normalizeBeatSyncBpm } from '../../lib/animationConfig';
import type { VjParameterRule } from './vjParameters';

export type VjSettings = {
  layoutMode: 'editor' | 'vj';
  bpm: number;
  shuffle: boolean;
  presetIds: string[];
  source: 'playlist' | 'folder';
  folderId: string | null;
  includeSubfolders: boolean;
  rules: Record<string, VjParameterRule>;
};

const STORAGE_KEY = 'kgg_vj_settings';
type Listener = () => void;
let current: VjSettings | null = null;
const listeners = new Set<Listener>();

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function normalizeRule(input: unknown): VjParameterRule | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = object(input);
  const rule: VjParameterRule = {};
  if (typeof raw.locked === 'boolean') rule.locked = raw.locked;
  if (typeof raw.min === 'number' && Number.isFinite(raw.min)) rule.min = raw.min;
  if (typeof raw.max === 'number' && Number.isFinite(raw.max)) rule.max = raw.max;
  if (Array.isArray(raw.values)) {
    rule.values = raw.values.filter((value): value is string | boolean => typeof value === 'string' || typeof value === 'boolean');
  }
  if (Array.isArray(raw.colors)) {
    rule.colors = raw.colors.filter((value): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value));
  }
  return rule;
}

/** VJ settings belong to the application, never to saved Preset documents. */
export function normalizeVjSettings(input: unknown): VjSettings {
  const raw = object(input);
  const rules = Object.fromEntries(Object.entries(object(raw.rules)).flatMap(([key, value]) => {
    const rule = normalizeRule(value);
    return rule ? [[key, rule]] : [];
  }));
  return {
    layoutMode: raw.layoutMode === 'vj' ? 'vj' : 'editor',
    bpm: normalizeBeatSyncBpm(typeof raw.bpm === 'number' ? raw.bpm : 120),
    shuffle: raw.shuffle === true,
    presetIds: Array.isArray(raw.presetIds)
      ? [...new Set(raw.presetIds.filter((id): id is string => typeof id === 'string' && id.length > 0))] : [],
    source: raw.source === 'folder' ? 'folder' : 'playlist',
    folderId: typeof raw.folderId === 'string' && raw.folderId.length > 0 ? raw.folderId : null,
    includeSubfolders: raw.includeSubfolders === true,
    rules,
  };
}

export function getVjSettings(): VjSettings {
  if (current === null) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      current = normalizeVjSettings(saved ? JSON.parse(saved) : undefined);
    } catch { current = normalizeVjSettings(undefined); }
  }
  return current;
}

export function subscribeVjSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getVjLayoutMode(): VjSettings['layoutMode'] {
  return getVjSettings().layoutMode;
}

export function updateVjSettings(patch: Partial<VjSettings>): void {
  current = normalizeVjSettings({ ...getVjSettings(), ...patch });
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* Runtime controls still work without storage. */ }
  for (const listener of listeners) listener();
}

export function resetVjSettingsForTest(): void {
  current = null;
  listeners.clear();
}
