import { invoke } from '@tauri-apps/api/core';
import { emitTo, listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { GradientStore } from '../../store/gradientStore';

/**
 * Gradient Ramp editor window (Tauri only).
 *
 * The editor runs in its own webview with its own store instance. The main
 * window owns the document and the undo history; the editor store is a
 * replica of the slice it edits. Both sides forward their local changes of
 * that slice, and a remote patch is applied without being echoed back.
 */

export const MAIN_WINDOW_LABEL = 'main';
export const GRADIENT_RAMP_EDITOR_WINDOW_LABEL = 'gradient-ramp-editor';

// Direction-specific names: a global listener receives events for any target,
// so sharing one name would make each window receive its own patches.
const EVENT_STATE_TO_EDITOR = 'gradient-ramp-editor://state-to-editor';
const EVENT_STATE_TO_MAIN = 'gradient-ramp-editor://state-to-main';
const EVENT_ACK_TO_EDITOR = 'gradient-ramp-editor://ack-to-editor';
const EVENT_ACK_TO_MAIN = 'gradient-ramp-editor://ack-to-main';
const EVENT_EDITOR_READY = 'gradient-ramp-editor://ready';
// Emitted by the Rust side when the editor window is destroyed.
const EVENT_EDITOR_CLOSED = 'gradient-ramp-editor://closed';
const EVENT_HISTORY = 'gradient-ramp-editor://history';

export const GRADIENT_RAMP_SYNC_KEYS = [
  'gradient',
  'keyframeTracks',
  'selectedStops',
  'selectedGradientAnchors',
  'currentTime',
] as const satisfies readonly (keyof GradientStore)[];

type SyncKey = typeof GRADIENT_RAMP_SYNC_KEYS[number];
export type GradientRampSyncPatch = Partial<Pick<GradientStore, SyncKey>>;
export type GradientRampHistoryAction = 'undo' | 'redo';

type SyncStore = {
  getState: () => GradientStore;
  setState: (partial: GradientRampSyncPatch) => void;
  subscribe: (listener: (state: GradientStore, prev: GradientStore) => void) => () => void;
};

/** Returns the synced keys whose references changed, or null when none did. */
export function pickChangedSyncSlice(state: GradientStore, prev: GradientStore): GradientRampSyncPatch | null {
  let patch: GradientRampSyncPatch | null = null;
  for (const key of GRADIENT_RAMP_SYNC_KEYS) {
    if (state[key] === prev[key]) continue;
    patch ??= {};
    (patch as Record<SyncKey, unknown>)[key] = state[key];
  }
  return patch;
}

export function pickSyncSlice(state: GradientStore): GradientRampSyncPatch {
  const patch: GradientRampSyncPatch = {};
  for (const key of GRADIENT_RAMP_SYNC_KEYS) {
    (patch as Record<SyncKey, unknown>)[key] = state[key];
  }
  return patch;
}

/** Keeps only known sync keys from an untrusted event payload. */
export function sanitizeSyncPatch(payload: unknown): GradientRampSyncPatch | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  let found = false;
  for (const key of GRADIENT_RAMP_SYNC_KEYS) {
    if (!(key in source) || source[key] === undefined) continue;
    patch[key] = source[key];
    found = true;
  }
  return found ? patch as GradientRampSyncPatch : null;
}

export type GradientRampSyncMessage = { seq: number; patch: GradientRampSyncPatch };

export type SyncTransport = {
  send: (message: GradientRampSyncMessage) => void;
  ack: (seq: number) => void;
};

type SyncChannelOptions = {
  /** Gates sending, e.g. while no editor is open. */
  canSend?: () => boolean;
  /** Runs `callback` once the applied patch has had a chance to render. */
  afterApply?: (callback: () => void) => void;
  /** Releases an unacknowledged message (peer reloaded or closed). */
  ackTimeoutMs?: number;
};

const DEFAULT_ACK_TIMEOUT_MS = 1000;
const HIDDEN_WINDOW_ACK_FALLBACK_MS = 100;

/** Acks after the next frame; falls back to a timer while rAF is paused (hidden window). */
function afterNextFrame(callback: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    callback();
  };
  window.requestAnimationFrame(run);
  window.setTimeout(run, HIDDEN_WINDOW_ACK_FALLBACK_MS);
}

/**
 * Mirrors local changes to a peer and applies the peer's patches without
 * echoing them back.
 *
 * Flow control: at most one message is unacknowledged. Changes made while
 * waiting merge into one pending patch (latest value wins per key), and the
 * receiver acks only after applying and rendering. A slow receiver therefore
 * gets fewer, newer patches instead of a growing backlog of stale ones.
 */
