import { createEmptyManualDistortMap, createEmptyManualSmoothMask, normalizePostprocessConfig, STORE_DEFAULTS } from '../store/gradientStore';
import { normalizeEffectPipelineConfig } from './effectPipeline';
import type { StoreSnapshot } from './presetModel';
import { renderSceneAtTime } from './renderSceneAtTime';
import { normalizeImageGradientConfig } from '../types/imageGradient';
import type { LatestState } from '../types/latestState';
import { initWebGL, type WebGLContext } from './webgl';

export const PRESET_THUMBNAIL_WIDTH = 320;
export const PRESET_THUMBNAIL_HEIGHT = 200;

function normalizeMapResolution(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.min(512, Math.round(value)))
    : STORE_DEFAULTS.manualDistort.mapResolution;
}

function validFiniteArray(value: unknown, expectedLength: number): value is number[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every(item => typeof item === 'number' && Number.isFinite(item));
}

/**
 * Builds the same normalized rendering state used when a preset is loaded,
 * without writing to the editor store. External image sources are omitted on
 * purpose because they are not part of the portable preset format.
 */
export function createPresetThumbnailState(snapshot: StoreSnapshot): LatestState {
  const resolution = normalizeMapResolution(snapshot.manualDistort?.mapResolution);
  const displacementLength = resolution * resolution * 2;
  const smoothMaskLength = resolution * resolution;
  const manualDistort = {
    ...STORE_DEFAULTS.manualDistort,
    ...snapshot.manualDistort,
    mapResolution: resolution,
    displacement: validFiniteArray(snapshot.manualDistort?.displacement, displacementLength)
      ? [...snapshot.manualDistort.displacement]
      : createEmptyManualDistortMap(resolution),
    smoothMask: validFiniteArray(snapshot.manualDistort?.smoothMask, smoothMaskLength)
      ? [...snapshot.manualDistort.smoothMask]
      : createEmptyManualSmoothMask(resolution),
  };

  return {
    gradient: snapshot.gradient,
    noiseDistortion: { ...STORE_DEFAULTS.noiseDistortion, ...snapshot.noiseDistortion },
    diffuse: { ...STORE_DEFAULTS.diffuse, ...snapshot.diffuse },
    imageGradient: normalizeImageGradientConfig(snapshot.imageGradient, snapshot.imageGradient ? 0 : STORE_DEFAULTS.imageGradient.anchorInfluence),
    slitScan: { ...STORE_DEFAULTS.slitScan, ...snapshot.slitScan },
    stretch: { ...STORE_DEFAULTS.stretch, ...snapshot.stretch },
    normalMap: { ...STORE_DEFAULTS.normalMap, ...snapshot.normalMap },
    radon: { ...STORE_DEFAULTS.radon, ...snapshot.radon, enabled: false },
    iridescence: { ...STORE_DEFAULTS.iridescence, ...snapshot.iridescence, enabled: false },
    manualDistort,
    postprocess: normalizePostprocessConfig(snapshot.postprocess ?? snapshot.postprocessDistort),
    effectPipeline: normalizeEffectPipelineConfig(snapshot.effectPipeline),
    matcap: { ...STORE_DEFAULTS.matcap, ...snapshot.matcap },
    animation: { ...STORE_DEFAULTS.animation, ...snapshot.animation, previewLoop: snapshot.animation.previewLoop ?? true },
    keyframeTracks: snapshot.keyframeTracks ?? {},
    width: PRESET_THUMBNAIL_WIDTH,
    height: PRESET_THUMBNAIL_HEIGHT,
    animDirection: 0,
    sourceImageCanvas: null,
    imageGradientSource: null,
    imageMaskSource: null,
    imageMaskEnabled: false,
  };
}

let rendererPromise: Promise<{ canvas: HTMLCanvasElement; context: WebGLContext }> | null = null;
let captureQueue: Promise<unknown> = Promise.resolve();

async function getRenderer(): Promise<{ canvas: HTMLCanvasElement; context: WebGLContext }> {
  if (typeof document === 'undefined') throw new Error('Document is not available');
  if (!rendererPromise) {
    const canvas = document.createElement('canvas');
    canvas.width = PRESET_THUMBNAIL_WIDTH;
    canvas.height = PRESET_THUMBNAIL_HEIGHT;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.left = '-10000px';
    canvas.style.top = '-10000px';
    canvas.style.width = `${PRESET_THUMBNAIL_WIDTH}px`;
    canvas.style.height = `${PRESET_THUMBNAIL_HEIGHT}px`;
    document.body.appendChild(canvas);
    rendererPromise = initWebGL(canvas).then(context => ({ canvas, context }));
  }
  return await rendererPromise;
}

async function captureNow(snapshot: StoreSnapshot): Promise<string> {
  const { canvas, context } = await getRenderer();
  const state = createPresetThumbnailState(snapshot);
  canvas.width = PRESET_THUMBNAIL_WIDTH;
  canvas.height = PRESET_THUMBNAIL_HEIGHT;
  renderSceneAtTime(context, state, 0, {});
  return canvas.toDataURL('image/png');
}

/** Captures one static effect-stack frame. Failure is intentionally non-fatal. */
export function capturePresetThumbnail(snapshot: StoreSnapshot): Promise<string | undefined> {
  if (typeof document === 'undefined') return Promise.resolve(undefined);
  const job = captureQueue.then(() => captureNow(snapshot));
  captureQueue = job.then(() => undefined, () => undefined);
  return job.then(value => value, () => undefined);
}
