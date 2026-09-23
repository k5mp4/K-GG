import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { IDENTITY_DIFFUSE_BEZIER } from './diffuseCurve';
import { makePreset } from './presetModel';
import {
  createEmptyPresetLibrary,
  createFolder,
  decodePresetPackage,
  deleteFolder,
  encodePresetExport,
  getFolderPreviewPresets,
  mergePresetLibrary,
  movePreset,
  normalizePresetLibrary,
  type PresetLibrary,
} from './presetLibrary';
import type { StoreSnapshot } from './presetModel';

function preset(name: string, order = 0) {
  const state = {
    diffuse: { luminanceBezier: [...IDENTITY_DIFFUSE_BEZIER] },
  } as unknown as StoreSnapshot;
  return makePreset(name, state, { order });
}

describe('presetLibrary', () => {
  it('normalizes legacy flat arrays into the root folder', () => {
    const legacy = [preset('Legacy A'), preset('Legacy B')].map(({ folderId: _folderId, order: _order, ...item }) => item);
    const library = normalizePresetLibrary(legacy);

    expect(library.version).toBe(2);
    expect(library.folders).toHaveLength(0);
    expect(library.presets.map(item => item.folderId)).toEqual([null, null]);
    expect(library.presets.map(item => item.order)).toEqual([0, 1]);
  });

  it('keeps nested children and moves contents to the parent when a folder is deleted', () => {
    const root = createEmptyPresetLibrary();
    const parentResult = createFolder(root, 'Motion', null);
    const childResult = createFolder(parentResult.library, 'Slow', parentResult.folder.id);
    const saved: PresetLibrary = {
      ...childResult.library,
      presets: [{ ...preset('Loop', 0), folderId: parentResult.folder.id }],
    };

    const trimmed = deleteFolder(saved, parentResult.folder.id);

    expect(trimmed.folders).toHaveLength(1);
    expect(trimmed.folders[0]?.name).toBe('Slow');
    expect(trimmed.folders[0]?.parentId).toBe(null);
    expect(trimmed.presets[0]?.folderId).toBe(null);
  });

  it('selects at most five descendant previews in display order', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Texture', null);
    const library: PresetLibrary = {
      ...folderResult.library,
      presets: Array.from({ length: 6 }, (_, index) => ({ ...preset(`Preset ${index}`, index), folderId: folderResult.folder.id })),
    };

    expect(getFolderPreviewPresets(library, folderResult.folder.id).map(item => item.name)).toEqual([
      'Preset 0', 'Preset 1', 'Preset 2', 'Preset 3', 'Preset 4',
    ]);
  });

  it('round-trips folder exports and remaps IDs on import', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Collection', null);
    const source: PresetLibrary = {
      ...folderResult.library,
      presets: [{ ...preset('Shared', 0), folderId: folderResult.folder.id }],
    };
    const exported = encodePresetExport(source, { kind: 'folder', folderId: folderResult.folder.id });
    const decoded = decodePresetPackage(exported.bytes, exported.filename);
    const imported = mergePresetLibrary(createEmptyPresetLibrary(), decoded, null);

    expect(exported.filename).toMatch(/\.zip$/);
    expect(imported.folders[0]?.name).toBe('Collection');
    expect(imported.presets[0]?.name).toBe('Shared');
    expect(imported.folders[0]?.id).not.toBe(folderResult.folder.id);
    expect(imported.presets[0]?.id).not.toBe(source.presets[0]?.id);
    expect(imported.presets[0]?.folderId).toBe(imported.folders[0]?.id);
  });

  it('moves a saved preset into a newly created folder and keeps its thumbnail', () => {
    const folderResult = createFolder(createEmptyPresetLibrary(), 'Effects', null);
    const saved = { ...preset('Rendered', 0), thumbnail: 'data:image/png;base64,preview' };
    const library: PresetLibrary = { ...folderResult.library, presets: [saved] };
    const moved = movePreset(library, saved.id, folderResult.folder.id);
    const exported = encodePresetExport(moved, { kind: 'folder', folderId: folderResult.folder.id });
    const decoded = decodePresetPackage(exported.bytes, exported.filename);

    expect(decoded.presets[0]?.folderId).toBe(folderResult.folder.id);
    expect(decoded.presets[0]?.thumbnail).toBe(saved.thumbnail);
  });

  it('rejects unsupported packages without producing a library', () => {
    expect(() => normalizePresetLibrary({ format: 'other', version: 2, folders: [], presets: [] })).toThrow(/Unsupported/);
    expect(() => decodePresetPackage(new TextEncoder().encode('{"broken":true}'))).toThrow(/Invalid preset package/);
  });
});

describe('untrusted preset ZIP limits', () => {
  it('rejects additional and traversal entries instead of decompressing them', () => {
    for (const name of ['extra.bin', '../outside.json']) {
      const zip = zipSync({ 'preset-library.json': strToU8(JSON.stringify(createEmptyPresetLibrary())), [name]: new Uint8Array(32) });
      expect(() => decodePresetPackage(zip, 'presets.zip')).toThrow();
    }
  });
  it('rejects a corrupt checksum', () => {
    const zip = zipSync({ 'preset-library.json': strToU8(JSON.stringify(createEmptyPresetLibrary())) });
    const broken = zip.slice();
    const view = new DataView(broken.buffer);
    const central = view.getUint32(broken.length - 6, true);
    view.setUint32(central + 16, 0, true);
    expect(() => decodePresetPackage(broken, 'presets.zip')).toThrow();
  });
  it('rejects ZIP64, oversized declarations and actual expansion beyond a forged size', () => {
    const zip = zipSync({ 'preset-library.json': strToU8(' '.repeat(1024 * 1024)) });
    for (const kind of ['zip64', 'oversized', 'forged']) {
      const broken = zip.slice();
      const view = new DataView(broken.buffer);
      const central = view.getUint32(broken.length - 6, true);
      if (kind === 'zip64') view.setUint16(central + 6, 45, true);
      else view.setUint32(central + 24, kind === 'oversized' ? 17 * 1024 * 1024 : 1, true);
      expect(() => decodePresetPackage(broken, 'presets.zip')).toThrow();
    }
  });
});
