import { useGradientStore, type GradientStore } from '../store/gradientStore';

/**
 * Store-backed application commands shared by UI features and the control
 * runtime.  Validation/normalization remains in the store actions; this
 * facade only removes direct knowledge of the store from command callers.
 */
export type ApplicationCommands = Pick<GradientStore,
  | 'setGradient'
  | 'setMeshCorner'
  | 'setMeshHandle'
  | 'setMeshColorPosition'
  | 'resetMeshGradient'
  | 'straightenMeshHandles'
  | 'setNoiseDistortion'
  | 'setDiffuse'
  | 'setImageGradient'
  | 'setSlitScan'
  | 'setStretch'
  | 'setAnimation'
  | 'setNormalMap'
  | 'setClothGradient'
  | 'setConeView'
  | 'setSeamless'
  | 'setFlowGradient'
  | 'setRadon'
  | 'setIridescence'
  | 'setManualDistort'
  | 'setPostprocess'
  | 'setEffectPipeline'
  | 'setMatcap'
  | 'setHistogram'
  | 'setKeyframeTracks'
  | 'setTrackMode'
  | 'setKeyframe'
  | 'removeKeyframe'
  | 'addKeyframe'
  | 'setCurrentTime'
  | 'setPresetName'
  | 'setIsSlitAdjusting'
  | 'setSlitOverlayEnabled'
  | 'setSelectedStops'
  | 'setSelectedGradientAnchors'
  | 'setIsGradientAnchorDragging'
>;

const APPLICATION_COMMAND_KEYS = [
  'setGradient',
  'setMeshCorner',
  'setMeshHandle',
  'setMeshColorPosition',
  'resetMeshGradient',
  'straightenMeshHandles',
  'setNoiseDistortion',
  'setDiffuse',
  'setImageGradient',
  'setSlitScan',
  'setStretch',
  'setAnimation',
  'setNormalMap',
  'setClothGradient',
  'setConeView',
  'setSeamless',
  'setFlowGradient',
  'setRadon',
  'setIridescence',
  'setManualDistort',
  'setPostprocess',
  'setEffectPipeline',
  'setMatcap',
  'setHistogram',
  'setKeyframeTracks',
  'setTrackMode',
  'setKeyframe',
  'removeKeyframe',
  'addKeyframe',
  'setCurrentTime',
  'setPresetName',
  'setIsSlitAdjusting',
  'setSlitOverlayEnabled',
  'setSelectedStops',
  'setSelectedGradientAnchors',
  'setIsGradientAnchorDragging',
] as const satisfies readonly (keyof ApplicationCommands)[];

/** Binds the stable action references of a store once for hot UI paths. */
export function bindApplicationCommands(state: GradientStore): ApplicationCommands {
  return Object.fromEntries(
    APPLICATION_COMMAND_KEYS.map(key => [key, state[key]]),
  ) as ApplicationCommands;
}

/** Creates a command facade against an injected store accessor. */
export function createApplicationCommands(
  getState: () => GradientStore,
): ApplicationCommands {
  return {
    setGradient: value => getState().setGradient(value),
    setMeshCorner: (index, position) => getState().setMeshCorner(index, position),
    setMeshHandle: (edge, index, position) => getState().setMeshHandle(edge, index, position),
    setMeshColorPosition: (index, value) => getState().setMeshColorPosition(index, value),
    resetMeshGradient: () => getState().resetMeshGradient(),
    straightenMeshHandles: () => getState().straightenMeshHandles(),
    setNoiseDistortion: value => getState().setNoiseDistortion(value),
    setDiffuse: value => getState().setDiffuse(value),
    setImageGradient: value => getState().setImageGradient(value),
    setSlitScan: value => getState().setSlitScan(value),
    setStretch: value => getState().setStretch(value),
    setAnimation: value => getState().setAnimation(value),
    setNormalMap: value => getState().setNormalMap(value),
    setClothGradient: value => getState().setClothGradient(value),
    setConeView: value => getState().setConeView(value),
    setSeamless: value => getState().setSeamless(value),
    setFlowGradient: value => getState().setFlowGradient(value),
    setRadon: value => getState().setRadon(value),
    setIridescence: value => getState().setIridescence(value),
    setManualDistort: value => getState().setManualDistort(value),
    setPostprocess: value => getState().setPostprocess(value),
    setEffectPipeline: value => getState().setEffectPipeline(value),
    setMatcap: value => getState().setMatcap(value),
    setHistogram: value => getState().setHistogram(value),
    setKeyframeTracks: value => getState().setKeyframeTracks(value),
    setTrackMode: (trackId, mode, options) => getState().setTrackMode(trackId, mode, options),
    setKeyframe: (trackId, keyframe) => getState().setKeyframe(trackId, keyframe),
    removeKeyframe: (trackId, keyframeId) => getState().removeKeyframe(trackId, keyframeId),
    addKeyframe: (trackId, keyframe, options) => getState().addKeyframe(trackId, keyframe, options),
    setCurrentTime: value => getState().setCurrentTime(value),
    setPresetName: value => getState().setPresetName(value),
    setIsSlitAdjusting: value => getState().setIsSlitAdjusting(value),
    setSlitOverlayEnabled: value => getState().setSlitOverlayEnabled(value),
    setSelectedStops: value => getState().setSelectedStops(value),
    setSelectedGradientAnchors: value => getState().setSelectedGradientAnchors(value),
    setIsGradientAnchorDragging: value => getState().setIsGradientAnchorDragging(value),
  };
}

/** Default browser application command bus. */
export const applicationCommands = bindApplicationCommands(useGradientStore.getState());
