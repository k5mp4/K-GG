import type { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import type {
  EffectPipelineConfig,
  NormalMapConfig,
  PostprocessConfig,
} from '../types/distortion';
import type { ImageGradientConfig } from '../types/imageGradient';

export const EFFECT_STACK_WINDOW_LABEL = 'effect-stack';
export const EFFECT_STACK_WINDOW_QUERY = 'effect-stack-window';
export const EFFECT_STACK_STATE_EVENT = 'kgg-effect-stack-state';
export const EFFECT_STACK_STATE_UPDATE_EVENT = 'kgg-effect-stack-state-update';
export const EFFECT_STACK_READY_EVENT = 'kgg-effect-stack-ready';
export const EFFECT_STACK_CLOSE_EVENT = 'kgg-effect-stack-close';
export const EFFECT_STACK_SWAP_EVENT = 'kgg-effect-stack-swap';

export type EffectStackSnapshot = {
  effectPipeline: EffectPipelineConfig;
  postprocess: PostprocessConfig;
  normalMap: NormalMapConfig;
  imageGradient: ImageGradientConfig;
};

type EffectStackSnapshotSource = Pick<EffectStackSnapshot, keyof EffectStackSnapshot>;

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;
}

export function isEffectStackWindow(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get(EFFECT_STACK_WINDOW_QUERY) === '1';
}

export function createEffectStackSnapshot(state: EffectStackSnapshotSource): EffectStackSnapshot {
  return {
    effectPipeline: state.effectPipeline,
    postprocess: state.postprocess,
    normalMap: state.normalMap,
    imageGradient: state.imageGradient,
  };
}

export function effectStackSnapshotSignature(snapshot: EffectStackSnapshot): string {
  return JSON.stringify(snapshot);
}

export function effectStackWindowUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(EFFECT_STACK_WINDOW_QUERY, '1');
  return url.toString();
}

export async function openEffectStackWindow(): Promise<WebviewWindow> {
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  const existing = await WebviewWindow.getByLabel(EFFECT_STACK_WINDOW_LABEL);
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return existing;
  }

  const windowHandle = new WebviewWindow(EFFECT_STACK_WINDOW_LABEL, {
    url: effectStackWindowUrl(),
    title: 'Effect Stack',
    width: 360,
    height: 620,
    minWidth: 300,
    minHeight: 280,
    resizable: true,
    center: true,
  });
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    void windowHandle.once('tauri://created', () => finish());
    void windowHandle.once('tauri://error', event => finish(event));
    window.setTimeout(() => finish(), 1500);
  });
  await windowHandle.show();
  await windowHandle.setFocus();
  return windowHandle;
}

export async function closeCurrentEffectStackWindow(): Promise<void> {
  const [{ getCurrentWebviewWindow }, { emitTo }] = await Promise.all([
    import('@tauri-apps/api/webviewWindow'),
    import('@tauri-apps/api/event'),
  ]);
  try {
    await emitTo('main', EFFECT_STACK_CLOSE_EVENT);
  } catch {
    // The main window may already be closing.
  }
  await getCurrentWebviewWindow().close();
}
