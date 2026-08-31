import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createWebGL2Context,
  getWebGL2Availability,
  isWebGL2UnavailableError,
  resetWebGL2AvailabilityForTests,
  WebGL2UnavailableError,
} from './webglCapability';

type FakeContext = {
  isContextLost: () => boolean;
};

function createFakeContext(): FakeContext {
  return { isContextLost: () => false };
}

function createFakeCanvas(context: FakeContext | null) {
  return {
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement & { getContext: ReturnType<typeof vi.fn> };
}

describe('WebGL2 capability gate', () => {
  beforeEach(() => {
    resetWebGL2AvailabilityForTests();
  });

  it('caches an unavailable capability and avoids repeated context requests', () => {
    const firstCanvas = createFakeCanvas(null);
    const secondCanvas = createFakeCanvas(createFakeContext());

    expect(createWebGL2Context(firstCanvas, {})).toBeNull();
    expect(getWebGL2Availability()).toBe('unavailable');
    expect(createWebGL2Context(secondCanvas, {})).toBeNull();
    expect(secondCanvas.getContext).not.toHaveBeenCalled();
  });

  it('keeps a known-good page capability when a secondary context is refused', () => {
    const primaryCanvas = createFakeCanvas(createFakeContext());
    const secondaryCanvas = createFakeCanvas(null);

    expect(createWebGL2Context(primaryCanvas, {})).not.toBeNull();
    expect(createWebGL2Context(secondaryCanvas, {})).toBeNull();
    expect(getWebGL2Availability()).toBe('available');
  });

  it('classifies native and Three.js context creation failures as expected capability errors', () => {
    expect(isWebGL2UnavailableError(new WebGL2UnavailableError())).toBe(true);
    expect(isWebGL2UnavailableError(new Error('THREE.WebGLRenderer: Error creating WebGL context.'))).toBe(true);
    expect(isWebGL2UnavailableError(new Error('shader compilation failed'))).toBe(false);
  });
});
