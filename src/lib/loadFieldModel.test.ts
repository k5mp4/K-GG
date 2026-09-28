import { describe, expect, it } from 'vitest';
import { extractGlbTriangles } from './loadFieldModel';

/** A minimal binary glTF: one indexed unit cube on a translated, scaled node. */
function cubeGlb(): ArrayBuffer {
  const positions = new Float32Array([
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
  ]);
  const indices = new Uint32Array([
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4,
    2, 3, 7, 2, 7, 6, 1, 2, 6, 1, 6, 5, 0, 4, 7, 0, 7, 3,
  ]);
  const json = JSON.stringify({
    asset: { version: '2.0' },
    buffers: [{ byteLength: positions.byteLength + indices.byteLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-1, -1, -1], max: [1, 1, 1] },
      { bufferView: 1, componentType: 5125, count: 36, type: 'SCALAR' },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    nodes: [{ mesh: 0, translation: [10, 0, 0], scale: [2, 2, 2] }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  });
  const jsonBytes = new TextEncoder().encode(json);
  const jsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const binLength = positions.byteLength + indices.byteLength;
  const total = 12 + 8 + jsonLength + 8 + binLength;
  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(jsonBytes, 20);
  const binStart = 20 + jsonLength;
  view.setUint32(binStart, binLength, true);
  view.setUint32(binStart + 4, 0x004e4942, true);
  bytes.set(new Uint8Array(positions.buffer), binStart + 8);
  bytes.set(new Uint8Array(indices.buffer), binStart + 8 + positions.byteLength);
  return buffer;
}

describe('GLB model loading', () => {
  it('extracts every indexed triangle with its node transform applied', async () => {
    const positions = await extractGlbTriangles(cubeGlb());
    expect(positions).toHaveLength(12 * 9);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
    }
    expect(minX).toBeCloseTo(8, 5);
    expect(maxX).toBeCloseTo(12, 5);
  });

  it('rejects data that is not a GLB', async () => {
    await expect(extractGlbTriangles(new TextEncoder().encode('not a model').buffer as ArrayBuffer)).rejects.toThrow();
  });
});
