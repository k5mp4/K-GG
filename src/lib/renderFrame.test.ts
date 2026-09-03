import { describe, expect, it, vi } from 'vitest';
import type { WebGLContext } from './webgl';
import { render } from './webgl';
import type { RenderFrameRequest } from '../types/rendering';
import { renderFrame } from './renderFrame';

vi.mock('./webgl', () => ({ render: vi.fn() }));

describe('renderFrame compatibility adapter', () => {
  it('preserves the legacy renderer argument order and optional defaults', () => {
    const request = {
      gradient: { gradientType: 'linear' },
      noiseDistortion: { type: 'simplex' },
      diffuse: { mode: 'none' },
      slitScan: { enabled: true },
      stretch: { enabled: true },
      normalMap: { enabled: true },
      radon: { enabled: true },
      iridescence: { enabled: true },
      manualDistort: { enabled: true },
      postprocess: { effectMode: 'none' },
      matcap: { enabled: true },
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
      request.radon,
      request.iridescence,
      request.manualDistort,
      request.postprocess,
      request.matcap,
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
    );
  });
});
