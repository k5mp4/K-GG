import { zipSync } from 'fflate';
import { canvasToPngBlob, createExportDirectory, saveBlobToDir } from './export';
import type { ExportDirectoryHandle } from '../adapters';
import type { SlitScanConfig } from '../types/distortion';

/**
 * シェーダーの computeSlitIdx と同じロジック（複数デルタ対応）。
 * sortedDeltas はスリットインデックス昇順にソート済み。
 */
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

// ─── Linear mode helpers ───────────────────────────────────────────────────

/**
 * Linear モード: 各ピクセルのスリット帯域インデックスを Int32Array に格納。
 * シェーダーの slit 計算（slitPhase・variance warp・computeSlitIdx）と完全一致。
 */
function buildLinearIndexBuffer(
  width: number,
  height: number,
  slitScan: SlitScanConfig,
): Int32Array {
  const _pp = slitScan.pixelPerfect;
  const _ppR = (v: number) => _pp ? Math.round(v) : v;

  const sw = Math.max(_ppR(slitScan.slitWidth), 1);
  const rad = slitScan.angle * (Math.PI / 180);
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  
  const slitPhase = _ppR(slitScan.slitPhase ?? 0);
  const { variance, seed } = slitScan;
  
  const sortedDeltas = Object.entries(slitScan.slitDeltas ?? {})
    .map(([k, v]) => [Number(k), _pp ? Math.round(v) : v] as [number, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0] - b[0]);

  const indexBuffer = new Int32Array(width * height);

  // シェーダーと同じ: centerProj = dot(resolution*0.5, vec2(cosA,sinA))
  const centerProj = (width / 2) * cosA + (height / 2) * sinA;
  const phaseOffset = slitPhase - centerProj;

  for (let py = 0; py < height; py++) {
    const fy = height - py - 0.5; // OpenGL Y 反転 (gl_FragCoord.y)
    const rowBase = py * width;
    for (let px = 0; px < width; px++) {
      const fx = px + 0.5;
      // シェーダー: slitCoord = dot(fragCoord, vec2(cosA, sinA)) - centerProj + slitPhase
      const slitCoord = fx * cosA + fy * sinA + phaseOffset;
      // シェーダー: warpedCoord = slitCoord + sin(...) * variance * sw
      const warpedCoord = slitCoord + Math.sin(slitCoord / (sw * 4.0) * Math.PI * 2 + seed * 37.4) * variance * sw;
      indexBuffer[rowBase + px] = computeSlitIdx(warpedCoord, sw, sortedDeltas);
    }
  }
  return indexBuffer;
}

function regularPolygonCoord(dx: number, dy: number, sides: number, angle: number): number {
  const safeSides = Math.max(3, Math.min(32, Math.round(sides)));
  const sector = (Math.PI * 2) / safeSides;
  const localAngle = Math.abs(((Math.atan2(dy, dx) + angle + sector * 0.5) % sector + sector) % sector - sector * 0.5);
  return Math.sqrt(dx * dx + dy * dy) * Math.cos(localAngle) / Math.max(Math.cos(Math.PI / safeSides), 0.001);
}

function buildPolygonIndexBuffer(
  width: number,
  height: number,
  slitScan: SlitScanConfig,
): Int32Array {
  const _pp = slitScan.pixelPerfect;
  const _ppR = (v: number) => _pp ? Math.round(v) : v;
  const sw = Math.max(_ppR(slitScan.slitWidth), 1);
  const slitPhase = _ppR(slitScan.slitPhase ?? 0);
  const angle = slitScan.angle * (Math.PI / 180);
  const sides = slitScan.polygonSides ?? 6;
  const sortedDeltas = Object.entries(slitScan.slitDeltas ?? {})
    .map(([k, v]) => [Number(k), _pp ? Math.round(v) : v] as [number, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0] - b[0]);

  const indexBuffer = new Int32Array(width * height);
  for (let py = 0; py < height; py++) {
    const fy = height - py - 0.5;
    const rowBase = py * width;
    for (let px = 0; px < width; px++) {
      const fx = px + 0.5;
      const dx = fx - width * 0.5;
      const dy = fy - height * 0.5;
      indexBuffer[rowBase + px] = computeSlitIdx(regularPolygonCoord(dx, dy, sides, angle) + slitPhase, sw, sortedDeltas);
    }
  }
  return indexBuffer;
}

/**
 * スリットIDごとにピクセルをグループ化する。
 * Connected Components ではなく ID 単位でまとめることで、1スリット1ファイルを実現。
 */
