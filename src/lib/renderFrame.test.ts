import { describe, expect, it, vi } from 'vitest';
import type { WebGLContext } from './webgl';
import { render, renderShapesPass } from './webgl';
import type { RenderFrameRequest } from '../types/rendering';
import { renderFrame } from './renderFrame';

vi.mock('./webgl', () => ({ render: vi.fn(), renderShapesPass: vi.fn() }));

describe('renderFrame compatibility adapter', () => {
  it('preserves the legacy renderer argument order and optional defaults', () => {
    const request = {
      gradient: { gradientType: 'linear' },
      noiseDistortion: { type: 'simplex' },
      diffuse: { mode: 'none' },
      slitScan: { enabled: true },
      stretch: { enabled: true },
      normalMap: { enabled: true },
      manualDistort: { enabled: true },
      postprocess: { effectMode: 'none' },
      width: 101,
      height: 202,
      time: 0.3,
      animDirection: -1,
      slitAnimTimeOverride: 0.4,
      stretchScanOverride: 0.5,
      tile: { viewport: [11, 22], offset: [33, 44] },
      sourceImageCanvas: { id: 'source' },
      imageGradientSource: { id: 'image-gradient' },
      imageGradient: { enabled: true },
      noiseLoopPeriod: 7,
      animationSpeed: 8,
      imageMaskSource: { id: 'mask' },
      imageMaskEnabled: true,
      effectPipeline: { version: 'stack-v2' },
      clothGradient: { enabled: true },
      clothTime: 9,
      clothLoopPeriod: 10,
      seamless: { enabled: true },
      flowGradient: { enabled: true },
      flowNormalizedTime: 0.6,
      flowLoopEnabled: false,
      flowSessionId: 'test-session',
      coneView: { depth: 6, mappingMode: 'flow' },
      texture: { enabled: true },
      textureImageSource: { id: 'texture-image' },
      textureNormalizedTime: 0.7,
      distortChroma: { enabled: true },
      distortChromaImageSource: { id: 'lens-image' },
    } as unknown as RenderFrameRequest;

    renderFrame({} as WebGLContext, request);

    expect(vi.mocked(render)).toHaveBeenCalledWith(
      {},
      request.gradient,
      request.noiseDistortion,
      request.diffuse,
      request.slitScan,
      request.stretch,
      request.normalMap,
      request.manualDistort,
      request.postprocess,
      request.width,
      request.height,
      request.time,
      request.animDirection,
      request.slitAnimTimeOverride,
      request.stretchScanOverride,
      request.tile,
      request.sourceImageCanvas,
      request.imageGradientSource,
      request.imageGradient,
      request.noiseLoopPeriod,
      request.animationSpeed,
      request.imageMaskSource,
      request.imageMaskEnabled,
      request.effectPipeline,
      request.clothGradient,
      request.clothTime,
      request.clothLoopPeriod,
      request.seamless,
      request.flowGradient,
      request.flowNormalizedTime,
      request.flowLoopEnabled,
      request.flowSessionId,
      request.datamosh,
      request.coneView,
      request.texture,
      request.textureImageSource,
      request.textureNormalizedTime,
      request.distortChroma,
      request.distortChromaImageSource,
    );
    expect(vi.mocked(renderShapesPass)).not.toHaveBeenCalled();
  });

  it('runs the Shapes pass after the frame with the same size, tile, and loop phase', () => {
    const callOrder: string[] = [];
    vi.mocked(render).mockImplementationOnce(() => { callOrder.push('render'); });
    vi.mocked(renderShapesPass).mockImplementationOnce(() => { callOrder.push('shapes'); return true; });
    const mask = { key: 'builtin:star' };
    const request = {
      width: 640,
      height: 360,
      tile: { viewport: [64, 36], offset: [8, 16] },
      shapes: { enabled: true, source: 'star' },
      shapesMask: mask,
      shapesNormalizedTime: 0.25,
      shapesAnimated: true,
    } as unknown as RenderFrameRequest;

    renderFrame({} as WebGLContext, request);

    expect(callOrder).toEqual(['render', 'shapes']);
    expect(vi.mocked(renderShapesPass)).toHaveBeenCalledWith({}, {
      config: request.shapes,
      mask,
      normalizedTime: 0.25,
      animated: true,
      width: 640,
      height: 360,
      tile: request.tile,
    });
  });
});
