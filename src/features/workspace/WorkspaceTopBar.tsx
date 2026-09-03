import type { MouseEvent } from 'react';
import { Icon } from '../../components/Icon';
import { UpdateButton } from '../updater/UpdateButton';
import type { UpdateState } from '../updater/types';
import type { MessageKey } from '../../i18n/messages';
import type { Replacements } from '../../i18n/language';
import type { LeftTab, LeftTabDefinition } from './tabs';

export type WorkspaceTopBarProps = {
  leftTab: LeftTab;
  tabHoverSwitchEnabled: boolean;
  isHoverLocked: boolean;
  showRightSidebar: boolean;
  tabs: readonly LeftTabDefinition[];
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
  onOpenSettings: () => void;
  onToggleRightSidebar: () => void;
};

function blur(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

function getTabClassName(value: LeftTab, leftTab: LeftTab, tabHoverSwitchEnabled: boolean, isHoverLocked: boolean): string {
  const isPrimary = value === 'diffuse' || value === 'noise' || value === 'slit';
  const isUtility = value === 'export' || value === 'preset';
  const colorClass = isUtility
    ? leftTab === value
      ? 'text-k-text bg-deep/10'
      : 'text-deep/80 hover:text-deep bg-k-bg hover:bg-k-bg'
    : leftTab === value
      ? 'text-k-text bg-fire/10'
      : isPrimary
        ? 'text-fire/70 hover:text-fire hover:bg-k-surface'
        : 'text-tab-inactive/60 hover:text-tab-inactive hover:bg-k-surface';
  const interactionClass = tabHoverSwitchEnabled && isHoverLocked && leftTab !== value
    ? 'cursor-default opacity-80'
    : 'cursor-pointer';
  return `${colorClass} ${interactionClass}`;
}

export function WorkspaceTopBar({
  leftTab,
  tabHoverSwitchEnabled,
  isHoverLocked,
  showRightSidebar,
  tabs,
  gpuInfo,
  updater,
  translate,
  getTabEnabled,
  onTabClick,
  onTabMouseEnter,
  onOpenSettings,
  onToggleRightSidebar,
}: WorkspaceTopBarProps) {
  return (
    <div className="z-30 flex shrink-0 items-center gap-2 border-b border-panel-border bg-k-bg/95 px-2 py-1.5">
      <div className="inline-flex min-w-0 flex-1 bg-k-surface/80 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(({ value, labelKey }) => {
          const enabled = getTabEnabled(value);
          return (
            <button
              key={value}
              onMouseEnter={() => onTabMouseEnter(value)}
              onClick={(event) => { onTabClick(value); blur(event); }}
              className={`h-10 w-[86px] !border-0 px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${getTabClassName(value, leftTab, tabHoverSwitchEnabled, isHoverLocked)}`}
            >
              {translate(labelKey)}
              {enabled !== undefined && (
                <span className={`text-[8px] font-bold leading-none ${enabled ? 'text-emerald-400' : 'text-k-muted'}`}>
                  {enabled ? translate('common.on') : translate('common.off')}
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
          onClick={(event) => { onOpenSettings(); blur(event); }}
          className={`inline-flex min-w-10 items-center justify-center gap-2 border px-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${tabHoverSwitchEnabled
            ? 'border-fire/55 bg-fire/10 text-fire hover:bg-fire/20'
            : 'border-cream/25 bg-k-surface text-tab-inactive hover:border-cream/45 hover:text-k-text'
            }`}
          title={`${translate('settings.title')} · ${tabHoverSwitchEnabled ? translate('settings.hover') : translate('settings.clickOnly')}`}
          aria-label={translate('common.settings')}
        >
          <Icon name="settings" className="text-[16px]" />
          <span className="hidden text-[9px] font-display font-semibold uppercase tracking-wider xl:inline">
            {tabHoverSwitchEnabled ? translate('settings.hover') : translate('settings.clickOnly')}
          </span>
        </button>
      </div>

      <button
        onClick={(event) => { onToggleRightSidebar(); blur(event); }}
        title={translate('panel.toggle', { action: showRightSidebar ? translate('common.close') : translate('common.open'), panel: 'K-GG' })}
        aria-label={translate('panel.toggle', { action: showRightSidebar ? translate('common.close') : translate('common.open'), panel: 'K-GG' })}
        className="md:hidden ml-1 h-10 w-10 bg-k-surface border border-panel-border text-k-text hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
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
