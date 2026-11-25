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
  variant?: 'column' | 'rail';
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  onPopOut?: () => void;
  onCollapse?: () => void;
  onExpand?: () => void;
  openPropertiesOnDrag?: boolean;
};

/** The Effect Stack panel of the main window's Layers column. */
export function PostprocessStackPanel({
  variant = 'column',
  onSelectEffectStack,
  onPopOut,
  onCollapse,
  onExpand,
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
      variant={variant}
      onPopOut={onPopOut}
      onCollapse={onCollapse}
      onExpand={onExpand}
      onDragSelect={openPropertiesOnDrag ? undefined : kind => selectEffectStackLayer(kind, false)}
    />
  );
}
