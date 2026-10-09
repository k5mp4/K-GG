import { test, expect } from './fixtures';
import { pauseAnimation, waitForE2EBridge, waitForWebGLReady } from './support/bridge';
import type { Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

async function seedVjPresets(page: Page, includeMalformed = false) {
  await page.addInitScript(includeMalformed => {
    const preset = (id: string, name: string, color: string, amount: number) => ({
      id, name, createdAt: 1, state: {
        gradient: { gradientType: 'linear', stops: [{ position: 0, color }, { position: 1, color: '#ffffff' }] },
        noiseDistortion: { enabled: true, type: 'simplex', amount, scale: 1, noiseSeed: 17 },
        keyframeTracks: { 'noiseDistortion.amount': { propertyId: 'noiseDistortion.amount', label: 'Amount', mode: 'keys', enabled: true,
          keyframes: [{ id: 'a', time: 0, value: amount, interpolation: 'linear' }, { id: 'b', time: 1, value: amount + 0.1, interpolation: 'linear' }] } },
        effectPipeline: { version: 'stack-v2', effectStack: [{ kind: 'noise', enabled: true }], selectedKind: 'noise' },
        resolution: { width: 800, height: 800 },
      },
    });
    localStorage.setItem('kgg.ui-language', 'en');
    const presets: unknown[] = [preset('vj-a', 'VJ Cue A', '#ff3300', 0.1), preset('vj-b', 'VJ Cue B', '#3366ff', 0.2)];
    if (includeMalformed) {
      const malformed = preset('vj-bad', 'VJ Broken Cue', '#ff0000', 0.8);
      presets.push({ ...malformed, state: { ...malformed.state, keyframeTracks: { 'noiseDistortion.amount': null } } });
    }
    localStorage.setItem('kagaribi15_presets', JSON.stringify(presets));
  }, includeMalformed);
}

test('VJ controls preserve the canvas, output size and default editor', async ({ page, browserErrors: _browserErrors }, testInfo) => {
  await seedVjPresets(page);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForE2EBridge(page);
  await waitForWebGLReady(page);
  await pauseAnimation(page);
  const canvas = await page.locator('#kgg-preview-canvas').elementHandle();
  const dimensions = await canvas!.evaluate(element => ({ width: (element as HTMLCanvasElement).width, height: (element as HTMLCanvasElement).height }));
  await expect(page.locator('[data-layout-mode]')).toHaveAttribute('data-layout-mode', 'editor');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('radio', { name: 'VJ performance', exact: true }).click();
  const deck = page.locator('[data-vj-deck]');
  await expect(deck).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  expect(await deck.evaluate(element => element.getBoundingClientRect().height)).toBeLessThanOrEqual(270);
  await expect(page.getByRole('button', { name: 'Start auto switching' })).toBeDisabled();

  for (const id of ['vj-a', 'vj-b']) {
    await deck.getByRole('combobox', { name: 'Add from library' }).selectOption(id);
    await deck.getByRole('button', { name: 'Add', exact: true }).click();
  }
  await deck.getByRole('button', { name: '01 VJ Cue A', exact: true }).click();
  await expect(deck.getByRole('button', { name: '01 VJ Cue A', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
  expect(await canvas!.evaluate(element => element === document.querySelector('#kgg-preview-canvas'))).toBe(true);
  expect(await canvas!.evaluate(element => ({ width: (element as HTMLCanvasElement).width, height: (element as HTMLCanvasElement).height }))).toEqual(dimensions);
  await expect(deck.locator('.vj-cue').first()).toContainText('VJ Cue B');

  const noise = deck.locator('[data-vj-effect="noise"]');
  await expect(deck.locator('[data-vj-effect]')).toHaveCount(1);
  await expect(deck.locator('[data-vj-effect="stretch"]')).toHaveCount(0);
  await noise.getByRole('button', { name: 'Details / ranges', exact: true }).click();
  await noise.getByRole('spinbutton', { name: 'Random minimum for Amount', exact: true }).fill('0.23');
  await noise.getByRole('spinbutton', { name: 'Random maximum for Amount', exact: true }).fill('0.23');
  await deck.getByRole('button', { name: 'Bounded random', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/store/gradientStore.ts';
    const store: typeof import('../../src/store/gradientStore') = await import(/* @vite-ignore */ modulePath);
    return store.useGradientStore.getState().noiseDistortion.amount;
  })).toBe(0.23);
  await deck.getByRole('button', { name: 'Undo randomization', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/store/gradientStore.ts';
    const store: typeof import('../../src/store/gradientStore') = await import(/* @vite-ignore */ modulePath);
    return store.useGradientStore.getState().noiseDistortion.amount;
  })).toBe(0.1);

  await page.setViewportSize({ width: 1920, height: 270 });
  await expect(deck.getByRole('button', { name: 'Restore loaded values', exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('vj-1920x270.png') });
  await deck.getByRole('spinbutton', { name: 'BPM', exact: true }).fill('240');
  await page.evaluate(async () => {
    const path = '/src/store/gradientStore.ts';
    const { useGradientStore } = await import(path);
    const root = window as typeof window & { vjAutoAmounts?: number[]; vjStopObserving?: () => void };
    root.vjAutoAmounts = [];
    root.vjStopObserving = useGradientStore.subscribe((state: { presetName: string; noiseDistortion: { amount: number } }, previous: { presetName: string }) => {
      if (state.presetName === 'VJ Cue B' && previous.presetName !== state.presetName) root.vjAutoAmounts!.push(state.noiseDistortion.amount);
    });
  });
  await deck.getByRole('button', { name: 'Start auto switching' }).click();
  await expect(deck.getByRole('button', { name: '02 VJ Cue B', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
  await deck.getByRole('button', { name: 'Stop auto switching' }).click();
  expect(await page.evaluate(() => (window as typeof window & { vjAutoAmounts: number[] }).vjAutoAmounts)).toEqual([0.23]);
  await page.evaluate(() => (window as typeof window & { vjStopObserving?: () => void }).vjStopObserving?.());
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeVisible();
  await expect(deck.locator('.vj-cue').first()).toContainText('VJ Cue A');
  await expect(deck.locator('.vj-cue').nth(1)).toContainText('VJ Cue B');

  await noise.getByRole('spinbutton', { name: 'Amount', exact: true }).fill('0.55');
  await deck.getByRole('button', { name: 'Restore loaded values', exact: true }).click();
  const readAmountTrack = () => page.evaluate(async () => {
    const path = '/src/store/gradientStore.ts';
    const { useGradientStore } = await import(path);
    const state = useGradientStore.getState();
    const track = state.keyframeTracks['noiseDistortion.amount'];
    return { amount: state.noiseDistortion.amount, mode: track.mode, enabled: track.enabled };
  });
  await expect.poll(readAmountTrack).toEqual({ amount: 0.23, mode: 'static', enabled: false });
  await expect(deck.getByRole('button', { name: 'Restore preset animation', exact: true })).toBeEnabled();
  await deck.getByRole('button', { name: 'Restore preset animation', exact: true }).click();
  await expect.poll(readAmountTrack).toEqual({ amount: 0.23, mode: 'keys', enabled: true });

  await noise.getByRole('button', { name: 'Main controls', exact: true }).click();
  await page.evaluate(async () => {
    const path = '/src/application/commands.ts';
    const { applicationCommands } = await import(path);
    const enabled = ['noise', 'slit', 'stretch', 'distort', 'mirror', 'kaleidoscope', 'voronoi', 'diffuse'];
    const storePath = '/src/store/gradientStore.ts';
    const { useGradientStore } = await import(storePath);
    applicationCommands.setEffectPipeline({ effectStack: useGradientStore.getState().effectPipeline.effectStack.map((layer: { kind: string }) => ({ ...layer, enabled: enabled.includes(layer.kind) })) });
  });
  await expect(deck.locator('[data-vj-effect]')).toHaveCount(8);
  for (const card of await deck.locator('[data-vj-effect]').all()) await expect(card).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('vj-eight-effects-1920x270.png') });
  const stretch = deck.locator('[data-vj-effect="stretch"]');
  await stretch.getByRole('spinbutton', { name: 'Variation', exact: true }).fill('0.61');
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/store/gradientStore.ts';
    const { useGradientStore } = await import(path);
    return useGradientStore.getState().stretch.variation;
  })).toBe(0.61);
  await stretch.getByRole('slider', { name: 'Variation', exact: true }).press('End');
  await expect.poll(() => page.evaluate(async () => {
    const path = '/src/store/gradientStore.ts';
    const { useGradientStore } = await import(path);
    return useGradientStore.getState().stretch.variation;
  })).toBe(1);
  const glowColor = await page.evaluate(async () => {
    const modulePath = '/src/store/gradientStore.ts';
    const store: typeof import('../../src/store/gradientStore') = await import(/* @vite-ignore */ modulePath);
    return store.useGradientStore.getState().stretch.glowTint;
  });
  await stretch.getByRole('button', { name: 'Details / ranges', exact: true }).click();
  await stretch.getByRole('checkbox', { name: 'Glow Enabled', exact: true }).check();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('kgg_vj_settings')!).rules['stretch.glowTint']?.colors)).toEqual([glowColor]);

  await page.setViewportSize({ width: 640, height: 270 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(640);
  await expect(deck.getByRole('button', { name: 'Return to editor' })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('vj-640x270.png') });
  await deck.getByRole('button', { name: 'Return to editor' }).click();
  await expect(page.locator('[data-layout-mode]')).toHaveAttribute('data-layout-mode', 'editor');
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.getByRole('navigation')).toBeVisible();
  expect(await canvas!.evaluate(element => element === document.querySelector('#kgg-preview-canvas'))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kagaribi15_presets')!)[0].state.noiseDistortion.amount)).toBe(0.1);

  await page.evaluate(async () => {
    const loaderPath = '/src/lib/applyPreset.ts';
    const libraryPath = '/src/lib/presetLibraryCache.ts';
    const { applyPresetToDocument } = await import(loaderPath);
    const { getPresetLibrarySnapshot } = await import(libraryPath);
    applyPresetToDocument(getPresetLibrarySnapshot().library.presets.find((preset: { id: string }) => preset.id === 'vj-a'));
  });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('radio', { name: 'VJ performance', exact: true }).click();
  await expect(deck.locator('.vj-live-label')).toContainText('VJ Cue A');
  await expect(deck.locator('.vj-load-preset[aria-pressed="true"]')).toHaveCount(0);
  await expect(deck.locator('.vj-cue').first()).toContainText('VJ Cue A');
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeVisible();
});

