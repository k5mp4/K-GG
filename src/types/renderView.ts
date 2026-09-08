export type RenderViewMode = 'canvas' | 'cloth' | 'cone';

export function shouldResetRenderViewReadiness(currentMode: RenderViewMode, nextMode: RenderViewMode): boolean {
  return currentMode !== nextMode;
}
