import type { MouseEvent } from 'react';
import { Icon } from '../../components/Icon';
import { UpdateButton } from '../updater/UpdateButton';
import type { UpdateState } from '../updater/types';
import type { VjSettings } from '../vj/vjSettings';
import type { MessageKey } from '../../i18n/messages';
import type { Replacements } from '../../i18n/language';
import { LayoutModeSwitch } from './LayoutModeSwitch';
import { isLayerTab, type LeftTab, type LeftTabDefinition } from './tabs';
import type { PanelPresentation } from './workspaceLayout';

export type WorkspaceTopBarProps = {
  leftTab: LeftTab;
  panelsPresentation: PanelPresentation;
  tabHoverSwitchEnabled: boolean;
  isHoverLocked: boolean;
  showRightSidebar: boolean;
  /** Mode tabs; Effect Stack layers are reached from the Layers column. */
  tabs: readonly LeftTabDefinition[];
  /** The layer being edited, shown as the entry back to its properties. */
  editingLayer: { label: string; tab: LeftTab };
  presetName: string;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  animationEnabled: boolean;
  isAnimationPlaying: boolean;
  exportProgress: number | null;
  spoutActive: boolean;
  oscPort: number | null;
  zoom: number;
  viewportModified: boolean;
  canCopyPng: boolean;
  quickExportFeedback: 'saved' | 'copied' | null;
  layoutMode: VjSettings['layoutMode'];
  gpuInfo: { label: string; title: string };
  updater: {
    supported: boolean;
    state: UpdateState;
    openDialog: () => void;
  };
  translate: (key: MessageKey, params?: Replacements) => string;
  getTabEnabled: (value: LeftTab) => boolean | undefined;
  onTabClick: (value: LeftTab) => void;
  onTabMouseEnter: (value: LeftTab) => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePlayback: () => void;
  onResetViewport: () => void;
  onQuickSavePng: () => void;
  onQuickCopyPng: () => void;
  onLayoutModeChange: (mode: VjSettings['layoutMode']) => void;
  onOpenFeedback: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onToggleRightSidebar: () => void;
};

