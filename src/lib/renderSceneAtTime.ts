import type { LatestState } from '../types/latestState';
import { render, type TileRenderOptions, type WebGLContext } from './webgl';
import { evaluateSceneAtTime } from './sceneEvaluation';

export function renderSceneAtTime(
  ctx: WebGLContext,
  state: LatestState,
  normalizedTime: number,
  options: { tile?: TileRenderOptions },
): void {
  const scene = evaluateSceneAtTime(state, normalizedTime);

  render(
    ctx,
    scene.gradient,
    scene.noiseDistortion,
    scene.diffuse,
    scene.slitScan,
    scene.stretch,
    state.normalMap,
    scene.radon,
    scene.iridescence,
    state.manualDistort,
    scene.postprocess,
    state.matcap,
    state.width,
    state.height,
    scene.renderTime,
    state.animation.direction,
    scene.slitAnimationTime,
    scene.stretchTime,
    options.tile,
    state.sourceImageCanvas ?? null,
    state.imageGradientSource ?? null,
    state.imageGradient,
    scene.noiseLoopPeriod,
    scene.animationSpeed,
    state.imageMaskSource ?? null,
    state.imageMaskEnabled ?? false,
  );
}
