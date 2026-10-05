import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageProvider';

export type PresetMenuFolder = { id: string; label: string };

type PresetContextMenuProps = {
  x: number;
  y: number;
  /** Presets the menu acts on. */
  count: number;
  /** Name shown in the heading when a single preset is targeted. */
  name: string;
  folders: PresetMenuFolder[];
  /** Folder every targeted preset is already in, if they all share one (null is the library root). */
  currentFolderId: string | null | undefined;
  onMove: (folderId: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
};

const VIEWPORT_MARGIN_PX = 4;

/** Right-click menu for saved presets. Delete and move live here so they cannot be hit by accident on a card. */
export function PresetContextMenu({ x, y, count, name, folders, currentFolderId, onMove, onDelete, onClose }: PresetContextMenuProps) {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  // Keep the menu inside the window once its size is known.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(VIEWPORT_MARGIN_PX, Math.min(x, window.innerWidth - width - VIEWPORT_MARGIN_PX)),
      top: Math.max(VIEWPORT_MARGIN_PX, Math.min(y, window.innerHeight - height - VIEWPORT_MARGIN_PX)),
    });
  }, [x, y]);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    };
    window.addEventListener('pointerdown', closeOutside, true);
    window.addEventListener('keydown', closeOnKey, true);
    window.addEventListener('blur', onClose);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('pointerdown', closeOutside, true);
      window.removeEventListener('keydown', closeOnKey, true);
      window.removeEventListener('blur', onClose);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  function moveFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length].focus();
  }

  const destinations: PresetMenuFolder[] = [{ id: '', label: t('preset.root') }, ...folders];
  const itemClass = 'block w-full truncate px-3 py-1.5 text-left text-[11px] outline-none focus:bg-fire/20 enabled:hover:bg-fire/20 disabled:opacity-40';

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={t('preset.menu')}
      onKeyDown={moveFocus}
      onContextMenu={event => event.preventDefault()}
      style={{ left: position.left, top: position.top }}
      className="fixed z-50 flex max-h-[70vh] w-56 flex-col border border-cream/25 bg-k-bg py-1 text-k-text shadow-xl"
    >
      <p className="truncate px-3 py-1 text-[10px] text-tab-inactive">{count > 1 ? t('preset.selectedCount', { count }) : name}</p>
      <button type="button" role="menuitem" onClick={onDelete} className={`${itemClass} text-red-400`}>
        {count > 1 ? t('preset.deleteSelected', { count }) : t('common.delete')}
      </button>
      <div role="separator" className="my-1 border-t border-cream/15" />
      <p className="px-3 py-1 text-[10px] text-tab-inactive">{t('preset.moveTo')}</p>
      <div className="min-h-0 overflow-y-auto scrollbar-thin">
        {destinations.map(destination => {
          const folderId = destination.id || null;
          return (
            <button
              key={destination.id || 'root'}
              type="button"
              role="menuitem"
              disabled={currentFolderId === folderId}
              onClick={() => onMove(folderId)}
              className={itemClass}
            >
              {destination.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
