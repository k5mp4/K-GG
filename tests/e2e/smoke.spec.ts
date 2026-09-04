import { test, expect } from './fixtures';
import { dataUrlToBytes, setNormalizedTime, waitForWebGLReady } from './support/bridge';
import { parsePngMetadata } from './support/artifacts';

test('Preview renders deterministic checkpoints in a real browser Canvas', async ({ page, browserErrors: _browserErrors }) => {
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
  expect(diagnostics.webgl.rendererReady).toBe(true);
  expect(diagnostics.webgl.contextLost).toBe(false);

  for (const normalizedTime of [0, 0.5, 1]) {
    const capture = await setNormalizedTime(page, normalizedTime);
    const metadata = parsePngMetadata(dataUrlToBytes(capture.dataUrl));
    expect(capture.mimeType).toBe('image/png');
    expect(capture.width).toBe(dimensions.width);
    expect(capture.height).toBe(dimensions.height);
    expect(metadata).toMatchObject(dimensions);
    expect(metadata.byteLength).toBeGreaterThan(33);
  }
});
