import { useRef, useState, type ReactNode } from 'react';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';
import { imageFileToCanvas } from '../lib/applySlitToImage';
import { useGradientStore } from '../store/gradientStore';
import {
  DEFAULT_TEXTURE,
  TEXTURE_PRESET_LOOKS,
  getTexturePresetPatch,
  isRadialTexturePreset,
  type TextureImageFit,
  type TexturePreset,
  type TextureSource,
} from '../types/texture';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

/** Largest side of a loaded height map. Larger images are scaled down to bound GPU memory. */
const TEXTURE_IMAGE_MAX_DIMENSION = 4096;

const percent = (value: number) => `${Math.round(value * 100)}%`;
const twoDecimals = (value: number) => value.toFixed(2);

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { language } = useLanguage();
  return (
    <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
      <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">{localizeUiLabel(title, language)}</span>
      {children}
    </div>
  );
}

type TexturePanelProps = {
  imageSource: HTMLCanvasElement | null;
  imageName: string;
  onImageLoad: (canvas: HTMLCanvasElement, name: string) => void;
  onImageClear: () => void;
};

/**
 * SANDBOX Texture settings. The loaded image is session-only state owned by the
 * workspace, so this panel never writes it to the Preset.
 */
export function TexturePanel({ imageSource, imageName, onImageLoad, onImageClear }: TexturePanelProps) {
  const { t } = useLanguage();
  const texture = useGradientStore(state => state.texture);
  const { setTexture } = applicationCommands;
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageMode = texture.source === 'image';
  const radial = !imageMode && isRadialTexturePreset(texture.preset);
  const disabled = !texture.enabled;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const canvas = await imageFileToCanvas(file, TEXTURE_IMAGE_MAX_DIMENSION);
      onImageLoad(canvas, file.name);
    } catch (cause) {
      console.error('Texture image load failed:', cause);
      setError(t('texture.imageError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-[11px]" data-texture-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          {t('texture.title')}
        </span>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">
          {t('texture.description')}
        </p>
      </div>

      <Section title="Material">
        <CustomSelect
          label="Source"
          value={texture.source}
          localizeOptions={false}
          options={[
            { value: 'procedural', label: t('texture.sourceProcedural') },
            { value: 'image', label: t('texture.sourceImage') },
          ]}
          onChange={(value) => setTexture({ source: value as TextureSource })}
        />
        {!imageMode && (
          <CustomSelect
            label="Preset"
            value={texture.preset}
            localizeOptions={false}
            options={[
              { value: 'brushedMetal', label: t('texture.presetBrushedMetal') },
              { value: 'spunMetal', label: t('texture.presetSpunMetal') },
              { value: 'cdGroove', label: t('texture.presetCdGroove') },
              { value: 'paper', label: t('texture.presetPaper') },
            ]}
            onChange={(value) => setTexture(getTexturePresetPatch(value as TexturePreset))}
          />
        )}
        {imageMode && (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              {imageSource && (
                <button
                  type="button"
                  onClick={onImageClear}
                  className="bg-red-900/30 px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-red-900/50 hover:text-red-300"
                >
                  {t('texture.imageClear')}
                </button>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="bg-cream/10 px-2 py-0.5 text-[10px] text-cream transition-all hover:bg-cream/20 hover:text-k-text disabled:opacity-50"
              >
                {loading ? 'Loading...' : t('texture.imageLoad')}
              </button>
              <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            {imageSource ? (
              <p className="truncate text-[10px] text-deep">{imageName}</p>
            ) : (
              <p className="text-[10px] text-amber-300">{t('texture.imageMissing')}</p>
            )}
            <CustomSelect
              label="Fit"
              value={texture.imageFit}
              localizeOptions={false}
              options={[
                { value: 'cover', label: t('texture.fitCover') },
                { value: 'tile', label: t('texture.fitTile') },
              ]}
              onChange={(value) => setTexture({ imageFit: value as TextureImageFit })}
            />
            {error && <p className="text-[10px] text-red-400">{error}</p>}
          </div>
        )}
      </Section>

      <Section title="Surface">
        <SliderField
          label="Amount"
          value={texture.strength}
          limitKey="texture.strength"
          format={percent}
          disabled={disabled}
          onChange={(strength) => setTexture({ strength })}
        />
        <SliderField
          label={imageMode && texture.imageFit === 'tile' ? 'Repeat' : 'Scale'}
          value={texture.scale}
          limitKey="texture.scale"
          format={twoDecimals}
          disabled={disabled}
          onChange={(scale) => setTexture({ scale })}
        />
        {!radial && (
          <SliderField
            label="Grain Angle"
            value={texture.rotation}
            limitKey="texture.rotation"
            control="angle"
            format={(value) => `${value.toFixed(0)}°`}
            disabled={disabled}
            onChange={(rotation) => setTexture({ rotation })}
          />
        )}
        {radial && (
          <>
            <SliderField
              label="Center X"
              value={texture.centerX}
              limitKey="texture.centerX"
              format={percent}
              disabled={disabled}
              onChange={(centerX) => setTexture({ centerX })}
            />
            <SliderField
              label="Center Y"
              value={texture.centerY}
              limitKey="texture.centerY"
              format={percent}
              disabled={disabled}
              onChange={(centerY) => setTexture({ centerY })}
            />
          </>
        )}
        <SliderField
          label="Relief"
          value={texture.bump}
          limitKey="texture.bump"
          format={twoDecimals}
          disabled={disabled}
          onChange={(bump) => setTexture({ bump })}
        />
      </Section>

      <Section title="Reflection">
        <SliderField
          label="Roughness"
          value={texture.roughness}
          limitKey="texture.roughness"
          format={twoDecimals}
          disabled={disabled}
          onChange={(roughness) => setTexture({ roughness })}
        />
        <SliderField
          label="Anisotropy"
          value={texture.anisotropy}
          limitKey="texture.anisotropy"
          format={percent}
          disabled={disabled}
          onChange={(anisotropy) => setTexture({ anisotropy })}
        />
        <SliderField
          label="Metallic"
          value={texture.metallic}
          limitKey="texture.metallic"
          format={percent}
          disabled={disabled}
          onChange={(metallic) => setTexture({ metallic })}
        />
        <SliderField
          label="Specular"
          value={texture.specular}
          limitKey="texture.specular"
          format={twoDecimals}
          disabled={disabled}
          onChange={(specular) => setTexture({ specular })}
        />
      </Section>

      <Section title="Light">
        <SliderField
          label="Light Angle"
          value={texture.lightAngle}
          limitKey="texture.lightAngle"
          control="angle"
          format={(value) => `${value.toFixed(0)}°`}
          disabled={disabled}
          onChange={(lightAngle) => setTexture({ lightAngle })}
        />
        <SliderField
          label="Light Height"
          value={texture.lightHeight}
          limitKey="texture.lightHeight"
          format={twoDecimals}
          disabled={disabled}
          onChange={(lightHeight) => setTexture({ lightHeight })}
        />
        <SliderField
          label="Light Sweep"
          value={texture.lightSweep}
          limitKey="texture.lightSweep"
          format={(value) => `${value.toFixed(0)}×`}
          disabled={disabled}
          onChange={(lightSweep) => setTexture({ lightSweep })}
        />
      </Section>

      <Section title="Diffraction">
        <SliderField
          label="Diffraction"
          value={texture.diffraction}
          limitKey="texture.diffraction"
          format={percent}
          disabled={disabled}
          onChange={(diffraction) => setTexture({ diffraction })}
        />
        <SliderField
          label="Spread"
          value={texture.diffractionSpread}
          limitKey="texture.diffractionSpread"
          format={twoDecimals}
          disabled={disabled}
          onChange={(diffractionSpread) => setTexture({ diffractionSpread })}
        />
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setTexture({
            ...DEFAULT_TEXTURE,
            ...TEXTURE_PRESET_LOOKS[texture.preset],
            enabled: texture.enabled,
            source: texture.source,
            preset: texture.preset,
            imageFit: texture.imageFit,
          })}
          className="inline-flex h-6 items-center gap-1.5 px-1.5 text-[9px] font-display uppercase tracking-wider text-tab-inactive transition-colors hover:bg-k-muted hover:text-k-text"
        >
          {t('common.reset')}
        </button>
      </div>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {t('texture.hint')}
      </p>
    </div>
  );
}
