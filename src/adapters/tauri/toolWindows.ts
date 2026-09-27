import { invoke } from '@tauri-apps/api/core';
import { emitTo, listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * Native tool windows (Tauri only), e.g. the Gradient Ramp editor.
 *
 * A tool window runs in its own webview with its own JS state. The main
 * window owns the document, the undo history and the renderer. A tool window
 * store replicates selected keys of a main-window store: both sides forward
 * their local changes of those keys, and a remote patch is applied without
 * being echoed back. Discrete user actions travel as intents to the main
 * window. See ADR-20260926-native-secondary-windows.
 */

export const MAIN_WINDOW_LABEL = 'main';
export const TOOL_WINDOW_LABELS = ['gradient-ramp-editor', 'effect-stack'] as const;
export type ToolWindowLabel = typeof TOOL_WINDOW_LABELS[number];

// Emitted by the Rust side (payload: label) when a tool window is destroyed;
// a webview cannot reliably emit while it unloads.
const EVENT_TOOL_WINDOW_CLOSED = 'tool-window://closed';

// Direction-specific names: a global listener receives events for any target,
// so sharing one name would make each window receive its own messages.
function toolWindowEvents(label: ToolWindowLabel) {
  return {
    stateToWindow: `${label}://state-to-window`,
    stateToMain: `${label}://state-to-main`,
    ackToWindow: `${label}://ack-to-window`,
    ackToMain: `${label}://ack-to-main`,
    ready: `${label}://ready`,
    intent: `${label}://intent`,
  };
}

export function openToolWindow(label: ToolWindowLabel): Promise<void> {
  return invoke('open_tool_window', { window: label });
}

/** The tool window this webview hosts, or null for the main window / browser. */
export function currentToolWindow(): ToolWindowLabel | null {
  if (typeof window === 'undefined') return null;
  const label = (window as Window & {
    __TAURI_INTERNALS__?: { metadata?: { currentWindow?: { label?: string } } };
  }).__TAURI_INTERNALS__?.metadata?.currentWindow?.label;
  return (TOOL_WINDOW_LABELS as readonly string[]).includes(label ?? '') ? label as ToolWindowLabel : null;
}

// ---------------------------------------------------------------------------
// Flow-controlled store sync
// ---------------------------------------------------------------------------

export type SyncPatch<S, K extends keyof S> = Partial<Pick<S, K>>;
export type SyncMessage<S, K extends keyof S> = { seq: number; patch: SyncPatch<S, K> };

export type SyncStore<S, K extends keyof S> = {
  getState: () => S;
  setState: (partial: SyncPatch<S, K>) => void;
  subscribe: (listener: (state: S, prev: S) => void) => () => void;
};

export type SyncTransport<S, K extends keyof S> = {
  send: (message: SyncMessage<S, K>) => void;
  ack: (seq: number) => void;
};

type SyncChannelOptions = {
  /** Gates sending, e.g. while no tool window is open. */
  canSend?: () => boolean;
  /** Runs `callback` once the applied patch has had a chance to render. */
  afterApply?: (callback: () => void) => void;
  /** Releases an unacknowledged message (peer reloaded or closed). */
  ackTimeoutMs?: number;
};

const DEFAULT_ACK_TIMEOUT_MS = 1000;
const HIDDEN_WINDOW_ACK_FALLBACK_MS = 100;

/** Returns the keys whose references changed, or null when none did. */
export function pickChangedSlice<S, K extends keyof S>(state: S, prev: S, keys: readonly K[]): SyncPatch<S, K> | null {
  let patch: SyncPatch<S, K> | null = null;
  for (const key of keys) {
    if (state[key] === prev[key]) continue;
    patch ??= {};
    patch[key] = state[key];
  }
  return patch;
}

export function pickSlice<S, K extends keyof S>(state: S, keys: readonly K[]): SyncPatch<S, K> {
  const patch: SyncPatch<S, K> = {};
  for (const key of keys) patch[key] = state[key];
  return patch;
}

/** Keeps only known keys from an untrusted event payload. */
export function sanitizePatch<S, K extends keyof S>(payload: unknown, keys: readonly K[]): SyncPatch<S, K> | null {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as Record<PropertyKey, unknown>;
  const patch: Record<PropertyKey, unknown> = {};
  let found = false;
  for (const key of keys) {
    if (!(key in source) || source[key as PropertyKey] === undefined) continue;
    patch[key as PropertyKey] = source[key as PropertyKey];
    found = true;
  }
  return found ? patch as SyncPatch<S, K> : null;
}

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
 * Mirrors local changes of `keys` to a peer and applies the peer's patches
 * without echoing them back.
 *
 * Flow control: at most one message is unacknowledged. Changes made while
 * waiting merge into one pending patch (latest value wins per key), and the
 * receiver acks only after applying and rendering. A slow receiver therefore
 * gets fewer, newer patches instead of a growing backlog of stale ones.
 */
export function createSyncChannel<S, K extends keyof S>(
  store: SyncStore<S, K>,
  keys: readonly K[],
  transport: SyncTransport<S, K>,
  {
    canSend = () => true,
    afterApply = afterNextFrame,
    ackTimeoutMs = DEFAULT_ACK_TIMEOUT_MS,
  }: SyncChannelOptions = {},
) {
  let applyingRemote = false;
  let nextSeq = 0;
  let pending: SyncPatch<S, K> | null = null;
  let inFlight: SyncMessage<S, K> | null = null;
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
    const patch = pickChangedSlice(state, prev, keys);
    if (!patch) return;
    pending = { ...pending, ...patch };
    flush();
  });

  return {
    applyRemote(payload: unknown) {
      if (!payload || typeof payload !== 'object') return;
      const { seq, patch: rawPatch } = payload as Partial<SyncMessage<S, K>>;
      const patch = sanitizePatch<S, K>(rawPatch, keys);
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
    sendSnapshot() {
      pending = { ...pending, ...pickSlice(store.getState(), keys) };
      flush();
    },
    dispose() {
      clearAckTimer();
      unsubscribe();
    },
  };
}

