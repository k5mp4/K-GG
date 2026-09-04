import { readFile } from 'node:fs/promises';
import { test, expect } from './fixtures';
import {
  captureCanvasRgba,
  captureCanvasPng,
  dataUrlToBytes,
  prepareZipSmoke,
  setNormalizedTime,
  waitForExportComplete,
  waitForWebGLReady,
} from './support/bridge';
import { decodePngRgba, parsePngMetadata, validateFrameZip } from './support/artifacts';

async function openExportPanel(page: Parameters<typeof waitForWebGLReady>[0]) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__KGG_E2E__), undefined, { timeout: 30_000 });
  const diagnostics = await waitForWebGLReady(page);
  const canvas = page.locator('#kgg-preview-canvas');
  await expect(canvas).toBeVisible();
  const dimensions = {
    width: Number(await canvas.getAttribute('width')),
    height: Number(await canvas.getAttribute('height')),
  };
  expect(diagnostics.canvas).toEqual(dimensions);
  await page.getByRole('button', { name: /^Export$/i }).first().click();
  return { canvas, dimensions };
}

async function downloadBytes(page: Parameters<typeof waitForWebGLReady>[0], name: RegExp): Promise<Uint8Array> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name }).click(),
  ]);
  const path = await download.path();
  expect(path).not.toBeNull();
  return Uint8Array.from(await readFile(path!));
}

test('Save PNG downloads a structurally valid image', async ({ page, browserErrors: _browserErrors }) => {
  const { dimensions } = await openExportPanel(page);
  const canvasRgba = await captureCanvasRgba(page);
  const bytes = await downloadBytes(page, /^Save PNG$/i);
  const metadata = parsePngMetadata(bytes);

  expect(metadata).toMatchObject(dimensions);
  expect(metadata.byteLength).toBe(bytes.byteLength);
  const decoded = decodePngRgba(bytes);
  expect(decoded.rgba.byteLength).toBe(dimensions.width * dimensions.height * 4);
  expect(decoded.rgba).toEqual(Uint8Array.from(Buffer.from(canvasRgba.dataBase64, 'base64')));
});

test('PNG ZIP contains sequential valid frames and Preview recovers', async ({ page, browserErrors: _browserErrors }) => {
  const { dimensions } = await openExportPanel(page);
  const expected = await prepareZipSmoke(page);
  expect(expected).toEqual({ duration: 0.25, fps: 24, frameCount: 6 });
  const zipBytes = await downloadBytes(page, /^Export ZIP PNG$/i);
  const validation = validateFrameZip(zipBytes, { ...dimensions, frameCount: expected.frameCount });

  expect(validation.frameCount).toBe(expected.frameCount);
  expect(validation.frames).toHaveLength(expected.frameCount);
  await waitForExportComplete(page);

  const recovery = await setNormalizedTime(page, 0.5);
  const recoveryMetadata = parsePngMetadata(dataUrlToBytes(recovery.dataUrl));
  expect(recoveryMetadata).toMatchObject(dimensions);
  expect((await captureCanvasPng(page)).dataUrl).toMatch(/^data:image\/png;base64,/);
});
