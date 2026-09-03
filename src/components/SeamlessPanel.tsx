import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { SEAMLESS_MAX_BLEND_WIDTH, SEAMLESS_MIN_BLEND_WIDTH } from '../types/seamless';
import { useLanguage } from '../i18n/LanguageProvider';
import { SliderField } from './SliderField';

export function SeamlessPanel() {
  const { t } = useLanguage();
  const { seamless } = useGradientStore();
  const { setSeamless } = applicationCommands;

  return (
    <div className="space-y-3 text-[11px]" data-seamless-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          {t('sandbox.seamlessTitle')}
        </span>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">
          {t('sandbox.seamlessDescription')}
        </p>
      </div>

      <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
        <SliderField
          label="Blend Width"
          value={seamless.blendWidth}
          min={SEAMLESS_MIN_BLEND_WIDTH}
          max={SEAMLESS_MAX_BLEND_WIDTH}
          step={0.01}
          defaultValue={STORE_DEFAULTS.seamless.blendWidth}
          format={(value) => `${Math.round(value * 100)}%`}
          disabled={!seamless.enabled}
          onChange={(blendWidth) => setSeamless({ blendWidth })}
        />
      </div>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {t('sandbox.seamlessHint')}
      </p>
    </div>
  );
}
