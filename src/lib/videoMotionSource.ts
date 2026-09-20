import type { VideoMotionConfig } from '../types/videoMotion';

export const VIDEO_MOTION_FIELD_WIDTH = 64;
export const VIDEO_MOTION_FIELD_HEIGHT = 36;
const SEARCH_RADIUS = 2;

export type VideoMotionField = {
  data: Uint8Array;
  width: number;
  height: number;
  hasFrame: boolean;
};

export type VideoMotionFieldStats = {
  hasFrame: boolean;
  sampleCount: number;
  activeRatio: number;
  meanMagnitude: number;
  maxMagnitude: number;
  meanX: number;
  meanY: number;
  meanChange: number;
  maxChange: number;
  changeRatio: number;
};

export type VideoMotionSource = {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  currentLuma: Float32Array;
  previousLuma: Float32Array;
  field: VideoMotionField;
  frameWidth: number;
  frameHeight: number;
  lastVideoTime: number;
  frameCount: number;
  lastUpdateTime: number;
};

function createField(): VideoMotionField {
  const data = new Uint8Array(VIDEO_MOTION_FIELD_WIDTH * VIDEO_MOTION_FIELD_HEIGHT * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 128;
    data[index + 1] = 128;
    data[index + 3] = 0;
  }
  return {
    data,
    width: VIDEO_MOTION_FIELD_WIDTH,
    height: VIDEO_MOTION_FIELD_HEIGHT,
    hasFrame: false,
  };
}

export function createVideoMotionSource(): VideoMotionSource {
  return {
    canvas: null,
    context: null,
    currentLuma: new Float32Array(VIDEO_MOTION_FIELD_WIDTH * VIDEO_MOTION_FIELD_HEIGHT),
    previousLuma: new Float32Array(VIDEO_MOTION_FIELD_WIDTH * VIDEO_MOTION_FIELD_HEIGHT),
    field: createField(),
    frameWidth: 0,
    frameHeight: 0,
    lastVideoTime: -1,
    frameCount: 0,
    lastUpdateTime: 0,
  };
}

export function resetVideoMotionField(field: VideoMotionField): void {
  for (let index = 0; index < field.data.length; index += 4) {
    field.data[index] = 128;
    field.data[index + 1] = 128;
    field.data[index + 2] = 0;
    field.data[index + 3] = 0;
  }
}

export function resetVideoMotionSource(source: VideoMotionSource): void {
  source.field.hasFrame = false;
  resetVideoMotionField(source.field);
  source.currentLuma.fill(0);
  source.previousLuma.fill(0);
  source.frameWidth = 0;
  source.frameHeight = 0;
  source.lastVideoTime = -1;
  source.frameCount = 0;
  source.lastUpdateTime = 0;
}

function ensureCanvas(source: VideoMotionSource): CanvasRenderingContext2D | null {
  if (!source.canvas) {
    source.canvas = document.createElement('canvas');
    source.canvas.width = VIDEO_MOTION_FIELD_WIDTH;
    source.canvas.height = VIDEO_MOTION_FIELD_HEIGHT;
    source.context = source.canvas.getContext('2d', { willReadFrequently: true });
  }
  return source.context;
}

function pixelIndex(x: number, y: number): number {
  return Math.max(0, Math.min(VIDEO_MOTION_FIELD_WIDTH - 1, x))
    + Math.max(0, Math.min(VIDEO_MOTION_FIELD_HEIGHT - 1, y)) * VIDEO_MOTION_FIELD_WIDTH;
}

function patchError(
  current: Float32Array,
  previous: Float32Array,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
): number {
  let error = 0;
  for (let py = -1; py <= 1; py += 1) {
    for (let px = -1; px <= 1; px += 1) {
      const currentValue = current[pixelIndex(x + px, y + py)];
      const previousValue = previous[pixelIndex(x + px + offsetX, y + py + offsetY)];
      error += Math.abs(currentValue - previousValue);
    }
  }
  return error;
}

function patchContrast(current: Float32Array, x: number, y: number): number {
  const center = current[pixelIndex(x, y)];
  let contrast = 0;
  for (let py = -1; py <= 1; py += 1) {
    for (let px = -1; px <= 1; px += 1) {
      contrast += Math.abs(current[pixelIndex(x + px, y + py)] - center);
    }
  }
  return contrast;
}

/**
 * Converts two luma frames into the shared normalized field.
 * This is kept pure so the estimator can be verified without a browser video
 * element or a GPU context.
 */
