import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './App.css';
import { gsap } from 'gsap';
import { GradientCanvas } from './components/GradientCanvas';
import { ClothCanvas } from './components/ClothCanvas';
import { ConeCanvas } from './components/ConeCanvas';
import { ConeApexEditor } from './components/ConeApexEditor';
import { GradientAnchorEditor } from './components/GradientAnchorEditor';
import { TimelineBar } from './components/TimelineBar';
import { BezierEasingEditor } from './components/BezierEasingEditor';
import { AnimationLoop } from './lib/animation';
import { NoiseDistortionPanel } from './components/NoiseDistortionPanel';
import { DiffusePanel } from './components/BlockNoisePanel';
import { ExportPanel } from './components/ExportPanel';
import { SlitScanPanel } from './components/SlitScanPanel';
import { PresetPanel } from './components/PresetPanel';
import { SandboxPanel } from './components/SandboxPanel';
import { PostprocessPanel } from './components/PostprocessPanel';
import { EffectStackWorkspace } from './components/EffectStackWorkspace';
import { DistortOverlay } from './components/DistortOverlay';
import { PostprocessOverlay } from './components/PostprocessOverlay';
import { GradientRamp } from './components/GradientRamp';
import { ImageGradientSourcePanel } from './components/ImageGradientSourcePanel';
import { SliderField } from './components/SliderField';
import { useGradientStore } from './store/gradientStore';
import type { RenderViewMode } from './types/renderView';
import { useViewportControl } from './hooks/useViewportControl';
import { useCanvasSize } from './hooks/useCanvasSize';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { HelpPanel } from './components/HelpPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { PropertyModulesSettingsPanel } from './components/PropertyModulesSettingsPanel';
import { InteractionSettingsProvider } from './components/InteractionSettingsContext';
import { Collapsible } from './components/Collapsible';
import { SlitOverlay } from './components/SlitOverlay';
import { DockPanel } from './components/DockPanel';
import { PanelEdgeToggle } from './components/PanelEdgeToggle';
import { SidebarSection } from './components/SidebarSection';
import { Icon } from './components/Icon';
import { IconButton } from './components/IconButton';
import { useLanguage } from './i18n/LanguageProvider';
import type { MessageKey } from './i18n/messages';
import { undo, redo } from './lib/history';
import type { GpuDiagnostics } from './lib/gpuDiagnostics';
import type { EffectStackKind } from './types/distortion';
import { useAppUpdater } from './features/updater/useAppUpdater';
import { UpdateButton } from './features/updater/UpdateButton';
import { UpdateDialog } from './features/updater/UpdateDialog';
import { FfmpegSetupDialog } from './components/FfmpegSetupDialog';
import { isPostprocessLayerEnabled } from './lib/postprocessStack';
import { hasEnabledPostprocessEffectStack, isEffectStackLayerEnabled } from './lib/effectPipeline';
import {
  getNativeFfmpegStatus,
  nativeFfmpegSupported,
  openFfmpegBuildsPage,
  openNativeFfmpegFolder,
} from './lib/exportVideo';
import type { ExportStage, NativeFfmpegStatus, VideoExportFrameRenderer } from './adapters';

const MAX_DISPLAY_W = 1000;

const CANVAS_SIZE_PRESETS = [
  { value: 'full-hd', label: 'Full HD', width: 1920, height: 1080 },
  { value: 'hd', label: 'HD', width: 1280, height: 720 },
  { value: 'square-400', label: '400×400', width: 400, height: 400 },
  { value: 'square-800', label: '800×800', width: 800, height: 800 },
] as const;

type LeftTab = 'diffuse' | 'noise' | 'slit' | 'postprocess' | 'sandbox' | 'export' | 'preset';
type OverlayImageMode = 'overlay' | 'mask' | 'off';

const LEFT_TABS: { value: LeftTab; labelKey: MessageKey }[] = [
  { value: 'diffuse', labelKey: 'effect.diffuse' },
  { value: 'noise', labelKey: 'effect.noise' },
  { value: 'slit', labelKey: 'effect.slit' },
  { value: 'postprocess', labelKey: 'effect.postprocess' },
  { value: 'sandbox', labelKey: 'effect.sandbox' },
  { value: 'export', labelKey: 'effect.export' },
  { value: 'preset', labelKey: 'effect.preset' },
];

