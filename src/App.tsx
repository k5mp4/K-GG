import './App.css';
import { useEffect } from 'react';
import { NoiseDistortionPanel } from './components/NoiseDistortionPanel';
import { DiffusePanel } from './components/BlockNoisePanel';
import { ExportPanel } from './components/ExportPanel';
import { SlitScanPanel } from './components/SlitScanPanel';
import { PresetPanel } from './components/PresetPanel';
import { SandboxPanel } from './components/SandboxPanel';
import { PostprocessPanel } from './components/PostprocessPanel';
import { GradientRamp } from './components/GradientRamp';
import { ImageGradientSourcePanel } from './components/ImageGradientSourcePanel';
import { SliderField } from './components/SliderField';
import { HelpPanel } from './components/HelpPanel';
import { FeedbackPanel } from './components/FeedbackPanel';
import { PropertyModulesSettingsPanel } from './components/PropertyModulesSettingsPanel';
import { InteractionSettingsProvider } from './components/InteractionSettingsContext';
import { DockPanel } from './components/DockPanel';
import { SidebarSection } from './components/SidebarSection';
import { IconButton } from './components/IconButton';
import { useLanguage } from './i18n/LanguageProvider';
import { UpdateDialog } from './features/updater/UpdateDialog';
import { FfmpegSetupDialog } from './components/FfmpegSetupDialog';
import { LEFT_TABS, TAB_ANIMATION_PREFIX } from './features/workspace/tabs';
import { WorkspaceTopBar } from './features/workspace/WorkspaceTopBar';
import { TimelineWorkspace } from './features/workspace/TimelineWorkspace';
import { CanvasWorkspace } from './features/workspace/CanvasWorkspace';
import { useWorkspaceController } from './features/workspace/useWorkspaceController';
import { disposePresetThumbnailRenderer } from './lib/presetThumbnail';

export default function App() {
  useEffect(() => () => {
    void disposePresetThumbnailRenderer();
  }, []);

  const { t } = useLanguage();
  const {
    updater,
    animation,
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
    tabHoverSwitchEnabled,
    setTabHoverSwitchMode,
    isHoverLocked,
    showTimeline,
    showTimeRemap,
    timelineHeight,
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
    renderViewMode,
    clothReady,
    coneReady,
    leftPanelW,
    rightPanelW,
    activeResizeSide,
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
    exportProgress,
    setExportProgress,
    exportStage,
    setExportStage,
    panelsContainerRef,
    canvasWorkspaceProps,
    getTabEnabled,
    handleTabClick,
    handleTabMouseEnter,
    handlePanelResizeStart,
    handleTimelineResizeStart,
    handleRenderViewModeChange,
    handlePresetLoad,
    handleCanvasResize,
    handleToggleRightSidebar,
    handleSlitSourceImageLoad,
    handleSlitSourceImageClear,
    handleImageGradientSourceLoad,
    handleImageGradientSourceClear,
    handleSeek,
    handleTimelineToggle,
    handleTimeRemapToggle,
    handleShowHelp,
  } = useWorkspaceController({ translate: t });

  return (
    <InteractionSettingsProvider value={{ hoverInteractionsEnabled: tabHoverSwitchEnabled }}>
      <div className="h-[100dvh] text-k-text flex flex-col overflow-hidden relative">
        <WorkspaceTopBar
          leftTab={leftTab}
          tabHoverSwitchEnabled={tabHoverSwitchEnabled}
          isHoverLocked={isHoverLocked}
          showRightSidebar={showRightSidebar}
          tabs={LEFT_TABS}
          gpuInfo={gpuInfo}
          updater={updater}
          translate={t}
          getTabEnabled={getTabEnabled}
          onTabClick={handleTabClick}
          onTabMouseEnter={handleTabMouseEnter}
          onOpenSettings={() => setShowPropertyModulesSettings(true)}
          onToggleRightSidebar={handleToggleRightSidebar}
        />

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
            onResizeStart={(event) => handlePanelResizeStart('left', event)}
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
                        onSourceImageLoad={handleSlitSourceImageLoad}
                        onSourceImageClear={handleSlitSourceImageClear}
                      />
                    )}
                    {value === 'sandbox' && (
                      <SandboxPanel
                        renderViewMode={renderViewMode}
                        onRenderViewModeChange={handleRenderViewModeChange}
                      />
                    )}
                    {value === 'postprocess' && <PostprocessPanel />}
                    {value === 'export' && (
                      <ExportPanel
                        onExportProgress={setExportProgress}
                        onExportStage={setExportStage}
                        onResizeCanvas={handleCanvasResize}
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
                        onPresetLoad={handlePresetLoad}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DockPanel>

          {/* プレビューエリア */}
          <CanvasWorkspace {...canvasWorkspaceProps} />

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
            onResizeStart={(event) => handlePanelResizeStart('right', event)}
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
                  onClick={handleShowHelp}
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
                      onClick={clearOverlayImage}
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
                  onSourceImageLoad={handleImageGradientSourceLoad}
                  onSourceImageClear={handleImageGradientSourceClear}
                />
              </SidebarSection>
            </div>
          </DockPanel>
        </div>
        {/* TimelineWorkspace sits below the sidebars so sidebar resizing does not change its footprint. */}
        <TimelineWorkspace
          isOpen={showTimeline}
          height={timelineHeight}
          animationEnabled={animation.enabled}
          showTimeRemap={showTimeRemap}
          exportProgress={exportProgress}
          exportStage={exportStage}
          selectedEffectPrefix={TAB_ANIMATION_PREFIX[leftTab]}
          animLoopRef={animLoopRef}
          translate={t}
          onSeek={handleSeek}
          onToggleTimeRemap={handleTimeRemapToggle}
          onToggle={handleTimelineToggle}
          onResizeStart={handleTimelineResizeStart}
        />
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
          onClose={closeFfmpegDialog}
          onCheckAgain={() => void refreshFfmpegStatus(true)}
          onOpenBuildsPage={handleOpenBuildsPage}
          onOpenFolder={handleOpenFolder}
        />
      </div>
    </InteractionSettingsProvider>
  );
}
