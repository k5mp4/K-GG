import { InputCubicBezier, type CubicBezierValue } from 'tweeq';
import { normalizeDiffuseBezier } from '../lib/diffuseCurve';
import type { DiffuseBezierValue } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = {
  value: DiffuseBezierValue;
  onChange: (value: DiffuseBezierValue) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
};

export function DiffuseCurveEditor({ value, onChange, disabled = false, label, description }: Props) {
  const { t } = useLanguage();
  const curve = normalizeDiffuseBezier(value);

  return (
    <div className="flex min-h-9 items-center justify-between gap-3 rounded-[var(--tq-radius-pane)] border border-k-muted/60 bg-k-bg/70 px-2 py-1.5 text-k-text">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider">{label ?? t('diffuse.luminanceCurve')}</p>
        <p className="truncate text-[9px] text-tab-inactive">{description ?? t('diffuse.luminanceMapping')}</p>
      </div>
      <InputCubicBezier
        value={curve as CubicBezierValue}
        onChange={(next) => onChange([...next] as DiffuseBezierValue)}
        disabled={disabled}
        aria-label={t('diffuse.cubicBezier')}
        title={t('diffuse.cubicBezier')}
      />
    </div>
  );
}
