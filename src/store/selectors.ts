import type { DocumentState } from './documentSlice';
import type { GradientStore } from './gradientStore';
import type { WorkspaceSlice } from './workspaceSlice';

/**
 * Persistable/renderable editor state.  These selectors are deliberately
 * explicit: adding a new UI-only field must not silently make a renderer or
 * preset consumer subscribe to it.
 */
export type { DocumentState } from './documentSlice';

/** State owned by the editor workspace and not required to serialize a scene. */
export type WorkspaceState = Pick<WorkspaceSlice,
  | 'currentTime'
  | 'presetName'
  | 'isSlitAdjusting'
  | 'slitOverlayEnabled'
  | 'selectedStops'
  | 'selectedGradientAnchors'
  | 'isGradientAnchorDragging'
  | 'histogram'
>;

export type RenderState = DocumentState & Pick<GradientStore, 'currentTime'>;

export const selectDocumentState = (state: GradientStore): DocumentState => ({
  gradient: state.gradient,
  noiseDistortion: state.noiseDistortion,
  diffuse: state.diffuse,
  imageGradient: state.imageGradient,
  slitScan: state.slitScan,
  stretch: state.stretch,
  animation: state.animation,
  normalMap: state.normalMap,
  clothGradient: state.clothGradient,
  coneView: state.coneView,
  seamless: state.seamless,
  flowGradient: state.flowGradient,
  radon: state.radon,
  iridescence: state.iridescence,
  manualDistort: state.manualDistort,
  postprocess: state.postprocess,
  effectPipeline: state.effectPipeline,
  matcap: state.matcap,
  keyframeTracks: state.keyframeTracks,
});

export const selectWorkspaceState = (state: GradientStore): WorkspaceState => ({
  currentTime: state.currentTime,
  presetName: state.presetName,
  isSlitAdjusting: state.isSlitAdjusting,
  slitOverlayEnabled: state.slitOverlayEnabled,
  selectedStops: state.selectedStops,
  selectedGradientAnchors: state.selectedGradientAnchors,
  isGradientAnchorDragging: state.isGradientAnchorDragging,
  histogram: state.histogram,
});

export const selectRenderState = (state: GradientStore): RenderState => Object.assign(
  selectDocumentState(state),
  { currentTime: state.currentTime },
);
