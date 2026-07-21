import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { Preset, StoreSnapshot } from './presetModel';
import { isPreset, makePreset } from './presetModel';

export const PRESET_LIBRARY_FORMAT = 'kgg-preset-library';
export const PRESET_LIBRARY_VERSION = 2 as const;
const MANIFEST_NAME = 'preset-library.json';
const MAX_PACKAGE_BYTES = 32 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;

export type PresetFolder = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: number;
};

export type PresetLibrary = {
  format: typeof PRESET_LIBRARY_FORMAT;
  version: typeof PRESET_LIBRARY_VERSION;
  folders: PresetFolder[];
  presets: Preset[];
};

export type PresetExportScope =
  | { kind: 'preset'; presetId: string }
  | { kind: 'folder'; folderId: string }
  | { kind: 'library' };

export type PresetExport = {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createId(existing: Iterable<string>): string {
  const ids = new Set(existing);
  let id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  while (ids.has(id)) id = Math.random().toString(36).slice(2);
  return id;
}

function normalizePreset(value: unknown, index: number): Preset {
  if (!isPreset(value)) throw new Error('Invalid preset entry');
  return {
    ...value,
    folderId: typeof value.folderId === 'string' ? value.folderId : null,
    order: typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : index,
  };
}

function isFolder(value: unknown): value is PresetFolder {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.name === 'string' && value.name.trim().length > 0 &&
    (typeof value.parentId === 'string' || value.parentId === null) &&
    typeof value.order === 'number' && Number.isFinite(value.order) &&
    typeof value.createdAt === 'number' && Number.isFinite(value.createdAt)
  );
}

function validateFolderName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || [...trimmed].some(character => character.charCodeAt(0) < 32) || /[\\/]/.test(trimmed)) {
    throw new Error('Folder name must not be empty or contain path separators');
  }
  if (trimmed.length > 80) throw new Error('Folder name is too long');
  return trimmed;
}

function folderNameExists(library: PresetLibrary, name: string, parentId: string | null, exceptId?: string): boolean {
  const normalized = name.toLocaleLowerCase();
  return library.folders.some(folder => (
    folder.id !== exceptId &&
    folder.parentId === parentId &&
    folder.name.toLocaleLowerCase() === normalized
  ));
}

function assertFolder(library: PresetLibrary, folderId: string | null): void {
  if (folderId !== null && !library.folders.some(folder => folder.id === folderId)) {
    throw new Error('Folder not found');
  }
}

function sortByOrder<T extends { order?: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}

export function createEmptyPresetLibrary(): PresetLibrary {
  return { format: PRESET_LIBRARY_FORMAT, version: PRESET_LIBRARY_VERSION, folders: [], presets: [] };
}

export function normalizePresetLibrary(value: unknown): PresetLibrary {
  if (Array.isArray(value)) {
    const presets = value.map(normalizePreset);
    return validatePresetLibrary({
      ...createEmptyPresetLibrary(),
      presets,
    });
  }
  if (!isRecord(value) || value.format !== PRESET_LIBRARY_FORMAT || value.version !== PRESET_LIBRARY_VERSION) {
    throw new Error('Unsupported preset library format');
  }
  if (!Array.isArray(value.folders) || !value.folders.every(isFolder) || !Array.isArray(value.presets)) {
    throw new Error('Invalid preset library');
  }
  return validatePresetLibrary({
    format: PRESET_LIBRARY_FORMAT,
    version: PRESET_LIBRARY_VERSION,
    folders: value.folders.map(folder => ({ ...folder, name: validateFolderName(folder.name) })),
    presets: value.presets.map(normalizePreset),
  });
}

export function validatePresetLibrary(library: PresetLibrary): PresetLibrary {
  const folderIds = new Set<string>();
  const presetIds = new Set<string>();
  for (const folder of library.folders) {
    if (folderIds.has(folder.id)) throw new Error('Duplicate folder id');
    folderIds.add(folder.id);
  }
  for (const folder of library.folders) {
    validateFolderName(folder.name);
    if (folder.parentId !== null && !folderIds.has(folder.parentId)) throw new Error('Folder parent not found');
    if (folder.parentId === folder.id) throw new Error('Folder cannot contain itself');
  }
  for (const folder of library.folders) {
    const visited = new Set<string>();
    let cursor: string | null = folder.id;
    while (cursor !== null) {
      if (visited.has(cursor)) throw new Error('Folder hierarchy contains a cycle');
      visited.add(cursor);
      cursor = library.folders.find(candidate => candidate.id === cursor)?.parentId ?? null;
    }
  }
  for (const preset of library.presets) {
    if (!isPreset(preset) || presetIds.has(preset.id)) throw new Error('Invalid or duplicate preset');
    presetIds.add(preset.id);
    assertFolder(library, preset.folderId ?? null);
  }
  for (const folder of library.folders) {
    if (folderNameExists(library, folder.name, folder.parentId, folder.id)) {
      throw new Error('Duplicate folder name');
    }
  }
  return library;
}

