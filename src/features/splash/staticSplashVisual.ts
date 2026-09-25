import type { SplashVisualAdapter } from './splashVisual';

/** Id of the poster written into `index.html` so it paints before any JavaScript runs. */
export const BOOT_SPLASH_ELEMENT_ID = 'kgg-boot-splash';

/**
 * Removes the `index.html` poster. With `keepInside`, a poster already
 * adopted into that element (the static visual) is left in place.
 */
export function removeBootSplash(keepInside?: HTMLElement): void {
  const poster = document.getElementById(BOOT_SPLASH_ELEMENT_ID);
  if (!poster || keepInside?.contains(poster)) return;
  poster.remove();
}

function createPoster(brandName: string): HTMLElement {
  const poster = document.createElement('div');
  poster.id = BOOT_SPLASH_ELEMENT_ID;
  const mark = document.createElement('div');
  mark.className = 'kgg-boot-splash__mark';
  mark.setAttribute('aria-hidden', 'true');
  const name = document.createElement('div');
  name.className = 'kgg-boot-splash__name';
  name.textContent = brandName;
  poster.append(mark, name);
  return poster;
}

/**
 * CSS/SVG poster. It adopts the `index.html` poster (same markup and styles)
 * so the hand-off from static HTML to React has no visual jump, and it is the
 * fallback for every other visual kind.
 */
export const mountStaticSplashVisual: SplashVisualAdapter<{ kind: 'static' }> = async (host, _definition, context) => {
  const poster = document.getElementById(BOOT_SPLASH_ELEMENT_ID) ?? createPoster(context.brandName);
  poster.dataset.kggSplashOwned = 'true';
  host.append(poster);
  return {
    setProgress: () => undefined,
    playExit: () => Promise.resolve(),
    dispose: () => poster.remove(),
  };
};
