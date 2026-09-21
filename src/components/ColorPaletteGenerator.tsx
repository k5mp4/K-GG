import { useEffect, useMemo, useState } from 'react';
import { InputColor } from 'tweeq';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { getParameterDefault } from '../lib/parameterLimits';
import { buildGradientPreviewStyle } from '../lib/gradientPreview';
import {
  generateGradientFromUi,
  type GradientGeneratorAlgorithm,
  type GradientGeneratorUiParams,
} from '../lib/gradientGenerator';
import { mapOklchToSrgb } from '../lib/colorSpace';
import { PERCEPTUAL_GRADIENT_FAMILIES, type PerceptualGradientFamily } from '../lib/perceptualGradient';
import { ColorPicker } from './ColorPicker';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

const FALLBACK_FAMILY: PerceptualGradientFamily = 'sweep';
const FAMILY_MESSAGE_KEYS: Record<PerceptualGradientFamily, MessageKey> = {
  sweep: 'gradient.generatorFamily.sweep',
  soft: 'gradient.generatorFamily.soft',
  pastel: 'gradient.generatorFamily.pastel',
  deep: 'gradient.generatorFamily.deep',
  accent: 'gradient.generatorFamily.accent',
};
const GENERATED_RAMP_SETTINGS = {
  rampColorMode: 'rgb',
  rampInterpolation: 'linear',
  rampRepeat: 1,
  rampMirror: false,
} as const;
const EMPTY_STOP_EDITS: Record<number, string> = {};

type StopEdits = {
  paramsKey: string;
  colors: Record<number, string>;
};

