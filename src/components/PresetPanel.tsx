import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type MutableRefObject } from 'react';
import { createEmptyManualDistortMap, createEmptyManualSmoothMask, normalizeNoiseDistortionConfig, normalizePostprocessConfig, STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { createDefaultEffectPipeline, normalizeEffectPipelineConfig } from '../lib/effectPipeline';
import { normalizeClothGradientConfig } from '../types/clothGradient';
import { normalizeConeViewConfig } from '../types/coneView';
import { normalizeSeamlessConfig } from '../types/seamless';
import { normalizeImageGradientConfig } from '../types/imageGradient';
import { resolveDiffuseBezier } from '../lib/diffuseCurve';
import {
  createFolder,
  deleteFolder,
  deletePreset,
  exportPresetPackage,
  importPresetPackage,
  loadPresetLibrary,
  movePreset,
  renameFolder,
  savePreset,
  type Preset,
  type PresetExportScope,
  type PresetFolder,
  type PresetLibrary,
} from '../lib/presets';
import { loadUserColorPalettes, mergeUserColorPalettes } from '../lib/colorPalettes';
import { getChildFolders, getFolderPreviewPresets, getPresetsInFolder, normalizePresetLibrary } from '../lib/presetLibrary';
import { PresetPreview } from './PresetPreview';
import { capturePresetThumbnail } from '../lib/presetThumbnail';
import defaultPresets from '../assets/gradPreset_kg_defaultPresets.json';
import { useLanguage } from '../i18n/LanguageProvider';
import { IconButton } from './IconButton';

type PresetPanelProps = {
  canvasW: number;
  canvasH: number;
  setCanvasW: (w: number) => void;
  setCanvasH: (h: number) => void;
  aspectRatioRef: MutableRefObject<number>;
  onPresetLoad: () => void;
};

type ViewMode = 'grid' | 'list';

type FolderTreeProps = {
  folders: PresetFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onDropPreset: (presetId: string, folderId: string | null) => void;
};

type FolderOption = {
  id: string;
  label: string;
};

const PRESET_DRAG_TYPE = 'application/x-kgg-preset';

function getDraggedPresetId(event: DragEvent<HTMLElement>): string | null {
  return event.dataTransfer.getData(PRESET_DRAG_TYPE) || null;
}

function normalizeManualDistortResolution(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.min(512, Math.round(value)))
    : STORE_DEFAULTS.manualDistort.mapResolution;
}

function validFiniteArray(value: unknown, expectedLength: number): value is number[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every(item => typeof item === 'number' && Number.isFinite(item));
}

