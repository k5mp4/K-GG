import { useEffect, useState } from 'react';
import { isTauriRuntime } from '../adapters/tauri/exportService';
import {
  approveDesignAppConnection,
  disconnectDesignAppConnector,
  dismissDesignAppConnectionRequest,
  getDesignAppConnectorState,
  openFigmaConnectorFolder,
  sendCanvasToDesignApp,
  AFFINITY_CONNECTOR_PAUSED_MESSAGE,
  type DesignAppConnectorState,
  type DesignAppTarget,
} from '../integrations/connectors/connectorService';

type Props = {
  canvas: HTMLCanvasElement | null;
  imageName: string;
};

type ActionMessage = { level: 'success' | 'error' | 'info'; text: string } | null;

const emptyConnection = {
  connected: false,
  displayName: null,
  pending: false,
  connectionRequest: null,
  lastTransfer: null,
};

const emptyState: DesignAppConnectorState = {
  available: false,
  endpoint: '',
  appToken: '',
  figma: emptyConnection,
  affinity: emptyConnection,
  error: null,
};

export function DesignAppSendPanel({ canvas, imageName }: Props) {
  const [bridge, setBridge] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<DesignAppTarget | null>(null);
  const [approving, setApproving] = useState<DesignAppTarget | null>(null);
  const [openingConnectorFolder, setOpeningConnectorFolder] = useState(false);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);

  useEffect(() => {
    let active = true;
    let busy = false;
    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const next = await getDesignAppConnectorState();
        if (active) setBridge(next);
      } catch (cause) {
        if (active) {
          setBridge({ ...emptyState, error: cause instanceof Error ? cause.message : 'ローカル接続の状態を取得できませんでした。' });
        }
      } finally {
        busy = false;
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function handleSend(target: DesignAppTarget) {
    if (target === 'affinity') return;
    if (!canvas || sending) return;
    setSending(target);
    setActionMessage(null);
    try {
      const freshState = await getDesignAppConnectorState();
      setBridge(freshState);
      await sendCanvasToDesignApp(canvas, imageName, target, freshState);
      setBridge(await getDesignAppConnectorState());
      setActionMessage({ level: 'success', text: `${target === 'figma' ? 'Figma' : 'Affinity'}へPNGを送りました。` });
    } catch (cause) {
      setActionMessage({ level: 'error', text: cause instanceof Error ? cause.message : 'PNGを送信できませんでした。' });
    } finally {
      setSending(null);
    }
  }

  async function handleApprove(target: DesignAppTarget, requestId: string) {
    if (target === 'affinity') return;
    setApproving(target);
    try {
      await approveDesignAppConnection(target, requestId);
      setActionMessage({ level: 'success', text: `${target === 'figma' ? 'Figma' : 'Affinity'}の接続を許可しました。` });
      setBridge(await getDesignAppConnectorState());
    } catch (cause) {
      setActionMessage({ level: 'error', text: cause instanceof Error ? cause.message : '接続を許可できませんでした。' });
    } finally {
      setApproving(null);
    }
  }

  async function handleDismiss(target: DesignAppTarget, requestId: string) {
    try {
      await dismissDesignAppConnectionRequest(target, requestId);
      setActionMessage({ level: 'info', text: '接続リクエストを閉じました。' });
      setBridge(await getDesignAppConnectorState());
    } catch (cause) {
      setActionMessage({ level: 'error', text: cause instanceof Error ? cause.message : '接続リクエストを閉じられませんでした。' });
    }
  }

  async function handleDisconnect(target: DesignAppTarget) {
    try {
      await disconnectDesignAppConnector(target);
      setActionMessage({ level: 'info', text: `${target === 'figma' ? 'Figma' : 'Affinity'}との接続を解除しました。` });
      setBridge(await getDesignAppConnectorState());
    } catch (cause) {
      setActionMessage({ level: 'error', text: cause instanceof Error ? cause.message : '接続を解除できませんでした。' });
    }
  }

  async function handleOpenFigmaConnectorFolder() {
    setOpeningConnectorFolder(true);
    setActionMessage(null);
    try {
      await openFigmaConnectorFolder();
      setActionMessage({ level: 'success', text: 'Figma用manifest.jsonのフォルダーを開きました。' });
    } catch (cause) {
      setActionMessage({ level: 'error', text: cause instanceof Error ? cause.message : 'Figma Connectorの場所を開けませんでした。' });
    } finally {
      setOpeningConnectorFolder(false);
    }
  }

  return (
    <section className="space-y-3 border-t border-panel-border border-t-panel pt-4" aria-labelledby="design-app-send-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="design-app-send-title" className="font-display text-xs font-semibold uppercase tracking-wider text-k-text">デザインアプリへ送信</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-tab-inactive">受信アプリから接続をリクエストし、ここで許可するとPNGを直接送れます。</p>
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${bridge.available ? 'bg-emerald-400' : 'bg-k-muted'}`} aria-label={bridge.available ? 'ローカル接続を利用できます' : 'ローカル接続を準備中'} />
      </div>

      {!bridge.available && (
        <p className="border border-panel-border bg-k-surface px-2.5 py-2 text-[10px] leading-relaxed text-deep" role="status">
          {loading ? 'ローカル接続を確認しています…' : bridge.error || 'K-GG DesktopからFigmaへ直接送信できます。'}
        </p>
      )}

      {isTauriRuntime() && (
        <div className="flex items-center gap-2 border border-panel-border bg-k-surface px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-k-text">Figma Pluginの初回登録</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-deep">FigmaのDevelopment Plugin登録で、同梱のmanifest.jsonを選びます。</p>
          </div>
          <button
            type="button"
            onClick={() => void handleOpenFigmaConnectorFolder()}
            disabled={openingConnectorFolder}
            className="shrink-0 border border-panel-border px-2 py-1.5 text-[10px] font-semibold text-k-text hover:bg-k-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {openingConnectorFolder ? '開いています…' : 'manifest.jsonの場所を開く'}
          </button>
        </div>
      )}

      <div className={`grid gap-2 ${bridge.available ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {bridge.available && (
          <SendButton target="figma" connected={bridge.figma.connected} pending={bridge.figma.pending} sending={sending} canvas={canvas} onSend={handleSend} />
        )}
        <AffinityPausedPanel />
      </div>

      {bridge.available && (
        <ConnectionRow
          appName="Figma"
          target="figma"
          connection={bridge.figma}
          approving={approving === 'figma'}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
          onDisconnect={handleDisconnect}
        />
      )}

      {actionMessage && (
        <p
          className={`border px-2.5 py-2 text-[10px] leading-relaxed ${actionMessage.level === 'error' ? 'border-red-500/40 bg-red-950/30 text-red-300' : 'border-panel-border bg-k-surface text-k-text/80'}`}
          role={actionMessage.level === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {actionMessage.text}
        </p>
      )}
    </section>
  );
}

function AffinityPausedPanel() {
  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled
        aria-describedby="affinity-paused-message"
        className="min-h-10 w-full cursor-not-allowed border border-panel-border bg-k-muted/30 px-2 py-2 text-left text-xs font-semibold text-tab-inactive opacity-60"
      >
        Affinityへ送信 <span className="ml-1 font-normal">準備中</span>
      </button>
      <p id="affinity-paused-message" className="mt-1 text-[10px] leading-relaxed text-deep">
        {AFFINITY_CONNECTOR_PAUSED_MESSAGE}
      </p>
    </div>
  );
}

function SendButton({
  target,
  connected,
  pending,
  sending,
  canvas,
  onSend,
}: {
  target: DesignAppTarget;
  connected: boolean;
  pending: boolean;
  sending: DesignAppTarget | null;
  canvas: HTMLCanvasElement | null;
  onSend: (target: DesignAppTarget) => void;
}) {
  const appName = target === 'figma' ? 'Figma' : 'Affinity';
  return (
    <button
      type="button"
      onClick={() => onSend(target)}
      disabled={!canvas || !connected || pending || sending !== null}
      className="min-h-10 border border-fire/60 bg-fire/15 px-2 py-2 text-left text-xs font-semibold text-k-text transition-colors hover:bg-fire/25 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {sending === target ? '送信中…' : pending ? '受信処理中…' : `${appName}に送信`}
    </button>
  );
}

function ConnectionRow({
  appName,
  target,
  connection,
  approving,
  onApprove,
  onDismiss,
  onDisconnect,
}: {
  appName: string;
  target: DesignAppTarget;
  connection: DesignAppConnectorState['figma'];
  approving: boolean;
  onApprove: (target: DesignAppTarget, requestId: string) => void;
  onDismiss: (target: DesignAppTarget, requestId: string) => void;
  onDisconnect: (target: DesignAppTarget) => void;
}) {
  const transferLabel = connection.lastTransfer?.status === 'delivered'
    ? '直近のPNGを配置しました'
    : connection.lastTransfer?.status === 'failed'
      ? connection.lastTransfer.message || '直近のPNG配置でエラーが発生しました'
      : connection.lastTransfer?.status === 'queued'
        ? 'PNGをアプリへ転送中'
        : null;

  return (
    <div className="border border-panel-border bg-k-surface px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connection.connected ? 'bg-emerald-400' : 'bg-k-muted'}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-k-text">{appName} <span className="font-normal text-deep">· {connection.connected ? `${connection.displayName || appName} 接続中` : '受信アプリから接続'}</span></p>
          {transferLabel && <p className={`mt-0.5 truncate text-[10px] ${connection.lastTransfer?.status === 'failed' ? 'text-red-300' : 'text-emerald-300'}`}>{transferLabel}</p>}
        </div>
        {connection.connected && <button type="button" onClick={() => onDisconnect(target)} className="shrink-0 px-1 text-[10px] text-deep hover:text-k-text">解除</button>}
      </div>
      {connection.connectionRequest && (
        <div className="mt-2 flex items-center gap-2 border-t border-panel-border/70 pt-2">
          <p className="min-w-0 flex-1 truncate text-[10px] text-k-text/80">{connection.connectionRequest.displayName} から接続リクエスト</p>
          <button
            type="button"
            onClick={() => onApprove(target, connection.connectionRequest!.id)}
            disabled={approving}
            className="shrink-0 bg-fire/20 px-2 py-1 text-[10px] font-semibold text-k-text hover:bg-fire/30 disabled:opacity-50"
          >
            {approving ? '許可中…' : '許可'}
          </button>
          <button
            type="button"
            onClick={() => onDismiss(target, connection.connectionRequest!.id)}
            className="shrink-0 px-1 py-1 text-[10px] text-deep hover:text-k-text"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
