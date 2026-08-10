import { useLanguage } from '../i18n/LanguageProvider';
import { useGradientStore } from '../store/gradientStore';
import { CONE_SEAM_BLEND_MAX, DEFAULT_CONE_VIEW, type ConeSeamMode } from '../types/coneView';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';

export function ConeViewPanel() {
  const { t } = useLanguage();
  const { coneView, setConeView } = useGradientStore();

  return (
    <div className="space-y-3 text-[11px]" data-cone-view-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
            {t('cone.surface')}
          </span>
          <span className="border border-cyan-200/25 bg-k-bg/45 px-2 py-1 font-display text-[8px] font-bold uppercase tracking-[0.13em] text-cyan-100/75">
            {t('cone.unlit')}
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">{t('cone.description')}</p>
      </div>

      <div className="space-y-3 border border-cream/25 bg-k-surface/35 p-3">
        <CustomSelect
          label="Mapping"
          value={coneView.mappingMode}
          localizeOptions={false}
          options={[
            { value: 'flow', label: 'Flow · Apex → Opening' },
            { value: 'projection', label: 'Direct Projection · Fixed' },
          ]}
          onChange={(mappingMode) => setConeView({ mappingMode: mappingMode as 'flow' | 'projection' })}
        />
        <SliderField
          label="Depth"
          value={coneView.depth}
          min={2}
          max={30}
          step={0.1}
          defaultValue={DEFAULT_CONE_VIEW.depth}
          onChange={(depth) => setConeView({ depth })}
        />
        <SliderField
          label="Rotation"
          value={coneView.rotation}
          min={-180}
          max={180}
          step={1}
          defaultValue={DEFAULT_CONE_VIEW.rotation}
          format={(value) => `${Math.round(value)}°`}
          onChange={(rotation) => setConeView({ rotation })}
        />
        <div className="flex items-center justify-between gap-3 border border-cyan-200/20 bg-cyan-300/[0.04] px-2.5 py-2">
          <div className="min-w-0">
            <span className="block font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100">{t('cone.apexPosition')}</span>
            <span className="mt-1 block text-[9px] text-cream/55">{t('cone.apexHint')}</span>
          </div>
          <button
            type="button"
            className="shrink-0 border border-cream/25 px-2 py-1 font-display text-[9px] font-semibold uppercase tracking-[0.08em] text-cream/75 transition-colors hover:border-fire/60 hover:bg-fire/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            onClick={() => setConeView({ apexX: DEFAULT_CONE_VIEW.apexX, apexY: DEFAULT_CONE_VIEW.apexY })}
          >
            {t('cone.resetPosition')}
          </button>
        </div>
        <SliderField
          label="Texture Repeat"
          value={coneView.textureRepeat}
          min={1}
          max={8}
          step={1}
          defaultValue={DEFAULT_CONE_VIEW.textureRepeat}
          onChange={(textureRepeat) => setConeView({ textureRepeat })}
        />
        <CustomSelect
          label="Seam Mode"
          value={coneView.seamMode}
          options={[
            { value: 'mirror', label: 'Mirror Repeat' },
            { value: 'weld', label: 'Edge Weld' },
          ]}
          onChange={(seamMode) => setConeView({ seamMode: seamMode as ConeSeamMode })}
        />
        <SliderField
          label="Seam Blend"
          value={coneView.seamBlend}
          min={0}
          max={CONE_SEAM_BLEND_MAX}
          step={0.01}
          defaultValue={DEFAULT_CONE_VIEW.seamBlend}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(seamBlend) => setConeView({ seamBlend })}
        />
        <SliderField
          label="Flow Cycles"
          value={coneView.flowCycles}
          min={-30}
          max={30}
          step={1}
          defaultValue={DEFAULT_CONE_VIEW.flowCycles}
          disabled={coneView.mappingMode === 'projection'}
          onChange={(flowCycles) => setConeView({ flowCycles })}
        />
      </div>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {coneView.mappingMode === 'projection'
          ? 'Direct Projection keeps the processed 2D frame fixed on the cone and does not advance Flow Cycles.'
          : t('cone.flowHint')}
      </p>
    </div>
  );
}
