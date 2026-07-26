import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';

const HOST = '127.0.0.1';
const PORT = 5173;
const BASE_URL = `http://${HOST}:${PORT}`;

async function isKggViteServer() {
  try {
    const response = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(800) });
    if (!response.ok) return false;
    const html = await response.text();
    return html.includes('/@vite/client') && (html.includes('/src/main') || html.includes('KAGARIBI'));
  } catch {
    return false;
  }
}

function isPortOpen() {
  return new Promise((resolveResult) => {
    const socket = createConnection({ host: HOST, port: PORT });
    const finish = (open) => {
      socket.destroy();
      resolveResult(open);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(800, () => finish(false));
  });
}

async function main() {
  if (await isKggViteServer()) {
    console.log(`Reusing the existing K-GG Vite server at ${BASE_URL}.`);
    return;
  }

  if (await isPortOpen()) {
    console.error(`Port ${PORT} is already in use by a server other than K-GG.`);
    console.error(`Stop that process or configure another Tauri dev port before starting K-GG.`);
    process.exitCode = 1;
    return;
  }

  const viteEntry = resolve('node_modules/vite/bin/vite.js');
  const vite = spawn(process.execPath, [viteEntry, '--host', HOST, '--port', String(PORT), '--strictPort'], {
    stdio: 'inherit',
  });

  const forwardSignal = (signal) => vite.kill(signal);
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));

  await new Promise((resolveProcess) => {
    vite.once('exit', (code, signal) => {
      process.exitCode = typeof code === 'number' ? code : signal ? 1 : 0;
      resolveProcess();
    });
  });
}

await main();
