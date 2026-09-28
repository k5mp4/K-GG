import { Vector3, type BufferGeometry, type Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { normalizeTriangles, type MeshSdf } from './meshSdf';
import { setFieldModel } from './fieldModelRuntime';

export const MAX_FIELD_MODEL_BYTES = 64 * 1024 * 1024;
export const MAX_FIELD_MODEL_TRIANGLES = 1_000_000;

/** Every mesh triangle of a GLB in scene space, 9 floats per triangle. */
export async function extractGlbTriangles(buffer: ArrayBuffer): Promise<Float32Array> {
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  gltf.scene.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  gltf.scene.traverse((node) => {
    if ((node as Mesh).isMesh) meshes.push(node as Mesh);
  });
  let triangleCount = 0;
  for (const mesh of meshes) {
    const geometry = mesh.geometry as BufferGeometry;
    const position = geometry.getAttribute('position');
    if (!position) continue;
    triangleCount += Math.floor((geometry.getIndex()?.count ?? position.count) / 3);
  }
  if (triangleCount > MAX_FIELD_MODEL_TRIANGLES) {
    throw new Error(`The model has ${triangleCount} triangles; the limit is ${MAX_FIELD_MODEL_TRIANGLES}.`);
  }
  const positions = new Float32Array(triangleCount * 9);
  const point = new Vector3();
  let offset = 0;
  for (const mesh of meshes) {
    const geometry = mesh.geometry as BufferGeometry;
    const position = geometry.getAttribute('position');
    if (!position) continue;
    const index = geometry.getIndex();
    const count = Math.floor((index?.count ?? position.count) / 3) * 3;
    for (let i = 0; i < count; i++) {
      point.fromBufferAttribute(position, index ? index.getX(i) : i).applyMatrix4(mesh.matrixWorld);
      positions[offset++] = point.x;
      positions[offset++] = point.y;
      positions[offset++] = point.z;
    }
  }
  return positions;
}

function buildInWorker(positions: Float32Array, signal?: AbortSignal): Promise<MeshSdf> {
  if (signal?.aborted) return Promise.reject(new DOMException('Model load cancelled', 'AbortError'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./meshSdf.worker.ts', import.meta.url), { type: 'module' });
    const dispose = () => {
      signal?.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => {
      dispose();
      reject(new DOMException('Model load cancelled', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ sdf?: MeshSdf; error?: string }>) => {
      dispose();
      if (event.data.sdf) resolve(event.data.sdf);
      else reject(new Error(event.data.error ?? 'Model conversion failed'));
    };
    worker.onerror = () => {
      dispose();
      reject(new Error('Model conversion worker failed'));
    };
    worker.postMessage(positions, [positions.buffer]);
  });
}

/**
 * Loads a .glb file as the Geometry Field model: every mesh triangle is
 * fitted into the unit sphere and converted to distance grids in a worker.
 * The model's own materials and textures are not used; the canvas textures it.
 */
export async function loadFieldModelFile(file: File, signal?: AbortSignal): Promise<MeshSdf> {
  if (file.size > MAX_FIELD_MODEL_BYTES) throw new Error('The file is larger than 64 MB.');
  const positions = await extractGlbTriangles(await file.arrayBuffer());
  if (positions.length === 0) throw new Error('The file contains no mesh triangles.');
  const sdf = await buildInWorker(normalizeTriangles(positions), signal);
  setFieldModel(sdf, file.name);
  return sdf;
}
