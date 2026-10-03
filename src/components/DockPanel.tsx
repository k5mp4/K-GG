import { useEffect, useRef, type CSSProperties, type PointerEventHandler, type ReactNode } from 'react';
import { PanelEdgeToggle } from './PanelEdgeToggle';
import { useLanguage } from '../i18n/LanguageProvider';
import type { PanelPresentation } from '../features/workspace/workspaceLayout';

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
  bodyClassName?: string;
  mobileWidth?: string;
  presentation: PanelPresentation;
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
  bodyClassName = '',
  mobileWidth = 'min(90vw, 400px)',
  presentation,
}: DockPanelProps) {
  const { t } = useLanguage();
  const bodyRef = useRef<HTMLDivElement>(null);
  const overlay = presentation === 'overlay';
  const visible = overlay ? mobileOpen : open;
  const styles = SIDE_STYLES[side];
  const panelStyle: DockPanelStyle = {
    '--dock-panel-width': `${open ? width : 0}px`,
    '--dock-panel-mobile-width': mobileWidth,
  };

  const handleToggle = () => {
    if (!overlay) {
      onOpenChange(!open);
      return;
    }
    onMobileOpenChange(!mobileOpen);
  };

  useEffect(() => {
    if (!overlay || !visible) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = bodyRef.current;
    body?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      if (body?.contains(document.activeElement) || document.activeElement === document.body) previous?.focus({ preventScroll: true });
    };
  }, [overlay, visible]);

  return (
    <aside
      id={id}
      className={`
        ${styles.root}
        ${overlay ? `absolute top-0 z-40 w-[var(--dock-panel-mobile-width)] ${visible ? 'translate-x-0' : styles.mobileTransform}` : 'relative z-10 w-[var(--dock-panel-width)]'}
        h-full min-h-0 shrink-0
        transition-[width,transform] duration-300 ease-in-out
        motion-reduce:transition-none
      `}
      style={panelStyle}
      aria-label={title}
      data-presentation={presentation}
      onKeyDown={event => {
        if (overlay && event.key === 'Escape') { event.stopPropagation(); onMobileOpenChange(false); }
      }}
    >
      <div
        className={`
          ${styles.border}
          ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          flex h-full w-full flex-col overflow-hidden border-panel-border bg-k-surface shadow-xl
          transition-opacity duration-200
        `}
        ref={bodyRef}
        inert={!visible}
        aria-hidden={!visible}
      >
        {overlay && (
          <div className="flex shrink-0 items-center justify-between border-b border-panel-border px-4 py-2">
            <span className="text-xs font-display">{title}</span>
            <button type="button" className="min-h-8 px-3 text-xs" onClick={() => onMobileOpenChange(false)} aria-label={t('panel.toggle', { action: t('common.close'), panel: title })}>{t('common.close')}</button>
          </div>
        )}
        <div
          className={`
            ${styles.resize}
            ${resizing ? 'bg-fire/40 shadow-[0_0_18px_rgba(209,20,2,0.55)]' : 'hover:bg-fire/40'}
            absolute bottom-0 top-0 z-20 ${overlay || !visible ? 'hidden' : 'block'} w-3 cursor-col-resize touch-none transition-colors
          `}
          onPointerDown={onResizeStart}
          aria-hidden="true"
        />
        <div className={`min-h-0 flex-1 ${bodyClassName}`}>
          {children}
        </div>
      </div>

      <PanelEdgeToggle
        edge={side}
        open={visible}
        panelTitle={title}
        controlsId={id}
        onToggle={handleToggle}
        className={overlay ? 'hidden' : 'flex'}
      />
    </aside>
  );
}