export function createSyncChannel(
  store: SyncStore,
  transport: SyncTransport,
  {
    canSend = () => true,
    afterApply = afterNextFrame,
    ackTimeoutMs = DEFAULT_ACK_TIMEOUT_MS,
  }: SyncChannelOptions = {},
) {
  let applyingRemote = false;
  let nextSeq = 0;
  let pending: GradientRampSyncPatch | null = null;
  let inFlight: GradientRampSyncMessage | null = null;
  let ackTimer: ReturnType<typeof setTimeout> | null = null;

  const clearAckTimer = () => {
    if (ackTimer !== null) clearTimeout(ackTimer);
    ackTimer = null;
  };

  const flush = () => {
    if (inFlight || !pending || !canSend()) return;
    inFlight = { seq: ++nextSeq, patch: pending };
    pending = null;
    transport.send(inFlight);
    ackTimer = setTimeout(() => {
      ackTimer = null;
      if (!inFlight) return;
      // Resend the unacknowledged values unless newer ones replaced them.
      pending = { ...inFlight.patch, ...pending };
      inFlight = null;
      flush();
    }, ackTimeoutMs);
  };

  const unsubscribe = store.subscribe((state, prev) => {
    if (applyingRemote || !canSend()) return;
    const patch = pickChangedSyncSlice(state, prev);
    if (!patch) return;
    pending = { ...pending, ...patch };
    flush();
  });

  return {
    applyRemote(payload: unknown) {
      if (!payload || typeof payload !== 'object') return;
      const { seq, patch: rawPatch } = payload as Partial<GradientRampSyncMessage>;
      const patch = sanitizeSyncPatch(rawPatch);
      if (patch) {
        applyingRemote = true;
        try {
          store.setState(patch);
        } finally {
          applyingRemote = false;
        }
      }
      if (typeof seq === 'number') afterApply(() => transport.ack(seq));
    },
    handleAck(seq: unknown) {
      if (!inFlight || seq !== inFlight.seq) return;
      clearAckTimer();
      inFlight = null;
      flush();
    },
    /** Drops queued state, e.g. when the peer (re)connects or disconnects. */
    reset() {
      clearAckTimer();
      inFlight = null;
      pending = null;
    },
    /** Sends a full snapshot through the same flow-controlled path. */
    sendSnapshot(patch: GradientRampSyncPatch) {
      pending = { ...pending, ...patch };
      flush();
    },
    dispose() {
      clearAckTimer();
      unsubscribe();
    },
  };
}

export function openGradientRampEditorWindow(): Promise<void> {
  return invoke('open_gradient_ramp_editor_window');
}

export function isGradientRampEditorWindow(): boolean {
  if (typeof window === 'undefined') return false;
  const internals = (window as Window & {
    __TAURI_INTERNALS__?: { metadata?: { currentWindow?: { label?: string } } };
  }).__TAURI_INTERNALS__;
  return internals?.metadata?.currentWindow?.label === GRADIENT_RAMP_EDITOR_WINDOW_LABEL;
}

function logSyncError(error: unknown) {
  console.warn('[gradient-ramp-editor] sync failed', error);
}

/** Main window side: serves the editor and owns undo/redo. */
export async function setupGradientRampEditorHost(
  store: SyncStore,
  history: Record<GradientRampHistoryAction, () => void>,
): Promise<() => void> {
  let editorOpen = false;
  const channel = createSyncChannel(
    store,
    {
      send: message => { emitTo(GRADIENT_RAMP_EDITOR_WINDOW_LABEL, EVENT_STATE_TO_EDITOR, message).catch(logSyncError); },
      ack: seq => { emitTo(GRADIENT_RAMP_EDITOR_WINDOW_LABEL, EVENT_ACK_TO_EDITOR, seq).catch(logSyncError); },
    },
    { canSend: () => editorOpen },
  );
  const unlisteners: UnlistenFn[] = await Promise.all([
    listen(EVENT_STATE_TO_MAIN, event => channel.applyRemote(event.payload)),
    listen(EVENT_ACK_TO_MAIN, event => channel.handleAck(event.payload)),
    listen(EVENT_EDITOR_READY, () => {
      editorOpen = true;
      channel.reset();
      channel.sendSnapshot(pickSyncSlice(store.getState()));
    }),
    listen(EVENT_EDITOR_CLOSED, () => {
      editorOpen = false;
      channel.reset();
    }),
    listen<GradientRampHistoryAction>(EVENT_HISTORY, event => {
      if (event.payload === 'undo' || event.payload === 'redo') history[event.payload]();
    }),
  ]);
  return () => {
    channel.dispose();
    unlisteners.forEach(unlisten => unlisten());
  };
}

/** Editor window side: replicates the main store slice. */
export async function setupGradientRampEditorClient(store: SyncStore): Promise<() => void> {
  const channel = createSyncChannel(store, {
    send: message => { emitTo(MAIN_WINDOW_LABEL, EVENT_STATE_TO_MAIN, message).catch(logSyncError); },
    ack: seq => { emitTo(MAIN_WINDOW_LABEL, EVENT_ACK_TO_MAIN, seq).catch(logSyncError); },
  });
  const unlisteners: UnlistenFn[] = await Promise.all([
    listen(EVENT_STATE_TO_EDITOR, event => channel.applyRemote(event.payload)),
    listen(EVENT_ACK_TO_EDITOR, event => channel.handleAck(event.payload)),
  ]);
  await emitTo(MAIN_WINDOW_LABEL, EVENT_EDITOR_READY);
  return () => {
    channel.dispose();
    unlisteners.forEach(unlisten => unlisten());
  };
}

export function requestGradientRampHistory(action: GradientRampHistoryAction): void {
  emitTo(MAIN_WINDOW_LABEL, EVENT_HISTORY, action).catch(logSyncError);
}
