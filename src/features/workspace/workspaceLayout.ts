export type PanelPresentation = 'docked' | 'overlay';
/**
 * How the Effect Stack (the Layers column) is shown. It never sits on the preview:
 * - `column`: docked list left of the property panel.
 * - `rail`: docked icon rail, chosen by the user or when the preview would get too narrow.
 * - `hidden`: the stack lives in its own native window.
 * - `segment`: overlay panels; the left overlay switches between Layers and Properties.
 */
export type LayersPresentation = 'column' | 'rail' | 'hidden' | 'segment';

// Content budgets belong here; components consume the resulting presentation.
// Future workspace arrangements can supply another policy without changing editors.
export const WORKSPACE_LAYOUT_POLICY = {
  dockMinWidth: 1000,
  panelMinWidth: 240,
  previewMinWidth: 360,
  layersColumnWidth: 216,
  layersRailWidth: 48,
  topBarHeight: 54,
  timelineMinHeight: 180,
  timelineMaxRatio: 0.45,
} as const;

export type WorkspaceLayoutPreferences = {
  leftWidth: number;
  rightWidth: number;
  leftOpen: boolean;
  rightOpen: boolean;
  timelineHeight: number;
  timelineOpen: boolean;
  /** The user's choice; the resolver may still fall back to the rail when space runs out. */
  layersCollapsed?: boolean;
  /** True while the native Effect Stack window is open. */
  layersDetached?: boolean;
};
export type WorkspaceLayoutPolicy = { [Key in keyof typeof WORKSPACE_LAYOUT_POLICY]: number };

function resolveLayers(
  width: number,
  panels: PanelPresentation,
  preferences: WorkspaceLayoutPreferences,
  policy: WorkspaceLayoutPolicy,
  dockPreferred: number,
): { layers: LayersPresentation; layersWidth: number } {
  if (panels === 'overlay') return { layers: 'segment', layersWidth: 0 };
  if (preferences.layersDetached) return { layers: 'hidden', layersWidth: 0 };
  const fitsColumn = width - policy.layersColumnWidth - dockPreferred >= policy.previewMinWidth;
  if (!preferences.layersCollapsed && fitsColumn) return { layers: 'column', layersWidth: policy.layersColumnWidth };
  return { layers: 'rail', layersWidth: policy.layersRailWidth };
}

export function resolveWorkspaceLayout(
  size: { width: number; height: number },
  preferences: WorkspaceLayoutPreferences,
  policy: WorkspaceLayoutPolicy = WORKSPACE_LAYOUT_POLICY,
) {
  const panels: PanelPresentation = size.width >= policy.dockMinWidth ? 'docked' : 'overlay';
  const leftPreferred = Math.max(policy.panelMinWidth, preferences.leftWidth);
  const rightPreferred = Math.max(policy.panelMinWidth, preferences.rightWidth);
  const leftBudget = preferences.leftOpen ? leftPreferred : 0;
  const rightBudget = preferences.rightOpen ? rightPreferred : 0;
  const total = leftBudget + rightBudget;
  // The Layers column gives way (to the rail) before the property panels shrink.
  const { layers, layersWidth } = resolveLayers(size.width, panels, preferences, policy, total);
  const budget = Math.max(0, size.width - layersWidth - policy.previewMinWidth);
  const openPanels = Number(preferences.leftOpen) + Number(preferences.rightOpen);
  const remaining = Math.max(0, budget - openPanels * policy.panelMinWidth);
  const extra = total - openPanels * policy.panelMinWidth;
  const scale = extra > 0 ? Math.min(1, remaining / extra) : 1;
  const leftWidth = policy.panelMinWidth + (leftPreferred - policy.panelMinWidth) * scale;
  const rightWidth = policy.panelMinWidth + (rightPreferred - policy.panelMinWidth) * scale;
  const previewWidth = panels === 'docked'
    ? size.width - layersWidth - (preferences.leftOpen ? leftWidth : 0) - (preferences.rightOpen ? rightWidth : 0)
    : size.width;
  const timelineMaxHeight = Math.max(policy.timelineMinHeight, Math.floor(size.height * policy.timelineMaxRatio));
  const timelineHeight = Math.max(policy.timelineMinHeight, Math.min(preferences.timelineHeight, timelineMaxHeight));
  const previewHeight = size.height - policy.topBarHeight - (preferences.timelineOpen ? timelineHeight : 0);
  return { panels, layers, layersWidth, leftWidth, rightWidth, previewWidth, previewHeight, timelineHeight, timelineMaxHeight };
}
