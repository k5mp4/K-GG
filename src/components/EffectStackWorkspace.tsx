import type { EffectStackKind } from '../types/distortion';
import { useLanguage } from '../i18n/LanguageProvider';
import { WORKSPACE_LAYOUT_POLICY } from '../features/workspace/workspaceLayout';
import { PostprocessStackPanel } from './PostprocessStackPanel';

type Props = {
  /** `column` lists the layers with their controls; `rail` shows the compact icon rail. */
  presentation: 'column' | 'rail';
  /** Dock width; omitted when the list fills its container (overlay segment). */
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
 * panel (or inside the overlay panel) and never covers the preview. Switching
 * between the column and the rail eases the dock width and fades the content in.
 */
export function EffectStackLayers({ presentation, width, onSelectEffectStack, onPopOut, onCollapsedChange, openPropertiesOnDrag = true }: Props) {
  const { t } = useLanguage();
  const docked = width !== undefined;
  // The content keeps its final width while the dock eases, so it is revealed instead of reflowed.
  const contentWidth = docked
    ? presentation === 'column' ? WORKSPACE_LAYOUT_POLICY.layersColumnWidth : WORKSPACE_LAYOUT_POLICY.layersRailWidth
    : undefined;
  return (
    <section
      data-effect-stack-workspace
      data-layers-presentation={presentation}
      aria-label={t('workspace.layers')}
      className={`effect-stack-layers flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-k-bg${docked ? ' border-r border-panel-border' : ''}`}
      style={docked ? { width } : undefined}
    >
      <div
        key={presentation}
        className={`${docked ? 'effect-stack-layers__content ' : ''}flex h-full min-h-0 flex-col`}
        style={contentWidth === undefined ? undefined : { width: contentWidth - 1, minWidth: contentWidth - 1 }}
      >
        <PostprocessStackPanel
          variant={presentation}
          onSelectEffectStack={onSelectEffectStack}
          onPopOut={onPopOut}
          onCollapse={onCollapsedChange ? () => onCollapsedChange(true) : undefined}
          onExpand={onCollapsedChange ? () => onCollapsedChange(false) : undefined}
          openPropertiesOnDrag={openPropertiesOnDrag}
        />
      </div>
    </section>
  );
}
