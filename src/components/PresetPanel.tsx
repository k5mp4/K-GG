import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type DragEvent, type MouseEvent as ReactMouseEvent, type MutableRefObject } from 'react';
import { createEmptyManualDistortMap, createEmptyManualSmoothMask, normalizeNoiseDistortionConfig, normalizePostprocessConfig, STORE_DEFAULTS, useGradientStore } from '../store/gradientStore';
import { createDefaultEffectPipeline, normalizeEffectPipelineConfig } from '../lib/effectPipeline';
import { normalizeClothGradientConfig } from '../types/clothGradient';
import { normalizeConeViewConfig } from '../types/coneView';
import { normalizeSeamlessConfig } from '../types/seamless';
import { normalizeTextureConfig } from '../types/texture';
import { normalizeShapesConfig } from '../types/shapes';
import { normalizeFlowGradientConfig } from '../types/flowGradient';
import { resolvePersistedDatamosh } from '../types/datamosh';
import { normalizeImageGradientConfig } from '../types/imageGradient';
import { stripSlitPhaseMotionFields } from '../types/distortion';
import { resolveDiffuseBezier } from '../lib/diffuseCurve';
import { createPresetSaveState } from '../lib/presetModel';
import { keepLoopTimingOnPresetLoad } from '../lib/animationConfig';
import {
  createFolder,
  deleteFolder,
  exportPresetPackage,
  importPresetPackage,
  renameFolder,
  savePreset,
  type Preset,
  type PresetExportScope,
  type PresetFolder,
  type PresetLibrary,
} from '../lib/presets';
import { loadUserColorPalettes, mergeUserColorPalettes } from '../lib/colorPalettes';
import { getChildFolders, getFolderPath, getFolderPreviewPresets, getPresetRangeIds, getPresetsInFolder } from '../lib/presetLibrary';
import { builtinPresetLibrary, ensurePresetLibraryLoaded, getPresetLibrarySnapshot, isBuiltinPresetId, refreshPresetLibrary, subscribePresetLibrary } from '../lib/presetLibraryCache';
import { deletePresetsWithHistory, movePresetsWithHistory } from '../lib/presetLibraryActions';
import { PresetPreview } from './PresetPreview';
import { PresetContextMenu } from './PresetContextMenu';
import { capturePresetThumbnail } from '../lib/presetThumbnail';
import { useLanguage } from '../i18n/LanguageProvider';
import { IconButton } from './IconButton';
import { applicationCommands } from '../application/commands';
import { useGcInput } from '../features/native/useGcInput';
import { moveListCursor, type GcCommand } from '../lib/gcInput';
import { SidebarSection } from './SidebarSection';
import { InputRadio } from 'tweeq';

type PresetPanelProps = {
  canvasW: number;
  canvasH: number;
  setCanvasW: (w: number) => void;
  setCanvasH: (h: number) => void;
  aspectRatioRef: MutableRefObject<number>;
  onPresetLoad: () => void;
};

type ViewMode = 'grid' | 'list';

const EXPORT_SCOPES = ['preset', 'folder', 'library'] as const;
type ExportScope = (typeof EXPORT_SCOPES)[number];

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

const GRID_GAP_PX = 6;
const MAX_GRID_COLUMNS = 4;

/** カードの最小幅を保ちつつ、サイドバーの幅に応じて最大4列まで並べる。 */
function responsiveColumns(minWidthPx: number) {
  const capWidth = `calc((100% - ${(MAX_GRID_COLUMNS - 1) * GRID_GAP_PX}px) / ${MAX_GRID_COLUMNS})`;
  return { gridTemplateColumns: `repeat(auto-fill, minmax(max(${minWidthPx}px, ${capWidth}), 1fr))` } as const;
}

const PRESET_GRID_STYLE = responsiveColumns(100);
const FOLDER_GRID_STYLE = responsiveColumns(120);

type PresetCardProps = {
  preset: Preset;
  isBuiltin: boolean;
  isActive: boolean;
  /** Shift/Ctrl+クリックで選んだ複数選択の対象。 */
  isSelected: boolean;
  /** GCコントローラー操作で選択中の候補。 */
  isCursor: boolean;
  viewMode: ViewMode;
  onClick: (preset: Preset, event: ReactMouseEvent<HTMLElement>) => void;
  onContextMenu: (preset: Preset, event: ReactMouseEvent<HTMLElement>) => void;
};

