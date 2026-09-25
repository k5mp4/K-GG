import type { SplashMediaSource, SplashVisualAdapter, SplashVisualDefinition } from './splashVisual';

type MediaDefinition = Extract<SplashVisualDefinition, { kind: 'media' }>;

export type SplashMediaElementKind = 'image' | 'video';

export type SplashMediaCandidate = {
  element: SplashMediaElementKind;
  src: string;
  type?: string;
  /** Shown as a still: videos stay paused on their first frame. */
  still: boolean;
};

const VIDEO_EXTENSIONS = new Set(['mp4', 'm4v', 'mov', 'webm', 'ogv']);

/** Decides between `<img>` and `<video>` from the MIME type, then the file extension. */
export function inferSplashMediaElement(source: SplashMediaSource): SplashMediaElementKind {
  const mime = source.type?.trim().toLowerCase();
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('image/')) return 'image';
  const path = source.src.split(/[?#]/, 1)[0];
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'image';
}

/**
 * Orders the files to try. A video whose declared codec the WebView reports
 * as unplayable is skipped without a download. Under reduced motion only
 * stills are allowed: the poster, or a video paused on its first frame
 * (animated images cannot be paused). The poster is always the last resort.
 */
export function planSplashMedia(
  definition: MediaDefinition,
  options: { reducedMotion: boolean; canPlayVideoType: (type: string) => boolean },
): SplashMediaCandidate[] {
  const poster: SplashMediaCandidate[] = definition.poster
    ? [{ element: 'image', src: definition.poster, still: true }]
    : [];
  if (options.reducedMotion && poster.length > 0) return poster;

  const candidates: SplashMediaCandidate[] = [];
  for (const source of definition.sources) {
    const element = inferSplashMediaElement(source);
    if (element === 'video' && source.type && !options.canPlayVideoType(source.type)) continue;
    if (options.reducedMotion && element === 'image') continue;
    candidates.push({ element, src: source.src, type: source.type, still: options.reducedMotion });
  }
  return [...candidates, ...poster];
}

function abortError(): Error {
  return new DOMException('Splash media mount was aborted', 'AbortError');
}

function releaseVideo(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute('src');
  // Drops the decoder and any buffered frames.
  video.load();
}

async function loadImage(candidate: SplashMediaCandidate, signal: AbortSignal): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';
  image.alt = '';
  image.src = candidate.src;
  // Rejects for a missing file or a format the WebView cannot decode.
  await image.decode();
  if (signal.aborted) throw abortError();
  return image;
}

function loadVideo(candidate: SplashMediaCandidate, signal: AbortSignal): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  // Muted inline playback is what WebView2 and WKWebView allow to autoplay.
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = !candidate.still;
  video.preload = 'auto';
  video.disablePictureInPicture = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
    };
    const fail = (error: Error) => {
      cleanup();
      releaseVideo(video);
      reject(error);
    };
    // The first frame is decoded, so the swap from the poster shows no blank frame.
    const onLoaded = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => fail(new Error(`Cannot play splash video ${candidate.src}`));
    const onAbort = () => fail(abortError());

    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('error', onError);
    signal.addEventListener('abort', onAbort);
    if (candidate.type) {
      const source = document.createElement('source');
      source.src = candidate.src;
      source.type = candidate.type;
      // A <source> failure is reported on the element itself, not on <video>.
      source.addEventListener('error', onError);
      video.append(source);
    } else {
      video.src = candidate.src;
    }
    video.load();
  });
}

/**
 * Plays a bundled image or video file. Each candidate is tried in order; if
 * none decodes, the adapter rejects and the overlay shows the static poster.
 */
export const mountMediaSplashVisual: SplashVisualAdapter<MediaDefinition> = async (host, definition, context) => {
  const probe = document.createElement('video');
  const candidates = planSplashMedia(definition, {
    reducedMotion: context.reducedMotion,
    canPlayVideoType: type => probe.canPlayType(type) !== '',
  });

  const failures: string[] = [];
  for (const candidate of candidates) {
    if (context.signal.aborted) throw abortError();
    let element: HTMLImageElement | HTMLVideoElement;
    try {
      element = candidate.element === 'video'
        ? await loadVideo(candidate, context.signal)
        : await loadImage(candidate, context.signal);
    } catch (error) {
      if (context.signal.aborted) throw abortError();
      failures.push(`${candidate.src}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    element.className = 'kgg-splash__media';
    element.dataset.fit = definition.fit ?? 'contain';
    element.setAttribute('aria-hidden', 'true');
    element.draggable = false;
    host.append(element);

    const video = element instanceof HTMLVideoElement ? element : null;
    // A blocked autoplay still leaves the first frame on screen.
    if (video && !candidate.still) void video.play().catch(() => undefined);

    return {
      setProgress: () => undefined,
      playExit: () => {
        if (!video || !definition.finishOnExit || candidate.still || video.paused || video.ended) {
          return Promise.resolve();
        }
        video.loop = false;
        return new Promise<void>((resolve) => {
          video.addEventListener('ended', () => resolve(), { once: true });
          video.addEventListener('error', () => resolve(), { once: true });
        });
      },
      dispose: () => {
        if (video) releaseVideo(video);
        element.remove();
      },
    };
  }

  throw new Error(
    candidates.length === 0
      ? 'No splash media source is usable in this environment'
      : `No splash media source could be decoded (${failures.join('; ')})`,
  );
};
