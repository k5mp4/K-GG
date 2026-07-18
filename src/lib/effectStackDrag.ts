export type EffectStackDragPhase = 'dragging' | 'settling';

export type EffectStackDragState = {
  kind: string;
  fromIndex: number;
  targetIndex: number;
  deltaY: number;
  phase: EffectStackDragPhase;
};

export function getEffectStackTargetIndex(
  fromIndex: number,
  deltaY: number,
  rowHeight: number,
  itemCount: number,
): number {
  if (itemCount <= 0 || rowHeight <= 0) return 0;
  const rawIndex = Math.round((fromIndex * rowHeight + deltaY) / rowHeight);
  return Math.max(0, Math.min(itemCount - 1, rawIndex));
}

export function getEffectStackSettlingOffset(
  fromIndex: number,
  targetIndex: number,
  rowHeight: number,
): number {
  return (targetIndex - fromIndex) * rowHeight;
}
