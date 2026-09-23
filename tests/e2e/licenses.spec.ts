import { test, expect } from './fixtures';

test('Licenses display locally and preset import runs in a real Worker', async ({ page, browserErrors: _browserErrors }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('kgg.ui-language', 'en'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Third-party licenses', exact: true }).click();
  const search = page.getByRole('searchbox');
  await search.fill('chroma-js');
  const component = page.locator('details').filter({ has: page.locator('summary', { hasText: 'chroma-js' }) });
  await component.locator('summary').click();
  await expect(component).toContainText('Redistribution and use in source and binary forms');
  await page.screenshot({ path: testInfo.outputPath('licenses.png') });
  await search.fill('gsap');
  await expect(page.getByText(/^0 \/ \d+$/)).toBeVisible();

  const imported = await page.evaluate(async () => {
    const libraryPath = '/src/lib/presetLibrary.ts';
    const importerPath = '/src/lib/importPresetFile.ts';
    const { createEmptyPresetLibrary, encodePresetExport } = await import(libraryPath);
    const { importPresetFile } = await import(importerPath);
    const source = createEmptyPresetLibrary();
    const exported = encodePresetExport(source, { kind: 'library' });
    return importPresetFile(new File([exported.bytes], exported.filename));
  });
  expect(imported).toMatchObject({ format: 'kgg-preset-library', version: 2, folders: [], presets: [] });
});
