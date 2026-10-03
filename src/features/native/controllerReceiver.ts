import { useEffect, useSyncExternalStore } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import {
  getControllerSettings,
  subscribeControllerSettings,
  type ControllerSettings,
} from '../../lib/controllerSettings';

export type OscReceiverStatus = {
  /** デスクトップ版（OSCを受信できる環境）か。 */
  supported: boolean;
  listening: boolean;
  port: number | null;
  error: string | null;
};

const UNSUPPORTED: OscReceiverStatus = { supported: false, listening: false, port: null, error: null };

let status: OscReceiverStatus = isTauriRuntime() ? { supported: true, listening: false, port: null, error: null } : UNSUPPORTED;
const statusListeners = new Set<() => void>();
/** 古い応答が新しい設定の結果を上書きしないようにする。 */
let requestId = 0;

function setStatus(next: OscReceiverStatus) {
  status = next;
  for (const listener of statusListeners) listener();
}

async function applyReceiverSettings(settings: Pick<ControllerSettings, 'enabled' | 'port'>): Promise<void> {
  const id = ++requestId;
  try {
    const result = await invoke<{ listening: boolean; port: number | null; error: string | null }>('configure_osc_input', {
      enabled: settings.enabled,
      port: settings.port,
    });
    if (id === requestId) setStatus({ supported: true, ...result });
  } catch (error) {
    if (id === requestId) {
      setStatus({ supported: true, listening: false, port: null, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

function subscribeStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => { statusListeners.delete(listener); };
}

export function useOscReceiverStatus(): OscReceiverStatus {
  return useSyncExternalStore(subscribeStatus, () => status, () => status);
}

/** Controller設定の受信設定（有効/無効とポート）をRust側へ反映する。アプリで1回だけ使う。 */
export function useOscReceiverSync(): void {
  useEffect(() => {
    if (!isTauriRuntime()) return;
    let applied = getControllerSettings();
    void applyReceiverSettings(applied);
    return subscribeControllerSettings(() => {
      const next = getControllerSettings();
      if (next.enabled === applied.enabled && next.port === applied.port) return;
      applied = next;
      void applyReceiverSettings(next);
    });
  }, []);
}
