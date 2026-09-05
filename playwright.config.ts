import { defineConfig } from '@playwright/test';

const port = Number(process.env.KGG_E2E_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;
const fixedGpu = process.env.KGG_E2E_GPU === '1';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  outputDir: 'test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 10_000,
  },
  reporter: 'list',
  // Keep WebGL/download-heavy tests in separate workers so Chromium's
  // renderer state cannot leak from one test into the next test.
  projects: [
    {
      name: 'export-png',
      testMatch: '**/export.spec.ts',
      grep: /Save PNG downloads a structurally valid image/,
    },
    {
      name: 'export-zip',
      testMatch: '**/export.spec.ts',
      grep: /PNG ZIP contains sequential valid frames and Preview recovers/,
    },
    {
      name: 'lifecycle',
      testMatch: '**/lifecycle.spec.ts',
    },
    {
      name: 'smoke',
      testMatch: '**/smoke.spec.ts',
    },
  ],
  use: {
    baseURL,
    acceptDownloads: true,
    headless: process.env.KGG_E2E_HEADLESS !== '0',
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // WebGL context loss/restore can leave Chromium's video encoder waiting
    // during context teardown. Traces and screenshots still preserve failure
    // evidence in CI without keeping a recorder open for every test.
    video: process.env.CI ? 'off' : 'retain-on-failure',
    launchOptions: {
      args: fixedGpu ? ['--enable-gpu'] : ['--use-angle=swiftshader'],
    },
  },
  webServer: {
    command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_KGG_E2E: '1',
    },
  },
});
