import type { ReactNode } from 'react';
import { InputColor } from 'tweeq';
import { useShallow } from 'zustand/react/shallow';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { useGradientStore } from '../store/gradientStore';
import { ICE_COLOR_KEYS, ICE_LIMIT_KEYS, normalizeIceConfig, type IceConfig } from '../types/ice';
import { MaterialFieldStructureEditor } from './MaterialFieldControls';
import { SliderField } from './SliderField';

const COLOR_INPUT_CLASS = 'tq-color-input w-[132px] min-w-0 flex-none border border-panel-border bg-k-bg/50';
const percent = (value: number) => `${Math.round(value * 100)}%`;
const twoDecimals = (value: number) => value.toFixed(2);

type IceNumericKey = keyof typeof ICE_LIMIT_KEYS;

type OpticRow = { key: IceNumericKey; labelKey: MessageKey; format: (value: number) => string; keyframed: boolean };

const OPTIC_ROWS: OpticRow[] = [
  { key: 'mix', labelKey: 'ice.mix', format: percent, keyframed: true },
  { key: 'refraction', labelKey: 'ice.refraction', format: percent, keyframed: true },
  { key: 'ior', labelKey: 'ice.ior', format: twoDecimals, keyframed: true },
  { key: 'roughness', labelKey: 'ice.roughness', format: percent, keyframed: true },
  { key: 'reflection', labelKey: 'ice.reflection', format: percent, keyframed: true },
  { key: 'absorption', labelKey: 'ice.absorption', format: twoDecimals, keyframed: true },
  { key: 'scattering', labelKey: 'ice.scattering', format: twoDecimals, keyframed: true },
];

const MOTION_ROWS: OpticRow[] = [
  { key: 'lightCycles', labelKey: 'ice.lightCycles', format: value => `${Math.round(value)}x`, keyframed: false },
  { key: 'lightPhase', labelKey: 'ice.lightPhase', format: twoDecimals, keyframed: true },
];

const COLOR_LABELS: Record<typeof ICE_COLOR_KEYS[number], MessageKey> = {
  absorptionColor: 'ice.absorptionColor',
  scatterColor: 'ice.scatterColor',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className="block w-fit font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">{title}</span>
      {children}
    </div>
  );
}

/**
 * Ice settings grouped as Structure (the shared Material Field), Optics, and
 * Motion. ON/OFF lives in the Effect Stack like the other layers.
 */
export function IcePanel() {
  const { t } = useLanguage();
  const { rawIce, imageGradientEnabled } = useGradientStore(useShallow(state => ({
    rawIce: state.ice,
    imageGradientEnabled: state.imageGradient.enabled,
  })));
  const ice = normalizeIceConfig(rawIce);
  const { setIce } = applicationCommands;
  const disabled = !ice.enabled;
  const renderRow = (row: OpticRow) => (
    <SliderField
      key={row.key}
      label={t(row.labelKey)}
      value={ice[row.key]}
      limitKey={ICE_LIMIT_KEYS[row.key]}
      trackId={row.keyframed ? `ice.${row.key}` : undefined}
      format={row.format}
      disabled={disabled}
      onChange={(value) => setIce({ [row.key]: value } as Partial<IceConfig>)}
    />
  );

  return (
    <div className="space-y-4 text-[11px]" data-ice-panel>
      <p className="text-[10px] text-tab-inactive">{t('ice.description')}</p>
      {imageGradientEnabled && (
        <p className="text-[10px] text-amber-300" role="note" data-ice-inactive="image-gradient">
          {t('ice.inactiveImageGradient')}
        </p>
      )}
      {disabled && (
        <p className="text-[10px] text-tab-inactive" role="note" data-ice-inactive="off">{t('ice.offHint')}</p>
      )}
      <Section title={t('ice.structure')}>
        <MaterialFieldStructureEditor />
      </Section>
      <Section title={t('ice.optics')}>
        {OPTIC_ROWS.map(renderRow)}
        {ICE_COLOR_KEYS.map(key => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-deep font-display uppercase tracking-wider">{t(COLOR_LABELS[key])}</span>
            <div className={COLOR_INPUT_CLASS}>
              <InputColor
                value={ice[key]}
                onChange={(value) => setIce({ [key]: value.toUpperCase() } as Partial<IceConfig>)}
                alpha={false}
                aria-label={t(COLOR_LABELS[key])}
              />
            </div>
          </div>
        ))}
      </Section>
      <Section title={t('ice.motion')}>
        {MOTION_ROWS.map(renderRow)}
        <p className="text-[10px] text-tab-inactive">{t('ice.loopHint')}</p>
      </Section>
    </div>
  );
}
