import { Toggle } from './Toggle';
import { Icon } from './Icon';

type PropertyModulesSettingsPanelProps = {
  hoverSwitchEnabled: boolean;
  onHoverSwitchChange: (enabled: boolean) => void;
  onClose: () => void;
};

export function PropertyModulesSettingsPanel({
  hoverSwitchEnabled,
  onHoverSwitchChange,
  onClose,
}: PropertyModulesSettingsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex h-[310px] w-full max-w-md flex-col overflow-hidden border border-cream/40 bg-k-surface shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-cream/40 bg-k-surface p-4">
          <h2 className="flex items-center gap-2 text-lg font-display font-bold text-k-text">
            <Icon name="settings" className="text-[20px] text-fire" />
            Property Modules
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-tab-inactive transition-colors hover:bg-k-border hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="border border-cream/20 bg-k-bg/55 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display font-semibold uppercase tracking-wider text-k-text">
                  Hover interactions
                </p>
                <div className="mt-1 min-h-[58px] space-y-1 text-xs leading-relaxed text-tab-inactive">
                  <p>
                    {hoverSwitchEnabled
                      ? 'トップバーのパネルとセレクトメニューはホバーで反応します。'
                      : 'トップバーのパネルとセレクトメニューはクリックした時だけ反応します。'}
                  </p>
                  <p>
                    {hoverSwitchEnabled
                      ? 'Top bar panels and select menus respond to hover.'
                      : 'Top bar panels and select menus respond only after clicking.'}
                  </p>
                </div>
              </div>
              <Toggle
                variant="switch"
                size="sm"
                checked={hoverSwitchEnabled}
                onChange={onHoverSwitchChange}
                className="mt-0.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-cream/20 pt-4">
            <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-deep">
              Current mode
            </span>
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${hoverSwitchEnabled ? 'text-fire' : 'text-cream'}`}>
              {hoverSwitchEnabled ? 'Hover' : 'Click only'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