const SELECTED_BADGE = (
  <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1 flex h-4 w-4 items-center justify-center bg-sky-400 text-[10px] font-bold leading-none text-deep">✓</span>
);

const PresetCard = memo(function PresetCard({ preset, isBuiltin, isActive, isSelected, isCursor, viewMode, onClick, onContextMenu }: PresetCardProps) {
  const { t } = useLanguage();
  const title = isBuiltin ? `${preset.name} · ${t('preset.builtIn')}` : preset.name;
  const selectionRing = isSelected ? 'ring-2 ring-sky-400' : '';
  const dragProps = {
    draggable: !isBuiltin,
    onDragStart: (event: DragEvent<HTMLElement>) => {
      if (isBuiltin) return;
      event.dataTransfer.setData(PRESET_DRAG_TYPE, preset.id);
      event.dataTransfer.effectAllowed = 'move';
    },
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => onContextMenu(preset, event),
  };

  if (viewMode === 'list') {
    return (
      <article
        {...dragProps}
        data-preset-id={preset.id}
        data-selected={isSelected || undefined}
        className={`flex min-w-0 select-none items-center gap-1 border bg-k-surface/65 p-1.5 transition-colors ${isCursor ? 'ring-2 ring-cream' : selectionRing} ${isActive ? 'border-fire/70 bg-fire/10' : 'border-cream/10 hover:border-cream/25'} ${!isBuiltin ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <button type="button" onClick={event => onClick(preset, event)} title={title} aria-current={isActive || undefined} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="relative block h-11 w-16 shrink-0 overflow-hidden border border-cream/15 bg-deep/40">
            <PresetPreview preset={preset} />
            {isSelected && SELECTED_BADGE}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-k-text">{preset.name}</span>
        </button>
      </article>
    );
  }

  return (
    <article
      {...dragProps}
      data-preset-id={preset.id}
      data-selected={isSelected || undefined}
      className={`relative min-w-0 select-none overflow-hidden border bg-k-surface/70 transition-all ${isCursor ? 'ring-2 ring-cream' : selectionRing} ${isActive ? 'border-fire/80 shadow-[0_0_0_1px_rgba(213,73,43,0.25)]' : 'border-cream/10 hover:-translate-y-0.5 hover:border-cream/30'} ${!isBuiltin ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <button type="button" onClick={event => onClick(preset, event)} title={title} aria-current={isActive || undefined} className="relative block aspect-[16/10] w-full overflow-hidden bg-deep/40 text-left">
        <PresetPreview preset={preset} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-1.5 pb-1 pt-4">
          <span className={`block truncate text-[10px] font-semibold leading-tight drop-shadow ${isActive ? 'text-cream' : 'text-white'}`}>{preset.name}</span>
        </span>
        {isSelected && SELECTED_BADGE}
      </button>
    </article>
  );
});

type BreadcrumbProps = {
  path: PresetFolder[];
  onSelect: (folderId: string | null) => void;
  onDropPreset: (presetId: string, folderId: string | null) => void;
};

/** Folder path from the root. Each ancestor navigates back and accepts a dropped Preset. */
function FolderBreadcrumb({ path, onSelect, onDropPreset }: BreadcrumbProps) {
  const { t } = useLanguage();
  const [dragOverId, setDragOverId] = useState<string | null | undefined>(undefined);
  const crumbs: Array<{ id: string | null; label: string }> = [
    { id: null, label: t('preset.root') },
    ...path.map(folder => ({ id: folder.id, label: folder.name })),
  ];

  return (
    <nav aria-label={t('preset.breadcrumb')} className="shrink-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5 text-[10px]">
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={crumb.id ?? 'root'} className="flex min-w-0 items-center gap-0.5">
              {index > 0 && <span aria-hidden="true" className="text-tab-inactive/60">›</span>}
              <button
                type="button"
                title={crumb.label}
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onSelect(crumb.id)}
                onDragOver={event => {
                  if (!event.dataTransfer.types.includes(PRESET_DRAG_TYPE)) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDragOverId(crumb.id);
                }}
                onDragLeave={() => setDragOverId(undefined)}
                onDrop={event => {
                  event.preventDefault();
                  const presetId = getDraggedPresetId(event);
                  setDragOverId(undefined);
                  if (presetId) onDropPreset(presetId, crumb.id);
                }}
                className={`max-w-[9rem] truncate px-1.5 py-1 transition-colors ${dragOverId === crumb.id ? 'bg-fire/30 text-cream ring-1 ring-fire' : isCurrent ? 'font-semibold text-cream' : 'text-tab-inactive hover:bg-k-surface hover:text-k-text'}`}
              >
                {crumb.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
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
  // 全体を購読すると、パラメータ操作のたびに全Cardが再描画されるため必要な値だけ購読する。
  const presetName = useGradientStore(state => state.presetName);
  const { library, status } = useSyncExternalStore(subscribePresetLibrary, getPresetLibrarySnapshot);
  const [name, setName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getViewMode);
  const [exportScope, setExportScope] = useState<ExportScope>('preset');
  const [exportOpen, setExportOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [cursorToast, setCursorToast] = useState<string | null>(null);
  const cursorToastTimer = useRef<number | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  // Shiftクリックの範囲選択の起点。最後にクリック（または右クリック）したPreset。
  const anchorIdRef = useRef<string | null>(null);

  // 保存先の読み込みは起動時に済んでいる。ここでは変更後の更新だけを行う。
  async function refresh() {
    await refreshPresetLibrary();
    setError(null);
  }

  useEffect(() => { void ensurePresetLibraryLoaded(); }, []);
  // フォルダーを移ったら選択とメニューを閉じる。見えないPresetを誤って削除しないため。
  useEffect(() => { setSelectedIds(new Set()); setMenu(null); anchorIdRef.current = null; }, [selectedFolderId]);

  const currentFolder = library.folders.find(folder => folder.id === selectedFolderId) ?? null;
  const childFolders = useMemo(() => getChildFolders(library, selectedFolderId), [library, selectedFolderId]);
  const folderPath = useMemo(() => getFolderPath(library, selectedFolderId), [library, selectedFolderId]);
  const userPresets = useMemo(() => getPresetsInFolder(library, selectedFolderId), [library, selectedFolderId]);
  const visiblePresets = useMemo(
    () => selectedFolderId === null ? [...builtinPresetLibrary.presets, ...userPresets] : userPresets,
    [selectedFolderId, userPresets],
  );
  const folderOptions = useMemo(() => flattenFolderOptions(library.folders), [library.folders]);
  const allUserPresets = library.presets;
  // 表示中のフォルダーにあるPresetだけを選択扱いにする。削除・移動で消えたIDは自然に外れる。
  const selection = useMemo(() => new Set(userPresets.filter(preset => selectedIds.has(preset.id)).map(preset => preset.id)), [userPresets, selectedIds]);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const displayedError = error ?? (status === 'error' ? t('preset.loadFailed') : null);

  function setDisplayMode(nextMode: ViewMode) {
    setViewMode(nextMode);
    try { localStorage.setItem('kagaribi15_preset_view', nextMode); } catch { /* storage is optional */ }
  }

  function handleLoad(preset: Preset) {
    const s = preset.state;
    if (s.gradient) applicationCommands.setGradient(s.gradient);
    if (s.noiseDistortion) applicationCommands.setNoiseDistortion(normalizeNoiseDistortionConfig(s.noiseDistortion));
    // Always pass Diffuse through STORE_DEFAULTS so legacy presets receive
    // adaptiveEnabled=false and the identity luminance curve.
    const loadedDiffuse = {
      ...STORE_DEFAULTS.diffuse,
      ...(s.diffuse ?? {}),
      luminanceBezier: resolveDiffuseBezier(s.diffuse?.luminanceBezier, s.diffuse?.luminanceCurve),
    };
    delete loadedDiffuse.luminanceCurve;
    applicationCommands.setDiffuse(loadedDiffuse);
    applicationCommands.setImageGradient(normalizeImageGradientConfig(s.imageGradient, s.imageGradient ? 0 : STORE_DEFAULTS.imageGradient.anchorInfluence));
    if (s.slitScan) {
      const loadedSlit = {
        ...STORE_DEFAULTS.slitScan,
        ...stripSlitPhaseMotionFields(s.slitScan),
      };
      delete (loadedSlit as Record<string, unknown>).autoLoop;
      applicationCommands.setSlitScan(loadedSlit);
    }
    if (s.stretch) applicationCommands.setStretch(s.stretch);
    if (s.normalMap) applicationCommands.setNormalMap(s.normalMap);
    const loadedPostprocess = normalizePostprocessConfig(
      s.postprocess ?? s.postprocessDistort,
      s.manualDistort,
    );
    const legacyDistort = s.manualDistort ?? loadedPostprocess;
    const resolution = normalizeManualDistortResolution(legacyDistort.mapResolution);
    const displacementLength = resolution * resolution * 2;
    const smoothMaskLength = resolution * resolution;
    applicationCommands.setManualDistort({
      ...STORE_DEFAULTS.manualDistort,
      ...legacyDistort,
      enabled: false,
      mapResolution: resolution,
      displacement: validFiniteArray(legacyDistort.displacement, displacementLength) ? legacyDistort.displacement : createEmptyManualDistortMap(resolution),
      smoothMask: validFiniteArray(legacyDistort.smoothMask, smoothMaskLength) ? legacyDistort.smoothMask : createEmptyManualSmoothMask(resolution),
    });
    applicationCommands.setPostprocess(loadedPostprocess);
    // clothGradient が無い旧プリセットでも安全にデフォルトで初期化し、
    // SANDBOX の Cloth 設定を反映する。
    applicationCommands.setClothGradient(normalizeClothGradientConfig(s.clothGradient));
    applicationCommands.setConeView(normalizeConeViewConfig(s.coneView));
    applicationCommands.setSeamless(normalizeSeamlessConfig(s.seamless));
    applicationCommands.setTexture(normalizeTextureConfig(s.texture));
    applicationCommands.setShapes(normalizeShapesConfig(s.shapes));
    applicationCommands.setFlowGradient(normalizeFlowGradientConfig(s.flowGradient));
    // Presets saved before Datamosh migrate their Effect Stack Video Motion here.
    applicationCommands.setDatamosh(resolvePersistedDatamosh(s));
    // effectPipeline を持たない旧プリセット/内蔵プリセットは Legacy v1 に
    // ならないよう、既定の V2 パイプラインへ昇格する。V2 でなければ
    // SANDBOX Cloth は描画パイプラインへ一切統合されないため。
    applicationCommands.setEffectPipeline(s.effectPipeline
      ? normalizeEffectPipelineConfig(s.effectPipeline)
      : createDefaultEffectPipeline());
    applicationCommands.setKeyframeTracks(s.keyframeTracks ?? {});
    if (s.animation) applicationCommands.setAnimation({
      ...keepLoopTimingOnPresetLoad(s.animation, useGradientStore.getState().animation),
      rampOffsetSpeed: s.animation.rampOffsetSpeed ?? 0,
    });
    if (s.colorPalettes) mergeUserColorPalettes(s.colorPalettes);
    if (s.resolution) {
      const normalizeResolution = (value: number) => Number.isFinite(value) ? Math.max(1, Math.min(4096, Math.round(value))) : 1024;
      const presetWidth = normalizeResolution(s.resolution.width);
      const presetHeight = normalizeResolution(s.resolution.height);
      setCanvasW(presetWidth);
      setCanvasH(presetHeight);
      aspectRatioRef.current = presetWidth / presetHeight;
    }
    applicationCommands.setPresetName(preset.name);
    setSelectedPresetId(preset.id);
    onPresetLoad();
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch, animation, normalMap, clothGradient, coneView, seamless, texture, shapes, flowGradient, datamosh, manualDistort, postprocess, effectPipeline, keyframeTracks } = useGradientStore.getState();
    const state = createPresetSaveState({
      gradient, noiseDistortion, diffuse, imageGradient, slitScan, stretch,
      animation, normalMap, clothGradient, coneView, seamless, texture, shapes, flowGradient, datamosh,
      manualDistort, postprocess, effectPipeline,
      keyframeTracks,
    }, loadUserColorPalettes(), { width: canvasW, height: canvasH });
    setSaving(true);
    try {
      const thumbnail = await capturePresetThumbnail(state);
      const saved = await savePreset(trimmed, state, selectedFolderId, thumbnail);
      applicationCommands.setPresetName(trimmed);
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

  /** ドラッグしたPresetが複数選択に含まれていれば、選択中のPresetをまとめて移動する。 */
  function handleMovePreset(id: string, folderId: string | null) {
    return moveSelectionOrPreset(selection.has(id) ? [...selection] : [id], folderId);
  }

  async function moveSelectionOrPreset(ids: string[], folderId: string | null) {
    try {
      await movePresetsWithHistory(ids, folderId);
      setSelectedIds(new Set());
      setError(null);
    } catch (moveError) { setError(moveError instanceof Error ? moveError.message : t('preset.moveFailed')); }
  }

  async function handleDeleteSelected() {
    const ids = [...selection];
    if (ids.length === 0) return;
    try {
      await deletePresetsWithHistory(ids);
      setSelectedIds(new Set());
      setError(null);
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : t('preset.deleteFailed')); }
  }

  /** Shift+クリックは起点から押したカードまでの範囲選択、Ctrl/Cmd+クリックは1枚ずつの追加・解除、通常のクリックは選択を解いてPresetを適用する。 */
  function handleCardClick(preset: Preset, event: ReactMouseEvent<HTMLElement>) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      if (isBuiltinPresetId(preset.id)) return;
      if (event.shiftKey) {
        setSelectedIds(new Set(getPresetRangeIds(userPresets, anchorIdRef.current, preset.id)));
        // 起点は動かさず、Shiftクリックのたびに起点からの範囲を取り直す。起点が未設定なら押したカードを起点にする。
        if (anchorIdRef.current === null || !userPresets.some(item => item.id === anchorIdRef.current)) anchorIdRef.current = preset.id;
        return;
      }
      const next = new Set(selectionRef.current);
      if (next.has(preset.id)) next.delete(preset.id); else next.add(preset.id);
      setSelectedIds(next);
      anchorIdRef.current = preset.id;
      return;
    }
    if (selectionRef.current.size > 0) setSelectedIds(new Set());
    anchorIdRef.current = preset.id;
    handleLoad(preset);
  }

  /** 右クリックしたPresetが選択外なら、そのPresetだけを選択してメニューを開く。 */
  function handleCardContextMenu(preset: Preset, event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    if (isBuiltinPresetId(preset.id)) return;
    if (!selectionRef.current.has(preset.id)) { setSelectedIds(new Set([preset.id])); anchorIdRef.current = preset.id; }
    setMenu({ x: event.clientX, y: event.clientY });
  }

  // PresetCardをmemo化するため、最新のハンドラーをrefで参照する安定した関数を渡す。
  const handlersRef = useRef({ click: handleCardClick, contextMenu: handleCardContextMenu, removeSelected: handleDeleteSelected });
  handlersRef.current = { click: handleCardClick, contextMenu: handleCardContextMenu, removeSelected: handleDeleteSelected };
  const clickCardStable = useCallback((preset: Preset, event: ReactMouseEvent<HTMLElement>) => handlersRef.current.click(preset, event), []);
  const contextMenuCardStable = useCallback((preset: Preset, event: ReactMouseEvent<HTMLElement>) => handlersRef.current.contextMenu(preset, event), []);

  // 選択中は Delete で削除、Escape で選択解除。入力欄の編集中や、パネルが見えていないときは何もしない。
  const hasSelection = selection.size > 0;
  useEffect(() => {
    if (!hasSelection) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelectedIds(new Set()); return; }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (!listRef.current || listRef.current.getClientRects().length === 0) return;
      event.preventDefault();
      void handlersRef.current.removeSelected();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasSelection]);

  // GCコントローラー: スティックで候補を動かし、決定ボタンで読み込む。フォルダーはボタンで切り替える。
  // 関数は毎回作り直されるため、useGcInput側は最新の参照を呼ぶ。
  useGcInput((command: GcCommand) => {
    const showToast = (text: string) => {
      setCursorToast(text);
      window.clearTimeout(cursorToastTimer.current);
      cursorToastTimer.current = window.setTimeout(() => setCursorToast(null), 2000);
    };
    if (command.type === 'action' && (command.action === 'folderPrev' || command.action === 'folderNext' || command.action === 'folderRoot')) {
      // 先頭をライブラリのルートとして、フォルダーを階層の表示順に並べる。
      const order: (string | null)[] = [null, ...folderOptions.map(option => option.id)];
      const index = Math.max(order.indexOf(selectedFolderId), 0);
      const nextId = command.action === 'folderRoot'
        ? null
        : order[Math.min(Math.max(index + (command.action === 'folderNext' ? 1 : -1), 0), order.length - 1)];
      setSelectedFolderId(nextId);
      setCursorId(null);
      showToast(library.folders.find(folder => folder.id === nextId)?.name ?? t('preset.root'));
      return;
    }
    if (visiblePresets.length === 0) return;
    const cursorIndex = visiblePresets.findIndex(preset => preset.id === cursorId);
    if (command.type === 'move') {
      // 初回は読み込み中のPreset、無ければ先頭から動かす。
      const activeIndex = visiblePresets.findIndex(preset => preset.name === presetName);
      const from = cursorIndex >= 0 ? cursorIndex : Math.max(activeIndex, 0);
      // 列数は画面幅で変わるため、同じ行（上端が同じ位置）に並ぶカードの数から測る。
      const cards = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-preset-id]') ?? [])];
      const columns = viewMode === 'grid' && cards.length > 0 ? Math.max(cards.filter(card => card.offsetTop === cards[0].offsetTop).length, 1) : 1;
      const next = visiblePresets[moveListCursor(from, command.direction, visiblePresets.length, columns)];
      setCursorId(next.id);
      showToast(next.name);
      requestAnimationFrame(() => {
        listRef.current?.querySelector(`[data-preset-id="${CSS.escape(next.id)}"]`)?.scrollIntoView({ block: 'nearest' });
      });
    } else if (command.type === 'action' && command.action === 'presetConfirm' && cursorIndex >= 0) {
      handleLoad(visiblePresets[cursorIndex]);
      showToast(visiblePresets[cursorIndex].name);
    }
  });

  useEffect(() => () => window.clearTimeout(cursorToastTimer.current), []);

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

        <div className="shrink-0 border-b border-cream/10 pb-1">
          <FolderBreadcrumb path={folderPath} onSelect={setSelectedFolderId} onDropPreset={handleMovePreset} />
        </div>

        <main ref={listRef} onClick={event => { if (event.target === event.currentTarget) setSelectedIds(new Set()); }} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5 scrollbar-thin">
          {childFolders.length > 0 && <div className="grid gap-1.5" style={FOLDER_GRID_STYLE}>{childFolders.map(folder => <FolderCard key={folder.id} folder={folder} library={library} onOpen={() => setSelectedFolderId(folder.id)} onDropPreset={handleMovePreset} />)}</div>}

          {visiblePresets.length === 0 ? (
            <div className="border border-dashed border-cream/15 px-3 py-6 text-center text-[10px] italic text-tab-inactive">{t('preset.empty')}</div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-1.5' : 'space-y-1'} style={viewMode === 'grid' ? PRESET_GRID_STYLE : undefined}>
              {visiblePresets.map(preset => <PresetCard key={preset.id} preset={preset} isBuiltin={isBuiltinPresetId(preset.id)} isActive={presetName === preset.name} isSelected={selection.has(preset.id)} isCursor={cursorId === preset.id} viewMode={viewMode} onClick={clickCardStable} onContextMenu={contextMenuCardStable} />)}
            </div>
          )}
        </main>

      {displayedError && <p role="alert" className="shrink-0 border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[10px] text-red-300">{displayedError}</p>}

      <div className="max-h-[60%] shrink-0 space-y-2 overflow-y-auto bg-k-bg/95 backdrop-blur scrollbar-thin">
        <SidebarSection id="preset-folders" title={t('preset.folderTree')} open={folderOpen} onToggle={() => setFolderOpen(value => !value)}>
          <div className="border border-cream/10 bg-k-surface/45 p-1.5">
            <div className="max-h-36 overflow-y-auto pr-0.5 scrollbar-thin"><FolderTree folders={library.folders} selectedFolderId={selectedFolderId} onSelect={setSelectedFolderId} onDropPreset={(presetId, folderId) => void handleMovePreset(presetId, folderId)} /></div>
            <div className="mt-2 border-t border-cream/10 pt-2">
              <div className="flex gap-1">
                <input value={folderName} onChange={event => setFolderName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void handleCreateFolder(); }} placeholder={t('preset.newFolder')} className="min-w-0 flex-1 bg-k-bg px-1.5 py-1 text-[10px] text-k-text outline-none ring-1 ring-cream/10 focus:ring-fire/60" />
                <button type="button" onClick={() => void handleCreateFolder()} className="bg-fire/80 px-2 text-[13px] font-bold text-cream hover:bg-fire" aria-label={t('preset.createFolder')}>＋</button>
              </div>
              {currentFolder && <div className="mt-1 flex gap-1"><button type="button" onClick={() => void handleRenameFolder()} className="flex-1 px-1 py-1 text-[9px] text-tab-inactive hover:bg-k-surface hover:text-k-text">{t('preset.renameFolder')}</button><button type="button" onClick={() => void handleDeleteFolder()} className="flex-1 px-1 py-1 text-[9px] text-red-400 hover:bg-red-400/10">{t('common.delete')}</button></div>}
            </div>
          </div>
        </SidebarSection>

        <div className="flex gap-1.5">
          <input type="text" value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void handleSave(); }} placeholder={t('preset.saveTo', { name: selectedFolderLabel })} className="min-w-0 flex-1 bg-k-surface px-2 py-1.5 text-[10px] text-k-text outline-none ring-1 ring-cream/15 focus:ring-fire/70" />
          <button type="button" onClick={() => void handleSave()} disabled={!name.trim() || saving} className="shrink-0 bg-fire px-2.5 py-1 text-[10px] font-bold text-cream transition-opacity disabled:opacity-40">{saving ? t('common.saving') : t('common.save')}</button>
          <IconButton icon="upload" label={t('preset.importTo', { name: selectedFolderLabel })} onClick={() => importRef.current?.click()} className="shrink-0 border-cream/15 bg-k-surface/70 px-2 hover:border-fire/50" />
          <input ref={importRef} type="file" accept=".json,.zip,.kggpresets" className="hidden" onChange={handleImport} />
        </div>

        <SidebarSection id="preset-export" title={t('preset.exportSection')} open={exportOpen} onToggle={() => setExportOpen(value => !value)} nested>
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-[10px] text-deep">{t('preset.exportScope')}</p>
              <InputRadio
                value={exportScope}
                options={EXPORT_SCOPES}
                labels={[t('preset.scopePreset'), t('preset.scopeFolder'), t('preset.scopeLibrary')]}
                onChange={scope => scope !== undefined && setExportScope(scope)}
                aria-label={t('preset.exportScope')}
                className="w-full"
              />
            </div>
            {exportScope === 'preset' && <select aria-label={t('preset.select')} value={selectedPresetId ?? ''} onChange={event => setSelectedPresetId(event.target.value || null)} className="w-full bg-k-surface px-2 py-1.5 text-[10px] text-k-text outline-none"><option value="">{t('preset.select')}</option>{allUserPresets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select>}
            {exportScope === 'folder' && <p className="truncate text-[10px] text-tab-inactive">{t(currentFolder ? 'preset.exportFolderTarget' : 'preset.exportRootTarget', { name: selectedFolderLabel })}</p>}
            <button type="button" onClick={() => void handleExport()} className="w-full bg-k-muted px-2 py-1.5 text-[10px] text-k-text hover:bg-k-muted/70">{t('common.export')}</button>
          </div>
        </SidebarSection>
      </div>
      {menu && hasSelection && (
        <PresetContextMenu
          x={menu.x}
          y={menu.y}
          count={selection.size}
          name={userPresets.find(preset => selection.has(preset.id))?.name ?? ''}
          folders={folderOptions}
          currentFolderId={selectedFolderId}
          onMove={folderId => { closeMenu(); void moveSelectionOrPreset([...selection], folderId); }}
          onDelete={() => { closeMenu(); void handleDeleteSelected(); }}
          onClose={closeMenu}
        />
      )}
      {cursorToast && <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-50 max-w-[60vw] -translate-x-1/2 truncate border border-cream/40 bg-deep/90 px-3 py-1.5 text-[12px] font-semibold text-cream shadow-lg">{cursorToast}</div>}
    </div>
  );
}