export function estimateVideoMotionField(
  field: VideoMotionField,
  current: Float32Array,
  previous: Float32Array,
  config: Pick<VideoMotionConfig, 'fieldSmoothing' | 'motionDamping'>,
): void {
  const smoothing = Math.min(0.95, Math.max(0, config.fieldSmoothing));
  const damping = Math.min(0.95, Math.max(0, config.motionDamping));
  const blend = 1 - smoothing;
  const maxOffset = SEARCH_RADIUS || 1;
  const patchSampleCount = 9;
  for (let y = 0; y < VIDEO_MOTION_FIELD_HEIGHT; y += 1) {
    for (let x = 0; x < VIDEO_MOTION_FIELD_WIDTH; x += 1) {
      let bestX = 0;
      let bestY = 0;
      let bestError = Number.POSITIVE_INFINITY;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let offsetY = -SEARCH_RADIUS; offsetY <= SEARCH_RADIUS; offsetY += 1) {
        for (let offsetX = -SEARCH_RADIUS; offsetX <= SEARCH_RADIUS; offsetX += 1) {
          const error = patchError(current, previous, x, y, offsetX, offsetY);
          const distance = offsetX * offsetX + offsetY * offsetY;
          // Flat patches produce many equally good matches. Prefer the
          // smallest displacement instead of the first search position.
          if (error < bestError - 1e-6 || (Math.abs(error - bestError) <= 1e-6 && distance < bestDistance)) {
            bestError = error;
            bestX = offsetX;
            bestY = offsetY;
            bestDistance = distance;
          }
        }
      }
      const offset = (y * VIDEO_MOTION_FIELD_WIDTH + x) * 4;
      const oldX = field.data[offset] / 255 * 2 - 1;
      const oldY = field.data[offset + 1] / 255 * 2 - 1;
      const matchConfidence = 1 - Math.min(1, bestError / patchSampleCount);
      const textureConfidence = Math.min(1, patchContrast(current, x, y) / 1.5);
      const confidence = matchConfidence * textureConfidence;
      const measuredX = (-bestX / maxOffset) * confidence;
      const measuredY = (-bestY / maxOffset) * confidence;
      const nextX = oldX * damping + (oldX * smoothing + measuredX * blend) * (1 - damping);
      const nextY = oldY * damping + (oldY * smoothing + measuredY * blend) * (1 - damping);
      const magnitude = Math.min(1, Math.hypot(nextX, nextY));
      field.data[offset] = Math.round((Math.max(-1, Math.min(1, nextX)) * 0.5 + 0.5) * 255);
      field.data[offset + 1] = Math.round((Math.max(-1, Math.min(1, nextY)) * 0.5 + 0.5) * 255);
      field.data[offset + 2] = Math.round(magnitude * 255);
      let frameChange = 0;
      for (let py = -1; py <= 1; py += 1) {
        for (let px = -1; px <= 1; px += 1) {
          frameChange += Math.abs(current[pixelIndex(x + px, y + py)] - previous[pixelIndex(x + px, y + py)]);
        }
      }
      field.data[offset + 3] = Math.round(Math.min(1, frameChange / patchSampleCount * 4) * 255);
    }
  }
}

export function getVideoMotionFieldStats(source: VideoMotionSource): VideoMotionFieldStats {
  const sampleCount = source.field.width * source.field.height;
  let sumMagnitude = 0;
  let maxMagnitude = 0;
  let sumX = 0;
  let sumY = 0;
  let activeCount = 0;
  let sumChange = 0;
  let maxChange = 0;
  let changedCount = 0;
  for (let index = 0; index < source.field.data.length; index += 4) {
    const x = source.field.data[index] / 255 * 2 - 1;
    const y = source.field.data[index + 1] / 255 * 2 - 1;
    const magnitude = source.field.data[index + 2] / 255;
    const change = source.field.data[index + 3] / 255;
    sumX += x * magnitude;
    sumY += y * magnitude;
    sumMagnitude += magnitude;
    maxMagnitude = Math.max(maxMagnitude, magnitude);
    sumChange += change;
    maxChange = Math.max(maxChange, change);
    if (change >= 0.05) changedCount += 1;
    if (magnitude >= 0.05) activeCount += 1;
  }
  return {
    hasFrame: source.field.hasFrame,
    sampleCount,
    activeRatio: sampleCount > 0 ? activeCount / sampleCount : 0,
    meanMagnitude: sampleCount > 0 ? sumMagnitude / sampleCount : 0,
    maxMagnitude,
    meanX: sumMagnitude > 0 ? sumX / sumMagnitude : 0,
    meanY: sumMagnitude > 0 ? sumY / sumMagnitude : 0,
    meanChange: sampleCount > 0 ? sumChange / sampleCount : 0,
    maxChange,
    changeRatio: sampleCount > 0 ? changedCount / sampleCount : 0,
  };
}

