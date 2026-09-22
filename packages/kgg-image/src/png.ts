export const KGG_IMAGE_LIMITS = {
  maxPngBytes: 20 * 1024 * 1024,
  maxDimension: 4096,
  maxPixels: 16_777_216,
} as const;

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_COLOR_TYPE_DEPTHS: Record<number, readonly number[]> = {
  0: [1, 2, 4, 8, 16],
  2: [8, 16],
  3: [1, 2, 4, 8],
  4: [8, 16],
  6: [8, 16],
};
const CRC_TABLE = new Uint32Array(256);
for (let value = 0; value < CRC_TABLE.length; value += 1) {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  CRC_TABLE[value] = crc >>> 0;
}

export type PngDimensions = { width: number; height: number };

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[index]!) & 0xff]!;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readChunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset]!, bytes[offset + 1]!, bytes[offset + 2]!, bytes[offset + 3]!);
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

export function inspectPng(bytes: Uint8Array): PngDimensions {
  if (bytes.byteLength > KGG_IMAGE_LIMITS.maxPngBytes) {
    throw new Error(`PNG exceeds the ${KGG_IMAGE_LIMITS.maxPngBytes / (1024 * 1024)} MiB limit.`);
  }
  if (bytes.byteLength < 45 || !hasPngSignature(bytes)) {
    throw new Error('File does not contain a valid PNG image.');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let hasIdat = false;
  let endedIdat = false;
  let hasIend = false;

  while (offset < bytes.byteLength) {
    if (bytes.byteLength - offset < 12) throw new Error('PNG contains a truncated chunk.');

    const length = readUint32(bytes, offset);
    const type = readChunkType(bytes, offset + 4);
    const dataStart = offset + 8;
    const crcOffset = dataStart + length;
    const nextOffset = crcOffset + 4;
    if (!Number.isSafeInteger(nextOffset) || nextOffset > bytes.byteLength) {
      throw new Error('PNG contains a truncated chunk.');
    }
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error('PNG contains an invalid chunk type.');

    const expectedCrc = readUint32(bytes, crcOffset);
    const actualCrc = crc32(bytes, offset + 4, crcOffset);
    if (actualCrc !== expectedCrc) throw new Error(`PNG ${type} chunk failed its CRC check.`);

    if (offset === 8) {
      if (type !== 'IHDR' || length !== 13) throw new Error('PNG must begin with a 13-byte IHDR chunk.');
      width = readUint32(bytes, dataStart);
      height = readUint32(bytes, dataStart + 4);
      const bitDepth = bytes[dataStart + 8]!;
      const colorType = bytes[dataStart + 9]!;
      const compressionMethod = bytes[dataStart + 10]!;
      const filterMethod = bytes[dataStart + 11]!;
      const interlaceMethod = bytes[dataStart + 12]!;
      if (!PNG_COLOR_TYPE_DEPTHS[colorType]?.includes(bitDepth)) throw new Error('PNG uses an unsupported color type or bit depth.');
      if (compressionMethod !== 0 || filterMethod !== 0 || (interlaceMethod !== 0 && interlaceMethod !== 1)) {
        throw new Error('PNG uses an unsupported encoding method.');
      }
      if (!width || !height) throw new Error('PNG dimensions must be greater than zero.');
      if (width > KGG_IMAGE_LIMITS.maxDimension || height > KGG_IMAGE_LIMITS.maxDimension) {
        throw new Error(`PNG dimensions exceed ${KGG_IMAGE_LIMITS.maxDimension} pixels on one side.`);
      }
      if (width * height > KGG_IMAGE_LIMITS.maxPixels) {
        throw new Error(`PNG exceeds ${KGG_IMAGE_LIMITS.maxPixels} pixels in total.`);
      }
    } else if (type === 'IHDR') {
      throw new Error('PNG contains more than one IHDR chunk.');
    }

    if (type === 'IDAT') {
      if (endedIdat) throw new Error('PNG IDAT chunks must be consecutive.');
      hasIdat = true;
    } else if (hasIdat && type !== 'IEND') {
      endedIdat = true;
    }

    if (type === 'IEND') {
      if (length !== 0 || !hasIdat || nextOffset !== bytes.byteLength) {
        throw new Error('PNG has an invalid IEND chunk or trailing data.');
      }
      hasIend = true;
      break;
    }

    if (type[0] === type[0]?.toUpperCase() && !['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type)) {
      throw new Error(`PNG contains an unsupported critical ${type} chunk.`);
    }

    offset = nextOffset;
  }

  if (!hasIend) throw new Error('PNG is missing its IEND chunk.');
  return { width, height };
}
