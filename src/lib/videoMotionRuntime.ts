import type { VideoMotionConfig } from '../types/videoMotion';
import {
  createVideoMotionSource,
  resetVideoMotionSource,
  updateVideoMotionField,
  type VideoMotionSource,
} from './videoMotionSource';

type VideoMotionRuntime = {
  video: HTMLVideoElement | null;
  source: VideoMotionSource;
  feedbackResetVersion: number;
  timelinePlaybackActive: boolean;
  lastTimelineTime: number | null;
  lastExportVideoTime: number | null;
  exportRestore: (() => void) | null;
};

const runtime: VideoMotionRuntime = {
  video: null,
  source: createVideoMotionSource(),
  feedbackResetVersion: 0,
  timelinePlaybackActive: false,
  lastTimelineTime: null,
  lastExportVideoTime: null,
  exportRestore: null,
};

const VIDEO_SEEK_EPSILON = 1 / 240;
const TIMELINE_JUMP_THRESHOLD = 0.08;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function videoMotionFrameEvent(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kgg:video-motion-frame'));
}

function bumpFeedbackReset(): void {
  runtime.feedbackResetVersion += 1;
}

export function setVideoMotionVideo(video: HTMLVideoElement | null): void {
  runtime.video = video;
  runtime.source = createVideoMotionSource();
  runtime.timelinePlaybackActive = false;
  runtime.lastTimelineTime = null;
  runtime.lastExportVideoTime = null;
  bumpFeedbackReset();
}

export function getVideoMotionRuntime(): Readonly<VideoMotionRuntime> {
  return runtime;
}

/** Maps the timeline's normalized time to the loaded video's absolute time. */
export function mapVideoMotionTimelineTime(normalizedTime: number, videoDuration: number): number {
  if (!Number.isFinite(videoDuration) || videoDuration <= 0) return 0;
  return clamp01(normalizedTime) * videoDuration;
}

function hasVideoMetadata(video: HTMLVideoElement): boolean {
  return Number.isFinite(video.duration)
    && video.duration > 0
    && video.readyState >= HTMLMediaElement.HAVE_METADATA;
}

function resetForTimelineJump(): void {
  resetVideoMotionSource(runtime.source);
  bumpFeedbackReset();
}

function requestPreviewSeek(
  video: HTMLVideoElement,
  targetTime: number,
  config: Pick<VideoMotionConfig, 'fieldSmoothing' | 'motionDamping'>,
): void {
  if (video.seeking) return;
  resetForTimelineJump();
  const handleSeeked = () => {
    video.removeEventListener('seeked', handleSeeked);
    updateVideoMotionField(runtime.source, video, config);
    videoMotionFrameEvent();
  };
  video.addEventListener('seeked', handleSeeked);
  try {
    video.currentTime = targetTime;
  } catch {
    video.removeEventListener('seeked', handleSeeked);
  }
}

export type VideoMotionTimelineSync = {
  targetTime: number;
  currentTime: number;
  hasFrame: boolean;
  waitingForSeek: boolean;
};

/**
 * Keeps preview rendering on the same clock as the composition timeline.
 * The function is intentionally synchronous: it updates an already-decoded
 * frame when possible and schedules a render after an asynchronous seek.
 */
