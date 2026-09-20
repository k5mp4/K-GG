import { useEffect, useRef, useState } from 'react';
import { applicationCommands } from '../application/commands';
import { getTimelineTime, subscribeTimelineTime } from '../lib/timelineClock';
import { getVideoMotionRuntime, mapVideoMotionTimelineTime, setVideoMotionVideo } from '../lib/videoMotionRuntime';
import {
  drawVideoMotionFieldPreview,
  getVideoMotionFieldStats,
  updateVideoMotionField,
  type VideoMotionFieldStats,
} from '../lib/videoMotionSource';
import { VIDEO_MOTION_DEFAULTS, type VideoMotionConfig } from '../types/videoMotion';
import { useGradientStore } from '../store/gradientStore';
import { SliderField } from './SliderField';

type VideoMotionNumericKey = Exclude<keyof VideoMotionConfig, 'enabled' | 'mode'>;
type VideoStatus = 'No video selected' | 'Loading metadata' | 'Ready' | 'Playing' | 'Paused' | 'Waiting for frame' | 'Playback error';
type ProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback' | 'unknown';

function emitVideoMotionFrame(): void {
  window.dispatchEvent(new CustomEvent('kgg:video-motion-frame'));
}

export function VideoMotionPanel() {
  const videoMotion = useGradientStore(state => state.videoMotion);
  const animationEnabled = useGradientStore(state => state.animation.enabled);
  const { setVideoMotion } = applicationCommands;
  const runtime = getVideoMotionRuntime();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fileName, setFileName] = useState('No video selected');
  const [hasVideo, setHasVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('No video selected');
  const [videoTime, setVideoTime] = useState(0);
  const [fieldStats, setFieldStats] = useState<VideoMotionFieldStats>(() => getVideoMotionFieldStats(runtime.source));
  const [programStatus, setProgramStatus] = useState<ProgramStatus>('unknown');
  const [showDebug, setShowDebug] = useState(true);
  // AnimationLoop publishes its authoritative normalized time through the
  // timeline clock every frame. The Zustand value is a persisted/editing
  // fallback and is intentionally not updated at frame rate.
  const [timelineTime, setTimelineTimeState] = useState(() => getTimelineTime(useGradientStore.getState().currentTime));
  const defaults = VIDEO_MOTION_DEFAULTS;

  useEffect(() => {
    const updateTimelineTime = () => {
      setTimelineTimeState(getTimelineTime(useGradientStore.getState().currentTime));
    };
    updateTimelineTime();
    return subscribeTimelineTime(updateTimelineTime);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoadedMetadata = () => setVideoStatus('Ready');
    const handleCanPlay = () => setVideoStatus(isPlaying ? 'Playing' : 'Ready');
    const handlePlaying = () => {
      setVideoStatus('Playing');
      setIsPlaying(true);
    };
    const handlePause = () => {
      setVideoStatus(video.readyState >= HTMLMediaElement.HAVE_METADATA ? 'Paused' : 'Waiting for frame');
      setIsPlaying(false);
    };
    const handleWaiting = () => setVideoStatus('Waiting for frame');
    const handleError = () => setVideoStatus('Playback error');
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
    };
  }, [isPlaying]);

  useEffect(() => {
    const handleProgramState = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string; state?: ProgramStatus }>).detail;
      if (detail?.key === 'videoMotion' && detail.state) setProgramStatus(detail.state);
    };
    window.addEventListener('kgg:webgl-lazy-program-state', handleProgramState);
    return () => window.removeEventListener('kgg:webgl-lazy-program-state', handleProgramState);
  }, []);

  useEffect(() => () => {
    const video = videoRef.current;
    video?.pause();
    if (video) {
      video.removeAttribute('src');
      video.load();
    }
    setVideoMotionVideo(null);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    if (!videoMotion.enabled) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [videoMotion.enabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoMotion.enabled || !isPlaying) return;
    let frameHandle = 0;
    let lastDebugUpdate = 0;
    const tick = () => {
      // AnimationLoop is the single field/render owner while the composition
      // timeline drives the video. Keep this RAF only for low-rate debug
      // sampling in that case; otherwise a decoded frame would enqueue a
      // duplicate full-canvas render.
      const timelineOwnsPlayback = animationEnabled && runtime.timelinePlaybackActive;
      if (!timelineOwnsPlayback && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (updateVideoMotionField(runtime.source, video, videoMotion)) emitVideoMotionFrame();
      } else if (!timelineOwnsPlayback && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setVideoStatus('Waiting for frame');
      }
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastDebugUpdate >= 100) {
        setFieldStats(getVideoMotionFieldStats(runtime.source));
        setVideoTime(video.currentTime);
        if (debugCanvasRef.current) drawVideoMotionFieldPreview(debugCanvasRef.current, runtime.source);
        lastDebugUpdate = now;
      }
      frameHandle = requestAnimationFrame(tick);
    };
    frameHandle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameHandle);
  }, [animationEnabled, isPlaying, runtime.source, runtime, videoMotion]);

  useEffect(() => {
    const handleMotionFrame = () => {
      setFieldStats(getVideoMotionFieldStats(runtime.source));
      setVideoTime(videoRef.current?.currentTime ?? 0);
      if (debugCanvasRef.current) drawVideoMotionFieldPreview(debugCanvasRef.current, runtime.source);
    };
    window.addEventListener('kgg:video-motion-frame', handleMotionFrame);
    return () => window.removeEventListener('kgg:video-motion-frame', handleMotionFrame);
  }, [runtime.source]);

  useEffect(() => {
    setFieldStats(getVideoMotionFieldStats(runtime.source));
    if (debugCanvasRef.current) drawVideoMotionFieldPreview(debugCanvasRef.current, runtime.source);
  }, [runtime.source, showDebug]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    video.preload = 'auto';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = url;
    video.load();
    setVideoMotionVideo(video);
    setFileName(file.name);
    setHasVideo(true);
    setIsPlaying(false);
    setVideoStatus('Loading metadata');
    setFieldStats(getVideoMotionFieldStats(runtime.source));
    setVideoMotion({ enabled: true });
  };

  const handlePlayToggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await video.play();
      setIsPlaying(true);
      setVideoStatus('Playing');
    } catch {
      setIsPlaying(false);
      setVideoStatus('Playback error');
    }
  };

  const field = (label: string, key: VideoMotionNumericKey, min: number, max: number, step: number, format = (value: number) => value.toFixed(2)) => (
    <SliderField
      label={label}
      value={videoMotion[key]}
      onChange={(value) => setVideoMotion({ [key]: value } as Partial<VideoMotionConfig>)}
      min={min}
      max={max}
      step={step}
      defaultValue={defaults[key]}
      format={format}
    />
  );

  return (
    <div className="space-y-4" data-video-motion-panel>
      <div className="border border-cyan-200/20 bg-cyan-300/[0.04] px-3 py-2 text-[10px] leading-relaxed text-cream/70">
        Motion Feedback advects prior frames with the decoded motion field, preserves current animation, and constrains color to the active Gradient Ramp.
      </div>

      <div className="space-y-2 border border-cream/15 bg-black/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[10px] text-cream/70" title={fileName}>{fileName}</span>
          <label className="shrink-0 cursor-pointer border border-cyan-200/35 bg-cyan-300/10 px-2 py-1 text-[9px] font-display uppercase tracking-wider text-cyan-100 hover:border-cyan-100">
            Choose Video
            <input className="sr-only" type="file" accept="video/*" onChange={handleFileChange} />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasVideo}
            onClick={() => void handlePlayToggle()}
            className="border border-cream/25 bg-k-surface px-3 py-1 text-[9px] font-display uppercase tracking-wider text-cream transition-colors hover:border-fire disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span className="text-[9px] uppercase tracking-wider text-tab-inactive">{videoStatus}</span>
        </div>
      </div>

      <div className="border border-cream/15 bg-black/10 p-3" data-video-motion-debug>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-display uppercase tracking-wider text-cyan-100">Motion Debug</span>
          <button
            type="button"
            className="text-[9px] uppercase tracking-wider text-tab-inactive hover:text-cream"
            onClick={() => setShowDebug(value => !value)}
          >
            {showDebug ? 'Hide' : 'Show'}
          </button>
        </div>
        {showDebug && (
          <>
            <canvas
              ref={debugCanvasRef}
              width={256}
              height={144}
              aria-label="Video motion field preview"
              className="mt-2 block h-auto w-full border border-cyan-200/20 bg-[#101820]"
            />
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] uppercase tracking-wider text-tab-inactive">
              <span>Source <b className="text-cream/80">{videoStatus}</b></span>
              <span>Shader <b className="text-cream/80">{programStatus}</b></span>
              <span>Field <b className="text-cream/80">{fieldStats.hasFrame ? 'READY' : 'WAITING'}</b></span>
              <span>Samples <b className="text-cream/80">{runtime.source.frameCount}</b></span>
              <span>Mean <b className="text-cream/80">{fieldStats.meanMagnitude.toFixed(3)}</b></span>
              <span>Peak <b className="text-cream/80">{fieldStats.maxMagnitude.toFixed(3)}</b></span>
              <span>Active <b className="text-cream/80">{Math.round(fieldStats.activeRatio * 100)}%</b></span>
              <span>Direction <b className="text-cream/80">{fieldStats.meanX.toFixed(2)}, {fieldStats.meanY.toFixed(2)}</b></span>
              <span>Change <b className="text-cream/80">{fieldStats.meanChange.toFixed(3)} / {fieldStats.maxChange.toFixed(3)}</b></span>
              <span>Video time <b className="text-cream/80">{videoTime.toFixed(2)}s / {Number.isFinite(videoRef.current?.duration) ? videoRef.current?.duration.toFixed(2) : '--'}s</b></span>
              <span>Mapped <b className="text-cream/80">{mapVideoMotionTimelineTime(timelineTime, videoRef.current?.duration ?? 0).toFixed(2)}s</b></span>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-tab-inactive">
              Mean/Peak/Active stay near zero when the decoded frames do not change. Colored cells and arrows show the motion used to advect feedback.
            </p>
          </>
        )}
      </div>

      <div className="border border-cream/15 bg-black/10 px-3 py-2">
        <span className="text-[10px] font-display uppercase tracking-wider text-cyan-100">Motion Feedback</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {field('Effect Strength', 'effectStrength', 0, 1, 0.01, value => `${Math.round(value * 100)}%`)}
        {field('Blend Amount', 'blendAmount', 0, 1, 0.01, value => `${Math.round(value * 100)}%`)}
      </div>

      <div className="space-y-2.5 border-t border-cream/15 pt-3">
        {field('Feedback Amount', 'feedbackAmount', 0, 1, 0.01, value => `${Math.round(value * 100)}%`)}
        {field('Decay', 'decay', 0, 0.99, 0.01, value => `${Math.round(value * 100)}%`)}
        {field('Smear Length', 'smearLength', 0, 2, 0.01)}
        {field('Stabilization', 'stabilization', 0, 0.95, 0.01, value => `${Math.round(value * 100)}%`)}
        {field('Motion Damping', 'motionDamping', 0, 0.95, 0.01, value => `${Math.round(value * 100)}%`)}
        {field('Field Smoothing', 'fieldSmoothing', 0, 0.95, 0.01, value => `${Math.round(value * 100)}%`)}
      </div>
      <video ref={videoRef} className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden="true" tabIndex={-1} playsInline muted />
    </div>
  );
}
