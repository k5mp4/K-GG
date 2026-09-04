import { Zip, ZipPassThrough, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { parsePngMetadata, validateFrameZip } from './artifacts';

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
