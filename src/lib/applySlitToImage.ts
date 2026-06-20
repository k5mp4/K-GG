import type { SlitScanConfig } from '../types/distortion';

function computeSlitIdx(warpedCoord: number, sw: number, sortedDeltas: Array<[number, number]>): number {
  let cumDelta = 0;
  for (const [sIdx, delta] of sortedDeltas) {
    const leftBound = sIdx * sw + cumDelta;
    if (warpedCoord < leftBound) return Math.floor((warpedCoord - cumDelta) / sw);
    const rightBound = leftBound + sw + delta;
    if (warpedCoord < rightBound) return sIdx;
    cumDelta += delta;
  }
  return Math.floor((warpedCoord - cumDelta) / sw);
}

function slitHash(n: number): number {
  return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
}

function fract(n: number): number {
  return n - Math.floor(n);
}

function waveShape(t: number, type: SlitScanConfig['waveType']): number {
  const p = fract(t);
  if (type === 'sawtooth') return p * 2 - 1;
  if (type === 'semicircle') {
    const x = p * 2 - 1;
    return Math.sqrt(Math.max(1 - x * x, 0)) * 2 - 1;
  }
  return Math.sin(p * Math.PI * 2);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function regularPolygonCoord(dx: number, dy: number, sides: number, angle: number): number {
  const safeSides = Math.max(3, Math.min(32, Math.round(sides)));
  const sector = (Math.PI * 2) / safeSides;
  const localAngle = Math.abs(fract((Math.atan2(dy, dx) + angle + sector * 0.5) / sector) * sector - sector * 0.5);
  return Math.sqrt(dx * dx + dy * dy) * Math.cos(localAngle) / Math.max(Math.cos(Math.PI / safeSides), 0.001);
}

function sampleBilinear(src: Uint8ClampedArray, width: number, height: number, x: number, y: number, out: Uint8ClampedArray, dstOff: number): void {
  const sx = clamp(x, 0, width - 1);
  const sy = clamp(y, 0, height - 1);
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const tx = sx - x0;
  const ty = sy - y0;

  const o00 = (y0 * width + x0) * 4;
  const o10 = (y0 * width + x1) * 4;
  const o01 = (y1 * width + x0) * 4;
  const o11 = (y1 * width + x1) * 4;

  for (let c = 0; c < 4; c++) {
    const top = src[o00 + c] * (1 - tx) + src[o10 + c] * tx;
    const bottom = src[o01 + c] * (1 - tx) + src[o11 + c] * tx;
    out[dstOff + c] = top * (1 - ty) + bottom * ty;
  }
}

async function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
      img.src = url;
    });
    return createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imageFileToCanvas(file: File, maxDimension?: number): Promise<HTMLCanvasElement> {
  const bitmap = await fileToImageBitmap(file);

  const scale = maxDimension
    ? Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context を作成できませんでした。');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return canvas;
}

