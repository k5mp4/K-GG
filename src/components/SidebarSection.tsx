import type { ReactNode } from 'react';
import { Collapsible } from './Collapsible';

type SidebarSectionProps = {
  id: string;
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  nested?: boolean;
};

export function SidebarSection({
  id,
  title,
  description,
  open,
  onToggle,
  children,
  nested = false,
}: SidebarSectionProps) {
  const contentId = `${id}-content`;

  return (
    <section className={nested ? 'pt-2' : 'border-t border-panel-border pt-1'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="group flex w-full items-center gap-2 bg-transparent px-0 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
      >
        <span
          className={`relative flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${
            open
              ? 'text-fire'
              : 'text-tab-inactive group-hover:text-k-text'
          }`}
          aria-hidden="true"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block w-fit font-display text-[11px] font-semibold uppercase tracking-[0.14em] ${open ? 'text-k-text' : 'text-tab-inactive group-hover:text-k-text'} ${description ? 'hint-label' : ''}`} title={description}>
            {title}
          </span>
        </span>
      </button>
      <Collapsible isOpen={open}>
        <div id={contentId} className="pb-4">
          {children}
        </div>
      </Collapsible>
    </section>
  );
}
