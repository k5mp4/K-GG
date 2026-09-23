import { Inflate, strFromU8 } from 'fflate';

export const MAX_PRESET_PACKAGE_BYTES = 32 * 1024 * 1024;
export const MAX_PRESET_MANIFEST_BYTES = 16 * 1024 * 1024;
const MANIFEST = 'preset-library.json';

/** Accept the single-file ZIP32 format exported by K-GG, without extracting paths. */
export function readPresetArchive(bytes: Uint8Array): string {
  const invalid = () => new Error('Invalid preset ZIP (expected one bounded preset-library.json)');
  if (bytes.length < 22 || bytes.length > MAX_PRESET_PACKAGE_BYTES) throw invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw invalid();
  if (end + 22 + view.getUint16(end + 20, true) !== bytes.length
    || view.getUint32(end + 4, true) !== 0
    || view.getUint16(end + 8, true) !== 1 || view.getUint16(end + 10, true) !== 1) throw invalid();
  const central = view.getUint32(end + 16, true);
  if (central + 46 > end || central + view.getUint32(end + 12, true) !== end
    || view.getUint32(central, true) !== 0x02014b50) throw invalid();
  const flags = view.getUint16(central + 8, true);
  const method = view.getUint16(central + 10, true);
  const size = view.getUint32(central + 24, true);
  const compressed = view.getUint32(central + 20, true);
  const nameLength = view.getUint16(central + 28, true);
  const extraLength = view.getUint16(central + 30, true);
  const local = view.getUint32(central + 42, true);
  if (view.getUint16(central + 6, true) >= 45 || flags & ~0x808 || ![0, 8].includes(method)
    || size > MAX_PRESET_MANIFEST_BYTES || compressed > MAX_PRESET_PACKAGE_BYTES
    || view.getUint16(central + 34, true) !== 0
    || central + 46 + nameLength + extraLength + view.getUint16(central + 32, true) !== end
    || strFromU8(bytes.subarray(central + 46, central + 46 + nameLength)) !== MANIFEST
    || local + 30 > central || view.getUint32(local, true) !== 0x04034b50
    || view.getUint16(local + 6, true) !== flags || view.getUint16(local + 8, true) !== method) throw invalid();
  const localNameLength = view.getUint16(local + 26, true);
  const start = local + 30 + localNameLength + view.getUint16(local + 28, true);
  if (start + compressed > central
    || strFromU8(bytes.subarray(local + 30, local + 30 + localNameLength)) !== MANIFEST) throw invalid();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let crc = 0xffffffff;
  const accept = (chunk: Uint8Array) => {
    length += chunk.length;
    if (length > size || length > MAX_PRESET_MANIFEST_BYTES) throw new Error('Preset manifest expands beyond its size limit');
    for (const byte of chunk) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    chunks.push(chunk);
  };
  const input = bytes.subarray(start, start + compressed);
  if (method === 0) accept(input);
  else {
    const inflate = new Inflate(accept);
    // Bound allocation per push even when the archive lies about expanded size.
    for (let offset = 0; offset < input.length; offset += 512) {
      inflate.push(input.subarray(offset, offset + 512), offset + 512 >= input.length);
    }
  }
  if (length !== size || ((crc ^ 0xffffffff) >>> 0) !== view.getUint32(central + 16, true)) throw invalid();
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
  return strFromU8(output);
}
