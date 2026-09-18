import { useState, useRef, useEffect, useMemo } from 'react';
import { SliderField } from './SliderField';
import { CustomSelect } from './CustomSelect';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  extractColorsFromPixels,
  extractPixelsFromImage,
  sortPalette,
  rgbToHex,
  type RGB,
} from '../lib/colorExtractor';
import { generateHarmonyPalette, type HarmonyType } from '../lib/colorHarmony';
import { buildGradientPreviewStyle } from '../lib/gradientPreview';
import {
  generateGradientFromUi,
  type GradientGeneratorAlgorithm,
  type GradientGeneratorUiParams,
} from '../lib/gradientGenerator';
import { mapOklchToSrgb } from '../lib/colorSpace';
import { PERCEPTUAL_GRADIENT_FAMILIES, type PerceptualGradientFamily } from '../lib/perceptualGradient';
import type { MessageKey } from '../i18n/messages';
import { InputColor } from 'tweeq';

const HARMONY_OPTIONS: { value: HarmonyType; label: string }[] = [
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'split-complementary', label: 'Split-Complementary' },
  { value: 'triad', label: 'Triad' },
  { value: 'square', label: 'Square' },
  { value: 'compound', label: 'Compound' },
  { value: 'shades', label: 'Shades' },
  { value: 'monochromatic', label: 'Monochromatic' },
];

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

interface ColorPaletteGeneratorProps {
  overlayImageElement: HTMLImageElement | null;
  embedded?: boolean;
}

