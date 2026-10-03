import { describe, expect, it } from 'vitest';
import { clampLeftPanelWidth, LEFT_PANEL_MAX_WIDTH, LEFT_PANEL_MIN_WIDTH } from './panelLayout';

describe('clampLeftPanelWidth', () => {
  it('keeps widths inside the fixed range on a wide window', () => {
    expect(clampLeftPanelWidth(10, 1920)).toBe(LEFT_PANEL_MIN_WIDTH);
    expect(clampLeftPanelWidth(5000, 1920)).toBe(LEFT_PANEL_MAX_WIDTH);
    expect(clampLeftPanelWidth(400, 1920)).toBe(400);
  });

  it('limits the sidebar to a share of a narrow window', () => {
    expect(clampLeftPanelWidth(720, 1000)).toBe(600);
    expect(clampLeftPanelWidth(300, 1000)).toBe(300);
  });

  it('never goes below the minimum even on a tiny window', () => {
    expect(clampLeftPanelWidth(500, 200)).toBe(LEFT_PANEL_MIN_WIDTH);
  });
});
