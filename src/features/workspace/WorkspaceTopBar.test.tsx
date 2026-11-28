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
    onLayoutModeChange: vi.fn(),
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
});
