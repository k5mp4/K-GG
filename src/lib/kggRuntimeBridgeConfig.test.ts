import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KGG_MCP_BRIDGE_URL,
  isLoopbackBridgeUrl,
  resolveKggRuntimeBridgeConfig,
} from './kggRuntimeBridgeConfig';

describe('resolveKggRuntimeBridgeConfig', () => {
  it('does not invent a Runtime Bridge credential when no token was supplied', () => {
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: undefined,
      token: undefined,
      isTauriDevelopment: true,
    })).toBeNull();
  });

  it('does not enable a bridge in a regular browser without explicit env', () => {
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: undefined,
      token: undefined,
      isTauriDevelopment: false,
    })).toBeNull();
  });

  it('requires both explicit values', () => {
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: 'http://127.0.0.1:8341',
      token: undefined,
      isTauriDevelopment: true,
      isDevelopment: true,
    })).toBeNull();
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: DEFAULT_KGG_MCP_BRIDGE_URL,
      token: 'session-token',
      isTauriDevelopment: true,
      isDevelopment: true,
    })).toEqual({ baseUrl: DEFAULT_KGG_MCP_BRIDGE_URL, token: 'session-token' });
  });

  it('rejects bridge credentials in production and non-loopback URLs', () => {
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: DEFAULT_KGG_MCP_BRIDGE_URL,
      token: 'session-token',
      isTauriDevelopment: false,
      isDevelopment: false,
    })).toBeNull();
    expect(resolveKggRuntimeBridgeConfig({
      bridgeUrl: 'http://192.168.1.2:7341',
      token: 'session-token',
      isTauriDevelopment: true,
      isDevelopment: true,
    })).toBeNull();
    expect(isLoopbackBridgeUrl('http://127.0.0.1:7341')).toBe(true);
    expect(isLoopbackBridgeUrl('https://127.0.0.1:7341')).toBe(false);
  });
});
