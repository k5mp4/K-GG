/**
 * Splash visual boundary.
 *
 * The splash overlay (`SplashScreen`) owns timing, readiness and dismissal.
 * A visual adapter owns only drawing: a CSS/SVG poster today, and a Lottie or
 * Rive animation later. Adding a runtime means adding one adapter file and one
 * loader entry below; the startup and shader warmup code does not change.
 */

/** Where a splash animation comes from. Keep asset URLs local (CSP is `'self'`). */
export type SplashVisualDefinition =
  | { kind: 'static' }
  | {
    kind: 'lottie';
    /** Bundled Lottie JSON or .lottie URL. */
    src: string;
    /** Frames looped while loading, as [start, end]. The whole animation loops when omitted. */
    loopSegment?: [number, number];
    /** Frames played once on exit, as [start, end]. */
    exitSegment?: [number, number];
  }
  | {
    kind: 'rive';
    /** Bundled .riv URL. */
    src: string;
    artboard?: string;
    stateMachine?: string;
    /** Number input that receives loading progress in 0..100. */
    progressInput?: string;
    /** Trigger input fired on exit; the adapter resolves when the exit state finishes. */
    exitTrigger?: string;
  };

export type SplashVisualKind = SplashVisualDefinition['kind'];

export type SplashVisualContext = {
  brandName: string;
  reducedMotion: boolean;
  /** Aborted when the splash is dismissed before the adapter finished mounting. */
  signal: AbortSignal;
};

export type SplashVisualHandle = {
  /** Loading progress in 0..1. Called often; adapters should only forward it. */
  setProgress(progress: number): void;
  /** Plays an outro. The overlay caps the wait, so adapters may resolve late but must resolve or reject. */
  playExit(): Promise<void>;
  /** Releases the runtime, canvases and listeners. Called exactly once. */
  dispose(): void;
};

export type SplashVisualAdapter<D extends SplashVisualDefinition = SplashVisualDefinition> = (
  host: HTMLElement,
  definition: D,
  context: SplashVisualContext,
) => Promise<SplashVisualHandle>;

type SplashVisualLoader<K extends SplashVisualKind> = () => Promise<
  SplashVisualAdapter<Extract<SplashVisualDefinition, { kind: K }>>
>;

export type SplashVisualRegistry = { [K in SplashVisualKind]?: SplashVisualLoader<K> };

/**
 * Runtime loaders. Heavy runtimes must be dynamic imports so they never enter
 * the main bundle or delay WebGL initialization. Register Lottie/Rive here
 * together with their dependency, e.g.
 *
 *   lottie: () => import('./lottieSplashVisual').then(m => m.mountLottieSplashVisual),
 *   rive: () => import('./riveSplashVisual').then(m => m.mountRiveSplashVisual),
 *
 * Kinds without a loader fall back to the static poster.
 */
export const SPLASH_VISUAL_REGISTRY: SplashVisualRegistry = {};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Mounts the configured visual. A missing loader, a failed runtime import,
 * a broken asset or a slow load all fall back to `fallback`, so a branding
 * asset can never keep the app behind the splash.
 */
export async function mountSplashVisual(
  host: HTMLElement,
  definition: SplashVisualDefinition,
  context: SplashVisualContext,
  options: {
    fallback: SplashVisualAdapter<{ kind: 'static' }>;
    registry?: SplashVisualRegistry;
    loadTimeoutMs: number;
  },
): Promise<SplashVisualHandle> {
  const registry = options.registry ?? SPLASH_VISUAL_REGISTRY;
  const mountFallback = () => options.fallback(host, { kind: 'static' }, context);
  if (definition.kind === 'static') return mountFallback();

  const loader = registry[definition.kind] as SplashVisualLoader<typeof definition.kind> | undefined;
  if (!loader) {
    console.warn(`[Splash] No visual adapter is registered for "${definition.kind}"; using the static poster.`);
    return mountFallback();
  }
  try {
    const adapter = await withTimeout(loader(), options.loadTimeoutMs, `${definition.kind} runtime`);
    const mounting = (adapter as SplashVisualAdapter)(host, definition, context);
    try {
      return await withTimeout(mounting, options.loadTimeoutMs, `${definition.kind} visual`);
    } catch (error) {
      // A visual that finishes mounting after the timeout must still release its runtime.
      void mounting.then(handle => handle.dispose(), () => undefined);
      throw error;
    }
  } catch (error) {
    console.warn(`[Splash] ${definition.kind} visual failed; using the static poster.`, error);
    host.replaceChildren();
    return mountFallback();
  }
}
