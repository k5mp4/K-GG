/**
 * vite-plugin-ae-bridge.ts
 *
 * Vite dev-server ミドルウェアとして動作する After Effects 連携プラグイン。
 * 起動中の afterfx.exe プロセスを検出し、-r フラグで JSX スクリプトを実行させる。
 * 本番ビルドでは何もしない（dev only）。
 */

import type { Plugin } from 'vite';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * フッテージをアクティブなコンポジションに追加する JSX スニペット。
 * 優先順位:
 *   1. app.activeViewer（タイムラインで開いているコンポ）
 *   2. app.project.activeItem（プロジェクトパネルで選択中のコンポ）
 *   3. プロジェクト内の最初の CompItem
 */
const ADD_TO_COMP_JSX = `
var comp = null;
if (app.activeViewer && app.activeViewer.type === ViewerType.VIEWER_COMPOSITION) {
    comp = app.activeViewer.activeItem;
}
if (!comp || !(comp instanceof CompItem)) {
    comp = app.project.activeItem;
}
if (!comp || !(comp instanceof CompItem)) {
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem) { comp = app.project.item(i); break; }
    }
}
if (comp instanceof CompItem) {
    comp.layers.add(footage);
} else {
    alert("Kagaribi: No composition found in project.\\nPlease create a composition first.");
}
`.trim();

/**
 * 起動中の AfterFX.exe のフルパスを返す。
 * 見つからなければ null。
 */
async function findRunningAe(): Promise<string | null> {
  const script = `
$proc = Get-Process -Name "AfterFX" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($proc) { Write-Output $proc.Path } else { Write-Output "" }
`.trim();

  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script,
    ], { windowsHide: true });
    let out = '';
    ps.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    ps.on('close', () => {
      const path = out.trim();
      resolve(path.length > 0 ? path : null);
    });
  });
}

/**
 * afterfx.exe -r jsxPath を実行する。
 * AE が単一インスタンス動作のとき、起動中の AE にスクリプトが渡される。
 */
function runAeScript(aePath: string, jsxPath: string): Promise<number> {
  return new Promise((resolve) => {
    const ps = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', `& "${aePath}" -r "${jsxPath}"`,
    ], { windowsHide: true });
    ps.on('close', (code) => resolve(code ?? 0));
  });
}

/**
 * AE へのスクリプト送信をシリアル化するキュー。
 * afterfx.exe が返った後も AE 内部では実行中のことがあるため、
 * 次のスクリプトは前の完了 + 待機後に送る。
 */
let aeQueue: Promise<unknown> = Promise.resolve();
const AE_INTER_SCRIPT_DELAY_MS = 800;

function queueAeScript(aePath: string, jsxPath: string): Promise<number> {
  const task = aeQueue.then(async () => {
    const code = await runAeScript(aePath, jsxPath);
    // AE がスクリプト処理を終えるまで少し待つ
    await new Promise<void>((r) => setTimeout(r, AE_INTER_SCRIPT_DELAY_MS));
    return code;
  });
  // エラーが起きてもキューを止めない
  aeQueue = task.catch(() => {});
  return task;
}

/** リクエストボディ全体を Buffer として読み込む */
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: object) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

export function aeBridgePlugin(): Plugin {
  return {
    name: 'ae-bridge',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? '';

        // ── GET /api/ae/ping ──────────────────────────────────────────────
        if (req.method === 'GET' && url === '/api/ae/ping') {
          const aePath = await findRunningAe();
          if (!aePath) {
            json(res, 503, { status: 'not-running' });
            return;
          }
          const jsxPath = join(tmpdir(), 'kagaribi_ping.jsx').replace(/\\/g, '/');
          await writeFile(jsxPath, `alert("Kagaribi: Connected!\\nAfter Effects is linked.");`, 'utf8');
          await queueAeScript(aePath, jsxPath);
          json(res, 200, { status: 'ok' });
          return;
        }

        // ── POST /api/ae/import-image ─────────────────────────────────────
        if (req.method === 'POST' && url.startsWith('/api/ae/import-image')) {
          const aePath = await findRunningAe();
          if (!aePath) {
            json(res, 503, { status: 'not-running' });
            return;
          }
          try {
            const body = await readBody(req);
            const params = new URL(url, 'http://localhost').searchParams;
            const name = (params.get('name') ?? 'kagaribi').replace(/[^\w-]/g, '_');
            const ts = Date.now();
            const imgPath = join(tmpdir(), `${name}_${ts}.png`).replace(/\\/g, '/');
            await writeFile(imgPath, body);
            const jsxPath = join(tmpdir(), 'kagaribi_import_image.jsx').replace(/\\/g, '/');
            await writeFile(jsxPath, `var footage = app.project.importFile(new ImportOptions(File("${imgPath}")));\n${ADD_TO_COMP_JSX}`, 'utf8');
            await queueAeScript(aePath, jsxPath);
            json(res, 200, { status: 'ok', path: imgPath });
          } catch (e) {
            console.error('[ae-bridge] import-image error:', e);
            json(res, 500, { status: 'error', message: String(e) });
          }
          return;
        }

        // ── POST /api/ae/import-video ─────────────────────────────────────
        if (req.method === 'POST' && url.startsWith('/api/ae/import-video')) {
          const aePath = await findRunningAe();
          if (!aePath) {
            json(res, 503, { status: 'not-running' });
            return;
          }
          try {
            const body = await readBody(req);
            const vparams = new URL(url, 'http://localhost').searchParams;
            const ext = vparams.get('ext') ?? 'mov';
            const vname = (vparams.get('name') ?? 'kagaribi').replace(/[^\w-]/g, '_');
            const vts = Date.now();
            const vidPath = join(tmpdir(), `${vname}_${vts}.${ext}`).replace(/\\/g, '/');
            await writeFile(vidPath, body);
            const jsxPath = join(tmpdir(), 'kagaribi_import_video.jsx').replace(/\\/g, '/');
            await writeFile(jsxPath, `var footage = app.project.importFile(new ImportOptions(File("${vidPath}")));\n${ADD_TO_COMP_JSX}`, 'utf8');
            await queueAeScript(aePath, jsxPath);
            json(res, 200, { status: 'ok', path: vidPath });
          } catch (e) {
            console.error('[ae-bridge] import-video error:', e);
            json(res, 500, { status: 'error', message: String(e) });
          }
          return;
        }

        next();
      });
    },
  };
}
