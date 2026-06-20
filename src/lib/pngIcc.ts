/**
 * PNG バイト列に sRGB IEC61966-2.1 ICC プロファイルを埋め込むユーティリティ。
 *
 * iCCP チャンクに sRGB IEC61966-2.1 の ICC v2 プロファイルバイナリを
 * zlib 圧縮して挿入する。Photoshop等の CMS 対応アプリで
 * 「埋め込みプロファイル: sRGB IEC61966-2.1」として認識される。
 *
 * 参照:
 *   ICC.1:2001-04 (ICC profile v2)
 *   PNG Specification 1.2 §11.3.3.2 (iCCP chunk)
 */

import { zlibSync } from 'fflate';

// ---------------------------------------------------------------------------
// CRC-32（PNG チャンク検証用）
// ---------------------------------------------------------------------------

const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ---------------------------------------------------------------------------
// PNG チャンク構築
// ---------------------------------------------------------------------------

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  if (data.length > 0) out.set(data, 8);
  const crcInput = new Uint8Array(4 + data.length);
  for (let i = 0; i < 4; i++) crcInput[i] = type.charCodeAt(i);
  if (data.length > 0) crcInput.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return out;
}

// ---------------------------------------------------------------------------
// PNG シグネチャ
// ---------------------------------------------------------------------------

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// チャンクスキャン
// ---------------------------------------------------------------------------

function scanChunkTypes(bytes: Uint8Array): string[] {
  const types: string[] = [];
  const dec = new TextDecoder('ascii');
  let pos = 8;
  while (pos + 12 <= bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + pos, 4).getUint32(0, false);
    const type = dec.decode(bytes.subarray(pos + 4, pos + 8));
    types.push(type);
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  return types;
}

// ---------------------------------------------------------------------------
// ICC v2 プロファイル構築（sRGB IEC61966-2.1）
// ---------------------------------------------------------------------------

/** s15Fixed16 (ICC XYZ値) を4バイトに書き込む */
function writeS15Fixed16(view: DataView, offset: number, val: number): void {
  // s15Fixed16 = 符号付き整数部15bit + 小数部16bit, big-endian
  const raw = Math.round(val * 65536);
  view.setInt32(offset, raw, false);
}

/** ICC 'curv' TRC タグ: sRGB の転送関数（256エントリ uint16） */
function buildTrcTag(): Uint8Array {
  // 'curv' タグ: sig(4) + reserved(4) + count(4) + entries(count×2)
  const count = 256;
  const buf = new Uint8Array(12 + count * 2);
  const view = new DataView(buf.buffer);
  buf[0] = 0x63; buf[1] = 0x75; buf[2] = 0x72; buf[3] = 0x76; // 'curv'
  view.setUint32(8, count, false); // count
  for (let i = 0; i < count; i++) {
    const x = i / 255;
    // sRGB 転送関数 (IEC 61966-2-1)
    let linear: number;
    if (x <= 0.04045) {
      linear = x / 12.92;
    } else {
      linear = Math.pow((x + 0.055) / 1.055, 2.4);
    }
    const u16 = Math.round(Math.min(1, Math.max(0, linear)) * 65535);
    view.setUint16(12 + i * 2, u16, false);
  }
  return buf;
}

/** ICC 'XYZ ' タグ: s15Fixed16 XYZ 値 */
function buildXyzTag(X: number, Y: number, Z: number): Uint8Array {
  // 'XYZ ' タグ: sig(4) + reserved(4) + XYZ(12) = 20 bytes
  const buf = new Uint8Array(20);
  const view = new DataView(buf.buffer);
  buf[0] = 0x58; buf[1] = 0x59; buf[2] = 0x5A; buf[3] = 0x20; // 'XYZ '
  writeS15Fixed16(view, 8,  X);
  writeS15Fixed16(view, 12, Y);
  writeS15Fixed16(view, 16, Z);
  return buf;
}

/** ICC 'desc' タグ (v2 multiLocalizedUnicodeType は不要、textDescriptionType を使う) */
function buildDescTag(ascii: string): Uint8Array {
  // 'desc' = textDescriptionType: sig(4)+reserved(4)+asciiLen(4)+ascii(n)+0+unicode fields
  const asciiBytes = new TextEncoder().encode(ascii);
  const asciiLen = asciiBytes.length + 1; // null terminator 含む
  // unicode count(4) + scriptCode(2) + macCount(1) + macData(67) = 74 bytes
  const totalSize = 8 + 4 + asciiLen + 4 + 2 + 1 + 67;
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);
  buf[0] = 0x64; buf[1] = 0x65; buf[2] = 0x73; buf[3] = 0x63; // 'desc'
  view.setUint32(8, asciiLen, false);
  buf.set(asciiBytes, 12);
  // unicode count = 0, rest zeros
  return buf;
}

