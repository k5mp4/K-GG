import { useRef, useState, type ReactNode } from 'react';
import { applicationCommands } from '../application/commands';
import { useShapesMaskStore } from '../features/shapes/shapesMaskStore';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';
import { rasterizeShapeSvg, SHAPES_SVG_MAX_BYTES } from '../lib/shapesLibrary';
import { useGradientStore } from '../store/gradientStore';
import {
  DEFAULT_SHAPES,
  type ShapesFillSource,
  type ShapesReveal,
  type ShapesSource,
} from '../types/shapes';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

const percent = (value: number) => `${Math.round(value * 100)}%`;
const twoDecimals = (value: number) => value.toFixed(2);
const threeDecimals = (value: number) => value.toFixed(3);
const degrees = (value: number) => `${value.toFixed(0)}°`;
const times = (value: number) => `${value.toFixed(0)}×`;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className={`block w-fit font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100${hint ? ' hint-label' : ''}`} title={hint}>{localizeUiLabel(title, language)}</span>
      {children}
    </div>
  );
}

/**
 * SANDBOX Shapes settings. The loaded SVG is session-only (see
 * shapesMaskStore); the Preset keeps only the source choice and the look.
 */
export function ShapesPanel() {
  const { t } = useLanguage();
  const shapes = useGradientStore(state => state.shapes);
  const { setShapes } = applicationCommands;
  const customMask = useShapesMaskStore(state => state.customMask);
  const customName = useShapesMaskStore(state => state.customName);
  const setCustomMask = useShapesMaskStore(state => state.setCustomMask);
  const clearCustomMask = useShapesMaskStore(state => state.clearCustomMask);
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = !shapes.enabled;
  const revealDisabled = disabled || shapes.reveal === 'none';

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    if (file.size > SHAPES_SVG_MAX_BYTES) {
      setError(t('shapes.svgError'));
      return;
    }
    setLoading(true);
    try {
      const mask = await rasterizeShapeSvg(await file.text());
      setCustomMask(mask, file.name);
      setShapes({ source: 'custom' });
    } catch (cause) {
      console.error('Shapes SVG load failed:', cause);
      setError(t('shapes.svgError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-[11px]" data-shapes-panel>
      <Section title="Shape" hint={[t('sandbox.shapesDescription'), t('shapes.hint')].join('\n')}>
        <CustomSelect
          label="Source"
          value={shapes.source}
          localizeOptions={false}
          options={[
            { value: 'circle', label: t('shapes.sourceCircle') },
            { value: 'star', label: t('shapes.sourceStar') },
            { value: 'text', label: t('shapes.sourceText') },
            { value: 'custom', label: t('shapes.sourceCustom') },
          ]}
          onChange={(value) => setShapes({ source: value as ShapesSource })}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            {customMask && (
              <button
                type="button"
                onClick={clearCustomMask}
                className="bg-red-900/30 px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
              >
                {t('shapes.svgClear')}
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="bg-cream/10 px-2 py-0.5 text-[10px] text-cream transition-all hover:bg-cream/20 hover:text-k-text disabled:opacity-50"
            >
              {loading ? 'Loading...' : t('shapes.svgLoad')}
            </button>
            <input ref={inputRef} type="file" accept=".svg,image/svg+xml" onChange={handleFileChange} className="hidden" />
          </div>
          {shapes.source === 'custom' && (customMask ? (
            <p className="truncate text-[10px] text-deep">{customName}</p>
          ) : (
            <p className="text-[10px] text-amber-300">{t('shapes.svgMissing')}</p>
          ))}
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
        <SliderField label="Scale" value={shapes.scale} limitKey="shapes.scale" format={percent} disabled={disabled} onChange={(scale) => setShapes({ scale })} />
        <SliderField label="Offset X" value={shapes.offsetX} limitKey="shapes.offsetX" format={twoDecimals} disabled={disabled} onChange={(offsetX) => setShapes({ offsetX })} />
        <SliderField label="Offset Y" value={shapes.offsetY} limitKey="shapes.offsetY" format={twoDecimals} disabled={disabled} onChange={(offsetY) => setShapes({ offsetY })} />
        <SliderField label="Rotation" value={shapes.rotation} limitKey="shapes.rotation" control="angle" format={degrees} disabled={disabled} onChange={(rotation) => setShapes({ rotation })} />
      </Section>

      <Section title="Edge" hint={t('shapes.edgeHint')}>
        <SliderField label="Softness" value={shapes.softness} limitKey="shapes.softness" format={threeDecimals} disabled={disabled} onChange={(softness) => setShapes({ softness })} />
        <SliderField label="Inner Shadow" value={shapes.innerShadow} limitKey="shapes.innerShadow" format={percent} disabled={disabled} onChange={(innerShadow) => setShapes({ innerShadow })} />
        <SliderField label="Shadow Size" value={shapes.innerShadowSize} limitKey="shapes.innerShadowSize" format={threeDecimals} disabled={disabled} onChange={(innerShadowSize) => setShapes({ innerShadowSize })} />
        <SliderField label="Shadow Offset" value={shapes.shadowOffset} limitKey="shapes.shadowOffset" format={percent} disabled={disabled} onChange={(shadowOffset) => setShapes({ shadowOffset })} />
        <SliderField label="Light Angle" value={shapes.lightAngle} limitKey="shapes.lightAngle" control="angle" format={degrees} disabled={disabled} onChange={(lightAngle) => setShapes({ lightAngle })} />
      </Section>

      <Section title="Fill" hint={t('shapes.fillHint')}>
        <CustomSelect
          label="Fill Source"
          value={shapes.fillSource}
          localizeOptions={false}
          options={[
            { value: 'flow', label: t('shapes.fillFlow') },
            { value: 'ripple', label: t('shapes.fillRipple') },
            { value: 'stripes', label: t('shapes.fillStripes') },
            { value: 'render', label: t('shapes.fillRender') },
          ]}
          onChange={(value) => setShapes({ fillSource: value as ShapesFillSource })}
        />
        <SliderField label="Fill Amount" value={shapes.fillAmount} limitKey="shapes.fillAmount" format={percent} disabled={disabled} onChange={(fillAmount) => setShapes({ fillAmount })} />
        {shapes.fillSource !== 'render' && (
          <>
            <SliderField label="Fill Scale" value={shapes.fillScale} limitKey="shapes.fillScale" format={twoDecimals} disabled={disabled} onChange={(fillScale) => setShapes({ fillScale })} />
            <SliderField label="Warp" value={shapes.fillWarp} limitKey="shapes.fillWarp" format={twoDecimals} disabled={disabled} onChange={(fillWarp) => setShapes({ fillWarp })} />
            <SliderField label="Fill Cycles" value={shapes.fillCycles} limitKey="shapes.fillCycles" format={times} disabled={disabled} onChange={(fillCycles) => setShapes({ fillCycles })} />
          </>
        )}
        <SliderField label="Direction" value={shapes.fillAngle} limitKey="shapes.fillAngle" control="angle" format={degrees} disabled={disabled} onChange={(fillAngle) => setShapes({ fillAngle })} />
      </Section>

      <Section title="Gradient" hint={t('shapes.gradientHint')}>
        <SliderField label="Glow Radius" value={shapes.glowRadius} limitKey="shapes.glowRadius" format={threeDecimals} disabled={disabled} onChange={(glowRadius) => setShapes({ glowRadius })} />
        <SliderField label="Glow Intensity" value={shapes.glowIntensity} limitKey="shapes.glowIntensity" format={twoDecimals} disabled={disabled} onChange={(glowIntensity) => setShapes({ glowIntensity })} />
        <SliderField label="Contrast" value={shapes.contrast} limitKey="shapes.contrast" format={twoDecimals} disabled={disabled} onChange={(contrast) => setShapes({ contrast })} />
        <SliderField label="Grain" value={shapes.grain} limitKey="shapes.grain" format={percent} disabled={disabled} onChange={(grain) => setShapes({ grain })} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-deep">{t('shapes.transparentBackground')}</span>
          <Toggle
            variant="switch"
            size="xs"
            checked={shapes.transparentBackground}
            ariaLabel={t('shapes.transparentBackground')}
            onChange={(transparentBackground) => setShapes({ transparentBackground })}
          />
        </div>
      </Section>

      <Section title="Show / Hide Loop" hint={t('shapes.revealHint')}>
        <CustomSelect
          label="Mode"
          value={shapes.reveal}
          localizeOptions={false}
          options={[
            { value: 'fadeGlow', label: t('shapes.revealFadeGlow') },
            { value: 'wipe', label: t('shapes.revealWipe') },
            { value: 'flicker', label: t('shapes.revealFlicker') },
            { value: 'none', label: t('shapes.revealNone') },
          ]}
          onChange={(value) => setShapes({ reveal: value as ShapesReveal })}
        />
        <SliderField label="Cycles" value={shapes.revealCycles} limitKey="shapes.revealCycles" format={times} disabled={revealDisabled} onChange={(revealCycles) => setShapes({ revealCycles })} />
        <SliderField label="Transition" value={shapes.revealTransition} limitKey="shapes.revealTransition" format={percent} disabled={revealDisabled} onChange={(revealTransition) => setShapes({ revealTransition })} />
        <SliderField label="Hidden" value={shapes.revealHidden} limitKey="shapes.revealHidden" format={percent} disabled={revealDisabled} onChange={(revealHidden) => setShapes({ revealHidden })} />
        <SliderField label="Phase" value={shapes.revealOffset} limitKey="shapes.revealOffset" format={percent} disabled={revealDisabled} onChange={(revealOffset) => setShapes({ revealOffset })} />
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShapes({
            ...DEFAULT_SHAPES,
            enabled: shapes.enabled,
            source: shapes.source,
          })}
          className="inline-flex h-6 items-center gap-1.5 px-1.5 text-[9px] font-display uppercase tracking-wider text-tab-inactive transition-colors hover:bg-k-muted hover:text-k-text"
        >
          {t('common.reset')}
        </button>
      </div>
    </div>
  );
}