function groupPixelsBySlitId(
  indexBuffer: Int32Array,
  width: number,
  height: number,
): Map<number, Uint32Array> {
  const pixelCount = width * height;
  const groups = new Map<number, number[]>();

  for (let i = 0; i < pixelCount; i++) {
    const sid = indexBuffer[i];
    if (!groups.has(sid)) groups.set(sid, []);
    groups.get(sid)!.push(i);
  }

  const result = new Map<number, Uint32Array>();
  for (const [sid, pixels] of groups.entries()) {
    result.set(sid, new Uint32Array(pixels));
  }
  return result;
}

// ─── Export options ────────────────────────────────────────────────────────

export interface ExportSlitsOptions {
  canvas: HTMLCanvasElement;
  slitScan: SlitScanConfig;
  stem: string;
  dirHandle: ExportDirectoryHandle | null;
  signal?: AbortSignal;
  onProgress?: (p: number) => void;
  /** true: 各スリットの実サイズにトリミング（アルファなし・黒背景）  false(既定): キャンバス全体サイズ・透明背景 */
  trimToSlit?: boolean;
}

// ─── ZIP helper ────────────────────────────────────────────────────────────

async function saveOrZip(
  blob: Blob,
  filename: string,
  dirHandle: ExportDirectoryHandle | null,
  zipFiles: Record<string, Uint8Array>,
): Promise<void> {
  if (dirHandle) {
    await saveBlobToDir(blob, filename, dirHandle);
  } else {
    const arrayBuffer = await blob.arrayBuffer();
    zipFiles[filename] = new Uint8Array(arrayBuffer);
  }
}

async function flushZip(
  zipFiles: Record<string, Uint8Array>,
  stem: string,
): Promise<void> {
  const zipped = zipSync(zipFiles, { level: 0 });
  const zipBlob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
  await saveBlobToDir(zipBlob, `${stem}_slits.zip`, null);
}

// ─── Circular export ───────────────────────────────────────────────────────

