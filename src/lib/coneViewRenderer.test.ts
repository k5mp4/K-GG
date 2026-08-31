import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TestCanvas = {
  width: number;
  height: number;
  style: Record<string, string>;
  setAttribute: () => void;
  getContext: (contextId: string, attributes?: unknown) => TestWebGLContext | null;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  dispatchEvent: (event: { type: string }) => void;
};

type TestWebGLContext = {
  lost: boolean;
  getExtension: (name: string) => null;
  isContextLost: () => boolean;
};

const fakeThree = vi.hoisted(() => {
  let nextGeometryId = 1;

  class FakeVector2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    set(x: number, y: number): this {
      this.x = x;
      this.y = y;
      return this;
    }
  }

  class FakeVector3 {
    x: number;
    y: number;
    z: number;

    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    set(x: number, y: number, z: number): this {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }

  class FakeScene {
    add(): void {}
  }

  class FakePerspectiveCamera {
    fov = 0;
    aspect = 1;
    near = 0;
    far = 0;
    position = new FakeVector3();

    lookAt(): void {}
    updateProjectionMatrix(): void {}
  }

  class FakeAttribute {
    count = 0;
    needsUpdate = false;

    getZ(): number {
      return 0;
    }

    getX(): number {
      return 0;
    }

    setX(): void {}
    setY(): void {}
  }

  class FakeBufferGeometry {
    readonly id = nextGeometryId++;
    readonly attributes = { position: new FakeAttribute() };
    readonly index = null;
    disposeCount = 0;

    rotateX(): void {}
    getAttribute(): FakeAttribute {
      return this.attributes.position;
    }
    computeBoundingSphere(): void {}
    dispose(): void {
      this.disposeCount += 1;
    }
  }

  class FakeConeGeometry extends FakeBufferGeometry {
    static instances: FakeConeGeometry[] = [];

    constructor(..._args: unknown[]) {
      super();
      FakeConeGeometry.instances.push(this);
    }
  }

  class FakeMaterial {
    map: FakeCanvasTexture | null = null;
    needsUpdate = false;
    onBeforeCompile: ((shader: { uniforms: Record<string, unknown>; fragmentShader: string }) => void) | null = null;
    disposeCount = 0;

    dispose(): void {
      this.disposeCount += 1;
    }
  }

  class FakeCanvasTexture {
    static instances: FakeCanvasTexture[] = [];
    readonly image: { width: number; height: number };
    needsUpdate = false;
    colorSpace = '';
    minFilter = 0;
    magFilter = 0;
    wrapS = 0;
    wrapT = 0;
    generateMipmaps = true;
    disposeCount = 0;

    constructor(image: { width: number; height: number }) {
      this.image = image;
      FakeCanvasTexture.instances.push(this);
    }

    dispose(): void {
      this.disposeCount += 1;
    }
  }

  class FakeMesh {
    position = new FakeVector3();
    geometry: FakeBufferGeometry;
    material: FakeMaterial;

    constructor(geometry: FakeBufferGeometry, material: FakeMaterial) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class FakeWebGLRenderer {
    static instances: FakeWebGLRenderer[] = [];
    readonly debug = { checkShaderErrors: true };
    outputColorSpace = '';
    toneMapping = 0;
    readonly context: {
      lost: boolean;
      getExtension: (name: string) => null;
      isContextLost: () => boolean;
    };
    disposeCount = 0;

    readonly options: { canvas: TestCanvas; context?: TestWebGLContext };

    constructor(options: { canvas: TestCanvas; context?: TestWebGLContext }) {
      this.options = options;
      this.context = options.context ?? options.canvas.getContext('webgl2') ?? {
        lost: false,
        getExtension: () => null,
        isContextLost: () => false,
      };
      FakeWebGLRenderer.instances.push(this);
    }

    setClearColor(): void {}
    setSize(): void {}
    getContext(): typeof this.context {
      return this.context;
    }
    render(): void {}
    dispose(): void {
      this.disposeCount += 1;
    }
  }

  return {
    Vector2: FakeVector2,
    Vector3: FakeVector3,
    Scene: FakeScene,
    PerspectiveCamera: FakePerspectiveCamera,
    BufferGeometry: FakeBufferGeometry,
    ConeGeometry: FakeConeGeometry,
    MeshBasicMaterial: FakeMaterial,
    CanvasTexture: FakeCanvasTexture,
    Mesh: FakeMesh,
    WebGLRenderer: FakeWebGLRenderer,
    BackSide: 1,
    NoToneMapping: 0,
    SRGBColorSpace: 'srgb',
    LinearFilter: 1,
    ClampToEdgeWrapping: 2,
    FakeCanvasTexture,
    FakeConeGeometry,
    FakeWebGLRenderer,
  };
});

vi.mock('three', () => fakeThree);

import { ConeViewRenderer } from './coneViewRenderer';
import { resetWebGL2AvailabilityForTests } from './webglCapability';
import type { ConeViewConfig } from '../types/coneView';

type FakeCanvas = InstanceType<typeof fakeThree.FakeWebGLRenderer>['options']['canvas'];

function createCanvas(width: number, height: number): FakeCanvas {
  const listeners = new Map<string, Set<() => void>>();
  const context: TestWebGLContext = {
    lost: false,
    getExtension: () => null,
    isContextLost: () => context.lost,
  };
  return {
    width,
    height,
    style: {},
    setAttribute: () => undefined,
    getContext: () => context,
    addEventListener: (type, listener) => {
      const entries = listeners.get(type) ?? new Set<() => void>();
      entries.add(listener);
      listeners.set(type, entries);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event) => {
      for (const listener of listeners.get(event.type) ?? []) listener();
    },
  };
}

const config: ConeViewConfig = {
  depth: 6,
  rotation: 0,
  textureRepeat: 1,
  flowCycles: 1,
  apexX: 0,
  apexY: 0,
  seamBlend: 0.25,
  seamMode: 'weld',
  mappingMode: 'flow',
};

describe('ConeViewRenderer resource lifecycle', () => {
  beforeEach(() => {
    fakeThree.FakeCanvasTexture.instances.length = 0;
    fakeThree.FakeConeGeometry.instances.length = 0;
    fakeThree.FakeWebGLRenderer.instances.length = 0;
    resetWebGL2AvailabilityForTests();
    vi.stubGlobal('document', { createElement: () => createCanvas(512, 512) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recreates the source texture when the input canvas dimensions change', () => {
    const renderer = new ConeViewRenderer();
    const source = createCanvas(1920, 1080) as unknown as HTMLCanvasElement;

    renderer.renderMappedTexture(source, config, 0, 1920, 1080);
    const firstTexture = fakeThree.FakeCanvasTexture.instances[0];
    source.width = 3840;
    source.height = 2160;
    renderer.renderMappedTexture(source, config, 0, 3840, 2160);

    expect(fakeThree.FakeCanvasTexture.instances).toHaveLength(2);
    expect(firstTexture?.disposeCount).toBe(1);
    renderer.dispose();
  });

  it('passes an explicitly acquired WebGL2 context to Three.js', () => {
    new ConeViewRenderer();

    expect(fakeThree.FakeWebGLRenderer.instances[0]?.options.context).toBeDefined();
  });

  it('does not invoke Three.js when WebGL2 cannot be acquired', () => {
    vi.stubGlobal('document', {
      createElement: () => ({
        ...createCanvas(512, 512),
        getContext: () => null,
      }),
    });

    expect(() => new ConeViewRenderer()).toThrow('WebGL2 is required but was not available');
    expect(fakeThree.FakeWebGLRenderer.instances).toHaveLength(0);
  });

  it('makes disposal idempotent', () => {
    const renderer = new ConeViewRenderer();
    const source = createCanvas(1920, 1080) as unknown as HTMLCanvasElement;
    renderer.renderMappedTexture(source, config, 0, 1920, 1080);
    const currentGeometry = fakeThree.FakeConeGeometry.instances.at(-1);

    renderer.dispose();
    renderer.dispose();

    expect(currentGeometry?.disposeCount).toBe(1);
    expect(fakeThree.FakeWebGLRenderer.instances[0]?.disposeCount).toBe(1);
  });

  it('does not render while the WebGL context is lost and can recover after restore', () => {
    const renderer = new ConeViewRenderer();
    const source = createCanvas(1920, 1080) as unknown as HTMLCanvasElement;
    const output = renderer.getCanvas() as unknown as FakeCanvas;
    const webglRenderer = fakeThree.FakeWebGLRenderer.instances[0];
    if (!webglRenderer) throw new Error('Fake WebGL renderer was not created');
    webglRenderer.context.lost = true;
    output.dispatchEvent({ type: 'webglcontextlost' });

    expect(() => renderer.renderMappedTexture(source, config, 0, 1920, 1080)).toThrow('WebGL context lost');

    webglRenderer.context.lost = false;
    output.dispatchEvent({ type: 'webglcontextrestored' });
    expect(() => renderer.renderMappedTexture(source, config, 0, 1920, 1080)).not.toThrow();
    renderer.dispose();
  });
});