export function getChildFolders(library: PresetLibrary, parentId: string | null): PresetFolder[] {
  return sortByOrder(library.folders.filter(folder => folder.parentId === parentId));
}

export function getPresetsInFolder(library: PresetLibrary, folderId: string | null): Preset[] {
  return sortByOrder(library.presets.filter(preset => (preset.folderId ?? null) === folderId));
}

export function getFolderPreviewPresets(library: PresetLibrary, folderId: string | null, limit = 5): Preset[] {
  const included = new Set<string>();
  const visit = (parentId: string | null) => {
    for (const folder of getChildFolders(library, parentId)) {
      if (included.has(folder.id)) continue;
      included.add(folder.id);
      visit(folder.id);
    }
  };
  if (folderId !== null) included.add(folderId);
  visit(folderId);
  return sortByOrder(library.presets.filter(preset => included.has(preset.folderId ?? '') || (folderId === null && (preset.folderId ?? null) === null))).slice(0, limit);
}

export function createFolder(library: PresetLibrary, name: string, parentId: string | null): { library: PresetLibrary; folder: PresetFolder } {
  const cleanName = validateFolderName(name);
  assertFolder(library, parentId);
  if (folderNameExists(library, cleanName, parentId)) throw new Error('A folder with this name already exists');
  const folder: PresetFolder = {
    id: createId(library.folders.map(candidate => candidate.id)),
    name: cleanName,
    parentId,
    order: Math.max(-1, ...library.folders.filter(candidate => candidate.parentId === parentId).map(candidate => candidate.order)) + 1,
    createdAt: Date.now(),
  };
  return { library: validatePresetLibrary({ ...library, folders: [...library.folders, folder] }), folder };
}

export function renameFolder(library: PresetLibrary, folderId: string, name: string): PresetLibrary {
  const folder = library.folders.find(candidate => candidate.id === folderId);
  if (!folder) throw new Error('Folder not found');
  const cleanName = validateFolderName(name);
  if (folderNameExists(library, cleanName, folder.parentId, folderId)) throw new Error('A folder with this name already exists');
  return validatePresetLibrary({ ...library, folders: library.folders.map(candidate => candidate.id === folderId ? { ...candidate, name: cleanName } : candidate) });
}

export function movePreset(library: PresetLibrary, presetId: string, folderId: string | null): PresetLibrary {
  assertFolder(library, folderId);
  if (!library.presets.some(preset => preset.id === presetId)) throw new Error('Preset not found');
  const order = Math.max(-1, ...library.presets.filter(preset => (preset.folderId ?? null) === folderId).map(preset => preset.order ?? 0)) + 1;
  return validatePresetLibrary({ ...library, presets: library.presets.map(preset => preset.id === presetId ? { ...preset, folderId, order } : preset) });
}

export function moveFolder(library: PresetLibrary, folderId: string, parentId: string | null): PresetLibrary {
  const folder = library.folders.find(candidate => candidate.id === folderId);
  if (!folder) throw new Error('Folder not found');
  assertFolder(library, parentId);
  if (parentId === folderId) throw new Error('Folder cannot contain itself');
  let cursor = parentId;
  while (cursor !== null) {
    if (cursor === folderId) throw new Error('Folder cannot be moved into its descendant');
    cursor = library.folders.find(candidate => candidate.id === cursor)?.parentId ?? null;
  }
  if (folderNameExists(library, folder.name, parentId, folderId)) throw new Error('A folder with this name already exists');
  return validatePresetLibrary({ ...library, folders: library.folders.map(candidate => candidate.id === folderId ? { ...candidate, parentId } : candidate) });
}

export function deleteFolder(library: PresetLibrary, folderId: string): PresetLibrary {
  const folder = library.folders.find(candidate => candidate.id === folderId);
  if (!folder) throw new Error('Folder not found');
  return validatePresetLibrary({
    ...library,
    folders: library.folders.filter(candidate => candidate.id !== folderId).map(candidate => candidate.parentId === folderId ? { ...candidate, parentId: folder.parentId } : candidate),
    presets: library.presets.map(preset => (preset.folderId ?? null) === folderId ? { ...preset, folderId: folder.parentId } : preset),
  });
}

function selectFolderTree(library: PresetLibrary, folderId: string): PresetLibrary {
  const folder = library.folders.find(candidate => candidate.id === folderId);
  if (!folder) throw new Error('Folder not found');
  const included = new Set<string>([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of library.folders) {
      if (candidate.parentId !== null && included.has(candidate.parentId) && !included.has(candidate.id)) {
        included.add(candidate.id);
        changed = true;
      }
    }
  }
  const folders = library.folders.filter(candidate => included.has(candidate.id)).map(candidate => ({
    ...candidate,
    parentId: candidate.id === folderId ? null : candidate.parentId,
  }));
  return validatePresetLibrary({ ...library, folders, presets: library.presets.filter(preset => included.has(preset.folderId ?? '')) });
}

