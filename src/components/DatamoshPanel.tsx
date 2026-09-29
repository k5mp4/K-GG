import { useEffect, useRef, useState, type ReactNode } from 'react';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { getTimelineTime, subscribeTimelineTime } from '../lib/timelineClock';
import { getVideoMotionRuntime, mapVideoMotionTimelineTime, setVideoMotionVideo } from '../lib/videoMotionRuntime';
import {
  drawVideoMotionFieldPreview,
  getVideoMotionFieldStats,
  updateVideoMotionField,
  type VideoMotionFieldStats,
} from '../lib/videoMotionSource';
import { useGradientStore } from '../store/gradientStore';
import {
  DATAMOSH_DEFAULTS,
  DATAMOSH_RANGES,
  getDatamoshVideoFieldOptions,
  type DatamoshConfig,
  type DatamoshMixMode,
  type DatamoshMotionSource,
} from '../types/datamosh';
import { CustomSelect } from './CustomSelect';
import { SliderField } from './SliderField';
import { Toggle } from './Toggle';

type DatamoshNumericKey = keyof typeof DATAMOSH_RANGES;
type VideoStatus = 'No video selected' | 'Loading metadata' | 'Ready' | 'Playing' | 'Paused' | 'Waiting for frame' | 'Playback error';

const percent = (value: number) => `${Math.round(value * 100)}%`;

function emitVideoMotionFrame(): void {
  window.dispatchEvent(new CustomEvent('kgg:video-motion-frame'));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5 border border-cream/15 bg-black/10 p-3">
      <span className="block text-[10px] font-display uppercase tracking-wider text-cyan-100">{title}</span>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-cream/75">{label}</span>
      <Toggle variant="switch" size="xs" checked={checked} ariaLabel={label} onChange={onChange} />
    </div>
  );
}

/**
 * Datamosh Effect Stack layer settings. The panel stays mounted while another
 * layer is selected so a loaded video keeps its element and motion field.
 */
