import { describe, expect, it } from 'vitest';
import { resolveWorkspaceLayout } from './workspaceLayout';

const preferences = { leftWidth: 288, rightWidth: 320, leftOpen: true, rightOpen: true, timelineHeight: 300, timelineOpen: false };

describe('workspace layout', () => {
  it('keeps preferred dock widths on a large workspace', () => {
    expect(resolveWorkspaceLayout({ width: 1440, height: 960 }, preferences)).toMatchObject({
      panels: 'docked', leftWidth: 288, rightWidth: 320, tools: 'inline', timelineHeight: 300,
    });
  });

  it.each([320, 640, 800, 999])('uses drawers at width %i without reducing the canvas width', width => {
    expect(resolveWorkspaceLayout({ width, height: 480 }, preferences)).toMatchObject({ panels: 'overlay', previewWidth: width, tools: 'drawer' });
  });

  it('reserves preview space even after both docks are enlarged', () => {
    const layout = resolveWorkspaceLayout({ width: 1024, height: 720 }, { ...preferences, leftWidth: 520, rightWidth: 600 });
    expect(layout.previewWidth).toBeGreaterThanOrEqual(360);
    expect(layout.leftWidth).toBeGreaterThanOrEqual(240);
    expect(layout.rightWidth).toBeGreaterThanOrEqual(240);
  });

  it('caps the timeline on a short screen and restores the preferred height on a tall screen', () => {
    const short = resolveWorkspaceLayout({ width: 640, height: 480 }, { ...preferences, timelineOpen: true });
    expect(short.timelineHeight).toBe(216);
    expect(short.previewHeight).toBeGreaterThanOrEqual(200);
    expect(resolveWorkspaceLayout({ width: 1440, height: 960 }, preferences).timelineHeight).toBe(300);
  });

  it('uses available canvas space to choose tool presentation', () => {
    expect(resolveWorkspaceLayout({ width: 1200, height: 900 }, preferences).tools).toBe('drawer');
    expect(resolveWorkspaceLayout({ width: 1200, height: 900 }, { ...preferences, leftOpen: false }).tools).toBe('inline');
  });
});
