import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createKggViteEnvironment } from './dev-local-env.mjs';

// tauri.conf.json bundles the built Figma connector as a resource, and the
// Rust build script fails when it is missing (fresh clones and worktrees).
const figmaConnectorBundle = resolve('connectors/figma/dist/main.js');
if (!existsSync(figmaConnectorBundle)) {
  console.log('Building the Figma connector required by the Tauri resources...');
  const build = spawnSync('npm run build:figma-connector', { stdio: 'inherit', shell: true });
  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

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
