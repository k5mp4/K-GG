export const DEFAULT_KGG_MCP_BRIDGE_URL = 'http://127.0.0.1:7341';

export type KggRuntimeBridgeConfig = {
  baseUrl: string;
  token: string;
};

export type KggRuntimeBridgeConfigInput = {
  bridgeUrl: string | undefined;
  token: string | undefined;
  isTauriDevelopment: boolean;
  isDevelopment?: boolean;
};

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function isLoopbackBridgeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:'
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]' || url.hostname === '::1');
  } catch {
    return false;
  }
}

export function resolveKggRuntimeBridgeConfig({
  bridgeUrl,
  token,
  isTauriDevelopment,
  isDevelopment = isTauriDevelopment,
}: KggRuntimeBridgeConfigInput): KggRuntimeBridgeConfig | null {
  if (!isDevelopment) return null;
  const hasExplicitConfig = bridgeUrl !== undefined || token !== undefined;
  if (hasExplicitConfig) {
    const explicitBridgeUrl = trimOrUndefined(bridgeUrl);
    const explicitToken = trimOrUndefined(token);
    return explicitBridgeUrl && explicitToken && isLoopbackBridgeUrl(explicitBridgeUrl)
      ? { baseUrl: explicitBridgeUrl, token: explicitToken }
      : null;
  }
  return null;
}

export function isTauriWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
  return tauriIsTauri()
    || Boolean(tauriWindow.__TAURI_INTERNALS__)
    || window.location.hostname === 'tauri.localhost'
    || window.location.protocol === 'tauri:';
}
import { isTauri as tauriIsTauri } from '@tauri-apps/api/core';
