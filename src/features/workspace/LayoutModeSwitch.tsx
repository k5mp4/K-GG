import type { MouseEvent } from 'react';
import type { VjSettings } from '../vj/vjSettings';
import type { MessageKey } from '../../i18n/messages';
import type { Replacements } from '../../i18n/language';

export type LayoutModeSwitchProps = {
  layoutMode: VjSettings['layoutMode'];
  onChange: (mode: VjSettings['layoutMode']) => void;
  translate: (key: MessageKey, params?: Replacements) => string;
  size?: 'default' | 'compact';
  className?: string;
};

function blur(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

export function LayoutModeSwitch({
  layoutMode,
  onChange,
  translate,
  size = 'default',
  className = '',
}: LayoutModeSwitchProps) {
  const isCompact = size === 'compact';
  return (
    <div
      role="radiogroup"
      data-layout-mode-switch
      aria-label={translate('settings.layout')}
      className={`inline-flex shrink-0 items-center bg-k-surface/80 p-0.5 ${isCompact ? 'h-7' : 'h-10'} ${className}`}
    >
      {(['editor', 'vj'] as const).map(mode => {
        const active = layoutMode === mode;
        const label = translate(mode === 'editor' ? 'workspace.editorShort' : 'workspace.vjShort');
        const fullLabel = translate(mode === 'editor' ? 'settings.editorLayout' : 'settings.vjLayout');
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={fullLabel}
            title={fullLabel}
            onClick={(event) => { onChange(mode); blur(event); }}
            className={`${isCompact ? 'h-6 min-w-[40px] px-2 text-[10px]' : 'h-9 min-w-[44px] px-2.5 text-[10px]'} !border-0 font-display font-bold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${active
              ? 'bg-fire/15 text-cream'
              : 'bg-transparent text-tab-inactive hover:bg-k-surface hover:text-k-text'
              }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
