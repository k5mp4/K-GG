import { test, expect } from './fixtures';
import {
  exerciseResourceLifecycle,
  loseAndRestoreContext,
  waitForWebGLReady,
} from './support/bridge';

test('WebGL resource ledger survives effect/resize churn and context restore', async ({ page, browserErrors: _browserErrors }) => {
  await page.addInitScript(() => {
    const root = window as Window & { __KGG_E2E_EXPECT_CONTEXT_LIFECYCLE__?: boolean };
    root.__KGG_E2E_EXPECT_CONTEXT_LIFECYCLE__ = true;
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__KGG_E2E__), undefined, { timeout: 30_000 });
  const initial = await waitForWebGLReady(page);

  const lifecycle = await exerciseResourceLifecycle(page);
  expect(lifecycle.iterations).toHaveLength(3);
  expect(lifecycle.restoredCanvas).toEqual(initial.canvas);
  for (const iteration of lifecycle.iterations) {
    const resources = iteration.resources as { activeTotal: number; peakActiveTotal: number } | null;
    expect(resources).not.toBeNull();
    expect(resources?.activeTotal).toBeGreaterThan(0);
    expect(resources?.peakActiveTotal).toBeGreaterThanOrEqual(resources?.activeTotal ?? 0);
  }
  const restored = await loseAndRestoreContext(page);
  expect(restored.lost).toBe(true);
  expect(restored.restored).toBe(true);
  expect(restored.diagnostics.webgl.rendererReady).toBe(true);
  expect(restored.diagnostics.webgl.contextLost).toBe(false);
  expect(restored.diagnostics.resourceEvents.some(event => (
    typeof event === 'object' && event !== null && (event as { event?: unknown }).event === 'context-lost'
  ))).toBe(true);
  expect(restored.diagnostics.resourceEvents.some(event => (
    typeof event === 'object' && event !== null && (event as { event?: unknown }).event === 'context-restored'
  ))).toBe(true);
  expect(restored.diagnostics.resourceEvents.some(event => (
    typeof event === 'object'
    && event !== null
    && (event as { event?: unknown }).event === 'dispose'
    && ((event as { resources?: { activeTotal?: number } }).resources?.activeTotal === 0)
  ))).toBe(true);
});
