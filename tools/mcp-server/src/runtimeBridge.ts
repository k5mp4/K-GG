import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { RuntimeRequest, RuntimeResult } from '../../../packages/kgg-control/src/index.js';

type PendingRequest = {
  resolve: (result: RuntimeResult<unknown>) => void;
  timer: NodeJS.Timeout;
  sessionId: string;
};

type ActiveClient = {
  clientId: string;
  sessionId: string;
  connectedAt: string;
  lastSeenAt: number;
};

const MAX_BODY_BYTES = 20 * 1024 * 1024;
const MAX_REQUEST_PAYLOAD_BYTES = 4 * 1024 * 1024;
const MAX_RESULT_BYTES = 18 * 1024 * 1024;
const MAX_PENDING_REQUESTS = 64;
const MAX_QUEUED_REQUESTS = 64;
const MAX_CLIENT_ID_LENGTH = 128;
const REQUEST_TIMEOUT_MS = 30_000;
const CLIENT_LEASE_MS = 30_000;
const RUNTIME_PROTOCOL_VERSION = '0.1.0';

function jsonResponse(res: ServerResponse, status: number, value: unknown, origin?: string): void {
  if (origin) res.setHeader('access-control-allow-origin', origin);
  res.setHeader('access-control-allow-headers', 'content-type, authorization, x-kgg-mcp-token');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.statusCode = status;
  res.end(JSON.stringify(value));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const declaredLength = Number(req.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new Error('request body is too large');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error('request body is too large');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('request body must be an object');
  return parsed as Record<string, unknown>;
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1';
}

function secureTokenEquals(candidate: string, expected: string): boolean {
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes);
}

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 16) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 1_000_000 && value.every(item => isJsonValue(item, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.entries(value).every(([key, item]) => (
    key !== '__proto__' && key !== 'constructor' && key !== 'prototype' && isJsonValue(item, depth + 1)
  ));
}

function parseRuntimeResult(value: unknown): RuntimeResult<unknown> | null {
  if (!isJsonValue(value) || !isRecord(value) || typeof value.ok !== 'boolean') return null;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return null;
  }
  if (serialized.length > MAX_RESULT_BYTES) return null;
  if (value.ok) return Object.prototype.hasOwnProperty.call(value, 'value') ? value as RuntimeResult<unknown> : null;
  if (!isRecord(value.error) || typeof value.error.code !== 'string' || typeof value.error.message !== 'string') return null;
  if (value.error.code.length === 0 || value.error.code.length > 128 || value.error.message.length > 2_000) return null;
  return value as RuntimeResult<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonByteLength(value: unknown): number | null {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === 'string' ? Buffer.byteLength(serialized, 'utf8') : null;
  } catch {
    return null;
  }
}

export class RuntimeBridgeServer {
  private readonly token: string;
  private readonly host: string;
  private readonly port: number;
  private readonly allowedOrigins: Set<string>;
  private readonly queuedRequests: RuntimeRequest[] = [];
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private activeClient: ActiveClient | null = null;
  private server: Server | null = null;

  constructor(options: { token: string; host?: string; port?: number; allowedOrigins?: string[] }) {
    const token = options.token.trim();
    if (!token) throw new Error('Runtime Bridge token must not be empty');
    const host = options.host ?? '127.0.0.1';
    if (!isLoopbackHost(host)) throw new Error('Runtime Bridge host must be loopback-only');
    this.token = token;
    this.host = host;
    this.port = options.port ?? 7341;
    this.allowedOrigins = new Set(options.allowedOrigins ?? []);
  }

