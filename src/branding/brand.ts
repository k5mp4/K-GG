import type { SplashVisualDefinition } from '../features/splash/splashVisual';

/**
 * Branding values that are not colors. The splash uses a black background,
 * `--color-fire` for the progress bar and `--color-cream` for the name and
 * version; the pre-JavaScript poster in `index.html` repeats them as literals
 * because it paints before any stylesheet from the bundle loads. Update both
 * together.
 */
export const BRAND = {
  productName: 'KAGARIBI Grad',
  /** Short mark shown on the splash. `index.html` repeats it for the pre-JavaScript poster. */
  displayName: 'K-GG',
  splash: {
    enabled: true,
    /**
     * `{ kind: 'static' }` is a black screen with the app version. For a bundled image or video,
     * import the files (e.g. from `src/assets/splash/`) and list them best
     * codec first; the first one the WebView can decode is used:
     *
     *   visual: {
     *     kind: 'media',
     *     sources: [
     *       { src: splashAv1, type: 'video/mp4; codecs="av01.0.05M.08"' },
     *       { src: splashH264, type: 'video/mp4; codecs="avc1.640028"' },
     *       { src: splashAvif }, // animated AVIF
     *       { src: splashGif },
     *     ],
     *     poster: splashStill, // reduced motion and last resort
     *     fit: 'contain',
     *   },
     *
     * `lottie` / `rive` need an adapter registered in `splashVisual.ts` first.
     */
    visual: { kind: 'static' } as SplashVisualDefinition,
    minDisplayMs: 600,
    maxDisplayMs: 4000,
    /** Upper bound for loading a visual adapter and its asset (image/video/Lottie/Rive) before falling back to the poster. */
    visualLoadTimeoutMs: 1500,
    /** Upper bound for an adapter outro. */
    exitTimeoutMs: 1200,
    /** Time for the progress bar to fill to 100% and hold before the fade starts. */
    progressCompleteMs: 360,
    fadeOutMs: 240,
  },
} as const;
