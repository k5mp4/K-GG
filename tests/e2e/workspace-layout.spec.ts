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
  await page.getByRole('button', { name: 'Layers & histogram', exact: true }).click();
  const tools = page.locator('#workspace-tools');
  await expect(tools).toBeVisible();
  const layerTitles = tools.locator('.effect-stack-row__title');
  const originalOrder = await layerTitles.allTextContents();
  const dragHandle = await tools.locator('.effect-stack-row__drag-handle').first().boundingBox();
  expect(dragHandle).not.toBeNull();
  await page.mouse.move(dragHandle!.x + 5, dragHandle!.y + 5);
  await page.mouse.down();
  await expect(tools).toBeVisible();
  await page.mouse.move(dragHandle!.x + 5, dragHandle!.y + 43, { steps: 5 });
  await page.mouse.up();
  await expect(tools).toBeVisible();
  await expect.poll(() => layerTitles.allTextContents()).toEqual([originalOrder[1], originalOrder[0], ...originalOrder.slice(2)]);
  await expect(properties.getByRole('button')).toHaveCount(0);
  const previewWidthBeforeScroll = (await page.locator('#kgg-preview-canvas').boundingBox())!.width;
  await tools.hover({ position: { x: 100, y: 100 } });
  await page.mouse.wheel(0, 500);
  await expect.poll(() => tools.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await page.locator('#kgg-preview-canvas').boundingBox())!.width).toBeCloseTo(previewWidthBeforeScroll, 1);
  expect(await tools.evaluate(element => {
    const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 91 });
    element.dispatchEvent(down);
    const up = new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 91 });
    element.dispatchEvent(up);
    return down.defaultPrevented || up.defaultPrevented;
  })).toBe(false);
  await tools.getByText('Texture', { exact: true }).scrollIntoViewIfNeeded();
  await expect(tools.getByText('Texture', { exact: true })).toBeInViewport();
  await tools.getByText('Texture', { exact: true }).click();
  await expect(tools).toBeHidden();
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
  const preferredTimelineHeight = (await timeline.boundingBox())!.height;
  await page.setViewportSize({ width: 640, height: 480 });
  await expect.poll(async () => (await timeline.boundingBox())!.height).toBeLessThanOrEqual(218);
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect.poll(async () => (await timeline.boundingBox())!.height).toBe(preferredTimelineHeight);
  await expect.poll(async () => (await properties.boundingBox())!.width).toBeCloseTo(preferredWidth, 0);
});
