import { useEffect, useMemo, useState } from 'react';
import { InputCubicBezier, type CubicBezierValue } from 'tweeq';
import { diffuseBezierValue, normalizeDiffuseBezier } from '../lib/diffuseCurve';
import type { DiffuseBezierValue } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = {
  value: DiffuseBezierValue;
  onChange: (value: DiffuseBezierValue) => void;
  disabled?: boolean;
};

const PREVIEW_PAD = 5;
const PREVIEW_SIZE = 90;

export function DiffuseCurveEditor({ value, onChange, disabled = false }: Props) {
  const { t } = useLanguage();
  const [histogram, setHistogram] = useState<number[]>([]);
  const curve = useMemo(() => normalizeDiffuseBezier(value), [value]);

  useEffect(() => {
    const handleHistogram = (event: Event) => {
      const next = (event as CustomEvent<{ histogram?: number[] }>).detail?.histogram;
      if (Array.isArray(next) && next.length > 0) setHistogram(next);
    };
    window.addEventListener('kgg:diffuse-histogram', handleHistogram);
    return () => window.removeEventListener('kgg:diffuse-histogram', handleHistogram);
  }, []);

  const histogramMax = Math.max(...histogram, 1);
  const plotSize = PREVIEW_SIZE - PREVIEW_PAD * 2;
  const curvePath = Array.from({ length: 65 }, (_, index) => {
    const x = index / 64;
    const px = PREVIEW_PAD + x * plotSize;
    const py = PREVIEW_PAD + (1 - diffuseBezierValue(curve, x)) * plotSize;
    return `${index === 0 ? 'M' : 'L'} ${px} ${py}`;
  }).join(' ');

  return (
    <div className="space-y-2 rounded-[var(--tq-radius-pane)] border border-k-muted/60 bg-k-bg/70 p-2 text-k-text">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider">{t('diffuse.luminanceCurve')}</p>
          <p className="text-[9px] text-tab-inactive">{t('diffuse.luminanceMapping')}</p>
        </div>
        <InputCubicBezier
          value={curve as CubicBezierValue}
          onChange={(next) => onChange([...next] as DiffuseBezierValue)}
          disabled={disabled}
          aria-label={t('diffuse.cubicBezier')}
          title={t('diffuse.cubicBezier')}
        />
      </div>
      <svg
        viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
        aria-label={t('diffuse.curvePreview')}
        role="img"
        className="mx-auto block aspect-square w-full max-w-[360px] rounded-[var(--tq-radius-input)] border border-k-muted/40 bg-k-surface text-fire"
      >
        <path d="M5 5H85 M5 45H85 M5 85H85 M5 5V85 M45 5V85 M85 5V85" stroke="currentColor" opacity="0.12" strokeWidth="0.5" />
        {histogram.map((count, index) => {
          const width = Math.max(plotSize / histogram.length, 0.25);
          const height = count / histogramMax * plotSize;
          return (
            <rect
              key={index}
              x={PREVIEW_PAD + index / histogram.length * plotSize}
              y={PREVIEW_PAD + plotSize - height}
              width={width}
              height={height}
              fill="currentColor"
              opacity="0.16"
            />
          );
        })}
        <path d={curvePath} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
