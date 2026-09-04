import { Unzip, UnzipInflate } from 'fflate';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_IHDR_LENGTH = 13;
const PNG_IHDR_CHUNK_SIZE = 4 + 4 + PNG_IHDR_LENGTH + 4;

export type PngMetadata = {
  width: number;
  height: number;
  byteLength: number;
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
