import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BRAND } from '../../branding/brand';
import { useLanguage } from '../../i18n/LanguageProvider';
import { getShaderWarmupSnapshot, subscribeShaderWarmup } from '../../lib/shaderWarmup';
import { getStartupProgress, isStartupReady, nextSplashCheckMs, shouldExitSplash } from './splashPolicy';
import { mountSplashVisual, type SplashVisualHandle } from './splashVisual';
import { mountStaticSplashVisual, removeBootSplash } from './staticSplashVisual';
import './SplashScreen.css';

type Phase = 'showing' | 'exiting' | 'fading' | 'done';

function splashDisabled(): boolean {
  // Playwright drives the canvas directly; an overlay would only add timing noise.
  return !BRAND.splash.enabled || (import.meta.env.DEV && import.meta.env.VITE_KGG_E2E === '1');
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Startup overlay. It covers the app while the WebGL context and the shaders
 * of the current scene are prepared, then reveals the already-running app.
 * The app mounts underneath from the first frame: compiled programs belong to
 * the preview's own WebGL context, so nothing is loaded "for" the splash.
 */
export function SplashScreen() {
  const { t } = useLanguage();
  const [disabled] = useState(splashDisabled);
  const [phase, setPhase] = useState<Phase>(disabled ? 'done' : 'showing');
  const [skipped, setSkipped] = useState(false);
  const [clock, setClock] = useState(0);
  const startedAtRef = useRef(performance.now());
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<SplashVisualHandle | null>(null);
  const warmup = useSyncExternalStore(subscribeShaderWarmup, getShaderWarmupSnapshot, getShaderWarmupSnapshot);
  const ready = isStartupReady(warmup);
  const progress = getStartupProgress(warmup);
  const { splash } = BRAND;

  // Mount the visual once. A failed or slow Lottie/Rive load falls back to the poster.
  useEffect(() => {
    if (disabled) {
      removeBootSplash();
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    const controller = new AbortController();
    void mountSplashVisual(
      host,
      splash.visual,
      { brandName: BRAND.productName, reducedMotion: prefersReducedMotion(), signal: controller.signal },
      { fallback: mountStaticSplashVisual, loadTimeoutMs: splash.visualLoadTimeoutMs },
    ).then((handle) => {
      if (controller.signal.aborted) {
        handle.dispose();
        return;
      }
      handleRef.current = handle;
      // Rich visuals paint their own frame; the static poster adopted the boot element.
      removeBootSplash(host);
    });
    return () => {
      controller.abort();
      handleRef.current?.dispose();
      handleRef.current = null;
      removeBootSplash();
    };
  }, [disabled, splash.visual, splash.visualLoadTimeoutMs]);

  useEffect(() => {
    handleRef.current?.setProgress(progress);
  }, [progress]);

  // Decide when to leave. Re-check at the min/max display deadlines.
  useEffect(() => {
    if (phase !== 'showing') return;
    const elapsedMs = performance.now() - startedAtRef.current;
    if (shouldExitSplash({ elapsedMs, ready, skipped, timing: splash })) {
      setPhase('exiting');
      return;
    }
    const timer = setTimeout(() => setClock(value => value + 1), nextSplashCheckMs(elapsedMs, ready, splash) + 16);
    return () => clearTimeout(timer);
  }, [phase, ready, skipped, clock, splash]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    let cancelled = false;
    const outro = handleRef.current?.playExit() ?? Promise.resolve();
    void Promise.race([outro.catch(() => undefined), delay(splash.exitTimeoutMs)]).then(() => {
      if (!cancelled) setPhase('fading');
    });
    return () => {
      cancelled = true;
    };
  }, [phase, splash.exitTimeoutMs]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const timer = setTimeout(() => setPhase('done'), splash.fadeOutMs);
    return () => clearTimeout(timer);
  }, [phase, splash.fadeOutMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    handleRef.current?.dispose();
    handleRef.current = null;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'showing') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') setSkipped(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className="kgg-splash"
      data-phase={phase}
      style={{ transitionDuration: `${splash.fadeOutMs}ms` }}
      role="status"
      aria-live="polite"
      aria-label={t('splash.loading', { product: BRAND.productName })}
      title={t('splash.skipHint')}
      onClick={() => setSkipped(true)}
    >
      <div ref={hostRef} className="kgg-splash__visual" />
      <div
        className="kgg-splash__progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="kgg-splash__progress-bar" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
