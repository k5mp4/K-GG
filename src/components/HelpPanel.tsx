import ReactMarkdown from 'react-markdown';
import helpContent from '../docs/help.md?raw';
import type { UpdateStatus } from '../features/updater/types';

interface HelpPanelProps {
  onClose: () => void;
  appVersion: string | null;
  updateSupported: boolean;
  updateStatus: UpdateStatus;
  onCheckForUpdates: () => void;
}

export function HelpPanel({
  onClose,
  appVersion,
  updateSupported,
  updateStatus,
  onCheckForUpdates,
}: HelpPanelProps) {
  const checking = updateStatus === 'checking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      {/* 背景のぼかしとクリックで閉じる機能 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* モーダル本体 */}
      <div className="relative bg-k-surface w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-none shadow-2xl border border-cream/40 flex flex-col animate-in fade-in zoom-in duration-200">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-k-surface border-b border-cream/40 p-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-k-text flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fire">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            使い方ガイド
          </h2>
          <div className="flex items-center gap-4">
            <a
              href="/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-fire hover:text-cream underline decoration-fire/30 underline-offset-4 transition-colors font-medium flex items-center gap-1"
            >
              <span>オンラインドキュメント</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
            <button
              onClick={onClose}
              className="text-tab-inactive hover:text-k-text p-1.5 rounded-none hover:bg-k-border transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツエリア (スクロール可能) */}
        <div className="p-8 text-k-text overflow-y-auto scrollbar-thin">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fire hover:text-cream underline decoration-fire/30 underline-offset-4 transition-colors"
                >
                  {children}
                </a>
              ),
              h1: ({ children }) => <h1 className="hidden">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-display font-bold mt-8 mb-4 text-k-text border-l-4 border-fire pl-3 bg-fire/5 py-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-md font-display font-semibold mt-6 mb-2 text-cream">{children}</h3>,
              p: ({ children }) => <p className="text-sm leading-relaxed mb-4 text-k-text/80">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-2 mb-6">{children}</ul>,
              li: ({ children }) => <li className="text-sm text-k-text/80">{children}</li>,
              code: ({ children }) => <code className="bg-k-bg px-1.5 py-0.5 rounded-none text-xs text-cream border border-cream/40 font-display">{children}</code>,
              hr: () => <hr className="border-cream/40 my-8" />,
              strong: ({ children }) => <strong className="font-bold text-k-text">{children}</strong>,
            }}
          >
            {helpContent}
          </ReactMarkdown>
        </div>
        <footer className="flex shrink-0 flex-col gap-3 border-t border-cream/30 bg-k-bg/65 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-display font-semibold uppercase tracking-[0.22em] text-tab-inactive">
              K-GG Desktop
            </p>
            <p className="mt-1 font-display text-sm font-bold text-k-text">
              {appVersion ? `Version ${appVersion}` : 'Web build'}
            </p>
          </div>
          {updateSupported && (
            <button
              type="button"
              onClick={onCheckForUpdates}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 border border-fire/60 bg-fire/10 px-4 py-2 text-[10px] font-display font-bold uppercase tracking-wider text-fire transition-colors hover:bg-fire hover:text-k-bg disabled:cursor-wait disabled:opacity-60"
            >
              <span className={`material-symbols-rounded text-[15px] ${checking ? 'animate-spin' : ''}`}>
                {checking ? 'progress_activity' : 'system_update_alt'}
              </span>
              Check for updates
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
