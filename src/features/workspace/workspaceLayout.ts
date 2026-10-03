export type PanelPresentation = 'docked' | 'overlay';
export type ToolPresentation = 'inline' | 'drawer';

// Content budgets belong here; components consume the resulting presentation.
// Future workspace arrangements can supply another policy without changing editors.
export const WORKSPACE_LAYOUT_POLICY = {
  dockMinWidth: 1000,
  panelMinWidth: 240,
  previewMinWidth: 360,
  inlineToolsMinWidth: 640,
  inlineToolsMinHeight: 560,
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
};
export type WorkspaceLayoutPolicy = { [Key in keyof typeof WORKSPACE_LAYOUT_POLICY]: number };

export function resolveWorkspaceLayout(
  size: { width: number; height: number },
  preferences: WorkspaceLayoutPreferences,
  policy: WorkspaceLayoutPolicy = WORKSPACE_LAYOUT_POLICY,
) {
  const panels: PanelPresentation = size.width >= policy.dockMinWidth ? 'docked' : 'overlay';
  const budget = Math.max(0, size.width - policy.previewMinWidth);
  const leftPreferred = Math.max(policy.panelMinWidth, preferences.leftWidth);
  const rightPreferred = Math.max(policy.panelMinWidth, preferences.rightWidth);
  const leftBudget = preferences.leftOpen ? leftPreferred : 0;
  const rightBudget = preferences.rightOpen ? rightPreferred : 0;
  const total = leftBudget + rightBudget;
  const remaining = Math.max(0, budget - (Number(preferences.leftOpen) + Number(preferences.rightOpen)) * policy.panelMinWidth);
  const extra = total - (Number(preferences.leftOpen) + Number(preferences.rightOpen)) * policy.panelMinWidth;
  const scale = extra > 0 ? Math.min(1, remaining / extra) : 1;
  const leftWidth = policy.panelMinWidth + (leftPreferred - policy.panelMinWidth) * scale;
  const rightWidth = policy.panelMinWidth + (rightPreferred - policy.panelMinWidth) * scale;
  const previewWidth = panels === 'docked'
    ? size.width - (preferences.leftOpen ? leftWidth : 0) - (preferences.rightOpen ? rightWidth : 0)
    : size.width;
  const timelineMaxHeight = Math.max(policy.timelineMinHeight, Math.floor(size.height * policy.timelineMaxRatio));
  const timelineHeight = Math.max(policy.timelineMinHeight, Math.min(preferences.timelineHeight, timelineMaxHeight));
  const previewHeight = size.height - policy.topBarHeight - (preferences.timelineOpen ? timelineHeight : 0);
  const tools: ToolPresentation = previewWidth >= policy.inlineToolsMinWidth && previewHeight >= policy.inlineToolsMinHeight ? 'inline' : 'drawer';
  return { panels, tools, leftWidth, rightWidth, previewWidth, previewHeight, timelineHeight, timelineMaxHeight };
}
