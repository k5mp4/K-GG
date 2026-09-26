import { useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { EffectStackKind } from '../types/distortion';
import {
  createLocalEffectStackActions,
  getEffectStackViewStore,
} from '../features/effectStack/effectStackController';
import { EffectStackPanelView } from './EffectStackPanelView';

type Props = {
  onSwapWorkspace?: () => void;
  onSelectEffectStack?: (kind: EffectStackKind) => void;
  onPopOut?: () => void;
};

/** The inline Effect Stack panel of the main window. */
export function PostprocessStackPanel({
  onSwapWorkspace,
  onSelectEffectStack,
  onPopOut,
}: Props = {}) {
  const view = useStore(getEffectStackViewStore(), state => state.view);
  const selectEffectStackRef = useRef(onSelectEffectStack);
  selectEffectStackRef.current = onSelectEffectStack;
  const actions = useMemo(() => createLocalEffectStackActions(() => selectEffectStackRef.current), []);
  return (
    <EffectStackPanelView
      view={view}
      actions={actions}
      onSwapWorkspace={onSwapWorkspace}
      onPopOut={onPopOut}
    />
  );
}
