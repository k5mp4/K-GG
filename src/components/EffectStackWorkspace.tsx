import { useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { EffectStackKind } from '../types/distortion';
import { createLocalEffectStackActions, getEffectStackViewStore } from '../features/effectStack/effectStackController';
import { useLanguage } from '../i18n/LanguageProvider';
import { EFFECT_STACK_LABELS } from '../features/effectStack/effectStackLabels';
import { PostprocessStackPanel } from './PostprocessStackPanel';
import { Icon } from './Icon';

/** Short names for the icon rail; the full name stays in the tooltip and accessible name. */
const RAIL_ABBREVIATIONS: Record<EffectStackKind, string> = {
  diffuse: 'DF',
  noise: 'NS',
  slit: 'SL',
  stretch: 'ST',
  distort: 'DS',
  mirror: 'MR',
  kaleidoscope: 'KL',
  voronoi: 'VR',
  glass: 'GL',
  glassTile: 'GT',
  datamosh: 'DM',
  cone: '3D',
  texture: 'TX',
  distortChroma: 'DC',
  ice: 'IC',
};

type Props = {
  /** `column` lists the layers with their controls; `rail` shows the compact icon rail. */
  presentation: 'column' | 'rail';
  width?: number;
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  onPopOut?: () => void;
  /** Present only where the user can switch between the column and the rail. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** False keeps the Layers list open while reordering (overlay segment). */
  openPropertiesOnDrag?: boolean;
};

/**
 * The Effect Stack as the workspace Layers dock. It sits beside the property
 * panel (or inside the overlay panel) and never covers the preview.
 */
export function EffectStackLayers({ presentation, width, onSelectEffectStack, onPopOut, onCollapsedChange, openPropertiesOnDrag = true }: Props) {
  const { t } = useLanguage();
  return (
    <section
      data-effect-stack-workspace
      data-layers-presentation={presentation}
      aria-label={t('workspace.layers')}
      className="flex h-full min-h-0 shrink-0 flex-col border-r border-panel-border bg-k-bg"
      style={width === undefined ? undefined : { width }}
    >
      {presentation === 'column' ? (
        <PostprocessStackPanel
          onSelectEffectStack={onSelectEffectStack}
          onPopOut={onPopOut}
          onCollapse={onCollapsedChange ? () => onCollapsedChange(true) : undefined}
          openPropertiesOnDrag={openPropertiesOnDrag}
        />
      ) : (
        <EffectStackRail onSelectEffectStack={onSelectEffectStack} onExpand={onCollapsedChange ? () => onCollapsedChange(false) : undefined} />
      )}
    </section>
  );
}

function EffectStackRail({ onSelectEffectStack, onExpand }: { onSelectEffectStack?: (kind: EffectStackKind) => void; onExpand?: () => void }) {
  const { t } = useLanguage();
  const view = useStore(getEffectStackViewStore(), state => state.view);
  const selectRef = useRef(onSelectEffectStack);
  selectRef.current = onSelectEffectStack;
  const actions = useMemo(() => createLocalEffectStackActions(() => selectRef.current), []);
  return (
    <div data-effect-stack-rail className="flex h-full min-h-0 flex-col">
      <div className="flex h-8 shrink-0 items-center justify-center border-b border-cream/15">
        {onExpand && (
          <button
            type="button"
            className="flex h-7 w-8 items-center justify-center p-0 text-cream/70 transition-colors hover:bg-cream/10 hover:text-fire focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
            title={t('stack.expandColumn')}
            aria-label={t('stack.expandColumn')}
            onClick={onExpand}
          >
            <Icon name="chevronRight" className="text-[14px]" />
          </button>
        )}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" aria-label={t('effect.stack')}>
        {view.layers.map(layer => {
          const selected = view.selectedKind === layer.kind;
          const name = EFFECT_STACK_LABELS[layer.kind];
          return (
            <li key={layer.kind}>
              <button
                type="button"
                data-selected={selected ? 'true' : 'false'}
                data-enabled={layer.enabled ? 'true' : 'false'}
                aria-current={selected ? 'true' : undefined}
                aria-label={`${name}: ${t(layer.status.labelKey)}`}
                title={`${name} · ${t(layer.status.labelKey)}`}
                onClick={event => actions.select(layer.kind, event.altKey)}
                onPointerEnter={() => { if (!layer.enabled) actions.prefetch(layer.kind); }}
                className={`relative flex h-[38px] w-full items-center justify-center border-b border-cream/10 p-0 font-display text-[11px] font-bold tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fire ${selected
                  ? 'bg-fire/15 text-k-text'
                  : layer.enabled ? 'text-cream hover:bg-cream/10' : 'text-cream/55 hover:bg-cream/10 hover:text-cream'}`}
              >
                {RAIL_ABBREVIATIONS[layer.kind]}
                <span
                  aria-hidden="true"
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${layer.enabled ? 'bg-fire' : 'border border-cream/35'}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
