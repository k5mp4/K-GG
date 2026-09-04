import { execFile as execFileCallback, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { writeJson } from './render-capture-lib.mjs';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const port = Number(process.env.KGG_E2E_PORT ?? 4173);
const outputDirectory = path.resolve(argumentValue('--output', process.env.KGG_CAPTURE_OUTPUT ?? path.join('test-results', `render-capture-${Date.now()}`)));
const baseURL = `http://127.0.0.1:${port}`;
const fixedGpu = process.env.KGG_E2E_GPU === '1';

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function isSoftwareRenderer(value) {
  return /swiftshader|llvmpipe|warp|microsoft basic render|software renderer|software raster/i.test(String(value));
}

async function currentCommit() {
  if (process.env.KGG_CAPTURE_COMMIT) return process.env.KGG_CAPTURE_COMMIT;
  try {
    const result = await execFile('git', ['rev-parse', 'HEAD'], { cwd: root, windowsHide: true });
    return result.stdout.trim();
  } catch {
    return 'unknown';
  }
}

async function playwrightVersion() {
  try {
    const packagePath = path.join(root, 'node_modules', '@playwright', 'test', 'package.json');
    return JSON.parse(await readFile(packagePath, 'utf8')).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

async function waitForServer(url, processHandle, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'server did not respond';
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Vite exited with code ${processHandle.exitCode}: ${lastError}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Vite at ${url}: ${lastError}`);
}

function startVite() {
  const vitePath = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [vitePath, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    env: { ...process.env, VITE_KGG_E2E: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let output = '';
  child.stdout?.on('data', data => { output += String(data); });
  child.stderr?.on('data', data => { output += String(data); });
  child.on('exit', () => { if (output.length > 8_000) output = output.slice(-8_000); });
  return { child, getOutput: () => output };
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null) return;
  processHandle.kill();
  await new Promise(resolve => setTimeout(resolve, 250));
  if (processHandle.exitCode === null) processHandle.kill('SIGKILL');
}

function bridgeEvaluation(page, callback, value) {
  return page.evaluate(callback, value);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const errors = [];
  const server = startVite();
  let browser;
  let manifest;
  try {
    await waitForServer(`${baseURL}/`, server.child);
    browser = await chromium.launch({
      headless: process.env.KGG_CAPTURE_HEADLESS !== '0',
      args: fixedGpu ? ['--enable-gpu'] : ['--use-angle=swiftshader'],
    });
    const browserContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      locale: 'en-US',
      colorScheme: 'dark',
    });
    const page = await browserContext.newPage();
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
    await page.addInitScript(() => {
      const root = window;
      root.__KGG_CAPTURE_UNHANDLED__ = [];
      window.localStorage.setItem('kgg.ui-language', 'en');
      window.addEventListener('unhandledrejection', event => {
        const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
        root.__KGG_CAPTURE_UNHANDLED__?.push(reason);
      });
    });
    page.on('console', message => {
      if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
    });
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => Boolean(window.__KGG_E2E__), undefined, { timeout: 30_000 });
    const prepared = await bridgeEvaluation(page, async () => {
      const bridge = window.__KGG_E2E__;
      if (!bridge) throw new Error('K-GG E2E bridge is not available');
      await bridge.waitForWebGLReady({ timeoutMs: 60_000 });
      return bridge.prepareRenderContract();
    });
    const contract = await bridgeEvaluation(page, () => {
      const bridge = window.__KGG_E2E__;
      if (!bridge) throw new Error('K-GG E2E bridge is not available');
      return bridge.getRenderContract();
    });
    const renderCondition = await bridgeEvaluation(page, () => {
      const bridge = window.__KGG_E2E__;
      if (!bridge) throw new Error('K-GG E2E bridge is not available');
      return bridge.getRenderCondition();
    });
    const gpu = prepared.webgl.gpu;
    if (fixedGpu && isSoftwareRenderer(JSON.stringify(gpu))) {
      throw new Error(`Fixed-GPU capture resolved to a software renderer: ${JSON.stringify(gpu)}`);
    }

    const frames = [];
    for (const [index, normalizedTime] of contract.times.entries()) {
      await bridgeEvaluation(page, async value => {
        const bridge = window.__KGG_E2E__;
        if (!bridge) throw new Error('K-GG E2E bridge is not available');
        await bridge.setNormalizedTime(value);
      }, normalizedTime);
      const capture = await bridgeEvaluation(page, () => {
        const bridge = window.__KGG_E2E__;
        if (!bridge) throw new Error('K-GG E2E bridge is not available');
        return bridge.captureCanvasRgba();
      });
      const bytes = Buffer.from(capture.dataBase64, 'base64');
      if (bytes.byteLength !== capture.byteLength) throw new Error(`RGBA frame ${index} base64 length is invalid`);
      const file = `frame-${String(index).padStart(4, '0')}.rgba`;
      await writeFile(path.join(outputDirectory, file), bytes);
      const frameDiagnostics = await bridgeEvaluation(page, () => {
        const bridge = window.__KGG_E2E__;
        if (!bridge) throw new Error('K-GG E2E bridge is not available');
        return bridge.getDiagnostics();
      });
      frames.push({
        index,
        normalizedTime,
        width: capture.width,
        height: capture.height,
        byteLength: capture.byteLength,
        sha256: '',
        file,
        diagnostics: frameDiagnostics,
      });
    }

    const { createHash } = await import('node:crypto');
    for (const frame of frames) {
      const bytes = await readFile(path.join(outputDirectory, frame.file));
      frame.sha256 = createHash('sha256').update(bytes).digest('hex');
    }
    const unhandled = await bridgeEvaluation(page, () => {
      const root = window;
      return [...(root.__KGG_CAPTURE_UNHANDLED__ ?? [])];
    });
    errors.push(...unhandled.map(error => `unhandledrejection: ${error}`));
    const commitSha = await currentCommit();
    manifest = {
      schemaVersion: 1,
      kind: 'kgg-render-rgba-capture',
      capturedAt: new Date().toISOString(),
      commitSha,
      runner: {
        id: process.env.KGG_CAPTURE_RUNNER_ID || process.env.GITHUB_RUNNER_NAME || process.env.COMPUTERNAME || os.hostname(),
        platform: process.platform,
        arch: process.arch,
      },
      browser: {
        name: 'chromium',
        version: browser.version(),
        headless: process.env.KGG_CAPTURE_HEADLESS !== '0',
        gpuMode: fixedGpu ? 'fixed-gpu' : 'swiftshader',
      },
      playwrightVersion: await playwrightVersion(),
      canvas: { ...contract.resolution },
      renderContract: { ...contract, condition: renderCondition },
      webgl: {
        executionMode: fixedGpu ? 'fixed-gpu' : 'software',
        gpu,
      },
      frames,
      errors,
    };
    await writeJson(path.join(outputDirectory, 'capture.json'), manifest);
    if (errors.length > 0) throw new Error(`Browser capture reported errors:\n${errors.join('\n')}`);
    console.log(JSON.stringify({ status: 'pass', manifest: path.join(outputDirectory, 'capture.json'), frames: frames.length, fixedGpu }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failure = manifest ?? {
      schemaVersion: 1,
      kind: 'kgg-render-rgba-capture',
      capturedAt: new Date().toISOString(),
      commitSha: await currentCommit(),
      runner: { id: process.env.KGG_CAPTURE_RUNNER_ID || process.env.GITHUB_RUNNER_NAME || process.env.COMPUTERNAME || os.hostname(), platform: process.platform, arch: process.arch },
      browser: { name: 'chromium', version: 'unknown', gpuMode: fixedGpu ? 'fixed-gpu' : 'swiftshader' },
      playwrightVersion: await playwrightVersion(),
      canvas: { width: 1, height: 1 },
      renderContract: null,
      webgl: { executionMode: fixedGpu ? 'fixed-gpu' : 'software', gpu: null },
      frames: [],
      errors: [],
    };
    failure.errors = [...(failure.errors ?? []), message];
    await writeJson(path.join(outputDirectory, 'capture-failed.json'), failure);
    console.error(message);
    if (server.getOutput()) console.error(server.getOutput());
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    await stopProcess(server.child);
  }
}

await main();
