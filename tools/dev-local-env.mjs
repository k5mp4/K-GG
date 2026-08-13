export const DEFAULT_KGG_MCP_BRIDGE_URL = 'http://127.0.0.1:7341';

/**
 * Build the environment inherited by the Vite process launched for Tauri
 * development. A Runtime Bridge token is intentionally never generated from
 * a repository constant: the same high-entropy value must be supplied to the
 * MCP process and the WebView explicitly for each development session.
 */
export function createKggViteEnvironment(env = process.env) {
  const nextEnv = { ...env };
  if (env.KGG_MCP_DISABLE === '1') {
    delete nextEnv.VITE_KGG_MCP_BRIDGE_URL;
    delete nextEnv.VITE_KGG_MCP_TOKEN;
    delete nextEnv.VITE_KGG_TAURI_DEV;
    return nextEnv;
  }

  const token = env.VITE_KGG_MCP_TOKEN?.trim() || env.KGG_MCP_TOKEN?.trim();
  if (token) {
    nextEnv.VITE_KGG_MCP_BRIDGE_URL = env.VITE_KGG_MCP_BRIDGE_URL?.trim()
      || DEFAULT_KGG_MCP_BRIDGE_URL;
    nextEnv.VITE_KGG_MCP_TOKEN = token;
  } else {
    delete nextEnv.VITE_KGG_MCP_BRIDGE_URL;
    delete nextEnv.VITE_KGG_MCP_TOKEN;
  }
  nextEnv.VITE_KGG_TAURI_DEV = '1';
  return nextEnv;
}
