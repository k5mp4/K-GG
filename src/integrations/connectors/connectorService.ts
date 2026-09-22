import { invoke } from '@tauri-apps/api/core';
import { isTauriRuntime } from '../../adapters/tauri/exportService';
import { canvasToPngBlob, sanitizeStem } from '../../lib/export';
import { inspectPng } from '../../../packages/kgg-image/src';

export type DesignAppTarget = 'figma' | 'affinity';

export const AFFINITY_CONNECTOR_PAUSED_MESSAGE = 'Affinity連携は公式SDKのスクリプト登録手順を確認後に再開します。';

export type DesignAppConnectionStatus = {
  connected: boolean;
  displayName: string | null;
  pending: boolean;
  connectionRequest: { id: string; displayName: string } | null;
  lastTransfer: { id: string; status: 'queued' | 'delivered' | 'failed'; message: string | null } | null;
};

export type DesignAppConnectorState = {
  available: boolean;
  endpoint: string;
  appToken: string;
  figma: DesignAppConnectionStatus;
  affinity: DesignAppConnectionStatus;
  error: string | null;
};

const disconnected: DesignAppConnectionStatus = {
  connected: false,
  displayName: null,
  pending: false,
  connectionRequest: null,
  lastTransfer: null,
};

export async function getDesignAppConnectorState(): Promise<DesignAppConnectorState> {
  if (!isTauriRuntime()) {
    return {
      available: false,
      endpoint: '',
      appToken: '',
      figma: disconnected,
      affinity: disconnected,
      error: null,
    };
  }
  return invoke<DesignAppConnectorState>('get_design_app_connector_state');
}

export async function disconnectDesignAppConnector(target: DesignAppTarget): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke('disconnect_design_app_connector', { target });
}

export async function approveDesignAppConnection(target: DesignAppTarget, requestId: string): Promise<void> {
  if (target === 'affinity') throw new Error(AFFINITY_CONNECTOR_PAUSED_MESSAGE);
  if (!isTauriRuntime()) return;
  await invoke('approve_design_app_connection', { target, requestId });
}

export async function dismissDesignAppConnectionRequest(target: DesignAppTarget, requestId: string): Promise<void> {
  if (!isTauriRuntime()) return;
  await invoke('dismiss_design_app_connection_request', { target, requestId });
}

export async function sendCanvasToDesignApp(
  canvas: HTMLCanvasElement,
  name: string,
  target: DesignAppTarget,
  state: DesignAppConnectorState,
): Promise<{ id: string }> {
  if (target === 'affinity') throw new Error(AFFINITY_CONNECTOR_PAUSED_MESSAGE);
  if (!isTauriRuntime()) throw new Error('K-GG Desktopからデザインアプリへ送信できます。');
  if (!state.available) throw new Error(state.error ?? 'ローカル接続を開始できませんでした。');
  const connection = state[target];
  if (!connection.connected) throw new Error(`${target === 'figma' ? 'Figmaプラグイン' : 'Affinity受信スクリプト'}を接続してください。`);
  if (!canvas.width || !canvas.height) throw new Error('送信する画像がありません。');

  const png = await canvasToPngBlob(canvas);
  if (png.size > 20 * 1024 * 1024) throw new Error('PNGが20 MiBの上限を超えています。');
  inspectPng(new Uint8Array(await png.arrayBuffer()));

  const url = new URL(`/api/send/${target}`, state.endpoint);
  url.searchParams.set('name', sanitizeStem(name) || 'K-GG image');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${state.appToken}`,
      'Content-Type': 'image/png',
    },
    body: png,
    credentials: 'omit',
  });
  const result = await response.json().catch(() => ({})) as { id?: string; error?: string };
  if (!response.ok || !result.id) throw new Error(result.error ?? `${target === 'figma' ? 'Figma' : 'Affinity'}へ送信できませんでした。`);
  return { id: result.id };
}
