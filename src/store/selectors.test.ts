import { describe, expect, it } from 'vitest';
import { useGradientStore } from './gradientStore';
import { selectDocumentState, selectRenderState, selectWorkspaceState } from './selectors';

describe('store state boundaries', () => {
  it('keeps workspace-only selection fields out of the document selector', () => {
    const state = useGradientStore.getState();
    const documentState = selectDocumentState(state);

    expect(documentState).toHaveProperty('gradient');
    expect(documentState).toHaveProperty('keyframeTracks');
    expect(documentState).not.toHaveProperty('selectedStops');
    expect(documentState).not.toHaveProperty('selectedGradientAnchors');
    expect(documentState).not.toHaveProperty('isGradientAnchorDragging');
  });

  it('adds only the timeline cursor to render state', () => {
    const state = useGradientStore.getState();
    const renderState = selectRenderState(state);

    expect(renderState.currentTime).toBe(state.currentTime);
    expect(renderState).not.toHaveProperty('presetName');
    expect(renderState).not.toHaveProperty('histogram');
  });

  it('exposes the workspace state separately from document state', () => {
    const state = useGradientStore.getState();
    const workspaceState = selectWorkspaceState(state);

    expect(workspaceState).toMatchObject({
      currentTime: state.currentTime,
      presetName: state.presetName,
      selectedStops: state.selectedStops,
    });
    expect(workspaceState).not.toHaveProperty('gradient');
  });
});