export function selectPresetExport(library: PresetLibrary, scope: PresetExportScope): PresetLibrary | Preset {
  if (scope.kind === 'preset') {
    const preset = library.presets.find(candidate => candidate.id === scope.presetId);
    if (!preset) throw new Error('Preset not found');
    return preset;
  }
  if (scope.kind === 'folder') return selectFolderTree(library, scope.folderId);
  return library;
}

function safeFilename(name: string): string {
  return [...name].map(character => character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? '_' : character).join('').trim().slice(0, 100) || 'preset';
}

export function encodePresetExport(library: PresetLibrary, scope: PresetExportScope): PresetExport {
  const selected = selectPresetExport(library, scope);
  if (scope.kind === 'preset') {
    if (!('name' in selected)) throw new Error('Preset not found');
    return {
      bytes: strToU8(JSON.stringify([selected], null, 2)),
      filename: `gradPreset_${safeFilename(selected.name)}.json`,
      mimeType: 'application/json',
    };
  }
  const manifest = JSON.stringify(selected, null, 2);
  return {
    bytes: zipSync({ [MANIFEST_NAME]: strToU8(manifest) }),
    filename: scope.kind === 'folder' ? 'gradPreset_folder.kggpresets.zip' : 'gradPreset_library.kggpresets.zip',
    mimeType: 'application/zip',
  };
}

export function decodePresetPackage(bytes: Uint8Array, filename = ''): PresetLibrary {
  if (bytes.byteLength > MAX_PACKAGE_BYTES) throw new Error('Preset package is too large');
  const isZip = filename.toLocaleLowerCase().endsWith('.zip') || (bytes[0] === 0x50 && bytes[1] === 0x4b);
  let jsonText: string;
  if (isZip) {
    const files = unzipSync(bytes);
    const manifest = files[MANIFEST_NAME];
    if (!manifest || manifest.byteLength > MAX_MANIFEST_BYTES) throw new Error('Preset archive manifest is missing or too large');
    jsonText = strFromU8(manifest);
  } else {
    if (bytes.byteLength > MAX_MANIFEST_BYTES) throw new Error('Preset file is too large');
    jsonText = strFromU8(bytes);
  }
  try {
    return normalizePresetLibrary(JSON.parse(jsonText) as unknown);
  } catch (error) {
    throw new Error(`Invalid preset package: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

function availableName(library: PresetLibrary, name: string, parentId: string | null): string {
  const clean = validateFolderName(name);
  if (!folderNameExists(library, clean, parentId)) return clean;
  let index = 2;
  while (folderNameExists(library, `${clean} (${index})`, parentId)) index += 1;
  return `${clean} (${index})`;
}

export function mergePresetLibrary(library: PresetLibrary, imported: PresetLibrary, targetFolderId: string | null): PresetLibrary {
  assertFolder(library, targetFolderId);
  const folders = [...library.folders];
  const presets = [...library.presets];
  const folderIds = new Set(folders.map(folder => folder.id));
  const presetIds = new Set(presets.map(preset => preset.id));
  const folderMap = new Map<string, string>();
  const depth = (folder: PresetFolder): number => folder.parentId === null ? 0 : 1 + depth(imported.folders.find(candidate => candidate.id === folder.parentId) ?? folder);
  for (const folder of [...imported.folders].sort((a, b) => depth(a) - depth(b))) {
    const newId = createId(folderIds);
    const parentId = folder.parentId === null ? targetFolderId : folderMap.get(folder.parentId) ?? targetFolderId;
    const newFolder: PresetFolder = {
      ...folder,
      id: newId,
      name: availableName({ ...library, folders }, folder.name, parentId),
      parentId,
      order: Math.max(-1, ...folders.filter(candidate => candidate.parentId === parentId).map(candidate => candidate.order)) + 1,
    };
    folderIds.add(newId);
    folderMap.set(folder.id, newId);
    folders.push(newFolder);
  }
  for (const preset of imported.presets) {
    const newId = createId(presetIds);
    presetIds.add(newId);
    const folderId = preset.folderId === null || preset.folderId === undefined
      ? targetFolderId
      : folderMap.get(preset.folderId) ?? targetFolderId;
    const order = Math.max(-1, ...presets.filter(candidate => (candidate.folderId ?? null) === folderId).map(candidate => candidate.order ?? 0)) + 1;
    presets.push({ ...preset, id: newId, folderId, order });
  }
  return validatePresetLibrary({ ...library, folders, presets });
}

export function makeLibraryPreset(name: string, state: StoreSnapshot, folderId: string | null, order: number): Preset {
  return makePreset(name, state, { folderId, order });
}
