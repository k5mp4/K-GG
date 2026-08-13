import type { RuntimeResult } from '../../packages/kgg-control/src/index';

export type KggRuntimeRequestHandler = (
  method: string,
  params: Record<string, unknown>,
) => Promise<RuntimeResult<unknown>>;

export type KggRuntimeBridgeClientOptions = {
  baseUrl: string;
  token: string;
  handleRequest: KggRuntimeRequestHandler;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
};

type BridgeRequest = {
  requestId: string;
  method: string;
  params?: Record<string, unknown>;
  deadlineAt?: number;
};

type BridgeHttpError = Error & { status?: number };

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isLoopbackBaseUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:'
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]');
  } catch {
    return false;
  }
}

function makeClientId(): string {
  const randomUuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  return `kgg-ui-${randomUuid}`;
}

export class KggRuntimeBridgeClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly handleRequest: KggRuntimeRequestHandler;
  private readonly pollIntervalMs: number;
  private readonly requestTimeoutMs: number;
  private readonly clientId = makeClientId();
  private sessionId: string | null = null;
  private abortController: AbortController | null = null;
  private pollTimer: number | null = null;
  private running = false;
  private reconnectDelayMs: number;

  constructor(options: KggRuntimeBridgeClientOptions) {
    this.baseUrl = isLoopbackBaseUrl(options.baseUrl) ? normalizeBaseUrl(options.baseUrl) : '';
    this.token = options.token;
    this.handleRequest = options.handleRequest;
    this.pollIntervalMs = Math.max(25, Math.min(2_000, options.pollIntervalMs ?? 100));
    this.requestTimeoutMs = Math.max(500, Math.min(10_000, options.requestTimeoutMs ?? 5_000));
    this.reconnectDelayMs = this.pollIntervalMs;
  }

  start(): void {
    if (this.running || !this.baseUrl || !this.token) return;
    this.running = true;
    this.abortController = new AbortController();
    this.reconnectDelayMs = this.pollIntervalMs;
    void this.runPollCycle();
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer !== null) window.clearTimeout(this.pollTimer);
    this.pollTimer = null;
    const sessionId = this.sessionId;
    if (sessionId) {
      void this.post('/runtime/unregister', {
        clientId: this.clientId,
        sessionId,
      }, { ignoreParentSignal: true }).catch(() => undefined);
    }
    this.sessionId = null;
    this.abortController?.abort();
    this.abortController = null;
  }

  private async runPollCycle(): Promise<void> {
    if (!this.running) return;
    try {
      if (!this.sessionId) await this.register();
      await this.poll();
      this.reconnectDelayMs = this.pollIntervalMs;
      this.schedulePoll(this.pollIntervalMs);
    } catch (cause) {
      if (!this.running) return;
      const status = (cause as BridgeHttpError).status;
      if (status === 409) this.sessionId = null;
      console.warn('[K-GG MCP] runtime bridge unavailable', cause);
      const delay = this.reconnectDelayMs;
      this.reconnectDelayMs = Math.min(2_000, Math.max(this.pollIntervalMs, delay * 2));
      this.schedulePoll(delay);
    }
  }

  private async register(): Promise<void> {
    const response = await this.post('/runtime/register', { clientId: this.clientId }) as { sessionId?: unknown };
    if (typeof response.sessionId !== 'string' || response.sessionId.length === 0) {
      throw new Error('Runtime Bridge did not issue a session id');
    }
    this.sessionId = response.sessionId;
  }

  private async poll(): Promise<void> {
    if (!this.running || !this.sessionId) return;
    const response = await this.post('/runtime/poll', {
      clientId: this.clientId,
      sessionId: this.sessionId,
    }) as { requests?: unknown };
    if (response.requests !== undefined && !Array.isArray(response.requests)) throw new Error('Runtime Bridge returned invalid request list');
    for (const requestValue of response.requests ?? []) {
      if (!this.running || !this.sessionId || !this.isBridgeRequest(requestValue)) continue;
      const request = requestValue;
      if (request.deadlineAt !== undefined && request.deadlineAt <= Date.now()) continue;
      let result: RuntimeResult<unknown>;
      try {
        result = await this.handleRequest(request.method, request.params ?? {});
      } catch (cause) {
        result = {
          ok: false,
          error: {
            code: 'runtime_handler_failed',
            message: cause instanceof Error ? cause.message : 'Runtime handler failed',
          },
        };
      }
      if (!this.running || !this.sessionId) return;
      await this.post('/runtime/respond', {
        clientId: this.clientId,
        sessionId: this.sessionId,
        requestId: request.requestId,
        result,
      });
    }
  }

  private schedulePoll(delayMs: number): void {
    if (!this.running) return;
    if (this.pollTimer !== null) window.clearTimeout(this.pollTimer);
    this.pollTimer = window.setTimeout(() => {
      this.pollTimer = null;
      void this.runPollCycle();
    }, Math.max(25, delayMs));
  }

  private async post(
    path: string,
    body: Record<string, unknown>,
    options: { ignoreParentSignal?: boolean } = {},
  ): Promise<unknown> {
    const controller = new AbortController();
    const parentSignal = options.ignoreParentSignal ? undefined : this.abortController?.signal;
    const abortFromParent = () => controller.abort();
    if (parentSignal?.aborted) controller.abort();
    else parentSignal?.addEventListener('abort', abortFromParent, { once: true });
    const timer = window.setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        const cause = new Error(`${path} returned HTTP ${response.status}`) as BridgeHttpError;
        cause.status = response.status;
        throw cause;
      }
      return response.json();
    } finally {
      window.clearTimeout(timer);
      parentSignal?.removeEventListener('abort', abortFromParent);
    }
  }

  private isBridgeRequest(value: unknown): value is BridgeRequest {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const request = value as Record<string, unknown>;
    if (typeof request.requestId !== 'string' || request.requestId.length === 0 || request.requestId.length > 128) return false;
    if (typeof request.method !== 'string' || request.method.length === 0 || request.method.length > 160) return false;
    if (request.params !== undefined && (typeof request.params !== 'object' || request.params === null || Array.isArray(request.params))) return false;
    return request.deadlineAt === undefined || (typeof request.deadlineAt === 'number' && Number.isFinite(request.deadlineAt));
  }
}
