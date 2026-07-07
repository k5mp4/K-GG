import { useEffect } from 'react';
import type { NativeFfmpegStatus } from '../adapters';
import { Icon } from './Icon';

const FFMPEG_BUILDS_URL = 'https://www.gyan.dev/ffmpeg/builds/#release-builds';

type Props = {
  open: boolean;
  checking: boolean;
  status: NativeFfmpegStatus | null;
  onClose: () => void;
  onCheckAgain: () => void;
  onOpenFolder: () => void;
  onOpenBuildsPage: () => void;
};

export function FfmpegSetupDialog({
  open,
  checking,
  status,
  onClose,
  onCheckAgain,
  onOpenFolder,
  onOpenBuildsPage,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !checking) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [checking, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-10">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        disabled={checking}
        aria-label="FFmpeg案内を閉じる"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ffmpeg-dialog-title"
        className="relative flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden border border-cream/40 bg-k-surface shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-fire to-transparent" />
        <header className="flex items-center justify-between border-b border-cream/30 bg-k-bg/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-fire/60 bg-fire/10 text-fire">
              <Icon name="warning" className="text-[20px]" />
            </span>
            <div>
              <p className="text-[9px] font-display font-semibold uppercase tracking-[0.24em] text-fire">
                Video export dependency
              </p>
              <h2 id="ffmpeg-dialog-title" className="font-display text-lg font-bold uppercase tracking-wider text-k-text">
                FFmpeg is required
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={checking}
            className="flex h-9 w-9 items-center justify-center text-tab-inactive hover:bg-k-border hover:text-k-text disabled:opacity-30"
            aria-label="閉じる"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-6 scrollbar-thin">
          <p className="text-sm leading-relaxed text-k-text/85">
            MOV / MP4書き出しには、Windows x64版のFFmpegと
            <code className="mx-1 text-fire">qtrle</code>・
            <code className="mx-1 text-fire">libx264rgb</code>
            エンコーダーが必要です。
          </p>

          <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-k-text/75">
            <li>gyan.devから「release essentials」のZIPをダウンロードして展開します。</li>
            <li>展開したフォルダの<code className="mx-1 text-k-text">bin/ffmpeg.exe</code>をコピーします。</li>
            <li>下のボタンでK-GG専用フォルダを開き、そこへ配置して再確認します。</li>
          </ol>

          <div className="border border-cream/20 bg-k-bg/55 p-4 text-xs leading-relaxed text-tab-inactive">
            システムPATHから<code className="mx-1 text-k-text">ffmpeg</code>を実行できる場合も利用できます。
            K-GGはFFmpegのダウンロードやPATH変更を行いません。
          </div>

          {(status?.error || status?.warning) && (
            <div className="border border-red-400/40 bg-red-400/10 p-3 text-xs leading-relaxed text-red-200">
              {status.warning && <p>{status.warning}</p>}
              {status.error && <p className={status.warning ? 'mt-1' : ''}>{status.error}</p>}
            </div>
          )}

          {status?.folderPath && (
            <p className="break-all text-[10px] leading-relaxed text-tab-inactive">
              K-GG専用フォルダ: {status.folderPath}
            </p>
          )}

          <p className="text-[10px] leading-relaxed text-tab-inactive">
            gyan.devの推奨ビルドはGPLv3です。FFmpegのライセンスは導入したビルドに従います。
          </p>
          <p className="break-all text-[10px] leading-relaxed text-tab-inactive">
            {FFMPEG_BUILDS_URL}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onOpenBuildsPage}
              className="flex items-center justify-center border border-fire bg-fire/15 px-4 py-2.5 text-xs font-display font-bold uppercase tracking-wider text-fire hover:bg-fire hover:text-k-bg"
            >
              Open gyan.dev
            </button>
            <button
              type="button"
              onClick={onOpenFolder}
              className="border border-cream/35 px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wider text-k-text hover:border-cream"
            >
              Open FFmpeg Folder
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={checking}
              className="border border-cream/30 px-4 py-2 text-xs font-display font-semibold uppercase tracking-wider text-tab-inactive hover:text-k-text disabled:opacity-40"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={onCheckAgain}
              disabled={checking}
              className="min-w-32 border border-fire bg-fire px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-k-bg hover:bg-cream disabled:cursor-wait disabled:opacity-50"
            >
              {checking ? 'Checking…' : 'Check again'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
