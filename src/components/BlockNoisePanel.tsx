import { useEffect, useState } from 'react';
import { useGradientStore, STORE_DEFAULTS } from '../store/gradientStore';
import { SliderField } from './SliderField';
import { Collapsible } from './Collapsible';
import { Toggle } from './Toggle';
import type { DiffuseConfig } from '../types/distortion';
import { Icon } from './Icon';
import { DiffuseCurveEditor } from './DiffuseCurveEditor';
import { IDENTITY_DIFFUSE_BEZIER } from '../lib/diffuseCurve';
import { fromTweeqAngle, toTweeqAngle } from '../lib/tweeqAngle';
import { useLanguage } from '../i18n/LanguageProvider';
import { InputAngle, InputColor, InputDropdown, InputDrum, InputRadio, InputString } from 'tweeq';

const D = STORE_DEFAULTS.diffuse;
const isDiffuseDirty = (value: DiffuseConfig) =>
  Object.keys(D).some((key) => {
    if (key === 'enabled') return false;
    const typedKey = key as keyof typeof D;
    return JSON.stringify(value[typedKey as keyof DiffuseConfig]) !== JSON.stringify(D[typedKey]);
  });

const DIFFUSE_MODES: Array<{ value: DiffuseConfig['mode']; label: string }> = [
  { value: 'block', label: 'Block' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'dither', label: 'Dither' },
  { value: 'halftone', label: 'Halftone' },
  { value: 'ascii', label: 'ASCII' },
];
const DIFFUSE_MODE_VALUES = DIFFUSE_MODES.map(mode => mode.value);
const ADAPTIVE_CHANNELS = ['luminance', 'hue', 'saturation'] as const;
const ADAPTIVE_CHANNEL_LABELS = ['Luminance', 'Hue', 'Saturation'] as const;
const HALFTONE_SHAPES = ['circle', 'square'] as const;
const HALFTONE_SHAPE_LABELS = ['Circle', 'Square'] as const;
const GENERIC_FONT_OPTIONS = ['monospace', 'serif', 'sans-serif', 'cursive', 'fantasy'];

async function loadSystemFonts(): Promise<string[]> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const fonts = await invoke<string[]>('list_system_fonts');
    if (Array.isArray(fonts) && fonts.length > 0) {
      return [...GENERIC_FONT_OPTIONS, ...fonts];
    }
  } catch (error) {
    console.debug('System font enumeration unavailable:', error);
  }
  return GENERIC_FONT_OPTIONS;
}

