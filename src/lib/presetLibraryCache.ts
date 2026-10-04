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
/** 保存先への書き込みを直列化するキュー。読み直しはこの完了を待つ。 */
let writeQueue: Promise<void> = Promise.resolve();

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

/**
 * 読み直したライブラリのうち、前回と同じPresetは前回のオブジェクトをそのまま使う。
 * PresetはIDと作成時刻が同じなら状態も同じ（変わるのは名前・フォルダー・順序・Thumbnailだけ）ため、
 * 一覧のカードが変更のないPresetを再描画せずに済む。
 */
function reuseUnchangedPresets(previous: PresetLibrary, next: PresetLibrary): PresetLibrary {
  const before = new Map(previous.presets.map(preset => [preset.id, preset]));
  const presets = next.presets.map(preset => {
    const old = before.get(preset.id);
    const unchanged = old !== undefined
      && old.createdAt === preset.createdAt
      && old.name === preset.name
      && old.thumbnail === preset.thumbnail
      && (old.folderId ?? null) === (preset.folderId ?? null)
      && (old.order ?? 0) === (preset.order ?? 0);
    return unchanged ? old : preset;
  });
  return { ...next, presets };
}

async function load(): Promise<void> {
  try {
    await writeQueue;
    const loaded = await loadPresetLibrary();
    const library = reuseUnchangedPresets(snapshot.library, loaded);
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

/** 読み込み中の読み直しが終わるまで待つ。 */
export async function whenPresetLibraryIdle(): Promise<void> {
  while (pending) await pending;
}

/** 一覧のキャッシュを保存先より先に更新し、画面へすぐ反映する。変換が失敗したら何も変えずに投げる。 */
export function updatePresetLibraryCache(update: (library: PresetLibrary) => PresetLibrary): void {
  publish({ library: update(snapshot.library), status: 'ready' });
}

/**
 * 保存先への書き込みを順番に実行する。画面の描画を先に済ませるため、次のタスクまで待ってから書く。
 * 読み直し（refreshPresetLibrary）は、キューにある書き込みが終わってから保存先を読む。
 */
export function enqueuePresetLibraryWrite(task: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(() => new Promise<void>(resolve => setTimeout(resolve, 0))).then(task);
  writeQueue = run.catch(() => undefined);
  return run;
}

/** テスト用。キャッシュを初期状態へ戻す。 */
export function resetPresetLibraryCacheForTest(): void {
  thumbnailCache.clear();
  pending = null;
  writeQueue = Promise.resolve();
  snapshot = { library: createEmptyPresetLibrary(), status: 'idle' };
  listeners.forEach(listener => listener());
}
