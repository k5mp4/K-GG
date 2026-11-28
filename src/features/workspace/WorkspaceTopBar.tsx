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
  onLayoutModeChange: (mode: VjSettings['layoutMode']) => void;
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
  layoutMode,
  gpuInfo,
  updater,
  translate,
  getTabEnabled,
  onTabClick,
  onTabMouseEnter,
  onUndo,
  onRedo,
  onLayoutModeChange,
  onOpenSettings,
  onToggleRightSidebar,
}: WorkspaceTopBarProps) {
  const editing = isLayerTab(leftTab);
  const isPresetSelected = leftTab === 'preset';
  const presetDisplayName = presetName.trim() || translate('common.custom');
  const presetStatusTitle = isDirty
    ? `${presetDisplayName} · ${translate('workspace.unsavedChanges')}`
    : presetDisplayName;

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

      {/* 中央ゾーン: Undo/Redo */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
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
      </div>

      {/* 右ゾーン: Editor/VJ 切替・GPU・更新・設定 */}
      <div className="ml-auto flex h-10 shrink-0 items-stretch gap-1">
        {/* LayoutModeSwitch always sets inline-flex, which would override a passed `hidden`. */}
        <div className={panelsPresentation === 'docked' ? 'flex' : 'hidden'}>
          <LayoutModeSwitch
            layoutMode={layoutMode}
            onChange={onLayoutModeChange}
            translate={translate}
          />
        </div>

        <div
          className={`${panelsPresentation === 'docked' ? 'hidden xl:flex' : 'hidden'} min-w-0 max-w-[150px] items-center gap-2 px-2.5 text-tab-inactive`}
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
          onClick={(event) => { onOpenSettings(); blur(event); }}
          className={`inline-flex min-w-10 items-center justify-center gap-2 border px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${tabHoverSwitchEnabled
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
