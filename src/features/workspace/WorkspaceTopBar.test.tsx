import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { enMessages } from '../../i18n/messages';
import { initialUpdateState } from '../updater/types';
import { TOP_BAR_TABS } from './tabs';
import { WorkspaceTopBar, type WorkspaceTopBarProps } from './WorkspaceTopBar';

function createProps(overrides: Partial<WorkspaceTopBarProps> = {}): WorkspaceTopBarProps {
  return {
    leftTab: 'diffuse',
    panelsPresentation: 'docked',
    tabHoverSwitchEnabled: false,
    isHoverLocked: false,
    showRightSidebar: false,
    tabs: TOP_BAR_TABS,
    editingLayer: { label: 'Diffuse', tab: 'diffuse' },
    presetName: 'Kagaribi_15',
    isDirty: false,
    canUndo: false,
    canRedo: false,
    animationEnabled: false,
    isAnimationPlaying: false,
    exportProgress: null,
    spoutActive: false,
    oscPort: null,
    zoom: 1,
    viewportModified: false,
    canCopyPng: true,
    quickExportFeedback: null,
    layoutMode: 'editor',
    gpuInfo: { label: 'GPU: Test / HIGH', title: 'Test GPU' },
    updater: {
      supported: false,
      state: initialUpdateState,
      openDialog: vi.fn(),
    },
    translate: key => enMessages[key],
    getTabEnabled: () => undefined,
    onTabClick: vi.fn(),
    onTabMouseEnter: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onTogglePlayback: vi.fn(),
    onResetViewport: vi.fn(),
    onQuickSavePng: vi.fn(),
    onQuickCopyPng: vi.fn(),
    onLayoutModeChange: vi.fn(),
    onOpenFeedback: vi.fn(),
    onOpenHelp: vi.fn(),
    onOpenSettings: vi.fn(),
    onToggleRightSidebar: vi.fn(),
    ...overrides,
  };
}

describe('WorkspaceTopBar', () => {
  it('renders undo/redo controls with disabled state reflecting history availability', () => {
    const disabledMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ canUndo: false, canRedo: false })} />);
    expect(disabledMarkup).toContain('aria-label="Undo"');
    expect(disabledMarkup).toContain('aria-label="Redo"');
    expect(disabledMarkup.match(/disabled=""/g)?.length).toBe(2);

    const activeMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ canUndo: true, canRedo: true })} />);
    expect(activeMarkup).not.toContain('disabled=""');
  });

  it('keeps the current preset name visible next to the Preset tab across other tabs and marks unsaved changes', () => {
    const otherTabMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ leftTab: 'noise', presetName: 'Sunset_01', isDirty: false })} />);
    expect(otherTabMarkup).toContain('data-current-preset="true"');
    expect(otherTabMarkup).toContain('data-active="false"');
    expect(otherTabMarkup).toContain('data-dirty="false"');
    expect(otherTabMarkup).toContain('>Sunset_01<');
    expect(otherTabMarkup).not.toContain('Unsaved changes');

    const selectedDirtyMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ leftTab: 'preset', presetName: 'Sunset_01', isDirty: true })} />);
    expect(selectedDirtyMarkup).toContain('data-active="true"');
    expect(selectedDirtyMarkup).toContain('data-dirty="true"');
    expect(selectedDirtyMarkup).toContain('Unsaved changes');
    expect(selectedDirtyMarkup).toContain('kgg-preset-slide-in');
  });

  it('renders the Editor / VJ layout mode switch with matching checked state', () => {
    const editorMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ layoutMode: 'editor' })} />);
    expect(editorMarkup).toContain('role="radiogroup"');
    expect(editorMarkup).toContain('aria-checked="true" aria-label="Editor"');
    expect(editorMarkup).toContain('aria-checked="false" aria-label="VJ performance"');

    const vjMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps({ layoutMode: 'vj' })} />);
    expect(vjMarkup).toContain('aria-checked="false" aria-label="Editor"');
    expect(vjMarkup).toContain('aria-checked="true" aria-label="VJ performance"');
  });

  it('shows ambient status chips only while background tasks are active', () => {
    const idleMarkup = renderToStaticMarkup(<WorkspaceTopBar {...createProps()} />);
    expect(idleMarkup).not.toContain('data-ambient-status="export"');
    expect(idleMarkup).not.toContain('data-ambient-status="spout"');
    expect(idleMarkup).not.toContain('data-ambient-status="osc"');

    const activeMarkup = renderToStaticMarkup(
      <WorkspaceTopBar {...createProps({ exportProgress: 0.48, spoutActive: true, oscPort: 9000 })} />,
    );
    expect(activeMarkup).toContain('data-ambient-status="export"');
    expect(activeMarkup).toContain('EXPORT 48%');
    expect(activeMarkup).toContain('data-ambient-status="spout"');
    expect(activeMarkup).toContain('data-ambient-status="osc"');
  });

  it('renders playback toggle, zoom display, quick export actions, and utility icons', () => {
    const markup = renderToStaticMarkup(
      <WorkspaceTopBar {...createProps({ animationEnabled: true, isAnimationPlaying: true, zoom: 1.5, viewportModified: true, quickExportFeedback: 'copied' })} />,
    );
    expect(markup).toContain('data-topbar-playback="true"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('data-topbar-zoom="true"');
    expect(markup).toContain('>150%<');
    expect(markup).toContain('data-quick-save-png="true"');
    expect(markup).toContain('data-quick-copy-png="true"');
    expect(markup).toContain('aria-label="PNG copied"');
    expect(markup).toContain('aria-label="Feedback"');
    expect(markup).toContain('aria-label="Help"');
  });
});
