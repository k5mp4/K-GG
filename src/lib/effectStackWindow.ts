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
export const EFFECT_STACK_WINDOW_CREATE_TIMEOUT_MS = 3000;
export const EFFECT_STACK_WINDOW_PRESENCE_TIMEOUT_MS = 3000;

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

type EffectStackWindowEventSource = Pick<WebviewWindow, 'once'>;
export type EffectStackWindowConstructor = {
  getByLabel: (label: string) => Promise<WebviewWindow | null>;
};

function describeEffectStackWindowError(error: unknown): string {
  const payload = typeof error === 'object' && error !== null && 'payload' in error
    ? (error as { payload?: unknown }).payload
    : error;
  if (payload instanceof Error) return payload.message;
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

/** Wait for the native window creation result without treating a timeout as success. */
export function waitForEffectStackWindowCreation(
  windowHandle: EffectStackWindowEventSource,
  timeoutMs = EFFECT_STACK_WINDOW_CREATE_TIMEOUT_MS,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const unlistenPromises: Array<Promise<() => void>> = [];
    const cleanup = () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      void Promise.all(unlistenPromises).then(unlisteners => {
        unlisteners.forEach(unlisten => unlisten());
      });
    };
    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error instanceof Error
          ? error
          : new Error(`Effect Stack window creation failed: ${describeEffectStackWindowError(error)}`));
      } else {
        resolve();
      }
    };

    unlistenPromises.push(
      windowHandle.once<null>('tauri://created', () => finish()).catch(() => () => undefined),
    );
    unlistenPromises.push(
      windowHandle.once<unknown>('tauri://error', event => finish(event)).catch(() => () => undefined),
    );
    timeoutId = setTimeout(
      () => finish(new Error('Effect Stack window creation timed out')),
      Math.max(1, timeoutMs),
    );
  });
}

export async function waitForEffectStackWindowPresence(
  webviewWindow: EffectStackWindowConstructor,
  timeoutMs = EFFECT_STACK_WINDOW_PRESENCE_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + Math.max(1, timeoutMs);
  while (Date.now() < deadline) {
    try {
      if (await webviewWindow.getByLabel(EFFECT_STACK_WINDOW_LABEL)) return;
    } catch {
      // A missing get-all-windows permission must not invalidate the native
      // creation event, which is the primary success signal.
    }
    await new Promise<void>(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Effect Stack window presence timed out');
}

let effectStackWindowOpening: Promise<WebviewWindow> | null = null;

async function createEffectStackWindow(): Promise<WebviewWindow> {
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  let existing: WebviewWindow | null = null;
  try {
    existing = await WebviewWindow.getByLabel(EFFECT_STACK_WINDOW_LABEL);
  } catch {
    // Reusing an existing window is best effort; creation must still proceed
    // when get-all-windows is unavailable in a restricted runtime.
  }
  if (existing) {
    try {
      await existing.show();
      await existing.setFocus();
      return existing;
    } catch (error) {
      try {
        await existing.close();
      } catch {
        throw error;
      }
    }
  }

  let windowHandle: WebviewWindow | null = null;
  try {
    windowHandle = new WebviewWindow(EFFECT_STACK_WINDOW_LABEL, {
      url: effectStackWindowUrl(),
      title: 'Effect Stack',
      width: 360,
      height: 620,
      minWidth: 300,
      minHeight: 280,
      resizable: true,
      center: true,
      visible: false,
    });
    await Promise.race([
      waitForEffectStackWindowCreation(windowHandle),
      waitForEffectStackWindowPresence(WebviewWindow),
    ]);
    await windowHandle.show();
    await windowHandle.setFocus();
    return windowHandle;
  } catch (error) {
    try {
      await windowHandle?.close();
    } catch {
      // The handle may already have been destroyed after the create error.
    }
    throw error;
  }
}

export function openEffectStackWindow(): Promise<WebviewWindow> {
  if (effectStackWindowOpening) return effectStackWindowOpening;
  const pending = createEffectStackWindow();
  effectStackWindowOpening = pending;
  void pending.then(
    () => {
      if (effectStackWindowOpening === pending) effectStackWindowOpening = null;
    },
    () => {
      if (effectStackWindowOpening === pending) effectStackWindowOpening = null;
    },
  );
  return pending;
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
