import { createEmptyPresetLibrary, normalizePresetLibrary, type PresetLibrary } from './presetLibrary';
import { loadPresetLibrary } from './presets';
import defaultPresets from '../assets/gradPreset_kg_defaultPresets.json';

/**
 * プリセットライブラリのメモリ上キャッシュ。
 *
 * 起動時に一度だけ保存先（localStorage / Tauriのアプリデータ）を読み、保存済みThumbnailを
 * 先にデコードしておく。以降の一覧表示やPreset適用は保存先を読み直さず、保存・削除・移動
 * などの変更後だけ`refreshPresetLibrary`で更新する。
 */

export type PresetLibraryStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PresetLibrarySnapshot = {
  library: PresetLibrary;
  status: PresetLibraryStatus;
};

const listeners = new Set<() => void>();
const thumbnailCache = new Map<string, HTMLImageElement>();
let snapshot: PresetLibrarySnapshot = { library: createEmptyPresetLibrary(), status: 'idle' };
let pending: Promise<void> | null = null;

/** 内蔵Presetは同梱データなので、モジュール単位で一度だけ正規化する。 */
export const builtinPresetLibrary: PresetLibrary = normalizePresetLibrary(defaultPresets);
const builtinPresetIds: ReadonlySet<string> = new Set(builtinPresetLibrary.presets.map(preset => preset.id));

export function isBuiltinPresetId(id: string): boolean {
  return builtinPresetIds.has(id);
}

export function subscribePresetLibrary(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getPresetLibrarySnapshot(): PresetLibrarySnapshot {
  return snapshot;
}

function publish(next: PresetLibrarySnapshot): void {
  snapshot = next;
  listeners.forEach(listener => listener());
}

/** 保存済みThumbnailを一括でデコードし、一覧表示時の初回描画待ちをなくす。 */
function preloadThumbnails(library: PresetLibrary): void {
  if (typeof Image === 'undefined') return;
  const liveIds = new Set<string>();
  for (const preset of library.presets) {
    if (!preset.thumbnail) continue;
    liveIds.add(preset.id);
    const cached = thumbnailCache.get(preset.id);
    if (cached?.src === preset.thumbnail) continue;
    const image = new Image();
    image.decoding = 'async';
    image.src = preset.thumbnail;
    thumbnailCache.set(preset.id, image);
    void image.decode?.().catch(() => { /* 表示時にimg要素が再試行する */ });
  }
  for (const id of thumbnailCache.keys()) {
    if (!liveIds.has(id)) thumbnailCache.delete(id);
  }
}

async function load(): Promise<void> {
  try {
    const library = await loadPresetLibrary();
    preloadThumbnails(library);
    publish({ library, status: 'ready' });
  } catch {
    publish({ library: snapshot.library, status: 'error' });
  }
}

/** 起動時の一括ロード。複数回呼んでも保存先は読み込み中・読み込み済みのあいだ再度読まない。 */
export function ensurePresetLibraryLoaded(): Promise<void> {
  if (snapshot.status === 'ready') return Promise.resolve();
  if (pending) return pending;
  if (snapshot.status === 'idle') publish({ ...snapshot, status: 'loading' });
  pending = load().finally(() => { pending = null; });
  return pending;
}

/** 保存先で内容が変わったあとにキャッシュを読み直す。 */
export function refreshPresetLibrary(): Promise<void> {
  if (pending) return pending.then(() => refreshPresetLibrary());
  pending = load().finally(() => { pending = null; });
  return pending;
}

/** テスト用。キャッシュを初期状態へ戻す。 */
export function resetPresetLibraryCacheForTest(): void {
  thumbnailCache.clear();
  pending = null;
  snapshot = { library: createEmptyPresetLibrary(), status: 'idle' };
  listeners.forEach(listener => listener());
}
