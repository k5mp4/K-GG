import { MAX_PRESET_PACKAGE_BYTES } from './presetArchive';
import type { PresetLibrary } from './presetLibrary';

export function importPresetFile(file: File, signal?: AbortSignal): Promise<PresetLibrary> {
  if (file.size > MAX_PRESET_PACKAGE_BYTES) return Promise.reject(new Error('Preset package is too large'));
  if (signal?.aborted) return Promise.reject(new DOMException('Import cancelled', 'AbortError'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./presetImport.worker.ts', import.meta.url), { type: 'module' });
    const dispose = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); worker.terminate(); };
    const abort = () => { dispose(); reject(new DOMException('Import cancelled', 'AbortError')); };
    const timer = setTimeout(() => { dispose(); reject(new Error('Preset import timed out')); }, 10_000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ library?: PresetLibrary; error?: string }>) => {
      dispose();
      if (event.data.library) resolve(event.data.library);
      else reject(new Error(event.data.error ?? 'Preset import failed'));
    };
    worker.onerror = () => { dispose(); reject(new Error('Preset import worker failed')); };
    try { worker.postMessage(file); } catch (error) { dispose(); reject(error); }
  });
}
