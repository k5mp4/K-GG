import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';

const require = createRequire(import.meta.url);
const repoRoot = resolve(import.meta.dirname, '../..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npx';

function npxInvocation(args) {
  return process.platform === 'win32'
    ? [npxCommand, ['/d', '/s', '/c', `npx ${args.join(' ')}`]]
    : [npxCommand, args];
}

async function getFreeLoopbackPort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  await new Promise(resolve => server.close(resolve));
  if (!port) throw new Error('Unable to allocate a verification port');
  return port;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.error?.message ?? ''}`);
  }
  return result.stdout.trim();
}

function waitForResponse(processHandle, id, timeoutMs = 20_000) {
  return new Promise((resolveResponse, reject) => {
    let buffer = '';
    let stderr = '';
    processHandle.stderr.on('data', chunk => { stderr += chunk.toString('utf8'); });
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for MCP response ${id}\nstderr:\n${stderr}`)), timeoutMs);
    processHandle.stdout.on('data', chunk => {
      buffer += chunk.toString('utf8');
      for (;;) {
        const newline = buffer.indexOf('\n');
        if (newline < 0) break;
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.id === id) {
          clearTimeout(timer);
          resolveResponse(message);
          return;
        }
      }
    });
    processHandle.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    processHandle.once('exit', code => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(new Error(`kgg-mcp exited with code ${code}`));
      }
    });
  });
}

async function stopServer(processHandle) {
  if (!processHandle || processHandle.exitCode !== null) return;
  if (process.platform === 'win32' && processHandle.pid) {
    spawnSync('taskkill', ['/pid', String(processHandle.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    processHandle.kill('SIGTERM');
  }
  await new Promise(resolve => {
    const timer = setTimeout(resolve, 2_000);
    processHandle.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function removeFixture(path) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (cause) {
      lastError = cause;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw lastError;
}

const fixture = await mkdtemp(join(tmpdir(), 'kgg-mcp-fixture-'));
let server;
try {
  // dist is ignored by Git. Removing it here proves that package-local
  // npm pack invokes the prepack build from a clean checkout.
  await rm(resolve(repoRoot, 'tools/mcp-server/dist'), { recursive: true, force: true });
  run(npmCommand, ['pack', './tools/mcp-server', '--pack-destination', fixture], repoRoot);
  const tarball = join(fixture, 'kgg-mcp-0.1.0.tgz');
  run(npmCommand, ['init', '-y'], fixture);
  run(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], fixture);

  const [npxExecutable, npxArgs] = npxInvocation(['--no-install', 'kgg-mcp', '--help']);
  const help = run(npxExecutable, npxArgs, fixture);
  if (!help.includes('kgg-mcp - K-GG MCP developer interface')) throw new Error(`npx --no-install did not resolve kgg-mcp:\n${help}`);

  const executable = join(fixture, 'node_modules', '.bin', process.platform === 'win32' ? 'kgg-mcp.cmd' : 'kgg-mcp');
  const installedPackage = join(fixture, 'node_modules', 'kgg-mcp');
  const [serverExecutable, serverArgs] = npxInvocation(['--no-install', 'kgg-mcp']);
  const runtimePort = await getFreeLoopbackPort();
  server = spawn(serverExecutable, serverArgs, {
    cwd: fixture,
    env: { ...process.env, KGG_MCP_TOKEN: 'fixture-token', KGG_MCP_RUNTIME_PORT: String(runtimePort) },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
  });
  if (!require('node:fs').existsSync(executable)) throw new Error(`Missing installed bin: ${executable}`);
  if (!require('node:fs').existsSync(join(installedPackage, 'LICENSE'))) throw new Error('Tarball is missing LICENSE');
  server.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'kgg-mcp-fixture', version: '0.1.0' },
    },
  })}\n`);
  const initialize = await waitForResponse(server, 1);
  if (!initialize.result?.serverInfo?.name || initialize.result.serverInfo.name !== 'kgg-mcp') {
    throw new Error(`Unexpected initialize response: ${JSON.stringify(initialize)}`);
  }
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
  const tools = await waitForResponse(server, 2);
  const names = (tools.result?.tools ?? []).map(tool => tool.name);
  const getStateTool = tools.result?.tools?.find(tool => tool.name === 'kgg_get_state');
  const setParameterTool = tools.result?.tools?.find(tool => tool.name === 'kgg_set_parameter');
  const setGradientColorsTool = tools.result?.tools?.find(tool => tool.name === 'kgg_set_gradient_colors');
  if (!names.includes('kgg_get_state') || !names.includes('kgg_set_parameter')
    || !names.includes('kgg_set_gradient_colors')
    || getStateTool?.annotations?.readOnlyHint !== true
    || setParameterTool?.annotations?.readOnlyHint !== false
    || setGradientColorsTool?.annotations?.readOnlyHint !== false
    || setParameterTool?.annotations?.destructiveHint !== true
    || setParameterTool?.annotations?.idempotentHint !== false
    || names.length !== 23) {
    throw new Error(`Expected K-GG tools were not advertised: ${names.join(', ')}`);
  }
  const installedReadme = require('node:fs').readFileSync(join(installedPackage, 'README.md'), 'utf8');
  const removedFixedToken = ['local', 'development-token'].join('-');
  if (installedReadme.includes(removedFixedToken)) throw new Error('Tarball contains the removed fixed development token');
  console.log(`kgg-mcp tarball fixture passed (${names.length} tools)`);
} finally {
  await stopServer(server);
  await removeFixture(fixture);
}