function getViewMode(): ViewMode {
  try {
    return localStorage.getItem('kagaribi15_preset_view') === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function flattenFolderOptions(folders: PresetFolder[], parentId: string | null = null, depth = 0): FolderOption[] {
  return getChildFolders({ format: 'kgg-preset-library', version: 2, folders, presets: [] }, parentId).flatMap(folder => [
    { id: folder.id, label: `${'　'.repeat(depth)}${folder.name}` },
    ...flattenFolderOptions(folders, folder.id, depth + 1),
  ]);
}

function FolderTree({ folders, selectedFolderId, onSelect, onDropPreset }: FolderTreeProps) {
  const { t } = useLanguage();
  const [dragOverId, setDragOverId] = useState<string | null | undefined>(undefined);

  function handleDragOver(event: DragEvent<HTMLElement>, folderId: string | null) {
    if (!event.dataTransfer.types.includes(PRESET_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(folderId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, folderId: string | null) {
    event.preventDefault();
    const presetId = getDraggedPresetId(event);
    setDragOverId(undefined);
    if (presetId) onDropPreset(presetId, folderId);
  }

  const renderBranch = (parentId: string | null, depth: number) => getChildFolders({ format: 'kgg-preset-library', version: 2, folders, presets: [] }, parentId).map(folder => (
    <div key={folder.id}>
      <button
        type="button"
        onClick={() => onSelect(folder.id)}
        onDragOver={event => handleDragOver(event, folder.id)}
        onDragLeave={() => setDragOverId(undefined)}
        onDrop={event => handleDrop(event, folder.id)}
        className={`flex w-full items-center gap-1 rounded-sm px-1.5 py-1 text-left text-[10px] transition-colors ${dragOverId === folder.id ? 'bg-fire/30 text-cream ring-1 ring-fire' : selectedFolderId === folder.id ? 'bg-fire/20 text-cream ring-1 ring-fire/60' : 'text-tab-inactive hover:bg-k-surface hover:text-k-text'}`}
        style={{ paddingLeft: `${6 + depth * 10}px` }}
      >
        <span className="text-[9px] text-fire/80">◆</span>
        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
      </button>
      {renderBranch(folder.id, depth + 1)}
    </div>
  ));

  return (
    <nav aria-label={t('preset.folders')} className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        onDragOver={event => handleDragOver(event, null)}
        onDragLeave={() => setDragOverId(undefined)}
        onDrop={event => handleDrop(event, null)}
        className={`flex w-full items-center gap-1 rounded-sm px-1.5 py-1 text-left text-[10px] transition-colors ${dragOverId === null ? 'bg-fire/30 text-cream ring-1 ring-fire' : selectedFolderId === null ? 'bg-fire/20 text-cream ring-1 ring-fire/60' : 'text-tab-inactive hover:bg-k-surface hover:text-k-text'}`}
      >
        <span className="text-[9px] text-fire">◆</span>
        <span className="truncate">{t('preset.root')}</span>
      </button>
      {renderBranch(null, 0)}
    </nav>
  );
}

function PresetCard({
  preset,
  folders,
  isBuiltin,
  isActive,
  viewMode,
  onLoad,
  onDelete,
  onMove,
}: {
  preset: Preset;
  folders: PresetFolder[];
  isBuiltin: boolean;
  isActive: boolean;
  viewMode: ViewMode;
  onLoad: () => void;
  onDelete: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const { t } = useLanguage();
  const folderOptions = useMemo(() => flattenFolderOptions(folders), [folders]);
  if (viewMode === 'list') {
    return (
      <article
        draggable={!isBuiltin}
        onDragStart={event => { if (!isBuiltin) { event.dataTransfer.setData(PRESET_DRAG_TYPE, preset.id); event.dataTransfer.effectAllowed = 'move'; } }}
        className={`flex min-w-0 items-center gap-2 border border-cream/10 bg-k-surface/65 p-1.5 transition-colors ${isActive ? 'border-fire/70 bg-fire/10' : 'hover:border-cream/25'} ${!isBuiltin ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="h-11 w-16 shrink-0 overflow-hidden border border-cream/15 bg-deep/40">
          <PresetPreview preset={preset} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-k-text" title={preset.name}>{preset.name}</p>
          <p className="text-[9px] uppercase tracking-wider text-tab-inactive">{isBuiltin ? t('preset.builtIn') : t('preset.saved')}</p>
        </div>
        {!isBuiltin && (
          <select
            aria-label={t('preset.destination', { name: preset.name })}
            value={preset.folderId ?? ''}
            onChange={event => onMove(event.target.value || null)}
            className="max-w-[78px] bg-k-bg px-1 py-1 text-[9px] text-tab-inactive outline-none"
          >
            <option value="">{t('preset.root')}</option>
            {folderOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        )}
        <button type="button" onClick={onLoad} className="shrink-0 px-1.5 py-1 text-[10px] font-bold text-fire hover:text-cream">{t('common.load')}</button>
        {!isBuiltin && <IconButton icon="delete" onClick={onDelete} className="shrink-0 px-1 text-red-400 hover:text-red-300" label={t('preset.deleteNamed', { name: preset.name })} />}
      </article>
    );
  }

  return (
    <article
      draggable={!isBuiltin}
      onDragStart={event => { if (!isBuiltin) { event.dataTransfer.setData(PRESET_DRAG_TYPE, preset.id); event.dataTransfer.effectAllowed = 'move'; } }}
      className={`group min-w-0 overflow-hidden border bg-k-surface/70 transition-all ${isActive ? 'border-fire/80 bg-fire/10 shadow-[0_0_0_1px_rgba(213,73,43,0.25)]' : 'border-cream/10 hover:-translate-y-0.5 hover:border-cream/30'} ${!isBuiltin ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <button type="button" onClick={onLoad} className="block w-full text-left">
        <div className="aspect-[16/10] overflow-hidden border-b border-cream/10 bg-deep/40">
          <PresetPreview preset={preset} />
        </div>
        <div className="px-2 pt-1.5">
          <p className="truncate text-[11px] font-semibold text-k-text" title={preset.name}>{preset.name}</p>
          <p className="text-[9px] uppercase tracking-[0.16em] text-tab-inactive">{isBuiltin ? t('preset.builtIn') : t('preset.saved')}</p>
        </div>
      </button>
      <div className="flex items-center gap-1 px-2 pb-1.5 pt-1">
        {!isBuiltin && (
          <select
            aria-label={t('preset.destination', { name: preset.name })}
            value={preset.folderId ?? ''}
            onChange={event => onMove(event.target.value || null)}
            className="min-w-0 flex-1 bg-k-bg px-1 py-1 text-[9px] text-tab-inactive outline-none"
          >
            <option value="">{t('preset.root')}</option>
            {folderOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        )}
        <button type="button" onClick={onLoad} className="shrink-0 px-1.5 py-1 text-[10px] font-bold text-fire hover:text-cream">{t('common.load')}</button>
        {!isBuiltin && <IconButton icon="delete" onClick={onDelete} className="shrink-0 px-1 text-red-400 hover:text-red-300" label={t('preset.deleteNamed', { name: preset.name })} />}
      </div>
    </article>
  );
}

function FolderCard({ folder, library, onOpen, onDropPreset }: { folder: PresetFolder; library: PresetLibrary; onOpen: () => void; onDropPreset: (presetId: string, folderId: string | null) => void }) {
  const { t } = useLanguage();
  const samples = getFolderPreviewPresets(library, folder.id);
  const [dragOver, setDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    if (!event.dataTransfer.types.includes(PRESET_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    const presetId = getDraggedPresetId(event);
    setDragOver(false);
    if (presetId) onDropPreset(presetId, folder.id);
  }

  return (
    <button type="button" onClick={onOpen} onDragOver={handleDragOver} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} className={`min-w-0 border bg-deep/45 p-1.5 text-left transition-all hover:-translate-y-0.5 hover:border-fire/70 hover:bg-fire/10 ${dragOver ? 'border-fire bg-fire/20 ring-1 ring-fire' : 'border-fire/25'}`}>
      <div className="grid grid-cols-5 gap-px overflow-hidden bg-fire/25">
        {Array.from({ length: 5 }, (_, index) => {
          const preset = samples[index];
          return <div key={preset?.id ?? `empty-${index}`} className="aspect-square min-w-0 bg-k-bg/80">{preset ? <PresetPreview preset={preset} /> : <span className="block h-full w-full bg-[linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.08)_46%,transparent_50%)]" />}</div>;
        })}
      </div>
      <p className="mt-1 truncate text-[10px] font-semibold text-cream">{folder.name}</p>
      <p className="text-[9px] uppercase tracking-wider text-fire/75">{t('preset.folderPreview', { count: samples.length })}</p>
    </button>
  );
}

export function PresetPanel({ canvasW, canvasH, setCanvasW, setCanvasH, aspectRatioRef, onPresetLoad }: PresetPanelProps) {
  const { t } = useLanguage();
  const store = useGradientStore();
  const [library, setLibrary] = useState<PresetLibrary>({ format: 'kgg-preset-library', version: 2, folders: [], presets: [] });
  const [name, setName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getViewMode);
  const [exportScope, setExportScope] = useState<'preset' | 'folder' | 'library'>('preset');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const builtinLibrary = useMemo(() => normalizePresetLibrary(defaultPresets), []);

  async function refresh() {
    try {
      setLibrary(await loadPresetLibrary());
      setError(null);
    } catch {
      setError(t('preset.loadFailed'));
    }
  }

  useEffect(() => { void refresh(); }, []);

  const currentFolder = library.folders.find(folder => folder.id === selectedFolderId) ?? null;
  const childFolders = getChildFolders(library, selectedFolderId);
  const userPresets = getPresetsInFolder(library, selectedFolderId);
  const visiblePresets = selectedFolderId === null ? [...builtinLibrary.presets, ...userPresets] : userPresets;
  const allUserPresets = library.presets;

  function setDisplayMode(nextMode: ViewMode) {
    setViewMode(nextMode);
    try { localStorage.setItem('kagaribi15_preset_view', nextMode); } catch { /* storage is optional */ }
  }

  function handleLoad(preset: Preset) {
    const s = preset.state;
    if (s.gradient) store.setGradient(s.gradient);
    if (s.noiseDistortion) store.setNoiseDistortion(normalizeNoiseDistortionConfig(s.noiseDistortion));
    // Always pass Diffuse through STORE_DEFAULTS so legacy presets receive
    // adaptiveEnabled=false and the identity luminance curve.
    const loadedDiffuse = {
      ...STORE_DEFAULTS.diffuse,
      ...(s.diffuse ?? {}),
      luminanceBezier: resolveDiffuseBezier(s.diffuse?.luminanceBezier, s.diffuse?.luminanceCurve),
    };
    delete loadedDiffuse.luminanceCurve;
    store.setDiffuse(loadedDiffuse);
    store.setImageGradient(normalizeImageGradientConfig(s.imageGradient, s.imageGradient ? 0 : STORE_DEFAULTS.imageGradient.anchorInfluence));
    if (s.slitScan) {
      const loadedSlit = {
        ...STORE_DEFAULTS.slitScan,
        ...s.slitScan,
      };
      delete (loadedSlit as Record<string, unknown>).autoLoop;
      store.setSlitScan(loadedSlit);
    }
    if (s.stretch) store.setStretch(s.stretch);
    if (s.normalMap) store.setNormalMap(s.normalMap);
    store.setRadon({ ...STORE_DEFAULTS.radon, ...s.radon, enabled: false });
    store.setIridescence({ ...STORE_DEFAULTS.iridescence, ...s.iridescence, enabled: false });
    const loadedPostprocess = normalizePostprocessConfig(
      s.postprocess ?? s.postprocessDistort,
      s.manualDistort,
    );
    const legacyDistort = s.manualDistort ?? loadedPostprocess;
    const resolution = normalizeManualDistortResolution(legacyDistort.mapResolution);
    const displacementLength = resolution * resolution * 2;
    const smoothMaskLength = resolution * resolution;
    store.setManualDistort({
      ...STORE_DEFAULTS.manualDistort,
      ...legacyDistort,
      enabled: false,
      mapResolution: resolution,
      displacement: validFiniteArray(legacyDistort.displacement, displacementLength) ? legacyDistort.displacement : createEmptyManualDistortMap(resolution),
      smoothMask: validFiniteArray(legacyDistort.smoothMask, smoothMaskLength) ? legacyDistort.smoothMask : createEmptyManualSmoothMask(resolution),
    });
    store.setPostprocess(loadedPostprocess);
    // clothGradient が無い旧プリセットでも安全にデフォルトで初期化し、
    // SANDBOX の Cloth 設定を反映する。
    store.setClothGradient(normalizeClothGradientConfig(s.clothGradient));
    store.setConeView(normalizeConeViewConfig(s.coneView));
    store.setSeamless(normalizeSeamlessConfig(s.seamless));
    // effectPipeline を持たない旧プリセット/内蔵プリセットは Legacy v1 に
    // ならないよう、既定の V2 パイプラインへ昇格する。V2 でなければ
    // SANDBOX Cloth は描画パイプラインへ一切統合されないため。
    store.setEffectPipeline(s.effectPipeline
      ? normalizeEffectPipelineConfig(s.effectPipeline)
      : createDefaultEffectPipeline());
    if (s.matcap) store.setMatcap(s.matcap);
    store.setKeyframeTracks(s.keyframeTracks ?? {});
    if (s.animation) store.setAnimation({ ...s.animation, previewLoop: s.animation.previewLoop ?? true });
    if (s.colorPalettes) mergeUserColorPalettes(s.colorPalettes);
    if (s.resolution) {
      const normalizeResolution = (value: number) => Number.isFinite(value) ? Math.max(1, Math.min(4096, Math.round(value))) : 1024;
      const presetWidth = normalizeResolution(s.resolution.width);
      const presetHeight = normalizeResolution(s.resolution.height);
      setCanvasW(presetWidth);
      setCanvasH(presetHeight);
      aspectRatioRef.current = presetWidth / presetHeight;
    }
    store.setPresetName(preset.name);
    setSelectedPresetId(preset.id);
    onPresetLoad();
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch, animation, normalMap, coneView, seamless, radon, iridescence, manualDistort, postprocess, effectPipeline, matcap, keyframeTracks } = store;
    const state = {
      gradient, noiseDistortion, diffuse, imageGradient,
      slitScan: { ...slitScan, selectedSlitIdx: -1 }, stretch,
      animation, normalMap, coneView, seamless, radon, iridescence, manualDistort: { ...manualDistort, enabled: false }, postprocess, effectPipeline, matcap,
      keyframeTracks, colorPalettes: loadUserColorPalettes(), resolution: { width: canvasW, height: canvasH },
    };
    setSaving(true);
    try {
      const thumbnail = await capturePresetThumbnail(state);
      const saved = await savePreset(trimmed, state, selectedFolderId, thumbnail);
      store.setPresetName(trimmed);
      setSelectedPresetId(saved.id);
      setName('');
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('preset.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    try {
      const folder = await createFolder(folderName, selectedFolderId);
      setFolderName('');
      setSelectedFolderId(folder.id);
      await refresh();
    } catch (folderError) {
      setError(folderError instanceof Error ? folderError.message : t('preset.createFolderFailed'));
    }
  }

  async function handleRenameFolder() {
    if (!currentFolder) return;
    const nextName = window.prompt(t('preset.folderName'), currentFolder.name)?.trim();
    if (!nextName || nextName === currentFolder.name) return;
    try { await renameFolder(currentFolder.id, nextName); await refresh(); }
    catch (folderError) { setError(folderError instanceof Error ? folderError.message : t('preset.renameFolderFailed')); }
  }

  async function handleDeleteFolder() {
    if (!currentFolder || !window.confirm(t('preset.deleteFolderConfirm', { name: currentFolder.name }))) return;
    try {
      await deleteFolder(currentFolder.id);
      setSelectedFolderId(currentFolder.parentId);
      await refresh();
    } catch (folderError) { setError(folderError instanceof Error ? folderError.message : t('preset.deleteFolderFailed')); }
  }

  async function handleMovePreset(id: string, folderId: string | null) {
    try { await movePreset(id, folderId); await refresh(); }
    catch (moveError) { setError(moveError instanceof Error ? moveError.message : t('preset.moveFailed')); }
  }

  async function handleDeletePreset(id: string) {
    try { await deletePreset(id); await refresh(); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : t('preset.deleteFailed')); }
  }

  async function handleExport() {
    const scope: PresetExportScope = exportScope === 'library'
      ? { kind: 'library' }
      : exportScope === 'folder'
        ? selectedFolderId === null ? { kind: 'library' } : { kind: 'folder', folderId: selectedFolderId }
        : { kind: 'preset', presetId: selectedPresetId ?? allUserPresets[0]?.id ?? '' };
    if (scope.kind === 'preset' && !scope.presetId) { setError(t('preset.selectForExport')); return; }
    try { await exportPresetPackage(scope); }
    catch (exportError) { setError(exportError instanceof Error ? exportError.message : t('preset.exportFailed')); }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importPresetPackage(file, selectedFolderId); await refresh(); }
    catch (importError) { setError(importError instanceof Error ? importError.message : t('preset.importFailed')); }
    finally { event.target.value = ''; }
  }

  const selectedFolderLabel = currentFolder?.name ?? t('preset.root');

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 text-k-text">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <p className="font-display text-xs font-semibold tracking-[0.18em] text-k-text">{t('preset.library')}</p>
          <p className="mt-0.5 text-[9px] tracking-wider text-tab-inactive">{selectedFolderLabel} · {t('preset.itemCount', { count: userPresets.length })}</p>
        </div>
        <div className="flex shrink-0 overflow-hidden border border-cream/20">
          <IconButton icon="grid" label={t('preset.gridView')} aria-pressed={viewMode === 'grid'} onClick={() => setDisplayMode('grid')} className={`px-2 py-1 text-[12px] ${viewMode === 'grid' ? 'bg-fire/20 text-cream' : 'text-tab-inactive hover:text-k-text'}`} />
          <IconButton icon="list" label={t('preset.listView')} aria-pressed={viewMode === 'list'} onClick={() => setDisplayMode('list')} className={`px-2 py-1 text-[12px] ${viewMode === 'list' ? 'bg-fire/20 text-cream' : 'text-tab-inactive hover:text-k-text'}`} />
        </div>
      </div>

      <section className="shrink-0 border border-cream/10 bg-k-surface/45 p-1.5">
          <p className="mb-1 px-1 text-[9px] font-bold tracking-[0.18em] text-tab-inactive">{t('preset.folderTree')}</p>
          <div className="max-h-36 overflow-y-auto pr-0.5 scrollbar-thin"><FolderTree folders={library.folders} selectedFolderId={selectedFolderId} onSelect={setSelectedFolderId} onDropPreset={(presetId, folderId) => void handleMovePreset(presetId, folderId)} /></div>
          <div className="mt-2 border-t border-cream/10 pt-2">
            <div className="flex gap-1">
              <input value={folderName} onChange={event => setFolderName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void handleCreateFolder(); }} placeholder={t('preset.newFolder')} className="min-w-0 flex-1 bg-k-bg px-1.5 py-1 text-[10px] text-k-text outline-none ring-1 ring-cream/10 focus:ring-fire/60" />
              <button type="button" onClick={() => void handleCreateFolder()} className="bg-fire/80 px-2 text-[13px] font-bold text-cream hover:bg-fire" aria-label={t('preset.createFolder')}>＋</button>
            </div>
            {currentFolder && <div className="mt-1 flex gap-1"><button type="button" onClick={() => void handleRenameFolder()} className="flex-1 px-1 py-1 text-[9px] text-tab-inactive hover:bg-k-surface hover:text-k-text">{t('preset.renameFolder')}</button><button type="button" onClick={() => void handleDeleteFolder()} className="flex-1 px-1 py-1 text-[9px] text-red-400 hover:bg-red-400/10">{t('common.delete')}</button></div>}
          </div>
      </section>

        <main className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 scrollbar-thin">
          <div className="flex min-w-0 items-center gap-2 border-b border-cream/10 pb-1">
            <span className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">{selectedFolderLabel}</span>
            <span className="text-[9px] text-tab-inactive">{t('preset.folderCount', { count: childFolders.length })}</span>
          </div>

          {childFolders.length > 0 && <div className="grid grid-cols-2 gap-1.5">{childFolders.map(folder => <FolderCard key={folder.id} folder={folder} library={library} onOpen={() => setSelectedFolderId(folder.id)} onDropPreset={handleMovePreset} />)}</div>}

          {visiblePresets.length === 0 ? (
            <div className="border border-dashed border-cream/15 px-3 py-6 text-center text-[10px] italic text-tab-inactive">{t('preset.empty')}</div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-1.5' : 'space-y-1'}>
              {visiblePresets.map(preset => <PresetCard key={preset.id} preset={preset} folders={library.folders} isBuiltin={builtinLibrary.presets.some(candidate => candidate.id === preset.id)} isActive={store.presetName === preset.name} viewMode={viewMode} onLoad={() => handleLoad(preset)} onDelete={() => void handleDeletePreset(preset.id)} onMove={folderId => void handleMovePreset(preset.id, folderId)} />)}
            </div>
          )}
        </main>

      <div className="shrink-0 space-y-2 border-t border-cream/15 bg-k-bg/95 pt-2 backdrop-blur">
        <div className="flex gap-1.5">
          <input type="text" value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void handleSave(); }} placeholder={t('preset.saveTo', { name: selectedFolderLabel })} className="min-w-0 flex-1 bg-k-surface px-2 py-1.5 text-[10px] text-k-text outline-none ring-1 ring-cream/15 focus:ring-fire/70" />
          <button type="button" onClick={() => void handleSave()} disabled={!name.trim() || saving} className="bg-fire px-2.5 py-1 text-[10px] font-bold text-cream transition-opacity disabled:opacity-40">{saving ? t('common.saving') : t('common.save')}</button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
          <select value={exportScope} onChange={event => setExportScope(event.target.value as typeof exportScope)} className="min-w-0 bg-k-surface px-2 py-1.5 text-[10px] text-k-text outline-none">
            <option value="preset">{t('preset.exportSelected')}</option>
            <option value="folder">{t('preset.exportFolder')}</option>
            <option value="library">{t('preset.exportLibrary')}</option>
          </select>
          <button type="button" onClick={() => void handleExport()} className="bg-k-muted px-2 py-1.5 text-[10px] text-k-text hover:bg-k-muted/70">{t('common.export')}</button>
        </div>
        {exportScope === 'preset' && <select value={selectedPresetId ?? ''} onChange={event => setSelectedPresetId(event.target.value || null)} className="w-full bg-k-surface px-2 py-1.5 text-[10px] text-k-text outline-none"><option value="">{t('preset.select')}</option>{allUserPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select>}
        <button type="button" onClick={() => importRef.current?.click()} className="w-full border border-cream/15 bg-k-surface/70 py-1.5 text-[10px] text-tab-inactive hover:border-fire/50 hover:text-k-text">{t('preset.importTo', { name: selectedFolderLabel })}</button>
        <input ref={importRef} type="file" accept=".json,.zip,.kggpresets" className="hidden" onChange={handleImport} />
        {error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[10px] text-red-300">{error}</p>}
      </div>
    </div>
  );
}
