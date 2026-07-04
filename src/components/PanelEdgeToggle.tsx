import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type PanelEdge = 'left' | 'right' | 'bottom';

type PanelEdgeToggleProps = {
  edge: PanelEdge;
  open: boolean;
  panelTitle: string;
  controlsId: string;
  onToggle: () => void;
  children?: ReactNode;
  className?: string;
};

const EDGE_STYLES = {
  left: {
    hotspot: 'top-1/2 -right-[38px] h-30 w-11 -translate-y-1/2',
    button: 'absolute left-1.5 top-3 h-24 w-8',
    border: 'border-y border-r',
    color: 'text-fire hover:bg-fire/15',
    shadow: 'shadow-[8px_0_26px_rgba(0,0,0,0.24)]',
    openIcon: 'chevronLeft',
    closedIcon: 'chevronRight',
  },
  right: {
    hotspot: 'top-1/2 -left-[38px] h-30 w-11 -translate-y-1/2',
    button: 'absolute right-1.5 top-3 h-24 w-8',
    border: 'border-y border-l',
    color: 'text-deep hover:bg-deep/15 hover:text-cream',
    shadow: 'shadow-[-8px_0_26px_rgba(0,0,0,0.24)]',
    openIcon: 'chevronRight',
    closedIcon: 'chevronLeft',
  },
  bottom: {
    hotspot: 'bottom-full left-1/2 h-10 w-40 -translate-x-1/2',
    button: 'absolute bottom-0 left-1/2 h-8 min-w-36 -translate-x-1/2 px-4',
    border: 'border-x border-t',
    color: 'text-fire hover:bg-fire/15',
    shadow: 'shadow-[0_-8px_26px_rgba(0,0,0,0.24)]',
    openIcon: 'chevronDown',
    closedIcon: 'chevronUp',
  },
} satisfies Record<PanelEdge, {
  hotspot: string;
  button: string;
  border: string;
  color: string;
  shadow: string;
  openIcon: IconName;
  closedIcon: IconName;
}>;

/**
 * A panel toggle anchored to its panel boundary. The same control stays in
 * place for both opening and closing, regardless of the panel's dock edge.
 */
export function PanelEdgeToggle({
  edge,
  open,
  panelTitle,
  controlsId,
  onToggle,
  children,
  className = 'flex',
}: PanelEdgeToggleProps) {
  const styles = EDGE_STYLES[edge];
  const action = open ? '閉じる' : '開く';
  const englishAction = open ? 'Close' : 'Open';
  const stateStyle = open
    ? 'border-transparent bg-transparent opacity-100 shadow-none backdrop-blur-none group-hover/edge-toggle:bg-k-surface/65 group-focus-within/edge-toggle:bg-k-surface/65 hover:border-panel-border focus-visible:border-panel-border'
    : `border-transparent bg-k-surface/95 opacity-100 backdrop-blur-sm hover:border-panel-border focus-visible:border-panel-border ${styles.shadow}`;
  const detailsStyle = open
    ? 'opacity-0 group-hover/edge-toggle:opacity-100 group-focus-within/edge-toggle:opacity-100'
    : 'opacity-100';

  return (
    <div
      className={`
        ${styles.hotspot}
        ${className}
        group/edge-toggle absolute z-40
      `}
    >
      <button
        type="button"
        onClick={(event) => {
          onToggle();
          event.currentTarget.blur();
        }}
        className={`
          ${styles.button}
          ${styles.border}
          ${styles.color}
          ${stateStyle}
          flex items-center justify-center gap-2 p-0
          transition-[background-color,border-color,color,opacity,box-shadow] duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-fire
        `}
        title={`${panelTitle}を${action}`}
        aria-label={`${englishAction} ${panelTitle}`}
        aria-controls={controlsId}
        aria-expanded={open}
      >
        <Icon name={open ? styles.openIcon : styles.closedIcon} className="text-[20px]" />
        {children && (
          <span className={`inline-flex items-center gap-2 transition-opacity duration-150 ${detailsStyle}`}>
            {children}
          </span>
        )}
      </button>
    </div>
  );
}
