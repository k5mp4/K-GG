import { test as base, expect, type Page, type TestInfo } from '@playwright/test';

type BrowserError = {
  kind: 'console.error' | 'pageerror';
  message: string;
  location?: string;
};

type BrowserErrorCapture = {
  errors: BrowserError[];
};

type E2EPageBridge = {
  getDiagnostics: () => unknown | Promise<unknown>;
};

function isExpectedContextLifecycleDiagnostic(error: BrowserError): boolean {
  return Boolean(error.location?.includes('webgl-lint'))
    && /(?:loseContext\(\): CONTEXT_LOST_WEBGL|restoreContext\(\): INVALID_OPERATION|getParameter\((?:UNMASKED_VENDOR_WEBGL|UNMASKED_RENDERER_WEBGL|GPU_DISJOINT_EXT)|beginQuery\(TIME_ELAPSED_EXT,|endQuery\(TIME_ELAPSED_EXT\)|getQueryParameter\(WebGLQuery.*QUERY_RESULT_AVAILABLE)/i.test(error.message);
}

async function readUnhandledRejections(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = window as Window & { __KGG_E2E_UNHANDLED_REJECTIONS__?: string[] };
    return [...(root.__KGG_E2E_UNHANDLED_REJECTIONS__ ?? [])];
  });
}

async function readBridgeDiagnostics(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    const root = window as Window & { __KGG_E2E__?: E2EPageBridge };
    if (!root.__KGG_E2E__) return { available: false };
    return root.__KGG_E2E__.getDiagnostics();
  });
}

async function attachDiagnostics(
  page: Page,
  testInfo: TestInfo,
  capture: BrowserErrorCapture,
  unhandledRejections: string[],
): Promise<void> {
  const browser = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    devicePixelRatio: window.devicePixelRatio,
  })).catch(error => ({
    userAgent: 'unavailable',
    platform: 'unavailable',
    language: 'unavailable',
    devicePixelRatio: null,
    error: error instanceof Error ? error.message : String(error),
  }));
  const diagnostics = {
    browser: {
      project: testInfo.project.name,
      ...browser,
    },
    test: testInfo.title,
    errors: capture.errors,
    unhandledRejections,
    bridge: await readBridgeDiagnostics(page).catch(error => ({
      available: false,
      error: error instanceof Error ? error.message : String(error),
    })),
  };
  await testInfo.attach('kgg-e2e-diagnostics.json', {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2), 'utf8'),
    contentType: 'application/json',
  });
}

export const test = base.extend<{ browserErrors: BrowserErrorCapture }>({
  browserErrors: async ({ page }, runFixture, testInfo) => {
    const capture: BrowserErrorCapture = { errors: [] };
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: '',
    }));
    await page.route('https://fonts.gstatic.com/**', route => route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: '',
    }));
    await page.addInitScript(() => {
      const root = window as Window & { __KGG_E2E_UNHANDLED_REJECTIONS__?: string[] };
      root.__KGG_E2E_UNHANDLED_REJECTIONS__ = [];
      window.localStorage.setItem('kgg.ui-language', 'en');
      try {
        Object.defineProperty(window, 'showDirectoryPicker', {
          configurable: true,
          value: undefined,
        });
      } catch {
        // The browser may not expose this optional API as a configurable property.
      }
      window.addEventListener('unhandledrejection', event => {
        const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
        root.__KGG_E2E_UNHANDLED_REJECTIONS__?.push(reason);
      });
    });
    page.on('console', message => {
      if (message.type() !== 'error') return;
      if (/CONTEXT_LOST_WEBGL|restoreContext\(\): INVALID_OPERATION/i.test(message.text())) return;
      const location = message.location();
      capture.errors.push({
        kind: 'console.error',
        message: message.text(),
        ...(location.url ? { location: `${location.url}:${location.lineNumber}:${location.columnNumber}` } : {}),
      });
    });
    page.on('pageerror', error => {
      capture.errors.push({ kind: 'pageerror', message: error.message, location: error.stack });
    });

    await runFixture(capture);

    const unhandledRejections = await readUnhandledRejections(page).catch(() => []);
    const allowContextLifecycleDiagnostics = await page.evaluate(() => {
      const root = window as Window & { __KGG_E2E_EXPECT_CONTEXT_LIFECYCLE__?: boolean };
      return root.__KGG_E2E_EXPECT_CONTEXT_LIFECYCLE__ === true;
    }).catch(() => false);
    const actionableErrors = capture.errors.filter(error => (
      !allowContextLifecycleDiagnostics || !isExpectedContextLifecycleDiagnostic(error)
    ));
    if (
      capture.errors.length > 0
      || unhandledRejections.length > 0
      || testInfo.status !== testInfo.expectedStatus
    ) {
      await attachDiagnostics(page, testInfo, capture, unhandledRejections);
    }

    if (actionableErrors.length > 0 || unhandledRejections.length > 0) {
      const messages = [
        ...actionableErrors.map(error => `${error.kind}: ${error.message}`),
        ...unhandledRejections.map(error => `unhandledrejection: ${error}`),
      ];
      throw new Error(`Unexpected browser errors:\n${messages.join('\n')}`);
    }
  },
});

export { expect };