/**
 * sRGB IEC61966-2.1 の ICC v2 プロファイルバイナリを構築する。
 *
 * タグ構成:
 *   desc  - プロファイル説明 "sRGB IEC61966-2.1"
 *   wtpt  - メディア白色点 (D50)
 *   rXYZ  - 赤原色 XYZ (D50 適応済み)
 *   gXYZ  - 緑原色 XYZ (D50 適応済み)
 *   bXYZ  - 青原色 XYZ (D50 適応済み)
 *   rTRC  - 赤転送関数 (sRGB gamma)
 *   gTRC  - 緑転送関数 (rTRC と共有)
 *   bTRC  - 青転送関数 (rTRC と共有)
 */
function buildSrgbIccProfile(): Uint8Array {
  const PROFILE_DESC = 'sRGB IEC61966-2.1';

  // タグデータを構築
  const descData  = buildDescTag(PROFILE_DESC);
  const wtptData  = buildXyzTag(0.9642, 1.0000, 0.8249);  // D50
  const rXyzData  = buildXyzTag(0.4361, 0.2225, 0.0139);
  const gXyzData  = buildXyzTag(0.3851, 0.7170, 0.0971);
  const bXyzData  = buildXyzTag(0.1431, 0.0606, 0.7141);
  const trcData   = buildTrcTag(); // R/G/B 共有

  // タグ一覧 (name, data, shared?)
  const tags: Array<{ sig: string; data: Uint8Array }> = [
    { sig: 'desc', data: descData  },
    { sig: 'wtpt', data: wtptData  },
    { sig: 'rXYZ', data: rXyzData  },
    { sig: 'gXYZ', data: gXyzData  },
    { sig: 'bXYZ', data: bXyzData  },
    { sig: 'rTRC', data: trcData   },
    { sig: 'gTRC', data: trcData   }, // rTRC と同じデータを共有
    { sig: 'bTRC', data: trcData   }, // rTRC と同じデータを共有
  ];

  // ヘッダー(128) + タグカウント(4) + タグテーブル(n×12) + タグデータ
  const tagCount = tags.length;
  const headerSize = 128;
  const tagTableSize = 4 + tagCount * 12;
  const dataOffset = headerSize + tagTableSize;

  // タグデータのオフセット計算（4バイトアライン）
  // rTRC/gTRC/bTRC は同じデータを共有させる
  type TagEntry = { sig: string; data: Uint8Array; offset: number; size: number };
  const entries: TagEntry[] = [];
  const dataBlocks: Array<{ data: Uint8Array; offset: number }> = [];
  let currentOffset = dataOffset;

  // TRC の重複排除のため既出データを追跡
  const seen = new Map<Uint8Array, number>();

  for (const tag of tags) {
    let blockOffset: number;
    if (seen.has(tag.data)) {
      blockOffset = seen.get(tag.data)!;
    } else {
      blockOffset = currentOffset;
      seen.set(tag.data, blockOffset);
      dataBlocks.push({ data: tag.data, offset: blockOffset });
      // 4バイトアライン
      currentOffset += (tag.data.length + 3) & ~3;
    }
    entries.push({ sig: tag.sig, data: tag.data, offset: blockOffset, size: tag.data.length });
  }

  const totalSize = currentOffset;
  const profile = new Uint8Array(totalSize);
  const view = new DataView(profile.buffer);

  // --- ヘッダー (128 bytes) ---
  view.setUint32(0,   totalSize, false);          // profile size
  // preferred CMM type: 0 (none)
  view.setUint32(8,   0x02100000, false);          // version 2.1.0
  // profile class: 'mntr' = monitor
  profile[12] = 0x6D; profile[13] = 0x6E; profile[14] = 0x74; profile[15] = 0x72;
  // color space: 'RGB '
  profile[16] = 0x52; profile[17] = 0x47; profile[18] = 0x42; profile[19] = 0x20;
  // PCS: 'XYZ '
  profile[20] = 0x58; profile[21] = 0x59; profile[22] = 0x5A; profile[23] = 0x20;
  // creation date/time: 1998-02-09 06:49:00 (sRGB IEC61966-2.1 standard)
  view.setUint16(24, 1998, false); // year
  view.setUint16(26,    2, false); // month
  view.setUint16(28,    9, false); // day
  view.setUint16(30,    6, false); // hour
  view.setUint16(32,   49, false); // minute
  view.setUint16(34,    0, false); // second
  // signature: 'acsp'
  profile[36] = 0x61; profile[37] = 0x63; profile[38] = 0x73; profile[39] = 0x70;
  // primary platform: 'MSFT'
  profile[40] = 0x4D; profile[41] = 0x53; profile[42] = 0x46; profile[43] = 0x54;
  // profile flags: 0
  // device manufacturer: 'IEC '
  profile[48] = 0x49; profile[49] = 0x45; profile[50] = 0x43; profile[51] = 0x20;
  // device model: 'sRGB'
  profile[52] = 0x73; profile[53] = 0x52; profile[54] = 0x47; profile[55] = 0x42;
  // rendering intent (offset 64): 0x00000000 = Perceptual
  // PCS illuminant D50 (offset 68): XYZ in s15Fixed16
  writeS15Fixed16(view, 68, 0.9642);  // X
  writeS15Fixed16(view, 72, 1.0000);  // Y
  writeS15Fixed16(view, 76, 0.8249);  // Z
  // profile creator: 'sRGB'
  profile[80] = 0x73; profile[81] = 0x52; profile[82] = 0x47; profile[83] = 0x42;

  // --- タグカウント ---
  view.setUint32(128, tagCount, false);

  // --- タグテーブル ---
  let tablePos = 132;
  for (const entry of entries) {
    for (let i = 0; i < 4; i++) profile[tablePos + i] = entry.sig.charCodeAt(i);
    view.setUint32(tablePos + 4, entry.offset, false);
    view.setUint32(tablePos + 8, entry.size,   false);
    tablePos += 12;
  }

  // --- タグデータ ---
  for (const block of dataBlocks) {
    profile.set(block.data, block.offset);
  }

  return profile;
}

