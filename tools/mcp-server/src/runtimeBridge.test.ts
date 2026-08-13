import { describe, expect, it } from 'vitest';
import { RuntimeBridgeServer } from './runtimeBridge.js';

describe('RuntimeBridgeServer', () => {
  it('authenticates clients and completes a request through polling', async () => {
    const bridge = new RuntimeBridgeServer({ token: 'test-token', port: 0 });
    await bridge.listen();
    const baseUrl = `http://127.0.0.1:${bridge.portNumber}`;
    try {
      const unauthorized = await fetch(`${baseUrl}/runtime/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer wrong-token' },
        body: JSON.stringify({ clientId: 'client-1' }),
      });
      expect(unauthorized.status).toBe(401);

      const registered = await fetch(`${baseUrl}/runtime/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
        body: JSON.stringify({ clientId: 'client-1' }),
      });
      expect(registered.status).toBe(200);
      const registration = await registered.json() as { sessionId: string };
      expect(registration.sessionId).toEqual(expect.any(String));

      const forbiddenOrigin = await fetch(`${baseUrl}/runtime/poll`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer test-token',
          origin: 'http://evil.example',
        },
        body: JSON.stringify({ clientId: 'client-1', sessionId: registration.sessionId }),
      });
      expect(forbiddenOrigin.status).toBe(403);

      const takeover = await fetch(`${baseUrl}/runtime/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
        body: JSON.stringify({ clientId: 'attacker' }),
      });
      expect(takeover.status).toBe(409);

      const pending = bridge.request('getState', { detail: 'test' });
      const polled = await fetch(`${baseUrl}/runtime/poll`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
        body: JSON.stringify({ clientId: 'client-1', sessionId: registration.sessionId }),
      });
      const pollBody = await polled.json() as { requests: Array<{ requestId: string; method: string }> };
      expect(pollBody.requests[0]).toMatchObject({ method: 'getState' });

      const responded = await fetch(`${baseUrl}/runtime/respond`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
        body: JSON.stringify({
          clientId: 'client-1',
          sessionId: registration.sessionId,
          requestId: pollBody.requests[0].requestId,
          result: { ok: true, value: { connected: true } },
        }),
      });
      expect(responded.status).toBe(200);
      await expect(pending).resolves.toEqual({ ok: true, value: { connected: true } });
    } finally {
      await bridge.close();
    }
  });

  it('rejects malformed runtime results and bounds pending requests', async () => {
    const bridge = new RuntimeBridgeServer({ token: 'test-token', port: 0 });
    await bridge.listen();
    const baseUrl = `http://127.0.0.1:${bridge.portNumber}`;
    const headers = { 'content-type': 'application/json', authorization: 'Bearer test-token' };
    try {
      const registered = await fetch(`${baseUrl}/runtime/register`, {
        method: 'POST', headers, body: JSON.stringify({ clientId: 'client-1' }),
      });
      const { sessionId } = await registered.json() as { sessionId: string };
      const pending = bridge.request('getState');
      const polled = await fetch(`${baseUrl}/runtime/poll`, {
        method: 'POST', headers, body: JSON.stringify({ clientId: 'client-1', sessionId }),
      });
      const [{ requestId }] = (await polled.json() as { requests: Array<{ requestId: string }> }).requests;
      const malformed = await fetch(`${baseUrl}/runtime/respond`, {
        method: 'POST', headers,
        body: JSON.stringify({ clientId: 'client-1', sessionId, requestId, result: { ok: 'yes' } }),
      });
      expect(malformed.status).toBe(400);
      await expect(pending).resolves.toMatchObject({ ok: false, error: { code: 'bridge_invalid_response' } });

      const requests = Array.from({ length: 65 }, () => bridge.request('getState'));
      await expect(requests[64]).resolves.toMatchObject({ ok: false, error: { code: 'runtime_busy' } });
      await bridge.close();
      await expect(Promise.all(requests.slice(0, 64))).resolves.toHaveLength(64);
    } finally {
      await bridge.close();
    }
  });
});
