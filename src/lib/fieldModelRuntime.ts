import type { MeshSdf } from './meshSdf';

/**
 * The model loaded for the Geometry Field. Like the other loaded media it is
 * runtime-only: presets keep the `model` geometry choice but not the file,
 * and the shader draws spheres until a model is loaded again.
 */
export type FieldModel = MeshSdf & {
  name: string;
  /** Increases on every change so each WebGL context re-uploads once. */
  version: number;
};

let current: FieldModel | null = null;
let version = 0;
const listeners = new Set<() => void>();

export const FIELD_MODEL_CHANGED_EVENT = 'kgg:field-model-changed';

export function getFieldModel(): FieldModel | null {
  return current;
}

export function setFieldModel(sdf: MeshSdf | null, name = ''): void {
  version += 1;
  current = sdf ? { ...sdf, name, version } : null;
  for (const listener of listeners) listener();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FIELD_MODEL_CHANGED_EVENT));
}

/** For useSyncExternalStore. */
export function subscribeFieldModel(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
