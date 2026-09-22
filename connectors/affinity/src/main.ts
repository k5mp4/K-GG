import { DocumentApi, LoadDocumentOptionsApi } from 'affinity:dom';
import { HttpRequestApi, HttpResponseApi, RequestMethod } from 'affinity:network';
import { TimerApi } from 'affinity:timers';
import { UiApi } from 'affinity:ui';

const BRIDGE_URL = 'http://localhost:43127';
const POLL_INTERVAL_MS = 900;
const NETWORK_FAILURE_LIMIT = 6;

type HttpReply = { status: number; body: string };
type AffinityTransfer = { id: string; name: string; filePath: string };

function request(url: string, token?: string): Promise<HttpReply> {
  return new Promise((resolve, reject) => {
    let handle: unknown;
    try {
      handle = HttpRequestApi.create(url, RequestMethod.Get);
      HttpRequestApi.setTimeoutInSec(handle, 4);
      if (token) HttpRequestApi.setHeaderValue(handle, 'Authorization', `Bearer ${token}`);
      HttpRequestApi.doAsync(handle, result => {
        if (!result?.response) {
          reject(new Error(result?.reason || 'K-GG Desktopへの接続を確認できませんでした。'));
          return;
        }
        try {
          resolve({
            status: HttpResponseApi.getStatusCode(result.response),
            body: HttpResponseApi.getContent(result.response),
          });
        } catch (cause) {
          reject(cause instanceof Error ? cause : new Error('K-GGからの応答を読み取れませんでした。'));
        }
      });
    } catch (cause) {
      reject(cause instanceof Error ? cause : new Error('AffinityからK-GGへ接続できませんでした。'));
    }
  });
}

function wait(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    const timer = TimerApi.create();
    TimerApi.setExpiryFromNow(timer, durationMs);
    TimerApi.waitAsync(timer, () => {
      TimerApi.dispose(timer);
      resolve();
    });
  });
}

function parseTransfer(body: string): AffinityTransfer {
  const value = JSON.parse(body) as Partial<AffinityTransfer>;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.filePath !== 'string') {
    throw new Error('K-GGから受け取った画像情報を読み取れませんでした。');
  }
  return { id: value.id, name: value.name, filePath: value.filePath };
}

async function acknowledge(token: string, transferId: string, result: 'delivered' | 'failed', message = ''): Promise<void> {
  const query = `id=${encodeURIComponent(transferId)}&result=${result}&message=${encodeURIComponent(message)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const reply = await request(`${BRIDGE_URL}/api/ack/affinity?${query}`, token);
      if (reply.status === 200) return;
      lastError = new Error('K-GGへ受信結果を返せませんでした。');
    } catch (cause) {
      lastError = cause;
    }
    if (attempt < 2) await wait(300 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error('K-GGへ受信結果を返せませんでした。');
}

async function waitForImages(token: string): Promise<void> {
  let networkFailures = 0;
  let loadedTransferId: string | null = null;
  while (true) {
    let reply: HttpReply;
    try {
      reply = await request(`${BRIDGE_URL}/api/poll/affinity`, token);
      networkFailures = 0;
    } catch (cause) {
      networkFailures += 1;
      if (networkFailures >= NETWORK_FAILURE_LIMIT) {
        throw new Error(cause instanceof Error ? cause.message : 'K-GG Desktopとの接続が終了しました。');
      }
      await wait(POLL_INTERVAL_MS);
      continue;
    }

    if (reply.status === 401) return;
    if (reply.status === 204) {
      await wait(POLL_INTERVAL_MS);
      continue;
    }
    if (reply.status !== 200) throw new Error('K-GGからPNGを受信できませんでした。');

    const transfer = parseTransfer(reply.body);
    if (loadedTransferId !== transfer.id) {
      try {
        await DocumentApi.load(transfer.filePath, LoadDocumentOptionsApi.createDefault());
        loadedTransferId = transfer.id;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Affinityで画像を開けませんでした。';
        try { await acknowledge(token, transfer.id, 'failed', message); } catch { /* K-GG can expire the transfer after its timeout. */ }
        UiApi.alert(`${transfer.name} を開けませんでした。\n${message}`, 'K-GG Connector');
        continue;
      }
    }

    try {
      await acknowledge(token, transfer.id, 'delivered');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'K-GGへ受信結果を返せませんでした。';
      UiApi.alert(`${transfer.name} をAffinityで開きました。\n${message}`, 'K-GG Connector');
    }
  }
}

async function waitForConnectionApproval(requestId: string): Promise<string> {
  let networkFailures = 0;
  while (true) {
    let reply: HttpReply;
    try {
      const query = `id=${encodeURIComponent(requestId)}`;
      reply = await request(`${BRIDGE_URL}/api/connect/affinity/status?${query}`);
    } catch (cause) {
      networkFailures += 1;
      if (networkFailures >= NETWORK_FAILURE_LIMIT) {
        throw new Error(cause instanceof Error ? cause.message : 'K-GG Desktopとの接続が終了しました。');
      }
      await wait(POLL_INTERVAL_MS);
      continue;
    }

    networkFailures = 0;
    if (reply.status === 202) {
      await wait(POLL_INTERVAL_MS);
      continue;
    }
    if (reply.status !== 200) {
      const error = JSON.parse(reply.body) as { error?: string };
      throw new Error(error.error || 'K-GG Desktopとの接続を確認できませんでした。');
    }
    const connection = JSON.parse(reply.body) as { token?: unknown };
    if (typeof connection.token !== 'string') throw new Error('接続情報を読み取れませんでした。');
    return connection.token;
  }
}

async function runConnector(): Promise<void> {
  try {
    const reply = await request(`${BRIDGE_URL}/api/connect/affinity`);
    if (reply.status !== 202) {
      const error = JSON.parse(reply.body) as { error?: string };
      throw new Error(error.error || 'K-GG Desktopへ接続をリクエストできませんでした。');
    }
    const connectionRequest = JSON.parse(reply.body) as { id?: unknown };
    if (typeof connectionRequest.id !== 'string') throw new Error('接続リクエストを読み取れませんでした。');
    const token = await waitForConnectionApproval(connectionRequest.id);
    UiApi.alert('K-GGに接続しました。K-GGのExportパネルからAffinityへ送信できます。', 'K-GG Connector');
    await waitForImages(token);
  } catch (cause) {
    UiApi.alert(cause instanceof Error ? cause.message : 'K-GG Connectorを起動できませんでした。', 'K-GG Connector');
  }
}

void runConnector();
