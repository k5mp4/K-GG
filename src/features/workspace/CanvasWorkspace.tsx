import type { MouseEventHandler, MutableRefObject, RefObject } from 'react';
import { BezierEasingEditor } from '../../components/BezierEasingEditor';
import { ClothCanvas } from '../../components/ClothCanvas';
import { ConeApexEditor } from '../../components/ConeApexEditor';
import { DistortOverlay } from '../../components/DistortOverlay';
import { EffectStackWorkspace } from '../../components/EffectStackWorkspace';
import { GradientAnchorEditor } from '../../components/GradientAnchorEditor';
import { GradientCanvas } from '../../components/GradientCanvas';
import { Icon } from '../../components/Icon';
import { PostprocessOverlay } from '../../components/PostprocessOverlay';
import { SlitOverlay } from '../../components/SlitOverlay';
import type { VideoExportFrameRenderer } from '../../adapters';
import type { AnimationLoop } from '../../lib/animation';
import { undo, redo } from '../../lib/history';
import { isPostprocessLayerEnabled } from '../../lib/postprocessStack';
import { isEffectStackLayerEnabled } from '../../lib/effectPipeline';
import type { KggControlProjectAdapter, KggControlUiAdapter } from '../../lib/kggControlRuntime';
import type { ClothGradientConfig } from '../../types/clothGradient';
import type { EffectPipelineConfig, EffectStackKind, PostprocessConfig } from '../../types/distortion';
import type { RenderViewMode } from '../../types/renderView';
import type { MessageKey } from '../../i18n/messages';
import type { Replacements } from '../../i18n/language';
import type { GestureFeedback, OverlayImageMode, Pan } from '../../types/workspace';
import type { LeftTab } from './tabs';
import type { PanelPresentation, ToolPresentation } from './workspaceLayout';

type CanvasWorkspaceViewportProps = {
  viewportRef: RefObject<HTMLDivElement | null>;
  cursor: string;
  gestureFeedbacks: readonly GestureFeedback[];
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onMouseMove: MouseEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
  onMouseLeave: () => void;
  displayW: number;
  displayH: number;
  zoom: number;
  pan: Pan;
  canvasW: number;
  canvasH: number;
};

type CanvasWorkspaceChromeProps = {
  panelsPresentation: PanelPresentation;
  toolsPresentation: ToolPresentation;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  onOpenLeftSidebar: () => void;
  showFeedback: () => void;
  showGradientAnchors: boolean;
  onToggleGradientAnchors: () => void;
  onResetViewport: () => void;
  showTimeRemap: boolean;
  exportProgress: number | null;
  onCloseTimeRemap: () => void;
};

type CanvasWorkspaceViewProps = {
  renderViewMode: RenderViewMode;
  clothReady: boolean;
  clothUnavailable: boolean;
  clothGradient: ClothGradientConfig;
  postprocess: PostprocessConfig;
  effectPipeline: EffectPipelineConfig;
  leftTab: LeftTab;
};

type CanvasWorkspaceOverlayProps = {
  overlayImageSrc: string | null;
  overlayImageElement: HTMLImageElement | null;
  overlayImageMode: OverlayImageMode;
  overlayOpacity: number;
  slitSourceImageCanvas: HTMLCanvasElement | null;
  imageGradientSource: HTMLCanvasElement | null;
  textureImageSource: HTMLCanvasElement | null;
  distortChromaImageSource: HTMLCanvasElement | null;
};

type CanvasWorkspaceResourcesProps = {
  animLoopRef: MutableRefObject<AnimationLoop | null>;
  seekVersion: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  clothCanvasRef: MutableRefObject<HTMLCanvasElement | null>;
  clothExportFrameRendererRef: MutableRefObject<VideoExportFrameRenderer | null>;
};

type CanvasWorkspaceControlsProps = {
  controlUi: KggControlUiAdapter;
  controlProject: KggControlProjectAdapter;
  setManualDistort: (value: Partial<PostprocessConfig>) => void;
  onSelectEffectStack: (kind: EffectStackKind) => void;
  onClothReady: () => void;
  onClothUnavailable: () => void;
};

export type CanvasWorkspaceProps = {
  compact?: boolean;
  viewport: CanvasWorkspaceViewportProps;
  chrome: CanvasWorkspaceChromeProps;
  view: CanvasWorkspaceViewProps;
  overlays: CanvasWorkspaceOverlayProps;
  resources: CanvasWorkspaceResourcesProps;
  controls: CanvasWorkspaceControlsProps;
  translate: (key: MessageKey, replacements?: Replacements) => string;
};

