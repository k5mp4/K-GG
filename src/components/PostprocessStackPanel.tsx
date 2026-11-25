import { useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { EffectStackKind } from '../types/distortion';
import {
  createLocalEffectStackActions,
  getEffectStackViewStore,
  selectEffectStackLayer,
} from '../features/effectStack/effectStackController';
import { EffectStackPanelView } from './EffectStackPanelView';

type Props = {
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  onPopOut?: () => void;
  onCollapse?: () => void;
  openPropertiesOnDrag?: boolean;
};

/** The Effect Stack panel of the main window's Layers column. */
export function PostprocessStackPanel({
  onSelectEffectStack,
  onPopOut,
  onCollapse,
  openPropertiesOnDrag = true,
}: Props = {}) {
  const view = useStore(getEffectStackViewStore(), state => state.view);
  const selectEffectStackRef = useRef(onSelectEffectStack);
  selectEffectStackRef.current = onSelectEffectStack;
  const actions = useMemo(() => createLocalEffectStackActions(() => selectEffectStackRef.current), []);
  return (
    <EffectStackPanelView
      view={view}
      actions={actions}
      variant="column"
      onPopOut={onPopOut}
      onCollapse={onCollapse}
      onDragSelect={openPropertiesOnDrag ? undefined : kind => selectEffectStackLayer(kind, false)}
    />
  );
}