export async function applySlitToCanvas(srcCanvas: HTMLCanvasElement, slitScan: SlitScanConfig): Promise<HTMLCanvasElement> {
  const width = srcCanvas.width;
  const height = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Canvas 2D context を作成できませんでした。');

  const srcData = srcCtx.getImageData(0, 0, width, height).data;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Canvas 2D context を作成できませんでした。');
  const outImage = outCtx.createImageData(width, height);
  const outData = outImage.data;

  const pixelPerfect = slitScan.pixelPerfect;
  const ppRound = (v: number) => pixelPerfect ? Math.round(v) : v;
  const sw = Math.max(ppRound(slitScan.slitWidth), 1);
  const slitPhase = ppRound(slitScan.slitPhase ?? 0);
  const sortedDeltas = Object.entries(slitScan.slitDeltas ?? {})
    .map(([k, v]) => [Number(k), pixelPerfect ? Math.round(v) : v] as [number, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0] - b[0])
    .slice(0, 32);

  const angle = (slitScan.angle * Math.PI) / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const centerProj = (width * 0.5) * cosA + (height * 0.5) * sinA;
  const offsetAngle = angle + ((slitScan.offsetAngle ?? 90) * Math.PI) / 180 + Math.PI / 2;
  const offsetX = Math.cos(offsetAngle);
  const offsetY = Math.sin(offsetAngle);
  const seed = slitScan.seed;
  const animEnabled = slitScan.animEnabled && slitScan.animMode !== 'off' && slitScan.offsetSpeed !== 0;
  const animTime = 0;
  const snapUVToCanvasPixel = (uvX: number, uvY: number) => {
    if (!pixelPerfect) return [uvX, uvY] as const;
    return [(Math.floor(uvX * width) + 0.5) / width, (Math.floor(uvY * height) + 0.5) / height] as const;
  };
  const snapOffsetToCanvasPixel = (offsetUvX: number, offsetUvY: number) => {
    if (!pixelPerfect) return [offsetUvX, offsetUvY] as const;
    return [Math.round(offsetUvX * width) / width, Math.round(offsetUvY * height) / height] as const;
  };

  for (let py = 0; py < height; py++) {
    const globalY = height - py - 0.5;
    const uvY0 = globalY / height;
    for (let px = 0; px < width; px++) {
      const globalX = px + 0.5;
      let uvX = globalX / width;
      let uvY = uvY0;

      if (slitScan.mode === 'wave') {
        const waveAxisX = -sinA;
        const waveAxisY = cosA;
        const coord = globalX * waveAxisX + globalY * waveAxisY + slitPhase;
        const bandIdx = Math.floor(coord / sw);
        const localPhase = fract(coord / sw);
        const phase = bandIdx + localPhase + seed * 0.137;
        const bandGate = smoothstep(0, 0.08, localPhase) * (1 - smoothstep(0.92, 1, localPhase));
        const waveOffset = waveShape(phase, slitScan.waveType ?? 'sine') * (slitScan.waveHeight ?? 80) * bandGate;
        const [offsetUvX, offsetUvY] = snapOffsetToCanvasPixel((cosA * waveOffset) / width, (sinA * waveOffset) / height);
        uvX += offsetUvX;
        uvY += offsetUvY;
        [uvX, uvY] = snapUVToCanvasPixel(uvX, uvY);
      } else if (slitScan.mode === 'circular' || slitScan.mode === 'polygon') {
        const dx = globalX - width * 0.5;
        const dy = globalY - height * 0.5;
        const radialCoord = slitScan.mode === 'polygon'
          ? regularPolygonCoord(dx, dy, slitScan.polygonSides ?? 6, angle)
          : Math.sqrt(dx * dx + dy * dy);
        const circCoord = radialCoord + slitPhase;
        const slitIdx = computeSlitIdx(circCoord, sw, sortedDeltas);
        const h = slitHash(slitIdx + seed * 91.7);
        const sf = animEnabled
          ? (slitScan.animMode === 'pingpong' ? Math.sin((h + animTime) * Math.PI * 2) : fract(h + animTime) * 2 - 1)
          : h * 2 - 1;
        const delta = sf * slitScan.offset * Math.PI + slitIdx * angle;
        const cosD = Math.cos(delta);
        const sinD = Math.sin(delta);
        const cx = uvX - 0.5;
        const cy = uvY - 0.5;
        uvX = 0.5 + cx * cosD - cy * sinD;
        uvY = 0.5 + cx * sinD + cy * cosD;
        [uvX, uvY] = snapUVToCanvasPixel(uvX, uvY);
      } else {
        const slitCoord = globalX * cosA + globalY * sinA - centerProj + slitPhase;
        const warpedCoord = slitCoord + Math.sin((slitCoord / (sw * 4)) * Math.PI * 2 + seed * 37.4) * slitScan.variance * sw;
        const slitIdx = computeSlitIdx(warpedCoord, sw, sortedDeltas);
        const h = slitHash(slitIdx + seed * 91.7);
        const sf = animEnabled
          ? (slitScan.animMode === 'pingpong' ? Math.sin((h + animTime) * Math.PI * 2) : fract(h + animTime) * 2 - 1)
          : h * 2 - 1;
        const [offsetUvX, offsetUvY] = snapOffsetToCanvasPixel(sf * slitScan.offset * offsetX, sf * slitScan.offset * offsetY);
        uvX += offsetUvX;
        uvY += offsetUvY;
      }

      const sampleX = uvX * width - 0.5;
      const sampleY = (1 - uvY) * height - 0.5;
      sampleBilinear(srcData, width, height, sampleX, sampleY, outData, (py * width + px) * 4);
    }

    if (py % 256 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  outCtx.putImageData(outImage, 0, 0);
  return outCanvas;
}

export async function applySlitToImageFile(file: File, slitScan: SlitScanConfig): Promise<HTMLCanvasElement> {
  const srcCanvas = await imageFileToCanvas(file);
  return applySlitToCanvas(srcCanvas, slitScan);
}
