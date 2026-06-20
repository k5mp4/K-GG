const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSePMMNDY7CyVlqA84fr6TEpiSUmbCBPk8gmcooUmD7S8qtMjg/viewform?usp=publish-editor';

type FeedbackPanelProps = {
  onClose: () => void;
};

export function FeedbackPanel({ onClose }: FeedbackPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-k-surface w-full max-w-lg max-h-[85vh] overflow-hidden rounded-none shadow-2xl border border-cream/40 flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-k-surface border-b border-cream/40 p-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-k-text flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fire">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              <path d="M8 9h8" />
              <path d="M8 13h5" />
            </svg>
            Feedback
          </h2>
          <button
            onClick={onClose}
            className="text-tab-inactive hover:text-k-text p-1.5 rounded-none hover:bg-k-border transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-6 text-k-text overflow-y-auto scrollbar-thin">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-k-text/85">
              何かフィードバックがあればこちらにお送りください！
            </p>
            <p className="text-sm leading-relaxed text-k-text/70">
              If you have any feedback, please send it here.
            </p>
          </div>

          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 border border-fire/50 bg-fire/10 px-4 py-3 text-sm text-k-text hover:bg-fire/20 hover:border-fire transition-colors"
          >
            <span className="min-w-0 truncate">Open Google Form</span>
            <svg className="shrink-0 text-fire" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          <p className="break-all text-xs leading-relaxed text-tab-inactive">
            {FEEDBACK_FORM_URL}
          </p>
        </div>
      </div>
    </div>
  );
}
