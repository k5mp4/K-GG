import { useState, useEffect, useRef } from 'react';
import { Toggle } from './Toggle';
import { useGradientStore } from '../store/gradientStore';
import { useRecorder } from '../hooks/useRecorder';
import {
  exportFrameZip,
  exportHighQualityMP4,
  exportLosslessMOV,
  nativeFfmpegSupported,
  openNativeFfmpegFolder,
} from '../lib/exportVideo';
import {
  downloadPNG, downloadJPG, downloadWebP,
  sanitizeStem, saveBlobToDir, canvasToPngBlob,
  canUseDirectoryPicker, pickDirectory,
} from '../lib/export';
import { exportSlits } from '../lib/exportSlits';
import {
  aePing, aeImportImage, aeImportVideo, aeBridgeAvailable,
  aeGetSaveDir, aeChooseSaveDir, aeClearSaveDir,
} from '../lib/aftereffectsExport';
import type { ExportDirectoryHandle, NativeFfmpegStatus } from '../adapters';
import type { AeSaveDirStatus, AeStatus } from '../lib/aftereffectsExport';

type ExportJob = 'mov' | 'mp4' | 'zip' | 'slits' | null;
type VideoExt = 'mov' | 'mp4';

type Props = {
  onExportProgress?: (progress: number | null) => void;
  onResizeCanvas?: (w: number, h: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  ffmpegStatus: NativeFfmpegStatus | null;
  ffmpegChecking: boolean;
  onCheckFfmpeg: (showDialog: boolean) => Promise<NativeFfmpegStatus | null>;
};

export function ExportPanel({
  onExportProgress,
  onResizeCanvas,
  canvasRef,
  ffmpegStatus,
  ffmpegChecking,
  onCheckFfmpeg,
}: Props) {
  const { animation, slitScan, presetName } = useGradientStore();
  const { recording } = useRecorder();

  const [fileName, setFileName] = useState(sanitizeStem(presetName || 'gradient'));
  const [exportJob, setExportJob] = useState<ExportJob>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const lastReportedProgressRef = useRef(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedFormats, setSavedFormats] = useState<Record<string, boolean>>({});
  const [slitTrimMode, setSlitTrimMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // After Effects 連携
  const [aeStatus, setAeStatus] = useState<AeStatus | 'idle' | 'sending'>('idle');
  const [sendToAe, setSendToAe] = useState(false);
  const [aeSaveDirStatus, setAeSaveDirStatus] = useState<AeSaveDirStatus>({ mode: 'auto', path: null, name: null });
  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const [bridgeChecking, setBridgeChecking] = useState(false);

  useEffect(() => {
    if (!bridgeAvailable) {
      setAeSaveDirStatus({ mode: 'auto', path: null, name: null });
      return;
    }

    let cancelled = false;
    aeGetSaveDir().then((status) => {
      if (!cancelled) setAeSaveDirStatus(status);
    });

    return () => {
      cancelled = true;
    };
  }, [bridgeAvailable]);

  // 動画エクスポート完了時に AE 送信できるよう最後の Blob を保持
  const lastVideoRef = useRef<{ blob: Blob; ext: VideoExt } | null>(null);

  function flashSaved(format: string) {
    setSavedFormats((prev) => ({ ...prev, [format]: true }));
    setTimeout(() => setSavedFormats((prev) => ({ ...prev, [format]: false })), 2000);
  }

  function reportProgress(p: number) {
    console.log(`[Export] reportProgress: ${p.toFixed(3)}`);
    // 進捗更新頻度を制限（最低 1% 以上変化したとき、または 100% のときのみ更新）
    if (Math.abs(p - lastReportedProgressRef.current) < 0.01 && p < 0.99) return;
    lastReportedProgressRef.current = p;
    setExportProgress(p);
    onExportProgress?.(p);
  }

  function reportDone() {
    setExportJob(null);
    setExportProgress(0);
    lastReportedProgressRef.current = 0;
    onExportProgress?.(null);
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  async function sendVideoToAe(blob: Blob, ext: VideoExt) {
    setAeStatus('sending');
    const s = await aeImportVideo(blob, ext, stem);
    setAeStatus(s);
    setTimeout(() => setAeStatus('idle'), 4000);
  }

  async function handleAePing() {
    setAeStatus('sending');
    const s = await aePing();
    setBridgeAvailable(s === 'ok');
    setAeStatus(s);
    setTimeout(() => setAeStatus('idle'), 4000);
  }

  async function handleAeRefresh() {
    setBridgeChecking(true);
    const available = await aeBridgeAvailable();
    setBridgeAvailable(available);
    setBridgeChecking(false);
  }

  async function handleAeSendImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setAeStatus('sending');
    const blob = await canvasToPngBlob(canvas);
    const s = await aeImportImage(blob, stem);
    setAeStatus(s);
    setTimeout(() => setAeStatus('idle'), 4000);
  }

  async function handleAeSendVideo() {
    if (!lastVideoRef.current) return;
    setAeStatus('sending');
    const { blob, ext } = lastVideoRef.current;
    const s = await aeImportVideo(blob, ext, stem);
    setAeStatus(s);
    setTimeout(() => setAeStatus('idle'), 4000);
  }

  // 書き出し先フォルダハンドル（セッション中保持）
  const dirHandleRef = useRef<ExportDirectoryHandle | null>(null);
  const [dirName, setDirName] = useState<string | null>(null);

  // presetName が変わったときにファイル名を追従
  useEffect(() => {
    setFileName(sanitizeStem(presetName || 'gradient'));
  }, [presetName]);

  const stem = sanitizeStem(fileName) || 'gradient';
  const videoReady = animation.enabled;
  const pickerAvailable = canUseDirectoryPicker();
  const nativeFfmpegAvailable = nativeFfmpegSupported();
  const nativeVideoEncodeReady = nativeFfmpegAvailable
    && !ffmpegChecking
    && ffmpegStatus?.available === true;

  async function ensureNativeVideoEncodeReady(): Promise<boolean> {
    const status = await onCheckFfmpeg(true);
    return status?.available === true;
  }

  async function handlePickDirectory() {
    const handle = await pickDirectory();
    if (!handle) return;
    dirHandleRef.current = handle;
    setDirName(typeof handle === 'string'
      ? handle.split(/[\\/]/).filter(Boolean).pop() ?? handle
      : handle.name);
  }

  function handleClearDirectory() {
    dirHandleRef.current = null;
    setDirName(null);
  }

  async function handleAePickDirectory() {
    const status = await aeChooseSaveDir();
    setAeSaveDirStatus(status);
  }

  async function handleAeClearDirectory() {
    const status = await aeClearSaveDir();
    setAeSaveDirStatus(status);
  }

  async function handleExportMov() {
    console.log('[Export] handleExportMov START');
    const canvas = canvasRef.current;
    if (!canvas || exportJob) return;
    if (!await ensureNativeVideoEncodeReady()) return;

    // キャンバスが描画されるまで待機（高解像度で WebGL 初期化が遅延する場合がある）
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    // 非同期処理の前に即座に 0% を通知して isExporting フラグを確定させる
    onExportProgress?.(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setExportJob('mov');
    lastReportedProgressRef.current = 0;
    setExportProgress(0);

    try {
      const blob = await exportLosslessMOV({
        canvas,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        signal: controller.signal,
        onProgress: reportProgress,
      });
      await saveBlobToDir(blob, `${stem}.mov`, dirHandleRef.current);
      lastVideoRef.current = { blob, ext: 'mov' };
      flashSaved('mov');
      if (sendToAe) await sendVideoToAe(blob, 'mov');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('MOV export failed:', e);
        setExportError(errorMsg.includes('ビデオサイズが大きすぎます')
          ? errorMsg
          : 'MOV エクスポートに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 8000);
      }
    } finally {
      reportDone();
    }
  }

  async function handleExportMP4() {
    const canvas = canvasRef.current;
    if (!canvas || exportJob) return;
    if (!await ensureNativeVideoEncodeReady()) return;

    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    onExportProgress?.(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setExportJob('mp4');
    lastReportedProgressRef.current = 0;
    setExportProgress(0);

    try {
      const blob = await exportHighQualityMP4({
        canvas,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        signal: controller.signal,
        onProgress: reportProgress,
      });
      await saveBlobToDir(blob, `${stem}_h264rgb.mp4`, dirHandleRef.current);
      lastVideoRef.current = { blob, ext: 'mp4' };
      flashSaved('mp4');
      if (sendToAe) await sendVideoToAe(blob, 'mp4');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('MP4 export failed:', e);
        setExportError(errorMsg || 'MP4 エクスポートに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 8000);
      }
    } finally {
      reportDone();
    }
  }

  async function handleExportZip() {
    const canvas = canvasRef.current;
    if (!canvas || exportJob) return;

    // キャンバスが描画されるまで待機
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    // 非同期処理の前に即座に 0% を通知して isExporting フラグを確定させる
    onExportProgress?.(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setExportJob('zip');
    lastReportedProgressRef.current = 0;
    setExportProgress(0);

    try {
      const blob = await exportFrameZip({
        canvas,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        signal: controller.signal,
        onProgress: reportProgress,
      });
      await saveBlobToDir(blob, `${stem}_frames.zip`, dirHandleRef.current);
      flashSaved('zip');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        console.error('ZIP export failed:', e);
        setExportError('ZIPエクスポートに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 5000);
      }
    } finally {
      reportDone();
    }
  }

  async function handleExportSlits() {
    console.log('[Export] handleExportSlits START');
    const canvas = canvasRef.current;
    if (!canvas || exportJob) return;

    // キャンバスが描画されるまで待機
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    // 非同期処理の前に即座に 0% を通知して isExporting フラグを確定させる
    onExportProgress?.(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setExportJob('slits');
    lastReportedProgressRef.current = 0;
    setExportProgress(0);

    try {
      await exportSlits({
        canvas,
        slitScan,
        stem,
        dirHandle: dirHandleRef.current,
        signal: controller.signal,
        onProgress: reportProgress,
        trimToSlit: slitTrimMode,
      });
      flashSaved('slits');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        console.error('Slit export failed:', e);
        setExportError('スリット書き出しに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 5000);
      }
    } finally {
      reportDone();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-k-text">Export</h2>

      {/* ファイル名 */}
      <div className="space-y-1">
        <label className="text-xs text-deep">ファイル名</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full px-2 py-1.5 bg-k-surface border border-panel-border border-panel rounded-none text-xs text-k-text focus:outline-none focus:border-fire"
          placeholder="gradient"
          spellCheck={false}
        />
      </div>

      {/* 書き出し先フォルダ */}
      {pickerAvailable && (
        <div className="space-y-1">
          <label className="text-xs text-deep">書き出し先フォルダ</label>
          {dirName ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 px-2 py-1.5 bg-k-surface border border-panel-border border-panel rounded-none text-xs text-k-text truncate">
                📁 {dirName}
              </span>
              <button
                onClick={handleClearDirectory}
                className="px-2 py-1.5 bg-k-muted hover:bg-k-muted/70 rounded-none text-xs text-k-text/80"
                title="フォルダ指定を解除"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={handlePickDirectory}
              className="w-full px-3 py-1.5 bg-k-surface hover:bg-k-muted border border-panel-border border-panel border-dashed rounded-none text-xs text-deep hover:text-k-text transition-colors"
            >
              フォルダを選択…
            </button>
          )}
          {!dirName && (
            <p className="text-xs text-tab-inactive">未指定の場合はダウンロードフォルダに保存</p>
          )}
        </div>
      )}

      {/* 静止画 */}
      <div className="space-y-2">
        <p className="text-xs text-deep">静止画</p>
        <button
          onClick={() => { const c = canvasRef.current; if (c) downloadPNG(c, stem, dirHandleRef.current).then(() => flashSaved('png')); }}
          className="w-full py-2 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-sm font-display font-semibold text-k-text uppercase tracking-wider"
        >
          {savedFormats['png'] ? '✓ Saved' : 'Save PNG'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { const c = canvasRef.current; if (c) downloadJPG(c, 0.92, stem, dirHandleRef.current).then(() => flashSaved('jpg')); }}
            className="flex-1 py-1.5 bg-k-muted hover:bg-k-muted/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text"
          >
            {savedFormats['jpg'] ? '✓' : 'JPG'}
          </button>
          <button
            onClick={() => { const c = canvasRef.current; if (c) downloadWebP(c, 0.92, stem, dirHandleRef.current).then(() => flashSaved('webp')); }}
            className="flex-1 py-1.5 bg-k-muted hover:bg-k-muted/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text"
          >
            {savedFormats['webp'] ? '✓' : 'WebP'}
          </button>
        </div>
      </div>

      {/* スリット書き出し */}
      {slitScan.enabled && (
        <div className="border-t border-panel-border border-t-panel pt-4 space-y-2">
          <p className="text-xs text-deep">スリット書き出し</p>
          <p className="text-xs text-tab-inactive">
            {slitScan.mode === 'circular' ? '同心円' : slitScan.mode === 'polygon' ? `正${slitScan.polygonSides ?? 6}角形` : '直線'}スリットごとに個別 PNG を書き出します
          </p>
          {slitScan.mode === 'circular' && onResizeCanvas && (
            <button
              onClick={() => onResizeCanvas(1920, 1920)}
              className="w-full py-1.5 bg-k-muted hover:bg-k-muted/70 rounded-none text-xs text-k-text"
            >
              キャンバスを 1920×1920 に変更
            </button>
          )}
          <div className="flex items-center justify-between gap-2 select-none">
            <span className="text-xs text-k-text/80">
              トリムモード（各スリットサイズ・アルファなし）
            </span>
            <Toggle variant="switch" size="xs" checked={slitTrimMode} onChange={setSlitTrimMode} />
          </div>
          <div className="relative min-h-[40px]">
            <div style={{ display: exportJob === 'slits' ? 'block' : 'none' }}>
              <ProgressBar
                label={`Slits ${Math.round(exportProgress * 100)}%`}
                progress={exportProgress}
                onCancel={handleCancel}
              />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportSlits}
                disabled={recording}
                className="w-full py-2 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-sm font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['slits'] ? '✓ Saved' : 'Export Slit PNGs'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 動画 */}
      <div className="border-t border-panel-border border-t-panel pt-4 space-y-3">
        <p className="text-xs text-deep">動画</p>

        {!animation.enabled && (
          <p className="text-xs text-tab-inactive">Animation を有効にすると動画書き出しが可能です</p>
        )}

        {nativeFfmpegAvailable && (
          <div className={`border p-3 text-xs ${
            ffmpegStatus?.available
              ? 'border-emerald-400/35 bg-emerald-400/10'
              : 'border-amber-300/35 bg-amber-300/10'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={ffmpegStatus?.available ? 'text-emerald-300' : 'text-amber-200'}>
                  {ffmpegChecking
                    ? 'Checking FFmpeg…'
                    : ffmpegStatus?.available
                      ? `FFmpeg ready · ${ffmpegStatus.source === 'app-data-folder' ? 'K-GG folder' : 'System PATH'}`
                      : 'FFmpeg not found'}
                </p>
                {ffmpegStatus?.version && (
                  <p className="mt-1 truncate text-[10px] text-k-text/65" title={ffmpegStatus.version}>
                    {ffmpegStatus.version}
                  </p>
                )}
                {ffmpegStatus?.warning && (
                  <p className="mt-1 text-[10px] leading-relaxed text-amber-200/80">
                    {ffmpegStatus.warning}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void onCheckFfmpeg(true)}
                disabled={ffmpegChecking}
                className="shrink-0 border border-cream/30 px-2 py-1 text-[9px] font-display font-semibold uppercase tracking-wider text-k-text hover:border-cream disabled:opacity-40"
              >
                Check
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                void openNativeFfmpegFolder().catch((error) => {
                  setExportError(error instanceof Error ? error.message : String(error));
                });
              }}
              className="mt-2 text-[10px] text-fire underline underline-offset-2 hover:text-cream"
            >
              Open K-GG FFmpeg folder
            </button>
          </div>
        )}

        {/* オフライン書き出し */}
        <div className="space-y-1.5">
          <p className="text-xs text-tab-inactive">動画ファイル</p>

          <div className="relative min-h-[40px]">
            {/* MOV Section */}
            <div style={{ display: exportJob === 'mov' ? 'block' : 'none' }}>
              <ProgressBar label={`MOV ${Math.round(exportProgress * 100)}%`} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportMov}
                disabled={recording || !videoReady || !nativeVideoEncodeReady}
                className="w-full py-1.5 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['mov'] ? '✓ Saved' : 'Export MOV'}
              </button>
            </div>
          </div>

          <div className="relative min-h-[40px]">
            <div style={{ display: exportJob === 'mp4' ? 'block' : 'none' }}>
              <ProgressBar label={`MP4 ${Math.round(exportProgress * 100)}%`} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportMP4}
                disabled={recording || !videoReady || !nativeVideoEncodeReady}
                className="w-full py-1.5 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['mp4'] ? '✓ Saved' : 'Export MP4 (H.264 RGB)'}
              </button>
            </div>
          </div>

          <p className="text-xs text-tab-inactive">連番PNG出力</p>

          <div className="relative min-h-[40px]">
            {/* ZIP Section */}
            <div style={{ display: exportJob === 'zip' ? 'block' : 'none' }}>
              <ProgressBar label={`ZIP ${Math.round(exportProgress * 100)}%`} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportZip}
                disabled={recording || !videoReady}
                className="w-full py-1.5 bg-fire/70 hover:bg-fire disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['zip'] ? '✓ Saved' : 'Export ZIP PNG'}
              </button>
            </div>
          </div>

          {exportError && (
            <p className="text-xs text-red-400 text-center">{exportError}</p>
          )}
        </div>
      </div>

      {/* After Effects Connect */}
      <div className="border-t border-panel-border border-t-panel pt-4 space-y-2 transition-opacity">
        <div className="flex items-center gap-2">
          <p className="text-xs text-deep">After Effects Connect</p>
          <span className="px-1.5 py-0.5 border border-fire/40 bg-fire/10 text-[9px] font-display font-semibold uppercase tracking-wider text-fire">
            Beta
          </span>
        </div>

        {/* ステータス表示 */}
        {aeStatus === 'sending' && (
          <p className="text-xs text-yellow-400">AE に送信中...</p>
        )}
        {aeStatus === 'ok' && (
          <p className="text-xs text-green-400">✓ AE に送信しました</p>
        )}
        {aeStatus === 'not-running' && (
          <p className="text-xs text-red-400">After Effects が起動していません</p>
        )}
        {aeStatus === 'error' && (
          <p className="text-xs text-red-400">エラーが発生しました（コンソールを確認）</p>
        )}

        {bridgeAvailable ? (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-tab-inactive">AE送信ファイル保存先</p>
              {aeSaveDirStatus.mode === 'custom' ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-2 py-1.5 bg-k-surface border border-panel-border border-panel rounded-none text-xs text-k-text truncate">
                    {aeSaveDirStatus.name ?? aeSaveDirStatus.path}
                  </span>
                  <button
                    type="button"
                    onClick={handleAeClearDirectory}
                    className="px-2 py-1.5 bg-k-muted hover:bg-k-muted/70 rounded-none text-xs text-k-text/80"
                    title="AE送信ファイルの保存先指定を解除"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAePickDirectory}
                  className="w-full px-3 py-1.5 bg-k-surface hover:bg-k-muted border border-panel-border border-panel border-dashed rounded-none text-xs text-deep hover:text-k-text transition-colors"
                >
                  フォルダを選択…
                </button>
              )}
              <p className="text-xs text-tab-inactive">
                未指定の場合はAEプロジェクトの場所に保存します。AEプロジェクト未保存の場合はtempに保存します
              </p>
            </div>

            {/* 接続テスト */}
            <button
              onClick={handleAePing}
              disabled={aeStatus === 'sending'}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              AE 接続テスト (alert)
            </button>

            {/* 画像送信 */}
            <button
              onClick={handleAeSendImage}
              disabled={aeStatus === 'sending'}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              現在の画像を AE に送る (PNG)
            </button>

            {/* 動画エクスポート後に自動送信するトグル */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle size="sm" checked={sendToAe} onChange={setSendToAe} />
              <span className="text-xs text-k-text/80">動画エクスポート後に AE に自動送信</span>
            </label>

            {/* 手動送信（前回エクスポート分） */}
            <button
              onClick={handleAeSendVideo}
              disabled={aeStatus === 'sending' || !lastVideoRef.current}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
              title={lastVideoRef.current ? undefined : '先に動画をエクスポートしてください'}
            >
              前回エクスポートした動画を AE に送る
              {lastVideoRef.current && (
                <span className="ml-1 text-tab-inactive">(.{lastVideoRef.current.ext})</span>
              )}
            </button>
          </>
        ) : (
          <div className="rounded-none bg-k-bg border border-panel-border border-panel px-3 py-2 space-y-1">
            <p className="text-xs text-yellow-400">現在開発中です！</p>
            <p className="text-xs text-deep">AEに直接画像や動画を送る機能にする予定です</p>
            <p className="text-xs text-yellow-400">Currently in development!</p>
            <p className="text-xs text-deep">A feature for sending images and videos directly to AE is planned.</p>
            <button
              type="button"
              onClick={handleAeRefresh}
              disabled={bridgeChecking}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              {bridgeChecking ? 'Checking...' : 'AE Bridge を確認'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, progress, onCancel }: { label: string; progress: number; onCancel?: () => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-deep">{label}</span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[10px] px-2 py-0.5 bg-k-surface hover:bg-red-900/60 text-tab-inactive hover:text-red-300 rounded-none transition-colors"
          >
            キャンセル
          </button>
        )}
      </div>
      <div className="w-full bg-k-muted rounded-full h-1.5">
        <div
          className="bg-fire h-1.5 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
