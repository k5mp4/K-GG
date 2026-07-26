import { Toggle } from './Toggle';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { useLanguage } from '../i18n/LanguageProvider';

type PropertyModulesSettingsPanelProps = {
  hoverSwitchEnabled: boolean;
  onHoverSwitchChange: (enabled: boolean) => void;
  onRefreshApp: () => void;
  onClose: () => void;
};

export function PropertyModulesSettingsPanel({
  hoverSwitchEnabled,
  onHoverSwitchChange,
  onRefreshApp,
  onClose,
}: PropertyModulesSettingsPanelProps) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden border border-cream/40 bg-k-surface shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-cream/40 bg-k-surface p-4">
          <h2 className="flex items-center gap-2 text-lg font-display font-bold text-k-text">
            <Icon name="settings" className="text-[20px] text-fire" />
            {t('settings.title')}
          </h2>
          <IconButton
            icon="close"
            label={t('common.close')}
            onClick={onClose}
            className="p-1.5"
            iconClassName="text-[20px]"
          />
        </div>

        <div className="space-y-5 overflow-y-auto p-6 scrollbar-thin">
          <div className="border border-cream/20 bg-k-bg/55 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display font-semibold uppercase tracking-wider text-k-text">
                  {t('settings.hoverInteractions')}
                </p>
                <div className="mt-1 min-h-[58px] space-y-1 text-xs leading-relaxed text-tab-inactive">
                  <p>
                    {hoverSwitchEnabled ? t('settings.hoverEnabled') : t('settings.hoverDisabled')}
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
              {t('settings.currentMode')}
            </span>
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${hoverSwitchEnabled ? 'text-fire' : 'text-cream'}`}>
              {hoverSwitchEnabled ? t('settings.hover') : t('settings.clickOnly')}
            </span>
          </div>

          <div className="border border-cream/20 bg-k-bg/55 p-4">
            <p className="text-sm font-display font-semibold uppercase tracking-wider text-k-text">{t('settings.language')}</p>
            <p className="mt-1 text-xs leading-relaxed text-tab-inactive">{t('settings.languageDescription')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
              {(['ja', 'en'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={language === option}
                  onClick={() => setLanguage(option)}
                  className={`border px-3 py-2 text-xs font-display font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire ${language === option ? 'border-fire bg-fire/15 text-cream' : 'border-cream/20 bg-k-surface text-tab-inactive hover:text-k-text'}`}
                >
                  {t(option === 'ja' ? 'settings.japanese' : 'settings.english')}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-amber-300/30 bg-amber-300/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display font-semibold uppercase tracking-wider text-k-text">
                  {t('settings.renderRecovery')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-tab-inactive">
                  {t('settings.renderRecoveryDescription')}
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshApp}
                className="inline-flex shrink-0 items-center gap-1.5 border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-[10px] font-display font-bold uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-300/20 hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
              >
                <Icon name="restart" className="text-[14px]" />
                {t('common.refreshApp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
