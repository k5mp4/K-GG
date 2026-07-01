import { useEffect, useState } from 'react';
import type { UpdateState } from './types';
import { updateProgressPercent } from './updateState';

type UpdateDialogProps = {
  open: boolean;
  state: UpdateState;
  appVersion: string | null;
  onClose: () => void;
  onRetry: () => void;
  onInstall: () => void;
};

function formatDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function UpdateDialog({
  open,
  state,
  appVersion,
  onClose,
  onRetry,
  onInstall,
}: UpdateDialogProps) {
  const [confirmingInstall, setConfirmingInstall] = useState(false);
  const busy = state.status === 'downloading' || state.status === 'installing';
  const progress = updateProgressPercent(state);
  const releaseDate = formatDate(state.info?.date);
  const closeDialog = () => {
    setConfirmingInstall(false);
    onClose();
  };

  useEffect(() => {
    if (!open || busy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmingInstall(false);
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-10">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={closeDialog}
        disabled={busy}
        aria-label="アップデート画面を閉じる"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden border border-cream/40 bg-k-surface shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-fire to-transparent" />
        <header className="flex shrink-0 items-center justify-between border-b border-cream/30 bg-k-bg/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-fire/60 bg-fire/10 text-fire">
              <span className="material-symbols-rounded text-[20px]">system_update_alt</span>
            </span>
            <div>
              <p className="text-[9px] font-display font-semibold uppercase tracking-[0.24em] text-fire">
                K-GG Desktop
              </p>
              <h2 id="update-dialog-title" className="font-display text-lg font-bold uppercase tracking-wider text-k-text">
                Software Update
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center text-tab-inactive transition-colors hover:bg-k-border hover:text-k-text disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="閉じる"
          >
            <span className="material-symbols-rounded text-[20px]">close</span>
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-6 scrollbar-thin">
          {state.status === 'checking' && (
            <div className="flex min-h-44 flex-col items-center justify-center gap-4 text-center">
              <span className="material-symbols-rounded animate-spin text-3xl text-fire">progress_activity</span>
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-k-text">Checking release channel</p>
                <p className="mt-2 text-xs text-tab-inactive">GitHub Releasesから最新情報を確認しています。</p>
              </div>
            </div>
          )}

          {state.status === 'upToDate' && (
            <div className="flex min-h-44 flex-col items-center justify-center gap-4 text-center">
              <span className="material-symbols-rounded text-4xl text-emerald-400">verified</span>
              <div>
                <p className="font-display text-base font-bold uppercase tracking-wider text-k-text">Up to date</p>
                <p className="mt-2 text-sm text-k-text/75">
                  K-GG {appVersion ? `v${appVersion}` : ''} は最新です。
                </p>
              </div>
            </div>
          )}

          {state.status === 'available' && state.info && (
            <div className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-y border-cream/20 py-4">
                <div>
                  <p className="text-[9px] font-display uppercase tracking-[0.2em] text-tab-inactive">Installed</p>
                  <p className="mt-1 font-display text-xl font-bold text-k-text">v{state.info.currentVersion}</p>
                </div>
                <span className="material-symbols-rounded text-fire">arrow_forward</span>
                <div className="text-right">
                  <p className="text-[9px] font-display uppercase tracking-[0.2em] text-fire">Available</p>
                  <p className="mt-1 font-display text-xl font-bold text-fire">v{state.info.version}</p>
                </div>
              </div>

              {releaseDate && (
                <p className="text-[10px] font-display uppercase tracking-wider text-tab-inactive">
                  Published {releaseDate}
                </p>
              )}

              <div>
                <p className="mb-2 text-[10px] font-display font-semibold uppercase tracking-[0.18em] text-k-text">
                  Release notes
                </p>
                <div className="max-h-48 overflow-y-auto border border-cream/20 bg-k-bg/55 p-4 text-sm leading-relaxed text-k-text/80 scrollbar-thin">
                  <p className="whitespace-pre-wrap">{state.info.notes?.trim() || 'このリリースの更新内容はありません。'}</p>
                </div>
              </div>

              {confirmingInstall ? (
                <div className="border border-fire/55 bg-fire/10 p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-rounded mt-0.5 text-fire">warning</span>
                    <div>
                      <p className="text-sm font-semibold text-k-text">更新中にK-GGを終了します</p>
                      <p className="mt-1 text-xs leading-relaxed text-k-text/70">
                        必要なプリセットや書き出し内容を保存してから開始してください。
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingInstall(false)}
                      className="border border-cream/30 px-4 py-2 text-xs font-display font-semibold uppercase tracking-wider text-tab-inactive hover:border-cream/60 hover:text-k-text"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onInstall}
                      className="border border-fire bg-fire px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-k-bg hover:bg-cream hover:border-cream"
                    >
                      Start update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="border border-cream/30 px-5 py-2.5 text-xs font-display font-semibold uppercase tracking-wider text-tab-inactive hover:border-cream/60 hover:text-k-text"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingInstall(true)}
                    className="border border-fire bg-fire/15 px-5 py-2.5 text-xs font-display font-bold uppercase tracking-wider text-fire hover:bg-fire hover:text-k-bg"
                  >
                    Download & install
                  </button>
                </div>
              )}
            </div>
          )}

          {(state.status === 'downloading' || state.status === 'installing') && (
            <div className="flex min-h-52 flex-col justify-center">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-display font-semibold uppercase tracking-[0.22em] text-fire">
                    {state.status === 'downloading' ? 'Downloading package' : 'Installing update'}
                  </p>
                  <p className="mt-2 text-sm text-k-text">
                    {state.status === 'downloading'
                      ? '署名済みアップデートを取得しています。'
                      : '更新を適用しています。K-GGは自動的に再起動します。'}
                  </p>
                </div>
                <span className="font-display text-2xl font-bold text-k-text">
                  {state.status === 'installing' ? '100%' : progress === null ? '—' : `${progress}%`}
                </span>
              </div>
              <div className="mt-6 h-2 overflow-hidden border border-cream/25 bg-k-bg">
                <div
                  className={`h-full bg-fire transition-[width] duration-200 ${
                    progress === null && state.status === 'downloading' ? 'w-1/3 animate-pulse' : ''
                  }`}
                  style={progress === null ? undefined : { width: `${state.status === 'installing' ? 100 : progress}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-tab-inactive">
                この画面を閉じたり、PCの電源を切ったりしないでください。
              </p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="space-y-5">
              <div className="flex gap-4 border border-red-400/45 bg-red-400/10 p-4">
                <span className="material-symbols-rounded text-red-300">error</span>
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-k-text">Update failed</p>
                  <p className="mt-2 break-words text-xs leading-relaxed text-k-text/75">{state.error}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-tab-inactive">
                アプリはそのまま利用できます。ネットワーク接続を確認し、時間をおいて再試行してください。
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="border border-cream/30 px-4 py-2 text-xs font-display font-semibold uppercase tracking-wider text-tab-inactive hover:text-k-text"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingInstall(false);
                    onRetry();
                  }}
                  className="border border-fire bg-fire/15 px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-fire hover:bg-fire hover:text-k-bg"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
