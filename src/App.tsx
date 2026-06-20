import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './App.css';
import { gsap } from 'gsap';
import { GradientCanvas } from './components/GradientCanvas';
import { BezierAxisEditor } from './components/BezierAxisEditor';
import { GradientAnchorEditor } from './components/GradientAnchorEditor';
import { TimelineBar } from './components/TimelineBar';
import { BezierEasingEditor } from './components/BezierEasingEditor';
import { AnimationLoop } from './lib/animation';
import { NoiseDistortionPanel } from './components/NoiseDistortionPanel';
import { DiffusePanel } from './components/BlockNoisePanel';
import { AnimationControls } from './components/AnimationControls';
import { ExportPanel } from './components/ExportPanel';
import { SlitScanPanel } from './components/SlitScanPanel';
import { StretchPanel } from './components/StretchPanel';
import { PresetPanel } from './components/PresetPanel';
import { NormalMapPanel } from './components/NormalMapPanel';
import { IridescencePanel } from './components/IridescencePanel';
import { PostprocessPanel } from './components/PostprocessPanel';
import { DistortOverlay } from './components/DistortOverlay';
import { PostprocessOverlay } from './components/PostprocessOverlay';
import { MatcapPanel } from './components/MatcapPanel';
import { GradientRamp } from './components/GradientRamp';
import { SliderField } from './components/SliderField';
import { CustomSelect } from './components/CustomSelect';
import { AnimatedButton } from './components/AnimatedButton';
import { Toggle } from './components/Toggle';
import { useGradientStore, STORE_DEFAULTS } from './store/gradientStore';
import { bezierPresets } from './lib/bezierPresets';
import { useViewportControl } from './hooks/useViewportControl';
import { useCanvasSize } from './hooks/useCanvasSize';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { HelpPanel } from './components/HelpPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { PropertyModulesSettingsPanel } from './components/PropertyModulesSettingsPanel';
import { InteractionSettingsProvider } from './components/InteractionSettingsContext';
import { Collapsible } from './components/Collapsible';
import { ColorHistogram } from './components/ColorHistogram';
import { SlitOverlay } from './components/SlitOverlay';
import { parseSvgPaths } from './lib/svgParser';
import { undo, redo } from './lib/history';
import type { GpuDiagnostics } from './lib/gpuDiagnostics';

const MAX_DISPLAY_W = 1000;

type LeftTab = 'diffuse' | 'noise' | 'slit' | 'stretch' | 'normal' | 'distort' | 'postprocess' | 'matcap' | 'export' | 'preset';
type OverlayImageMode = 'overlay' | 'mask' | 'off';

const LEFT_TABS: { value: LeftTab; label: string }[] = [
  { value: 'diffuse', label: 'Diffuse' },
  { value: 'noise', label: 'Noise' },
  { value: 'slit', label: 'Slit' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'normal', label: 'Normal' },
  { value: 'distort', label: 'Distort' },
  { value: 'postprocess', label: 'Postprocess' },
  // Matcap is kept implemented but hidden from the top bar; add it back here to restore the panel.
  { value: 'export', label: 'Export' },
  { value: 'preset', label: 'Preset' },
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
  stretch: (s) => s.stretch.enabled,
  normal: (s) => s.normalMap.enabled,
  distort: (s) => s.manualDistort.enabled,
  postprocess: (s) => s.postprocess.enabled,
  matcap: (s) => s.matcap.enabled,
};

