import { useEffect, useRef, useSyncExternalStore } from 'react';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { getControllerSettings } from '../../lib/controllerSettings';
import { GcInputController, type GcCommand, type OscMessage } from '../../lib/gcInput';

/** src-tauri/src/osc_input.rs の OSC_INPUT_EVENT と一致させる。 */
const OSC_INPUT_EVENT = 'kgg-osc';
const REPEAT_TICK_MS = 40;
const ACTIVITY_NOTIFY_MS = 250;

type Listener = (command: GcCommand) => void;

export type GcActivity = {
  /** 最後にOSCを受信した時刻（Date.now）。未受信ならnull。 */
  lastReceivedAt: number | null;
  /** 接続中のコントローラーのポート番号。 */
  ports: readonly number[];
};

const listeners = new Set<Listener>();
const activityListeners = new Set<() => void>();
let activity: GcActivity = { lastReceivedAt: null, ports: [] };
let users = 0;
let stopSource: (() => void) | null = null;

function dispatch(commands: GcCommand[]) {
  for (const command of commands) {
    for (const listener of listeners) listener(command);
  }
}

function publishActivity(next: GcActivity) {
  activity = next;
  for (const listener of activityListeners) listener();
}

/** Tauriが転送するOSCイベントとリピート用タイマーを開始する。利用者がいる間だけ動かす。 */
function startSource(): () => void {
  const controller = new GcInputController(getControllerSettings);
  let disposed = false;
  let unlisten: (() => void) | null = null;
  let lastNotifyAt = 0;
  void import('@tauri-apps/api/event')
    .then(({ listen }) => listen<OscMessage[]>(OSC_INPUT_EVENT, event => {
      if (!Array.isArray(event.payload)) return;
      dispatch(controller.handleMessages(event.payload, performance.now()));
      const now = Date.now();
      if (now - lastNotifyAt >= ACTIVITY_NOTIFY_MS) {
        lastNotifyAt = now;
        publishActivity({ lastReceivedAt: now, ports: controller.connectedPorts() });
      }
    }))
    .then(stop => {
      if (disposed) stop();
      else unlisten = stop;
    })
    .catch(() => { /* OSC入力が使えなくてもアプリの操作は続ける */ });
  const timer = window.setInterval(() => dispatch(controller.tick(performance.now())), REPEAT_TICK_MS);
  return () => {
    disposed = true;
    unlisten?.();
    window.clearInterval(timer);
    publishActivity({ lastReceivedAt: null, ports: [] });
  };
}

/** OSC入力のソースを使う間だけ有効にする。デスクトップ版以外では何もしない。 */
function useSource(): void {
  useEffect(() => {
    if (!isTauriRuntime()) return;
    users += 1;
    if (users === 1) stopSource = startSource();
    return () => {
      users -= 1;
      if (users === 0) {
        stopSource?.();
        stopSource = null;
      }
    };
  }, []);
}

/**
 * GCコントローラー（OSC）の操作コマンドを受け取る。デスクトップ版のみ有効で、
 * Web版では何もしない。handlerは常に最新の関数が呼ばれる。
 */
export function useGcInput(handler: Listener): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useSource();

  useEffect(() => {
    const listener: Listener = command => handlerRef.current(command);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
}

function subscribeActivity(listener: () => void): () => void {
  activityListeners.add(listener);
  return () => { activityListeners.delete(listener); };
}

/** 受信状況（最終受信時刻と接続中のコントローラー）を返す。表示用。 */
export function useGcActivity(): GcActivity {
  useSource();
  return useSyncExternalStore(subscribeActivity, () => activity, () => activity);
}
