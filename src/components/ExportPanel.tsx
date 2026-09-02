import { useState, useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import { Toggle } from './Toggle';
import { useGradientStore } from '../store/gradientStore';
import { useRecorder } from '../hooks/useRecorder';
import {
  exportFrameZip,
  exportHighQualityMP4,
  exportLosslessMOV,
  nativeFfmpegSupported,
  openNativeFfmpegFolder,
  saveNativeVideoArtifact,
} from '../lib/exportVideo';
import {
  downloadPNG, downloadJPG, downloadWebP,
  sanitizeStem, saveBlobToDir, canvasToPngBlob,
  canUseDirectoryPicker, pickDirectory,
} from '../lib/export';
import { exportSlits } from '../lib/exportSlits';
import {
  aePing, aeImportImage, aeImportVideo, aeBridgeAvailable, aeRuntime,
  aeGetSaveDir, aeChooseSaveDir, aeClearSaveDir,
} from '../lib/aftereffectsExport';
import { MP4_QUALITY_PRESETS } from '../adapters';
import type {
  ExportDirectoryHandle,
  ExportStage,
  Mp4QualityPreset,
  NativeFfmpegStatus,
  NativeVideoArtifact,
  VideoExportFrameRenderer,
} from '../adapters';
import type { AeSaveDirStatus, AeStatus } from '../lib/aftereffectsExport';
import { renderBridge } from '../lib/renderBridge';
import { exportDisplayProgress, exportProgressPercent, exportStageLabel } from '../lib/exportProgress';
import { completeVideoExport } from '../lib/videoExportLifecycle';
import { createAeStatusController } from '../lib/aeStatusController';
import { useLanguage } from '../i18n/LanguageProvider';

type ExportJob = 'mov' | 'mp4' | 'zip' | 'slits' | null;
type VideoExt = 'mov' | 'mp4';

async function releaseVideoArtifact(artifact: NativeVideoArtifact): Promise<void> {
  let lastError: unknown;
  for (const delayMs of [0, 100, 500]) {
    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
    try {
      await artifact.release();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  console.warn('Native video workspace cleanup failed after retries:', lastError);
  throw lastError;
}

type Props = {
  onExportProgress?: (progress: number | null) => void;
  onExportStage?: (stage: ExportStage) => void;
  onResizeCanvas?: (w: number, h: number) => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  previewCanvasRef?: RefObject<HTMLCanvasElement | null>;
  exportFrameRendererRef?: MutableRefObject<VideoExportFrameRenderer | null>;
  ffmpegStatus: NativeFfmpegStatus | null;
  ffmpegChecking: boolean;
  onCheckFfmpeg: (showDialog: boolean) => Promise<NativeFfmpegStatus | null>;
};

export function ExportPanel({
  onExportProgress,
  onExportStage,
  onResizeCanvas,
  canvasRef,
  previewCanvasRef,
  exportFrameRendererRef,
  ffmpegStatus,
  ffmpegChecking,
  onCheckFfmpeg,
}: Props) {
  const { t } = useLanguage();
  const { animation, slitScan, presetName } = useGradientStore();
  const outputCanvasRef = previewCanvasRef ?? canvasRef;
  const { recording } = useRecorder(outputCanvasRef);

  function getOutputCanvas(): HTMLCanvasElement | null {
    return outputCanvasRef.current;
  }

  function getOutputFrameRenderer(): VideoExportFrameRenderer | undefined {
    return exportFrameRendererRef?.current ?? undefined;
  }

  const [fileName, setFileName] = useState(sanitizeStem(presetName || 'gradient'));
  const [exportJob, setExportJob] = useState<ExportJob>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState<ExportStage>('preparing');
  const [mp4Quality, setMp4Quality] = useState<Mp4QualityPreset>('high');
  const lastReportedProgressRef = useRef(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedFormats, setSavedFormats] = useState<Record<string, boolean>>({});
  const [slitTrimMode, setSlitTrimMode] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewWasPlayingRef = useRef<boolean | null>(null);
  const mountedRef = useRef(true);

  // After Effects 連携
  const [aeStatus, setAeStatus] = useState<AeStatus | 'idle' | 'sending'>('idle');
  const [sendToAe, setSendToAe] = useState(false);
  const [pendingAeVideoSends, setPendingAeVideoSends] = useState(0);
  const [aeSaveDirStatus, setAeSaveDirStatus] = useState<AeSaveDirStatus>({ mode: 'auto', path: null, name: null });
  const [bridgeAvailable, setBridgeAvailable] = useState(false);
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const aeStatusControllerRef = useRef<ReturnType<typeof createAeStatusController> | null>(null);
  if (aeStatusControllerRef.current === null) {
    aeStatusControllerRef.current = createAeStatusController(setAeStatus);
  }
  const aeStatusController = aeStatusControllerRef.current;

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

  // 動画エクスポート完了時に AE 送信できるよう最後のネイティブ成果物を保持
  const lastVideoRef = useRef<{ artifact: NativeVideoArtifact; ext: VideoExt } | null>(null);
  const videoSendPromisesRef = useRef(new Map<NativeVideoArtifact, Promise<void>>());
  const videoSendQueueRef = useRef<Promise<void>>(Promise.resolve());

  async function releaseVideoWhenIdle(artifact: NativeVideoArtifact): Promise<void> {
    await videoSendPromisesRef.current.get(artifact)?.catch(() => undefined);
    await releaseVideoArtifact(artifact);
  }

  useEffect(() => {
    mountedRef.current = true;
    const sendPromises = videoSendPromisesRef.current;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      aeStatusController.dispose();
      const lastVideo = lastVideoRef.current;
      lastVideoRef.current = null;
      if (lastVideo) {
        const pendingSend = sendPromises.get(lastVideo.artifact);
        void (async () => {
          await pendingSend?.catch(() => undefined);
          await releaseVideoArtifact(lastVideo.artifact);
        })().catch(() => undefined);
      }
    };
  }, [aeStatusController]);

  function flashSaved(format: string) {
    setSavedFormats((prev) => ({ ...prev, [format]: true }));
    setTimeout(() => setSavedFormats((prev) => ({ ...prev, [format]: false })), 2000);
  }

  function reportProgress(p: number) {
    if (!mountedRef.current) return;
    console.log(`[Export] reportProgress: ${p.toFixed(3)}`);
    // 進捗更新頻度を制限（最低 1% 以上変化したとき、または 100% のときのみ更新）
    if (Math.abs(p - lastReportedProgressRef.current) < 0.01 && p < 0.99) return;
    lastReportedProgressRef.current = p;
    setExportProgress(p);
    onExportProgress?.(p);
  }

  function reportStage(stage: ExportStage) {
    if (!mountedRef.current) return;
    setExportStage(stage);
    onExportStage?.(stage);
  }

  function beginExport(job: Exclude<ExportJob, null>): AbortController {
    const controller = new AbortController();
    previewWasPlayingRef.current = renderBridge.suspendAnimation();
    abortControllerRef.current = controller;
    setExportJob(job);
    reportStage('preparing');
    lastReportedProgressRef.current = 0;
    setExportProgress(0);
    onExportProgress?.(0);
    return controller;
  }

  function reportDone() {
    setExportJob(null);
    setExportProgress(0);
    reportStage('preparing');
    lastReportedProgressRef.current = 0;
    onExportProgress?.(null);
  }

  function finishExport(controller: AbortController) {
    if (abortControllerRef.current !== controller) return;
    abortControllerRef.current = null;
    if (mountedRef.current) reportDone();
    const wasPlaying = previewWasPlayingRef.current;
    previewWasPlayingRef.current = null;
    renderBridge.resumeAnimation(wasPlaying ?? false);
  }

  function handleCancel() {
    abortControllerRef.current?.abort();
  }

  async function sendVideoToAe(artifact: NativeVideoArtifact, ext: VideoExt) {
    const requestId = aeStatusController.begin();
    if (mountedRef.current) setPendingAeVideoSends(count => count + 1);

    const send = videoSendQueueRef.current
      .catch(() => undefined)
      .then(() => aeImportVideo(artifact, ext, stem));
    const sendSettled = send.then(() => undefined, () => undefined);
    videoSendQueueRef.current = sendSettled;

    const previousForArtifact = videoSendPromisesRef.current.get(artifact) ?? Promise.resolve();
    const tracked = Promise.allSettled([previousForArtifact, sendSettled]).then(() => undefined);
    videoSendPromisesRef.current.set(artifact, tracked);
    try {
      const status = await send;
      aeStatusController.complete(requestId, status);
    } catch (error) {
      console.error('After Effects video send failed:', error);
      aeStatusController.complete(requestId, 'error');
    } finally {
      await tracked;
      if (videoSendPromisesRef.current.get(artifact) === tracked) {
        videoSendPromisesRef.current.delete(artifact);
      }
      if (mountedRef.current) setPendingAeVideoSends(count => Math.max(0, count - 1));
    }
  }

  async function handleAePing() {
    const requestId = aeStatusController.begin();
    const s = await aePing();
    if (mountedRef.current && aeStatusController.isCurrent(requestId)) {
      setBridgeAvailable(s === 'ok');
    }
    aeStatusController.complete(requestId, s);
  }

  async function handleAeRefresh() {
    setBridgeChecking(true);
    const available = await aeBridgeAvailable();
    setBridgeAvailable(available);
    setBridgeChecking(false);
  }

  async function handleAeSendImage() {
    const canvas = getOutputCanvas();
    if (!canvas) return;
    const requestId = aeStatusController.begin();
    const blob = await canvasToPngBlob(canvas);
    if (!aeStatusController.isCurrent(requestId)) return;
    const s = await aeImportImage(blob, stem);
    aeStatusController.complete(requestId, s);
  }

  async function handleAeSendVideo() {
    if (!lastVideoRef.current) return;
    const { artifact, ext } = lastVideoRef.current;
    await sendVideoToAe(artifact, ext);
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
  const videoExportBlockedByAeQueue = sendToAe && pendingAeVideoSends >= 2;

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
    const canvas = getOutputCanvas();
    const renderFrame = getOutputFrameRenderer();
    if (!canvas || exportJob) return;
    if (!await ensureNativeVideoEncodeReady()) return;

    const controller = beginExport('mov');

    // キャンバスが描画されるまで待機（高解像度で WebGL 初期化が遅延する場合がある）
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    let artifact: NativeVideoArtifact | null = null;
    let retained = false;
    let exportFinished = false;
    try {
      artifact = await exportLosslessMOV({
        canvas,
        renderFrame,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        signal: controller.signal,
        onProgress: reportProgress,
        onStage: reportStage,
      });
      if (controller.signal.aborted || !mountedRef.current) return;
      reportStage('saving');
      const completedArtifact = artifact;
      const saved = await completeVideoExport({
        save: async () => {
          const saved = await saveNativeVideoArtifact(completedArtifact, `${stem}.mov`, dirHandleRef.current);
          return saved && !controller.signal.aborted && mountedRef.current;
        },
        onSaved: () => {
          reportProgress(1);
          const previous = lastVideoRef.current;
          lastVideoRef.current = { artifact: completedArtifact, ext: 'mov' };
          retained = true;
          if (previous) void releaseVideoWhenIdle(previous.artifact).catch(() => undefined);
          flashSaved('mov');
        },
        releaseExport: () => {
          finishExport(controller);
          exportFinished = true;
        },
        sendToAe: sendToAe ? () => sendVideoToAe(completedArtifact, 'mov') : undefined,
      });
      if (!saved) return;
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
      if (!retained && artifact) await releaseVideoArtifact(artifact).catch(() => undefined);
      if (!exportFinished) finishExport(controller);
    }
  }

  async function handleExportMP4() {
    const canvas = getOutputCanvas();
    const renderFrame = getOutputFrameRenderer();
    if (!canvas || exportJob) return;
    if (!await ensureNativeVideoEncodeReady()) return;

    const controller = beginExport('mp4');

    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    let artifact: NativeVideoArtifact | null = null;
    let retained = false;
    let exportFinished = false;
    try {
      artifact = await exportHighQualityMP4({
        canvas,
        renderFrame,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        mp4Quality,
        signal: controller.signal,
        onProgress: reportProgress,
        onStage: reportStage,
      });
      if (controller.signal.aborted || !mountedRef.current) return;
      reportStage('saving');
      const completedArtifact = artifact;
      const saved = await completeVideoExport({
        save: async () => {
          const saved = await saveNativeVideoArtifact(completedArtifact, `${stem}_h264rgb.mp4`, dirHandleRef.current);
          return saved && !controller.signal.aborted && mountedRef.current;
        },
        onSaved: () => {
          reportProgress(1);
          const previous = lastVideoRef.current;
          lastVideoRef.current = { artifact: completedArtifact, ext: 'mp4' };
          retained = true;
          if (previous) void releaseVideoWhenIdle(previous.artifact).catch(() => undefined);
          flashSaved('mp4');
        },
        releaseExport: () => {
          finishExport(controller);
          exportFinished = true;
        },
        sendToAe: sendToAe ? () => sendVideoToAe(completedArtifact, 'mp4') : undefined,
      });
      if (!saved) return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error('MP4 export failed:', e);
        setExportError(errorMsg || 'MP4 エクスポートに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 8000);
      }
    } finally {
      if (!retained && artifact) await releaseVideoArtifact(artifact).catch(() => undefined);
      if (!exportFinished) finishExport(controller);
    }
  }

  async function handleExportZip() {
    const canvas = getOutputCanvas();
    const renderFrame = getOutputFrameRenderer();
    if (!canvas || exportJob) return;

    const controller = beginExport('zip');

    // キャンバスが描画されるまで待機
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    try {
      reportStage('rendering');
      const blob = await exportFrameZip({
        canvas,
        renderFrame,
        fps: animation.fps,
        duration: animation.duration,
        speed: animation.speed,
        easing: animation.easing,
        signal: controller.signal,
        onProgress: reportProgress,
      });
      reportStage('saving');
      const saved = await saveBlobToDir(blob, `${stem}_frames.zip`, dirHandleRef.current);
      if (!saved) return;
      reportProgress(1);
      flashSaved('zip');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        console.error('ZIP export failed:', e);
        setExportError('ZIPエクスポートに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 5000);
      }
    } finally {
      finishExport(controller);
    }
  }

  async function handleExportSlits() {
    console.log('[Export] handleExportSlits START');
    const canvas = getOutputCanvas();
    if (!canvas || exportJob) return;

    const controller = beginExport('slits');

    // キャンバスが描画されるまで待機
    console.log(`[Export] Canvas size: ${canvas.width}×${canvas.height}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });

    try {
      reportStage('rendering');
      const saved = await exportSlits({
        canvas,
        slitScan,
        stem,
        dirHandle: dirHandleRef.current,
        signal: controller.signal,
        onProgress: reportProgress,
        trimToSlit: slitTrimMode,
      });
      if (!saved) return;
      reportStage('saving');
      reportProgress(1);
      flashSaved('slits');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') { /* cancelled */ }
      else {
        console.error('Slit export failed:', e);
        setExportError('スリット書き出しに失敗しました。コンソールを確認してください。');
        setTimeout(() => setExportError(null), 5000);
      }
    } finally {
      finishExport(controller);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-k-text">{t('effect.export')}</h2>

      {/* ファイル名 */}
      <div className="space-y-1">
        <label className="text-xs text-deep">{t('export.fileName')}</label>
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
          <label className="text-xs text-deep">{t('export.destination')}</label>
          {dirName ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 px-2 py-1.5 bg-k-surface border border-panel-border border-panel rounded-none text-xs text-k-text truncate">
                📁 {dirName}
              </span>
              <button
                onClick={handleClearDirectory}
                className="px-2 py-1.5 bg-k-muted hover:bg-k-muted/70 rounded-none text-xs text-k-text/80"
                title={t('export.clearDestination')}
                aria-label={t('export.clearDestination')}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={handlePickDirectory}
              className="w-full px-3 py-1.5 bg-k-surface hover:bg-k-muted border border-panel-border border-panel border-dashed rounded-none text-xs text-deep hover:text-k-text transition-colors"
            >
              {t('export.chooseFolder')}
            </button>
          )}
          {!dirName && (
            <p className="text-xs text-tab-inactive">{t('export.downloadFallback')}</p>
          )}
        </div>
      )}

      {/* 静止画 */}
      <div className="space-y-2">
        <p className="text-xs text-deep">{t('export.stillImage')}</p>
        <button
          onClick={() => { const c = getOutputCanvas(); if (c) void downloadPNG(c, stem, dirHandleRef.current).then(saved => { if (saved) flashSaved('png'); }); }}
          className="w-full py-2 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-sm font-display font-semibold text-k-text uppercase tracking-wider"
        >
          {savedFormats['png'] ? `✓ ${t('export.saved')}` : t('export.savePng')}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { const c = getOutputCanvas(); if (c) void downloadJPG(c, 0.92, stem, dirHandleRef.current).then(saved => { if (saved) flashSaved('jpg'); }); }}
            className="flex-1 py-1.5 bg-k-muted hover:bg-k-muted/70 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text"
          >
            {savedFormats['jpg'] ? '✓' : 'JPG'}
          </button>
          <button
            onClick={() => { const c = getOutputCanvas(); if (c) void downloadWebP(c, 0.92, stem, dirHandleRef.current).then(saved => { if (saved) flashSaved('webp'); }); }}
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
                label="Slits"
                stage={exportStage}
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
        <p className="text-xs text-deep">{t('export.video')}</p>

        {!animation.enabled && (
          <p className="text-xs text-tab-inactive">{t('export.enableAnimation')}</p>
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

        {nativeFfmpegAvailable && (
          <div className="space-y-1.5 border border-panel-border/60 bg-k-bg/35 p-3">
            <label htmlFor="mp4-quality" className="block text-xs text-deep">MP4品質</label>
            <select
              id="mp4-quality"
              value={mp4Quality}
              onChange={(event) => setMp4Quality(event.target.value as Mp4QualityPreset)}
              className="w-full border border-panel-border bg-k-surface px-2 py-1.5 text-xs text-k-text focus:border-fire focus:outline-none"
            >
              {MP4_QUALITY_PRESETS.map(({ value, label, crf, description }) => (
                <option key={value} value={value}>{label} — {description}（CRF {crf}）</option>
              ))}
            </select>
            <p className="text-[10px] leading-relaxed text-tab-inactive">
              RGB色空間を維持したまま圧縮します。Highを既定値として、従来の完全無劣化出力より小さいファイルを生成します。
            </p>
          </div>
        )}

        {/* オフライン書き出し */}
        <div className="space-y-1.5">
          <p className="text-xs text-tab-inactive">{t('export.videoFile')}</p>

          <div className="relative min-h-[40px]">
            {/* MOV Section */}
            <div style={{ display: exportJob === 'mov' ? 'block' : 'none' }}>
              <ProgressBar label="MOV" stage={exportStage} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportMov}
                disabled={recording || !videoReady || !nativeVideoEncodeReady || videoExportBlockedByAeQueue}
                className="w-full py-1.5 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['mov'] ? `✓ ${t('export.saved')}` : t('export.exportMov')}
              </button>
            </div>
          </div>

          <div className="relative min-h-[40px]">
            <div style={{ display: exportJob === 'mp4' ? 'block' : 'none' }}>
              <ProgressBar label="MP4" stage={exportStage} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportMP4}
                disabled={recording || !videoReady || !nativeVideoEncodeReady || videoExportBlockedByAeQueue}
                className="w-full py-1.5 bg-fire hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['mp4'] ? `✓ ${t('export.saved')}` : t('export.exportMp4')}
              </button>
            </div>
          </div>

          <p className="text-xs text-tab-inactive">{t('export.imageSequence')}</p>

          <div className="relative min-h-[40px]">
            {/* ZIP Section */}
            <div style={{ display: exportJob === 'zip' ? 'block' : 'none' }}>
              <ProgressBar label="ZIP" stage={exportStage} progress={exportProgress} onCancel={handleCancel} />
            </div>
            <div style={{ display: exportJob === null ? 'block' : 'none' }}>
              <button
                onClick={handleExportZip}
                disabled={recording || !videoReady}
                className="w-full py-1.5 bg-fire/70 hover:bg-fire disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs font-display font-semibold text-k-text uppercase tracking-wider"
              >
                {savedFormats['zip'] ? `✓ ${t('export.saved')}` : t('export.exportZip')}
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
          <p className="text-xs text-deep">{t('export.aeConnectionTitle')}</p>
          <span className="px-1.5 py-0.5 border border-fire/40 bg-fire/10 text-[9px] font-display font-semibold uppercase tracking-wider text-fire">
            Beta
          </span>
        </div>

        {/* ステータス表示 */}
        {aeStatus === 'sending' && (
          <p className="text-xs text-yellow-400">{t('export.aeSending')}</p>
        )}
        {aeStatus === 'ok' && (
          <p className="text-xs text-green-400">✓ {t('export.aeSent')}</p>
        )}
        {aeStatus === 'not-running' && (
          <p className="text-xs text-red-400">{t('export.aeNotRunning')}</p>
        )}
        {aeStatus === 'save-failed' && (
          <p className="text-xs text-red-400">{t('export.aeSaveFailed')}</p>
        )}
        {aeStatus === 'jsx-failed' && (
          <p className="text-xs text-red-400">{t('export.aeJsxFailed')}</p>
        )}
        {aeStatus === 'composition-unavailable' && (
          <p className="text-xs text-red-400">{t('export.aeCompositionUnavailable')}</p>
        )}
        {aeStatus === 'unsupported' && (
          <p className="text-xs text-red-400">{t('export.aeUnsupported')}</p>
        )}
        {aeStatus === 'error' && (
          <p className="text-xs text-red-400">{t('export.aeError')}</p>
        )}

        {bridgeAvailable ? (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-tab-inactive">{t('export.aeSaveDirectory')}</p>
              {aeSaveDirStatus.mode === 'custom' ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-2 py-1.5 bg-k-surface border border-panel-border border-panel rounded-none text-xs text-k-text truncate">
                    {aeSaveDirStatus.name ?? aeSaveDirStatus.path}
                  </span>
                  <button
                    type="button"
                    onClick={handleAeClearDirectory}
                    className="px-2 py-1.5 bg-k-muted hover:bg-k-muted/70 rounded-none text-xs text-k-text/80"
                    title={t('export.aeClearDirectory')}
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
                  {t('export.aeChooseDirectory')}
                </button>
              )}
              <p className="text-xs text-tab-inactive">
                {t('export.aeSaveDirectoryDescription')}
              </p>
            </div>

            {/* 接続テスト */}
            <button
              onClick={handleAePing}
              disabled={aeStatus === 'sending'}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              {t('export.aePing')}
            </button>

            {/* 画像送信 */}
            <button
              onClick={handleAeSendImage}
              disabled={aeStatus === 'sending'}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              {t('export.aeSendImage')}
            </button>

            {/* 動画エクスポート後に自動送信するトグル */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle size="sm" checked={sendToAe} onChange={setSendToAe} />
              <span className="text-xs text-k-text/80">{t('export.aeAutoSend')}</span>
            </label>

            {/* 手動送信（前回エクスポート分） */}
            <button
              onClick={handleAeSendVideo}
              disabled={aeStatus === 'sending' || !lastVideoRef.current}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
              title={lastVideoRef.current ? undefined : '先に動画をエクスポートしてください'}
            >
              {t('export.aeSendVideo')}
              {lastVideoRef.current && (
                <span className="ml-1 text-tab-inactive">(.{lastVideoRef.current.ext})</span>
              )}
            </button>
          </>
        ) : (
          <div className="rounded-none bg-k-bg border border-panel-border border-panel px-3 py-2 space-y-1">
            <p className="text-xs text-yellow-400">
              {t(aeRuntime === 'tauri-native' ? 'export.aeUnavailable' : 'export.aeDevelopment')}
            </p>
            <p className="text-xs text-deep">
              {t(aeRuntime === 'tauri-native' ? 'export.aeUnavailableDescription' : 'export.aeDevelopmentDescription')}
            </p>
            <button
              type="button"
              onClick={handleAeRefresh}
              disabled={bridgeChecking}
              className="w-full py-1.5 bg-k-surface hover:bg-k-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-none text-xs text-k-text/80"
            >
              {bridgeChecking ? t('common.checking') : t('export.aePing')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, stage, progress, onCancel }: { label: string; stage: ExportStage; progress: number; onCancel?: () => void }) {
  const percent = exportProgressPercent(stage, progress);
  const displayProgress = exportDisplayProgress(stage, progress);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-deep">{label} · {exportStageLabel(stage)}{percent}</span>
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
          className={`bg-fire h-1.5 rounded-full transition-all ${stage === 'encoding' ? 'animate-pulse' : ''}`}
          style={{ width: `${displayProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