export function ColorPaletteGenerator({ overlayImageElement, embedded = false }: ColorPaletteGeneratorProps) {
  const { t } = useLanguage();
  const { setGradient } = applicationCommands;

  const [colorCount, setColorCount] = useState<number>(5);
  const [sortBy, setSortBy] = useState<'dominance' | 'luminance' | 'hue'>('dominance');
  const [pixels, setPixels] = useState<RGB[]>([]);
  const [palette, setPalette] = useState<{ color: RGB; count: number }[]>([]);
  
  // プレビュー表示用
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [imageName, setImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [harmonyBaseColor, setHarmonyBaseColor] = useState('#D11402');
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary');
  const [showHarmonyPreviews, setShowHarmonyPreviews] = useState(false);
  const [copiedHarmonyIndex, setCopiedHarmonyIndex] = useState<number | null>(null);
  const [generatorAlgorithm, setGeneratorAlgorithm] = useState<GradientGeneratorAlgorithm>('cubehelix');
  const [generatorBaseColor, setGeneratorBaseColor] = useState('#6377A6');
  const [generatorHueTravel, setGeneratorHueTravel] = useState(0.5);
  const [generatorColorIntensity, setGeneratorColorIntensity] = useState(0.62);
  const [generatorBrightness, setGeneratorBrightness] = useState(0.55);
  const [generatorContrast, setGeneratorContrast] = useState(0.58);
  const [generatorFamily, setGeneratorFamily] = useState<PerceptualGradientFamily>(FALLBACK_FAMILY);
  const [generatorAccentPosition, setGeneratorAccentPosition] = useState(0.58);
  const [generatorAccentWidth, setGeneratorAccentWidth] = useState(0.18);
  const [generatorStopCount, setGeneratorStopCount] = useState(5);
  const harmonyPalette = useMemo(
    () => generateHarmonyPalette(harmonyBaseColor, harmonyType),
    [harmonyBaseColor, harmonyType],
  );
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
    hueTravel: generatorHueTravel,
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
    generatorHueTravel,
    generatorStopCount,
  ]);
  const generatedGradientStops = useMemo(
    () => generateGradientFromUi(generatorParams),
    [generatorParams],
  );
  const generatorPreviewStyle = useMemo(
    () => buildGradientPreviewStyle(
      generatedGradientStops,
      undefined,
      GENERATED_RAMP_SETTINGS.rampColorMode,
      GENERATED_RAMP_SETTINGS.rampInterpolation,
      0,
      GENERATED_RAMP_SETTINGS.rampRepeat,
      GENERATED_RAMP_SETTINGS.rampMirror,
    ),
    [generatedGradientStops],
  );
  const renderHarmonyPreview = (option: { value: string }) => (
    <span className="flex h-full w-full" aria-hidden="true">
      {generateHarmonyPalette(harmonyBaseColor, option.value as HarmonyType).map((color, index) => (
        <span key={`${color}-${index}`} className="block h-full min-w-0 flex-1" style={{ backgroundColor: color }} />
      ))}
    </span>
  );

  // pixels または colorCount, sortBy が変化した時にパレットを再計算する
  useEffect(() => {
    if (pixels.length === 0) {
      setPalette([]);
      return;
    }
    const extracted = extractColorsFromPixels(pixels, colorCount);
    const sorted = sortPalette(extracted, sortBy);
    setPalette(sorted);
  }, [pixels, colorCount, sortBy]);

  // コピー状態をクリアするタイマー
  useEffect(() => {
    if (copiedIndex !== null) {
      const timer = setTimeout(() => setCopiedIndex(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copiedIndex]);

  useEffect(() => {
    if (copiedHarmonyIndex !== null) {
      const timer = setTimeout(() => setCopiedHarmonyIndex(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copiedHarmonyIndex]);

  // 画像オブジェクトからピクセルを抽出する共通処理
  const processImageElement = (img: HTMLImageElement, name: string, src?: string) => {
    setErrorMsg('');
    try {
      const extractedPixels = extractPixelsFromImage(img, 128);
      if (extractedPixels.length === 0) {
        setErrorMsg('画像からカラーデータを抽出できませんでした。');
        return;
      }
      setPixels(extractedPixels);
      setImageName(name);
      if (src) {
        setPreviewSrc(src);
      } else {
        setPreviewSrc(img.src);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('画像の解析中にエラーが発生しました。');
    }
  };

  // ローカルファイル読み込み
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFromFile(file);
  };

  const loadFromFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('画像ファイルを選択してください。');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      processImageElement(img, file.name, url);
    };
    img.onerror = () => {
      setErrorMsg('画像の読み込みに失敗しました。');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Image Overlay からの取得
  const handleLoadFromOverlay = () => {
    if (!overlayImageElement) return;
    processImageElement(overlayImageElement, 'Overlay Image');
  };

  // ドラッグ＆ドロップ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFromFile(file);
    }
  };

  // グラデーションへの適用
  const handleApply = () => {
    if (palette.length === 0) return;
    const stops = palette.map((item, index) => {
      const position = palette.length > 1 ? index / (palette.length - 1) : 0;
      return {
        stopId: crypto.randomUUID(),
        position,
        color: rgbToHex(item.color),
      };
    });
    setGradient({ stops });
  };

  const handleApplyHarmony = () => {
    if (harmonyPalette.length === 0) return;
    const stops = harmonyPalette.map((color, index) => ({
      stopId: crypto.randomUUID(),
      position: harmonyPalette.length > 1 ? index / (harmonyPalette.length - 1) : 0,
      color,
    }));
    setGradient({ stops });
  };

  const handleApplyGeneratedGradient = () => {
    if (generatedGradientStops.length === 0) return;
    setGradient({
      stops: generatedGradientStops,
      // The preview samples the generated sRGB stop chain with the same
      // settings. Resetting repeat/mirror avoids an old ramp mode changing
      // the result after Apply.
      ...GENERATED_RAMP_SETTINGS,
    });
  };

  const handleShuffleGenerator = () => {
    const hue = Math.random() * 360;
    const baseColor = mapOklchToSrgb({
      L: 0.5 + Math.random() * 0.2,
      C: 0.08 + Math.random() * 0.12,
      H: hue,
    }).hex;
    setGeneratorBaseColor(baseColor);
    setGeneratorHueTravel(-0.85 + Math.random() * 1.7);
    setGeneratorColorIntensity(0.2 + Math.random() * 0.7);
    setGeneratorBrightness(0.2 + Math.random() * 0.6);
    setGeneratorContrast(0.2 + Math.random() * 0.7);
    setGeneratorFamily(PERCEPTUAL_GRADIENT_FAMILIES[Math.floor(Math.random() * PERCEPTUAL_GRADIENT_FAMILIES.length)] ?? FALLBACK_FAMILY);
    setGeneratorAccentPosition(0.3 + Math.random() * 0.4);
    setGeneratorAccentWidth(0.1 + Math.random() * 0.25);
    setGeneratorStopCount(3 + Math.floor(Math.random() * 8));
  };

  const overlayImportButton = overlayImageElement ? (
    <button
      type="button"
      onClick={handleLoadFromOverlay}
      className="text-[10px] text-cream hover:text-k-text px-2 py-0.5 rounded-none bg-cream/10 hover:bg-cream/20 transition-all duration-150 cursor-pointer"
      title={t('gradient.importOverlay')}
    >
      {t('gradient.importOverlay')}
    </button>
  ) : null;

  return (
    <div className={`${embedded ? 'space-y-4' : 'border-t border-panel-border border-t-panel pt-4 space-y-4'}`}>
      {embedded ? (
        overlayImportButton && <div className="flex justify-end">{overlayImportButton}</div>
      ) : (
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-k-text">
            Color Palette Generator
          </h2>
          {overlayImportButton}
        </div>
      )}

      <section className="space-y-3 border border-fire/35 bg-k-surface/55 p-3" aria-labelledby="gradient-generator-title">
        <div>
          <h3 id="gradient-generator-title" className="text-[10px] font-display font-semibold uppercase tracking-[0.18em] text-cream">
            {t('gradient.generatorTitle')}
          </h3>
          <p className="mt-1 text-[9px] leading-relaxed text-cream/80">{t('gradient.generatorDescription')}</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <CustomSelect
            label={t('gradient.generatorAlgorithm')}
            value={generatorAlgorithm}
            options={algorithmOptions}
            localizeLabel={false}
            localizeOptions={false}
            onChange={(value) => setGeneratorAlgorithm(value as GradientGeneratorAlgorithm)}
          />
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
        </div>

        <div className="grid grid-cols-1 gap-2">
          <SliderField
            label={t('gradient.generatorHueTravel')}
            min={-1}
            max={1}
            step={0.01}
            value={generatorHueTravel}
            onChange={setGeneratorHueTravel}
            format={(value) => `${Math.round(value * 100)}%`}
            defaultValue={0.5}
          />
          <SliderField
            label={t('gradient.generatorColorIntensity')}
            min={0}
            max={1}
            step={0.01}
            value={generatorColorIntensity}
            onChange={setGeneratorColorIntensity}
            format={(value) => `${Math.round(value * 100)}%`}
            defaultValue={0.62}
          />
          <SliderField
            label={t('gradient.generatorBrightness')}
            min={0}
            max={1}
            step={0.01}
            value={generatorBrightness}
            onChange={setGeneratorBrightness}
            format={(value) => `${Math.round(value * 100)}%`}
            defaultValue={0.55}
          />
          <SliderField
            label={t('gradient.generatorContrast')}
            min={0}
            max={1}
            step={0.01}
            value={generatorContrast}
            onChange={setGeneratorContrast}
            format={(value) => `${Math.round(value * 100)}%`}
            defaultValue={0.58}
          />
          <SliderField
            label={t('gradient.generatorStops')}
            min={3}
            max={10}
            step={1}
            value={generatorStopCount}
            onChange={(value) => setGeneratorStopCount(Math.round(value))}
            format={(value) => `${Math.round(value)}`}
            defaultValue={5}
          />
        </div>

        {generatorAlgorithm === 'perceptual' && generatorFamily === 'accent' && (
          <div className="grid grid-cols-1 gap-2">
            <SliderField
              label={t('gradient.generatorAccentPosition')}
              min={0.1}
              max={0.9}
              step={0.01}
              value={generatorAccentPosition}
              onChange={setGeneratorAccentPosition}
              format={(value) => `${Math.round(value * 100)}%`}
              defaultValue={0.58}
            />
            <SliderField
              label={t('gradient.generatorAccentWidth')}
              min={0.04}
              max={0.5}
              step={0.01}
              value={generatorAccentWidth}
              onChange={setGeneratorAccentWidth}
              format={(value) => `${Math.round(value * 100)}%`}
              defaultValue={0.18}
            />
          </div>
        )}

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
          <div className="flex h-3 w-full overflow-hidden border border-panel-border/60">
            {generatedGradientStops.map((stop) => (
              <span key={`${stop.position}-${stop.color}`} className="min-w-0 flex-1" style={{ backgroundColor: stop.color }} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleShuffleGenerator}
            className="border border-panel-border bg-k-bg/40 py-2 text-[10px] font-display font-bold uppercase tracking-wider text-cream transition-colors hover:border-cream/50 hover:bg-cream/10"
          >
            {t('common.shuffle')}
          </button>
          <button
            type="button"
            onClick={handleApplyGeneratedGradient}
            className="bg-cream py-2 text-[10px] font-display font-bold uppercase tracking-wider text-k-bg transition-colors hover:bg-white active:scale-[0.98]"
          >
            {t('gradient.generatorApply')}
          </button>
        </div>
      </section>

      <section className="space-y-3 border border-cream/20 bg-k-surface/45 p-3" aria-labelledby="harmony-title">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h3 id="harmony-title" className="min-w-0 truncate text-[10px] font-display font-semibold uppercase tracking-[0.18em] text-cream">{t('gradient.harmonyTitle')}</h3>
          <button
            type="button"
            aria-pressed={showHarmonyPreviews}
            onClick={() => setShowHarmonyPreviews((visible) => !visible)}
            className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-fire ${showHarmonyPreviews ? 'border-fire/70 bg-fire/15 text-cream' : 'border-panel-border text-tab-inactive hover:border-cream/50 hover:text-k-text'}`}
            title="Harmony rule previews"
          >
            <span className="h-2.5 w-5 border border-current/40 bg-[linear-gradient(90deg,#d11402,#e5dabd,#6075a4)]" aria-hidden="true" />
            {showHarmonyPreviews ? 'Hide previews' : 'Show previews'}
          </button>
        </div>
        <p className="max-w-none text-[9px] leading-relaxed text-cream/80">{t('gradient.harmonyDescription')}</p>

        <div className="grid grid-cols-1 gap-2">
          <div className="min-w-0">
            <label className="mb-1 block text-[9px] font-display uppercase tracking-wider text-cream/80">{t('gradient.harmonyBaseColor')}</label>
            <div className="tq-color-input min-w-0 border border-panel-border bg-k-bg/50">
              <InputColor
                value={harmonyBaseColor}
                onChange={setHarmonyBaseColor}
                alpha={false}
                aria-label="配色補助の基準色"
              />
            </div>
          </div>
          <CustomSelect
            label={t('gradient.harmonyRule')}
            value={harmonyType}
            options={HARMONY_OPTIONS}
            optionPreview={renderHarmonyPreview}
            alwaysShowPreviews={showHarmonyPreviews}
            previewOnly={showHarmonyPreviews}
            onChange={(value) => setHarmonyType(value as HarmonyType)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex h-12 w-full overflow-hidden border border-panel-border bg-k-bg">
            {harmonyPalette.map((color, index) => {
              const isCopied = copiedHarmonyIndex === index;
              return (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  className="group relative min-w-0 flex-1 cursor-pointer transition-[flex] duration-200 hover:flex-[1.35] focus:z-10 focus:outline-none focus:ring-1 focus:ring-cream"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    void navigator.clipboard?.writeText(color);
                    setCopiedHarmonyIndex(index);
                  }}
                  title={`${color}（クリックでHexをコピー）`}
                  aria-label={`${color}（クリックでHexをコピー）`}
                >
                  {isCopied && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] font-bold text-cream">Copied</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] uppercase tracking-wider text-cream/75">
            <span>{harmonyPalette.length} colors</span>
            <span>color chips copy Hex</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyHarmony}
          className="w-full bg-cream py-2 text-xs font-display font-bold uppercase tracking-wider text-k-bg transition-colors hover:bg-white active:scale-[0.98]"
        >
          Apply palette to Gradient
        </button>
      </section>

      <section className="space-y-3 border-t border-cream/20 pt-3" aria-labelledby="image-palette-title">
        <div>
          <h3 id="image-palette-title" className="text-[10px] font-display font-semibold uppercase tracking-[0.18em] text-cream">
            {t('gradient.imagePaletteTitle')}
          </h3>
          <p className="mt-1 text-[9px] leading-relaxed text-cream/80">{t('gradient.imagePaletteDescription')}</p>
        </div>

        {/* ドラッグ＆ドロップ領域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          title={t('gradient.importImage')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border border-dashed rounded-none p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] bg-k-bg/20 ${
            isDragging
              ? 'border-fire bg-fire/5'
              : 'border-panel-border/60 hover:border-cream/40 hover:bg-cream/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {previewSrc ? (
            <div className="flex items-center gap-3 w-full">
              <img
                src={previewSrc}
                alt="Preview"
                className="w-12 h-12 object-cover border border-panel-border"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-k-text font-medium truncate">
                  {imageName || '読み込まれた画像'}
                </p>
                <p className="text-[9px] text-cream/75">
                  クリックまたはドロップで画像を変更
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 select-none">
              <svg
                className="mx-auto h-5 w-5 text-cream/75"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[10px] text-cream/75 leading-tight">
                {t('gradient.paletteDropHint')}
              </p>
            </div>
          )}
        </div>

      {errorMsg && (
        <p className="text-[10px] text-red-400 bg-red-950/20 p-2 border border-red-900/30">
          {errorMsg}
        </p>
      )}

      {pixels.length > 0 && (
        <div className="space-y-4">
          {/* コントロール群 */}
          <div className="space-y-3">
            <SliderField
              label="色数"
              min={2}
              max={10}
              step={1}
              value={colorCount}
              onChange={setColorCount}
              format={(v) => `${v}色`}
              defaultValue={5}
            />

            <CustomSelect
              label="ソート順"
              value={sortBy}
              options={[
                { value: 'dominance', label: '出現頻度順' },
                { value: 'luminance', label: '輝度順 (暗→明)' },
                { value: 'hue', label: '色相順' },
              ]}
              onChange={(val) => setSortBy(val as 'dominance' | 'luminance' | 'hue')}
            />
          </div>

          {/* 抽出カラープレビュー */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-display font-semibold uppercase tracking-wider text-k-muted">
              抽出されたカラーパレット
            </label>
            <div className="flex w-full h-8 border border-panel-border overflow-hidden bg-k-bg">
              {palette.map((item, idx) => {
                const hex = rgbToHex(item.color);
                const isCopied = copiedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="flex-1 h-full cursor-pointer transition-all duration-150 hover:scale-y-110 relative group"
                    style={{ backgroundColor: hex }}
                    onClick={() => {
                      navigator.clipboard.writeText(hex);
                      setCopiedIndex(idx);
                    }}
                    title={`${hex} (クリックでHexをコピー)`}
                  >
                    {isCopied && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-cream font-bold">
                        Copied
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] text-k-muted text-right">
              カラーブロックをクリックしてカラーコードをコピー
            </p>
          </div>

          {/* グラデーション適用ボタン */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full text-xs text-k-bg bg-cream hover:bg-white active:scale-[0.98] py-2 rounded-none font-display font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-black/10 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Apply to Gradient
          </button>
        </div>
      )}
      </section>
    </div>
  );
}
