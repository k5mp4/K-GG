import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createKggViteEnvironment } from './dev-local-env.mjs';

const tauriCli = resolve('node_modules/@tauri-apps/cli/tauri.js');
const tauri = spawn(process.execPath, [tauriCli, 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: createKggViteEnvironment(),
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => tauri.kill(signal));
}

await new Promise((resolveProcess) => {
  tauri.once('exit', (code, signal) => {
    process.exitCode = typeof code === 'number' ? code : signal ? 1 : 0;
    resolveProcess();
  });
});
