import { afterEach, describe, expect, it, vi } from 'vitest';
import { importPresetFile } from './importPresetFile';
import { MAX_PRESET_PACKAGE_BYTES } from './presetArchive';

describe('preset file worker lifecycle', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('rejects oversized files before reading or starting a worker', async () => {
    const worker = vi.fn();
    const arrayBuffer = vi.fn();
    vi.stubGlobal('Worker', worker);
    await expect(importPresetFile({ size: MAX_PRESET_PACKAGE_BYTES + 1, arrayBuffer } as unknown as File)).rejects.toThrow('too large');
    expect(worker).not.toHaveBeenCalled();
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it('terminates a worker that does not finish within ten seconds', async () => {
    vi.useFakeTimers();
    const terminate = vi.fn();
    vi.stubGlobal('Worker', class { terminate = terminate; postMessage = vi.fn(); });
    const result = importPresetFile({ size: 1 } as File);
    const rejection = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('terminates on cancellation without waiting for decompression', async () => {
    const terminate = vi.fn();
    vi.stubGlobal('Worker', class { terminate = terminate; postMessage = vi.fn(); });
    const controller = new AbortController();
    const result = importPresetFile({ size: 1 } as File, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(terminate).toHaveBeenCalledOnce();
  });
});
