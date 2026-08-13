#!/usr/bin/env node
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { createKggMcpServer } from './mcpServer.js';
import { RuntimeBridgeServer } from './runtimeBridge.js';

const packageVersion = '0.1.0';

type CliOptions = {
  http: boolean;
  httpPort: number;
  runtimePort: number;
};

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65_536 ? parsed : fallback;
}

function parseOptions(argv: string[]): CliOptions {
  const options: CliOptions = { http: false, httpPort: 7350, runtimePort: parsePort(process.env.KGG_MCP_RUNTIME_PORT, 7341) };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--http') options.http = true;
    if (arg === '--http-port') options.httpPort = parsePort(argv[index += 1], options.httpPort);
    if (arg === '--runtime-port') options.runtimePort = parsePort(argv[index += 1], options.runtimePort);
    if (arg === '--help' || arg === '-h') {
      process.stdout.write([
        'kgg-mcp - K-GG MCP developer interface',
        '',
        'Default transport: MCP stdio',
        '  --http                 Also expose MCP Streamable HTTP on loopback',
        '  --http-port <port>     HTTP MCP port (default: 7350)',
        '  --runtime-port <port>  K-GG Runtime Bridge port (default: 7341)',
      ].join('\n') + '\n');
      process.exit(0);
    }
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const token = process.env.KGG_MCP_TOKEN?.trim();
  const configuredOrigins = (process.env.KGG_MCP_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://tauri.localhost',
      'https://tauri.localhost',
      'tauri://localhost',
    ];
  if (!token) console.error('[kgg-mcp] KGG_MCP_TOKEN is not set; runtime tools will report disconnected state');

  const bridge = token
    ? new RuntimeBridgeServer({ token, port: options.runtimePort, allowedOrigins })
    : null;
  if (bridge) {
    await bridge.listen();
    console.error(`[kgg-mcp] Runtime Bridge listening on 127.0.0.1:${bridge.portNumber}`);
  }

  const runtime = {
    request: (method: string, params?: Record<string, unknown>) => bridge
      ? bridge.request(method, params)
      : Promise.resolve({ ok: false as const, error: { code: 'runtime_unavailable', message: 'KGG_MCP_TOKEN is not configured' } }),
  };

  let httpServer: HttpServer | null = null;
  if (options.http) {
    const handler = createMcpHandler(() => createKggMcpServer(runtime), {
      legacy: 'stateless',
      onerror: cause => console.error('[kgg-mcp] HTTP error', cause),
    });
    const nodeHandler = toNodeHandler(handler, { onerror: cause => console.error('[kgg-mcp] Node adapter error', cause) });
    const server = createHttpServer((req, res) => {
      const authorization = req.headers.authorization;
      if (!token || typeof authorization !== 'string' || authorization !== `Bearer ${token}`) {
        res.writeHead(401, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
      if (!localhostHostValidation()(req, res) || !localhostOriginValidation()(req, res)) return;
      void nodeHandler(req, res);
    });
    httpServer = server;
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(options.httpPort, '127.0.0.1', resolve);
    });
    console.error(`[kgg-mcp] MCP Streamable HTTP listening on 127.0.0.1:${options.httpPort}`);
  }

  const handle = serveStdio(() => createKggMcpServer(runtime), {
    onerror: cause => console.error('[kgg-mcp] stdio error', cause),
  });
  const shutdown = async () => {
    await handle.close();
    await bridge?.close();
    if (httpServer) await new Promise<void>(resolve => httpServer!.close(() => resolve()));
  };
  process.once('SIGINT', () => { void shutdown(); });
  process.once('SIGTERM', () => { void shutdown(); });
  console.error(`[kgg-mcp] ready (${packageVersion})`);
}

void main().catch(cause => {
  console.error('[kgg-mcp] fatal error', cause);
  process.exitCode = 1;
});
