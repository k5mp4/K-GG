import { useRef, useState, type ReactNode } from 'react';
import { InputColor } from 'tweeq';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';
import { imageFileToCanvas } from '../lib/applySlitToImage';
import { useGradientStore } from '../store/gradientStore';
import {
  DEFAULT_DISTORT_CHROMA,
  type DistortChromaLensSource,
  type DistortChromaWrap,
} from '../types/distortChroma';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

/** Largest side of a loaded Lens image. Larger images are scaled down to bound GPU memory. */
const LENS_IMAGE_MAX_DIMENSION = 4096;

const COLOR_INPUT_CLASS = 'tq-color-input w-[132px] min-w-0 flex-none border border-panel-border bg-k-bg/50';
const oneDecimal = (value: number) => value.toFixed(1);
const twoDecimals = (value: number) => value.toFixed(2);
const pixels = (value: number) => `${value.toFixed(1)} px`;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className={`block w-fit font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100${hint ? ' hint-label' : ''}`} title={hint}>{localizeUiLabel(title, language)}</span>
      {children}
    </div>
  );
}

type DistortChromaPanelProps = {
  imageSource: HTMLCanvasElement | null;
  imageName: string;
  onImageLoad: (canvas: HTMLCanvasElement, name: string) => void;
  onImageClear: () => void;
};

const COLOR_ROWS = [
  { key: 'color1', label: 'Color 1' },
  { key: 'color2', label: 'Color 2' },
  { key: 'color3', label: 'Color 3' },
] as const;

/**
 * Distort Chroma settings. The Lens image is session-only state owned by the
 * workspace, so this panel never writes it to the Preset.
 */
export function DistortChromaPanel({ imageSource, imageName, onImageLoad, onImageClear }: DistortChromaPanelProps) {
  const { t } = useLanguage();
  const config = useGradientStore(state => state.distortChroma);
  const { setDistortChroma } = applicationCommands;
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageMode = config.lensSource === 'image';
  const disabled = !config.enabled;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const canvas = await imageFileToCanvas(file, LENS_IMAGE_MAX_DIMENSION);
      onImageLoad(canvas, file.name);
    } catch (cause) {
      console.error('Distort Chroma lens image load failed:', cause);
      setError(t('distortChroma.imageError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-[11px]" data-distort-chroma-panel>
      <Section title="Lens" hint={[t('distortChroma.description'), t('distortChroma.hint')].join('\n')}>
        <CustomSelect
          label="Lens Source"
          value={config.lensSource}
          localizeOptions={false}
          options={[
            { value: 'source', label: t('distortChroma.lensLayer') },
            { value: 'image', label: t('distortChroma.lensImage') },
          ]}
          onChange={(value) => setDistortChroma({ lensSource: value as DistortChromaLensSource })}
        />
        {imageMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              {imageSource && (
                <button
                  type="button"
                  onClick={onImageClear}
                  className="bg-red-900/30 px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
                >
                  {t('distortChroma.imageClear')}
                </button>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="bg-cream/10 px-2 py-0.5 text-[10px] text-cream transition-all hover:bg-cream/20 hover:text-k-text disabled:opacity-50"
              >
                {loading ? 'Loading...' : t('distortChroma.imageLoad')}
              </button>
              <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            {imageSource ? (
              <p className="truncate text-[10px] text-deep">{imageName}</p>
            ) : (
              <p className="text-[10px] text-amber-300">{t('distortChroma.imageMissing')}</p>
            )}
            {error && <p className="text-[10px] text-red-400">{error}</p>}
          </div>
        )}
        <SliderField
          label="Lens Blur"
          value={config.lensBlur}
          limitKey="distortChroma.lensBlur"
          format={pixels}
          disabled={disabled}
          onChange={(lensBlur) => setDistortChroma({ lensBlur })}
        />
        <SliderField
          label="Bump"
          value={config.bump}
          limitKey="distortChroma.bump"
          format={oneDecimal}
          disabled={disabled}
          onChange={(bump) => setDistortChroma({ bump })}
        />
        <SliderField
          label="Rotate"
          value={config.rotate}
          limitKey="distortChroma.rotate"
          control="angle"
          format={(value) => `${value.toFixed(0)}°`}
          disabled={disabled}
          onChange={(rotate) => setDistortChroma({ rotate })}
        />
      </Section>

      <Section title="Distortion">
        <SliderField
          label="Amount X"
          value={config.amountX}
          limitKey="distortChroma.amountX"
          format={pixels}
          disabled={disabled}
          onChange={(amountX) => setDistortChroma({ amountX })}
        />
        <SliderField
          label="Amount Y"
          value={config.amountY}
          limitKey="distortChroma.amountY"
          format={pixels}
          disabled={disabled}
          onChange={(amountY) => setDistortChroma({ amountY })}
        />
        <CustomSelect
          label="Edge"
          value={config.wrap}
          localizeOptions={false}
          options={[
            { value: 'clamp', label: t('distortChroma.wrapClamp') },
            { value: 'repeat', label: t('distortChroma.wrapRepeat') },
            { value: 'mirror', label: t('distortChroma.wrapMirror') },
          ]}
          onChange={(value) => setDistortChroma({ wrap: value as DistortChromaWrap })}
        />
      </Section>

      <Section title="Spectrum">
        <SliderField
          label="Warp Red"
          value={config.warpRed}
          limitKey="distortChroma.warpRed"
          format={twoDecimals}
          disabled={disabled}
          onChange={(warpRed) => setDistortChroma({ warpRed })}
        />
        <SliderField
          label="Warp Blue"
          value={config.warpBlue}
          limitKey="distortChroma.warpBlue"
          format={twoDecimals}
          disabled={disabled}
          onChange={(warpBlue) => setDistortChroma({ warpBlue })}
        />
        <SliderField
          label="Steps"
          value={config.steps}
          limitKey="distortChroma.steps"
          format={(value) => `${Math.round(value)}`}
          disabled={disabled}
          onChange={(steps) => setDistortChroma({ steps: Math.round(steps) })}
        />
        {COLOR_ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-deep font-display uppercase tracking-wider">{label}</span>
            <div className={COLOR_INPUT_CLASS}>
              <InputColor
                value={config[key]}
                onChange={(value) => setDistortChroma({ [key]: value.toUpperCase() })}
                alpha={false}
                aria-label={`Distort Chroma ${label}`}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-deep font-display uppercase tracking-wider">White Balance</span>
          <Toggle
            variant="switch"
            size="xs"
            checked={config.whiteBalance}
            ariaLabel="White Balance"
            onChange={(whiteBalance) => setDistortChroma({ whiteBalance })}
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setDistortChroma({
            ...DEFAULT_DISTORT_CHROMA,
            enabled: config.enabled,
            lensSource: config.lensSource,
          })}
          className="inline-flex h-6 items-center gap-1.5 px-1.5 text-[9px] font-display uppercase tracking-wider text-tab-inactive transition-colors hover:bg-k-muted hover:text-k-text"
        >
          {t('common.reset')}
        </button>
      </div>
    </div>
  );
}
