import { useRef, useState } from 'react';
import { useGradientStore } from '../../store/gradientStore';
import { PresetPreview } from '../../components/PresetPreview';
import { Toggle } from '../../components/Toggle';
import { useLanguage } from '../../i18n/LanguageProvider';
import { localizeUiLabel } from '../../i18n/uiLabels';
import { getFolderPath } from '../../lib/presetLibrary';
import { createLocalEffectStackActions } from '../effectStack/effectStackController';
import { getVjParameters, getVjParameterValue, type VjParameter, type VjParameterRule } from './vjParameters';
import type { VjSession } from './useVjSession';
import { VjSpoutToggle } from './VjSpoutToggle';
import type { EffectStackKind, EffectStackLayer } from '../../types/distortion';
import './vj.css';

const EFFECT_NAMES: Record<EffectStackKind, string> = {
  noise: 'Noise', slit: 'Slit', stretch: 'Stretch', distort: 'Distort', mirror: 'Mirror',
  kaleidoscope: 'Kaleidoscope', voronoi: 'Voronoi', glass: 'Glass', glassTile: 'Glass Tile',
  diffuse: 'Diffuse', datamosh: 'Datamosh', cone: '3D', texture: 'Texture', distortChroma: 'Distort Chroma',
};

function ParameterRow({ parameter, session, detailed }: { parameter: VjParameter; session: VjSession; detailed: boolean }) {
  const { t, language } = useLanguage();
  const state = useGradientStore.getState();
  const value = getVjParameterValue(state, parameter);
  const rule = session.settings.rules[parameter.id] ?? {};
  const label = localizeUiLabel(parameter.label, language);
  const updateRule = (patch: VjParameterRule) => session.updateSettings({ rules: { ...session.settings.rules, [parameter.id]: { ...rule, ...patch } } });
  const min = rule.min ?? parameter.min ?? 0;
  const max = rule.max ?? parameter.max ?? 1;
  const step = parameter.step ?? 0.01;
  const invalidRange = parameter.type === 'number' && (
    Math.ceil((Math.max(parameter.min ?? 0, min) - (parameter.min ?? 0)) / step - 1e-9)
      > Math.floor((Math.min(parameter.max ?? 1, max) - (parameter.min ?? 0)) / step + 1e-9)
  );

  return <div className="vj-parameter" data-vj-parameter={parameter.id}>
    <div className="vj-value-row">
      {parameter.type === 'number' ? <div className="vj-number-control">
        <label><span title={label}>{label}</span><input type="number" aria-label={label}
          min={parameter.min} max={parameter.max} step={step} value={Number(value)}
          onChange={event => {
            const next = event.target.valueAsNumber;
            if (Number.isFinite(next)) session.editParameter(parameter, Math.max(parameter.min ?? 0, Math.min(parameter.max ?? 1, next)));
          }} /></label>
        <input type="range" aria-label={label} min={parameter.min} max={parameter.max} step={step} value={Number(value)}
          onChange={event => session.editParameter(parameter, event.target.valueAsNumber)} />
      </div> : <label className="vj-enum-row">
        <span title={label}>{label}</span>
        {parameter.type === 'enum' ? <select aria-label={label} value={String(value)}
          onChange={event => session.editParameter(parameter, event.target.value)}>
          {parameter.values?.map(option => <option key={String(option)} value={String(option)}>{option === 'legacy' ? 'Stipple' : localizeUiLabel(String(option), language)}</option>)}
        </select> : parameter.type === 'boolean' ? <input type="checkbox" aria-label={label} checked={Boolean(value)}
          onChange={event => session.editParameter(parameter, event.target.checked)} />
          : <input type="color" aria-label={label} value={String(value)}
            onChange={event => session.editParameter(parameter, event.target.value)} />}
      </label>}
      <button type="button" className="vj-lock" aria-label={t('vj.lock', { name: label })} aria-pressed={rule.locked === true}
        title={t('vj.lock', { name: label })} onClick={() => updateRule({ locked: !rule.locked })}>{rule.locked ? '●' : '○'}</button>
    </div>
    {detailed && <div className="vj-rule">
      {parameter.type === 'number' ? <div className="vj-range-row">
        <input type="number" aria-label={t('vj.minimum', { name: label })} min={parameter.min} max={parameter.max} step={step} value={min}
          onChange={event => updateRule({ min: event.target.value === '' ? undefined : Number(event.target.value) })} />
        <span aria-hidden="true">—</span>
        <input type="number" aria-label={t('vj.maximum', { name: label })} min={parameter.min} max={parameter.max} step={step} value={max}
          onChange={event => updateRule({ max: event.target.value === '' ? undefined : Number(event.target.value) })} />
      </div> : parameter.type === 'color' ? <input
        key={`${parameter.id}-${rule.colors?.join(',')}`} type="text" defaultValue={rule.colors?.join(', ') ?? ''}
        aria-label={t('vj.colors', { name: label })} placeholder="#ff3300, #ffcc99"
        onChange={event => event.currentTarget.setCustomValidity('')}
        onBlur={event => {
          const colors = event.currentTarget.value.split(',').map(color => color.trim()).filter(Boolean);
          if (colors.some(color => !/^#[0-9a-f]{6}$/i.test(color))) {
            event.currentTarget.setCustomValidity(t('vj.colorsInvalid'));
            event.currentTarget.reportValidity();
          } else updateRule({ colors });
        }}
      /> : <fieldset className="vj-choice-rule" aria-label={t('vj.allowed', { name: label })}>
        {parameter.values?.map(option => <label key={String(option)}>
          <input type="checkbox" checked={rule.values?.includes(option) ?? true} onChange={event => {
            const choices = rule.values ?? parameter.values ?? [];
            updateRule({ values: event.target.checked ? [...choices, option] : choices.filter(value => value !== option) });
          }} />
          <span>{typeof option === 'boolean' ? t(option ? 'common.on' : 'common.off') : option === 'legacy' ? 'Stipple' : String(option)}</span>
        </label>)}
      </fieldset>}
      {invalidRange && <p className="vj-warning">{t('vj.rangeInvalid')}</p>}
    </div>}
  </div>;
}

function EffectCard({ layer, session }: { layer: EffectStackLayer; session: VjSession }) {
  const { t } = useLanguage();
  const [detailed, setDetailed] = useState(false);
  const controls = useRef<HTMLDivElement>(null);
  const parameters = getVjParameters(layer.kind, useGradientStore.getState());
  const selected = session.document.effectPipeline.selectedKind === layer.kind;
  const actions = createLocalEffectStackActions(() => session.selectEffect);
  return <section className={`vj-effect${selected ? ' vj-effect--selected' : ''}`} data-vj-effect={layer.kind}>
    <div className="vj-effect-heading">
      <button type="button" className="vj-effect-select" title={EFFECT_NAMES[layer.kind]} aria-pressed={selected} onClick={() => session.selectEffect(layer.kind)}>{EFFECT_NAMES[layer.kind]}</button>
      <Toggle size="xs" checked={layer.enabled} ariaLabel={`${EFFECT_NAMES[layer.kind]} ${t('common.enabled')}`}
        onChange={enabled => actions.toggle(layer.kind, enabled)} />
    </div>
    <div className="vj-effect-controls" ref={controls}>
      {(detailed ? parameters : parameters.slice(0, 4)).map(parameter => <ParameterRow key={parameter.id} parameter={parameter} session={session} detailed={detailed} />)}
      {detailed && <div className="vj-card-actions">
        <button type="button" onClick={() => session.centerRanges(layer.kind)} title={t('vj.rangeHint')}>{t('vj.centerRanges')}</button>
        <button type="button" onClick={() => {
          const rules = { ...session.settings.rules };
          for (const parameter of parameters) rules[parameter.id] = { locked: rules[parameter.id]?.locked };
          session.updateSettings({ rules });
        }}>{t('vj.clearRange')}</button>
      </div>}
    </div>
    <button type="button" className="vj-details" aria-expanded={detailed} onClick={() => {
      controls.current?.scrollTo({ top: 0 }); setDetailed(value => !value);
    }}>{t(detailed ? 'vj.compact' : 'vj.details')} <span aria-hidden="true">{detailed ? '−' : '+'}</span></button>
  </section>;
}

export function VjDeck({ session, canvasW, canvasH, windowFailed, canvasRef }: {
  session: VjSession; canvasW: number; canvasH: number; windowFailed: boolean; canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const { t } = useLanguage();
  const [target, setTarget] = useState<'all' | 'selected'>('all');
  const [addId, setAddId] = useState('');
  const selectedKind = session.document.effectPipeline.selectedKind;
  const targetKind = target === 'selected' ? selectedKind : undefined;
  const current = session.presets.find(preset => preset.id === session.currentId);
  const performancePresets = session.performancePresets;
  const additions = session.presets.filter(preset => !session.settings.presetIds.includes(preset.id));
  const chosenId = additions.some(preset => preset.id === addId) ? addId : additions[0]?.id ?? '';
  const cues = session.queue.slice(0, 2).map(id => session.presets.find(preset => preset.id === id));
  const failure = session.error ?? session.preparation.error ?? session.autoPreparation.error;
  const error = failure ? t(`vj.error.${failure}`) : windowFailed ? t('vj.error.window') : session.libraryStatus === 'error' ? t('vj.libraryError') : null;
  const folderMode = session.settings.source === 'folder';

  return <div className="vj-deck" data-vj-deck>
    <header className="vj-toolbar" data-viewport-ui>
      <span className="vj-brand">{t('vj.title')}</span>
      <label className="vj-bpm">{t('vj.bpm')}<input type="number" min={1} max={999} step={0.01} value={session.settings.bpm}
        aria-label={t('vj.bpm')} onChange={event => session.updateSettings({ bpm: Number(event.target.value) })} /></label>
      <div className="vj-beats" role="meter" aria-label={t('vj.beat', { beat: session.position.beat + 1 })} aria-valuemin={1} aria-valuemax={4} aria-valuenow={session.position.beat + 1}>
        {[0, 1, 2, 3].map(beat => <span key={beat} className={session.running && session.position.beat === beat ? 'is-current' : ''}>{beat + 1}</span>)}
      </div>
      <button type="button" className={`vj-auto${session.running ? ' is-running' : ''}`} aria-pressed={session.running}
        disabled={!session.running && (session.availableIds.length < 2 || !session.allReady || !session.autoReady)} onClick={session.toggleRunning}>{t(session.running ? 'vj.stop' : 'vj.start')}</button>
      <span className="vj-auto-mode" title={t('vj.rangeHint')}>{t('vj.autoBounded')}</span>
      <select aria-label={t('vj.presets')} value={session.settings.shuffle ? 'shuffle' : 'sequential'}
        onChange={event => session.updateSettings({ shuffle: event.target.value === 'shuffle' })}>
        <option value="sequential">{t('vj.sequential')}</option><option value="shuffle">{t('vj.shuffle')}</option>
      </select>
      <VjSpoutToggle canvasRef={canvasRef} />
      <button type="button" className="vj-exit" onClick={() => session.updateSettings({ layoutMode: 'editor' })}>{t('vj.editor')}</button>
    </header>
    <div className="vj-deck-body">
      <section className="vj-main">
        <div className="vj-live-label"><span>{t('vj.live')}</span><span title={current?.name ?? session.document.presetName}>{current?.name ?? session.document.presetName}</span></div>
        <div className="vj-preview-space" aria-hidden="true" />
        <div className="vj-random-buttons">
          <select aria-label={t('vj.effects')} value={target} onChange={event => setTarget(event.target.value as typeof target)}>
            <option value="all">{t('vj.allEnabled')}</option><option value="selected">{t('vj.selectedEffect')}</option>
          </select>
          <button type="button" onClick={() => session.randomize('full', targetKind)}>{t('vj.fullRandom')}</button>
          <button type="button" onClick={() => session.randomize('bounded', targetKind)}>{t('vj.boundedRandom')}</button>
        </div>
        <div className="vj-reset-buttons">
          <button type="button" disabled={!session.hasUndo} onClick={session.undoRandomize}>{t('vj.undoRandom')}</button>
          <button type="button" onClick={session.resetValues}>{t('vj.resetValues')}</button>
        </div>
      </section>
      <section className="vj-cues" aria-label={t('vj.next')}>
        {([0, 1] as const).map(index => <div className="vj-cue" key={index}>
          <span className="vj-section-label">{t(index === 0 ? 'vj.next' : 'vj.afterNext')}</span>
          {cues[index] ? <button type="button" disabled={!session.isPresetReady(cues[index]!.id)} onClick={() => session.loadPreset(cues[index]!.id, { consumeQueue: index === 0 })}>
            <div className="vj-cue-image"><PresetPreview preset={cues[index]!} /></div><span title={cues[index]!.name}>{cues[index]!.name}</span>
          </button> : <span className="vj-empty-cue">—</span>}
        </div>)}
        <div className="vj-navigation">
          <button type="button" aria-label={t('vj.previous')} disabled={!session.allReady} onClick={session.previous}>◀</button>
          <button type="button" aria-label={t('vj.nextPreset')} disabled={!session.queue.length || !session.isPresetReady(session.queue[0]) || session.queue[0] === session.currentId} onClick={session.next}>▶</button>
        </div>
      </section>
      <section className="vj-presets" aria-label={t('vj.presets')}>
        <div className="vj-section-heading"><span>{t('vj.presets')}</span><span>{performancePresets.length}</span></div>
        <div className="vj-source">
          <select aria-label={t('vj.source')} value={folderMode ? `folder:${session.settings.folderId ?? ''}` : 'playlist'}
            onChange={event => session.updateSettings(event.target.value === 'playlist'
              ? { source: 'playlist' } : { source: 'folder', folderId: event.target.value.slice(7) || null })}>
            <option value="playlist">{t('vj.customList')}</option>
            <option value="folder:">{t('vj.rootFolder')}</option>
            {session.library.folders.map(folder => <option key={folder.id} value={`folder:${folder.id}`}>
              {getFolderPath(session.library, folder.id).map(parent => parent.name).join(' / ')}
            </option>)}
          </select>
          {folderMode && <label><input type="checkbox" checked={session.settings.includeSubfolders}
            onChange={event => session.updateSettings({ includeSubfolders: event.target.checked })} />{t('vj.subfolders')}</label>}
        </div>
        {!folderMode && <div className="vj-add-preset">
          <select aria-label={t('vj.library')} value={chosenId} onChange={event => setAddId(event.target.value)} disabled={!additions.length}>
            {additions.map(preset => <option value={preset.id} key={preset.id}>{preset.name}</option>)}
          </select>
          <button type="button" disabled={!chosenId} onClick={() => session.updateSettings({ presetIds: [...session.settings.presetIds, chosenId] })}>{t('vj.add')}</button>
        </div>}
        <div className="vj-preset-list">
          {performancePresets.length === 0 && <p className="vj-empty-message">{t(folderMode ? 'vj.emptyFolder' : 'vj.empty')}</p>}
          {performancePresets.map((preset, index) => <div className={`vj-preset-row${session.currentId === preset.id ? ' is-current' : ''}`} key={preset.id}>
            <button type="button" className="vj-load-preset" disabled={!session.isPresetReady(preset.id)} aria-pressed={session.currentId === preset.id}
              onClick={() => session.loadPreset(preset.id)} title={preset.name}><span>{String(index + 1).padStart(2, '0')}</span>{' '}{preset.name}</button>
            {!folderMode && <>
              <button type="button" aria-label={t('vj.moveUp', { name: preset.name })} disabled={index === 0} onClick={() => session.movePreset(preset.id, -1)}>↑</button>
              <button type="button" aria-label={t('vj.moveDown', { name: preset.name })} disabled={index === performancePresets.length - 1} onClick={() => session.movePreset(preset.id, 1)}>↓</button>
              <button type="button" aria-label={t('vj.remove', { name: preset.name })} onClick={() => session.updateSettings({ presetIds: session.settings.presetIds.filter(id => id !== preset.id) })}>×</button>
            </>}
          </div>)}
        </div>
      </section>
      <section className="vj-effects" aria-label={t('vj.effects')}>
        <div className="vj-section-heading"><span>{t('vj.effects')}</span>
          <button type="button" disabled={!session.hasTakeover} onClick={session.restoreAnimation}>{t('vj.restoreAnimation')}</button>
        </div>
        <div className="vj-effects-scroll">
          {session.document.effectPipeline.effectStack.filter(layer => layer.enabled).map(layer => <EffectCard key={layer.kind} layer={layer} session={session} />)}
        </div>
      </section>
    </div>
    <footer className="vj-status" role="status">
      <span className={error ? 'vj-warning' : ''}>{error ?? (!session.allReady && session.preparation.total > 0
        ? t('vj.preloading', { ready: session.preparation.ready, total: session.preparation.total })
        : session.queue.length > 0 && session.allReady && !session.autoReady ? t('vj.autoPreloading')
        : session.hasTakeover ? t('vj.takeover') : t(session.running ? 'vj.auto' : 'vj.manual'))}</span>
      {failure && <button type="button" onClick={session.retryPreparation}>{t('vj.retryPreparation')}</button>}
      <span>{t('vj.output', { width: canvasW, height: canvasH })}</span>
    </footer>
  </div>;
}