function blur(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

function getInteractionClassName(active: boolean, tabHoverSwitchEnabled: boolean, isHoverLocked: boolean): string {
  return tabHoverSwitchEnabled && isHoverLocked && !active ? 'cursor-default opacity-80' : 'cursor-pointer';
}

function getTabClassName(value: LeftTab, leftTab: LeftTab, tabHoverSwitchEnabled: boolean, isHoverLocked: boolean): string {
  const isUtility = value === 'export' || value === 'preset';
  const colorClass = isUtility
    ? leftTab === value
      ? 'text-k-text bg-deep/10'
      : 'text-deep/80 hover:text-deep bg-transparent hover:bg-k-surface/60'
    : leftTab === value
      ? 'text-k-text bg-fire/10'
      : 'text-tab-inactive/60 hover:text-tab-inactive bg-k-surface/80 hover:bg-k-surface';
  return `${colorClass} ${getInteractionClassName(leftTab === value, tabHoverSwitchEnabled, isHoverLocked)}`;
}

export function WorkspaceTopBar({
  leftTab,
  panelsPresentation,
  tabHoverSwitchEnabled,
  isHoverLocked,
  showRightSidebar,
  tabs,
  editingLayer,
  presetName,
  isDirty,
  canUndo,
  canRedo,
  animationEnabled,
  isAnimationPlaying,
  exportProgress,
  spoutActive,
  oscPort,
  zoom,
  viewportModified,
  canCopyPng,
  quickExportFeedback,
  layoutMode,
  gpuInfo,
  updater,
  translate,
  getTabEnabled,
  onTabClick,
  onTabMouseEnter,
  onUndo,
  onRedo,
  onTogglePlayback,
  onResetViewport,
  onQuickSavePng,
  onQuickCopyPng,
  onLayoutModeChange,
  onOpenFeedback,
  onOpenHelp,
  onOpenSettings,
  onToggleRightSidebar,
}: WorkspaceTopBarProps) {
  const editing = isLayerTab(leftTab);
  const isPresetSelected = leftTab === 'preset';
  const presetDisplayName = presetName.trim() || translate('common.custom');
  const presetStatusTitle = isDirty
    ? `${presetDisplayName} · ${translate('workspace.unsavedChanges')}`
    : presetDisplayName;
  const exportPercent = exportProgress === null ? null : Math.max(0, Math.min(100, Math.round(exportProgress * 100)));
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="z-30 flex min-w-0 shrink-0 items-center gap-2 border-b border-panel-border bg-k-bg/95 px-2 py-1.5">
      <nav aria-label={translate('settings.title')} className="inline-flex min-w-0 shrink items-center bg-transparent overflow-x-auto scrollbar-thin scroll-smooth">
        <button
          type="button"
          data-editing-layer
          onMouseEnter={() => { if (panelsPresentation === 'docked') onTabMouseEnter(editingLayer.tab); }}
          aria-pressed={editing}
          aria-controls="property-modules-panel"
          aria-label={`${translate('workspace.editingLayer')}: ${editingLayer.label}`}
          onClick={(event) => { onTabClick(editingLayer.tab); if (panelsPresentation === 'docked') blur(event); }}
          className={`mr-1 flex h-10 min-w-[132px] max-w-[200px] shrink-0 flex-col items-start justify-center gap-0.5 !border-0 px-3 py-1 text-left font-display uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${editing ? 'bg-fire/10 text-k-text' : 'bg-k-surface/80 text-fire/80 hover:bg-k-surface hover:text-fire'} ${getInteractionClassName(editing, tabHoverSwitchEnabled, isHoverLocked)}`}
        >
          <span className="text-[9px] font-semibold leading-none text-tab-inactive">{translate('workspace.editingLayer')}</span>
          <span className="w-full truncate text-[11px] font-bold leading-tight">{editingLayer.label}</span>
        </button>
        {tabs.map(({ value, labelKey }) => {
          const enabled = getTabEnabled(value);
          const isPresetTab = value === 'preset';
          const button = (
            <button
              key={value}
              type="button"
              onMouseEnter={() => { if (panelsPresentation === 'docked') onTabMouseEnter(value); }}
              aria-pressed={leftTab === value}
              aria-controls="property-modules-panel"
              title={isPresetTab ? presetStatusTitle : undefined}
              onClick={(event) => { onTabClick(value); if (panelsPresentation === 'docked') blur(event); }}
              className={`h-10 w-[86px] !border-0 px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${getTabClassName(value, leftTab, tabHoverSwitchEnabled, isHoverLocked)}`}
            >
              <span>{translate(labelKey)}</span>
              {enabled !== undefined && (
                <span className={`text-[8px] font-bold leading-none ${enabled ? 'text-emerald-400' : 'text-k-muted'}`}>
                  {enabled ? translate('common.on') : translate('common.off')}
                </span>
              )}
            </button>
          );

          if (!isPresetTab) return button;

          return (
            <div key={value} className="inline-flex shrink-0 items-stretch">
              {button}
              <button
                type="button"
                data-current-preset
                data-active={isPresetSelected ? 'true' : 'false'}
                data-dirty={isDirty ? 'true' : 'false'}
                onMouseEnter={() => { if (panelsPresentation === 'docked') onTabMouseEnter('preset'); }}
                onClick={(event) => { onTabClick('preset'); if (panelsPresentation === 'docked') blur(event); }}
                title={presetStatusTitle}
                aria-label={`${translate('workspace.currentPreset')}: ${presetStatusTitle}`}
                className={`hidden sm:flex h-10 max-w-[200px] shrink-0 items-center !border-0 border-l border-cream/10 px-3 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${isPresetSelected
                  ? 'bg-deep/10 text-k-text'
                  : 'bg-transparent text-tab-inactive hover:bg-k-surface/60 hover:text-k-text'
                  } ${getInteractionClassName(isPresetSelected, tabHoverSwitchEnabled, isHoverLocked)}`}
              >
                <div
                  key={`${presetDisplayName}-${isPresetSelected ? 'active' : 'idle'}`}
                  className={`min-w-0 flex flex-col justify-center gap-0.5 whitespace-nowrap ${isPresetSelected ? 'kgg-preset-slide-in' : ''}`}
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-[9px] font-display font-semibold uppercase tracking-wider leading-none text-tab-inactive">
                    <span>{translate('workspace.currentPreset')}</span>
                    {isDirty && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-fire"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="block truncate whitespace-nowrap text-[11px] font-semibold leading-tight text-k-text">
                    {presetDisplayName}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* 中央ゾーン: Undo/Redo・再生・アンビエント状態表示 */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <div
          className={`${panelsPresentation === 'docked' ? 'inline-flex' : 'hidden'} h-10 shrink-0 items-center bg-k-surface/80`}
          role="group"
          aria-label={`${translate('common.undo')} / ${translate('common.redo')}`}
        >
          <button
            type="button"
            disabled={!canUndo}
            onClick={(event) => { onUndo(); blur(event); }}
            title={`${translate('common.undo')} (Ctrl+Z)`}
            aria-label={translate('common.undo')}
            className="inline-flex h-10 w-9 items-center justify-center !border-0 bg-transparent text-k-text transition-colors hover:bg-k-surface hover:text-cream disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <Icon name="undo" className="text-[15px]" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={(event) => { onRedo(); blur(event); }}
            title={`${translate('common.redo')} (Ctrl+Y)`}
            aria-label={translate('common.redo')}
            className="inline-flex h-10 w-9 items-center justify-center !border-0 bg-transparent text-k-text transition-colors hover:bg-k-surface hover:text-cream disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <Icon name="redo" className="text-[15px]" />
          </button>
        </div>

        <button
          type="button"
          data-topbar-playback
          aria-pressed={isAnimationPlaying}
          onClick={(event) => { onTogglePlayback(); blur(event); }}
          title={isAnimationPlaying ? translate('animation.pause') : translate('animation.play')}
          aria-label={isAnimationPlaying ? translate('animation.pause') : translate('animation.play')}
          className={`${panelsPresentation === 'docked' ? 'inline-flex' : 'hidden'} relative h-10 w-10 shrink-0 items-center justify-center !border-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${isAnimationPlaying
            ? 'bg-fire/15 text-fire hover:bg-fire/25'
            : 'bg-k-surface/80 text-k-text hover:bg-k-surface hover:text-cream'
            }`}
        >
          <Icon name={isAnimationPlaying ? 'pause' : 'play'} className="text-[15px]" />
          {animationEnabled && (
            <span
              className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${isAnimationPlaying ? 'bg-fire' : 'bg-emerald-400'}`}
              aria-hidden="true"
            />
          )}
        </button>

        {exportPercent !== null && (
          <button
            type="button"
            data-ambient-status="export"
            onClick={(event) => { onTabClick('export'); blur(event); }}
            title={translate('workspace.exportingStatus', { percent: exportPercent })}
            aria-label={translate('workspace.exportingStatus', { percent: exportPercent })}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 !border-0 bg-fire/15 px-2.5 text-[10px] font-display font-bold uppercase tracking-wider tabular-nums text-cream transition-colors hover:bg-fire/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-fire animate-pulse" aria-hidden="true" />
            <span>EXPORT {exportPercent}%</span>
          </button>
        )}

        {spoutActive && (
          <button
            type="button"
            data-ambient-status="spout"
            onClick={(event) => { onTabClick('export'); blur(event); }}
            title={translate('workspace.spoutLive')}
            aria-label={translate('workspace.spoutLive')}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 !border-0 bg-emerald-500/15 px-2.5 text-[10px] font-display font-bold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>SPOUT</span>
          </button>
        )}

        {oscPort !== null && (
          <button
            type="button"
            data-ambient-status="osc"
            onClick={(event) => { onTabClick('sandbox'); blur(event); }}
            title={translate('workspace.oscListening', { port: oscPort })}
            aria-label={translate('workspace.oscListening', { port: oscPort })}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 !border-0 bg-cyan-500/15 px-2.5 text-[10px] font-display font-bold uppercase tracking-wider tabular-nums text-cyan-300 transition-colors hover:bg-cyan-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
            <span>OSC</span>
          </button>
        )}
      </div>

      {/* 右ゾーン: ズーム・クイック書き出し・Editor/VJ切替・GPU・更新・ユーティリティ */}
      <div className="ml-auto flex h-10 shrink-0 items-stretch gap-1">
        <button
          type="button"
          data-topbar-zoom
          onClick={(event) => { onResetViewport(); blur(event); }}
          title={translate('canvas.resetViewport')}
          aria-label={`${translate('canvas.resetViewport')} (${zoomPercent}%)`}
          className={`${panelsPresentation === 'docked' ? 'inline-flex' : 'hidden'} h-10 min-w-[54px] shrink-0 items-center justify-center !border-0 px-2 text-[10px] font-display font-semibold tracking-wider tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${viewportModified
            ? 'bg-fire/10 text-cream hover:bg-fire/20'
            : 'bg-k-surface/80 text-tab-inactive hover:bg-k-surface hover:text-k-text'
            }`}
        >
          {zoomPercent}%
        </button>

        <div
          className={`${panelsPresentation === 'docked' ? 'inline-flex' : 'hidden'} h-10 shrink-0 items-center bg-k-surface/80`}
          role="group"
          aria-label={translate('workspace.quickSavePng')}
        >
          <button
            type="button"
            data-quick-save-png
            onClick={(event) => { onQuickSavePng(); blur(event); }}
            title={quickExportFeedback === 'saved' ? translate('workspace.quickExportSaved') : translate('workspace.quickSavePng')}
            aria-label={quickExportFeedback === 'saved' ? translate('workspace.quickExportSaved') : translate('workspace.quickSavePng')}
            className={`inline-flex h-10 w-9 items-center justify-center !border-0 bg-transparent transition-colors hover:bg-k-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${quickExportFeedback === 'saved' ? 'text-emerald-400' : 'text-k-text hover:text-cream'}`}
          >
            <Icon name={quickExportFeedback === 'saved' ? 'verified' : 'download'} className="text-[15px]" />
          </button>
          {canCopyPng && (
            <button
              type="button"
              data-quick-copy-png
              onClick={(event) => { onQuickCopyPng(); blur(event); }}
              title={quickExportFeedback === 'copied' ? translate('workspace.quickExportCopied') : translate('workspace.quickCopyPng')}
              aria-label={quickExportFeedback === 'copied' ? translate('workspace.quickExportCopied') : translate('workspace.quickCopyPng')}
              className={`inline-flex h-10 w-9 items-center justify-center !border-0 bg-transparent transition-colors hover:bg-k-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${quickExportFeedback === 'copied' ? 'text-emerald-400' : 'text-k-text hover:text-cream'}`}
            >
              <Icon name={quickExportFeedback === 'copied' ? 'verified' : 'copy'} className="text-[15px]" />
            </button>
          )}
        </div>

        <LayoutModeSwitch
          layoutMode={layoutMode}
          onChange={onLayoutModeChange}
          translate={translate}
          className={panelsPresentation === 'docked' ? 'inline-flex' : 'hidden'}
        />

        <div
          className={`${panelsPresentation === 'docked' ? 'hidden 2xl:flex' : 'hidden'} min-w-0 max-w-[140px] items-center gap-2 px-2 text-tab-inactive`}
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
          onClick={(event) => { onOpenFeedback(); blur(event); }}
          className="inline-flex min-w-9 items-center justify-center border border-transparent bg-transparent px-2 text-tab-inactive transition-colors hover:bg-k-surface hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          title={translate('common.feedback')}
          aria-label={translate('common.feedback')}
        >
          <Icon name="feedback" className="text-[16px]" />
        </button>
        <button
          type="button"
          onClick={(event) => { onOpenHelp(); blur(event); }}
          className="inline-flex min-w-9 items-center justify-center border border-transparent bg-transparent px-2 text-tab-inactive transition-colors hover:bg-k-surface hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
          title={translate('common.help')}
          aria-label={translate('common.help')}
        >
          <Icon name="help" className="text-[16px]" />
        </button>
        <button
          type="button"
          onClick={(event) => { onOpenSettings(); blur(event); }}
          className={`inline-flex min-w-9 items-center justify-center gap-2 border px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${tabHoverSwitchEnabled
            ? 'border-transparent bg-fire/10 text-fire hover:bg-fire/20'
            : 'border-transparent bg-transparent text-tab-inactive hover:bg-k-surface hover:text-k-text'
            }`}
          title={`${translate('settings.title')} · ${tabHoverSwitchEnabled ? translate('settings.hover') : translate('settings.clickOnly')}`}
          aria-label={translate('common.settings')}
        >
          <Icon name="settings" className="text-[16px]" />
        </button>
      </div>

      <button
        onClick={onToggleRightSidebar}
        title={translate('panel.toggle', { action: showRightSidebar ? translate('common.close') : translate('common.open'), panel: 'K-GG' })}
        aria-label={translate('panel.toggle', { action: showRightSidebar ? translate('common.close') : translate('common.open'), panel: 'K-GG' })}
        aria-controls="gradient-settings-panel"
        aria-expanded={showRightSidebar}
        className={`${panelsPresentation === 'overlay' ? 'block' : 'hidden'} ml-1 h-10 w-10 shrink-0 p-0 bg-k-surface border border-transparent text-k-text hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-fire`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
