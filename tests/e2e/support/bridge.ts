import type { Page } from '@playwright/test';
import type {
  KggE2ECapture,
  KggE2EDiagnostics,
  KggE2EExportState,
} from '../../../src/types/e2eBridge';

export async function waitForWebGLReady(page: Page): Promise<KggE2EDiagnostics> {
  return page.evaluate(async () => {
    const bridge = window.__KGG_E2E__;
    if (!bridge) throw new Error('K-GG E2E bridge is not available; start the app with VITE_KGG_E2E=1');
    return bridge.waitForWebGLReady();
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

export async function prepareZipSmoke(page: Page): Promise<{ duration: 1; fps: 24; frameCount: 24 }> {
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
