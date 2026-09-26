import type { GradientStore } from '../../store/gradientStore';
import {
  openToolWindow,
  sendToolWindowIntent,
  setupToolWindowClient,
  setupToolWindowHost,
  type SyncStore,
} from './toolWindows';

/**
 * Gradient Ramp editor window. The editor store replicates the slice it
 * edits; undo/redo run on the main window's history.
 */

const LABEL = 'gradient-ramp-editor';

export const GRADIENT_RAMP_SYNC_KEYS = [
  'gradient',
  'keyframeTracks',
  'selectedStops',
  'selectedGradientAnchors',
  'currentTime',
] as const satisfies readonly (keyof GradientStore)[];

type GradientRampSyncStore = SyncStore<GradientStore, typeof GRADIENT_RAMP_SYNC_KEYS[number]>;
export type GradientRampHistoryAction = 'undo' | 'redo';

export function openGradientRampEditorWindow(): Promise<void> {
  return openToolWindow(LABEL);
}

/** Main window side: serves the editor and owns undo/redo. */
export function setupGradientRampEditorHost(
  store: GradientRampSyncStore,
  history: Record<GradientRampHistoryAction, () => void>,
): Promise<() => void> {
  return setupToolWindowHost({
    label: LABEL,
    store,
    keys: GRADIENT_RAMP_SYNC_KEYS,
    onIntent: intent => {
      if (intent === 'undo' || intent === 'redo') history[intent]();
    },
  });
}

/** Editor window side: replicates the main store slice. */
export function setupGradientRampEditorClient(store: GradientRampSyncStore): Promise<() => void> {
  return setupToolWindowClient({ label: LABEL, store, keys: GRADIENT_RAMP_SYNC_KEYS });
}

export function requestGradientRampHistory(action: GradientRampHistoryAction): void {
  sendToolWindowIntent(LABEL, action);
}
