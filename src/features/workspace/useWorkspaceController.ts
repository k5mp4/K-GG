import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { gsap } from 'gsap';
import { AnimationLoop } from '../../lib/animation';
import { useGradientStore } from '../../store/gradientStore';
import { useViewportControl } from '../../hooks/useViewportControl';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { applicationCommands } from '../../application/commands';
import type { GpuDiagnostics } from '../../lib/gpuDiagnostics';
import type { ExportStage, VideoExportFrameRenderer } from '../../adapters';
import { adapters } from '../../adapters';
import type { StoreSnapshot as PresetStoreSnapshot } from '../../lib/presetModel';
import type { KggControlProjectAdapter, KggControlUiAdapter } from '../../lib/kggControlRuntime';
import { hasEnabledPostprocessEffectStack } from '../../lib/effectPipeline';
import type { EffectStackKind } from '../../types/distortion';
import type { RenderViewMode } from '../../types/renderView';
import type { OverlayImageMode } from '../../types/workspace';
import type { MessageKey } from '../../i18n/messages';
import type { Replacements } from '../../i18n/language';
import { useAppUpdater } from '../updater/useAppUpdater';
import { useNativeFfmpeg } from '../native/useNativeFfmpeg';
import { LEFT_TABS, type LeftTab } from './tabs';
import type { CanvasWorkspaceProps } from './CanvasWorkspace';

const MAX_DISPLAY_W = 1000;

export const CANVAS_SIZE_PRESETS = [
  { value: 'full-hd', label: 'Full HD', width: 1920, height: 1080 },
  { value: 'hd', label: 'HD', width: 1280, height: 720 },
  { value: 'square-400', label: '400×400', width: 400, height: 400 },
  { value: 'square-800', label: '800×800', width: 800, height: 800 },
] as const;

type StoreSnapshot = ReturnType<typeof useGradientStore.getState>;
type AppStoreState = Pick<StoreSnapshot, 'diffuse' | 'noiseDistortion' | 'slitScan' | 'normalMap' | 'effectPipeline' | 'seamless' | 'postprocess'>;

const TAB_ENABLED_MAP: Partial<Record<LeftTab, (state: AppStoreState) => boolean>> = {
  diffuse: state => state.diffuse.enabled,
  noise: state => state.noiseDistortion.enabled,
  slit: state => state.slitScan.enabled,
  sandbox: state => state.normalMap.enabled || state.effectPipeline.prismEnabled || state.effectPipeline.particlesEnabled || state.seamless.enabled,
  postprocess: state => state.postprocess.enabled || hasEnabledPostprocessEffectStack(state.effectPipeline),
};

const EFFECT_STACK_TAB_MAP: Partial<Record<EffectStackKind, LeftTab>> = {
  diffuse: 'diffuse',
  noise: 'noise',
  slit: 'slit',
};

function formatGpuBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)}GB`;
}

export function gpuSummary(diag: GpuDiagnostics | null): { label: string; title: string } {
  if (!diag) return { label: 'GPU: detecting...', title: 'GPU diagnostics will appear after WebGL starts.' };

  const nativeAdapter = diag.native?.adapters[0];
  const renderer = nativeAdapter?.name || diag.webgl.unmaskedRenderer || diag.webgl.renderer || 'Unknown GPU';
  const shortRenderer = renderer
    .replace(/\(R\)|\(TM\)|Graphics|GPU|Direct3D11 vs_5_0 ps_5_0/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const vram = formatGpuBytes(nativeAdapter?.adapter_ram);
  const label = `GPU: ${shortRenderer || 'Unknown'} / ${diag.optimization.tier.toUpperCase()}`;
  const title = [
    `Renderer: ${renderer}`,
    vram ? `VRAM: ${vram}` : null,
    nativeAdapter?.driver_version ? `Driver: ${nativeAdapter.driver_version}` : null,
    `WebGL: ${diag.webgl.maxTextureSize}px texture, ${diag.webgl.maxRenderbufferSize}px renderbuffer`,
    `Optimization: ${diag.optimization.tier} (${diag.optimization.reasons.join(', ')})`,
  ].filter(Boolean).join('\n');

  return { label, title };
}

type WorkspaceControllerOptions = {
  translate: (key: MessageKey, replacements?: Replacements) => string;
};

export function useWorkspaceController({ translate }: WorkspaceControllerOptions) {
  const store = useGradientStore(useShallow(state => ({
    matcap: state.matcap,
    animation: state.animation,
    clothGradient: state.clothGradient,
    coneView: state.coneView,
    noiseDistortion: state.noiseDistortion,
    postprocess: state.postprocess,
    effectPipeline: state.effectPipeline,
    slitScan: state.slitScan,
    stretch: state.stretch,
    diffuse: state.diffuse,
    normalMap: state.normalMap,
    seamless: state.seamless,
  })));
  const updater = useAppUpdater();
  const {
    matcap,
    animation,
    clothGradient,
    coneView,
    noiseDistortion,
    postprocess,
    effectPipeline,
    slitScan,
    stretch,
  } = store;

  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPropertyModulesSettings, setShowPropertyModulesSettings] = useState(false);
  const [showGradientAnchors, setShowGradientAnchors] = useState(true);
  const [renderViewMode, setRenderViewMode] = useState<RenderViewMode>('canvas');
  const [clothReady, setClothReady] = useState(false);
  const [clothUnavailable, setClothUnavailable] = useState(false);
  const [coneReady, setConeReady] = useState(false);
  const [coneUnavailable, setConeUnavailable] = useState(false);
  const [gpuDiagnostics, setGpuDiagnostics] = useState<GpuDiagnostics | null>(() => (
    typeof window === 'undefined' ? null : window.__KAGARIBI_GPU_DIAGNOSTICS__ ?? null
  ));
  const animLoopRef = useRef<AnimationLoop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clothCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const clothExportFrameRendererRef = useRef<VideoExportFrameRenderer | null>(null);
  const coneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coneExportFrameRendererRef = useRef<VideoExportFrameRenderer | null>(null);
  const [seekVersion, setSeekVersion] = useState(0);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportStage, setExportStage] = useState<ExportStage>('preparing');
  const [slitSourceImageCanvas, setSlitSourceImageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [slitSourceImageName, setSlitSourceImageName] = useState('');
  const [imageGradientSource, setImageGradientSource] = useState<HTMLCanvasElement | null>(null);
  const [imageGradientSourceName, setImageGradientSourceName] = useState('');

  const {
    canvasW, setCanvasW,
    canvasH, setCanvasH,
    lockAspect, setLockAspect,
    aspectRatioRef,
    wInputRef, hInputRef,
    wDraft, setWDraft,
    hDraft, setHDraft,
  } = useCanvasSize();

  const clampRes = (value: number) => Math.max(1, Math.min(15000, value));
  const cancelResRef = useRef(false);

  function commitW() {
    if (cancelResRef.current) { cancelResRef.current = false; return; }
    const value = clampRes(Number(wDraft) || canvasW);
    setCanvasW(value);
    if (lockAspect) {
      setCanvasH(clampRes(Math.round(value / aspectRatioRef.current)));
    } else {
      aspectRatioRef.current = value / canvasH;
    }
  }

  function commitH() {
    if (cancelResRef.current) { cancelResRef.current = false; return; }
    const value = clampRes(Number(hDraft) || canvasH);
    setCanvasH(value);
    if (lockAspect) {
      setCanvasW(clampRes(Math.round(value * aspectRatioRef.current)));
    } else {
      aspectRatioRef.current = canvasW / value;
    }
  }

  const activeCanvasPreset = CANVAS_SIZE_PRESETS.find(preset => preset.width === canvasW && preset.height === canvasH);
  const canvasPresetValue = activeCanvasPreset?.value ?? 'custom';

  function applyCanvasPreset(value: string) {
    const preset = CANVAS_SIZE_PRESETS.find(candidate => candidate.value === value);
    if (!preset) return;
    setCanvasW(preset.width);
    setCanvasH(preset.height);
    aspectRatioRef.current = preset.width / preset.height;
  }

  function swapCanvasSize() {
    const nextW = canvasH;
    const nextH = canvasW;
    setCanvasW(nextW);
    setCanvasH(nextH);
    setWDraft(String(nextW));
    setHDraft(String(nextH));
    aspectRatioRef.current = nextW / nextH;
  }

  const prevSizeRef = useRef<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (matcap.enabled) {
      prevSizeRef.current = { w: canvasW, h: canvasH };
      setCanvasW(1024);
      setCanvasH(1024);
      aspectRatioRef.current = 1;
    } else if (prevSizeRef.current) {
      const { w, h } = prevSizeRef.current;
      setCanvasW(w);
      setCanvasH(h);
      aspectRatioRef.current = w / h;
      prevSizeRef.current = null;
    }
  }, [matcap.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    viewportRef,
    zoom, pan,
    gestureFeedbacks,
    handleMiddleDown, handleMiddleMove, handleMiddleUp, handleMiddleLeave,
    resetViewport, setViewport, cursor,
  } = useViewportControl();

  useKeyboardShortcuts();

  useEffect(() => {
    const handleGpuDiagnostics = (event: WindowEventMap['kagaribi:gpu-diagnostics']) => {
      setGpuDiagnostics(event.detail);
    };
    window.addEventListener('kagaribi:gpu-diagnostics', handleGpuDiagnostics);
    if (window.__KAGARIBI_GPU_DIAGNOSTICS__) setGpuDiagnostics(window.__KAGARIBI_GPU_DIAGNOSTICS__);
    return () => window.removeEventListener('kagaribi:gpu-diagnostics', handleGpuDiagnostics);
  }, []);

  const [leftTab, setLeftTab] = useState<LeftTab>('diffuse');
  const activeLeftTabRef = useRef<LeftTab>('diffuse');
  const {
    ffmpegStatus,
    ffmpegChecking,
    ffmpegDialogOpen,
    refreshFfmpegStatus,
    closeFfmpegDialog,
    handleOpenBuildsPage,
    handleOpenFolder,
  } = useNativeFfmpeg(() => activeLeftTabRef.current === 'export');
  const [tabHoverSwitchEnabled, setTabHoverSwitchEnabled] = useState(true);
  const [isHoverLocked, setIsHoverLocked] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTimeRemap, setShowTimeRemap] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(300);
  const timelineResizingRef = useRef(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [showGradientRamp, setShowGradientRamp] = useState(true);
  const [showOverlaySettings, setShowOverlaySettings] = useState(false);
  const [showImageGradientSource, setShowImageGradientSource] = useState(false);

  const handleEffectStackSelection = (kind: EffectStackKind) => {
    const nextTab = EFFECT_STACK_TAB_MAP[kind] ?? 'postprocess';
    if (kind === 'distort') applicationCommands.setPostprocess({ effectMode: 'distort' });
    activeLeftTabRef.current = nextTab;
    setLeftTab(nextTab);
    setLeftPanelOpen(true);
  };

  useEffect(() => {
    if (animation.enabled && (noiseDistortion.enabled || slitScan.animEnabled || stretch.enabled)) {
      const id = setTimeout(() => setShowTimeline(true), 180);
      return () => clearTimeout(id);
    }
  }, [animation.enabled, noiseDistortion.enabled, slitScan.animEnabled, stretch.enabled]);

  const hoverLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const handleTabClick = (value: LeftTab) => {
    activeLeftTabRef.current = value;
    setLeftTab(value);
    setLeftPanelOpen(true);
    if (window.matchMedia('(max-width: 767px)').matches) setShowLeftSidebar(true);
    if (value === 'export') void refreshFfmpegStatus(true);
    if (!tabHoverSwitchEnabled) return;
    setIsHoverLocked(true);
    if (hoverLockTimerRef.current) clearTimeout(hoverLockTimerRef.current);
    hoverLockTimerRef.current = setTimeout(() => {
      setIsHoverLocked(false);
      hoverLockTimerRef.current = null;
    }, 2000);
  };

  const handleTabMouseEnter = (value: LeftTab) => {
    if (tabHoverSwitchEnabled && !isHoverLocked) {
      activeLeftTabRef.current = value;
      setLeftTab(value);
    }
  };

  const setTabHoverSwitchMode = (enabled: boolean) => {
    setTabHoverSwitchEnabled(enabled);
    if (!enabled) {
      if (hoverLockTimerRef.current) clearTimeout(hoverLockTimerRef.current);
      hoverLockTimerRef.current = null;
      setIsHoverLocked(false);
    }
  };

  useEffect(() => () => {
    if (hoverLockTimerRef.current) clearTimeout(hoverLockTimerRef.current);
  }, []);

  const panelsContainerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!panelsContainerRef.current) return;
    const index = LEFT_TABS.findIndex(tab => tab.value === leftTab);
    gsap.to(panelsContainerRef.current, { x: `-${index * 100}%`, duration: 0.9, ease: 'expo.out' });
  }, [leftTab]);

  const [overlayImageSrc, setOverlayImageSrc] = useState<string | null>(null);
  const [overlayImageName, setOverlayImageName] = useState('');
  const [overlayImageElement, setOverlayImageElement] = useState<HTMLImageElement | null>(null);
  const [overlayImageMode, setOverlayImageMode] = useState<OverlayImageMode>('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const overlayImageInputRef = useRef<HTMLInputElement>(null);
  const overlayImageLoadIdRef = useRef(0);

  const handleOverlayImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    document.body.style.cursor = '';
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const loadId = overlayImageLoadIdRef.current + 1;
    overlayImageLoadIdRef.current = loadId;
    const image = new Image();
    image.onload = () => {
      if (overlayImageLoadIdRef.current === loadId) setOverlayImageElement(image);
    };
    image.onerror = () => {
      if (overlayImageLoadIdRef.current === loadId) setOverlayImageElement(null);
    };
    image.src = url;
    setOverlayImageSrc(previous => { if (previous) URL.revokeObjectURL(previous); return url; });
    setOverlayImageName(file.name);
    event.target.value = '';
  };

  const clearOverlayImage = () => {
    overlayImageLoadIdRef.current += 1;
    if (overlayImageSrc) URL.revokeObjectURL(overlayImageSrc);
    setOverlayImageSrc(null);
    setOverlayImageName('');
    setOverlayImageElement(null);
  };

  const [leftPanelW, setLeftPanelW] = useState(288);
  const [rightPanelW, setRightPanelW] = useState(320);
  const [activeResizeSide, setActiveResizeSide] = useState<'left' | 'right' | null>(null);
  const resizingRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (resizingRef.current === 'left') setLeftPanelW(Math.max(240, Math.min(520, event.clientX)));
      if (resizingRef.current === 'right') setRightPanelW(Math.max(240, Math.min(600, window.innerWidth - event.clientX)));
      if (timelineResizingRef.current) setTimelineHeight(Math.max(100, Math.min(window.innerHeight * 0.8, window.innerHeight - event.clientY)));
    };
    const onUp = () => {
      resizingRef.current = null;
      setActiveResizeSide(null);
      timelineResizingRef.current = false;
      document.body.style.cursor = '';
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    window.addEventListener('blur', onUp);
    document.addEventListener('visibilitychange', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onUp);
      document.removeEventListener('visibilitychange', onUp);
    };
  }, []);

  const handlePanelResizeStart = (side: 'left' | 'right', event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingRef.current = side;
    setActiveResizeSide(side);
    document.body.style.cursor = 'col-resize';
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleTimelineResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    timelineResizingRef.current = true;
    document.body.style.cursor = 'row-resize';
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setViewportSize({ w: width, h: height });
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [viewportRef]);

  const availableW = viewportSize.w > 0 ? viewportSize.w - 48 : MAX_DISPLAY_W;
  const availableH = viewportSize.h > 0 ? viewportSize.h - 48 : 9999;
  const fitByW = Math.min(canvasW, MAX_DISPLAY_W, availableW);
  const fitHByW = Math.round(fitByW * (canvasH / canvasW));
  const displayW = fitHByW <= availableH ? fitByW : Math.round(availableH * (canvasW / canvasH));
  const displayH = Math.round(displayW * (canvasH / canvasW));
  const gpuInfo = gpuSummary(gpuDiagnostics);

  const kggUiAdapterRef = useRef<KggControlUiAdapter | null>(null);
  if (!kggUiAdapterRef.current) kggUiAdapterRef.current = { getState: () => ({}), setState: () => undefined };
  const kggUiAdapter = kggUiAdapterRef.current;
  kggUiAdapter.getState = () => ({
    canvasW,
    canvasH,
    lockAspect,
    renderViewMode,
    leftTab,
    tabHoverSwitchEnabled,
    isHoverLocked,
    showTimeline,
    showTimeRemap,
    timelineHeight,
    leftPanelOpen,
    rightPanelOpen,
    showLeftSidebar,
    showRightSidebar,
    showGradientRamp,
    showOverlaySettings,
    showImageGradientSource,
    showGradientAnchors,
    overlayImageMode,
    overlayOpacity,
    leftPanelW,
    rightPanelW,
    showHelp,
    showFeedback,
    showPropertyModulesSettings,
    zoom,
    pan,
  });
  kggUiAdapter.setState = patch => {
    let nextW = canvasW;
    let nextH = canvasH;
    if (typeof patch.canvasW === 'number') { nextW = patch.canvasW; setCanvasW(nextW); setWDraft(String(nextW)); }
    if (typeof patch.canvasH === 'number') { nextH = patch.canvasH; setCanvasH(nextH); setHDraft(String(nextH)); }
    if (patch.canvasW !== undefined || patch.canvasH !== undefined) aspectRatioRef.current = nextW / nextH;
    if (typeof patch.lockAspect === 'boolean') setLockAspect(patch.lockAspect);
    if (patch.renderViewMode === 'canvas' || patch.renderViewMode === 'cloth' || patch.renderViewMode === 'cone') setRenderViewMode(patch.renderViewMode);
    if (typeof patch.leftTab === 'string') { activeLeftTabRef.current = patch.leftTab as LeftTab; setLeftTab(patch.leftTab as LeftTab); }
    if (typeof patch.tabHoverSwitchEnabled === 'boolean') setTabHoverSwitchMode(patch.tabHoverSwitchEnabled);
    if (typeof patch.isHoverLocked === 'boolean') setIsHoverLocked(patch.isHoverLocked);
    if (typeof patch.showTimeline === 'boolean') setShowTimeline(patch.showTimeline);
    if (typeof patch.showTimeRemap === 'boolean') setShowTimeRemap(patch.showTimeRemap);
    if (typeof patch.timelineHeight === 'number') setTimelineHeight(patch.timelineHeight);
    if (typeof patch.leftPanelOpen === 'boolean') setLeftPanelOpen(patch.leftPanelOpen);
    if (typeof patch.rightPanelOpen === 'boolean') setRightPanelOpen(patch.rightPanelOpen);
    if (typeof patch.showLeftSidebar === 'boolean') setShowLeftSidebar(patch.showLeftSidebar);
    if (typeof patch.showRightSidebar === 'boolean') setShowRightSidebar(patch.showRightSidebar);
    if (typeof patch.showGradientRamp === 'boolean') setShowGradientRamp(patch.showGradientRamp);
    if (typeof patch.showOverlaySettings === 'boolean') setShowOverlaySettings(patch.showOverlaySettings);
    if (typeof patch.showImageGradientSource === 'boolean') setShowImageGradientSource(patch.showImageGradientSource);
    if (typeof patch.showGradientAnchors === 'boolean') setShowGradientAnchors(patch.showGradientAnchors);
    if (patch.overlayImageMode === 'overlay' || patch.overlayImageMode === 'mask' || patch.overlayImageMode === 'off') setOverlayImageMode(patch.overlayImageMode);
    if (typeof patch.overlayOpacity === 'number') setOverlayOpacity(patch.overlayOpacity);
    if (typeof patch.leftPanelW === 'number') setLeftPanelW(patch.leftPanelW);
    if (typeof patch.rightPanelW === 'number') setRightPanelW(patch.rightPanelW);
    if (typeof patch.showHelp === 'boolean') setShowHelp(patch.showHelp);
    if (typeof patch.showFeedback === 'boolean') setShowFeedback(patch.showFeedback);
    if (typeof patch.showPropertyModulesSettings === 'boolean') setShowPropertyModulesSettings(patch.showPropertyModulesSettings);
    const nextZoom = typeof patch.zoom === 'number' ? patch.zoom : zoom;
    const nextPan = patch.pan && typeof patch.pan === 'object' && !Array.isArray(patch.pan)
      ? { x: typeof (patch.pan as { x?: unknown }).x === 'number' ? (patch.pan as { x: number }).x : pan.x, y: typeof (patch.pan as { y?: unknown }).y === 'number' ? (patch.pan as { y: number }).y : pan.y }
      : pan;
    if (patch.zoom !== undefined || patch.pan !== undefined) setViewport(nextZoom, nextPan);
  };
  kggUiAdapter.resetViewport = resetViewport;
  kggUiAdapter.requestApproval = ({ operationId, input }) => {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') return false;
    return window.confirm(`K-GG MCPから「${operationId}」を実行します。\n\n${JSON.stringify(input).slice(0, 600)}`);
  };

  const kggProjectAdapterRef = useRef<KggControlProjectAdapter | null>(null);
  if (!kggProjectAdapterRef.current) kggProjectAdapterRef.current = {};
  const kggProjectAdapter = kggProjectAdapterRef.current;
  kggProjectAdapter.listPresets = () => adapters.presetRepository.loadPresetLibrary();
  kggProjectAdapter.getPreset = async presetId => {
    const library = await adapters.presetRepository.loadPresetLibrary();
    return library.presets.find(preset => preset.id === presetId) ?? null;
  };
  kggProjectAdapter.savePreset = (name, state, folderId, thumbnail) => adapters.presetRepository.savePreset(name, state as PresetStoreSnapshot, folderId, thumbnail);
  kggProjectAdapter.deletePreset = presetId => adapters.presetRepository.deletePreset(presetId);
  kggProjectAdapter.exportPresetPackage = scope => {
    if (scope.kind === 'library') return adapters.presetRepository.exportPresetPackage({ kind: 'library' });
    if (!scope.id) throw new Error('An id is required for this export scope');
    if (scope.kind === 'preset') return adapters.presetRepository.exportPresetPackage({ kind: 'preset', presetId: scope.id });
    return adapters.presetRepository.exportPresetPackage({ kind: 'folder', folderId: scope.id });
  };
  kggProjectAdapter.listPalettes = () => adapters.colorPaletteRepository.loadUserColorPalettes();
  kggProjectAdapter.getPalette = async paletteId => {
    const palettes = await adapters.colorPaletteRepository.loadUserColorPalettes();
    return palettes.find(palette => palette.id === paletteId) ?? null;
  };
  kggProjectAdapter.savePalette = (name, stops) => adapters.colorPaletteRepository.saveUserColorPalette(name, stops);
  kggProjectAdapter.deletePalette = paletteId => adapters.colorPaletteRepository.deleteUserColorPalette(paletteId);

  const handleRenderViewModeChange = (mode: RenderViewMode) => {
    setClothUnavailable(false);
    setClothReady(false);
    setConeUnavailable(false);
    setConeReady(false);
    setRenderViewMode(mode);
  };
  const handlePresetLoad = () => {
    setClothReady(false);
    setConeReady(false);
    setClothUnavailable(false);
    setConeUnavailable(false);
    setRenderViewMode('canvas');
  };
  const handleCanvasResize = (width: number, height: number) => {
    setCanvasW(width);
    setCanvasH(height);
    aspectRatioRef.current = width / height;
  };
  const handleOpenLeftSidebar = () => {
    setLeftPanelOpen(true);
    setShowLeftSidebar(true);
  };
  const handleToggleRightSidebar = () => {
    setRightPanelOpen(true);
    setShowRightSidebar(value => !value);
  };
  const handleClothUnavailable = () => {
    setClothReady(false);
    setClothUnavailable(true);
    setRenderViewMode('canvas');
  };
  const handleConeUnavailable = () => {
    setConeReady(false);
    setConeUnavailable(true);
    setRenderViewMode('canvas');
  };

  const getTabEnabled = (value: LeftTab) => TAB_ENABLED_MAP[value]?.(store) ?? false;
  const canvasWorkspaceProps: CanvasWorkspaceProps = {
    viewport: {
      viewportRef,
      cursor,
      gestureFeedbacks,
      onMouseDown: handleMiddleDown,
      onMouseMove: handleMiddleMove,
      onMouseUp: handleMiddleUp,
      onMouseLeave: handleMiddleLeave,
      displayW,
      displayH,
      zoom,
      pan,
      canvasW,
      canvasH,
    },
    chrome: {
      showLeftSidebar,
      showRightSidebar,
      onOpenLeftSidebar: handleOpenLeftSidebar,
      showFeedback: () => setShowFeedback(true),
      showGradientAnchors,
      onToggleGradientAnchors: () => setShowGradientAnchors(value => !value),
      onResetViewport: resetViewport,
      showTimeRemap,
      exportProgress,
      onCloseTimeRemap: () => setShowTimeRemap(false),
    },
    view: {
      renderViewMode,
      clothReady,
      coneReady,
      clothUnavailable,
      coneUnavailable,
      clothGradient,
      coneView,
      postprocess,
      effectPipeline,
      leftTab,
    },
    overlays: {
      overlayImageSrc,
      overlayImageElement,
      overlayImageMode,
      overlayOpacity,
      slitSourceImageCanvas,
      imageGradientSource,
    },
    resources: {
      animLoopRef,
      seekVersion,
      canvasRef,
      clothCanvasRef,
      coneCanvasRef,
      clothExportFrameRendererRef,
      coneExportFrameRendererRef,
    },
    controls: {
      controlUi: kggUiAdapter,
      controlProject: kggProjectAdapter,
      setManualDistort: applicationCommands.setPostprocess,
      onSelectEffectStack: handleEffectStackSelection,
      onClothReady: () => setClothReady(true),
      onClothUnavailable: handleClothUnavailable,
      onConeReady: () => setConeReady(true),
      onConeUnavailable: handleConeUnavailable,
    },
    translate,
  };

  return {
    updater,
    animation,
    clothGradient,
    coneView,
    postprocess,
    effectPipeline,
    canvasSizePresets: CANVAS_SIZE_PRESETS,
    activeCanvasPreset,
    canvasPresetValue,
    applyCanvasPreset,
    swapCanvasSize,
    commitW,
    commitH,
    canvasW,
    setCanvasW,
    canvasH,
    setCanvasH,
    lockAspect,
    setLockAspect,
    aspectRatioRef,
    wInputRef,
    hInputRef,
    wDraft,
    setWDraft,
    hDraft,
    setHDraft,
    cancelResRef,
    leftTab,
    setLeftTab,
    tabHoverSwitchEnabled,
    setTabHoverSwitchMode,
    isHoverLocked,
    showTimeline,
    setShowTimeline,
    showTimeRemap,
    setShowTimeRemap,
    timelineHeight,
    setTimelineHeight,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    showGradientRamp,
    setShowGradientRamp,
    showOverlaySettings,
    setShowOverlaySettings,
    showImageGradientSource,
    setShowImageGradientSource,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    showHelp,
    setShowHelp,
    showFeedback,
    setShowFeedback,
    showPropertyModulesSettings,
    setShowPropertyModulesSettings,
    showGradientAnchors,
    setShowGradientAnchors,
    renderViewMode,
    setRenderViewMode,
    clothReady,
    setClothReady,
    clothUnavailable,
    setClothUnavailable,
    coneReady,
    setConeReady,
    coneUnavailable,
    setConeUnavailable,
    leftPanelW,
    setLeftPanelW,
    rightPanelW,
    setRightPanelW,
    activeResizeSide,
    setActiveResizeSide,
    overlayImageSrc,
    overlayImageName,
    overlayImageElement,
    overlayImageMode,
    setOverlayImageMode,
    overlayOpacity,
    setOverlayOpacity,
    overlayImageInputRef,
    handleOverlayImageChange,
    clearOverlayImage,
    canvasRef,
    clothCanvasRef,
    clothExportFrameRendererRef,
    coneCanvasRef,
    coneExportFrameRendererRef,
    slitSourceImageCanvas,
    slitSourceImageName,
    imageGradientSource,
    imageGradientSourceName,
    ffmpegStatus,
    ffmpegChecking,
    ffmpegDialogOpen,
    refreshFfmpegStatus,
    closeFfmpegDialog,
    handleOpenBuildsPage,
    handleOpenFolder,
    gpuInfo,
    animLoopRef,
    seekVersion,
    setSeekVersion,
    exportProgress,
    setExportProgress,
    exportStage,
    setExportStage,
    panelsContainerRef,
    viewportRef,
    resizingRef,
    timelineResizingRef,
    canvasWorkspaceProps,
    getTabEnabled,
    handleTabClick,
    handleTabMouseEnter,
    handleEffectStackSelection,
    handlePanelResizeStart,
    handleTimelineResizeStart,
    handleRenderViewModeChange,
    handlePresetLoad,
    handleCanvasResize,
    handleOpenLeftSidebar,
    handleToggleRightSidebar,
    handleSlitSourceImageLoad: (canvas: HTMLCanvasElement, name: string) => {
      setSlitSourceImageCanvas(canvas);
      setSlitSourceImageName(name);
    },
    handleSlitSourceImageClear: () => {
      setSlitSourceImageCanvas(null);
      setSlitSourceImageName('');
    },
    handleImageGradientSourceLoad: (canvas: HTMLCanvasElement, name: string) => {
      setImageGradientSource(canvas);
      setImageGradientSourceName(name);
    },
    handleImageGradientSourceClear: () => {
      setImageGradientSource(null);
      setImageGradientSourceName('');
      applicationCommands.setImageGradient({ enabled: false });
    },
    handleSeek: () => setSeekVersion(value => value + 1),
    handleTimelineToggle: () => setShowTimeline(value => !value),
    handleTimeRemapToggle: () => setShowTimeRemap(value => !value),
    handleCloseTimeRemap: () => setShowTimeRemap(false),
    handleShowHelp: () => setShowHelp(true),
    handleShowFeedback: () => setShowFeedback(true),
  };
}