export default function App() {
  const store = useGradientStore();
  const {
    bezierAxis,
    setBezierAxis,
    matcap,
    animation,
    noiseDistortion,
    iridescence,
    manualDistort,
    setManualDistort,
    postprocess,
    setPostprocess,
    slitScan,
    stretch,
  } = store;
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPropertyModulesSettings, setShowPropertyModulesSettings] = useState(false);
  const [gpuDiagnostics, setGpuDiagnostics] = useState<GpuDiagnostics | null>(() => (
    typeof window === 'undefined' ? null : window.__KAGARIBI_GPU_DIAGNOSTICS__ ?? null
  ));
  const animLoopRef = useRef<AnimationLoop | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seekVersion, setSeekVersion] = useState(0);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [slitSourceImageCanvas, setSlitSourceImageCanvas] = useState<HTMLCanvasElement | null>(null);
  const [slitSourceImageName, setSlitSourceImageName] = useState('');

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
  const [tabHoverSwitchEnabled, setTabHoverSwitchEnabled] = useState(true);
  const [isHoverLocked, setIsHoverLocked] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTimeRemap, setShowTimeRemap] = useState(false);
  const [timelineHeight, setTimelineHeight] = useState(300);
  const timelineResizingRef = useRef(false);

  const isAnimPanelOpen = animation.enabled;

  function toggleAnimationEnabled() {
    const nextEnabled = !animation.enabled;
    store.setAnimation({ enabled: nextEnabled });
    if (nextEnabled) {
      store.setNoiseDistortion({ enabled: true });
    }
  }

  // アニメーションが有効化されたとき、または対象のいずれかが有効なときにタイムラインを自動で開く
  useEffect(() => {
    if (animation.enabled && (noiseDistortion.enabled || iridescence.enabled || slitScan.animEnabled || stretch.enabled)) {
      const id = setTimeout(() => setShowTimeline(true), 180);
      return () => clearTimeout(id);
    }
  }, [animation.enabled, noiseDistortion.enabled, iridescence.enabled, slitScan.animEnabled, stretch.enabled]);

  const hoverLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const handleTabClick = (value: LeftTab) => {
    setLeftTab(value);
    setShowLeftSidebar(true); // モバイルでタブをタップしたらサイドバーを表示
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSvgImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    document.body.style.cursor = '';
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const paths = await parseSvgPaths(file, canvasW, canvasH);
      setBezierAxis({ paths });
    } catch (err) {
      console.error('Failed to parse SVG:', err);
      alert('SVGの解析に失敗しました。');
    }
    e.target.value = '';
  };

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

  const [showBezierOverlay, setShowBezierOverlay] = useState(true);
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
      <div className="flex bg-k-bg border-b border-panel-border border-b-panel z-30 shrink-0">
        <div style={{ width: leftPanelW }} className="border-r border-panel-border border-r-panel hidden md:flex items-center justify-between gap-3 px-4 bg-k-surface">
          <div className="min-w-0">
            <span className="block text-[10px] font-display font-semibold text-k-text uppercase tracking-widest">Property Modules</span>
            <span className="block truncate text-[9px] text-tab-inactive" title={gpuInfo.title}>{gpuInfo.label}</span>
          </div>
          <button
            type="button"
            onClick={(e) => { setShowPropertyModulesSettings(true); (e.currentTarget as HTMLButtonElement).blur(); }}
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${
              tabHoverSwitchEnabled
                ? 'border-fire/55 bg-fire/10 text-fire hover:bg-fire/20'
                : 'border-cream/25 bg-k-bg text-tab-inactive hover:text-k-text hover:border-cream/45'
            }`}
            title="Property module settings"
            aria-label="Open property module settings"
          >
            <span className="material-symbols-rounded text-[15px] leading-none">settings</span>
          </button>
        </div>
        <div className="flex-1 flex bg-k-surface/50 overflow-x-auto no-scrollbar scroll-smooth">
          {LEFT_TABS.map(({ value, label }) => {
            const getEnabled = TAB_ENABLED_MAP[value];
            const enabled = getEnabled ? getEnabled(store) : undefined;
            const isPrimary = value === 'diffuse' || value === 'noise' || value === 'slit' || value === 'stretch';
            const isUtility = value === 'export' || value === 'preset';
            return (
              <button
                key={value}
                onMouseEnter={() => handleTabMouseEnter(value)}
                onClick={(e) => { handleTabClick(value); (e.currentTarget as HTMLButtonElement).blur(); }}
                className={`flex-1 min-w-20 py-3 text-[10px] font-display font-semibold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${
                  isUtility
                    ? leftTab === value
                      ? 'text-k-text border-deep bg-deep/10'
                      : 'text-deep/80 hover:text-deep border-transparent bg-k-bg hover:bg-k-bg'
                    : leftTab === value
                      ? 'text-k-text border-fire bg-fire/10'
                      : isPrimary
                        ? 'text-fire/70 hover:text-fire border-transparent hover:bg-k-surface'
                        : 'text-tab-inactive/60 hover:text-tab-inactive border-transparent hover:bg-k-surface'
                } ${tabHoverSwitchEnabled && isHoverLocked && leftTab !== value ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
              >
                {label}
                {enabled !== undefined && (
                  <span className={`text-[8px] font-bold leading-none ${enabled ? 'text-emerald-400' : 'text-k-muted'}`}>
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* モバイル用右サイドバーボタン */}
        <button
          onClick={(e) => { setShowRightSidebar(!showRightSidebar); (e.currentTarget as HTMLButtonElement).blur(); }}
          className="md:hidden px-4 py-3 bg-k-surface border-l border-panel-border border-l-panel text-k-text hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        {/* 右サイドバーの上部は空けるか、境界を維持 */}
        <div style={{ width: rightPanelW }} className="bg-k-surface border-l border-panel-border border-l-panel hidden md:block" />
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
        <div className={`
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative top-0 left-0 h-full max-w-[min(90vw,400px)] md:max-w-none bg-k-surface flex flex-col shrink-0 z-30 md:z-10 border-r border-panel-border border-r-panel transition-transform duration-300 ease-in-out
        `}
          style={{ width: leftPanelW }}
        >
          <div
            className={`absolute -right-1.5 top-0 bottom-0 z-20 hidden w-3 cursor-col-resize touch-none transition-colors md:block ${
              activeResizeSide === 'left' ? 'bg-fire/40 shadow-[0_0_18px_rgba(209,20,2,0.55)]' : 'hover:bg-fire/40'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              resizingRef.current = 'left';
              setActiveResizeSide('left');
              document.body.style.cursor = 'col-resize';
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
          />
          {/* モバイル用閉じるボタン */}
          <div className="md:hidden flex items-center gap-4 p-4 border-b border-panel-border border-b-panel bg-k-bg">
            <button onClick={(e) => { setShowLeftSidebar(false); (e.currentTarget as HTMLButtonElement).blur(); }} className="text-k-text p-1 -ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire">✕</button>
            <div className="min-w-0">
              <span className="block text-[10px] font-display font-semibold text-k-text uppercase tracking-widest">Property Modules</span>
              <span className="block max-w-[190px] truncate text-[9px] text-tab-inactive" title={gpuInfo.title}>{gpuInfo.label}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { setShowPropertyModulesSettings(true); (e.currentTarget as HTMLButtonElement).blur(); }}
              className={`ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${
                tabHoverSwitchEnabled
                  ? 'border-fire/55 bg-fire/10 text-fire'
                  : 'border-cream/25 bg-k-surface text-tab-inactive'
              }`}
              title="Property module settings"
              aria-label="Open property module settings"
            >
              <span className="material-symbols-rounded text-[15px] leading-none">settings</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
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
                  {value === 'stretch' && <StretchPanel />}
                  {value === 'normal' && <NormalMapPanel />}
                  {value === 'distort' && <IridescencePanel />}
                  {value === 'postprocess' && <PostprocessPanel />}
                  {value === 'matcap' && <MatcapPanel />}
                  {value === 'export' && <ExportPanel onExportProgress={setExportProgress} onResizeCanvas={(w, h) => { setCanvasW(w); setCanvasH(h); aspectRatioRef.current = w / h; }} canvasRef={canvasRef} />}
                  {value === 'preset' && <PresetPanel canvasW={canvasW} canvasH={canvasH} setCanvasW={setCanvasW} setCanvasH={setCanvasH} aspectRatioRef={aspectRatioRef} />}
                </div>
              ))}
            </div>
          </div>

          {/* Animation Panel - left sidebar bottom */}
          <div className="border-t border-panel-border border-t-panel bg-k-bg shrink-0">
            <div className="w-full px-4 py-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0 text-left text-[10px] font-display font-semibold uppercase tracking-wider text-k-text">
                Animation
              </div>
              <Toggle variant="switch" size="sm" checked={animation.enabled} onChange={toggleAnimationEnabled} />
            </div>
            <Collapsible isOpen={isAnimPanelOpen} duration={0.24}>
              <div className="px-4 pb-3 max-h-72 overflow-y-auto scrollbar-thin bg-k-surface">
                <AnimationControls />
              </div>
            </Collapsible>
          </div>
        </div>

        {/* プレビューエリア */}
        <div
          ref={viewportRef}
          className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
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
            onClick={() => setShowLeftSidebar(true)}
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
              className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14L4 9L9 4"></path>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
              </svg>
            </button>
            <button
              onClick={redo}
              className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14l5-5-5-5"></path>
                <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
              </svg>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => { setShowFeedback(true); (e.currentTarget as HTMLButtonElement).blur(); }}
            className="absolute top-6 right-6 z-20 hidden h-10 w-10 shrink-0 items-center justify-center border border-cream/30 bg-k-surface/85 p-0 text-fire shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 hover:border-fire hover:bg-fire/15 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire md:flex"
            title="Feedback"
            aria-label="Open feedback form"
          >
            <svg className="shrink-0" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              <path d="M8 9h8" />
              <path d="M8 13h5" />
            </svg>
          </button>

          <div className="relative flex-1 flex items-center justify-center p-2 md:p-6 overflow-hidden">
            <div style={{
              position: 'relative',
              width: displayW,
              height: displayH,
              overflow: 'visible',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}>
              <GradientCanvas
                width={canvasW}
                height={canvasH}
                animLoopRef={animLoopRef}
                seekVersion={seekVersion}
                canvasRef={canvasRef}
                sourceImageCanvas={slitSourceImageCanvas}
                imageMaskSource={overlayImageElement}
                imageMaskEnabled={overlayImageMode === 'mask'}
              />
              <DistortOverlay
                active={leftTab === 'distort'}
                width={displayW}
                height={displayH}
                canvasW={canvasW}
                canvasH={canvasH}
                manualDistort={manualDistort}
                setManualDistort={setManualDistort}
              />
              <DistortOverlay
                active={leftTab === 'postprocess' && postprocess.effectMode === 'distort'}
                width={displayW}
                height={displayH}
                canvasW={canvasW}
                canvasH={canvasH}
                manualDistort={postprocess}
                setManualDistort={setPostprocess}
              />
              <PostprocessOverlay
                active={leftTab === 'postprocess' || (postprocess.enabled && (postprocess.effectMode === 'mirror' || postprocess.effectMode === 'kaleidoscope'))}
                width={displayW}
                height={displayH}
                postprocess={postprocess}
              />
              {overlayImageSrc && overlayImageMode === 'overlay' && (
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
              <GradientAnchorEditor width={displayW} height={displayH} />
              <BezierAxisEditor width={displayW} height={displayH} showOverlay={showBezierOverlay} />
              <SlitOverlay width={displayW} height={displayH} canvasW={canvasW} canvasH={canvasH} />
            </div>
            <div
              className="absolute right-4 bottom-4 w-[220px] max-h-[calc(100%-32px)] bg-k-bg/98 border border-panel-border/70 z-30 overflow-y-auto p-3 scrollbar-thin shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
              style={{ display: (showTimeRemap && exportProgress === null) ? 'block' : 'none' }}
            >
              <button
                type="button"
                className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center bg-transparent text-tab-inactive hover:text-fire transition-colors"
                onClick={() => setShowTimeRemap(false)}
                aria-label="Close Time Remap"
              >
                <span className="material-symbols-rounded text-[12px] leading-none">close</span>
              </button>
              <BezierEasingEditor compact />
            </div>
          </div>

          <div className="hidden md:block absolute top-4 left-4 md:top-6 md:left-6 z-20 pointer-events-none transition-opacity">
            <ColorHistogram sourceCanvasRef={canvasRef} />
          </div>

          {/* TimelineBar を Collapsible で包んで滑らかに表示 */}
          <Collapsible isOpen={showTimeline}>
            <div className="relative group/timeline">
              {/* リサイズハンドル (上端) */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-[70] hover:bg-fire/40 transition-colors"
                onPointerDown={(e) => {
                  e.preventDefault();
                  timelineResizingRef.current = true;
                  document.body.style.cursor = 'row-resize';
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                }}
              />
              <TimelineBar 
                animLoopRef={animLoopRef} 
                onSeek={() => setSeekVersion(v => v + 1)} 
                exportProgress={exportProgress} 
                height={timelineHeight}
                showTimeRemap={showTimeRemap}
                onToggleTimeRemap={() => setShowTimeRemap(v => !v)}
              />
              {/* 閉じるボタン */}
              <button 
                onClick={() => setShowTimeline(false)}
                className="absolute top-2 right-4 z-[60] text-tab-inactive hover:text-fire transition-colors p-1"
                title="タイムラインを閉じる"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </Collapsible>
        </div>

        {/* 右サイドバー: グラデーション設定 */}
        <div
          className={`
            ${showRightSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            bg-k-surface border-l border-panel-border border-l-panel flex flex-col shrink-0 fixed md:relative top-0 right-0 h-full z-30 md:z-10 shadow-xl transition-transform duration-300 ease-in-out
          `}
          style={{ width: showRightSidebar ? 'min(90vw, 400px)' : rightPanelW }}
        >
          {/* モバイル用閉じるボタン入りのヘッダー */}
          <div className="md:hidden flex justify-between items-center p-4 border-b border-panel-border border-b-panel bg-k-bg shrink-0">
            <span className="text-[10px] font-display font-semibold text-k-text uppercase tracking-widest">Gradient Settings</span>
            <button onClick={() => setShowRightSidebar(false)} className="text-k-text p-1">✕</button>
          </div>

          {/* リサイズハンドル */}
          <div
            className={`absolute -left-1.5 top-0 bottom-0 z-20 hidden w-3 cursor-col-resize touch-none transition-colors md:block ${
              activeResizeSide === 'right' ? 'bg-fire/40 shadow-[0_0_18px_rgba(209,20,2,0.55)]' : 'hover:bg-fire/40'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              resizingRef.current = 'right';
              setActiveResizeSide('right');
              document.body.style.cursor = 'col-resize';
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
          />
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto scrollbar-thin min-w-0">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider leading-tight text-k-text">Kagaribi-15<br />Gradient Generator</h2>
                <p className="mt-3 text-[10px] font-body tracking-normal leading-tight text-tab-inactive">© 2026 ke-go. All rights reserved.</p>
              </div>
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 text-deep hover:text-k-text hover:bg-k-border rounded-none transition-all duration-150"
                title="使い方を表示"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
            </div>

            {/* Canvas Size */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-semibold uppercase tracking-wider text-k-text">Canvas Size</label>
              <div className="flex gap-2">
                {([{ label: '800×800', w: 800, h: 800 }, { label: '1920×1080', w: 1920, h: 1080 }] as const).map((s) => (
                  <AnimatedButton
                    key={s.label}
                    onClick={() => { setCanvasW(s.w); setCanvasH(s.h); aspectRatioRef.current = s.w/s.h;}}
                    isActive={canvasW === s.w && canvasH === s.h}
                    className="flex-1"
                  >
                    {s.label}
                  </AnimatedButton>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 space-y-1">
                  <div>
                    <p className="text-xs text-deep mb-1">W</p>
                    <input
                      ref={wInputRef}
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
                    title="WidthとHeightを入れ替え"
                    aria-label="Swap canvas width and height"
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
                    title={lockAspect ? 'アスペクト比ロック中' : 'アスペクト比ロック解除中'}
                    aria-label="Toggle aspect ratio lock"
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

            {/* Image Overlay */}
            <div className="border-t border-panel-border border-t-panel pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">Image Overlay/Mask</h2>
                <div className="flex items-center gap-2">
                  {overlayImageSrc && (
                    <button
                      onClick={() => { overlayImageLoadIdRef.current += 1; URL.revokeObjectURL(overlayImageSrc); setOverlayImageSrc(null); setOverlayImageName(''); setOverlayImageElement(null); }}
                      className="text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded-none bg-red-900/30 hover:bg-red-900/50 transition-colors duration-150"
                    >
                      削除
                    </button>
                  )}
                  <button
                    onClick={() => overlayImageInputRef.current?.click()}
                    className="text-[10px] text-cream hover:text-k-text px-2 py-0.5 rounded-none bg-cream/10 hover:bg-cream/20 transition-all duration-150"
                  >
                    読み込み
                  </button>
                  <input ref={overlayImageInputRef} type="file" accept="image/*" onChange={handleOverlayImageChange} className="hidden" />
                </div>
              </div>
              {overlayImageSrc ? (
                <p className="text-[10px] text-deep truncate">{overlayImageName}</p>
              ) : (
                <p className="text-[10px] text-k-muted">画像未選択</p>
              )}
              <div className="grid grid-cols-2 gap-1 border border-panel-border/60 bg-k-bg/40 p-1">
                {(['overlay', 'mask'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOverlayImageMode(current => current === mode ? 'off' : mode)}
                    aria-pressed={overlayImageMode === mode}
                    className={`px-2 py-1 text-[10px] font-display uppercase tracking-wider transition-colors duration-150 ${
                      overlayImageMode === mode
                        ? 'bg-cream text-k-bg border-cream'
                        : 'bg-transparent text-deep hover:text-k-text hover:bg-cream/10'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {overlayImageMode === 'overlay' ? (
                <SliderField
                  label="Opacity"
                  min={0} max={1} step={0.01}
                  value={overlayOpacity}
                  onChange={setOverlayOpacity}
                  format={(v) => v.toFixed(2)}
                  defaultValue={0.5}
                />
              ) : overlayImageMode === 'mask' ? (
                <div className="flex items-center justify-between text-[10px] text-deep">
                  <span>Mask Source</span>
                  <span className={overlayImageElement ? 'text-cream' : 'text-k-muted'}>
                    {overlayImageElement ? 'Alpha Ready' : 'No Image'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[10px] text-deep">
                  <span>Mode</span>
                  <span className="text-k-muted">Off</span>
                </div>
              )}
            </div>

            <div className="border-t border-panel-border border-t-panel pt-4">
              <GradientRamp />
            </div>

            {/* Bezier Distortion */}
            <div className="border-t border-panel-border border-t-panel pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">Bezier Distortion</h2>
                <div className="flex items-center gap-2">
                  {bezierAxis.enabled && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-deep select-none">
                        <Toggle size="sm" checked={showBezierOverlay} onChange={setShowBezierOverlay} />
                        表示
                      </div>
                    </div>
                  )}
                  <Toggle variant="switch" checked={bezierAxis.enabled} onChange={(v) => setBezierAxis({ enabled: v })} />
                </div>
              </div>

              <Collapsible isOpen={bezierAxis.enabled}>
                <div className="space-y-3 pt-1">
                  <SliderField label="Strength" min={0} max={1} step={0.01} value={bezierAxis.strength} onChange={(v) => setBezierAxis({ strength: v })} format={(v) => v.toFixed(2)} defaultValue={STORE_DEFAULTS.bezierAxis.strength} />
                  <SliderField label="Radius" min={0.01} max={3} step={0.01} value={bezierAxis.radius} onChange={(v) => setBezierAxis({ radius: v })} format={(v) => v.toFixed(2)} defaultValue={STORE_DEFAULTS.bezierAxis.radius} />
                  <SliderField label="Curvature" min={0} max={1} step={0.01} value={bezierAxis.curvatureInfluence} onChange={(v) => setBezierAxis({ curvatureInfluence: v })} format={(v) => v.toFixed(2)} defaultValue={STORE_DEFAULTS.bezierAxis.curvatureInfluence} />
                  <div className="flex gap-1">
                    {(['wide', 'narrow'] as const).map((m) => (
                      <AnimatedButton key={m} onClick={() => setBezierAxis({ curvatureMode: m })} isActive={(bezierAxis.curvatureMode ?? 'wide') === m} className="flex-1 py-1">{m === 'wide' ? 'Wide' : 'Narrow'}</AnimatedButton>
                    ))}
                  </div>
                  <CustomSelect
                    label="Side"
                    value={bezierAxis.bezierSide ?? 'both'}
                    options={[
                      { value: 'both', label: 'Both' },
                      { value: 'outer', label: 'Outer' },
                      { value: 'inner', label: 'Inner' },
                    ]}
                    onChange={(v) => setBezierAxis({ bezierSide: v as 'both' | 'outer' | 'inner' })}
                  />
                  <div>
                    <p className="text-xs text-deep mb-1">Boundary</p>
                    <div className="flex gap-1">
                      {(['clamp', 'repeat', 'mirror'] as const).map((b) => (
                        <AnimatedButton key={b} onClick={() => setBezierAxis({ boundary: b })} isActive={bezierAxis.boundary === b} className="flex-1 py-1 capitalize">{b}</AnimatedButton>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-deep mb-2">プリセット</p>
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(bezierPresets).map(([name, paths]) => (
                        <AnimatedButton key={name} onClick={() => setBezierAxis({ paths })} isActive={false} className="px-2 py-1">{name}</AnimatedButton>
                      ))}
                      <button onClick={() => setBezierAxis({ paths: [] })} className="text-xs text-k-text bg-red-900 hover:bg-red-800 px-2 py-1 rounded-none font-display uppercase tracking-wider">reset</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={() => {
                        const id = crypto.randomUUID();
                        const newPath = { id, anchors: [{ x: 0.2, y: 0.5, cp1: [0.2, 0.3] as [number, number], cp2: [0.2, 0.7] as [number, number] }, { x: 0.8, y: 0.5, cp1: [0.8, 0.3] as [number, number], cp2: [0.8, 0.7] as [number, number] }], closed: false };
                        setBezierAxis({ paths: [...bezierAxis.paths, newPath] });
                      }}
                      isActive={false}
                      className="flex-1 py-1.5 font-medium"
                    >
                      + パスを追加
                    </AnimatedButton>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 text-xs text-k-text bg-fire hover:brightness-110 active:scale-[0.98] py-1.5 rounded-none font-display uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      SVG Import
                    </button>
                    <input ref={fileInputRef} type="file" accept=".svg" onChange={handleSvgImport} className="hidden" />
                  </div>
                  <p className="text-[10px] text-k-muted leading-tight opacity-70">
                    クリック: 追加 / パス上クリック: 挿入 / Alt+パス上クリック: 直線化 / ダブルクリック: 削除 / Alt+ドラッグ: ハンドル延伸 / 右クリックドラッグ: 範囲選択 / Delete: 削除
                  </p>
                </div>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      {showFeedback && <FeedbackPanel onClose={() => setShowFeedback(false)} />}
      {showPropertyModulesSettings && (
        <PropertyModulesSettingsPanel
          hoverSwitchEnabled={tabHoverSwitchEnabled}
          onHoverSwitchChange={setTabHoverSwitchMode}
          onClose={() => setShowPropertyModulesSettings(false)}
        />
      )}
    </div>
    </InteractionSettingsProvider>
  );
}
