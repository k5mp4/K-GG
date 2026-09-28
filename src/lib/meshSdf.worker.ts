import { buildMeshSdf } from './meshSdf';

self.onmessage = (event: MessageEvent<Float32Array>) => {
  try {
    const sdf = buildMeshSdf(event.data);
    self.postMessage({ sdf }, { transfer: [sdf.data.buffer] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Model conversion failed' });
  }
};
