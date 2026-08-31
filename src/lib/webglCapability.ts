export type WebGL2Availability = 'unknown' | 'available' | 'unavailable';

let webgl2Availability: WebGL2Availability = 'unknown';

export class WebGL2UnavailableError extends Error {
  readonly code = 'WEBGL2_UNAVAILABLE';

  constructor(message = 'WebGL2 is required but was not available') {
    super(message);
    this.name = 'WebGL2UnavailableError';
  }
}

export function getWebGL2Availability(): WebGL2Availability {
  return webgl2Availability;
}

export function markWebGL2Available(): void {
  webgl2Availability = 'available';
}

export function markWebGL2Unavailable(): void {
  // A secondary renderer can fail because the browser temporarily refuses an
  // additional context. Do not let that invalidate a known-good primary one.
  if (webgl2Availability !== 'available') webgl2Availability = 'unavailable';
}

export function markWebGL2AvailabilityUnknown(): void {
  webgl2Availability = 'unknown';
}

/**
 * Acquire the context before constructing a library renderer. This keeps
 * Three.js from making a second context request that only repeats the same
 * browser-level failure and lets all WebGL entry points share one capability
 * decision for the current page.
 */
export function createWebGL2Context(
  canvas: HTMLCanvasElement,
  attributes: WebGLContextAttributes,
): WebGL2RenderingContext | null {
  if (webgl2Availability === 'unavailable') return null;

  let context: WebGL2RenderingContext | null = null;
  try {
    context = canvas.getContext('webgl2', attributes);
  } catch {
    context = null;
  }

  if (!context) {
    markWebGL2Unavailable();
    return null;
  }

  markWebGL2Available();
  return context;
}

export function isWebGL2UnavailableError(error: unknown): boolean {
  if (error instanceof WebGL2UnavailableError) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /WebGL2 is required but was not available|Could not create a WebGL context|Error creating WebGL context|WebGL context could not be created/i.test(message);
}

/** @internal Test-only reset for isolated capability scenarios. */
export function resetWebGL2AvailabilityForTests(): void {
  webgl2Availability = 'unknown';
}