// ---------------------------------------------------------------------------
// iCCP チャンク構築
// ---------------------------------------------------------------------------

/** sRGB IEC61966-2.1 の iCCP チャンクを構築する（lazy初期化） */
let cachedIccpChunk: Uint8Array | null = null;

function getIccpChunk(): Uint8Array {
  if (cachedIccpChunk) return cachedIccpChunk;

  const profileBytes = buildSrgbIccProfile();
  const compressed = zlibSync(profileBytes, { level: 9 });

  // iCCP chunk data = profile name (null-terminated) + compression method (1 byte) + compressed data
  const profileName = new TextEncoder().encode('sRGB IEC61966-2.1');
  const chunkData = new Uint8Array(profileName.length + 1 + 1 + compressed.length);
  chunkData.set(profileName, 0);
  chunkData[profileName.length] = 0x00;     // null terminator
  chunkData[profileName.length + 1] = 0x00; // compression method: zlib
  chunkData.set(compressed, profileName.length + 2);

  cachedIccpChunk = buildChunk('iCCP', chunkData);
  return cachedIccpChunk;
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * PNG バイト列の IHDR チャンク直後に iCCP チャンクを挿入する。
 *
 * iCCP チャンクには sRGB IEC61966-2.1 の ICC v2 プロファイルバイナリを
 * zlib 圧縮して格納する。Photoshop等が「埋め込みプロファイル」として認識する。
 *
 * すでに sRGB / iCCP チャンクが存在する場合は変更せずにそのまま返す。
 * PNG シグネチャが不正な場合も元のバイト列をそのまま返す。
 */
export function pngInjectSrgb(pngBytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (!isPng(pngBytes)) return new Uint8Array(pngBytes);

  const existing = scanChunkTypes(pngBytes);
  if (existing.includes('sRGB') || existing.includes('iCCP')) return new Uint8Array(pngBytes);

  const iccpChunk = getIccpChunk();

  // 挿入位置: PNG signature(8) + IHDR chunk(4+4+13+4=25) = 33 バイト目
  const insertAt = 33;
  const result = new Uint8Array(pngBytes.length + iccpChunk.length);
  result.set(pngBytes.subarray(0, insertAt));
  result.set(iccpChunk, insertAt);
  result.set(pngBytes.subarray(insertAt), insertAt + iccpChunk.length);

  return result;
}
