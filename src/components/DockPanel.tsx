import type { CSSProperties, PointerEventHandler, ReactNode } from 'react';
import { PanelEdgeToggle } from './PanelEdgeToggle';

export type DockPanelSide = 'left' | 'right';

type DockPanelStyle = CSSProperties & {
  '--dock-panel-width': string;
  '--dock-panel-mobile-width': string;
};

type DockPanelProps = {
  id: string;
  side: DockPanelSide;
  title: string;
  open: boolean;
  mobileOpen: boolean;
  width: number;
  onOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
  onResizeStart: PointerEventHandler<HTMLDivElement>;
  resizing?: boolean;
  children: ReactNode;
  headerEnd?: ReactNode;
  bodyClassName?: string;
  mobileWidth?: string;
};

const SIDE_STYLES = {
  left: {
    root: 'left-0',
    mobileTransform: '-translate-x-full',
    border: 'border-r',
    resize: '-right-1.5',
  },
  right: {
    root: 'right-0',
    mobileTransform: 'translate-x-full',
    border: 'border-l',
    resize: '-left-1.5',
  },
} satisfies Record<DockPanelSide, Record<string, string>>;

/**
 * Shared shell for workspace side panels.
 *
 * Panel content, header actions, widths, and docking side are data-driven so
 * layout experiments do not need another copy of the open/close/resize logic.
 */
export function DockPanel({
  id,
  side,
  title,
  open,
  mobileOpen,
  width,
  onOpenChange,
  onMobileOpenChange,
  onResizeStart,
  resizing = false,
  children,
  headerEnd,
  bodyClassName = '',
  mobileWidth = 'min(90vw, 400px)',
}: DockPanelProps) {
  const styles = SIDE_STYLES[side];
  const panelStyle: DockPanelStyle = {
    '--dock-panel-width': `${open ? width : 0}px`,
    '--dock-panel-mobile-width': mobileWidth,
  };

  const handleToggle = () => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      onOpenChange(!open);
      return;
    }
    onMobileOpenChange(!mobileOpen);
  };

  return (
    <aside
      id={id}
      className={`
        ${styles.root}
        ${mobileOpen ? 'translate-x-0' : styles.mobileTransform}
        fixed top-0 z-30 h-full w-[var(--dock-panel-mobile-width)] shrink-0
        transition-[width,transform] duration-300 ease-in-out
        md:relative md:z-10 md:w-[var(--dock-panel-width)] md:translate-x-0
      `}
      style={panelStyle}
      aria-label={title}
    >
      <div
        className={`
          ${styles.border}
          ${open ? 'md:opacity-100 md:pointer-events-auto' : 'md:opacity-0 md:pointer-events-none'}
          flex h-full w-full flex-col overflow-hidden border-panel-border bg-k-surface shadow-xl
          transition-opacity duration-200
        `}
      >
        <div
          className={`
            ${styles.resize}
            ${resizing ? 'bg-fire/40 shadow-[0_0_18px_rgba(209,20,2,0.55)]' : 'hover:bg-fire/40'}
            absolute bottom-0 top-0 z-20 hidden w-3 cursor-col-resize touch-none transition-colors md:block
          `}
          onPointerDown={onResizeStart}
          aria-hidden="true"
        />

        <header className="flex min-h-13 shrink-0 items-center gap-3 border-b border-panel-border bg-k-bg px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-[10px] font-display font-semibold uppercase tracking-widest text-k-text">
            {title}
          </span>
          {headerEnd}
        </header>

        <div className={`min-h-0 flex-1 ${bodyClassName}`}>
          {children}
        </div>
      </div>

      <PanelEdgeToggle
        edge={side}
        open={open}
        panelTitle={title}
        controlsId={id}
        onToggle={handleToggle}
        className={mobileOpen ? 'flex' : 'hidden md:flex'}
      />
    </aside>
  );
}
