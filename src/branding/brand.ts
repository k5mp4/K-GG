import type { SplashVisualDefinition } from '../features/splash/splashVisual';

/**
 * Branding values that are not colors. Colors come from `design-tokens.css`
 * (`--color-k-bg`, `--color-fire`, `--color-cream`); the pre-JavaScript
 * poster in `index.html` repeats them as literals because it paints before
 * any stylesheet from the bundle loads. Update both together.
 */
export const BRAND = {
  productName: 'KAGARIBI Grad',
  splash: {
    enabled: true,
    /** Switch to `{ kind: 'lottie', src }` or `{ kind: 'rive', src, ... }` once an adapter is registered. */
    visual: { kind: 'static' } as SplashVisualDefinition,
    minDisplayMs: 600,
    maxDisplayMs: 4000,
    /** Upper bound for loading a Lottie/Rive runtime and asset before falling back to the poster. */
    visualLoadTimeoutMs: 1500,
    /** Upper bound for an adapter outro. */
    exitTimeoutMs: 1200,
    fadeOutMs: 240,
  },
} as const;
