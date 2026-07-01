import type { LatestState } from '../types/latestState';
import { render, type TileRenderOptions, type WebGLContext } from './webgl';
import { evaluateSceneAtTime } from './sceneEvaluation';

export function renderSceneAtTime(
  ctx: WebGLContext,
  state: LatestState,
  normalizedTime: number,
  options: {
    sdfReady: boolean;
    tile?: TileRenderOptions;
  },
): void {
  const scene = evaluateSceneAtTime(state, normalizedTime);
  const effectiveBezier = scene.bezierAxis.enabled && !options.sdfReady
    ? { ...scene.bezierAxis, enabled: false }
    : scene.bezierAxis;

  render(
    ctx,
    scene.gradient,
    scene.noiseDistortion,
    scene.diffuse,
    effectiveBezier,
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
    scene.noiseLoopPeriod,
    scene.animationSpeed,
    state.imageMaskSource ?? null,
    state.imageMaskEnabled ?? false,
  );
}
