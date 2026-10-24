import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';
import { normalizeGradientFieldInput, type GradientFieldInput } from '../types/gradient';
import { normalizeMaterialFieldConfig, type MaterialFieldConfig } from '../types/materialField';
import { getMaterialFieldInputInactiveReason } from '../lib/materialField';
import type { ParameterLimitKey } from '../lib/parameterLimits';
import { CustomSelect } from './CustomSelect';
import { SidebarSection } from './SidebarSection';
import { SliderField } from './SliderField';

const SOURCE_OPTIONS: { value: GradientFieldInput['source']; labelKey: MessageKey }[] = [
  { value: 'none', labelKey: 'materialField.source.none' },
  { value: 'thickness', labelKey: 'materialField.source.thickness' },
  { value: 'cracks', labelKey: 'materialField.source.cracks' },
];

const percent = (value: number) => `${Math.round(value * 100)}%`;
const fixed2 = (value: number) => value.toFixed(2);

type StructureRow = {
  key: keyof MaterialFieldConfig;
  labelKey: MessageKey;
  format: (value: number) => string;
  /** Seed and loop cycles stay discrete, so they have no keyframe track. */
  keyframed: boolean;
};

const STRUCTURE_ROWS: StructureRow[] = [
  { key: 'seed', labelKey: 'materialField.seed', format: value => String(Math.round(value)), keyframed: false },
  { key: 'scale', labelKey: 'materialField.scale', format: value => value.toFixed(1), keyframed: true },
  { key: 'thickness', labelKey: 'materialField.thickness', format: fixed2, keyframed: true },
  { key: 'thicknessVariation', labelKey: 'materialField.thicknessVariation', format: percent, keyframed: true },
  { key: 'cracks', labelKey: 'materialField.cracks', format: percent, keyframed: true },
  { key: 'warp', labelKey: 'materialField.warp', format: percent, keyframed: true },
  { key: 'morph', labelKey: 'materialField.morph', format: percent, keyframed: true },
  { key: 'cycles', labelKey: 'materialField.cycles', format: value => `${Math.round(value)}x`, keyframed: false },
  { key: 'phase', labelKey: 'materialField.phase', format: fixed2, keyframed: true },
];

/** Structure that only Ice reads; the Gradient input uses thickness and cracks. */
const ICE_STRUCTURE_ROWS: StructureRow[] = [
  { key: 'frost', labelKey: 'materialField.frost', format: percent, keyframed: true },
  { key: 'bubbles', labelKey: 'materialField.bubbles', format: percent, keyframed: true },
];

/**
 * Editor of the single saved `materialField`. Gradient and Ice both mount it,
 * so the same Seed and Scale are never shown as separate values.
 */
export function MaterialFieldStructureEditor() {
  const { t } = useLanguage();
  const materialField = normalizeMaterialFieldConfig(useGradientStore(state => state.materialField));
  const { setMaterialField } = applicationCommands;
  const renderRow = (row: StructureRow) => (
    <SliderField
      key={row.key}
      label={t(row.labelKey)}
      value={materialField[row.key]}
      limitKey={`materialField.${row.key}` as ParameterLimitKey}
      trackId={row.keyframed ? `materialField.${row.key}` : undefined}
      format={row.format}
      onChange={(value) => setMaterialField({ [row.key]: value })}
    />
  );
  return (
    <div className="space-y-2" data-material-field-structure>
      <p className="text-[10px] uppercase tracking-widest text-tab-inactive">{t('materialField.sharedBadge')}</p>
      {STRUCTURE_ROWS.map(renderRow)}
      <p className="text-[10px] text-tab-inactive">{t('materialField.iceOnly')}</p>
      {ICE_STRUCTURE_ROWS.map(renderRow)}
      <p className="text-[10px] text-tab-inactive">{t('materialField.loopHint')}</p>
    </div>
  );
}

/** Gradient input from the shared Material Field, with the structure editor. */
export function MaterialFieldControls() {
  const { t } = useLanguage();
  const { fieldInput: rawFieldInput, gradientType, mesh, imageGradientEnabled } = useGradientStore(useShallow(state => ({
    fieldInput: state.gradient.fieldInput,
    gradientType: state.gradient.gradientType,
    mesh: state.gradient.mesh,
    imageGradientEnabled: state.imageGradient.enabled,
  })));
  const fieldInput = normalizeGradientFieldInput(rawFieldInput);
  const { setGradient } = applicationCommands;
  const [structureOpen, setStructureOpen] = useState(false);
  // The source image lives outside the document store, so an enabled Image
  // Gradient is reported as protecting the gradient even before its image loads.
  const inactiveReason = getMaterialFieldInputInactiveReason({ fieldInput, gradientType, mesh }, imageGradientEnabled);
  const selected = fieldInput.source !== 'none';

  return (
    <div className="space-y-2" data-material-field-controls>
      <CustomSelect
        label={t('materialField.input')}
        localizeLabel={false}
        localizeOptions={false}
        value={fieldInput.source}
        options={SOURCE_OPTIONS.map(option => ({ value: option.value, label: t(option.labelKey) }))}
        onChange={(source) => setGradient({ fieldInput: { source: source as GradientFieldInput['source'] } })}
      />
      {selected && (
        <SliderField
          label={t('materialField.influence')}
          value={fieldInput.influence}
          limitKey="gradient.fieldInput.influence"
          format={percent}
          disabled={inactiveReason === 'image-gradient' || inactiveReason === 'mesh-direct'}
          onChange={(influence) => setGradient({ fieldInput: { influence } })}
        />
      )}
      {inactiveReason === 'image-gradient' && (
        <p className="text-[10px] text-tab-inactive" role="note" data-material-field-inactive="image-gradient">
          {t('materialField.inactiveImageGradient')}
        </p>
      )}
      {inactiveReason === 'mesh-direct' && (
        <p className="text-[10px] text-tab-inactive" role="note" data-material-field-inactive="mesh-direct">
          {t('materialField.inactiveMeshDirect')}
        </p>
      )}

      <SidebarSection
        id="material-field-structure"
        title={t('materialField.structure')}
        description={t('materialField.sharedDescription')}
        open={structureOpen}
        onToggle={() => setStructureOpen(open => !open)}
        nested
      >
        <MaterialFieldStructureEditor />
      </SidebarSection>
    </div>
  );
}
