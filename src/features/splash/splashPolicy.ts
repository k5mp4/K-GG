import type { ShaderWarmupSnapshot } from '../../lib/shaderWarmup';

export type SplashTiming = {
  /** Keeps a very fast start from flashing the splash for a single frame. */
  minDisplayMs: number;
  /** Hard cap: the app is always revealed after this, ready or not. */
  maxDisplayMs: number;
};

/**
 * The splash waits for the programs the current scene needs, never for the
 * background warmup. A WebGL failure counts as ready because the CPU preview
 * is shown instead.
 */
export function isStartupReady(snapshot: ShaderWarmupSnapshot): boolean {
  return snapshot.status === 'background'
    || snapshot.status === 'done'
    || snapshot.status === 'unavailable';
}

/** Loading progress in 0..1 for splash visuals. */
export function getStartupProgress(snapshot: ShaderWarmupSnapshot): number {
  if (isStartupReady(snapshot)) return 1;
  if (snapshot.status === 'waiting') return 0.1;
  if (snapshot.criticalTotal === 0) return 1;
  return 0.2 + 0.8 * Math.min(1, snapshot.criticalSettled / snapshot.criticalTotal);
}

export function shouldExitSplash(input: {
  elapsedMs: number;
  ready: boolean;
  skipped: boolean;
  timing: SplashTiming;
}): boolean {
  if (input.skipped) return true;
  if (input.elapsedMs >= input.timing.maxDisplayMs) return true;
  return input.ready && input.elapsedMs >= input.timing.minDisplayMs;
}

/** Milliseconds until the exit decision can change without a readiness update. */
export function nextSplashCheckMs(elapsedMs: number, ready: boolean, timing: SplashTiming): number {
  const target = ready ? timing.minDisplayMs : timing.maxDisplayMs;
  return Math.max(0, target - elapsedMs);
}

/**
 * Progress drawn on the bar. Once the splash starts leaving (ready, skipped
 * or the maximum display time), the bar completes so the app never appears
 * behind a half-filled bar; shader preparation keeps running afterwards.
 */
export function getDisplayedSplashProgress(progress: number, leaving: boolean): number {
  return leaving ? 1 : progress;
}
