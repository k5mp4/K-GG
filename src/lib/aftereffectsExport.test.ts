import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserAfterEffectsService } from '../adapters/browser/afterEffectsService';

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('browserAfterEffectsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks the existing Bridge status endpoint with a bounded request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ running: true }));

    await expect(browserAfterEffectsService.isAvailable()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7749/api/ae/status',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('keeps the existing PNG endpoint contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'ok' }));
    const blob = new Blob(['png']);

    await expect(browserAfterEffectsService.importImage(blob, 'test image')).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7749/api/ae/import-image?name=test+image',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      }),
    );
  });

  it('keeps the existing MOV/MP4 Blob endpoint contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 'ok' }));
    const blob = new Blob(['video'], { type: 'video/mp4' });

    await expect(browserAfterEffectsService.importVideo(blob, 'mp4', 'test video')).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7749/api/ae/import-video?ext=mp4&name=test+video',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'video/mp4' },
        body: blob,
      }),
    );
  });

  it('does not expose a Tauri native path to the browser Bridge', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(browserAfterEffectsService.importVideo({
      kind: 'native-path',
      path: 'C:/Temp/kagaribi-grad/output.mov',
      mimeType: 'video/quicktime',
      release: vi.fn().mockResolvedValue(undefined),
    }, 'mov')).resolves.toBe('unsupported');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to automatic save directory when Bridge does not respond', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Bridge unavailable'));

    await expect(browserAfterEffectsService.getSaveDir()).resolves.toEqual({
      mode: 'auto',
      path: null,
      name: null,
    });
  });

  it('preserves explicit AE status values returned by the Bridge', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ status: 'composition-unavailable' }),
    );

    await expect(browserAfterEffectsService.ping()).resolves.toBe('composition-unavailable');
  });
});
