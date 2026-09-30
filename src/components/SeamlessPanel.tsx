import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { SliderField } from './SliderField';

export function SeamlessPanel() {
  const { t } = useLanguage();
  const { seamless } = useGradientStore();
  const { setSeamless } = applicationCommands;

  return (
    <div className="space-y-3 text-[11px]" data-seamless-panel>
      <div
        className="space-y-3 border border-cream/25 bg-k-surface/35 p-3"
        title={[t('sandbox.seamlessDescription'), t('sandbox.seamlessHint')].join('\n')}
      >
        <SliderField
          label="Blend Width"
          value={seamless.blendWidth}
          limitKey="seamless.blendWidth"
          format={(value) => `${Math.round(value * 100)}%`}
          disabled={!seamless.enabled}
          onChange={(blendWidth) => setSeamless({ blendWidth })}
        />
      </div>
    </div>
  );
}