export function DiffusePanel() {
  const { t } = useLanguage();
  const { diffuse, setDiffuse } = useGradientStore();
  const canReset = isDiffuseDirty(diffuse);
  const [systemFonts, setSystemFonts] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSystemFonts().then((fonts) => {
      if (!cancelled) setSystemFonts(fonts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const asciiFontOptions = systemFonts ?? GENERIC_FONT_OPTIONS;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{t('effect.diffuse')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiffuse({ ...D, enabled: diffuse.enabled })}
              disabled={!canReset}
              className={`w-6 h-6 inline-flex items-center justify-center bg-transparent hover:bg-k-muted text-tab-inactive hover:text-k-text rounded-none transition-all ${
                canReset ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
              }`}
              title={t('common.reset')}
            >
              <Icon name="restart" className="text-[14px]" />
            </button>
            <Toggle variant="switch" checked={diffuse.enabled} onChange={(v) => setDiffuse({ enabled: v })} />
          </div>
        </div>

        <Collapsible isOpen={diffuse.enabled}>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-xs text-deep mb-1">Mode</p>
              <InputDrum
                value={diffuse.mode}
                options={DIFFUSE_MODE_VALUES}
                labels={DIFFUSE_MODES.map((mode) => mode.label)}
                onChange={(mode) => mode !== undefined && setDiffuse({ mode })}
                aria-label="Diffuse mode"
                className="w-full"
              />
            </div>

            {diffuse.mode !== 'dither' && diffuse.mode !== 'halftone' && diffuse.mode !== 'ascii' && (
              <SliderField
                label="Scatter"
                min={0} max={300} step={1}
                value={diffuse.scatter}
                onChange={(v) => setDiffuse({ scatter: v })}
                format={(v) => v + 'px'}
                defaultValue={D.scatter}
                limitKey="diffuse.scatter"
              />
            )}

            <SliderField
              label={diffuse.mode === 'dither' ? 'Dot Size' : diffuse.mode === 'halftone' || diffuse.mode === 'ascii' ? 'Cell Size' : 'Grain'}
              min={diffuse.mode === 'halftone' ? 2 : diffuse.mode === 'ascii' ? 4 : 0.01}
              max={diffuse.mode === 'dither' ? 12 : diffuse.mode === 'halftone' || diffuse.mode === 'ascii' ? 64 : 5}
              step={diffuse.mode === 'halftone' || diffuse.mode === 'ascii' ? 1 : 0.01}
              value={diffuse.grain}
              onChange={(v) => setDiffuse({ grain: v })}
              format={(v) => (diffuse.mode === 'halftone' || diffuse.mode === 'ascii' ? `${Math.round(v)}px` : v.toFixed(2) + 'px')}
              defaultValue={D.grain}
              limitKey={diffuse.mode === 'dither' ? 'diffuse.ditherGrain' : diffuse.mode === 'halftone' ? 'diffuse.halftoneGrain' : diffuse.mode === 'ascii' ? 'diffuse.asciiGrain' : 'diffuse.grain'}
            />

            {diffuse.mode === 'halftone' && (
              <>
                <div>
                  <p className="mb-1 text-xs text-deep">Shape</p>
                  <InputRadio
                    value={diffuse.halftoneShape}
                    options={HALFTONE_SHAPES}
                    labels={HALFTONE_SHAPE_LABELS}
                    onChange={(halftoneShape) => halftoneShape !== undefined && setDiffuse({ halftoneShape })}
                    aria-label="Halftone shape"
                    className="w-full"
                  />
                </div>
                <SliderField
                  label="Shape Size"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={diffuse.halftoneSize}
                  onChange={(v) => setDiffuse({ halftoneSize: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                  defaultValue={D.halftoneSize}
                  limitKey="diffuse.halftoneSize"
                />
              </>
            )}

            {diffuse.mode === 'ascii' && (
              <div className="space-y-1">
                <p className="text-xs text-deep">ASCII Characters</p>
                <InputString
                  value={diffuse.asciiCharset}
                  onChange={(asciiCharset) => setDiffuse({ asciiCharset })}
                  aria-label="ASCII character set"
                  title="ASCII character set"
                  className="w-full"
                />
                <p className="text-[9px] text-tab-inactive">Dark to light, left to right</p>
                <div>
                  <p className="mb-1 text-xs text-deep">Font</p>
                  <InputDropdown
                    value={diffuse.asciiFont}
                    options={asciiFontOptions}
                    labels={asciiFontOptions}
                    onChange={(asciiFont) => asciiFont !== undefined && setDiffuse({ asciiFont })}
                    aria-label="ASCII font"
                    className="w-full"
                  />
                </div>
                <SliderField
                  label="Font Size"
                  min={8}
                  max={128}
                  step={1}
                  value={diffuse.asciiFontSize}
                  onChange={(v) => setDiffuse({ asciiFontSize: v })}
                  format={(v) => `${Math.round(v)}px`}
                  defaultValue={D.asciiFontSize}
                  limitKey="diffuse.asciiFontSize"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-deep">Rotation</span>
                  <div className="tq-input-angle w-[112px]">
                    <InputAngle
                      value={toTweeqAngle(diffuse.asciiRotation)}
                      snap={45}
                      angleOffset={-90}
                      onChange={(v) => v !== undefined && setDiffuse({ asciiRotation: fromTweeqAngle(v) })}
                      aria-label="ASCII rotation"
                      title="ASCII rotation"
                    />
                  </div>
                </div>
              </div>
            )}

            {(diffuse.mode === 'halftone' || diffuse.mode === 'ascii') && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-deep">Background Color</span>
                <div className="tq-color-input w-[180px]">
                  <InputColor
                    value={diffuse.backgroundColor}
                    onChange={(backgroundColor) => setDiffuse({ backgroundColor })}
                    alpha={false}
                    aria-label="Diffuse background color"
                  />
                </div>
              </div>
            )}

            {diffuse.mode === 'dither' && (
              <SliderField
                label="Threshold"
                min={0} max={1} step={0.01}
                value={diffuse.ditherThreshold ?? D.ditherThreshold}
                onChange={(v) => setDiffuse({ ditherThreshold: v })}
                format={(v) => Math.round(v * 100) + '%'}
                defaultValue={D.ditherThreshold}
                limitKey="diffuse.ditherThreshold"
              />
            )}

            <div className="flex items-center justify-between border-t border-k-muted/40 pt-3">
              <div>
                <p className="text-xs text-deep">Adaptive Diffuse</p>
                <p className="text-[10px] text-tab-inactive">Amount responds to color properties</p>
              </div>
              <Toggle checked={diffuse.adaptiveEnabled ?? false} onChange={(v) => setDiffuse({ adaptiveEnabled: v })} />
            </div>
            <div>
              <p className="mb-1 text-xs text-deep">Adaptive Source</p>
              <InputDrum
                value={diffuse.adaptiveChannel}
                options={ADAPTIVE_CHANNELS}
                labels={ADAPTIVE_CHANNEL_LABELS}
                onChange={(adaptiveChannel) => adaptiveChannel !== undefined && setDiffuse({ adaptiveChannel })}
                aria-label="Diffuse adaptive source"
                className="w-full"
              />
            </div>
            <DiffuseCurveEditor
              value={diffuse.luminanceBezier}
              onChange={(luminanceBezier) => setDiffuse({ luminanceBezier })}
              disabled={!diffuse.adaptiveEnabled}
              label="Amount Curve"
              description="Maps the selected source to scatter"
            />
            <button
              type="button"
              className="w-full border border-k-muted/60 bg-k-surface px-2 py-1 text-[10px] text-tab-inactive hover:border-k-text hover:text-k-text"
              onClick={() => setDiffuse({
                luminanceBezier: [...IDENTITY_DIFFUSE_BEZIER] as DiffuseConfig['luminanceBezier'],
                grainBezier: [...IDENTITY_DIFFUSE_BEZIER] as DiffuseConfig['grainBezier'],
              })}
            >
              {t('diffuse.resetCurve')}
            </button>

            <div className="flex items-center justify-between border-t border-k-muted/40 pt-3">
              <div>
                <p className="text-xs text-deep">Adaptive Grain</p>
                <p className="text-[10px] text-tab-inactive">Change cell size with the same source</p>
              </div>
              <Toggle checked={diffuse.grainAdaptiveEnabled ?? false} onChange={(v) => setDiffuse({ grainAdaptiveEnabled: v })} />
            </div>
            <SliderField
              label="Grain Curve Amount"
              min={0}
              max={1}
              step={0.01}
              value={diffuse.grainAdaptiveAmount}
              onChange={(v) => setDiffuse({ grainAdaptiveAmount: v })}
              format={(v) => `${Math.round(v * 100)}%`}
              defaultValue={D.grainAdaptiveAmount}
              limitKey="diffuse.grainAdaptiveAmount"
            />
            <DiffuseCurveEditor
              value={diffuse.grainBezier}
              onChange={(grainBezier) => setDiffuse({ grainBezier })}
              disabled={!diffuse.grainAdaptiveEnabled}
              label="Grain Curve"
              description="Maps the selected source to cell size"
            />

            <SliderField
              label="Seed"
              min={0} max={99} step={1}
              value={diffuse.seed}
              onChange={(v) => setDiffuse({ seed: v })}
              defaultValue={D.seed}
              trackId="diffuse.seed"
              limitKey="diffuse.seed"
            />
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
