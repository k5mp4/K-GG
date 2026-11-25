import { describe, expect, it } from 'vitest';
import { resolveWorkspaceLayout, WORKSPACE_LAYOUT_POLICY } from './workspaceLayout';

const preferences = { leftWidth: 288, rightWidth: 320, leftOpen: true, rightOpen: true, timelineHeight: 300, timelineOpen: false };
const { layersColumnWidth, layersRailWidth, previewMinWidth } = WORKSPACE_LAYOUT_POLICY;

describe('workspace layout', () => {
  it('keeps preferred dock widths and the Layers column on a large workspace', () => {
    expect(resolveWorkspaceLayout({ width: 1440, height: 960 }, preferences)).toMatchObject({
      panels: 'docked', layers: 'column', layersWidth: layersColumnWidth, leftWidth: 288, rightWidth: 320, timelineHeight: 300,
      previewWidth: 1440 - layersColumnWidth - 288 - 320,
    });
  });

  it('keeps a wide preview next to the Layers column on a Full HD workspace', () => {
    const layout = resolveWorkspaceLayout({ width: 1920, height: 1026 }, preferences);
    expect(layout.layers).toBe('column');
    expect(layout.previewWidth).toBeGreaterThanOrEqual(1000);
  });

  it.each([320, 640, 800, 999])('uses overlay panels with the Layers segment at width %i without reducing the canvas width', width => {
    expect(resolveWorkspaceLayout({ width, height: 480 }, preferences)).toMatchObject({
      panels: 'overlay', previewWidth: width, layers: 'segment', layersWidth: 0,
    });
  });

  it('reserves preview space even after both docks are enlarged', () => {
    const layout = resolveWorkspaceLayout({ width: 1024, height: 720 }, { ...preferences, leftWidth: 520, rightWidth: 600 });
    expect(layout.previewWidth).toBeGreaterThanOrEqual(previewMinWidth);
    expect(layout.leftWidth).toBeGreaterThanOrEqual(240);
    expect(layout.rightWidth).toBeGreaterThanOrEqual(240);
  });

  it('caps the timeline on a short screen and restores the preferred height on a tall screen', () => {
    const short = resolveWorkspaceLayout({ width: 640, height: 480 }, { ...preferences, timelineOpen: true });
    expect(short.timelineHeight).toBe(216);
    expect(short.previewHeight).toBeGreaterThanOrEqual(200);
    expect(resolveWorkspaceLayout({ width: 1440, height: 960 }, preferences).timelineHeight).toBe(300);
  });

  it('does not change the Layers presentation when the timeline opens or the window gets shorter', () => {
    for (const height of [900, 700, 560]) {
      for (const timelineOpen of [false, true]) {
        expect(resolveWorkspaceLayout({ width: 1440, height }, { ...preferences, timelineOpen }).layers).toBe('column');
      }
    }
  });

  it('falls back to the rail before shrinking the property panels', () => {
    const layout = resolveWorkspaceLayout({ width: 1100, height: 800 }, preferences);
    expect(layout).toMatchObject({ layers: 'rail', layersWidth: layersRailWidth, leftWidth: 288, rightWidth: 320 });
    expect(layout.previewWidth).toBeGreaterThanOrEqual(previewMinWidth);
  });

  it('returns to the column once the workspace is wide enough again', () => {
    expect(resolveWorkspaceLayout({ width: 1100, height: 800 }, preferences).layers).toBe('rail');
    expect(resolveWorkspaceLayout({ width: 1100, height: 800 }, { ...preferences, leftOpen: false }).layers).toBe('column');
    expect(resolveWorkspaceLayout({ width: 1300, height: 800 }, preferences).layers).toBe('column');
  });

  it('honours a collapsed rail and hides the Layers dock while the stack window is open', () => {
    expect(resolveWorkspaceLayout({ width: 1440, height: 900 }, { ...preferences, layersCollapsed: true }))
      .toMatchObject({ layers: 'rail', layersWidth: layersRailWidth, previewWidth: 1440 - layersRailWidth - 288 - 320 });
    expect(resolveWorkspaceLayout({ width: 1440, height: 900 }, { ...preferences, layersDetached: true }))
      .toMatchObject({ layers: 'hidden', layersWidth: 0, previewWidth: 1440 - 288 - 320 });
  });
});
