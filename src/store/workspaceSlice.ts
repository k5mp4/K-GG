/**
 * State owned by the editor workspace rather than by a persisted preset.
 * The slice is intentionally small: document serialization remains in
 * presetModel and renderer state remains in LatestState.
 */
import type { HistogramConfig } from '../types/distortion';

export type WorkspaceSlice = {
  currentTime: number;
  presetName: string;
  isSlitAdjusting: boolean;
  slitOverlayEnabled: boolean;
  selectedStops: number[];
  selectedGradientAnchors: number[];
  isGradientAnchorDragging: boolean;
  histogram: HistogramConfig;

  setCurrentTime: (value: number) => void;
  setPresetName: (name: string) => void;
  setIsSlitAdjusting: (value: boolean) => void;
  setSlitOverlayEnabled: (value: boolean) => void;
  setSelectedStops: (value: number[]) => void;
  setSelectedGradientAnchors: (value: number[]) => void;
  setIsGradientAnchorDragging: (value: boolean) => void;
  setHistogram: (value: Partial<HistogramConfig>) => void;
};

type WorkspaceSet = (
  partial: Partial<WorkspaceSlice> | ((state: WorkspaceSlice) => Partial<WorkspaceSlice>),
) => void;

export function createWorkspaceSlice(set: WorkspaceSet, histogram: HistogramConfig): WorkspaceSlice {
  return {
    currentTime: 0,
    presetName: 'Kagaribi_15',
    isSlitAdjusting: false,
    slitOverlayEnabled: false,
    selectedStops: [],
    selectedGradientAnchors: [],
    isGradientAnchorDragging: false,
    histogram: { ...histogram },
    setCurrentTime: value => set({ currentTime: value }),
    setPresetName: name => set({ presetName: name }),
    setIsSlitAdjusting: value => set({ isSlitAdjusting: value }),
    setSlitOverlayEnabled: value => set({ slitOverlayEnabled: value }),
    setSelectedStops: value => set({ selectedStops: value }),
    setSelectedGradientAnchors: value => set({ selectedGradientAnchors: value }),
    setIsGradientAnchorDragging: value => set({ isGradientAnchorDragging: value }),
    setHistogram: value => set(state => ({ histogram: { ...state.histogram, ...value } })),
  };
}
