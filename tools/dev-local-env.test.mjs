import { describe, expect, it } from 'vitest';
import { createKggViteEnvironment } from './dev-local-env.mjs';

describe('createKggViteEnvironment', () => {
  it('does not enable the bridge without an explicit session token', () => {
    const result = createKggViteEnvironment({ PATH: 'fixture-path' });

    expect(result).toMatchObject({
      PATH: 'fixture-path',
      VITE_KGG_TAURI_DEV: '1',
    });
    expect(result.VITE_KGG_MCP_BRIDGE_URL).toBeUndefined();
    expect(result.VITE_KGG_MCP_TOKEN).toBeUndefined();
  });

  it('preserves explicitly configured bridge values', () => {
    const result = createKggViteEnvironment({
      VITE_KGG_MCP_BRIDGE_URL: 'http://127.0.0.1:8341',
      VITE_KGG_MCP_TOKEN: 'custom-token',
      KGG_MCP_TOKEN: 'server-token',
    });

    expect(result.VITE_KGG_MCP_BRIDGE_URL).toBe('http://127.0.0.1:8341');
    expect(result.VITE_KGG_MCP_TOKEN).toBe('custom-token');
    expect(result.VITE_KGG_TAURI_DEV).toBe('1');
  });

  it('supports an explicit opt-out for Tauri development', () => {
    const result = createKggViteEnvironment({
      KGG_MCP_DISABLE: '1',
      VITE_KGG_MCP_BRIDGE_URL: 'http://127.0.0.1:8341',
      VITE_KGG_MCP_TOKEN: 'custom-token',
    });

    expect(result.VITE_KGG_MCP_BRIDGE_URL).toBeUndefined();
    expect(result.VITE_KGG_MCP_TOKEN).toBeUndefined();
    expect(result.VITE_KGG_TAURI_DEV).toBeUndefined();
  });
});