  async listen(): Promise<void> {
    if (this.server) return;
    this.server = createServer((req, res) => {
      void this.handleHttpRequest(req, res);
    });
    await new Promise<void>((resolve, reject) => {
      const server = this.server!;
      const onError = (cause: Error) => {
        server.off('listening', onListening);
        reject(cause);
      };
      const onListening = () => {
        server.off('error', onError);
        resolve();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(this.port, this.host);
    });
  }

  async close(): Promise<void> {
    this.disconnectActiveClient('bridge_closed', 'Runtime bridge closed');
    const server = this.server;
    this.server = null;
    if (!server) return;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }

  isConnected(): boolean {
    this.expireActiveClient();
    return this.activeClient !== null;
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<RuntimeResult<unknown>> {
    this.expireActiveClient();
    const activeClient = this.activeClient;
    if (!activeClient) {
      return { ok: false, error: { code: 'runtime_unavailable', message: 'K-GG UI runtime is not connected' } };
    }
    if (this.pendingRequests.size >= MAX_PENDING_REQUESTS || this.queuedRequests.length >= MAX_QUEUED_REQUESTS) {
      return { ok: false, error: { code: 'runtime_busy', message: 'Runtime bridge request capacity is exhausted' } };
    }
    const requestPayload = { method, params };
    const payloadBytes = jsonByteLength(requestPayload);
    if (typeof method !== 'string' || method.length === 0 || method.length > 160 || !isRecord(params) || !isJsonValue(params) || payloadBytes === null || payloadBytes > MAX_REQUEST_PAYLOAD_BYTES) {
      return { ok: false, error: { code: 'invalid_runtime_request', message: 'Runtime request is invalid or too large' } };
    }
    const request: RuntimeRequest = {
      requestId: randomUUID(),
      method,
      params,
      deadlineAt: Date.now() + REQUEST_TIMEOUT_MS,
    };
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.queuedRequests.splice(0, this.queuedRequests.length, ...this.queuedRequests.filter(item => item.requestId !== request.requestId));
        const pending = this.pendingRequests.get(request.requestId);
        if (!pending) return;
        this.pendingRequests.delete(request.requestId);
        pending.resolve({ ok: false, error: { code: 'runtime_timeout', message: `Runtime request timed out: ${method}` } });
      }, REQUEST_TIMEOUT_MS);
      this.pendingRequests.set(request.requestId, { resolve, timer, sessionId: activeClient.sessionId });
      this.queuedRequests.push(request);
    });
  }

  get portNumber(): number {
    const address = this.server?.address();
    return typeof address === 'object' && address !== null ? address.port : this.port;
  }

  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestOrigin = req.headers.origin;
    if (typeof requestOrigin === 'string' && !this.allowedOrigins.has(requestOrigin)) {
      jsonResponse(res, 403, { error: 'origin_not_allowed' });
      return;
    }
    const origin = typeof requestOrigin === 'string' ? requestOrigin : undefined;
    if (req.method === 'OPTIONS') {
      jsonResponse(res, 204, {}, origin);
      return;
    }
    if (req.method !== 'POST') {
      jsonResponse(res, 405, { error: 'method_not_allowed' }, origin);
      return;
    }
    if (!this.isAuthorized(req)) {
      jsonResponse(res, 401, { error: 'unauthorized' }, origin);
      return;
    }
    try {
      const body = await readJson(req);
      this.expireActiveClient();
      switch (req.url) {
        case '/runtime/register': {
          const clientId = typeof body.clientId === 'string' ? body.clientId.trim() : '';
          if (!clientId || clientId.length > MAX_CLIENT_ID_LENGTH || [...clientId].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
            jsonResponse(res, 400, { error: 'clientId_invalid' }, origin);
            return;
          }
          if (this.activeClient && this.activeClient.clientId !== clientId) {
            jsonResponse(res, 409, { error: 'client_already_registered' }, origin);
            return;
          }
          if (this.activeClient && body.sessionId !== this.activeClient.sessionId) {
            jsonResponse(res, 409, { error: 'session_mismatch' }, origin);
            return;
          }
          if (!this.activeClient) {
            const now = Date.now();
            this.activeClient = {
              clientId,
              sessionId: randomUUID(),
              connectedAt: new Date(now).toISOString(),
              lastSeenAt: now,
            };
          } else {
            this.activeClient.lastSeenAt = Date.now();
          }
          jsonResponse(res, 200, {
            protocolVersion: RUNTIME_PROTOCOL_VERSION,
            clientId,
            sessionId: this.activeClient.sessionId,
          }, origin);
          return;
        }
        case '/runtime/poll': {
          if (!this.isActiveClient(body)) {
            jsonResponse(res, 409, { error: 'client_not_registered' }, origin);
            return;
          }
          this.activeClient!.lastSeenAt = Date.now();
          jsonResponse(res, 200, { requests: this.queuedRequests.splice(0, 8) }, origin);
          return;
        }
        case '/runtime/respond': {
          if (!this.isActiveClient(body)) {
            jsonResponse(res, 409, { error: 'client_not_registered' }, origin);
            return;
          }
          this.activeClient!.lastSeenAt = Date.now();
          const requestId = typeof body.requestId === 'string' ? body.requestId : '';
          const pending = this.pendingRequests.get(requestId);
          if (!pending || pending.sessionId !== this.activeClient!.sessionId) {
            jsonResponse(res, 200, { accepted: false }, origin);
            return;
          }
          const result = parseRuntimeResult(body.result);
          clearTimeout(pending.timer);
          this.pendingRequests.delete(requestId);
          if (!result) {
            pending.resolve({ ok: false, error: { code: 'bridge_invalid_response', message: 'Runtime Bridge response did not match RuntimeResult' } });
            jsonResponse(res, 400, { error: 'invalid_runtime_result', accepted: false }, origin);
            return;
          }
          pending.resolve(result);
          jsonResponse(res, 200, { accepted: true }, origin);
          return;
        }
        case '/runtime/unregister': {
          if (!this.isActiveClient(body)) {
            jsonResponse(res, 409, { error: 'client_not_registered' }, origin);
            return;
          }
          this.disconnectActiveClient('runtime_client_disconnected', 'Runtime client disconnected');
          jsonResponse(res, 200, { accepted: true }, origin);
          return;
        }
        default:
          jsonResponse(res, 404, { error: 'not_found' }, origin);
      }
    } catch (cause) {
      jsonResponse(res, 400, { error: cause instanceof Error ? cause.message : 'invalid_request' }, origin);
    }
  }

  private isAuthorized(req: IncomingMessage): boolean {
    const authorization = req.headers.authorization;
    const headerToken = req.headers['x-kgg-mcp-token'];
    const candidate = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : typeof headerToken === 'string'
        ? headerToken
        : '';
    return candidate.length > 0 && secureTokenEquals(candidate, this.token);
  }

  private isActiveClient(body: Record<string, unknown>): boolean {
    return Boolean(
      this.activeClient
      && body.clientId === this.activeClient.clientId
      && body.sessionId === this.activeClient.sessionId,
    );
  }

  private expireActiveClient(): void {
    if (this.activeClient && Date.now() - this.activeClient.lastSeenAt > CLIENT_LEASE_MS) {
      this.disconnectActiveClient('runtime_client_expired', 'Runtime client lease expired');
    }
  }

  private disconnectActiveClient(code: string, message: string): void {
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.resolve({ ok: false, error: { code, message } });
      this.pendingRequests.delete(requestId);
    }
    this.queuedRequests.length = 0;
    this.activeClient = null;
  }
}
