import type { RenderFrameRequest } from '../types/rendering';
import { render, type WebGLContext } from './webgl';

/**
 * Adapter from the named frame contract to the legacy renderer entry point.
 * Keeping this translation in one place makes the positional API a
 * compatibility detail while preserving its argument order exactly.
 */
export function renderFrame(ctx: WebGLContext, request: RenderFrameRequest): void {
  render(
    ctx,
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
    request.time ?? 0,
    request.animDirection ?? 0,
    request.slitAnimTimeOverride,
    request.stretchScanOverride,
    request.tile,
    request.sourceImageCanvas,
    request.imageGradientSource,
    request.imageGradient,
    request.noiseLoopPeriod ?? 1,
    request.animationSpeed ?? 1,
    request.imageMaskSource,
    request.imageMaskEnabled ?? false,
    request.effectPipeline,
    request.clothGradient,
    request.clothTime ?? 0,
    request.clothLoopPeriod ?? 1,
    request.seamless,
    request.flowGradient,
    request.flowNormalizedTime ?? 0,
    request.flowLoopEnabled ?? true,
    request.flowSessionId ?? 'preview',
  );
}
