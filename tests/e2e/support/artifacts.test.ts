import { Zip, ZipPassThrough, zipSync } from 'fflate';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodePngRgba, parsePngMetadata, validateFrameZip } from './artifacts';

function makePng(width = 4, height = 3): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);
  return bytes;
}

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const crcInput = new Uint8Array(typeBytes.byteLength + data.byteLength);
  crcInput.set(typeBytes);
  crcInput.set(data, typeBytes.byteLength);
  const chunk = new Uint8Array(12 + data.byteLength);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.byteLength);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.byteLength, crc32(crcInput));
  return chunk;
}

function makeEncodedPng(
  width: number,
  height: number,
  colorType: 2 | 6,
  rows: Uint8Array[],
): Uint8Array {
  const channels = colorType === 6 ? 4 : 3;
  const scanlines = new Uint8Array(height * (width * channels + 1));
  rows.forEach((row, index) => {
    if (row.byteLength !== width * channels) throw new Error('invalid test row');
    scanlines.set(row, index * (width * channels + 1) + 1);
  });
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header.set([8, colorType, 0, 0, 0], 8);
  const signature = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [pngChunk('IHDR', header), pngChunk('IDAT', Uint8Array.from(deflateSync(scanlines))), pngChunk('IEND', new Uint8Array())];
  const output = new Uint8Array(signature.byteLength + chunks.reduce((total, chunk) => total + chunk.byteLength, 0));
  output.set(signature);
  let offset = signature.byteLength;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function makeDuplicateFrameZip(): Uint8Array {
  const chunks: Uint8Array[] = [];
  const zip = new Zip((_error, data, final) => {
    if (data.length > 0) chunks.push(new Uint8Array(data));
    if (final) return;
  });
  for (const frame of [makePng(), makePng()]) {
    const entry = new ZipPassThrough('frame_0000.png');
    zip.add(entry);
    entry.push(frame, true);
  }
  zip.end();
  return Uint8Array.from(chunks.flatMap(chunk => [...chunk]));
}

describe('PNG artifact validation', () => {
  it('reads the PNG signature and IHDR dimensions', () => {
    expect(parsePngMetadata(makePng(800, 600))).toMatchObject({ width: 800, height: 600 });
  });

  it.each([
    ['wrong signature', Uint8Array.from([0, 1, 2, 3])],
    ['truncated IHDR', Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0])],
    ['zero width', makePng(0, 3)],
  ])('rejects %s', (_label, bytes) => {
    expect(() => parsePngMetadata(bytes)).toThrow();
  });

  it('decodes RGB PNG pixels into RGBA bytes', () => {
    const bytes = makeEncodedPng(2, 1, 2, [Uint8Array.from([255, 0, 0, 0, 128, 64])]);

    expect(decodePngRgba(bytes)).toMatchObject({
      width: 2,
      height: 1,
      rgba: Uint8Array.from([255, 0, 0, 255, 0, 128, 64, 255]),
    });
  });

  it('decodes RGBA PNG pixels and rejects corrupt chunk data', () => {
    const bytes = makeEncodedPng(1, 2, 6, [
      Uint8Array.from([1, 2, 3, 4]),
      Uint8Array.from([5, 6, 7, 8]),
    ]);
    expect(decodePngRgba(bytes).rgba).toEqual(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]));

    const corrupt = bytes.slice();
    corrupt[corrupt.length - 1] ^= 0xff;
    expect(() => decodePngRgba(corrupt)).toThrow(/CRC/i);
  });
});

describe('PNG frame ZIP validation', () => {
  it('validates sequential PNG entries and their dimensions', () => {
    const bytes = zipSync({
      'frame_0000.png': makePng(800, 800),
      'frame_0001.png': makePng(800, 800),
    });

    expect(validateFrameZip(bytes, { width: 800, height: 800, frameCount: 2 })).toMatchObject({
      frameCount: 2,
      names: ['frame_0000.png', 'frame_0001.png'],
    });
  });

  it('rejects missing frames, unexpected names, and dimension mismatches', () => {
    const bytes = zipSync({
      'frame_0000.png': makePng(800, 800),
      'frame_0002.png': makePng(640, 800),
    });

    expect(() => validateFrameZip(bytes, { width: 800, height: 800, frameCount: 2 })).toThrow(/frame_0001|sequential/i);
  });

  it('rejects duplicate frame names instead of silently overwriting one', () => {
    expect(() => validateFrameZip(makeDuplicateFrameZip(), { width: 4, height: 3 })).toThrow(/duplicate/i);
  });
});
