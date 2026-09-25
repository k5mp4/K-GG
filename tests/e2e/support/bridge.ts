import type { Page } from '@playwright/test';
import type {
  KggE2ECapture,
  KggE2EContextLifecycleResult,
  KggE2EDiagnostics,
  KggE2EExportState,
  KggE2EBridge,
  KggE2ERgbaCapture,
  KggE2EResourceLifecycleResult,
} from '../../../src/types/e2eBridge';

function getE2EBridgeTimeoutMs(): number {
  const configured = Number(process.env.KGG_E2E_BOOT_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return process.env.CI ? 120_000 : 30_000;
}

export async function waitForE2EBridge(page: Page): Promise<void> {
  await page.waitForFunction(
    () => Boolean(window.__KGG_E2E__),
    undefined,
    { timeout: getE2EBridgeTimeoutMs() },
  );
}

export async function waitForWebGLReady(page: Page): Promise<KggE2EDiagnostics> {
  const timeoutMs = getE2EBridgeTimeoutMs();
  return page.evaluate(async timeout => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available; start the app with VITE_KGG_E2E=1');
    return bridge.waitForWebGLReady({ timeoutMs: timeout });
  }, timeoutMs);
}

export async function pauseAnimation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    bridge.pauseAnimation();
  });
}

export async function setNormalizedTime(page: Page, normalizedTime: number): Promise<KggE2ECapture> {
  return page.evaluate(async value => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.setNormalizedTime(value);
  }, normalizedTime);
}

export async function captureCanvasPng(page: Page): Promise<KggE2ECapture> {
  return page.evaluate(() => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.captureCanvasPng();
  });
}

export async function captureCanvasRgba(page: Page): Promise<KggE2ERgbaCapture> {
  return page.evaluate(() => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.captureCanvasRgba();
  });
}

export async function exerciseResourceLifecycle(page: Page): Promise<KggE2EResourceLifecycleResult> {
  return page.evaluate(async () => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.exerciseResourceLifecycle();
  });
}

export async function loseAndRestoreContext(page: Page): Promise<KggE2EContextLifecycleResult> {
  return page.evaluate(async () => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.loseAndRestoreContext();
  });
}

export async function prepareZipSmoke(page: Page): Promise<Awaited<ReturnType<KggE2EBridge['prepareZipSmoke']>>> {
  return page.evaluate(() => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.prepareZipSmoke();
  });
}

export async function waitForExportComplete(page: Page): Promise<KggE2EExportState> {
  return page.evaluate(async () => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available');
    return bridge.waitForExportComplete();
  });
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error('Expected a data URL with a payload');
  return Uint8Array.from(Buffer.from(dataUrl.slice(separator + 1), 'base64'));
}
