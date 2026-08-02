import { describe, expect, it } from 'vitest';
import { choosePostprocessTarget, type WebGLContext } from './webgl';

describe('postprocess ping-pong targets', () => {
  it('keeps source and destination separate for the Glass pass', () => {
    const initialTexture = {} as WebGLTexture;
    const textureA = {} as WebGLTexture;
    const textureB = {} as WebGLTexture;
    const fboA = {} as WebGLFramebuffer;
    const fboB = {} as WebGLFramebuffer;
    const context = {
      postprocessTextureA: textureA,
      postprocessTextureB: textureB,
      postprocessFboA: fboA,
      postprocessFboB: fboB,
    } as WebGLContext;

    let source = initialTexture;
    const transitions = ['glass'].map(() => {
      const target = choosePostprocessTarget(context, source);
      expect(target.texture).not.toBe(source);
      const transition = [source, target.texture];
      source = target.texture;
      return transition;
    });

    expect(transitions).toEqual([[initialTexture, textureA]]);
  });

  it('starts every frame from the same target regardless of the previous frame', () => {
    const initialTexture = {} as WebGLTexture;
    const textureA = {} as WebGLTexture;
    const context = {
      postprocessTextureA: textureA,
      postprocessTextureB: {} as WebGLTexture,
      postprocessFboA: {} as WebGLFramebuffer,
      postprocessFboB: {} as WebGLFramebuffer,
    } as WebGLContext;

    expect(choosePostprocessTarget(context, initialTexture).texture).toBe(textureA);
    expect(choosePostprocessTarget(context, initialTexture).texture).toBe(textureA);
  });
});
