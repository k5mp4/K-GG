export const WEBGL_RESOURCE_KINDS = [
  'textures',
  'buffers',
  'renderbuffers',
  'framebuffers',
  'shaders',
  'programs',
  'vertexArrays',
  'queries',
  'samplers',
  'transformFeedbacks',
  'syncs',
] as const;

export type WebGLResourceKind = typeof WEBGL_RESOURCE_KINDS[number];
export type WebGLResourceCounters = Record<WebGLResourceKind, number>;

export type WebGLResourceLedgerSnapshot = {
  active: WebGLResourceCounters;
  created: WebGLResourceCounters;
  deleted: WebGLResourceCounters;
  activeTotal: number;
  peakActiveTotal: number;
  contextLost: boolean;
  disposed: boolean;
};

type ResourceMethod = {
  create?: string;
  delete?: string;
  kind: WebGLResourceKind;
};

const RESOURCE_METHODS: ResourceMethod[] = [
  { kind: 'textures', create: 'createTexture', delete: 'deleteTexture' },
  { kind: 'buffers', create: 'createBuffer', delete: 'deleteBuffer' },
  { kind: 'renderbuffers', create: 'createRenderbuffer', delete: 'deleteRenderbuffer' },
  { kind: 'framebuffers', create: 'createFramebuffer', delete: 'deleteFramebuffer' },
  { kind: 'shaders', create: 'createShader', delete: 'deleteShader' },
  { kind: 'programs', create: 'createProgram', delete: 'deleteProgram' },
  { kind: 'vertexArrays', create: 'createVertexArray', delete: 'deleteVertexArray' },
  { kind: 'queries', create: 'createQuery', delete: 'deleteQuery' },
  { kind: 'samplers', create: 'createSampler', delete: 'deleteSampler' },
  { kind: 'transformFeedbacks', create: 'createTransformFeedback', delete: 'deleteTransformFeedback' },
  { kind: 'syncs', create: 'fenceSync', delete: 'deleteSync' },
];

function emptyCounters(): WebGLResourceCounters {
  return Object.fromEntries(WEBGL_RESOURCE_KINDS.map(kind => [kind, 0])) as WebGLResourceCounters;
}

function isResourceObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export class WebGLResourceLedger {
  private readonly tracked = new Map<object, WebGLResourceKind>();
  private readonly created = emptyCounters();
  private readonly deleted = emptyCounters();
  private peakActiveTotal = 0;
  private contextLost = false;
  private disposed = false;

  track(kind: WebGLResourceKind, resource: unknown): void {
    if (this.disposed || !isResourceObject(resource) || this.tracked.has(resource)) return;
    this.tracked.set(resource, kind);
    this.created[kind] += 1;
    this.peakActiveTotal = Math.max(this.peakActiveTotal, this.tracked.size);
  }

  release(resource: unknown): void {
    if (!isResourceObject(resource)) return;
    const kind = this.tracked.get(resource);
    if (!kind) return;
    this.tracked.delete(resource);
    this.deleted[kind] += 1;
  }

  markContextLost(): void {
    this.contextLost = true;
  }

  markContextRestored(): void {
    this.contextLost = false;
  }

  dispose(): void {
    if (this.disposed) return;
    for (const kind of this.tracked.values()) this.deleted[kind] += 1;
    this.tracked.clear();
    this.disposed = true;
  }

  snapshot(): WebGLResourceLedgerSnapshot {
    const active = emptyCounters();
    for (const kind of this.tracked.values()) active[kind] += 1;
    return {
      active,
      created: { ...this.created },
      deleted: { ...this.deleted },
      activeTotal: this.tracked.size,
      peakActiveTotal: this.peakActiveTotal,
      contextLost: this.contextLost,
      disposed: this.disposed,
    };
  }

  restore(): void {
    // The installed wrappers are restored by installWebGLResourceLedger().
    // This method is intentionally overridden on the returned object so the
    // lifecycle owner can use one explicit dispose/restore handle.
  }
}

type OriginalMethod = {
  name: string;
  descriptor?: PropertyDescriptor;
};

/**
 * Installs a development-only wrapper around WebGL object factories/deleters.
 * The wrapper is attached to the existing context so the renderer and any
 * development profiler share one authoritative K-GG ledger.
 */
export function installWebGLResourceLedger(gl: WebGL2RenderingContext): WebGLResourceLedger & { restore: () => void } {
  const ledger = new WebGLResourceLedger();
  const target = gl as unknown as Record<string, unknown>;
  const originals: OriginalMethod[] = [];
  const restore = () => {
    for (const original of originals.reverse()) {
      if (original.descriptor) Object.defineProperty(target, original.name, original.descriptor);
      else delete target[original.name];
    }
    originals.length = 0;
  };

  try {
    for (const method of RESOURCE_METHODS) {
      if (method.create) {
        const original = target[method.create];
        if (typeof original === 'function') {
          const descriptor = Object.getOwnPropertyDescriptor(target, method.create);
          originals.push({ name: method.create, descriptor });
          const call = original as (...args: unknown[]) => unknown;
          Object.defineProperty(target, method.create, {
            configurable: true,
            enumerable: descriptor?.enumerable ?? false,
            writable: true,
            value: (...args: unknown[]) => {
              const resource = call.apply(gl, args);
              ledger.track(method.kind, resource);
              return resource;
            },
          });
        }
      }
      if (method.delete) {
        const original = target[method.delete];
        if (typeof original === 'function') {
          const descriptor = Object.getOwnPropertyDescriptor(target, method.delete);
          originals.push({ name: method.delete, descriptor });
          const call = original as (...args: unknown[]) => unknown;
          Object.defineProperty(target, method.delete, {
            configurable: true,
            enumerable: descriptor?.enumerable ?? false,
            writable: true,
            value: (...args: unknown[]) => {
              try {
                return call.apply(gl, args);
              } finally {
                ledger.release(args[0]);
              }
            },
          });
        }
      }
    }
  } catch (error) {
    restore();
    throw new Error(`Unable to install WebGL resource ledger: ${error instanceof Error ? error.message : String(error)}`);
  }

  const handle = ledger as WebGLResourceLedger & { restore: () => void };
  handle.restore = restore;
  return handle;
}
