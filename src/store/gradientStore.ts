import { create } from 'zustand';
import { createWorkspaceSlice, type WorkspaceSlice } from './workspaceSlice';
import { createDocumentState, type DocumentSlice } from './documentSlice';
import { createDocumentActions } from './documentActions';
import {
  STORE_DEFAULTS,
  GRADIENT_ANCHOR_DEFAULTS,
  NOISE_TYPE_PRESETS,
  createEmptyManualDistortMap,
  createEmptyManualSmoothMask,
  normalizeNoiseDistortionConfig,
  normalizePostprocessConfig,
  migratePropertyTracks,
  defaultBezierControlsForAnchors,
} from './documentModel';

export type { AnimationConfig, AnimationEasing } from '../types/animation';
export {
  BEAT_SYNC_BEATS_PER_LOOP,
  ANIMATION_DURATION_MAX,
  ANIMATION_DURATION_MIN,
  ANIMATION_SPEED_MAX,
  ANIMATION_SPEED_MIN,
  getBeatSyncDurationSeconds,
} from '../lib/animationConfig';

export type GradientStore = DocumentSlice & WorkspaceSlice;

export {
  STORE_DEFAULTS,
  GRADIENT_ANCHOR_DEFAULTS,
  NOISE_TYPE_PRESETS,
  createEmptyManualDistortMap,
  createEmptyManualSmoothMask,
  normalizeNoiseDistortionConfig,
  normalizePostprocessConfig,
  migratePropertyTracks,
  defaultBezierControlsForAnchors,
};

export const useGradientStore = create<GradientStore>((set) => ({
  ...createDocumentState(STORE_DEFAULTS),
  ...createWorkspaceSlice(set, STORE_DEFAULTS.histogram),
  ...createDocumentActions(set, STORE_DEFAULTS),
}));