export function ColorPaletteGenerator() {
  const { t } = useLanguage();
  const { setGradient } = applicationCommands;

  const [generatorAlgorithm, setGeneratorAlgorithm] = useState<GradientGeneratorAlgorithm>('cubehelix');
  const [generatorBaseColor, setGeneratorBaseColor] = useState('#6377A6');
  const [generatorColorIntensity, setGeneratorColorIntensity] = useState(() => getParameterDefault('paletteGenerator.colorIntensity'));
  const [generatorBrightness, setGeneratorBrightness] = useState(() => getParameterDefault('paletteGenerator.brightness'));
  const [generatorContrast, setGeneratorContrast] = useState(() => getParameterDefault('paletteGenerator.contrast'));
  const [generatorFamily, setGeneratorFamily] = useState<PerceptualGradientFamily>(FALLBACK_FAMILY);
  const [generatorAccentPosition, setGeneratorAccentPosition] = useState(() => getParameterDefault('paletteGenerator.accentPosition'));
  const [generatorAccentWidth, setGeneratorAccentWidth] = useState(() => getParameterDefault('paletteGenerator.accentWidth'));
  const [generatorStopCount, setGeneratorStopCount] = useState(() => getParameterDefault('paletteGenerator.stopCount'));
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);
  const [stopEdits, setStopEdits] = useState<StopEdits>({ paramsKey: '', colors: {} });

  const algorithmOptions = useMemo(() => [
    { value: 'cubehelix', label: t('gradient.generatorCubehelix') },
    { value: 'perceptual', label: t('gradient.generatorPerceptual') },
  ], [t]);
  const familyOptions = useMemo(() => PERCEPTUAL_GRADIENT_FAMILIES.map((family) => ({
    value: family,
    label: t(FAMILY_MESSAGE_KEYS[family]),
  })), [t]);
  const generatorParams = useMemo<GradientGeneratorUiParams>(() => ({
    algorithm: generatorAlgorithm,
    baseColor: generatorBaseColor,
    colorIntensity: generatorColorIntensity,
    brightness: generatorBrightness,
    contrast: generatorContrast,
    family: generatorFamily,
    accentPosition: generatorAccentPosition,
    accentWidth: generatorAccentWidth,
    stopCount: generatorStopCount,
  }), [
    generatorAccentPosition,
    generatorAccentWidth,
    generatorAlgorithm,
    generatorBaseColor,
    generatorBrightness,
    generatorColorIntensity,
    generatorContrast,
    generatorFamily,
    generatorStopCount,
  ]);
  const generatorParamsKey = useMemo(() => JSON.stringify(generatorParams), [generatorParams]);
  useEffect(() => {
    setStopEdits((previous) => previous.paramsKey === generatorParamsKey
      ? previous
      : { paramsKey: generatorParamsKey, colors: {} });
    setEditingStopIndex(null);
  }, [generatorParamsKey]);
  const generatedGradientStops = useMemo(
    () => generateGradientFromUi(generatorParams),
    [generatorParams],
  );
  const currentStopEdits = useMemo(
    () => stopEdits.paramsKey === generatorParamsKey ? stopEdits.colors : EMPTY_STOP_EDITS,
    [generatorParamsKey, stopEdits],
  );
  const editableGradientStops = useMemo(
    () => generatedGradientStops.map((stop, index) => ({
      ...stop,
      color: currentStopEdits[index] ?? stop.color,
    })),
    [currentStopEdits, generatedGradientStops],
  );
  const generatorPreviewStyle = useMemo(
    () => buildGradientPreviewStyle(
      editableGradientStops,
      undefined,
      GENERATED_RAMP_SETTINGS.rampColorMode,
      GENERATED_RAMP_SETTINGS.rampInterpolation,
      0,
      GENERATED_RAMP_SETTINGS.rampRepeat,
      GENERATED_RAMP_SETTINGS.rampMirror,
    ),
    [editableGradientStops],
  );
  const selectedStop = editingStopIndex === null ? null : editableGradientStops[editingStopIndex] ?? null;
  const selectedStopIsEdited = editingStopIndex !== null && currentStopEdits[editingStopIndex] !== undefined;

  const handleApplyGeneratedGradient = () => {
    if (editableGradientStops.length === 0) return;
    setGradient({
      stops: editableGradientStops,
      ...GENERATED_RAMP_SETTINGS,
    });
  };

  const handleStopColorChange = (color: string) => {
    if (editingStopIndex === null) return;
    setStopEdits((previous) => ({
      paramsKey: generatorParamsKey,
      colors: {
        ...(previous.paramsKey === generatorParamsKey ? previous.colors : {}),
        [editingStopIndex]: color,
      },
    }));
  };

  const handleResetEditedStop = () => {
    if (editingStopIndex === null) return;
    setStopEdits((previous) => {
      const colors = previous.paramsKey === generatorParamsKey ? { ...previous.colors } : {};
      delete colors[editingStopIndex];
      return { paramsKey: generatorParamsKey, colors };
    });
  };

  const handleShuffleGenerator = () => {
    const hue = Math.random() * 360;
    const baseColor = mapOklchToSrgb({
      L: 0.35 + Math.random() * 0.4,
      C: 0.04 + Math.random() * 0.16,
      H: hue,
    }).hex;
    setGeneratorBaseColor(baseColor);
    setGeneratorColorIntensity(0.2 + Math.random() * 0.7);
    setGeneratorBrightness(0.2 + Math.random() * 0.6);
    setGeneratorContrast(0.2 + Math.random() * 0.7);
    setGeneratorFamily(PERCEPTUAL_GRADIENT_FAMILIES[Math.floor(Math.random() * PERCEPTUAL_GRADIENT_FAMILIES.length)] ?? FALLBACK_FAMILY);
    setGeneratorAccentPosition(0.3 + Math.random() * 0.4);
    setGeneratorAccentWidth(0.1 + Math.random() * 0.25);
    setGeneratorStopCount(3 + Math.floor(Math.random() * 8));
    setEditingStopIndex(null);
  };

  return (
    <section className="space-y-4 border border-fire/35 bg-k-surface/55 p-3">
      <div className="min-w-0">
        <label className="mb-1 block text-[9px] font-display uppercase tracking-wider text-cream/80">
          {t('gradient.generatorBaseColor')}
        </label>
        <div className="tq-color-input min-w-0 border border-panel-border bg-k-bg/50">
          <InputColor
            value={generatorBaseColor}
            onChange={setGeneratorBaseColor}
            alpha={false}
            aria-label={t('gradient.generatorBaseColor')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-display font-semibold uppercase tracking-wider text-k-muted">
          {t('gradient.generatorPreview')}
        </label>
        <div
          className="h-12 w-full border border-panel-border bg-k-bg"
          style={generatorPreviewStyle}
          role="img"
          aria-label={t('gradient.generatorPreview')}
        />
        <div
          className="flex h-8 w-full overflow-hidden border border-panel-border bg-k-bg"
          role="group"
          aria-label={t('gradient.generatorStops')}
        >
          {editableGradientStops.map((stop, index) => {
            const stopLabel = t('gradient.generatorStop') + ' ' + (index + 1);
            const isSelected = editingStopIndex === index;
            return (
              <button
                key={index}
                type="button"
                className={isSelected
                  ? 'relative min-w-0 flex-1 ring-2 ring-inset ring-cream focus-visible:outline-none'
                  : 'relative min-w-0 flex-1 hover:ring-1 hover:ring-inset hover:ring-cream/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cream'}
                style={{ backgroundColor: stop.color }}
                onClick={() => setEditingStopIndex((current) => current === index ? null : index)}
                aria-label={stopLabel + ': ' + stop.color}
                aria-pressed={isSelected}
                aria-controls={isSelected ? 'generator-stop-editor' : undefined}
                title={stopLabel + ': ' + stop.color}
              />
            );
          })}
        </div>
        <p className="text-[9px] leading-relaxed text-k-muted">
          {t('gradient.generatorEditStopHint')}
        </p>
      </div>

      <CustomSelect
        label={t('gradient.generatorAlgorithm')}
        value={generatorAlgorithm}
        options={algorithmOptions}
        localizeLabel={false}
        localizeOptions={false}
        onChange={(value) => setGeneratorAlgorithm(value as GradientGeneratorAlgorithm)}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleShuffleGenerator}
          className="border border-panel-border bg-k-bg/40 py-2 text-[10px] font-display font-bold uppercase tracking-wider text-cream transition-colors hover:border-cream/50 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire"
        >
          {t('common.shuffle')}
        </button>
        <button
          type="button"
          onClick={handleApplyGeneratedGradient}
          className="bg-cream py-2 text-[10px] font-display font-bold uppercase tracking-wider text-k-bg transition-colors hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire"
        >
          {t('gradient.generatorApply')}
        </button>
      </div>

      {selectedStop && editingStopIndex !== null && (
        <div id="generator-stop-editor" className="space-y-2">
          <ColorPicker
            color={selectedStop.color}
            onChange={handleStopColorChange}
            onClose={() => setEditingStopIndex(null)}
          />
          <button
            type="button"
            onClick={handleResetEditedStop}
            disabled={!selectedStopIsEdited}
            className="border border-panel-border px-2 py-1 text-[10px] text-cream transition-colors hover:border-cream/50 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('gradient.generatorResetStop')}
          </button>
        </div>
      )}

      <p className="text-[9px] leading-relaxed text-cream/80">
        {t('gradient.generatorDescription')}
      </p>

      {generatorAlgorithm === 'perceptual' && (
        <CustomSelect
          label={t('gradient.generatorFamily')}
          value={generatorFamily}
          options={familyOptions}
          localizeLabel={false}
          localizeOptions={false}
          onChange={(value) => setGeneratorFamily(value as PerceptualGradientFamily)}
        />
      )}

      <div className="grid grid-cols-1 gap-3">
        <SliderField
          label={t('gradient.generatorColorIntensity')}
          value={generatorColorIntensity}
          onChange={setGeneratorColorIntensity}
          format={(value) => Math.round(value * 100) + '%'}
          limitKey="paletteGenerator.colorIntensity"
        />
        <SliderField
          label={t('gradient.generatorBrightness')}
          value={generatorBrightness}
          onChange={setGeneratorBrightness}
          format={(value) => Math.round(value * 100) + '%'}
          limitKey="paletteGenerator.brightness"
        />
        <SliderField
          label={t('gradient.generatorContrast')}
          value={generatorContrast}
          onChange={setGeneratorContrast}
          format={(value) => Math.round(value * 100) + '%'}
          limitKey="paletteGenerator.contrast"
        />
        <SliderField
          label={t('gradient.generatorStops')}
          value={generatorStopCount}
          onChange={(value) => setGeneratorStopCount(Math.round(value))}
          format={(value) => String(Math.round(value))}
          limitKey="paletteGenerator.stopCount"
        />
      </div>

      {generatorAlgorithm === 'perceptual' && generatorFamily === 'accent' && (
        <div className="grid grid-cols-1 gap-3">
          <SliderField
            label={t('gradient.generatorAccentPosition')}
            value={generatorAccentPosition}
            onChange={setGeneratorAccentPosition}
            format={(value) => Math.round(value * 100) + '%'}
            limitKey="paletteGenerator.accentPosition"
          />
          <SliderField
            label={t('gradient.generatorAccentWidth')}
            value={generatorAccentWidth}
            onChange={setGeneratorAccentWidth}
            format={(value) => Math.round(value * 100) + '%'}
            limitKey="paletteGenerator.accentWidth"
          />
        </div>
      )}
    </section>
  );
}