export function CanvasWorkspace({
  compact = false,
  viewport,
  chrome,
  view,
  overlays,
  resources,
  controls,
  translate,
}: CanvasWorkspaceProps) {
  const {
    viewportRef,
    cursor,
    gestureFeedbacks,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    displayW,
    displayH,
    zoom,
    pan,
    canvasW,
    canvasH,
  } = viewport;
  const {
    panelsPresentation,
    toolsPresentation,
    showLeftSidebar,
    showRightSidebar,
    onOpenLeftSidebar,
    showFeedback,
    showGradientAnchors,
    onToggleGradientAnchors,
    onResetViewport,
    showTimeRemap,
    exportProgress,
    onCloseTimeRemap,
  } = chrome;
  const {
    renderViewMode: normalRenderViewMode,
    clothReady,
    clothUnavailable,
    clothGradient,
    postprocess,
    effectPipeline,
    leftTab,
  } = view;
  const renderViewMode = compact ? 'canvas' : normalRenderViewMode;
  const {
    overlayImageSrc,
    overlayImageElement,
    overlayImageMode,
    overlayOpacity,
    slitSourceImageCanvas,
    imageGradientSource,
    textureImageSource,
    distortChromaImageSource,
  } = overlays;
  const {
    animLoopRef,
    seekVersion,
    canvasRef,
    clothCanvasRef,
    clothExportFrameRendererRef,
  } = resources;
  const {
    controlUi,
    controlProject,
    setManualDistort,
    onSelectEffectStack,
    onClothReady,
    onClothUnavailable,
  } = controls;

  return (
    <div
      ref={viewportRef}
      data-canvas-workspace
      className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="pointer-events-none absolute inset-0 z-[80] overflow-hidden">
        {gestureFeedbacks.map(feedback => (
          <div
            key={feedback.id}
            className={`gesture-feedback-ring gesture-feedback-ring--${feedback.action}`}
            style={{ left: feedback.x, top: feedback.y }}
            aria-hidden="true"
          />
        ))}
      </div>

      <button
        data-viewport-ui
        onClick={onOpenLeftSidebar}
        title={translate('panel.toggle', { action: translate('common.open'), panel: translate('settings.title') })}
        aria-label={translate('panel.toggle', { action: translate('common.open'), panel: translate('settings.title') })}
        className={`${panelsPresentation === 'overlay' ? 'block' : 'hidden'} absolute top-4 left-4 p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text z-10`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      </button>

      <div data-viewport-ui className={`${panelsPresentation === 'overlay' ? 'flex' : 'hidden'} absolute top-4 right-4 gap-2 z-10`}>
        <button
          onClick={undo}
          title={translate('common.undo')}
          aria-label={translate('common.undo')}
          className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9L9 4"></path>
            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
          </svg>
        </button>
        <button
          onClick={redo}
          title={translate('common.redo')}
          aria-label={translate('common.redo')}
          className="p-3 bg-k-surface/80 border border-panel-border border-panel rounded-sm text-k-text active:bg-fire active:text-k-text"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5"></path>
            <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
          </svg>
        </button>
      </div>

      <div data-viewport-ui className={`absolute right-4 z-20 flex gap-2 ${panelsPresentation === 'overlay' ? 'bottom-3 flex-row' : 'top-6 flex-col'}`}>
        <button
          type="button"
          onClick={(event) => { showFeedback(); event.currentTarget.blur(); }}
          className="h-10 w-10 shrink-0 flex items-center justify-center border border-cream/30 bg-k-surface/85 p-0 text-fire shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 hover:border-fire hover:bg-fire/15 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          title={translate('common.feedback')}
          aria-label={translate('common.feedback')}
        >
          <svg className="shrink-0" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            <path d="M8 9h8" />
            <path d="M8 13h5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(event) => { onToggleGradientAnchors(); event.currentTarget.blur(); }}
          className={`h-10 w-10 shrink-0 flex items-center justify-center border shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${showGradientAnchors
            ? 'border-fire bg-fire/15 text-fire hover:bg-fire/25 hover:border-fire'
            : 'border-cream/30 bg-k-surface/85 text-cream/70 hover:border-fire hover:bg-fire/15 hover:text-k-text'
            }`}
          title={showGradientAnchors ? translate('canvas.hideAnchors') : translate('canvas.showAnchors')}
          aria-label={showGradientAnchors ? translate('canvas.hideAnchors') : translate('canvas.showAnchors')}
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
          onClick={(event) => { onResetViewport(); event.currentTarget.blur(); }}
          className="h-10 w-10 shrink-0 flex items-center justify-center border border-cream/30 bg-k-surface/85 p-0 text-fire shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-all duration-150 hover:border-fire hover:bg-fire/15 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          title={translate('canvas.resetViewport')}
          aria-label={translate('canvas.resetViewport')}
        >
          <Icon name="restart" style={{ fontSize: 16 }} />
        </button>
      </div>

      <div className="canvas-frame relative min-h-0 flex-1 flex items-center justify-center p-2 md:p-6 overflow-visible">
        <EffectStackWorkspace
          sourceCanvasRef={canvasRef}
          hidden={compact || (panelsPresentation === 'overlay' && (showLeftSidebar || showRightSidebar))}
          presentation={toolsPresentation}
          onSelectEffectStack={onSelectEffectStack}
        />
        <div style={{
          position: 'relative',
          width: displayW,
          height: displayH,
          overflow: 'visible',
          transform: compact ? 'none' : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: renderViewMode === 'canvas' || !clothReady ? 1 : 0,
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
              textureImageSource={textureImageSource}
              distortChromaImageSource={distortChromaImageSource}
              disableClothBase={renderViewMode === 'cloth'}
              controlUi={controlUi}
              controlProject={controlProject}
            />
          </div>
          {renderViewMode === 'cloth' && (
            <ClothCanvas
              sourceCanvasRef={canvasRef}
              clothGradient={clothGradient}
              width={canvasW}
              height={canvasH}
              onReady={onClothReady}
              outputCanvasRef={clothCanvasRef}
              exportFrameRendererRef={clothExportFrameRendererRef}
              onUnavailable={onClothUnavailable}
            />
          )}
          {renderViewMode === 'canvas'
            && effectPipeline.version === 'stack-v2'
            && effectPipeline.selectedKind === 'cone'
            && isEffectStackLayerEnabled(effectPipeline, 'cone') && (
              <ConeApexEditor width={displayW} height={displayH} visible={!compact && showGradientAnchors} />
          )}
          <DistortOverlay
            active={!compact && renderViewMode === 'canvas' && leftTab === 'postprocess' && postprocess.effectMode === 'distort' && (
              effectPipeline.version === 'stack-v2'
                ? isEffectStackLayerEnabled(effectPipeline, 'distort')
                : isPostprocessLayerEnabled(postprocess, 'distort')
            )}
            width={displayW}
            height={displayH}
            canvasW={canvasW}
            canvasH={canvasH}
            manualDistort={postprocess}
            setManualDistort={setManualDistort}
          />
          <PostprocessOverlay
            active={!compact && renderViewMode === 'canvas' && leftTab === 'postprocess'}
            width={displayW}
            height={displayH}
            postprocess={postprocess}
            effectPipeline={effectPipeline}
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
          <GradientAnchorEditor width={displayW} height={displayH} visible={!compact && showGradientAnchors} />
          {!compact && renderViewMode === 'canvas' && <SlitOverlay width={displayW} height={displayH} canvasW={canvasW} canvasH={canvasH} />}
        </div>
        {clothUnavailable && (
          <div
            role="status"
            className="absolute right-4 top-20 z-30 max-w-[280px] border border-amber-300/30 bg-[#1b1715]/92 px-3 py-2 text-[10px] leading-relaxed text-amber-100 shadow-[0_14px_30px_rgba(0,0,0,0.32)]"
          >
            {translate('canvas.clothUnavailable')}
          </div>
        )}
        <div
          data-viewport-ui
          className="absolute right-4 bottom-4 w-[220px] max-h-[calc(100%-32px)] bg-k-bg/98 border border-panel-border/70 z-30 overflow-y-auto p-3 scrollbar-thin shadow-[0_18px_48px_rgba(0,0,0,0.35)]"
          style={{ display: (showTimeRemap && exportProgress === null) ? 'block' : 'none' }}
        >
          <button
            type="button"
            className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center bg-transparent text-tab-inactive hover:text-fire transition-colors"
            onClick={onCloseTimeRemap}
            title={translate('common.close')}
            aria-label={translate('common.close')}
          >
            <Icon name="close" className="text-[12px]" />
          </button>
          <BezierEasingEditor compact />
        </div>
      </div>
    </div>
  );
}
