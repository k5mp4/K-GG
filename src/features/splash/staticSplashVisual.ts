import { APP_VERSION } from '../../appVersion';
import { BRAND } from '../../branding/brand';
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

function createPoster(): HTMLElement {
  const poster = document.createElement('div');
  poster.id = BOOT_SPLASH_ELEMENT_ID;
  const name = document.createElement('div');
  name.className = 'kgg-boot-splash__name';
  name.textContent = BRAND.displayName;
  const version = document.createElement('div');
  version.className = 'kgg-boot-splash__version';
  version.textContent = `v${APP_VERSION}`;
  poster.append(name, version);
  return poster;
}

/**
 * Black screen with the K-GG name and the app version. It adopts the `index.html` poster (same
 * markup and styles) so the hand-off from static HTML to React has no visual
 * jump, and it is the fallback for every other visual kind.
 */
export const mountStaticSplashVisual: SplashVisualAdapter<{ kind: 'static' }> = async (host) => {
  const poster = document.getElementById(BOOT_SPLASH_ELEMENT_ID) ?? createPoster();
  poster.dataset.kggSplashOwned = 'true';
  host.append(poster);
  return {
    setProgress: () => undefined,
    playExit: () => Promise.resolve(),
    dispose: () => poster.remove(),
  };
};
