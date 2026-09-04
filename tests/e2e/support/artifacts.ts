import { Unzip, UnzipInflate } from 'fflate';
import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_IHDR_LENGTH = 13;
const PNG_IHDR_CHUNK_SIZE = 4 + 4 + PNG_IHDR_LENGTH + 4;

export type PngMetadata = {
  width: number;
  height: number;
  byteLength: number;
};

export type RgbaImage = {
  width: number;
  height: number;
  rgba: Uint8Array;
};

export type FrameZipExpectation = {
  width: number;
  height: number;
  frameCount?: number;
};

export type FrameZipValidation = {
  frameCount: number;
  names: string[];
  frames: PngMetadata[];
};

function failure(message: string): never {
  throw new Error(`Invalid export artifact: ${message}`);
}

function readPngChunkType(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.subarray(12, 16));
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

type PngChunk = {
  type: string;
  data: Uint8Array;
};

function readPngChunks(bytes: Uint8Array): PngChunk[] {
  if (bytes.byteLength < PNG_SIGNATURE.length) failure('PNG is truncated before its signature');
  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) failure('PNG signature does not match');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: PngChunk[] = [];
  let offset = PNG_SIGNATURE.length;
  let sawIhdr = false;
  let sawIend = false;
  while (offset < bytes.byteLength) {
    if (bytes.byteLength - offset < 12) failure('PNG chunk header is truncated');
    const length = view.getUint32(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    if (dataEnd < dataStart || crcEnd > bytes.byteLength) failure(`${type} chunk is truncated`);
    const data = bytes.subarray(dataStart, dataEnd);
    const expectedCrc = view.getUint32(dataEnd);
    const crcInput = new Uint8Array(4 + data.byteLength);
    crcInput.set(typeBytes, 0);
    crcInput.set(data, 4);
    if (crc32(crcInput) !== expectedCrc) failure(`${type} chunk has an invalid CRC`);
    if (!sawIhdr && type !== 'IHDR') failure('PNG must begin with IHDR');
    if (type === 'IHDR') {
      if (sawIhdr || data.byteLength !== PNG_IHDR_LENGTH) failure('PNG contains an invalid IHDR');
      sawIhdr = true;
    }
    if (type === 'IEND') {
      if (data.byteLength !== 0) failure('PNG IEND must be empty');
      sawIend = true;
      chunks.push({ type, data });
      if (crcEnd !== bytes.byteLength) failure('PNG contains data after IEND');
      break;
    }
    chunks.push({ type, data });
    offset = crcEnd;
  }
  if (!sawIhdr || !sawIend) failure('PNG is missing IHDR or IEND');
  return chunks;
}