// ---------------------------------------------------------------------------
// Host (main window) and client (tool window) wiring
// ---------------------------------------------------------------------------

function logToolWindowError(error: unknown) {
  console.warn('[tool-window] sync failed', error);
}

type ToolWindowHostOptions<S, K extends keyof S> = {
  label: ToolWindowLabel;
  store: SyncStore<S, K>;
  keys: readonly K[];
  /** Untrusted payload from the tool window; validate before acting. */
  onIntent?: (intent: unknown) => void;
  onOpenChange?: (open: boolean) => void;
};

/** Main window side: serves one tool window. */
export async function setupToolWindowHost<S, K extends keyof S>({
  label,
  store,
  keys,
  onIntent,
  onOpenChange,
}: ToolWindowHostOptions<S, K>): Promise<() => void> {
  const events = toolWindowEvents(label);
  let open = false;
  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    onOpenChange?.(next);
  };
  const channel = createSyncChannel(
    store,
    keys,
    {
      send: message => { emitTo(label, events.stateToWindow, message).catch(logToolWindowError); },
      ack: seq => { emitTo(label, events.ackToWindow, seq).catch(logToolWindowError); },
    },
    { canSend: () => open },
  );
  const unlisteners: UnlistenFn[] = await Promise.all([
    listen(events.stateToMain, event => channel.applyRemote(event.payload)),
    listen(events.ackToMain, event => channel.handleAck(event.payload)),
    listen(events.ready, () => {
      channel.reset();
      setOpen(true);
      channel.sendSnapshot();
    }),
    listen<string>(EVENT_TOOL_WINDOW_CLOSED, event => {
      if (event.payload !== label) return;
      channel.reset();
      setOpen(false);
    }),
    listen(events.intent, event => onIntent?.(event.payload)),
  ]);
  return () => {
    channel.dispose();
    unlisteners.forEach(unlisten => unlisten());
  };
}

type ToolWindowClientOptions<S, K extends keyof S> = {
  label: ToolWindowLabel;
  store: SyncStore<S, K>;
  keys: readonly K[];
};

/** Tool window side: replicates the host keys and sends intents. */
export async function setupToolWindowClient<S, K extends keyof S>({
  label,
  store,
  keys,
}: ToolWindowClientOptions<S, K>): Promise<() => void> {
  const events = toolWindowEvents(label);
  const channel = createSyncChannel(store, keys, {
    send: message => { emitTo(MAIN_WINDOW_LABEL, events.stateToMain, message).catch(logToolWindowError); },
    ack: seq => { emitTo(MAIN_WINDOW_LABEL, events.ackToMain, seq).catch(logToolWindowError); },
  });
  const unlisteners: UnlistenFn[] = await Promise.all([
    listen(events.stateToWindow, event => channel.applyRemote(event.payload)),
    listen(events.ackToWindow, event => channel.handleAck(event.payload)),
  ]);
  await emitTo(MAIN_WINDOW_LABEL, events.ready);
  return () => {
    channel.dispose();
    unlisteners.forEach(unlisten => unlisten());
  };
}

export function sendToolWindowIntent(label: ToolWindowLabel, intent: unknown): void {
  emitTo(MAIN_WINDOW_LABEL, toolWindowEvents(label).intent, intent).catch(logToolWindowError);
}