export function DatamoshPanel() {
  const { t } = useLanguage();
  const datamosh = useGradientStore(state => state.datamosh);
  const animationEnabled = useGradientStore(state => state.animation.enabled);
  const { setDatamosh } = applicationCommands;
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
  const [showDebug, setShowDebug] = useState(false);
  // AnimationLoop publishes its authoritative normalized time through the
  // timeline clock every frame; the store value is only a fallback.
  const [timelineTime, setTimelineTimeState] = useState(() => getTimelineTime(useGradientStore.getState().currentTime));
  const videoSourceActive = datamosh.enabled && datamosh.motionSource === 'video';

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
    if (!videoSourceActive) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [videoSourceActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSourceActive || !isPlaying) return;
    const fieldOptions = getDatamoshVideoFieldOptions(datamosh);
    let frameHandle = 0;
    let lastDebugUpdate = 0;
    const tick = () => {
      // AnimationLoop owns field updates and rendering while the composition
      // timeline drives the video; this RAF then only samples debug stats.
      const timelineOwnsPlayback = animationEnabled && runtime.timelinePlaybackActive;
      if (!timelineOwnsPlayback && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        if (updateVideoMotionField(runtime.source, video, fieldOptions)) emitVideoMotionFrame();
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
  }, [animationEnabled, isPlaying, runtime, datamosh, videoSourceActive]);

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
    setDatamosh({ enabled: true, motionSource: 'video' });
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

  const field = (
    label: string,
    key: DatamoshNumericKey,
    format: (value: number) => string = value => value.toFixed(2),
    disabled = false,
  ) => {
    const range = DATAMOSH_RANGES[key];
    return (
      <SliderField
        label={label}
        value={datamosh[key]}
        onChange={(value) => setDatamosh({ [key]: value } as Partial<DatamoshConfig>)}
        min={range.min}
        max={range.max}
        step={range.step}
        defaultValue={DATAMOSH_DEFAULTS[key]}
        format={format}
        disabled={disabled}
      />
    );
  };

  return (
    <div className="space-y-3 text-[11px]" data-datamosh-panel>
      <div className="border border-cyan-200/25 bg-cyan-300/[0.04] p-3">
        <span className="block font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
          {t('sandbox.datamoshTitle')}
        </span>
        <p className="mt-2 text-[10px] leading-relaxed text-cream/65">
          {t('sandbox.datamoshHint')}
        </p>
      </div>

      <Section title="Motion Field">
        <CustomSelect
          label="Source"
          value={datamosh.motionSource}
          localizeOptions={false}
          options={[
            { value: 'animation', label: 'Animation Flow' },
            { value: 'procedural', label: 'Procedural (Curl Noise)' },
            { value: 'video', label: 'Video Motion' },
            { value: 'pixelStretch', label: 'Pixel Stretch' },
          ]}
          onChange={(value) => setDatamosh({ motionSource: value as DatamoshMotionSource })}
        />
        {datamosh.motionSource === 'animation' ? (
          <p className="text-[9px] leading-relaxed text-tab-inactive" data-datamosh-animation-source>
            {t('effect.datamoshAnimationHint')}
          </p>
        ) : datamosh.motionSource === 'procedural' ? (
          <>
            {field('Motion Scale', 'motionScale')}
            {field('Motion Speed', 'motionSpeed')}
          </>
        ) : datamosh.motionSource === 'pixelStretch' ? (
          <div className="space-y-2.5" data-datamosh-pixel-stretch-source>
            <p className="text-[9px] leading-relaxed text-tab-inactive">
              {t('effect.datamoshPixelStretchHint')}
            </p>
            {field('Angle', 'pixelStretchAngle', value => `${Math.round(value)}°`)}
            {field('Length', 'pixelStretchLength', value => `${Math.round(value)}px`)}
            {field('Threshold', 'pixelStretchThreshold', percent)}
            {field('Length Variance', 'pixelStretchVariance', percent)}
          </div>
        ) : (
          <div className="space-y-2.5" data-datamosh-video-source>
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
            {field('Field Smoothing', 'videoFieldSmoothing', percent)}
            {field('Motion Damping', 'videoMotionDamping', percent)}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-display uppercase tracking-wider text-cream/70">Motion Debug</span>
              <button
                type="button"
                className="text-[9px] uppercase tracking-wider text-tab-inactive hover:text-cream"
                onClick={() => setShowDebug(value => !value)}
              >
                {showDebug ? 'Hide' : 'Show'}
              </button>
            </div>
            {showDebug && (
              <div data-video-motion-debug>
                <canvas
                  ref={debugCanvasRef}
                  width={256}
                  height={144}
                  aria-label="Video motion field preview"
                  className="block h-auto w-full border border-cyan-200/20 bg-[#101820]"
                />
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] uppercase tracking-wider text-tab-inactive">
                  <span>Field <b className="text-cream/80">{fieldStats.hasFrame ? 'READY' : 'WAITING'}</b></span>
                  <span>Samples <b className="text-cream/80">{runtime.source.frameCount}</b></span>
                  <span>Mean <b className="text-cream/80">{fieldStats.meanMagnitude.toFixed(3)}</b></span>
                  <span>Peak <b className="text-cream/80">{fieldStats.maxMagnitude.toFixed(3)}</b></span>
                  <span>Active <b className="text-cream/80">{Math.round(fieldStats.activeRatio * 100)}%</b></span>
                  <span>Direction <b className="text-cream/80">{fieldStats.meanX.toFixed(2)}, {fieldStats.meanY.toFixed(2)}</b></span>
                  <span>Video time <b className="text-cream/80">{videoTime.toFixed(2)}s</b></span>
                  <span>Mapped <b className="text-cream/80">{mapVideoMotionTimelineTime(timelineTime, videoRef.current?.duration ?? 0).toFixed(2)}s</b></span>
                </div>
              </div>
            )}
          </div>
        )}
        {field('Block Size', 'blockSize', value => `${Math.round(value)}px`)}
        {field('Block Lock', 'blockLock', percent)}
        {field('Block Variance', 'blockVariance', percent)}
      </Section>

      <Section title="History">
        {field('Strength', 'strength')}
        {field('Luma Stretch', 'lumaStretch')}
        {field('Saturation Stretch', 'saturationStretch')}
        {field('Refresh', 'refresh', percent)}
        {field('Feedback', 'feedback', percent)}
        <ToggleRow label="Freeze" checked={datamosh.freeze} onChange={(freeze) => setDatamosh({ freeze })} />
      </Section>

      <Section title="Corruption">
        {field('Glitch Amount', 'glitchAmount', percent)}
        {field('Glitch Threshold', 'glitchThreshold', percent)}
        {field('Neighbor Mix', 'neighborMix', percent)}
        {field('Jitter', 'jitter', percent)}
      </Section>

      <Section title="Look">
        <CustomSelect
          label="Mix Mode"
          value={datamosh.mixMode}
          localizeOptions={false}
          options={[
            { value: 'mix', label: 'Mix' },
            { value: 'lighten', label: 'Lighten' },
            { value: 'difference', label: 'Difference' },
            { value: 'rampLock', label: 'Ramp Lock' },
          ]}
          onChange={(value) => setDatamosh({ mixMode: value as DatamoshMixMode })}
        />
        <ToggleRow label="Color Drift" checked={datamosh.useColorDrift} onChange={(useColorDrift) => setDatamosh({ useColorDrift })} />
      </Section>

      <p className="px-1 text-[9px] leading-relaxed text-cream/55">
        {t('sandbox.datamoshPlaybackHint')}
      </p>
      <video ref={videoRef} className="pointer-events-none absolute h-px w-px opacity-0" aria-hidden="true" tabIndex={-1} playsInline muted />
    </div>
  );
}