test('failed or cancelled preload preserves the live document and ready cues remain usable', async ({ page, browserErrors: _browserErrors }) => {
  await seedVjPresets(page, true);
  await page.addInitScript(() => localStorage.setItem('kgg_vj_settings', JSON.stringify({ layoutMode: 'vj', presetIds: ['vj-a', 'vj-b', 'vj-bad'] })));
  await page.setViewportSize({ width: 1920, height: 270 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForE2EBridge(page);
  await waitForWebGLReady(page);
  await pauseAnimation(page);
  const deck = page.locator('[data-vj-deck]');
  const readDocument = () => page.evaluate(async () => {
    const path = '/src/store/gradientStore.ts';
    const store: typeof import('../../src/store/gradientStore') = await import(path);
    const { gradient, noiseDistortion, presetName, effectPipeline, keyframeTracks } = store.useGradientStore.getState();
    return JSON.stringify({ gradient, noiseDistortion, presetName, effectPipeline, keyframeTracks });
  });
  const before = await readDocument();
  await page.evaluate(async () => {
    const path = '/src/lib/shaderWarmup.ts';
    const warmup = await import(path);
    warmup.startShaderWarmup({ settle: async () => 'failed', request: () => {}, canWarmInBackground: () => false,
      isBusy: () => false, getRequiredKeys: () => [], getRequiredKeysWithLayer: () => [] }, { plan: [] });
  });
  await expect(deck.getByRole('button', { name: '02 VJ Cue B', exact: true })).toBeDisabled();
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeDisabled();
  await expect(deck.getByRole('status')).toContainText('Preset shaders are not ready');
  expect(await readDocument()).toBe(before);

  await page.evaluate(async () => {
    const path = '/src/lib/shaderWarmup.ts';
    const warmup = await import(path);
    const root = window as typeof window & { vjResolvePrepare?: () => void };
    const pending = new Promise<'ready'>(resolve => { root.vjResolvePrepare = () => resolve('ready'); });
    warmup.startShaderWarmup({ settle: () => pending, request: () => {}, canWarmInBackground: () => false,
      isBusy: () => false, getRequiredKeys: () => [], getRequiredKeysWithLayer: () => [] }, { plan: [] });
  });
  await expect(deck.getByRole('button', { name: '02 VJ Cue B', exact: true })).toBeDisabled();
  await deck.getByRole('button', { name: 'Return to editor' }).click();
  await expect(page.locator('[data-layout-mode]')).toHaveAttribute('data-layout-mode', 'editor');
  await page.evaluate(() => (window as typeof window & { vjResolvePrepare?: () => void }).vjResolvePrepare?.());
  expect(await readDocument()).toBe(before);

  await page.evaluate(async () => {
    const path = '/src/lib/shaderWarmup.ts';
    const warmup = await import(path);
    warmup.startShaderWarmup({ settle: async () => 'ready', request: () => {}, canWarmInBackground: () => false,
      isBusy: () => false, getRequiredKeys: () => [], getRequiredKeysWithLayer: () => [] }, { plan: [] });
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('radio', { name: 'VJ performance', exact: true }).click();
  await expect(deck.getByRole('button', { name: '01 VJ Cue A', exact: true })).toBeEnabled();
  await expect(deck.getByRole('button', { name: '03 VJ Broken Cue', exact: true })).toBeDisabled();
  await expect(deck.getByRole('status')).toContainText('The preset could not be applied.');
  expect(await readDocument()).toBe(before);
  await deck.getByRole('button', { name: '01 VJ Cue A', exact: true }).click();
  await expect(deck.locator('.vj-live-label')).toContainText('VJ Cue A');
  await deck.getByRole('button', { name: 'Remove VJ Broken Cue from performance list', exact: true }).click();
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeEnabled();
  await deck.getByRole('spinbutton', { name: 'BPM', exact: true }).fill('999');
  await deck.getByRole('button', { name: 'Start auto switching' }).click();
  await expect(deck.getByRole('button', { name: '02 VJ Cue B', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await deck.getByRole('button', { name: 'Stop auto switching' }).click();
  const stopped = await readDocument();
  await page.waitForTimeout(550);
  expect(await readDocument()).toBe(stopped);
});

test('saved folders preload once and loop with synchronous cue changes', async ({ page, browserErrors: _browserErrors }, testInfo) => {
  await seedVjPresets(page);
  await page.addInitScript(() => {
    const [a, b] = JSON.parse(localStorage.getItem('kagaribi15_presets')!);
    localStorage.setItem('kagaribi15_presets', JSON.stringify({ format: 'kgg-preset-library', version: 2,
      folders: [{ id: 'set', name: 'Performance Set', parentId: null, order: 0, createdAt: 1 },
        { id: 'child', name: 'Encore', parentId: 'set', order: 0, createdAt: 1 }],
      presets: [{ ...a, folderId: 'set', order: 0 }, { ...b, folderId: 'set', order: 1 },
        { ...a, id: 'outside', name: 'Outside Cue', folderId: null, order: 0 },
        { ...b, id: 'nested', name: 'Encore Cue', folderId: 'child', order: 2 }],
    }));
    localStorage.setItem('kgg_vj_settings', JSON.stringify({ layoutMode: 'vj', presetIds: ['outside'] }));
  });
  await page.setViewportSize({ width: 1920, height: 270 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForE2EBridge(page);
  await waitForWebGLReady(page);
  await pauseAnimation(page);
  const deck = page.locator('[data-vj-deck]');
  const source = deck.getByRole('combobox', { name: 'Performance source', exact: true });
  await source.selectOption('folder:set');
  const rows = deck.locator('.vj-load-preset');
  await expect(rows).toHaveText(['01 VJ Cue A', '02 VJ Cue B']);
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeEnabled({ timeout: 60_000 });
  await expect(deck.getByRole('button', { name: 'Remove VJ Cue A from performance list', exact: true })).toHaveCount(0);

  const result = await page.evaluate(async () => {
    const storePath = '/src/store/gradientStore.ts';
    const warmupPath = '/src/lib/shaderWarmup.ts';
    const store = await import(storePath);
    const warmup = await import(warmupPath);
    const host = warmup.getShaderWarmupContext();
    const settle = host.settle;
    let prefetches = 0;
    host.settle = (...args: unknown[]) => { if (args[1] === 'prefetch') prefetches++; return settle(...args); };
    const changes: { expected: string; actual: string; cpuMs: number }[] = [];
    try {
      for (let index = 0; index < 20; index++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const cue = document.querySelectorAll<HTMLButtonElement>('.vj-load-preset')[index % 2];
        const start = performance.now();
        cue.click();
        changes.push({ expected: index % 2 ? 'VJ Cue B' : 'VJ Cue A',
          actual: store.useGradientStore.getState().presetName, cpuMs: performance.now() - start });
      }
    } finally { host.settle = settle; }
    return { changes, prefetches };
  });
  expect(result.changes.every(change => change.expected === change.actual)).toBe(true);
  expect(result.prefetches).toBe(0);
  const measurementPath = testInfo.outputPath('vj-synchronous-switch.json');
  writeFileSync(measurementPath, JSON.stringify(result, null, 2));
  await testInfo.attach('vj-synchronous-switch.json', { path: measurementPath, contentType: 'application/json' });
  for (const expected of ['VJ Cue A', 'VJ Cue B', 'VJ Cue A', 'VJ Cue B']) {
    await deck.getByRole('button', { name: 'Next preset', exact: true }).click();
    await expect(deck.locator('.vj-live-label')).toContainText(expected);
  }
  await deck.getByRole('spinbutton', { name: 'BPM', exact: true }).fill('240');
  await deck.getByRole('button', { name: 'Start auto switching' }).click();
  await expect(deck.getByRole('button', { name: '01 VJ Cue A', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(deck.getByRole('button', { name: '02 VJ Cue B', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await deck.getByRole('button', { name: 'Stop auto switching' }).click();
  await deck.getByRole('combobox', { name: 'Performance list', exact: true }).selectOption('shuffle');
  await deck.getByRole('button', { name: 'Next preset', exact: true }).click();
  await expect(deck.locator('.vj-live-label')).toContainText('VJ Cue A');
  await deck.getByRole('checkbox', { name: 'Subfolders', exact: true }).check();
  await expect(rows).toHaveCount(3);
  await expect(deck.getByRole('button', { name: '03 Encore Cue', exact: true })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('vj-folder-1920x270.png') });

  // Moving a saved preset out of the chosen folder updates the performance set.
  await page.evaluate(async () => {
    const path = '/src/lib/presetLibraryCache.ts';
    const cache = await import(path);
    cache.updatePresetLibraryCache((library: { presets: { id: string; folderId: string | null }[] }) => ({ ...library,
      presets: library.presets.map(preset => preset.id === 'vj-b' ? { ...preset, folderId: null } : preset) }));
  });
  await expect(rows).toHaveText(['01 VJ Cue A', '02 Encore Cue']);
  await source.selectOption('playlist');
  await expect(rows).toHaveText(['01 Outside Cue']);
  await expect(deck.getByRole('button', { name: 'Start auto switching' })).toBeDisabled();
});