export function drawVideoMotionFieldPreview(canvas: HTMLCanvasElement, source: VideoMotionSource): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#101820';
  context.fillRect(0, 0, width, height);
  const cellWidth = width / source.field.width;
  const cellHeight = height / source.field.height;
  for (let y = 0; y < source.field.height; y += 1) {
    for (let x = 0; x < source.field.width; x += 1) {
      const index = (y * source.field.width + x) * 4;
      const vectorX = source.field.data[index] / 255 * 2 - 1;
      const vectorY = source.field.data[index + 1] / 255 * 2 - 1;
      const magnitude = source.field.data[index + 2] / 255;
      const change = source.field.data[index + 3] / 255;
      const hue = (Math.atan2(vectorY, vectorX) / (Math.PI * 2) + 0.5) * 360;
      context.fillStyle = `hsla(${hue}, 85%, ${58 + change * 16}%, ${0.12 + magnitude * 0.78})`;
      context.fillRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      if (change >= 0.03) {
        context.fillStyle = `rgba(255, 205, 92, ${change * 0.62})`;
        context.fillRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
    }
  }
  context.strokeStyle = 'rgba(255,255,255,0.78)';
  context.lineWidth = Math.max(1, Math.min(cellWidth, cellHeight) * 0.08);
  const stride = 4;
  for (let y = 0; y < source.field.height; y += stride) {
    for (let x = 0; x < source.field.width; x += stride) {
      const index = (y * source.field.width + x) * 4;
      const vectorX = source.field.data[index] / 255 * 2 - 1;
      const vectorY = source.field.data[index + 1] / 255 * 2 - 1;
      const magnitude = source.field.data[index + 2] / 255;
      if (magnitude < 0.05) continue;
      const startX = (x + 0.5) * cellWidth;
      const startY = (y + 0.5) * cellHeight;
      const length = Math.max(cellWidth, cellHeight) * 2.5 * magnitude;
      const endX = startX + vectorX * length;
      const endY = startY + vectorY * length;
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
    }
  }
  if (!source.field.hasFrame) {
    context.fillStyle = 'rgba(255,255,255,0.72)';
    context.font = '10px sans-serif';
    context.fillText('WAITING FOR VIDEO FRAME', 8, 16);
  }
}

/**
 * Produces a small normalized motion field from two decoded video frames.
 * The source boundary intentionally exposes only a field, so a future codec
 * vector or optical-flow provider can replace this implementation.
 */
export function updateVideoMotionField(
  source: VideoMotionSource,
  video: HTMLVideoElement,
  config: Pick<VideoMotionConfig, 'fieldSmoothing' | 'motionDamping'>,
): boolean {
  if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return false;
  if (source.lastVideoTime === video.currentTime && source.field.hasFrame) return false;
  const context = ensureCanvas(source);
  if (!context) return false;
  if (source.frameWidth !== video.videoWidth || source.frameHeight !== video.videoHeight) {
    source.frameWidth = video.videoWidth;
    source.frameHeight = video.videoHeight;
    source.field.hasFrame = false;
    resetVideoMotionField(source.field);
  }
  context.drawImage(video, 0, 0, VIDEO_MOTION_FIELD_WIDTH, VIDEO_MOTION_FIELD_HEIGHT);
  const image = context.getImageData(0, 0, VIDEO_MOTION_FIELD_WIDTH, VIDEO_MOTION_FIELD_HEIGHT).data;
  const next = source.currentLuma;
  for (let index = 0, pixel = 0; index < image.length; index += 4, pixel += 1) {
    next[pixel] = (image[index] * 0.2126 + image[index + 1] * 0.7152 + image[index + 2] * 0.0722) / 255;
  }
  source.lastVideoTime = video.currentTime;
  source.frameCount += 1;
  source.lastUpdateTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!source.field.hasFrame) {
    source.previousLuma.set(next);
    source.field.hasFrame = true;
    return true;
  }
  estimateVideoMotionField(source.field, next, source.previousLuma, config);
  source.previousLuma.set(next);
  return true;
}
