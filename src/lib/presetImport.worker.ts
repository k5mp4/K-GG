import { decodePresetPackage } from './presetLibrary';
import { MAX_PRESET_PACKAGE_BYTES } from './presetArchive';

self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const file = event.data;
    if (file.size > MAX_PRESET_PACKAGE_BYTES) throw new Error('Preset package is too large');
    const library = decodePresetPackage(new Uint8Array(await file.arrayBuffer()), file.name);
    self.postMessage({ library });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Preset import failed' });
  }
};