function formatGpuBytes(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)}GB`;
}

function gpuSummary(diag: GpuDiagnostics | null): { label: string; title: string } {
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

// タブとstore上のenabledフィールドのマッピング
type StoreSnapshot = ReturnType<typeof useGradientStore.getState>;
const TAB_ENABLED_MAP: Partial<Record<LeftTab, (s: StoreSnapshot) => boolean>> = {
  diffuse: (s) => s.diffuse.enabled,
  noise: (s) => s.noiseDistortion.enabled,
  slit: (s) => s.slitScan.enabled,
  sandbox: (s) => s.normalMap.enabled || s.effectPipeline.prismEnabled || s.effectPipeline.particlesEnabled,
  postprocess: (s) => s.postprocess.enabled || hasEnabledPostprocessEffectStack(s.effectPipeline),
};

const TAB_ANIMATION_PREFIX: Partial<Record<LeftTab, string>> = {
  diffuse: 'diffuse.',
  noise: 'noiseDistortion.',
  slit: 'slitScan.',
  postprocess: 'postprocess.',
};

export default function App() {
  const store = useGradientStore();
  const updater = useAppUpdater();
  const { t } = useLanguage();
  const {
    matcap,
    animation,
    clothGradient,
    coneView,
    noiseDistortion,
    postprocess,
    setPostprocess,
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
  const [ffmpegStatus, setFfmpegStatus] = useState<NativeFfmpegStatus | null>(null);
  const [ffmpegChecking, setFfmpegChecking] = useState(false);
  const [ffmpegDialogOpen, setFfmpegDialogOpen] = useState(false);
  const ffmpegCheckRequestRef = useRef(0);
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

  const clampRes = (v: number) => Math.max(1, Math.min(15000, v));
  const cancelResRef = useRef(false);

  function commitW() {
    if (cancelResRef.current) { cancelResRef.current = false; return; }
    const v = clampRes(Number(wDraft) || canvasW);
    setCanvasW(v);
    if (lockAspect) {
      setCanvasH(clampRes(Math.round(v / aspectRatioRef.current)));
    } else {
      aspectRatioRef.current = v / canvasH;
    }
  }

  function commitH() {
    if (cancelResRef.current) { cancelResRef.current = false; return; }
    const v = clampRes(Number(hDraft) || canvasH);
    setCanvasH(v);
    if (lockAspect) {
      setCanvasW(clampRes(Math.round(v * aspectRatioRef.current)));
    } else {
      aspectRatioRef.current = canvasW / v;
    }
  }

  const activeCanvasPreset = CANVAS_SIZE_PRESETS.find((preset) => preset.width === canvasW && preset.height === canvasH);
  const canvasPresetValue = activeCanvasPreset?.value ?? 'custom';

  function applyCanvasPreset(value: string) {
    const preset = CANVAS_SIZE_PRESETS.find((candidate) => candidate.value === value);
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

  // Matcap有効時に1024x1024へ自動変更、無効時に元のサイズへ復元
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
    resetViewport, cursor,
  } = useViewportControl();

  useKeyboardShortcuts();

  useEffect(() => {
    const handleGpuDiagnostics = (event: WindowEventMap['kagaribi:gpu-diagnostics']) => {
      setGpuDiagnostics(event.detail);
    };
    window.addEventListener('kagaribi:gpu-diagnostics', handleGpuDiagnostics);
    if (window.__KAGARIBI_GPU_DIAGNOSTICS__) {
      setGpuDiagnostics(window.__KAGARIBI_GPU_DIAGNOSTICS__);
    }
    return () => window.removeEventListener('kagaribi:gpu-diagnostics', handleGpuDiagnostics);
  }, []);

  const [leftTab, setLeftTab] = useState<LeftTab>('diffuse');
  const activeLeftTabRef = useRef<LeftTab>('diffuse');
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
    const nextTab: LeftTab = kind === 'diffuse'
      ? 'diffuse'
      : kind === 'noise'
        ? 'noise'
          : kind === 'slit'
            ? 'slit'
            : 'postprocess';
    if (kind === 'distort') {
      setPostprocess({ effectMode: 'distort' });
    }
    activeLeftTabRef.current = nextTab;
    setLeftTab(nextTab);
    setLeftPanelOpen(true);
  };

  // アニメーションが有効化されたとき、または対象のいずれかが有効なときにタイムラインを自動で開く
  useEffect(() => {
    if (animation.enabled && (noiseDistortion.enabled || slitScan.animEnabled || stretch.enabled)) {
      const id = setTimeout(() => setShowTimeline(true), 180);
      return () => clearTimeout(id);
    }
  }, [animation.enabled, noiseDistortion.enabled, slitScan.animEnabled, stretch.enabled]);

  const hoverLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const refreshFfmpegStatus = async (showDialog: boolean): Promise<NativeFfmpegStatus | null> => {
    if (!nativeFfmpegSupported()) return null;
    const requestId = ++ffmpegCheckRequestRef.current;
    setFfmpegChecking(true);
    try {
      const status = await getNativeFfmpegStatus();
      if (requestId !== ffmpegCheckRequestRef.current) return status;
      setFfmpegStatus(status);
      if (status.available) {
        setFfmpegDialogOpen(false);
      } else if (showDialog && activeLeftTabRef.current === 'export') {
        setFfmpegDialogOpen(true);
      }
      return status;
    } catch (error) {
      const status: NativeFfmpegStatus = {
        supported: true,
        available: false,
        source: null,
        path: null,
        version: null,
        error: error instanceof Error ? error.message : String(error),
        warning: null,
        folderPath: null,
      };
      if (requestId === ffmpegCheckRequestRef.current) {
        setFfmpegStatus(status);
        if (showDialog && activeLeftTabRef.current === 'export') {
          setFfmpegDialogOpen(true);
        }
      }
      return status;
    } finally {
      if (requestId === ffmpegCheckRequestRef.current) setFfmpegChecking(false);
    }
  };

  const handleTabClick = (value: LeftTab) => {
    activeLeftTabRef.current = value;
    setLeftTab(value);
    setLeftPanelOpen(true);
    // `showLeftSidebar` is the mobile drawer state. Updating it on desktop
    // also hides the canvas Effect Stack overlay, even though the drawer is
    // not rendered there.
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

  useEffect(() => {
    return () => {
      if (hoverLockTimerRef.current) clearTimeout(hoverLockTimerRef.current);
    };
  }, []);

  const panelsContainerRef = useRef<HTMLDivElement>(null);
  // パネルの水平スライド移動 (左サイドバー内)
  useLayoutEffect(() => {
    if (!panelsContainerRef.current) return;
    const idx = LEFT_TABS.findIndex(t => t.value === leftTab);
    gsap.to(panelsContainerRef.current, {
      x: `-${idx * 100}%`,
      duration: 0.9,
      ease: "expo.out"
    });
  }, [leftTab]);

  const [overlayImageSrc, setOverlayImageSrc] = useState<string | null>(null);
  const [overlayImageName, setOverlayImageName] = useState<string>('');
  const [overlayImageElement, setOverlayImageElement] = useState<HTMLImageElement | null>(null);
  const [overlayImageMode, setOverlayImageMode] = useState<OverlayImageMode>('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const overlayImageInputRef = useRef<HTMLInputElement>(null);
  const overlayImageLoadIdRef = useRef(0);

  const handleOverlayImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    document.body.style.cursor = '';
    const file = e.target.files?.[0];
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
    setOverlayImageSrc(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    setOverlayImageName(file.name);
    e.target.value = '';
  };

  const [leftPanelW, setLeftPanelW] = useState(288);
  const [rightPanelW, setRightPanelW] = useState(320);
  const [activeResizeSide, setActiveResizeSide] = useState<'left' | 'right' | null>(null);
  const resizingRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (resizingRef.current === 'left') {
        const newW = Math.max(240, Math.min(520, e.clientX));
        setLeftPanelW(newW);
      }
      if (resizingRef.current === 'right') {
        const newW = Math.max(240, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelW(newW);
      }
      if (timelineResizingRef.current) {
        const newH = Math.max(100, Math.min(window.innerHeight * 0.8, window.innerHeight - e.clientY));
        setTimelineHeight(newH);
      }
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

  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setViewportSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportRef]);

  const availW = viewportSize.w > 0 ? viewportSize.w - 48 : MAX_DISPLAY_W;
  const availH = (viewportSize.h > 0 ? viewportSize.h - 48 : 9999);
  const fitByW = Math.min(canvasW, MAX_DISPLAY_W, availW);
  const fitHByW = Math.round(fitByW * (canvasH / canvasW));
  const displayW = fitHByW <= availH ? fitByW : Math.round(availH * (canvasW / canvasH));
  const displayH = Math.round(displayW * (canvasH / canvasW));
  const gpuInfo = gpuSummary(gpuDiagnostics);

  return (
    <InteractionSettingsProvider value={{ hoverInteractionsEnabled: tabHoverSwitchEnabled }}>
      <div className="h-[100dvh] text-k-text flex flex-col overflow-hidden relative">
        {/* 項目選択用のトップバー */}
        <div className="z-30 flex shrink-0 items-center gap-2 border-b border-panel-border bg-k-bg/95 px-2 py-1.5">
          <div className="inline-flex min-w-0 flex-1 bg-k-surface/80 overflow-x-auto no-scrollbar scroll-smooth">
            {LEFT_TABS.map(({ value, labelKey }) => {
              const getEnabled = TAB_ENABLED_MAP[value];
              const enabled = getEnabled ? getEnabled(store) : undefined;
              const isPrimary = value === 'diffuse' || value === 'noise' || value === 'slit';
              const isUtility = value === 'export' || value === 'preset';
              return (
                <button
                  key={value}
                  onMouseEnter={() => handleTabMouseEnter(value)}
                  onClick={(e) => { handleTabClick(value); (e.currentTarget as HTMLButtonElement).blur(); }}
                  className={`h-10 w-[86px] !border-0 px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${isUtility
                    ? leftTab === value
                      ? 'text-k-text bg-deep/10'
                      : 'text-deep/80 hover:text-deep bg-k-bg hover:bg-k-bg'
                    : leftTab === value
                      ? 'text-k-text bg-fire/10'
                      : isPrimary
                        ? 'text-fire/70 hover:text-fire hover:bg-k-surface'
                        : 'text-tab-inactive/60 hover:text-tab-inactive hover:bg-k-surface'
                    } ${tabHoverSwitchEnabled && isHoverLocked && leftTab !== value ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                >
                  {t(labelKey)}
                  {enabled !== undefined && (
                    <span className={`text-[8px] font-bold leading-none ${enabled ? 'text-emerald-400' : 'text-k-muted'}`}>
                      {enabled ? t('common.on') : t('common.off')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex h-10 shrink-0 items-stretch gap-1">
            <div
              className="hidden min-w-0 max-w-[240px] items-center gap-2 border border-cream/20 bg-k-surface px-3 text-tab-inactive md:flex"
              title={gpuInfo.title}
            >
              <Icon name="memory" className="text-[16px] text-deep" />
              <span className="truncate text-[9px] font-display font-semibold uppercase tracking-wider">
                {gpuInfo.label}
              </span>
            </div>
            {updater.supported && (
              <UpdateButton
                status={updater.state.status}
                onClick={updater.openDialog}
              />
            )}
            <button
              type="button"
              onClick={(e) => { setShowPropertyModulesSettings(true); e.currentTarget.blur(); }}
              className={`inline-flex min-w-10 items-center justify-center gap-2 border px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${tabHoverSwitchEnabled
                ? 'border-fire/55 bg-fire/10 text-fire hover:bg-fire/20'
                : 'border-cream/25 bg-k-surface text-tab-inactive hover:border-cream/45 hover:text-k-text'
                }`}
              title={`${t('settings.title')} · ${tabHoverSwitchEnabled ? t('settings.hover') : t('settings.clickOnly')}`}
              aria-label={t('common.settings')}
            >
              <Icon name="settings" className="text-[16px]" />
              <span className="hidden text-[9px] font-display font-semibold uppercase tracking-wider xl:inline">
                {tabHoverSwitchEnabled ? t('settings.hover') : t('settings.clickOnly')}
              </span>
            </button>
          </div>

          {/* モバイル用右サイドバーボタン */}
          <button
            onClick={(e) => { setRightPanelOpen(true); setShowRightSidebar(!showRightSidebar); (e.currentTarget as HTMLButtonElement).blur(); }}
            title={t('panel.toggle', { action: showRightSidebar ? t('common.close') : t('common.open'), panel: 'K-GG' })}
            aria-label={t('panel.toggle', { action: showRightSidebar ? t('common.close') : t('common.open'), panel: 'K-GG' })}
            className="md:hidden ml-1 h-10 w-10 bg-k-surface border border-panel-border text-k-text hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden relative">
          {/* モバイル用左サイドバー開閉オーバーレイ */}
          {showLeftSidebar && (
            <div className="md:hidden absolute inset-0 bg-k-bg/50 z-20" onClick={() => setShowLeftSidebar(false)} />
          )}
          {/* モバイル用右サイドバー開閉オーバーレイ */}
          {showRightSidebar && (
            <div className="md:hidden absolute inset-0 bg-k-bg/50 z-20" onClick={() => setShowRightSidebar(false)} />
          )}

          {/* 詳細プロパティ表示用の左サイドバー */}
          <DockPanel
            id="property-modules-panel"
            side="left"
            title={t('settings.title')}
            open={leftPanelOpen}
            mobileOpen={showLeftSidebar}
            width={leftPanelW}
            onOpenChange={setLeftPanelOpen}
            onMobileOpenChange={setShowLeftSidebar}
            resizing={activeResizeSide === 'left'}
            bodyClassName="overflow-hidden"
            onResizeStart={(e) => {
              e.preventDefault();
              resizingRef.current = 'left';
              setActiveResizeSide('left');
              document.body.style.cursor = 'col-resize';
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
          >
            <div className="relative h-full overflow-hidden">
              <div
                ref={panelsContainerRef}
                className="flex flex-row h-full w-full"
                style={{ width: '100%' }}
              >
                {LEFT_TABS.map(({ value }) => (
                  <div key={value} className="w-full h-full shrink-0 p-4 overflow-y-auto scrollbar-thin">
                    {value === 'diffuse' && <DiffusePanel />}
                    {value === 'noise' && <NoiseDistortionPanel />}
                    {value === 'slit' && (
                      <SlitScanPanel
                        sourceImageName={slitSourceImageName}
                        hasSourceImage={!!slitSourceImageCanvas}
                        onSourceImageLoad={(canvas, name) => {
                          setSlitSourceImageCanvas(canvas);
                          setSlitSourceImageName(name);
                        }}
                        onSourceImageClear={() => {
                          setSlitSourceImageCanvas(null);
                          setSlitSourceImageName('');
                        }}
                      />
                    )}
                    {value === 'sandbox' && (
                      <SandboxPanel
                        renderViewMode={renderViewMode}
                        onRenderViewModeChange={(mode) => {
                          setClothUnavailable(false);
                          setClothReady(false);
                          setConeUnavailable(false);
                          setConeReady(false);
                          setRenderViewMode(mode);
                        }}
                      />
                    )}
                    {value === 'postprocess' && <PostprocessPanel />}
                    {value === 'export' && (
                      <ExportPanel
                        onExportProgress={setExportProgress}
                        onExportStage={setExportStage}
                        onResizeCanvas={(w, h) => {
                          setCanvasW(w);
                          setCanvasH(h);
                          aspectRatioRef.current = w / h;
                        }}
                        canvasRef={canvasRef}
                        previewCanvasRef={
                          renderViewMode === 'cloth' && clothReady
                            ? clothCanvasRef
                            : renderViewMode === 'cone' && coneReady
                              ? coneCanvasRef
                              : canvasRef
                        }
                        exportFrameRendererRef={
                          renderViewMode === 'cloth' && clothReady
                            ? clothExportFrameRendererRef
                            : renderViewMode === 'cone' && coneReady
                              ? coneExportFrameRendererRef
                              : undefined
                        }
                        ffmpegStatus={ffmpegStatus}
                        ffmpegChecking={ffmpegChecking}
                        onCheckFfmpeg={refreshFfmpegStatus}
                      />
                    )}
                    {value === 'preset' && (
                      <PresetPanel
                        canvasW={canvasW}
                        canvasH={canvasH}
                        setCanvasW={setCanvasW}
                        setCanvasH={setCanvasH}
                        aspectRatioRef={aspectRatioRef}
                        onPresetLoad={() => {
                          setClothReady(false);
                          setConeReady(false);
                          setClothUnavailable(false);
                          setConeUnavailable(false);
                          setRenderViewMode('canvas');
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DockPanel>

          {/* プレビューエリア */}
          <div
            ref={viewportRef}
            className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
            style={{ cursor }}
            onMouseDown={handleMiddleDown}
            onMouseMove={handleMiddleMove}
            onMouseUp={handleMiddleUp}
            onMouseLeave={handleMiddleLeave}
          >
            <div className="pointer-events-none absolute inset-0 z-[80] overflow-hidden">
              {gestureFeedbacks.map(feedback => (
                <div
                  key={feedback.id}
                  className={`gesture-feedback-ring gesture-feedback-ring--${feedback.action}`}
                  style={{
                    left: feedback.x,
                    top: feedback.y,
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* モバイル用サイドバーボタン (左) */}
            <button
              onClick={() => { setLeftPanelOpen(true); setShowLeftSidebar(true); }}
              title={t('panel.toggle', { action: t('common.open'), panel: t('settings.title') })}
              aria-label={t('panel.toggle', { action: t('common.open'), panel: t('settings.title') })}
              className={`md:hidden absolute top-4 left-4 p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text z-10 transition-opacity ${showLeftSidebar || showRightSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>

            {/* モバイル用 Undo/Redo ボタン */}
            <div className={`md:hidden absolute top-4 right-4 flex gap-2 z-10 transition-opacity ${showLeftSidebar || showRightSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <button
                onClick={undo}
                title={t('common.undo')}
                aria-label={t('common.undo')}
                className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14L4 9L9 4"></path>
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                </svg>
              </button>
              <button
                onClick={redo}
                title={t('common.redo')}
                aria-label={t('common.redo')}
                className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14l5-5-5-5"></path>
                  <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
                </svg>
              </button>
            </div>

            <div className="absolute top-6 right-6 z-20 hidden flex-col gap-2 md:flex">
              <button
                type="button"
                onClick={(e) => { setShowFeedback(true); (e.currentTarget as HTMLButtonElement).blur(); }}
                className="h-10 w-10 shrink-0 flex items-center justify-center border border-cream/30 bg-k-surface/85 p-0 text-fire shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 hover:border-fire hover:bg-fire/15 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
                title={t('common.feedback')}
                aria-label={t('common.feedback')}
              >
                <svg className="shrink-0" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  <path d="M8 9h8" />
                  <path d="M8 13h5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { setShowGradientAnchors(!showGradientAnchors); (e.currentTarget as HTMLButtonElement).blur(); }}
                className={`h-10 w-10 shrink-0 flex items-center justify-center border shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${showGradientAnchors
                  ? 'border-fire bg-fire/15 text-fire hover:bg-fire/25 hover:border-fire'
                  : 'border-cream/30 bg-k-surface/85 text-cream/70 hover:border-fire hover:bg-fire/15 hover:text-k-text'
                  }`}
                title={showGradientAnchors ? t('canvas.hideAnchors') : t('canvas.showAnchors')}
                aria-label={showGradientAnchors ? t('canvas.hideAnchors') : t('canvas.showAnchors')}
              >
                {showGradientAnchors ? (
                  <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                  </svg>
                ) : (
                  <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4" y1="4" x2="20" y2="20" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => { resetViewport(); (e.currentTarget as HTMLButtonElement).blur(); }}
                className="h-10 w-10 shrink-0 flex items-center justify-center border border-cream/30 bg-k-surface/85 p-0 text-fire shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 hover:border-fire hover:bg-fire/15 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
                title={t('canvas.resetViewport')}
                aria-label={t('canvas.resetViewport')}
              >
                <Icon name="restart" style={{ fontSize: 16 }} />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center p-2 md:p-6 overflow-visible">
              <EffectStackWorkspace
                sourceCanvasRef={canvasRef}
                hidden={showLeftSidebar || showRightSidebar}
                onSelectEffectStack={handleEffectStackSelection}
              />
              <div style={{
                position: 'relative',
                width: displayW,
                height: displayH,
                overflow: 'visible',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: renderViewMode === 'canvas' || (renderViewMode === 'cloth' ? !clothReady : !coneReady) ? 1 : 0,
                    pointerEvents: renderViewMode === 'canvas' ? 'auto' : 'none',
                    transition: 'opacity 180ms ease-out',
                  }}
                >
                  <GradientCanvas
                    width={canvasW}
                    height={canvasH}
                    animLoopRef={animLoopRef}
                    seekVersion={seekVersion}
                    canvasRef={canvasRef}
                    sourceImageCanvas={slitSourceImageCanvas}
                    imageGradientSource={imageGradientSource}
                    imageMaskSource={overlayImageElement}
                    imageMaskEnabled={overlayImageMode === 'mask'}
                    disableClothBase={renderViewMode === 'cloth'}
                  />
                </div>
                {renderViewMode === 'cloth' && (
                  <ClothCanvas
                    sourceCanvasRef={canvasRef}
                    clothGradient={clothGradient}
                    width={canvasW}
                    height={canvasH}
                    onReady={() => setClothReady(true)}
                    outputCanvasRef={clothCanvasRef}
                    exportFrameRendererRef={clothExportFrameRendererRef}
                    onUnavailable={() => {
                      setClothReady(false);
                      setClothUnavailable(true);
                      setRenderViewMode('canvas');
                    }}
                  />
                )}
                {renderViewMode === 'cone' && (
                  <ConeCanvas
                    sourceCanvasRef={canvasRef}
                    coneView={coneView}
                    width={canvasW}
                    height={canvasH}
                    onReady={() => setConeReady(true)}
                    outputCanvasRef={coneCanvasRef}
                    exportFrameRendererRef={coneExportFrameRendererRef}
                    onUnavailable={() => {
                      setConeReady(false);
                      setConeUnavailable(true);
                      setRenderViewMode('canvas');
                    }}
                  />
                )}
                {renderViewMode === 'cone' && (
                  <ConeApexEditor width={displayW} height={displayH} visible={showGradientAnchors} />
                )}
                <DistortOverlay
                  active={renderViewMode === 'canvas' && leftTab === 'postprocess' && postprocess.effectMode === 'distort' && (
                    effectPipeline.version === 'stack-v2'
                      ? isEffectStackLayerEnabled(effectPipeline, 'distort')
                      : isPostprocessLayerEnabled(postprocess, 'distort')
                  )}
                  width={displayW}
                  height={displayH}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  manualDistort={postprocess}
                  setManualDistort={setPostprocess}
                />
                <PostprocessOverlay
                  active={renderViewMode === 'canvas' &&
                    leftTab === 'postprocess' &&
                    (
                      (postprocess.effectMode === 'mirror' && isPostprocessLayerEnabled(postprocess, 'mirror')) ||
                      (postprocess.effectMode === 'kaleidoscope' && isPostprocessLayerEnabled(postprocess, 'kaleidoscope'))
                    )
                  }
                  width={displayW}
                  height={displayH}
                  postprocess={postprocess}
                />
                {renderViewMode === 'canvas' && overlayImageSrc && overlayImageMode === 'overlay' && (
                  <img
                    src={overlayImageSrc}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%', height: '100%',
                      opacity: overlayOpacity,
                      pointerEvents: 'none',
                      objectFit: 'fill',
                    }}
                    alt=""
                  />
                )}
                <GradientAnchorEditor width={displayW} height={displayH} visible={showGradientAnchors} />
                {renderViewMode === 'canvas' && <SlitOverlay width={displayW} height={displayH} canvasW={canvasW} canvasH={canvasH} />}
              </div>
              {clothUnavailable && (
                <div
                  role="status"
                  className="absolute right-4 top-20 z-30 max-w-[280px] border border-amber-300/30 bg-[#1b1715]/92 px-3 py-2 text-[10px] leading-relaxed text-amber-100 shadow-[0_14px_30px_rgba(0,0,0,0.32)]"
                >
                  {t('canvas.clothUnavailable')}
                </div>
              )}
              {coneUnavailable && (
                <div
                  role="status"
                  className="absolute right-4 top-20 z-30 max-w-[280px] border border-amber-300/30 bg-[#1b1715]/92 px-3 py-2 text-[10px] leading-relaxed text-amber-100 shadow-[0_14px_30px_rgba(0,0,0,0.32)]"
                >
                  {t('canvas.coneUnavailable')}
                </div>
              )}
              <div
                className="absolute right-4 bottom-4 w-[220px] max-h-[calc(100%-32px)] bg-k-bg/98 border border-panel-border/70 z-30 overflow-y-auto p-3 scrollbar-thin shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
                style={{ display: (showTimeRemap && exportProgress === null) ? 'block' : 'none' }}
              >
                <button
                  type="button"
                  className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center bg-transparent text-tab-inactive hover:text-fire transition-colors"
                  onClick={() => setShowTimeRemap(false)}
                title={t('common.close')}
                aria-label={t('common.close')}
                >
                  <Icon name="close" className="text-[12px]" />
                </button>
                <BezierEasingEditor compact />
              </div>
            </div>

          </div>

          {/* 右サイドバー: グラデーション設定 */}
          <DockPanel
            id="gradient-settings-panel"
            side="right"
            title="K-GG"
            open={rightPanelOpen}
            mobileOpen={showRightSidebar}
            width={rightPanelW}
            onOpenChange={setRightPanelOpen}
            onMobileOpenChange={setShowRightSidebar}
            resizing={activeResizeSide === 'right'}
            bodyClassName="flex flex-col overflow-y-auto px-6 pb-8 scrollbar-thin"
            onResizeStart={(e) => {
              e.preventDefault();
              resizingRef.current = 'right';
              setActiveResizeSide('right');
              document.body.style.cursor = 'col-resize';
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
          >
            <div className="space-y-6 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-display font-bold uppercase tracking-[0.18em] leading-none text-k-text">K-GG</h2>
                  <p className="mt-3 text-[10px] font-body tracking-normal leading-tight text-tab-inactive">© 2026 ke-go. All rights reserved.</p>
                </div>
                <IconButton
                  icon="help"
                  label={t('common.help')}
                  onClick={() => setShowHelp(true)}
                  className="shrink-0 p-2 text-deep hover:bg-k-border hover:text-k-text rounded-none transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
                  iconClassName="text-[20px]"
                />
              </div>

              <div className="space-y-3 border border-fire/25 bg-fire/[0.04] p-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <label htmlFor="canvas-size-preset" className="block text-xs font-display font-semibold uppercase tracking-wider text-k-text">{t('canvas.size')}</label>
                  </div>
                  <span className="text-[9px] font-display uppercase tracking-widest text-tab-inactive">{t('common.output')}</span>
                </div>
                <div className="relative">
                  <select
                    id="canvas-size-preset"
                    value={canvasPresetValue}
                    onChange={(e) => applyCanvasPreset(e.target.value)}
                    className="w-full appearance-none bg-k-surface border border-panel-border/70 text-k-text text-sm rounded-none px-3 py-2.5 pr-9 focus:border-fire focus:outline-none focus-visible:ring-1 focus-visible:ring-fire"
                  >
                    {CANVAS_SIZE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label} · {preset.width}×{preset.height}
                      </option>
                    ))}
                    <option value="custom">{t('common.custom')} · {canvasW}×{canvasH}</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-fire" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </div>
                <p className="text-[9px] leading-relaxed text-tab-inactive">
                  {activeCanvasPreset ? `${activeCanvasPreset.label} · ${activeCanvasPreset.width}×${activeCanvasPreset.height}` : `${t('common.custom')} · ${canvasW}×${canvasH}`}
                  {' '}— {t('canvas.customHint')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-display uppercase tracking-[0.18em] text-tab-inactive">{t('canvas.customDimensions')}</span>
                  <span className="text-[9px] font-display uppercase tracking-widest text-tab-inactive">px</span>
                </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 space-y-1">
                  <div>
                    <p className="text-xs text-deep mb-1">W</p>
                    <input
                      ref={wInputRef}
                      title={t('canvas.wheelHint')}
                      type="number" min={1} max={15000}
                      value={wDraft}
                      onChange={(e) => setWDraft(e.target.value)}
                      onBlur={commitW}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { commitW(); e.currentTarget.blur(); }
                        if (e.key === 'Escape') { cancelResRef.current = true; setWDraft(String(canvasW)); e.currentTarget.blur(); }
                      }}
                      className="w-full bg-k-surface border border-k-muted text-k-text text-xs rounded-none px-2 py-1 focus:border-fire focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-deep mb-1">H</p>
                    <input
                      ref={hInputRef}
                      title={t('canvas.wheelHint')}
                      type="number" min={1} max={15000}
                      value={hDraft}
                      onChange={(e) => setHDraft(e.target.value)}
                      onBlur={commitH}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { commitH(); e.currentTarget.blur(); }
                        if (e.key === 'Escape') { cancelResRef.current = true; setHDraft(String(canvasH)); e.currentTarget.blur(); }
                      }}
                      className="w-full bg-k-surface border border-k-muted text-k-text text-xs rounded-none px-2 py-1 focus:border-fire focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={swapCanvasSize}
                    className="p-1.5 rounded-none transition-colors duration-150 text-fire hover:text-cream"
                    title={t('canvas.swap')}
                    aria-label={t('canvas.swap')}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 3h6l-2-2" />
                      <path d="M11 3 9 5" />
                      <path d="M11 13H5l2 2" />
                      <path d="M5 13 7 11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (!lockAspect) aspectRatioRef.current = canvasW / canvasH; setLockAspect(!lockAspect); }}
                    className={`p-1.5 rounded-none transition-colors duration-150 ${lockAspect ? 'text-fire hover:text-cream' : 'text-k-muted hover:text-k-text'}`}
                    title={t('canvas.lockAspect')}
                    aria-label={t('canvas.lockAspect')}
                  >
                    {lockAspect ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" />
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" />
                        <path d="M5 7V5a3 3 0 0 1 6 0" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
              <SidebarSection
                id="gradient-ramp"
                title={t('gradient.title')}
                description={t('workspace.primaryColorControl')}
                open={showGradientRamp}
                onToggle={() => setShowGradientRamp(value => !value)}
              >
                <GradientRamp overlayImageElement={overlayImageElement} showHeader={false} />
              </SidebarSection>

              <SidebarSection
                id="image-overlay"
                title={t('workspace.imageOverlay')}
                description={t('workspace.imageOverlayDescription')}
                open={showOverlaySettings}
                onToggle={() => setShowOverlaySettings(value => !value)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-end gap-2">
                  {overlayImageSrc && (
                    <IconButton
                      icon="delete"
                      label={t('common.delete')}
                      onClick={() => { overlayImageLoadIdRef.current += 1; URL.revokeObjectURL(overlayImageSrc); setOverlayImageSrc(null); setOverlayImageName(''); setOverlayImageElement(null); }}
                      className="text-red-400 hover:text-red-300 px-2 py-0.5 bg-red-900/30 hover:bg-red-900/50"
                    />
                  )}
                  <IconButton
                    icon="upload"
                    label={t('common.load')}
                    onClick={() => overlayImageInputRef.current?.click()}
                    className="text-cream hover:text-k-text px-2 py-0.5 bg-cream/10 hover:bg-cream/20"
                  />
                  <input ref={overlayImageInputRef} type="file" accept="image/*" onChange={handleOverlayImageChange} className="hidden" />
                  </div>
                  {overlayImageSrc ? (
                    <p className="text-[10px] text-deep truncate">{overlayImageName}</p>
                  ) : (
                    <p className="text-[10px] text-k-muted">{t('workspace.noImage')}</p>
                  )}
                  <div className="grid grid-cols-2 gap-1 border border-panel-border/60 bg-k-bg/40 p-1">
                    {(['overlay', 'mask'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOverlayImageMode(current => current === mode ? 'off' : mode)}
                        aria-pressed={overlayImageMode === mode}
                        className={`px-2 py-1 text-[10px] font-display uppercase tracking-wider transition-colors duration-150 ${overlayImageMode === mode
                          ? 'bg-cream text-k-bg border-cream'
                          : 'bg-transparent text-deep hover:text-k-text hover:bg-cream/10'
                          }`}
                      >
                        {t(mode === 'overlay' ? 'workspace.overlay' : 'workspace.mask')}
                      </button>
                    ))}
                  </div>
                  {overlayImageMode === 'overlay' ? (
                    <SliderField
                      label={t('workspace.opacity')}
                      min={0} max={1} step={0.01}
                      value={overlayOpacity}
                      onChange={setOverlayOpacity}
                      format={(v) => v.toFixed(2)}
                      defaultValue={0.5}
                    />
                  ) : overlayImageMode === 'mask' ? (
                    <div className="flex items-center justify-between text-[10px] text-deep">
                      <span>{t('workspace.maskSource')}</span>
                      <span className={overlayImageElement ? 'text-cream' : 'text-k-muted'}>
                        {overlayImageElement ? t('workspace.alphaReady') : t('workspace.noImage')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-deep">
                      <span>{t('workspace.mode')}</span>
                      <span className="text-k-muted">{t('common.off')}</span>
                    </div>
                  )}
                </div>
              </SidebarSection>

              <SidebarSection
                id="image-gradient-source"
                title={t('effect.imageGradient')}
                description={t('workspace.imageGradientDescription')}
                open={showImageGradientSource}
                onToggle={() => setShowImageGradientSource(value => !value)}
              >
                <ImageGradientSourcePanel
                  sourceImageCanvas={imageGradientSource}
                  sourceImageName={imageGradientSourceName}
                  embedded
                  onSourceImageLoad={(canvas, name) => { setImageGradientSource(canvas); setImageGradientSourceName(name); }}
                  onSourceImageClear={() => { setImageGradientSource(null); setImageGradientSourceName(''); store.setImageGradient({ enabled: false }); }}
                />
              </SidebarSection>
            </div>
          </DockPanel>
        </div>
        {/* TimelineBar sits below the sidebars so sidebar resizing does not change its footprint. */}
        <div className="relative z-20 shrink-0">
          <Collapsible isOpen={showTimeline}>
            <div id="animation-timeline-panel" className="relative group/timeline border-t border-panel-border bg-k-bg/95">
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-[70] hover:bg-fire/40 transition-colors"
                onPointerDown={(e) => {
                  e.preventDefault();
                  timelineResizingRef.current = true;
                  document.body.style.cursor = 'row-resize';
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                }}
              />
              <div className="flex min-h-0" style={{ height: timelineHeight }}>
                <div className="min-w-0 flex-1">
                  <TimelineBar
                    animLoopRef={animLoopRef}
                    onSeek={() => setSeekVersion(v => v + 1)}
                    exportProgress={exportProgress}
                    exportStage={exportStage}
                    height={timelineHeight}
                    showTimeRemap={showTimeRemap}
                    onToggleTimeRemap={() => setShowTimeRemap(v => !v)}
                    selectedEffectPrefix={TAB_ANIMATION_PREFIX[leftTab]}
                  />
                </div>
              </div>
            </div>
          </Collapsible>
          <PanelEdgeToggle
            edge="bottom"
            open={showTimeline}
            panelTitle={t('animation.title')}
            controlsId="animation-timeline-panel"
            onToggle={() => setShowTimeline(value => !value)}
          >
            <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-k-text">
              {t('animation.title')}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${animation.enabled ? 'bg-emerald-400' : 'bg-k-muted'}`}
              aria-hidden="true"
            />
          </PanelEdgeToggle>
        </div>
        {showHelp && (
          <HelpPanel
            onClose={() => setShowHelp(false)}
            appVersion={updater.appVersion}
            updateSupported={updater.supported}
            updateStatus={updater.state.status}
            onCheckForUpdates={() => {
              setShowHelp(false);
              updater.openDialog();
            }}
          />
        )}
        {showFeedback && <FeedbackPanel onClose={() => setShowFeedback(false)} />}
        {showPropertyModulesSettings && (
          <PropertyModulesSettingsPanel
            hoverSwitchEnabled={tabHoverSwitchEnabled}
            onHoverSwitchChange={setTabHoverSwitchMode}
            onRefreshApp={() => window.location.reload()}
            onClose={() => setShowPropertyModulesSettings(false)}
          />
        )}
        <UpdateDialog
          open={updater.dialogOpen}
          state={updater.state}
          appVersion={updater.appVersion}
          onClose={updater.closeDialog}
          onRetry={updater.checkForUpdates}
          onInstall={updater.installUpdate}
        />
        <FfmpegSetupDialog
          open={ffmpegDialogOpen}
          checking={ffmpegChecking}
          status={ffmpegStatus}
          onClose={() => setFfmpegDialogOpen(false)}
          onCheckAgain={() => void refreshFfmpegStatus(true)}
          onOpenBuildsPage={() => {
            void openFfmpegBuildsPage().catch((error) => {
              setFfmpegStatus((current) => ({
                supported: true,
                available: current?.available ?? false,
                source: current?.source ?? null,
                path: current?.path ?? null,
                version: current?.version ?? null,
                error: error instanceof Error ? error.message : String(error),
                warning: current?.warning ?? null,
                folderPath: current?.folderPath ?? null,
              }));
            });
          }}
          onOpenFolder={() => {
            void openNativeFfmpegFolder().catch((error) => {
              setFfmpegStatus((current) => ({
                supported: true,
                available: current?.available ?? false,
                source: current?.source ?? null,
                path: current?.path ?? null,
                version: current?.version ?? null,
                error: error instanceof Error ? error.message : String(error),
                warning: current?.warning ?? null,
                folderPath: current?.folderPath ?? null,
              }));
            });
          }}
        />
      </div>
    </InteractionSettingsProvider>
  );
}
