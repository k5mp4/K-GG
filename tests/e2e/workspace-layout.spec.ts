import { test, expect } from './fixtures';
import { pauseAnimation, waitForE2EBridge } from './support/bridge';

test('workspace adapts to small screens while preserving editors and preview', async ({ page, browserErrors: _browserErrors }, testInfo) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForE2EBridge(page);
  await pauseAnimation(page);
  const workspace = page.locator('[data-workspace-layout]');
  const canvas = await page.locator('#kgg-preview-canvas').elementHandle();
  const properties = page.locator('#property-modules-panel');
  const settings = page.locator('#gradient-settings-panel');

  await expect(workspace).toHaveAttribute('data-workspace-layout', 'overlay');
  await expect(properties.getByRole('button')).toHaveCount(0); // Closed editors are inert.
  expect(await properties.locator('button').first().evaluate(button => {
    button.focus();
    return document.activeElement === button;
  })).toBe(false);
  await page.getByRole('navigation').getByRole('button', { name: /Export/ }).click();
  await expect(properties.getByRole('button', { name: 'Close Property Modules' })).toBeVisible();
  await expect(properties.getByRole('button', { name: 'Close Property Modules' })).toBeFocused();
  expect(await properties.locator('[data-module="diffuse"] input').first().evaluate(input => {
    input.focus();
    return document.activeElement === input;
  })).toBe(false);
  await properties.getByRole('textbox').first().fill('responsive-check');
  await properties.getByRole('button', { name: 'Close Property Modules' }).click();
  await expect(page.getByRole('navigation').getByRole('button', { name: /Export/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Open K-GG', exact: true }).click();
  await expect(settings.getByRole('button', { name: 'Close K-GG', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open K-GG', exact: true })).toBeFocused();
  // Below the dock breakpoint the Layers live in the left overlay panel, never on the preview.
  await expect(page.locator('[data-canvas-workspace] [data-effect-stack-workspace]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open layers', exact: true }).click();
  const layers = properties.locator('[data-effect-stack-workspace]');
  await expect(layers).toBeVisible();
  await expect(properties.getByRole('radio', { name: 'Layers' })).toHaveAttribute('aria-checked', 'true');
  const layerTitles = layers.locator('.effect-stack-row__title');
  const originalOrder = await layerTitles.allTextContents();
  const dragHandle = await layers.locator('.effect-stack-row__drag-handle').first().boundingBox();
  expect(dragHandle).not.toBeNull();
  await page.mouse.move(dragHandle!.x + 5, dragHandle!.y + 5);
  await page.mouse.down();
  await expect(layers).toBeVisible();
  await page.mouse.move(dragHandle!.x + 5, dragHandle!.y + 43, { steps: 5 });
  await page.mouse.up();
  await expect(layers).toBeVisible();
  await expect.poll(() => layerTitles.allTextContents()).toEqual([originalOrder[1], originalOrder[0], ...originalOrder.slice(2)]);
  const rows = layers.locator('#kgg-effect-stack-content');
  const previewWidthBeforeScroll = (await page.locator('#kgg-preview-canvas').boundingBox())!.width;
  await rows.hover({ position: { x: 100, y: 100 } });
  await page.mouse.wheel(0, 500);
  await expect.poll(() => rows.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await page.locator('#kgg-preview-canvas').boundingBox())!.width).toBeCloseTo(previewWidthBeforeScroll, 1);
  await layers.getByText('Texture', { exact: true }).scrollIntoViewIfNeeded();
  await expect(layers.getByText('Texture', { exact: true })).toBeInViewport();
  await layers.getByText('Texture', { exact: true }).click();
  await expect(layers).toBeHidden();
  await expect(properties.getByRole('radio', { name: 'Properties' })).toHaveAttribute('aria-checked', 'true');
  await expect(properties.getByRole('button', { name: 'Close Property Modules' })).toBeVisible();
  await expect(properties.locator('[data-module="postprocess"]')).not.toHaveAttribute('inert');
  await properties.getByRole('button', { name: 'Close Property Modules' }).click();
  await page.getByRole('navigation').getByRole('button', { name: /Export/ }).click();
  await properties.getByRole('button', { name: 'Close Property Modules' }).click();

  await page.getByRole('button', { name: 'Open Animation', exact: true }).click();
  const timeline = page.locator('#animation-timeline-panel');
  await expect(timeline).toBeVisible();
  await expect.poll(async () => (await timeline.boundingBox())?.height ?? 999).toBeLessThanOrEqual(218);
  const preview = page.locator('[data-canvas-workspace]');
  await expect.poll(async () => (await preview.boundingBox())?.height ?? 0).toBeGreaterThan(200);
  await page.screenshot({ path: testInfo.outputPath('workspace-640x480-timeline.png') });
  await page.getByRole('button', { name: 'Close Animation', exact: true }).click();

  for (const size of [{ width: 320, height: 568 }, { width: 800, height: 600 }, { width: 1024, height: 720 }, { width: 1440, height: 960 }]) {
    await page.setViewportSize(size);
    await expect(workspace).toHaveAttribute('data-workspace-layout', size.width < 1000 ? 'overlay' : 'docked');
    await expect.poll(async () => (await preview.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(Math.min(320, size.width));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    await expect(page.getByRole('navigation').getByRole('button', { name: /Export/ })).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: testInfo.outputPath(`workspace-${size.width}x${size.height}.png`) });
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('navigation').getByRole('button', { name: /Preset/ }).click();
  await expect(properties.getByRole('button', { name: 'Close Property Modules' })).toBeInViewport();
  await expect.poll(async () => {
    const panel = await properties.boundingBox();
    const module = await properties.locator('[data-module="preset"]').boundingBox();
    return Math.abs((module?.x ?? -1000) - (panel?.x ?? 0));
  }).toBeLessThan(1);
  await page.screenshot({ path: testInfo.outputPath('workspace-320-panel.png') });
  await page.getByRole('navigation').getByRole('button', { name: /Export/ }).click();
  await expect(properties.getByRole('textbox').first()).toHaveValue('responsive-check');

  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(workspace).toHaveAttribute('data-workspace-layout', 'docked');
  const resizeHandle = await properties.locator('[class*="cursor-col-resize"]').boundingBox();
  expect(resizeHandle).not.toBeNull();
  await page.mouse.move(resizeHandle!.x + 2, resizeHandle!.y + 100);
  await page.mouse.down();
  await page.mouse.move(resizeHandle!.x + 102, resizeHandle!.y + 100);
  await page.mouse.up();
  await expect.poll(async () => (await properties.boundingBox())!.width).toBeCloseTo(388, 0);
  const preferredWidth = (await properties.boundingBox())!.width;
  await page.getByRole('button', { name: 'Open Animation', exact: true }).click();
  await expect.poll(async () => (await timeline.boundingBox())!.height).toBeGreaterThanOrEqual(300);
  // The open animation is still easing the height, so wait for it before reading the preferred height.
  await expect.poll(() => timeline.evaluate(element => element.parentElement!.getAnimations().length)).toBe(0);
  const preferredTimelineHeight = (await timeline.boundingBox())!.height;
  await page.setViewportSize({ width: 640, height: 480 });
  await expect.poll(async () => (await timeline.boundingBox())!.height).toBeLessThanOrEqual(218);
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect.poll(async () => (await timeline.boundingBox())!.height).toBeCloseTo(preferredTimelineHeight, 0);
  await expect.poll(async () => (await properties.boundingBox())!.width).toBeCloseTo(preferredWidth, 0);
});

test('docked Layers column stays beside the preview regardless of timeline and window size', async ({ page, browserErrors: _browserErrors }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForE2EBridge(page);
  await pauseAnimation(page);
  const workspace = page.locator('[data-workspace-layout]');
  const layers = page.locator('[data-effect-stack-workspace]');
  const preview = page.locator('[data-canvas-workspace]');
  const properties = page.locator('#property-modules-panel');

  await expect(workspace).toHaveAttribute('data-workspace-layout', 'docked');
  await expect(layers).toHaveAttribute('data-layers-presentation', 'column');
  await expect(preview.locator('[data-effect-stack-workspace]')).toHaveCount(0);
  const layersBox = (await layers.boundingBox())!;
  const propertiesBox = (await properties.boundingBox())!;
  const previewBox = (await preview.boundingBox())!;
  // Layers | Properties | Preview, side by side without overlap.
  expect(layersBox.x + layersBox.width).toBeLessThanOrEqual(propertiesBox.x + 1);
  expect(propertiesBox.x + propertiesBox.width).toBeLessThanOrEqual(previewBox.x + 1);
  // All layer names fit without truncation.
  expect(await layers.locator('.effect-stack-row__title').evaluateAll(titles => titles.filter(title => title.scrollWidth > title.clientWidth).map(title => title.textContent))).toEqual([]);
  // The Color Histogram is opt-in.
  await expect(page.locator('#color-histogram-content')).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Animation', exact: true }).click();
  await expect(page.locator('#animation-timeline-panel')).toBeVisible();
  await expect(layers).toHaveAttribute('data-layers-presentation', 'column');
  await page.getByRole('button', { name: 'Close Animation', exact: true }).click();

  await layers.getByRole('button', { name: 'Collapse layers to icons' }).click();
  await expect(layers).toHaveAttribute('data-layers-presentation', 'rail');
  await layers.getByRole('button', { name: /^Glass:/ }).click();
  await expect(properties.locator('[data-module="postprocess"]')).not.toHaveAttribute('inert');
  await layers.getByRole('button', { name: 'Expand layers' }).click();
  await expect(layers).toHaveAttribute('data-layers-presentation', 'column');

  // A narrower dock workspace falls back to the rail first, and returns to the column when it widens.
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(layers).toHaveAttribute('data-layers-presentation', 'rail');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(layers).toHaveAttribute('data-layers-presentation', 'column');
});