async function exportCircularSlits({
  canvas,
  slitScan,
  stem,
  dirHandle,
  signal,
  onProgress,
  trimToSlit = false,
}: ExportSlitsOptions): Promise<void> {
  const { width, height } = canvas;
  const _pp = slitScan.pixelPerfect;
  const _ppR = (v: number) => _pp ? Math.round(v) : v;

  const sw = Math.max(_ppR(slitScan.slitWidth), 1);
  const cx = width / 2;
  const cy = height / 2;
  const insR = Math.min(cx, cy);

  const slitPhase = _ppR(slitScan.slitPhase ?? 0);
  const sortedDeltas = Object.entries(slitScan.slitDeltas ?? {})
    .map(([k, v]) => [Number(k), _pp ? Math.round(v) : v] as [number, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[0] - b[0]);

  // シェーダーと同じ: circCoord = r_px + slitPhase → computeSlitIdx
  const getRingIdx = (r_px: number): number => {
    const circCoord = r_px + slitPhase;
    if (circCoord < 0) return -1;
    return computeSlitIdx(circCoord, sw, sortedDeltas);
  };

  // リング i の外縁 r_px。各スリットの累積デルタを考慮。
  const getOuterRpx = (i: number): number => {
    // boundary[i+1] の circCoord 位置 = (i+1)*sw + Σdelta[j] for j <= i
    let cumDelta = 0;
    for (const [sIdx, delta] of sortedDeltas) {
      if (sIdx > i) break;
      cumDelta += delta;
    }
    return (i + 1) * sw + cumDelta - slitPhase;
  };

  // 可視リングの index 範囲をシェーダー式で導出
  const circCoordMin = Math.max(0, slitPhase);
  const circCoordMax = insR + slitPhase;
  if (circCoordMax <= 0) return;
  const firstRingIdx = computeSlitIdx(circCoordMin, sw, sortedDeltas);
  const lastRingIdx  = computeSlitIdx(circCoordMax, sw, sortedDeltas);
  if (lastRingIdx < firstRingIdx) return;

  const readCanvas = document.createElement('canvas');
  readCanvas.width = width;
  readCanvas.height = height;
  const readCtx = readCanvas.getContext('2d')!;
  readCtx.drawImage(canvas, 0, 0);
  const srcData = readCtx.getImageData(0, 0, width, height).data;

  const total = lastRingIdx - firstRingIdx + 1;

  let slitDirHandle: ExportDirectoryHandle | null = null;
  if (dirHandle) {
    slitDirHandle = await createExportDirectory(dirHandle, `${stem}_slits`);
  }

  let outCanvas: HTMLCanvasElement | null = null;
  let outCtx: CanvasRenderingContext2D | null = null;
  let outImageData: ImageData | null = null;
  let outPixels: Uint8ClampedArray | null = null;
  if (!trimToSlit) {
    outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    outCtx = outCanvas.getContext('2d')!;
    outImageData = outCtx.createImageData(width, height);
    outPixels = outImageData.data;
  }

  const zipFiles: Record<string, Uint8Array> = {};

  for (let ringIdx = firstRingIdx; ringIdx <= lastRingIdx; ringIdx++) {
    signal?.throwIfAborted();

    const outerRpx = getOuterRpx(ringIdx);
    // 外縁が 0 以下（不可視）またはキャンバス内接円を超える（不完全リング）はスキップ
    if (outerRpx <= 0 || outerRpx > insR + 0.5) {
      onProgress?.((ringIdx - firstRingIdx + 1) / total);
      continue;
    }

    // スキャン範囲: 外縁 r_px に 1px マージンを加えた正方形
    const sOuterR = outerRpx + 1;
    const rowMin = Math.max(0, Math.floor(cy - sOuterR));
    const rowMax = Math.min(height - 1, Math.ceil(cy + sOuterR));

    const filename = `${stem}_slit${String(ringIdx).padStart(4, '0')}.png`;
    let blob: Blob;

    if (trimToSlit) {
      const halfSize = Math.ceil(sOuterR);
      const trimSize = halfSize * 2;
      const offsetX = Math.round(cx) - halfSize;
      const offsetY = Math.round(cy) - halfSize;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = trimSize;
      cropCanvas.height = trimSize;
      const cropCtx = cropCanvas.getContext('2d')!;
      const cropImgData = cropCtx.createImageData(trimSize, trimSize);
      const cropPixels = cropImgData.data;
      for (let k = 3; k < cropPixels.length; k += 4) cropPixels[k] = 255;

      for (let py = rowMin; py <= rowMax; py++) {
        const dy = cy - py - 0.5;
        const dy2 = dy * dy;
        for (let px = Math.max(0, Math.floor(cx - sOuterR)); px <= Math.min(width - 1, Math.ceil(cx + sOuterR)); px++) {
          const dx = px + 0.5 - cx;
          if (getRingIdx(Math.sqrt(dx * dx + dy2)) !== ringIdx) continue;

          const srcOff = (py * width + px) * 4;
          const tx = px - offsetX;
          const ty = py - offsetY;
          if (tx < 0 || tx >= trimSize || ty < 0 || ty >= trimSize) continue;
          const dstOff = (ty * trimSize + tx) * 4;
          cropPixels[dstOff]     = srcData[srcOff];
          cropPixels[dstOff + 1] = srcData[srcOff + 1];
          cropPixels[dstOff + 2] = srcData[srcOff + 2];
          cropPixels[dstOff + 3] = 255;
        }
      }

      cropCtx.putImageData(cropImgData, 0, 0);
      blob = await canvasToPngBlob(cropCanvas);
    } else {
      outPixels!.fill(0);

      for (let py = rowMin; py <= rowMax; py++) {
        const dy = cy - py - 0.5;
        const dy2 = dy * dy;
        for (let px = Math.max(0, Math.floor(cx - sOuterR)); px <= Math.min(width - 1, Math.ceil(cx + sOuterR)); px++) {
          const dx = px + 0.5 - cx;
          if (getRingIdx(Math.sqrt(dx * dx + dy2)) !== ringIdx) continue;

          const off = (py * width + px) * 4;
          outPixels![off]     = srcData[off];
          outPixels![off + 1] = srcData[off + 1];
          outPixels![off + 2] = srcData[off + 2];
          outPixels![off + 3] = srcData[off + 3];
        }
      }

      outCtx!.putImageData(outImageData!, 0, 0);
      blob = await canvasToPngBlob(outCanvas!);
    }

    await saveOrZip(blob, filename, slitDirHandle, zipFiles);
    onProgress?.((ringIdx - firstRingIdx + 1) / total);
    
    // UI 更新を許可
    if (ringIdx % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (!dirHandle) await flushZip(zipFiles, stem);
}

// ─── Linear export ─────────────────────────────────────────────────────────

async function exportLinearSlits({
  canvas,
  slitScan,
  stem,
  dirHandle,
  signal,
  onProgress,
  trimToSlit = false,
}: ExportSlitsOptions): Promise<void> {
  const { width, height } = canvas;

  const readCanvas = document.createElement('canvas');
  readCanvas.width = width;
  readCanvas.height = height;
  const readCtx = readCanvas.getContext('2d')!;
  readCtx.drawImage(canvas, 0, 0);
  const srcData = readCtx.getImageData(0, 0, width, height).data;

  const indexBuffer = slitScan.mode === 'polygon'
    ? buildPolygonIndexBuffer(width, height, slitScan)
    : buildLinearIndexBuffer(width, height, slitScan);
  const slitGroups = groupPixelsBySlitId(indexBuffer, width, height);
  const sortedSlitIds = Array.from(slitGroups.keys()).sort((a, b) => a - b);
  const total = sortedSlitIds.length;
  if (total === 0) return;

  let slitDirHandle: ExportDirectoryHandle | null = null;
  if (dirHandle) {
    slitDirHandle = await createExportDirectory(dirHandle, `${stem}_slits`);
  }

  // 非トリムモード用: 全キャンバスサイズの出力キャンバスを使い回す
  let outCanvas: HTMLCanvasElement | null = null;
  let outCtx: CanvasRenderingContext2D | null = null;
  let outImageData: ImageData | null = null;
  let outPixels: Uint8ClampedArray | null = null;
  if (!trimToSlit) {
    outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    outCtx = outCanvas.getContext('2d')!;
    outImageData = outCtx.createImageData(width, height);
    outPixels = outImageData.data;
  }

  const zipFiles: Record<string, Uint8Array> = {};

  for (let i = 0; i < total; i++) {
    signal?.throwIfAborted();

    const slitId = sortedSlitIds[i];
    // ファイル名はスリットIDに基づく（i ではなく slitId を使用）
    const filename = `${stem}_slit${String(slitId).padStart(4, '0')}.png`;

    const pixels = slitGroups.get(slitId)!;
    let blob: Blob;

    if (trimToSlit) {
      // トリムモード: 連結成分のバウンディングボックスにトリミング、アルファなし・黒背景
      let minX = width, maxX = 0, minY = height, maxY = 0;
      for (let j = 0; j < pixels.length; j++) {
        const p = pixels[j];
        const px = p % width;
        const py = (p / width) | 0;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d')!;
      const cropImgData = cropCtx.createImageData(cropW, cropH);
      const cropPixels = cropImgData.data;

      // 黒・不透明で初期化（アルファなし）
      for (let k = 3; k < cropPixels.length; k += 4) cropPixels[k] = 255;

      for (let j = 0; j < pixels.length; j++) {
        const p = pixels[j];
        const px = p % width;
        const py = (p / width) | 0;
        const srcOff = p * 4;
        const dstOff = ((py - minY) * cropW + (px - minX)) * 4;
        cropPixels[dstOff]     = srcData[srcOff];
        cropPixels[dstOff + 1] = srcData[srcOff + 1];
        cropPixels[dstOff + 2] = srcData[srcOff + 2];
        cropPixels[dstOff + 3] = 255;
      }

      cropCtx.putImageData(cropImgData, 0, 0);
      blob = await canvasToPngBlob(cropCanvas);
    } else {
      outPixels!.fill(0);

      for (let j = 0; j < pixels.length; j++) {
        const p = pixels[j];
        const offset = p * 4;
        outPixels![offset]     = srcData[offset];
        outPixels![offset + 1] = srcData[offset + 1];
        outPixels![offset + 2] = srcData[offset + 2];
        outPixels![offset + 3] = srcData[offset + 3];
      }

      outCtx!.putImageData(outImageData!, 0, 0);
      blob = await canvasToPngBlob(outCanvas!);
    }

    await saveOrZip(blob, filename, slitDirHandle, zipFiles);
    onProgress?.((i + 1) / total);

    // UI 更新を許可
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  if (!dirHandle) await flushZip(zipFiles, stem);
}

// ─── Public entry point ────────────────────────────────────────────────────

export async function exportSlits({
  canvas,
  slitScan,
  stem,
  dirHandle,
  signal,
  onProgress,
  trimToSlit,
}: ExportSlitsOptions): Promise<void> {
  console.log('[ExportSlits] START, mode:', slitScan.mode);
  if (slitScan.mode === 'circular') {
    return exportCircularSlits({ canvas, slitScan, stem, dirHandle, signal, onProgress, trimToSlit });
  }
  return exportLinearSlits({ canvas, slitScan, stem, dirHandle, signal, onProgress, trimToSlit });
}