export function syncVideoMotionToTimeline(
  normalizedTime: number,
  timelineDuration: number,
  config: Pick<VideoMotionConfig, 'fieldSmoothing' | 'motionDamping'>,
  options: { timelinePlaying?: boolean; timelineControlled?: boolean } = {},
): VideoMotionTimelineSync {
  const video = runtime.video;
  if (!video || !hasVideoMetadata(video)) {
    return { targetTime: 0, currentTime: video?.currentTime ?? 0, hasFrame: false, waitingForSeek: false };
  }

  const normalized = clamp01(normalizedTime);
  const targetTime = mapVideoMotionTimelineTime(normalized, video.duration);
  const previousTimelineTime = runtime.lastTimelineTime;
  runtime.lastTimelineTime = normalized;
  if (previousTimelineTime != null && normalized + TIMELINE_JUMP_THRESHOLD < previousTimelineTime) {
    resetForTimelineJump();
  }

  const timelinePlaying = options.timelinePlaying === true;
  const timelineControlled = options.timelineControlled === true;
  if (timelinePlaying) {
    runtime.timelinePlaybackActive = true;
    const safeDuration = Number.isFinite(timelineDuration) && timelineDuration > 0 ? timelineDuration : 1;
    const playbackRate = Math.max(0.25, Math.min(4, video.duration / safeDuration));
    if (Math.abs(video.playbackRate - playbackRate) > 0.01) video.playbackRate = playbackRate;
    if (video.paused && !video.seeking) {
      if (Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON) {
        requestPreviewSeek(video, targetTime, config);
        void video.play().catch(() => undefined);
        return { targetTime, currentTime: video.currentTime, hasFrame: runtime.source.field.hasFrame, waitingForSeek: true };
      }
      void video.play().catch(() => undefined);
    } else if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.2) {
      requestPreviewSeek(video, targetTime, config);
    }
  } else if (timelineControlled) {
    runtime.timelinePlaybackActive = false;
    video.pause();
    if (!video.seeking && Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON) {
      requestPreviewSeek(video, targetTime, config);
      return { targetTime, currentTime: video.currentTime, hasFrame: runtime.source.field.hasFrame, waitingForSeek: true };
    }
  } else if (runtime.timelinePlaybackActive) {
    runtime.timelinePlaybackActive = false;
    video.pause();
  } else if (video.paused && !video.seeking && Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON) {
    requestPreviewSeek(video, targetTime, config);
    return { targetTime, currentTime: video.currentTime, hasFrame: runtime.source.field.hasFrame, waitingForSeek: true };
  }

  const updated = updateVideoMotionField(runtime.source, video, config);
  return {
    targetTime,
    currentTime: video.currentTime,
    hasFrame: runtime.source.field.hasFrame || updated,
    waitingForSeek: video.seeking,
  };
}

function waitForSeek(video: HTMLVideoElement, targetTime: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Export cancelled', 'AbortError'));
  return new Promise<void>((resolve, reject) => {
    let timeoutId: number | null = null;
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Video seek failed while preparing motion frame'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Export cancelled', 'AbortError'));
    };
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
    timeoutId = window.setTimeout(() => {
      cleanup();
      if (Math.abs(video.currentTime - targetTime) <= 0.05) resolve();
      else reject(new Error('Video seek timed out while preparing motion frame'));
    }, 4000);
    try {
      video.currentTime = targetTime;
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export async function prepareVideoMotionExportFrame(
  normalizedTime: number,
  _timelineDuration: number,
  config: Pick<VideoMotionConfig, 'fieldSmoothing' | 'motionDamping'>,
  signal?: AbortSignal,
): Promise<boolean> {
  const video = runtime.video;
  if (!video || !hasVideoMetadata(video)) return false;
  const targetTime = mapVideoMotionTimelineTime(normalizedTime, video.duration);
  const previousExportVideoTime = runtime.lastExportVideoTime;
  if (previousExportVideoTime != null && targetTime + VIDEO_SEEK_EPSILON < previousExportVideoTime) {
    resetForTimelineJump();
  }
  runtime.lastExportVideoTime = targetTime;
  runtime.lastTimelineTime = clamp01(normalizedTime);
  video.pause();
  const needsSeek = Math.abs(video.currentTime - targetTime) > VIDEO_SEEK_EPSILON || video.seeking;
  if (needsSeek) {
    if (video.seeking) await waitForSeek(video, targetTime, signal);
    else {
      if (previousExportVideoTime == null) resetVideoMotionSource(runtime.source);
      await waitForSeek(video, targetTime, signal);
    }
  }
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
  updateVideoMotionField(runtime.source, video, config);
  return runtime.source.field.hasFrame;
}

/** Pauses the independent video clock for deterministic frame export. */
export function beginVideoMotionExport(): () => void {
  const video = runtime.video;
  const wasPlaying = Boolean(video && !video.paused);
  const previousRate = video?.playbackRate ?? 1;
  runtime.exportRestore?.();
  runtime.lastExportVideoTime = null;
  runtime.timelinePlaybackActive = false;
  resetForTimelineJump();
  video?.pause();
  runtime.exportRestore = () => {
    runtime.exportRestore = null;
    runtime.lastExportVideoTime = null;
    if (video) {
      video.playbackRate = previousRate;
      if (wasPlaying) void video.play().catch(() => undefined);
    }
  };
  return runtime.exportRestore;
}