function paethPredictor(left: number, above: number, upperLeft: number): number {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

/** Decodes the 8-bit non-interlaced RGBA/RGB PNGs emitted by the export paths. */
export function decodePngRgba(bytes: Uint8Array): RgbaImage {
  const chunks = readPngChunks(bytes);
  const header = chunks.find(chunk => chunk.type === 'IHDR');
  if (!header) failure('PNG has no IHDR');
  const headerView = new DataView(header.data.buffer, header.data.byteOffset, header.data.byteLength);
  const width = headerView.getUint32(0);
  const height = headerView.getUint32(4);
  const bitDepth = header.data[8];
  const colorType = header.data[9];
  const compression = header.data[10];
  const filterMethod = header.data[11];
  const interlace = header.data[12];
  if (width < 1 || height < 1) failure('PNG dimensions must be positive');
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    failure('PNG must use 8-bit RGB or RGBA samples');
  }
  if (compression !== 0 || filterMethod !== 0 || interlace !== 0) {
    failure('PNG uses an unsupported compression, filter, or interlace mode');
  }

  const idat = chunks.filter(chunk => chunk.type === 'IDAT');
  if (idat.length === 0) failure('PNG contains no IDAT data');
  const compressed = new Uint8Array(idat.reduce((total, chunk) => total + chunk.data.byteLength, 0));
  let compressedOffset = 0;
  for (const chunk of idat) {
    compressed.set(chunk.data, compressedOffset);
    compressedOffset += chunk.data.byteLength;
  }
  let scanlines: Uint8Array;
  try {
    scanlines = Uint8Array.from(inflateSync(compressed));
  } catch (error) {
    failure(`PNG IDAT data cannot be inflated (${error instanceof Error ? error.message : String(error)})`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const rowBytes = width * channels;
  const expectedScanlineBytes = height * (rowBytes + 1);
  if (scanlines.byteLength !== expectedScanlineBytes) {
    failure(`PNG scanline length is ${scanlines.byteLength}; expected ${expectedScanlineBytes}`);
  }
  const rgba = new Uint8Array(width * height * 4);
  const previous = new Uint8Array(rowBytes);
  const current = new Uint8Array(rowBytes);
  for (let y = 0; y < height; y += 1) {
    const scanlineOffset = y * (rowBytes + 1);
    const filter = scanlines[scanlineOffset];
    if (filter > 4) failure(`PNG row ${y} uses unsupported filter ${filter}`);
    for (let index = 0; index < rowBytes; index += 1) {
      const raw = scanlines[scanlineOffset + 1 + index];
      const left = index >= channels ? current[index - channels] : 0;
      const above = previous[index];
      const upperLeft = index >= channels ? previous[index - channels] : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : paethPredictor(left, above, upperLeft);
      current[index] = (raw + predictor) & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      const source = x * channels;
      const destination = (y * width + x) * 4;
      rgba[destination] = current[source];
      rgba[destination + 1] = current[source + 1];
      rgba[destination + 2] = current[source + 2];
      rgba[destination + 3] = channels === 4 ? current[source + 3] : 255;
    }
    previous.set(current);
  }
  return { width, height, rgba };
}

/** Reads only the structural PNG fields needed by the Browser Merge Gate. */
export function parsePngMetadata(bytes: Uint8Array): PngMetadata {
  if (bytes.byteLength < PNG_SIGNATURE.length + PNG_IHDR_CHUNK_SIZE) {
    failure('PNG is truncated before the complete IHDR chunk');
  }

  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    failure('PNG signature does not match');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== PNG_IHDR_LENGTH) {
    failure('PNG IHDR has an unexpected length');
  }
  if (readPngChunkType(bytes) !== 'IHDR') {
    failure('PNG does not start with an IHDR chunk');
  }

  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width < 1 || height < 1) failure('PNG dimensions must be positive');

  return { width, height, byteLength: bytes.byteLength };
}

type ExtractedZipEntry = {
  name: string;
  bytes: Uint8Array;
};

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function extractZipEntries(bytes: Uint8Array): ExtractedZipEntry[] {
  const entries: ExtractedZipEntry[] = [];
  const names = new Set<string>();
  const unzipper = new Unzip();
  unzipper.register(UnzipInflate);
  unzipper.onfile = file => {
    if (names.has(file.name)) throw new Error(`duplicate ZIP entry: ${file.name}`);
    names.add(file.name);

    const chunks: Uint8Array[] = [];
    file.ondata = (error, data, final) => {
      if (error) throw error;
      if (data.byteLength > 0) chunks.push(data.slice());
      if (final) entries.push({ name: file.name, bytes: concatChunks(chunks) });
    };
    file.start();
  };

  try {
    unzipper.push(bytes, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failure(`ZIP cannot be read (${message})`);
  }
  return entries;
}

function expectedFrameNames(frameCount: number): string[] {
  return Array.from({ length: frameCount }, (_, index) => `frame_${String(index).padStart(4, '0')}.png`);
}

/** Validates the Browser PNG sequence contract without comparing pixels. */
export function validateFrameZip(
  bytes: Uint8Array,
  expectation: FrameZipExpectation,
): FrameZipValidation {
  const entries = extractZipEntries(bytes);
  if (entries.length === 0) failure('ZIP contains no entries');

  const frameCount = expectation.frameCount ?? entries.length;
  if (!Number.isInteger(frameCount) || frameCount < 1) failure('frame count must be a positive integer');
  if (entries.length !== frameCount) {
    failure(`expected ${frameCount} frames but found ${entries.length}`);
  }

  const expectedNames = expectedFrameNames(frameCount);
  const frames = entries.map((entry, index) => {
    if (entry.name !== expectedNames[index]) {
      failure(`frame names must be sequential; expected ${expectedNames[index]}, found ${entry.name}`);
    }
    const metadata = parsePngMetadata(entry.bytes);
    if (metadata.width !== expectation.width || metadata.height !== expectation.height) {
      failure(
        `${entry.name} has dimensions ${metadata.width}×${metadata.height}; `
        + `expected ${expectation.width}×${expectation.height}`,
      );
    }
    return metadata;
  });

  return {
    frameCount,
    names: entries.map(entry => entry.name),
    frames,
  };
}
